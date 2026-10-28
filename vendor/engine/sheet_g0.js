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
  const holes=[...v.windows.map(o=>rectP(o.bbox)),...v.holes.map(o=>circP(o.bbox))];
  return {outlinePolygon:rectP(v.bbox),holes,widthPt:v.bbox[2],src:'pdfVec',nWin:v.windows.length,nHole:v.holes.length};
}
