/* ORIAWELD – rozkład modelu (exploded view) + siatka holograficzna + skala 1:1/swobodna (z ar_sandbox/explode, 24.10.2026) */
(function(){
const I18N={
 pl:{exOf:'z',exFreeTag:'≈ skala swobodna',exFreeNote:'Skala swobodna – wymiary orientacyjne, nie do pomiaru',exOpen:'Rozłóż',exClose:'Złóż',exPart:'Część',exDims:'Wymiary',exTap:'Dotknij część, aby zobaczyć nazwę i wymiary',grid:'Siatka',gridCell:'kratka 10 cm',exAnim:'AR: animacja rozkładu (iPhone)',exStatic:'AR: model statyczny',sc11:'Skala 1:1',scFree:'Swobodna',scPill:'📏 Skala: 1:1',scWarn:'⚠ Skala swobodna – wymiary nie są rzeczywiste'},
 en:{exOf:'of',exFreeTag:'≈ free scale',exFreeNote:'Free scale – approximate dimensions, not for measuring',exOpen:'Explode',exClose:'Collapse',exPart:'Part',exDims:'Dimensions',exTap:'Tap a part to see its name and dimensions',grid:'Grid',gridCell:'10 cm cell',exAnim:'AR: explode animation (iPhone)',exStatic:'AR: static model',sc11:'Scale 1:1',scFree:'Free',scPill:'📏 Scale: 1:1',scWarn:'⚠ Free scale – dimensions are not real'},
 de:{exOf:'von',exFreeTag:'≈ freie Skalierung',exFreeNote:'Freie Skalierung – Maße nur ungefähr, nicht zum Messen',exOpen:'Zerlegen',exClose:'Zusammensetzen',exPart:'Teil',exDims:'Abmessungen',exTap:'Tippe auf ein Teil für Name und Maße',grid:'Raster',gridCell:'10-cm-Raster',exAnim:'AR: Explosionsanimation (iPhone)',exStatic:'AR: statisches Modell',sc11:'Maßstab 1:1',scFree:'Frei',scPill:'📏 Maßstab: 1:1',scWarn:'⚠ Freier Maßstab – Maße sind nicht real'}};
/* ten sam mechanizm co aplikacja: klucze dopisywane do AR_I18N -> scalane do TX -> T() (window.__arT) */
window.AR_I18N=window.AR_I18N||{pl:{},en:{},de:{}};
['pl','en','de'].forEach(l=>{AR_I18N[l]=AR_I18N[l]||{};Object.assign(AR_I18N[l],I18N[l]);if(window.TX&&TX[l])for(const k in I18N[l])if(!(k in TX[l]))TX[l][k]=I18N[l][k]});
const lang=()=>{const q=new URLSearchParams(location.search).get('lang');return (q||localStorage.getItem('oria_lang')||'pl').slice(0,2)};
const T=k=>window.__arT?(__arT(k)||(AR_I18N[lang()]||AR_I18N.pl)[k]):((AR_I18N[lang()]||AR_I18N.pl)[k]||AR_I18N.pl[k]);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const GRID_LIFT=0.0005;
function parts(w){return w.children.filter(o=>o.isMesh&&/^czesc_/.test(o.name))}
function box(o){o.updateMatrixWorld(true);return new THREE.Box3().setFromObject(o)}
function overlapVol(a,b){const x=Math.min(a.max.x,b.max.x)-Math.max(a.min.x,b.min.x),y=Math.min(a.max.y,b.max.y)-Math.max(a.min.y,b.min.y),z=Math.min(a.max.z,b.max.z)-Math.max(a.min.z,b.min.z);return x>0&&y>0&&z>0?x*y*z:0}
/* przygotuj rozkład: kierunek = centroid części – środek zestawu, długość skalowana bboxem; iteracyjnie aż bboxy się nie nakładają; y>=0 */
function prepare(w,opt){opt=opt||{};const P=parts(w);const A=box(w),C=A.getCenter(new THREE.Vector3()),S=A.getSize(new THREE.Vector3()),diag=S.length();
 const info=P.map((p,i)=>{p.updateMatrixWorld(true);const b=box(p),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());
  let d=c.clone().sub(C);if(d.length()<1e-4*diag){const a=i/Math.max(1,P.length)*Math.PI*2;d.set(Math.cos(a),0.3,Math.sin(a))}
  d.normalize();return {p,base:p.position.clone(),b,dir:d,size:s}});
 let k=opt.k||0.25,off=[];
 for(let it=0;it<3;it++){off=info.map(o=>{const ext=Math.abs(o.dir.x)*o.size.x+Math.abs(o.dir.y)*o.size.y+Math.abs(o.dir.z)*o.size.z;
   const v=o.dir.clone().multiplyScalar(k*diag*0.5+ext*0.6);if(o.b.min.y+v.y<0)v.y=-o.b.min.y;return v});
  let ov=0;for(let i=0;i<info.length;i++)for(let j=i+1;j<info.length;j++)ov+=overlapVol(info[i].b.clone().translate(off[i]),info[j].b.clone().translate(off[j]));
  if(ov<1e-12)break;k*=1.2}
 /* części na tym samym promieniu: rozsuwanie parami (dalsza część jedzie dalej wzdłuż swojego kierunku) */
 const ovAll=()=>{let t=0;for(let i=0;i<info.length;i++)for(let j=i+1;j<info.length;j++)t+=overlapVol(info[i].b.clone().translate(off[i]),info[j].b.clone().translate(off[j]));return t};
 for(let it=0;it<1500&&ovAll()>1e-12;it++)for(let i=0;i<info.length;i++)for(let j=i+1;j<info.length;j++){
  if(overlapVol(info[i].b.clone().translate(off[i]),info[j].b.clone().translate(off[j]))<=0)continue;
  const di=info[i].b.getCenter(new THREE.Vector3()).sub(C).length(),dj=info[j].b.getCenter(new THREE.Vector3()).sub(C).length();
  const m=di>=dj?i:j,o=info[m];let d=o.dir.clone();if(d.y<0&&o.b.min.y+off[m].y<=1e-9){d.y=0;if(d.length()<1e-6)d.set(1,0,0);d.normalize()}
  off[m].addScaledVector(d,0.004);if(o.b.min.y+off[m].y<0)off[m].y=-o.b.min.y}
 info.forEach((o,i)=>o.off=off[i]);w.userData.ex={info,t:0,C,diag};return w.userData.ex}
function set(w,t){const ex=w.userData.ex;ex.t=t;const e=ease(t);ex.info.forEach(o=>o.p.position.copy(o.base).addScaledVector(o.off,e));const D=w.getObjectByName('wymiary');if(D)D.visible=t<0.05;w.updateMatrixWorld(true)}
function animate(w,to,ms,onFrame,done){const ex=w.userData.ex,from=ex.t,t0=performance.now();ms=ms||600;
 (function st(){const u=Math.min(1,(performance.now()-t0)/ms);set(w,from+(to-from)*u);onFrame&&onFrame(u);if(u<1)requestAnimationFrame(st);else done&&done()})()}
function label(part){const s=part.geometry.boundingBox||(part.geometry.computeBoundingBox(),part.geometry.boundingBox),z=s.getSize(new THREE.Vector3()).multiplyScalar(1000);
 const n=+part.name.replace('czesc_','')+1,w=part.parent,N=w?parts(w).length:0,free=scale.get()=='free',ap=free?'≈ ':'',nm=part.userData.nm?' · '+part.userData.nm:'';
 return {name:part.name,free,text:T('exPart')+' '+n+(N>1?' '+T('exOf')+' '+N:'')+nm+' · '+T('exDims')+': '+ap+z.x.toFixed(0)+' × '+ap+z.y.toFixed(0)+' × '+ap+z.z.toFixed(0)+' mm'+(free?' ('+T('exFreeTag')+')':''),mm:[z.x,z.y,z.z]}}
/* siatka v2 „świetlista, lekko zamglona”: jedna wspólna tekstura 128×128 PNG (atlas):
   lewa połowa = profil linii (białe jądro + chłodna gaussowska poświata, szum mgiełki wzdłuż linii), prawa połowa = radialna mgła */
let TEX=null;
function gridTex(){if(TEX)return TEX;const N=128,cv=document.createElement('canvas');cv.width=cv.height=N;const cx=cv.getContext('2d'),im=cx.createImageData(N,N),d=im.data;
 let sd=7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;const nv=[...Array(17)].map(rnd);const noise=v=>{const f=v*16,i=Math.floor(f)%16,t=f-Math.floor(f),u=t*t*(3-2*t);return nv[i]*(1-u)+nv[i+1]*u};
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=(y*N+x)*4;let r,g,b,a;
  if(x<N/2){const X=(x+0.5)/(N/2)*2-1,core=Math.exp(-Math.pow(X/0.11,2)),halo=Math.exp(-Math.pow(X/0.42,2)),mist=0.72+0.28*noise(y/N)*(0.85+0.15*rnd());
   a=Math.min(1,(core+0.24*halo)*mist)*(1-Math.pow(Math.abs(X),8));const c=core/(core+0.24*halo+1e-6);r=200+55*c;g=226+29*c;b=255}
  else{const X=((x-N/2)+0.5)/(N/2)*2-1,Y=(y+0.5)/N*2-1,rr=Math.hypot(X,Y);a=rr>=1?0:Math.pow(1-rr,1.6)*(0.85+0.15*rnd());r=214;g=232;b=255}
  d[k]=r;d[k+1]=g;d[k+2]=b;d[k+3]=Math.round(255*Math.max(0,a))}
 cx.putImageData(im,0,0);TEX=new THREE.CanvasTexture(cv);TEX.name='siatka_tex';TEX.format=THREE.RGBAFormat;TEX.wrapS=TEX.wrapT=THREE.RepeatWrapping;TEX.flipY=false;TEX.needsUpdate=true;return TEX}
const GLOW={soft:{core:[0.55,0.36,0.18],maj:0.66,fog:0.10,em:0.85},strong:{core:[0.72,0.48,0.24],maj:0.85,fog:0.13,em:1.0}};
function grid(bb,opt){opt=opt||{};const V=GLOW[opt.glow||'strong']||GLOW.strong;const cell=0.1,margin=opt.margin||0.4,dash=0.02,gap=0.015,wMin=0.010,wMaj=0.014;
 const hx=Math.ceil((Math.max(Math.abs(bb.min.x),Math.abs(bb.max.x))+margin)/cell)*cell,hz=Math.ceil((Math.max(Math.abs(bb.min.z),Math.abs(bb.max.z))+margin)/cell)*cell;
 const P=[[],[],[],[]],UV=[[],[],[],[]];
 const bandOf=(x,z)=>{const r=Math.max(Math.abs(x)/hx,Math.abs(z)/hz);return r<0.6?0:r<0.85?1:2};
 // quad: u w poprzek (0..0.5 = profil), v wzdłuż (szum mgiełki, powtarzany)
 const quad=(b,along,s,e,c,w)=>{const v0=s/0.06,v1=e/0.06;const A=along=='x'?[[s,c-w/2],[s,c+w/2],[e,c+w/2],[e,c-w/2]]:[[c-w/2,s],[c+w/2,s],[c+w/2,e],[c-w/2,e]];
  const U=[[0,v0],[0.5,v0],[0.5,v1],[0,v1]];[0,1,2,0,2,3].forEach(i=>{P[b].push(A[i][0],0,A[i][1]);UV[b].push(U[i][0],U[i][1])})};
 let dashes=0;const isMaj=v=>Math.abs(v/0.5-Math.round(v/0.5))<1e-6;
 const line=(along,c,mj,lim)=>{for(let s=-lim;s<lim-1e-9;s+=dash+gap){const e=Math.min(s+dash,lim),m=(s+e)/2,x=along=='x'?m:c,z=along=='x'?c:m,bd=bandOf(x,z);dashes++;
   quad(mj&&bd<2?3:bd,along,s,e,c,mj?wMaj:wMin)}};
 for(let z=-hz;z<=hz+1e-9;z+=cell)line('x',+z.toFixed(4),isMaj(z),hx);
 for(let x=-hx;x<=hx+1e-9;x+=cell)line('z',+x.toFixed(4),isMaj(x),hz);
 const tex=gridTex(),g=new THREE.Group();g.name='siatka';let tris=0;const ops=[...V.core,V.maj];
 const mk=(name,pos,uv,op,order)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const n=new Float32Array(pos.length);for(let j=1;j<n.length;j+=3)n[j]=1;geo.setAttribute('normal',new THREE.BufferAttribute(n,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const m=new THREE.MeshStandardMaterial({color:0xffffff,map:tex,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:V.em,roughness:1,metalness:0,transparent:true,opacity:op,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  m.name=name;m.userData.op=op;m.userData.em=V.em;const me=new THREE.Mesh(geo,m);me.name=name;me.renderOrder=order;g.add(me);tris+=pos.length/9};
 // mgła przy siatce: jeden quad, radialny zanik (prawa połowa atlasu)
 const fx=hx*1.05,fz=hz*1.05;mk('siatka_mgla',[-fx,0,-fz,-fx,0,fz,fx,0,fz,-fx,0,-fz,fx,0,fz,fx,0,-fz],[0.5,0,0.5,1,1,1,0.5,0,1,1,1,0],V.fog,-2);
 ['pas0','pas1','pas2','glowna'].forEach((nm,i)=>{if(P[i].length)mk('siatka_'+nm,P[i],UV[i],ops[i],-1)});
 g.userData={cell,margin,half:[hx,hz],dashes,tris,opacities:ops,fog:V.fog,haloPeak:ops.map(o=>+(o*0.24).toFixed(3)),em:V.em,glow:opt.glow||'strong',lift:GRID_LIFT,tex:128};return g}
/* eksport z siatką: GLB – materiały siatki jako KHR_materials_unlit (wspierane przez Scene Viewer, emissive_strength nie);
   USDZ – po eksporcie: jedna wspólna PNG, opacity = alfa tekstury × stała (inputs:scale), emissiveColor z tej samej tekstury */
function exportGLB(w){const sw=[];w.traverse(o=>{if(o.isMesh&&/^siatka_/.test(o.name)){const m=o.material;sw.push([o,m]);o.material=new THREE.MeshBasicMaterial({name:m.name,map:m.map,color:new THREE.Color(1,1,1),transparent:true,opacity:Math.min(1,m.opacity*(1+m.userData.em*0.25)),depthWrite:false})}});
 return new Promise((res,rej)=>new THREE.GLTFExporter().parse(w,b=>{sw.forEach(([o,m])=>o.material=m);res(new Blob([b],{type:'model/gltf-binary'}))},e=>{sw.forEach(([o,m])=>o.material=m);rej(e)},{binary:true}))}
async function exportUSDZ(w){const a=new Uint8Array(await (await window.exportUSDZ(w)).arrayBuffer());const mats={};w.traverse(o=>{if(o.isMesh&&/^siatka_/.test(o.name))mats[o.material.id]=o.material});
 if(!Object.keys(mats).length)return new Blob([a],{type:'model/vnd.usdz+zip'});
 const files=fflate.unzipSync(a),names=Object.keys(files),root=names.find(n=>/\.usda?$/.test(n));let txt=fflate.strFromU8(files[root]);let shared=null;
 for(const id in mats){const m=mats[id],re=new RegExp('(def Material "Material_'+id+'"[\\s\\S]*?\\n    }\\n)');const blk=(txt.match(re)||[])[1];if(!blk)continue;
  let nb=blk.replace(/(def Shader "Texture_\d+_diffuse"\s*\{)/,'$1\n            float4 inputs:scale = (1, 1, 1, '+m.opacity+')').replace(/(def Shader "Texture_\d+_emissive"\s*\{)/,'$1\n            float4 inputs:scale = ('+m.userData.em+', '+m.userData.em+', '+m.userData.em+', 1)');
  const fl=[...nb.matchAll(/@(textures\/Texture_[^@]+\.png)@/g)].map(x=>x[1]);if(!shared)shared=fl[0];fl.forEach(f=>{nb=nb.split('@'+f+'@').join('@'+shared+'@')});
  nb=nb.replace(/(color3f inputs:diffuseColor\.connect)/,'float inputs:roughness = 1\n            $1');txt=txt.replace(blk,nb)}
 files[root]=fflate.strToU8(txt);names.forEach(n=>{if(/^textures\//.test(n)&&n!==shared&&!txt.includes('@'+n+'@'))delete files[n]});
 // wyrównanie danych do 64 B (wymóg USDZ): nagłówek lokalny 30+nazwa+extra(4+n)
 let off=0;const out={};Object.keys(files).sort((x,y)=>x==root?-1:y==root?1:0).forEach(fn=>{const f=files[fn];const h=off+30+fn.length+4;const pad=(64-(h&63))&63;out[fn]=[f,{level:0,extra:{12345:new Uint8Array(pad)}}];off=h+pad+f.length});
 return new Blob([fflate.zipSync(out,{level:0})],{type:'model/vnd.usdz+zip'})}
/* v96: model z analizy = jeden mesh -> rozdział na spójne bryły (wspólne krawędzie, kwant 0,05 mm); drobne bryły (<1% objętości bbox największej) łączone z najbliższą; maks. 40 części */
function splitMesh(me){const g0=me.geometry,g=g0.index?g0.toNonIndexed():g0,P=g.attributes.position,n=P.count,T=n/3|0;if(T<2||T>400000)return [me];
 const par=new Int32Array(T);for(let i=0;i<T;i++)par[i]=i;const f=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x};
 const vid=new Map(),q=5e-5,V=new Int32Array(n);for(let v=0;v<n;v++){const k=Math.round(P.getX(v)/q)+','+Math.round(P.getY(v)/q)+','+Math.round(P.getZ(v)/q);let id=vid.get(k);if(id===undefined){id=vid.size;vid.set(k,id)}V[v]=id}
 /* krawędź wspólna dla 2 trójkątów (lub otwarta) = ta sama bryła; krawędź z >=3 trójkątami = styk dwóch brył (np. ścianki skrzynki) -> nie łączymy */
 const E=new Map();for(let t=0;t<T;t++)for(let j=0;j<3;j++){const a=V[t*3+j],c=V[t*3+(j+1)%3];if(a===c)continue;const k=a<c?a*4194304+c:c*4194304+a;let e=E.get(k);if(!e)E.set(k,e=[]);e.push(t)}
 E.forEach(e=>{if(e.length>2)return;for(let i=1;i<e.length;i++){const a=f(e[0]),b=f(e[i]);if(a!==b)par[a]=b}});
 const comp=new Map();for(let t=0;t<T;t++){const r=f(t);let c=comp.get(r);if(!c){c={tris:[],bb:new THREE.Box3()};comp.set(r,c)}c.tris.push(t);for(let j=0;j<3;j++)c.bb.expandByPoint(new THREE.Vector3(P.getX(t*3+j),P.getY(t*3+j),P.getZ(t*3+j)))}
 let C=[...comp.values()];if(C.length<2)return [me];
 const vol=c=>{const s=c.bb.getSize(new THREE.Vector3());return Math.max(s.x,1e-6)*Math.max(s.y,1e-6)*Math.max(s.z,1e-6)};C.sort((a,b)=>vol(b)-vol(a));
 const big=[],thr=vol(C[0])*0.01;C.forEach(c=>{if(big.length<40&&vol(c)>=thr)big.push(c);else{let best=big[0],bd=1e9;big.forEach(b=>{const d=b.bb.distanceToPoint(c.bb.getCenter(new THREE.Vector3()));if(d<bd){bd=d;best=b}});best.tris=best.tris.concat(c.tris);best.bb.union(c.bb)}});
 if(big.length<2)return [me];
 const atts=Object.keys(g.attributes);return big.map(c=>{const ng=new THREE.BufferGeometry();atts.forEach(a=>{const A=g.attributes[a],sz=A.itemSize,out=new Float32Array(c.tris.length*3*sz);let o=0;c.tris.forEach(t=>{for(let j=0;j<3;j++)for(let k=0;k<sz;k++)out[o++]=A.array[(t*3+j)*sz+k]});ng.setAttribute(a,new THREE.BufferAttribute(out,sz))});
  ng.computeBoundingBox();const m=new THREE.Mesh(ng,me.material);m.position.copy(me.position);m.quaternion.copy(me.quaternion);m.scale.copy(me.scale);return m})}
function splitParts(w){const P=parts(w);if(P.length>40)return;const out=[];P.forEach(p=>{const s=splitMesh(p);if(s.length>1){w.remove(p);s.forEach(x=>out.push(x))}else out.push(p)});
 if(out.length===P.length)return;out.forEach((m,i)=>{m.name='czesc_'+i;if(!m.parent)w.add(m)});w.userData.split=out.length}
/* v96: krawędzie hologramu (jeden mesh całego modelu) -> krawędzie każdej części jako jej dziecko (rozjeżdżają się razem z częścią);
   etykiety gabarytu: w skali swobodnej szare z „≈” (USDZ/GLB też), schowane po rozłożeniu */
function partsNames(w){try{let L=null;R3.grp.traverse(o=>{if(!L&&o.isMesh&&o.geometry&&o.geometry.userData&&o.geometry.userData.partsList)L=o.geometry.userData.partsList});const P=parts(w);if(L&&P.length===1&&L.length)P[0].userData.nm=L.length===1?L[0]:L.join(' + ')}catch(e){}}
function dimTex(txt,free){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const g=cv.getContext('2d');g.fillStyle=free?'rgba(40,44,52,0.92)':'rgba(3,10,18,0.9)';g.strokeStyle=free?'#9aa1ab':'#22d3ee';g.lineWidth=6;
 const r=28;g.beginPath();g.moveTo(r,4);g.arcTo(508,4,508,124,r);g.arcTo(508,124,4,124,r);g.arcTo(4,124,4,4,r);g.arcTo(4,4,508,4,r);g.closePath();g.fill();if(free)g.setLineDash([18,12]);g.stroke();
 g.fillStyle=free?'#c3c8cf':'#ffffff';g.font='bold '+(free?64:76)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText((free?'≈ ':'')+txt,256,68);const t=new THREE.CanvasTexture(cv);t.name='etykieta';return t}
function holoFix(w){partsNames(w);const E=w.getObjectByName('krawedzie'),P=parts(w);
 if(E&&P.length>1){const mat=E.material;w.remove(E);P.forEach(p=>{const eg=new THREE.EdgesGeometry(p.geometry,25),l=new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:(mat&&mat.color)?mat.color:0x67e8f9,transparent:true,opacity:0.9,toneMapped:false}));l.name='krawedzie_'+p.name;l.raycast=()=>{};p.add(l)})}
 const free=scale.get()=='free',D=w.getObjectByName('wymiary');if(!D)return;
 D.traverse(o=>{if(!o.isMesh)return;if(/^etykieta_/.test(o.name)&&o.userData.txt&&free){const m=o.material.clone();m.map=dimTex(o.userData.txt,true);m.name='holo_etykieta_przybl_'+o.userData.txt;m.needsUpdate=true;o.material=m}
  else if(o.name=='linie_wymiarowe'&&free){const m=o.material.clone();if(m.color)m.color.set(0x8a9099);if(m.emissive)m.emissive.set(0x3a3f46);o.material=m}});D.userData.free=free}
/* grupa eksportowa: arGroup(app) [+ siatka, model podniesiony o 0.5 mm nad siatkę] */
function exportGroup(withGrid,glow){const w=arGroup(false);try{splitParts(w);holoFix(w)}catch(e){console.warn('split',e)}if(withGrid){parts(w).forEach(p=>p.position.y+=GRID_LIFT);w.updateMatrixWorld(true);const gr=grid(box(w),{glow});w.add(gr);w.userData.grid=gr}
 w.updateMatrixWorld(true);return w}
/* skala: 1:1 (domyślnie) / swobodna; trwała w obrębie sesji (sessionStorage) */
const scale={get(){return sessionStorage.getItem('ex_scale')==='free'?'free':'fixed'},set(v){sessionStorage.setItem('ex_scale',v=='free'?'free':'fixed')},
 href(base,mode){base=base.split('#')[0];return mode=='free'?base+'#allowsContentScaling=1':base+'#allowsContentScaling=0'},
 mv(mode){return mode=='free'?'auto':'fixed'},pill(mode){return mode=='free'?T('scWarn'):T('scPill')}};
window.EX={holoFix,dimTex,splitParts,splitMesh,exportGLB,exportUSDZ,gridTex,GLOW,scale,I18N,T,lang,prepare,set,animate,label,grid,parts,box,overlapVol,exportGroup,GRID_LIFT,ease};
})();
