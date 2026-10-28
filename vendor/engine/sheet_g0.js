// EKSPERYMENT – blacha z G0 (obrys + okna) -> THREE.ExtrudeGeometry. NIE wpięte do index.html/engine.js.
// Three.js jako peer: (a) globalny window.THREE (jak w apce), albo (b) przekazany: buildSheetG0(input,{THREE}).
// Bez THREE zwraca tylko deskryptor {outline,holes,depth} w mm (Y w górę).
// Reguła poprzeczki (≈ Python sheet_from_g0.py): okna nachodzące/bliżej niż BAR mm są przycinane
// półpłaszczyzną wzdłuż osi najmniejszego nakładania, BAR/2 od linii środkowej -> poprzeczka ~BAR mm.
// (Python używa shapely difference z buforem; tu przybliżenie półpłaszczyzną – OK dla okien prostokątnych/wypukłych.)
export const BAR_MM = 6;
const bbox = p => { let a=[1e18,1e18,-1e18,-1e18]; for (const [x,y] of p){a[0]=Math.min(a[0],x);a[1]=Math.min(a[1],y);a[2]=Math.max(a[2],x);a[3]=Math.max(a[3],y);} return a; };
export const area = p => { let s=0; for (let i=0;i<p.length;i++){const [x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length]; s+=x1*y2-x2*y1;} return s/2; };
// clip polygon to half-plane: keep points with sign*(coord[axis]-c) <= 0
function clip(p, axis, c, sign){ const out=[], f=q=>sign*(q[axis]-c);
  for (let i=0;i<p.length;i++){ const A=p[i],B=p[(i+1)%p.length],fa=f(A),fb=f(B);
    if (fa<=0) out.push(A);
    if ((fa<0&&fb>0)||(fa>0&&fb<0)){ const t=fa/(fa-fb); out.push([A[0]+t*(B[0]-A[0]),A[1]+t*(B[1]-A[1])]); } }
  return out; }
export function cutBars(holes, bar=BAR_MM){
  const H = holes.map(h=>h.map(q=>q.slice())), cuts=[];
  for (let i=0;i<H.length;i++) for (let j=i+1;j<H.length;j++){
    const a=bbox(H[i]), b=bbox(H[j]);
    const gx=Math.max(a[0],b[0])-Math.min(a[2],b[2]), gy=Math.max(a[1],b[1])-Math.min(a[3],b[3]); // gap (<0 = overlap)
    if (gx>=bar || gy>=bar) continue;                    // daleko – nic
    const axis = gx>=gy ? 0 : 1;                          // oś, na której są najbliżej rozdzielenia
    const ca=(a[axis]+a[axis+2])/2, cb=(b[axis]+b[axis+2])/2, lo=ca<cb?i:j, hi=ca<cb?j:i;
    const L=bbox(H[lo]), R=bbox(H[hi]), mid=(L[axis+2]+R[axis])/2;
    H[lo]=clip(H[lo],axis,mid-bar/2,+1); H[hi]=clip(H[hi],axis,mid+bar/2,-1);
    cuts.push({pair:[i,j],axis:axis?'y':'x',gap:+(axis?gy:gx).toFixed(2),mid:+mid.toFixed(2)});
  }
  return {holes:H.filter(h=>h.length>=3&&Math.abs(area(h))>1e-6), cuts};
}
// input: {outline:[[x,y]..] px, holes:[[[x,y]..]..] px, thicknessMm?=4, widthMm?=602} (Y obrazu w dół)
export function buildSheetG0(input, opts={}){
  const T=input.thicknessMm||4, W=input.widthMm||602, O=input.outline;
  const xs=O.map(p=>p[0]), x0=Math.min(...xs), s=W/(Math.max(...xs)-x0), maxY=Math.max(...O.map(p=>p[1]));
  const mm=p=>p.map(([x,y])=>[(x-x0)*s,(maxY-y)*s]);
  const r=cutBars((input.holes||[]).map(mm), opts.bar||BAR_MM);
  const desc={outline:mm(O),holes:r.holes,cuts:r.cuts,depth:T,scaleMmPerPx:s};
  const THREE=opts.THREE||(typeof globalThis!=='undefined'&&globalThis.THREE);
  if (!THREE) return desc;
  const V=a=>a.map(([x,y])=>new THREE.Vector2(x,y));
  const sh=new THREE.Shape(V(desc.outline));
  desc.holes.forEach(h=>sh.holes.push(new THREE.Path(V(h))));
  desc.geometry=new THREE.ExtrudeGeometry(sh,{depth:T,bevelEnabled:false});
  return desc;
}
// Adapter pod przyszłe wpięcie (window.SheetG0Cand(m)) – rejestrowany TYLKO gdy ktoś jawnie zawoła registerSheetG0().
export function registerSheetG0(win=globalThis){
  win.SheetG0Cand=function(m,o={}){ const v=(m.views||[]).filter(v=>v.outlinePolygon&&v.holes&&v.holes.length).sort((a,b)=>b.holes.length-a.holes.length)[0];
    if(!v) return null; const d=buildSheetG0({outline:v.outlinePolygon,holes:v.holes,thicknessMm:m.thicknessMm,widthMm:o.widthMm});
    return {id:'sheetG0',label:'blacha z obrysu',geom:d.geometry,score:0.9,why:['G0: '+d.holes.length+' otwory']}; };
  win.PdfVecToG0=r=>pdfVecToG0View(r);
  win.PdfVecToBent=(r,o)=>pdfVecToBent(r,o);
}
// PdfVec -> G0: widok wektorowy (bbox w pt, Y w dół) -> {outlinePolygon, holes} dla SheetG0Cand.
// Okna = prostokąty z bbox, otwory okrągłe = 16-kąty. Wybiera widok nie-iso z największą liczbą okien+otworów.
const rectP=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const circP=([x,y,w,h],n=16)=>{const cx=x+w/2,cy=y+h/2;return Array.from({length:n},(_,i)=>[cx+w/2*Math.cos(2*Math.PI*i/n),cy+h/2*Math.sin(2*Math.PI*i/n)]);};
export function pdfVecToG0View(res){
  if(!res||!res.views) return null;
  const v=res.views.filter(v=>!v.iso&&((v.windows||[]).length+(v.holes||[]).length)>0)
    .sort((a,b)=>(b.windows.length+b.holes.length)-(a.windows.length+a.holes.length)||b.outline.area_pt2-a.outline.area_pt2)[0];
  if(!v) return null;
  // pętle z pdf_vector (poly, pt) gdy są; fallback: bbox-prostokąt / 16-kąt
  const ok=p=>Array.isArray(p)&&p.length>=3;
  const holes=[...v.windows.map(o=>ok(o.poly)?o.poly:rectP(o.bbox)),...v.holes.map(o=>ok(o.poly)&&o.poly.length>=8?o.poly:circP(o.bbox))];
  const outline=ok(v.outline&&v.outline.poly)?v.outline.poly:rectP(v.bbox);const M=res.meta||null;
  return {outlinePolygon:outline,holes,widthPt:v.bbox[2],src:'pdfVec',nWin:v.windows.length,nHole:v.holes.length,outlineVerts:outline.length,loops:ok(v.outline&&v.outline.poly),
    widthMm:M?v.bbox[2]*M.mmPerPt:null,thicknessMm:M?M.thicknessMm:null,meta:M};
}
// --- Gięcia z rzutu bocznego (pdf_vector side_bends) -> półki. Źródło półek = profil; liczby wymiarów tylko jako kontrola ±tol mm.
// opts.bends===false -> null (ścieżka OFF jak dotąd).
export function resolveShelves(sb, dimNums=[], opts={}){
  if(opts.bends===false||!sb||!(sb.bends>0)||!Array.isArray(sb.legs_mm)) return null;
  const tol=opts.tol??1, t=sb.t_gauge||sb.t_mm||4;
  const shelves=sb.legs_mm.map((L,i)=>{const Li=(sb.legs_in_mm||[])[i];
    let best=null;for(const d of dimNums){for(const [ref,kind] of [[L,'zewn'],[Li,'wewn']]){if(ref==null)continue;const e=Math.abs(d-ref);if(!best||e<best.err)best={dim:d,kind,err:+e.toFixed(2)};}}
    return {leg_mm:L,leg_in_mm:Li??null,src:'profil',check:!best?'BRAK_LICZBY':best.err<=tol?'OK':best.err<=Math.max(3,0.1*L)?'ROZBIEZNE':'BRAK_LICZBY',dim:best?best.dim:null,dimKind:best?best.kind:null,err:best?best.err:null};});
  return {type:sb.type,bends:sb.bends,t_mm:t,shelves,allOk:shelves.every(s=>s.check==='OK'),anyBad:shelves.some(s=>s.check==='ROZBIEZNE')};
}
// Przekrój L/U (linia środkowa -> pas grubości t) w mm, płaszczyzna (u,v); półki zewn. jak w legs_mm.
export function bentSection(sh){
  const t=sh.t_mm,L=sh.shelves.map(s=>s.leg_mm);
  if(sh.type==='L'){const [a,b]=L;return [[0,0],[a,0],[a,t],[t,t],[t,b],[0,b]];}
  if(sh.type==='U'){const [a,w,c]=L;return [[0,a],[0,0],[w,0],[w,c],[w-t,c],[w-t,t],[t,t],[t,a]];}
  return null;
}
// Bryła giętej blachy: przekrój wyciągnięty na długość lengthMm. Bez THREE -> deskryptor.
export function buildBentSheet(sh,lengthMm,opts={}){
  const sec=bentSection(sh);if(!sec||!(lengthMm>0))return null;
  const desc={kind:'bent',type:sh.type,section:sec,length:lengthMm,t:sh.t_mm,bends:sh.bends,shelves:sh.shelves,anyBad:sh.anyBad};
  const THREE=opts.THREE||(typeof globalThis!=='undefined'&&globalThis.THREE);
  if(THREE){desc.geometry=new THREE.ExtrudeGeometry(new THREE.Shape(sec.map(([x,y])=>new THREE.Vector2(x,y))),{depth:lengthMm,bevelEnabled:false});}
  return desc;
}
// Z wyniku pdfVector: półki + długość (największy wymiar innego widoku nie-iso; NIEPEWNE).
export function pdfVecToBent(res,opts={}){
  if(!res||opts.bends===false)return null;const sh=resolveShelves(res.side_bends,res.dim_nums||[],opts);if(!sh)return null;
  const k=res.meta?res.meta.mmPerPt:25.4/72;const others=(res.views||[]).filter(v=>!v.iso&&!(v.profile&&v.profile.bends>0));
  const len=opts.lengthMm||Math.max(0,...others.map(v=>Math.max(v.outline.bbox[2],v.outline.bbox[3])*k));
  return buildBentSheet(sh,+len.toFixed(1),opts);
}
