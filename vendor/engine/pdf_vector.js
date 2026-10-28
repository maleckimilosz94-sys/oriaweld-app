// pdf_vector.js — SZKIC (flaga OFF). Czyta wektory z PDF (pdf.js getOperatorList) i zwraca kontur + okna/otwory
// w kształcie zgodnym z __geoG0: {views:[{bbox,outline,holes,windows,iso}]}.
// Uruchamia się tylko gdy window.__pdfVec===true albo opts.pdfVec===true.
// Klasyfikacja: kontur = ciągła kreska o grubości z największą sumą długości (≥ mediana, < 0.95pt; SolidWorks: 0.71),
// wymiary = cieńsze (SolidWorks 0.51), osie = kreskowane, ramka/tabliczka ≥0.95pt lub bbox > 60% strony.
// Fallback (jedna grubość dla wszystkiego): wtedy bierze wszystkie ciągłe kreski — wymiary mogą tworzyć fałszywe pętle (TODO: groty + getTextContent).
const S=3; // px na pt w siatce pętli
function mul(a,b){return [a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3],a[4]*b[0]+a[5]*b[2]+b[4],a[4]*b[1]+a[5]*b[3]+b[5]];}
function ap(m,x,y){return [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];}

async function extractStrokes(pdfjs,data){
  try{const G=pdfjs.GlobalWorkerOptions;if(G&&!G.workerSrc&&typeof window!=='undefined'&&typeof process==='undefined')G.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs';}catch(e){}
  const doc=await pdfjs.getDocument({data,isEvalSupported:false}).promise;const page=await doc.getPage(1);
  const vp=page.getViewport({scale:1});const O=pdfjs.OPS;const ops=await page.getOperatorList();
  // vp.transform: PDF -> układ ekranowy (y w dół), w pt
  let st={m:vp.transform.slice(),w:1,dash:false};const stack=[];let cur=[];const strokes=[];
  const sub=(m)=>{};
  for(let i=0;i<ops.fnArray.length;i++){
    const f=ops.fnArray[i],a=ops.argsArray[i];
    if(f===O.save)stack.push({...st,m:st.m.slice()});
    else if(f===O.restore)st=stack.pop()||st;
    else if(f===O.transform)st.m=mul(a,st.m);
    else if(f===O.setLineWidth)st.w=a[0];
    else if(f===O.setDash)st.dash=(a[0]||[]).length>0;
    else if(f===O.constructPath){
      const [pops,coords]=a;let k=0;let start=null,last=null;
      for(const op of pops){
        if(op===O.moveTo){last=ap(st.m,coords[k],coords[k+1]);start=last;k+=2;}
        else if(op===O.lineTo){const p=ap(st.m,coords[k],coords[k+1]);cur.push([last,p]);last=p;k+=2;}
        else if(op===O.curveTo||op===O.curveTo2||op===O.curveTo3){
          const n=op===O.curveTo?6:4;const c=coords.slice(k,k+n);k+=n;
          let p1,p2,p3;const L=last;
          if(op===O.curveTo){p1=ap(st.m,c[0],c[1]);p2=ap(st.m,c[2],c[3]);p3=ap(st.m,c[4],c[5]);}
          else if(op===O.curveTo2){p1=L;p2=ap(st.m,c[0],c[1]);p3=ap(st.m,c[2],c[3]);}
          else {p1=ap(st.m,c[0],c[1]);p3=ap(st.m,c[2],c[3]);p2=p3;}
          let prev=L;for(let t=1;t<=12;t++){const u=t/12,v=1-u;const p=[v*v*v*L[0]+3*v*v*u*p1[0]+3*v*u*u*p2[0]+u*u*u*p3[0],v*v*v*L[1]+3*v*v*u*p1[1]+3*v*u*u*p2[1]+u*u*u*p3[1]];cur.push([prev,p,1]);prev=p;}
          last=p3;}
        else if(op===O.rectangle){const [x,y,w,h]=coords.slice(k,k+4);k+=4;const q=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(p=>ap(st.m,p[0],p[1]));for(let j=0;j<4;j++)cur.push([q[j],q[(j+1)%4]]);}
        else if(op===O.closePath){if(start&&last)cur.push([last,start]);last=start;}
      }
    }
    else if(f===O.stroke||f===O.closeStroke){
      const sc=Math.sqrt(Math.abs(st.m[0]*st.m[3]-st.m[1]*st.m[2]));
      if(cur.length)strokes.push({w:+(st.w*sc).toFixed(2),dash:st.dash,segs:cur});cur=[];}
    else if(f===O.fill||f===O.eoFill||f===O.endPath||f===O.fillStroke||f===O.eoFillStroke){cur=[];}
  }
  let text=[];try{const tc=await page.getTextContent();for(const it of tc.items){if(!it.str||!it.str.trim())continue;const p=ap(vp.transform,it.transform[4],it.transform[5]);text.push({s:it.str.trim(),x:p[0],y:p[1],w:it.width||0});}}catch(e){}
  return {W:vp.width,H:vp.height,strokes,text};
}
function bboxOf(segs){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const [a,b] of segs)for(const p of [a,b]){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);}return [x0,y0,x1,y1];}

function classify(P){
  const {W,H,strokes}=P;
  for(const s of strokes){s.bb=bboxOf(s.segs);s.len=s.segs.reduce((t,[a,b])=>t+Math.hypot(b[0]-a[0],b[1]-a[1]),0);}
  const frame=s=>(s.bb[2]-s.bb[0])>.6*W&&(s.bb[3]-s.bb[1])>.6*H;
  // tabliczka: największy gruby (≥0.9) obiekt w prawym-dolnym rogu szerszy niż 25% strony
  let TB=null;for(const s of strokes){if(frame(s)||s.w<0.9)continue;const b=s.bb;if(b[2]>.6*W&&b[3]>.6*H&&(b[2]-b[0])>.25*W){if(!TB||(b[2]-b[0])*(b[3]-b[1])>(TB[2]-TB[0])*(TB[3]-TB[1]))TB=b;}}
  const inTB=b=>TB&&b[0]>=TB[0]-1&&b[1]>=TB[1]-1&&b[2]<=TB[2]+1&&b[3]<=TB[3]+1;
  const cand=strokes.filter(s=>!frame(s)&&!inTB(s.bb)&&!s.dash);
  const tot={};for(const s of cand)tot[s.w]=(tot[s.w]||0)+s.len;
  const ws=Object.keys(tot).map(Number).sort((a,b)=>a-b);const med=ws[Math.floor(ws.length/2)]??0;
  let pool=ws.filter(w=>w>=med&&w<0.95);let fallback=false;if(!pool.length){pool=ws;fallback=true;}
  const gw=pool.reduce((b,w)=>tot[w]>(tot[b]??-1)?w:b,pool[0]);
  if(ws.filter(w=>w<0.95).length<2)fallback=true;
  return {geo:cand.filter(s=>s.w===gw),gw,tot,TB,fallback};
}

// Moore-neighbour trace zewnętrznego brzegu maski (in(x,y)->bool), start = piksel (sx,sy) z tłem po lewej.
function trace(inF,sx,sy,maxN){const D=[[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]];const pts=[[sx,sy]];let cx=sx,cy=sy,b=0;
  for(let n=0;n<maxN;n++){let f=-1;for(let k=0;k<8;k++){const d=(b+k)%8;const X=cx+D[d][0],Y=cy+D[d][1];if(inF(X,Y)){f=d;break;}}
    if(f<0)break;cx+=D[f][0];cy+=D[f][1];b=(f+6)%8;if(cx===sx&&cy===sy)break;pts.push([cx,cy]);}
  return pts;}
function dp(P,eps){if(P.length<3)return P.slice();const keep=new Uint8Array(P.length);keep[0]=keep[P.length-1]=1;const st=[[0,P.length-1]];
  while(st.length){const [a,b]=st.pop();let md=0,mi=-1;const [x1,y1]=P[a],[x2,y2]=P[b];const L=Math.hypot(x2-x1,y2-y1)||1e-9;
    for(let i=a+1;i<b;i++){const d=Math.abs((x2-x1)*(y1-P[i][1])-(x1-P[i][0])*(y2-y1))/L;if(d>md){md=d;mi=i;}}
    if(md>eps){keep[mi]=1;st.push([a,mi],[mi,b]);}}
  return P.filter((_,i)=>keep[i]);}
// zamknięta pętla: podziel na dwie połowy (najdalszy punkt od startu), żeby DP nie zjadł pętli
function simplifyLoop(P,eps){if(P.length<4)return P;let f=0,md=0;for(let i=1;i<P.length;i++){const d=Math.hypot(P[i][0]-P[0][0],P[i][1]-P[0][1]);if(d>md){md=d;f=i;}}
  const A=dp(P.slice(0,f+1),eps),B=dp(P.slice(f).concat([P[0]]),eps);return A.concat(B.slice(1,-1));}
function loops(W,H,geo,CL=false){
  const w=Math.ceil(W*S)+2,h=Math.ceil(H*S)+2;const g=new Uint8Array(w*h);
  const plot=(x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<w&&Y<h)g[Y*w+X]=1;}};
  const segs=[];
  for(const s of geo)for(const [a,b,curve] of s.segs){segs.push([a,b,curve]);const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*S));for(let t=0;t<=n;t++)plot(Math.round((a[0]+(b[0]-a[0])*t/n)*S),Math.round((a[1]+(b[1]-a[1])*t/n)*S));}
  // etykiety tła (4-sąsiedztwo) i tuszu (8)
  const lab=new Int32Array(w*h).fill(-1);const reg=[];const q=new Int32Array(w*h);
  for(let i=0;i<w*h;i++){if(lab[i]>=0)continue;const ink=g[i];const id=reg.length;const r={ink,area:0,x0:1e9,y0:1e9,x1:-1,y1:-1,border:false,perim:0,nb:new Set()};reg.push(r);
    let qh=0,qt=0;q[qt++]=i;lab[i]=id;
    while(qh<qt){const p=q[qh++];const x=p%w,y=(p/w)|0;r.area++;if(x<r.x0)r.x0=x;if(y<r.y0)r.y0=y;if(x>r.x1)r.x1=x;if(y>r.y1)r.y1=y;if(x==0||y==0||x==w-1||y==h-1)r.border=true;
      const N=ink?[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1]];
      for(const [dx,dy] of N){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const k=Y*w+X;if(g[k]!==ink){if(!ink)r.perim++;continue;}if(lab[k]<0){lab[k]=id;q[qt++]=k;}}}}
  // sąsiedztwo tusz<->tło
  for(let y=0;y<h;y++)for(let x=0;x<w-1;x++){const a=lab[y*w+x],b=lab[y*w+x+1];if(a!==b){reg[a].nb.add(b);reg[b].nb.add(a);}}
  for(let y=0;y<h-1;y++)for(let x=0;x<w;x++){const a=lab[y*w+x],b=lab[(y+1)*w+x];if(a!==b){reg[a].nb.add(b);reg[b].nb.add(a);}}
  // jak g0_pdf_vector.py: pętla = komponent tuszu (jego zewnętrzny obrys), rodzic = najmniejsza pętla zawierająca
  const outerBg=new Set(reg.map((r,i)=>(!r.ink&&r.border)?i:-1).filter(i=>i>=0));
  const inks=reg.map((r,i)=>r.ink?i:-1).filter(i=>i>=0);
  const outside={};for(const i of inks){const r=reg[i];// pierwszy piksel tła na lewo od skrajnego lewego piksela
    let y0=-1;for(let y=r.y0;y<=r.y1&&y0<0;y++)if(lab[y*w+r.x0]===i)y0=y;let x=r.x0-1;while(x>=0&&reg[lab[y0*w+x]].ink)x--;outside[i]=x>=0?lab[y0*w+x]:-1;}
  const encl={};// region tła -> komponent tuszu, który go otacza (najmniejszy bbox sąsiad, którego outside != ten region)
  const parent={},filled={};
  for(const i of inks){const B=outside[i];if(B<0||outerBg.has(B)){parent[i]=-1;continue;}
    let best=-1;for(const k of reg[B].nb){if(!reg[k].ink||k===i||outside[k]===B)continue;const R=reg[k];if(best<0||(R.x1-R.x0)*(R.y1-R.y0)<(reg[best].x1-reg[best].x0)*(reg[best].y1-reg[best].y0))best=k;}
    parent[i]=best;}
  const kids={};for(const i of inks){const p=parent[i];if(p>=0)(kids[p]=kids[p]||[]).push(i);}
  const fa=i=>{if(filled[i]!==undefined)return filled[i];let t=reg[i].area;for(const j of reg[i].nb)if(!reg[j].ink&&j!==outside[i])t+=reg[j].area;for(const k of (kids[i]||[]))t+=0;return filled[i]=t;};
  // dziecko leżące w regionie wewnętrznym rodzica zostało już policzone w area tego regionu? nie — region tła wyklucza piksele dziecka, więc dodaj
  const FA=i=>{let t=fa(i);for(const k of (kids[i]||[]))t+=FA(k);return t;};
  // pętla jako wielokąt: brzeg wypełnionego komponentu (tusz + jego wnętrze), w pt, uproszczony DP 0.6 pt
  const loopPoly=i=>{const r=reg[i],ob=outside[i];let sy=-1;for(let y=r.y0;y<=r.y1&&sy<0;y++)if(lab[y*w+r.x0]===i)sy=y;if(sy<0)return null;
    const inF=(x,y)=>x>=r.x0&&y>=r.y0&&x<=r.x1&&y<=r.y1&&lab[y*w+x]!==ob;
    const raw=trace(inF,r.x0,sy,8*((r.x1-r.x0)+(r.y1-r.y0)+4));if(raw.length<4)return null;
    const P=simplifyLoop(raw,0.6*S).map(([x,y])=>[+(x/S).toFixed(2),+(y/S).toFixed(2)]);return P.length>=3?P:null;};
  // CENTERLINE: wierzchołek śladu pikselowego (zewn. brzeg kreski) -> najbliższy koniec odcinka wektorowego (oś kreski), r<=1.5pt
  const EP=[];for(const [a,b] of segs){EP.push(a,b);}
  const G={};const key=(x,y)=>Math.floor(x/2)+','+Math.floor(y/2);for(const p of EP)(G[key(p[0],p[1])]=G[key(p[0],p[1])]||[]).push(p);
  const snapPoly=P=>{if(!P)return P;let n=0;const Q=P.map(([x,y])=>{let best=null,bd=1.5;const gx=Math.floor(x/2),gy=Math.floor(y/2);
      for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const p of (G[(gx+i)+','+(gy+j)]||[])){const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best=p;}}
      if(best){n++;return [+best[0].toFixed(2),+best[1].toFixed(2)];}return [x,y];});
    const D=[];for(const p of Q)if(!D.length||Math.hypot(p[0]-D[D.length-1][0],p[1]-D[D.length-1][1])>0.05)D.push(p);
    D.snapped=n;return D.length>=3?D:P;};
  const bbP=P=>{const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);const x0=Math.min(...xs),y0=Math.min(...ys);return [+x0.toFixed(2),+y0.toFixed(2),+(Math.max(...xs)-x0).toFixed(2),+(Math.max(...ys)-y0).toFixed(2)];};
  const clObj=o=>{if(!o.poly)return o;const c=snapPoly(o.poly);o.poly_raw=o.poly;o.poly=c;o.bbox_raw=o.bbox;o.bbox=bbP(c);o.area_pt2=+polyArea(c).toFixed(2);o.centerline=(c.snapped||0)+'/'+o.poly_raw.length;return o;};
  const views=[];
  for(const i of inks){if(parent[i]!==-1)continue;const r=reg[i];const A=FA(i);if(A<(20*S)**2)continue;
    const holes=[],windows=[];
    for(const k of (kids[i]||[])){const R=reg[k];const a=FA(k);if(a<(1.5*S)**2)continue;const bw=R.x1-R.x0+1,bh=R.y1-R.y0+1;const fill=a/(bw*bh);
      const round=Math.abs(bw-bh)/Math.max(bw,bh)<0.15&&fill>0.7&&fill<0.86;
      const o={bbox:[R.x0/S,R.y0/S,bw/S,bh/S],area_pt2:a/S/S,poly:loopPoly(k)};(round||a<=0.01*A?holes:windows).push(o);}
    const bb=[r.x0/S,r.y0/S,(r.x1-r.x0)/S,(r.y1-r.y0)/S];
    let tl=0,nl=0;for(const [a,b] of segs){const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;if(mx<bb[0]||my<bb[1]||mx>bb[0]+bb[2]||my>bb[1]+bb[3])continue;const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const an=Math.abs(Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI)%90;tl+=L;if(an>5&&an<85&&L>2)nl+=L;}
    const ol={bbox:bb,area_pt2:A/S/S,poly:loopPoly(i)};if(CL){clObj(ol);holes.forEach(clObj);windows.forEach(clObj);}
    views.push({bbox:ol.bbox,outline:ol,holes,windows,non_ortho:tl?+(nl/tl).toFixed(2):0,iso:tl>0&&nl/tl>0.35});}
  return views;
}

// skala + grubość z tekstu PDF (port sheet_flat_pdf_v3.py). Zwraca {mmPerPt, scaleSrc, thicknessMm, thkConf, thkSrc}
const NUM=/^\d+([.,]\d+)?$/;const num=t=>parseFloat(String(t).replace(',','.'));
const polyArea=p=>{let s=0;for(let i=0;i<p.length;i++){const [a,b]=p[i],[c,d]=p[(i+1)%p.length];s+=a*d-c*b;}return Math.abs(s/2);};
function textMeta(P,view){
  const T=P.text||[];const out={mmPerPt:25.4/72,scaleSrc:'PDF pt 1:1 (brak pary wymiarów) - NIEPEWNE',thicknessMm:4,thkConf:'NIEPEWNE',thkSrc:'brak danych - domyślne 4 mm'};
  if(!view)return out;const nums=[...new Set(T.filter(t=>NUM.test(t.s)).map(t=>num(t.s)))].sort((a,b)=>b-a);
  const bw=view.bbox[2],bh=view.bbox[3],bL=Math.max(bw,bh),bW=Math.min(bw,bh);let best=null;
  for(const a of nums)for(const b of nums){if(b>=a||b<5)continue;if(Math.abs((a/b)/(bL/bW)-1)<0.05){const sc=a/bL;if(!best||a>best[0])best=[a,b,sc];}}
  if(best){out.mmPerPt=best[2];out.scaleSrc='wymiary '+best[0]+' x '+best[1]+' (x'+best[2].toFixed(3)+' mm/pt)';}
  else{const sc=T.map(t=>/^(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)$/.exec(t.s.trim().split(/\s+/).pop())).find(m=>m&&num(m[1])>0&&num(m[2])>0);
    if(sc&&num(sc[1])/num(sc[2])!==1){out.mmPerPt=25.4/72*num(sc[2])/num(sc[1]);out.scaleSrc='skala z tabliczki '+sc[1]+':'+sc[2]+' (SREDNIA)';}}
  const H=P.H;const tbY=Math.min(...T.filter(t=>/^(Weight|Material|Gewicht|Masse)$/.test(t.s)).map(t=>t.y),H);
  const txt=T.map(t=>t.s).join(' ');const m=txt.match(/(?:Dicke|t\s*=|thk|thickness|grubo\w*)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);const expl=m?num(m[1]):null;
  const cands=[...new Set(T.filter(t=>NUM.test(t.s)&&t.y<tbY-2&&t.y>0.06*H&&t.y<0.94*H).map(t=>[num(t.s),t]).filter(([v,t])=>v>=1&&v<=20&&!(v===Math.floor(v)&&t.s.length===1&&t.w<3)).map(([v])=>v))].sort((a,b)=>a-b);
  let mass=null;for(let i=0;i<T.length;i++)if(T[i].s==='Weight'||T[i].s==='Gewicht'){for(const t2 of T.slice(i+1,i+6))if(NUM.test(t2.s)){mass=num(t2.s);break;}break;}
  const low=txt.toLowerCase();const dens=/steel|stahl|s235|s355/.test(low)?7.85:/alu/.test(low)?2.7:/plastic|kunststoff/.test(low)?1.2:null;
  const k=out.mmPerPt;let A=view.outline.poly?polyArea(view.outline.poly):bw*bh;for(const o of [...view.windows,...view.holes])A-=o.poly?polyArea(o.poly):o.area_pt2;A*=k*k;
  const tm=mass&&dens&&A>0?mass*1e6/(dens*A):null;const GA=[1,1.5,2,2.5,3,4,5,6,8,10,12,15,20];
  if(expl){out.thicknessMm=expl;out.thkConf='WYSOKA';out.thkSrc='jawne Dicke/t=';}
  else if(cands.length&&tm){const t=cands.reduce((b,c)=>Math.abs(c/tm-1)<Math.abs(b/tm-1)?c:b);const e=Math.abs(t/tm-1);out.thicknessMm=t;out.thkConf=e<0.25?'WYSOKA':e<0.6?'SREDNIA':'NISKA (NIEPEWNE)';out.thkSrc='wymiar '+t+' z ['+cands+']; masa->'+tm.toFixed(2)+' mm';}
  else if(cands.length&&cands[0]<=6){out.thicknessMm=cands[0];out.thkConf='NISKA (NIEPEWNE)';out.thkSrc='najmniejszy wymiar (brak masy)';}
  else if(tm&&tm>=0.8&&tm<=25){out.thicknessMm=GA.reduce((b,g)=>Math.abs(g-tm)<Math.abs(b-tm)?g:b);out.thkConf='NISKA (NIEPEWNE)';out.thkSrc='tylko z masy '+tm.toFixed(2)+' mm';}
  return out;}
// Profil z rzutu bocznego (L/U): ścianki = krawędzie bbox zajęte pasem grubości t. t ≈ 2A/obwód (cienka ścianka).
const inPoly=(P,x,y)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
function sideProfile(v,k){const P=v.outline&&v.outline.poly;if(!P||P.length<4||v.iso||v.holes.length||v.windows.length)return null;
  const [x0,y0,bw,bh]=v.outline.bbox;let per=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];per+=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  const A=polyArea(P);const t=2*A/per;const m=Math.min(bw,bh);if(!(t>0)||m<1)return null;
  if(m<2.5*t&&m<0.2*Math.max(bw,bh))return {type:'plaski',t_mm:+(m*k).toFixed(2),legs_mm:[+(Math.max(bw,bh)*k).toFixed(1)],bends:0};
  if(t>0.35*m||A>0.7*bw*bh)return null;
  const d=t/2,N=40;const occ=(ax,ay,bx,by)=>{let n=0;for(let i=1;i<N;i++){const u=i/N;if(inPoly(P,ax+(bx-ax)*u,ay+(by-ay)*u))n++;}return n/(N-1);};
  const E={T:occ(x0,y0+d,x0+bw,y0+d),R:occ(x0+bw-d,y0,x0+bw-d,y0+bh),B:occ(x0,y0+bh-d,x0+bw,y0+bh-d),L:occ(x0+d,y0,x0+d,y0+bh)};
  const ord=['T','R','B','L'];const on=ord.filter(e=>E[e]>0.85);const len=e=>(e==='T'||e==='B'?bw:bh)*k;
  let seq=null;if(on.length===2){const i=ord.indexOf(on[0]),j=ord.indexOf(on[1]);if((j-i)%2===1)seq=(j-i===3)?[on[1],on[0]]:on;}
  else if(on.length===3){const miss=ord.find(e=>!on.includes(e));const i=ord.indexOf(miss);seq=[ord[(i+1)%4],ord[(i+2)%4],ord[(i+3)%4]];}
  if(!seq)return null;const tm=t*k;
  const G=[1,1.5,2,2.5,3,4,5,6,8,10,12,15,20],tg=G.reduce((b,g)=>Math.abs(g-tm)<Math.abs(b-tm)?g:b);
  return {type:seq.length===2?'L':'U',t_mm:+tm.toFixed(2),t_gauge:tg,legs_mm:seq.map(e=>+len(e).toFixed(1)),legs_in_mm:seq.map((e,i)=>+(len(e)-tm*((i>0)+(i<seq.length-1))).toFixed(1)),bends:seq.length-1,occ:E,src:'rzut boczny wektor (centerline)'};}
async function pdfVector(data,opts={}){
  const on=opts.pdfVec===true||(typeof window!=='undefined'&&window.__pdfVec===true);
  if(!on)return null;
  const pdfjs=opts.pdfjs||await import((typeof window!=='undefined'&&typeof process==='undefined')?'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.min.mjs':'pdfjs-dist/legacy/build/pdf.mjs');
  const P=await extractStrokes(pdfjs,data);const C=classify(P);const views=loops(P.W,P.H,C.geo,opts.centerline!==false);
  const main=views.filter(v=>!v.iso);
  const mv=main.filter(v=>v.windows.length+v.holes.length>0).sort((a,b)=>(b.windows.length+b.holes.length)-(a.windows.length+a.holes.length)||b.outline.area_pt2-a.outline.area_pt2)[0]||main[0];
  const meta=textMeta(P,mv);if(opts.bends!==false)for(const v of views){const sp=sideProfile(v,meta.mmPerPt);if(sp)v.profile=sp;}
  const prof=views.map(v=>v.profile).filter(p=>p&&p.bends>0).sort((a,b)=>b.bends-a.bends)[0]||null;
  return {meta,side_bends:prof,views,geo_width:C.gw,width_lengths:C.tot,fallback:C.fallback,title_block:C.TB,
    dim_nums:[...new Set((P.text||[]).filter(t=>NUM.test(t.s)).map(t=>num(t.s)))].filter(x=>x>0).sort((a,b)=>a-b),
    windows_total:main.reduce((t,v)=>t+v.windows.length,0),holes_total:main.reduce((t,v)=>t+v.holes.length,0)};
}
if(typeof window!=='undefined'){if(window.__pdfVec===undefined)window.__pdfVec=false;window.pdfVector=pdfVector;}
export {pdfVector,extractStrokes,classify,loops,textMeta};
