/* hard148 (LOKALNIE): P2 w połowie analizy – po odczycie rzutów/OCR, PRZED prepViews/candidates/rebuild.
   Odpowiedzi zawężają: rodzaj (kind przed candidates), marka „rzut główny” (wybór front), „Rura + wsporniki + płyta” (preferencja kandydata rura+tarcze),
   blacha z grubością >> typowej → pytanie o grubość (mm). Automat testowy: window.__p2Auto={kind,main:[fx,fy],thick}. */
(function(){
function D(){if(window.__p2Dbg)console.log.apply(console,arguments)}
var KM={'Rama (profile zamknięte)':'frame','Rura + wsporniki + płyta':'mixed','Konstrukcja mieszana':'mixed','Konstrukcja blaszana / gięta':'bent','Płaskowniki + płyty':'plate','Kątowniki / ceowniki + płyty':'mixed','Pojedynczy element':'solid','Konstrukcja przestrzenna':'frame'};
function L(){try{return (location.hash.match(/lang=(en|pl|de)/)||[])[1]||localStorage.getItem('oria_lang')||'pl'}catch(e){return 'pl'}}
var TT={pl:['Grubość blachy','Model wychodzi z grubością','mm – to dużo jak na blachę. Podaj grubość [mm]:','Zastosuj','Zostaw'],en:['Sheet thickness','Model thickness is','mm – too much for a sheet. Enter thickness [mm]:','Apply','Keep'],de:['Blechdicke','Modelldicke ist','mm – zu viel für ein Blech. Dicke eingeben [mm]:','Übernehmen','Beibehalten']};
function tt(i){return (TT[L()]||TT.pl)[i]}
function setPre(p,info){window.__p2pre=p;var main=(p.marks||[]).filter(function(k){return k.t==='rzut główny'&&k.x!=null})[0];
 window.__p2MainPt=main&&info&&info.sheet?{x:main.x*info.sheet.width,y:main.y*info.sheet.height}:null;
 D('p2mid: pre',JSON.stringify({kind:p.kind,main:window.__p2MainPt}))}

/* marka „rzut główny” nie trafia w żaden wykryty rzut → dołóż rzut z konturu wokół punktu */
function injectMain(info){var P=window.__p2MainPt,cv=info.cv||window.cv;if(!P||!cv||!info.res||!info.res.views){return;}
 var hit=info.res.views.some(function(v){var Q=v.outlinePolygon||[];if(Q.length<3)return false;var b=polyBB(Q);return b&&P.x>=b.x&&P.x<=b.x+b.w&&P.y>=b.y&&P.y<=b.y+b.h&&b.w*b.h>0.03*info.sheet.width*info.sheet.height});if(hit){return;}
 try{var src=cv.imread(info.sheet),g=new cv.Mat(),mk=new cv.Mat();cv.cvtColor(src,g,cv.COLOR_RGBA2GRAY);cv.adaptiveThreshold(g,mk,255,cv.ADAPTIVE_THRESH_MEAN_C,cv.THRESH_BINARY_INV,51,20);
  var ke=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(3,3));cv.dilate(mk,mk,ke);var cs=new cv.MatVector(),hi=new cv.Mat();cv.findContours(mk,cs,hi,cv.RETR_CCOMP,cv.CHAIN_APPROX_SIMPLE);
  var SA=mk.rows*mk.cols,best=null;for(var i=0;i<cs.size();i++){var c=cs.get(i),r=cv.boundingRect(c),A=r.width*r.height;if(A<SA*0.04||A>SA*0.5||hi.data32S[i*4+3]>=0)continue;if(P.x<r.x||P.x>r.x+r.width||P.y<r.y||P.y>r.y+r.height)continue;
   if(!best||A<best.A){var ap=new cv.Mat();cv.approxPolyDP(c,ap,Math.max(3,Math.max(r.width,r.height)*0.01),true);var Q=[];for(var j=0;j<ap.rows;j++)Q.push([ap.data32S[j*2],ap.data32S[j*2+1]]);ap.delete();best={r:r,A:A,Q:Q}}}
  
  if(best){var inn=null;for(var i2=0;i2<cs.size();i2++){if(hi.data32S[i2*4+3]<0)continue;var c2=cs.get(i2),r2=cv.boundingRect(c2),A2=r2.width*r2.height;if(A2<SA*0.03||A2>=best.A)continue;if(r2.x<best.r.x||r2.y<best.r.y||r2.x+r2.width>best.r.x+best.r.width||r2.y+r2.height>best.r.y+best.r.height)continue;if(P.x<r2.x||P.x>r2.x+r2.width||P.y<r2.y||P.y>r2.y+r2.height)continue;if(!inn||A2>inn.A){var ap2=new cv.Mat();cv.approxPolyDP(c2,ap2,Math.max(2,Math.max(r2.width,r2.height)*0.006),true);var Q2=[];for(var j2=0;j2<ap2.rows;j2++)Q2.push([ap2.data32S[j2*2],ap2.data32S[j2*2+1]]);ap2.delete();inn={r:r2,A:A2,Q:Q2}}}
  if(inn&&inn.Q.length>=3){window.__p2MainOuter=best.r;best=inn;window.__p2MainInner=1;}}
  [src,g,mk,ke,cs,hi].forEach(function(x){x.delete()});if(best&&best.Q.length>=3){info.res.views.push({bbox:{x:best.r.x,y:best.r.y,w:best.r.width,h:best.r.height},outlinePolygon:best.Q,contours:[],angle:0,confidence:90,p2main:1});
   D('p2mid: dołożony rzut główny',JSON.stringify(best.r))}}catch(e){D('p2mid: inject err '+e)}}
window.p2Mid=function(info){window.__p2pre=null;window.__p2MainPt=null;window.__p2MainHit=null;
 var HG=window.OriaP2HardGate,hg=HG?HG.decide(window):'off';if(hg==='hold')return HG.hold(window);
 if(hg==='off'&&(window.__p2MidOff||/(^|[#&])p2=0/.test(location.hash)))return Promise.resolve();
 var A=hg==='off'&&window.__p2Auto;if(A){setPre({kind:A.kind||'auto',marks:A.main?[{t:'rzut główny',x:A.main[0],y:A.main[1]}]:[],iso:A.iso||null,gab:A.gab||null,thick:A.thick||null,auto:1},info);injectMain(info);return Promise.resolve()}
 if(hg==='off'&&(/ask=0/.test(location.hash)||!window.p2CheckpointUI))return Promise.resolve();
 var app=document.getElementById('app'),keep=app.innerHTML,th=null;
 try{var c=document.createElement('canvas'),s=Math.min(1,900/info.sheet.width);c.width=Math.round(info.sheet.width*s);c.height=Math.round(info.sheet.height*s);c.getContext('2d').drawImage(info.sheet,0,0,c.width,c.height);th=c.toDataURL('image/jpeg',.75)}catch(e){}
 var fm={size:[],views:(info.res&&info.res.views)||[],thumb:th,__mid:1};
 return window.p2CheckpointUI(fm).then(function(){if(fm.p2){setPre(fm.p2,info);injectMain(info)}return gabAsk(app)}).then(function(){app.innerHTML=keep;});};
var GT={pl:['Największy gabaryt [mm]','Rama – OCR rzadko czyta skalę z arkusza. Podaj największy wymiar całości (np. 3080), albo pomiń.','Dalej','Pomiń'],en:['Largest overall size [mm]','Frame – OCR rarely reads the scale. Enter the largest overall dimension (e.g. 3080) or skip.','Next','Skip'],de:['Größtes Gesamtmaß [mm]','Rahmen – OCR liest den Maßstab selten. Größtes Gesamtmaß eingeben (z.B. 3080) oder überspringen.','Weiter','Überspringen']};
function gabAsk(app){var p=window.__p2pre;if(!p||KM[p.kind]!=='frame'||+p.gab>0)return Promise.resolve();var g=GT[L()]||GT.pl;
 return new Promise(function(res){app.innerHTML='<h1>⚡</h1><div class="card" id="gabq" style="border:1px solid #9b74f8"><b>'+g[0]+'</b><p class="small">'+g[1]+'</p><input id="gabv" type="number" inputmode="decimal" placeholder="3080" style="width:140px"> <button class="btn" id="gabok">'+g[2]+'</button> <button class="btn sec" id="gabno">'+g[3]+'</button></div>';
  document.getElementById('gabok').onclick=function(){var v=parseFloat(String(document.getElementById('gabv').value).replace(',','.'));if(v>0)p.gab=v;res()};document.getElementById('gabno').onclick=function(){res()};});}
/* zastąp końcowy P2 – pytaliśmy już w połowie */
function wrapEnd(){var o=window.p2Checkpoint;if(!o||o.__mid)return;window.p2CheckpointUI=function(fm){var r=o(fm);return r};
 var w=function(m){if(window.__p2pre){m.p2=window.__p2pre;return Promise.resolve(m)}return o(m)};w.__mid=1;window.p2Checkpoint=w;}
wrapEnd();
/* rebuild: kind z P2 PRZED candidates */
function wrapRebuild(){var o=window.rebuild;if(typeof o!=='function'||o.__mid)return;var w=function(m,kk){var p=window.__p2pre,self=this,args=arguments;
  if(!(p&&!m.__p2preApplied&&p.kind&&p.kind!=='auto'&&KM[p.kind]))return o.apply(self,args);
  var k=KM[p.kind],k0=m.kind,why0=m.kindWhy,r0=o.apply(self,args),auto={kind:m.kind,size:(m.size||[]).slice(),pick:m.pick&&m.pick.name};
  if(auto.kind===k&&p.kind!=='Rura + wsporniki + płyta'){m.p2=p;m.__p2preApplied=1;D('p2mid: P2 zgodny z automatem ('+k+') – zostaje wynik automatu');return r0}
  m.__p2preApplied=1;m.kindFrom=k0;m.kind=k;m.kindWhy=['P2 (w połowie): '+p.kind,'wybrane ręcznie'];m.kindConf=100;m.autoMixed=false;m.p2=p;m.__p2tube=p.kind==='Rura + wsporniki + płyta';
  var r=o.apply(self,args),mx=function(a){return Math.max.apply(null,(a||[0]).map(Number))};
  if(mx(m.size)<0.3*mx(auto.size)){D('p2mid: wynik z P2 zdegenerowany ('+m.size.map(Math.round)+' vs auto '+auto.size.map(Math.round)+') – wracam do automatu, kind z P2 tylko jako etykieta');
   m.kind=k0;m.kindWhy=why0;m.__p2Revert=1;delete m.kindConf;r=o.apply(self,args);m.p2=p;}
  try{if(window.__p2MainPt&&m.pick&&(m.pick.g0||m.pick.g0b)&&m.geo&&m.size){var NV=(m.nums||[]).map(function(n){return n&&n.p&&+n.p.value}).filter(function(v){return v>=50}),kk=[1,1,1],ch=0;
   m.size.forEach(function(sv,i){var b=null;NV.forEach(function(v){var d=Math.abs(sv-v);if(d>0.5&&d<=Math.min(15,0.025*v)&&(!b||d<Math.abs(sv-b)))b=v});if(b){kk[i]=b/sv;ch=1}});
   if(ch){m.geo.scale(kk[0],kk[1],kk[2]);m.geo.computeBoundingBox();var bb=m.geo.boundingBox;m.size=[bb.max.x-bb.min.x,bb.max.y-bb.min.y,bb.max.z-bb.min.z];m.p2Snap=kk;D('p2mid: snap do wymiarów '+kk.map(function(x){return x.toFixed(3)}))}}}catch(e){}
  return r};w.__mid=1;window.rebuild=w}

/* P2: rama + izometria TAK → rama przestrzenna z krawędzi izometrii (zamiast płaskiej ramy / bryły z kreskowania) */
function mergeG(G){var n=0;G=G.map(function(g){return g.index?g.toNonIndexed():g});G.forEach(function(g){n+=g.attributes.position.count});var a=new Float32Array(n*3),o=0;G.forEach(function(g){a.set(g.attributes.position.array,o);o+=g.attributes.position.array.length});var r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(a,3));return r}
function bar(x0,y0,z0,x1,y1,z1,t){var g=new THREE.BoxGeometry(Math.abs(x1-x0)||t,Math.abs(y1-y0)||t,Math.abs(z1-z0)||t);g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);return g}
/* oria154: rzut izo bywa przycięty przez detekcję rzutów (02: bbox x 302..689, a rama sięga x=125). Sylwetka = spójny obszar tuszu wokół rzutu.
   Pudełko aksonometryczne: Wpx=a·cosαa+b·cosαb, Hpx=v+a·sinαa+b·sinαb. Gdy bok a lub b z segmentów jest krótszy niż wynika z sylwetki,
   a drugie równanie (Hpx) zgadza się ≤5% – długość z sylwetki. Oba możliwe → bez zmian + m.__isoAsk. Wyłącznik: window.__noIso154. */
function silh154(m,v,L){if(window.__noIso154)return;var cv=m.info&&m.info.sheet;if(!cv||!cv.getContext)return;var W=cv.width,H=cv.height,d=cv.getContext('2d').getImageData(0,0,W,H).data,N=W*H,ink=new Uint8Array(N),R=3,x,y,k;
 for(var i=0;i<N;i++){var r=d[i*4],g=d[i*4+1],b=d[i*4+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);ink[i]=(mx-mn>40||r+g+b<450)?1:0}
 var t=new Uint8Array(N),dl=new Uint8Array(N);
 for(y=0;y<H;y++){var last=-1e9;for(x=0;x<W;x++){if(ink[y*W+x])last=x;if(x-last<=R)t[y*W+x]=1}last=1e9;for(x=W-1;x>=0;x--){if(ink[y*W+x])last=x;if(last-x<=R)t[y*W+x]=1}}
 for(x=0;x<W;x++){var l2=-1e9;for(y=0;y<H;y++){if(t[y*W+x])l2=y;if(y-l2<=R)dl[y*W+x]=1}l2=1e9;for(y=H-1;y>=0;y--){if(t[y*W+x])l2=y;if(l2-y<=R)dl[y*W+x]=1}}
 var o=v.ob,seen=new Uint8Array(N),st=[];for(y=Math.round(o.y);y<o.y+o.h&&y<H;y+=2)for(x=Math.round(o.x);x<o.x+o.w&&x<W;x+=2){k=y*W+x;if(ink[k]&&!seen[k]){seen[k]=1;st.push(k)}}
 var x0=W,x1=0,y0=H,y1=0;while(st.length){k=st.pop();x=k%W;y=(k-x)/W;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
  if(x>0&&dl[k-1]&&!seen[k-1]){seen[k-1]=1;st.push(k-1)}if(x<W-1&&dl[k+1]&&!seen[k+1]){seen[k+1]=1;st.push(k+1)}if(y>0&&dl[k-W]&&!seen[k-W]){seen[k-W]=1;st.push(k-W)}if(y<H-1&&dl[k+W]&&!seen[k+W]){seen[k+W]=1;st.push(k+W)}}
 var Wp=x1-x0+1-2*R,Hp=y1-y0+1-2*R;if(Wp>0.8*W||Hp>0.8*H){console.log('p2mid: iso154 sylwetka za duża – pomijam');return}
 var sa=0,wa=0,sb=0,wb=0;v.segs.forEach(function(q){if(q.ang>=12&&q.ang<=50){sa+=q.ang*q.len;wa+=q.len}else if(q.ang>=130&&q.ang<=168){sb+=(180-q.ang)*q.len;wb+=q.len}});
 var aa=(wa?sa/wa:30)*Math.PI/180,ab=(wb?sb/wb:30)*Math.PI/180;
 var bN=(Wp-L.a*Math.cos(aa))/Math.cos(ab),aN=(Wp-L.b*Math.cos(ab))/Math.cos(aa);
 var hB=L.v+L.a*Math.sin(aa)+bN*Math.sin(ab),hA=L.v+aN*Math.sin(aa)+L.b*Math.sin(ab);
 var okB=bN>L.b*1.05&&Math.abs(hB-Hp)/Hp<=0.05,okA=aN>L.a*1.05&&Math.abs(hA-Hp)/Hp<=0.05;
 var rep={view:[o.x,o.y,o.w,o.h].map(Math.round),silh:[x0+R,y0+R,Wp,Hp],ang:[aa,ab].map(function(z){return Math.round(z*1800/Math.PI)/10}),L0:{a:Math.round(L.a),b:Math.round(L.b),v:L.v},bN:Math.round(bN),hB:Math.round(hB),aN:Math.round(aN),hA:Math.round(hA)};
 if(okB&&!okA){L.b=bN;rep.use='b z sylwetki'}else if(okA&&!okB){L.a=aN;rep.use='a z sylwetki'}else if(okA&&okB){m.__isoAsk='niejednoznaczne (a i b)';rep.use='konflikt – bez zmian'}else{rep.use='bez zmian'}
 m.__iso154=rep;console.log('p2mid: iso154 '+JSON.stringify(rep))}
function isoFrame(m,C){var V=m.V||{},vs=[V.front,V.side,V.top].concat(V.all||[]).filter(function(v){return v&&v.segs&&v.segs.length});if(!vs.length)return null;
 vs.sort(function(a,b){return (b.isoFrac||0)*b.ob.w*b.ob.h-(a.isoFrac||0)*a.ob.w*a.ob.h});var v=vs[0],L={a:0,b:0,v:0};
 v.segs.forEach(function(q){var a=q.ang;if(a>=12&&a<=50)L.a=Math.max(L.a,q.len);else if(a>=130&&a<=168)L.b=Math.max(L.b,q.len);else if(Math.abs(a-90)<8)L.v=Math.max(L.v,q.len)});
 try{silh154(m,v,L)}catch(e){console.log('p2mid: iso154 err '+e)}
 if(!(L.a>0.15*v.ob.w&&L.b>0.1*v.ob.w&&L.v>0.15*v.ob.h))return null;
 var fr=C.filter(function(c){return /^rama z profili$/.test(c.name)&&c.geo})[0],k=1;if(fr){fr.geo.computeBoundingBox();var b=fr.geo.boundingBox;k=Math.max(b.max.x-b.min.x,b.max.y-b.min.y)/Math.max(v.ob.w,v.ob.h)||1;}
 var W=L.a/0.866*k,D=L.b/0.866*k,H=L.v*k,gab=window.__p2pre&&+window.__p2pre.gab;var t=Math.max(20,Math.round(0.02*Math.max(W,D,H,gab||0)/5)*5);if(gab>0){var f=(gab-t)/Math.max(W,D,H);W*=f;D*=f;H*=f}
 var G=[],xs=[0,W],zs=[0,D];
 xs.forEach(function(x){zs.forEach(function(z){G.push(bar(x,0,z,x,H,z,t))})});
 [0,H].forEach(function(y){zs.forEach(function(z){G.push(bar(0,y,z,W,y,z,t))});xs.forEach(function(x){G.push(bar(x,y,0,x,y,D,t))})});
 if(W>1.5*H){G.push(bar(W/2,0,0,W/2,H,0,t));G.push(bar(W/2,0,D,W/2,H,D,t))}
 var np=0,pu=[];if(!window.__noIsoPosts){try{var lv=v.segs.filter(function(q){return Math.abs(q.ang-90)<8&&q.len>=0.6*L.v}).map(function(q){var cx=(q.a[0]+q.b[0])/2;return {x:cx,bt:Math.max(q.a[1],q.b[1])}});
  if(lv.length>=3){var c0=v.segs.filter(function(q){return Math.abs(q.ang-90)<8&&q.len>=0.15*L.v}).map(function(q){return {x:(q.a[0]+q.b[0])/2,bt:Math.max(q.a[1],q.b[1])}}).sort(function(p,q){return q.bt-p.bt})[0].x,x1=Math.max.apply(0,lv.map(function(q){return q.x})),span=x1-c0;
   if(span>0.5*L.a*Math.cos(25*Math.PI/180)){var xs2=lv.map(function(q){return q.x}).filter(function(x){var u=(x-c0)/span;return u>0.1&&u<0.9}).sort(function(p,q){return p-q}),cl=[];
    xs2.forEach(function(x){var l=cl[cl.length-1];if(l&&x-l.m<15){l.s+=x;l.n++;l.m=l.s/l.n}else cl.push({s:x,n:1,m:x})});
    cl.filter(function(c){return c.n>=2}).forEach(function(c){var u=(c.m-c0)/span;if(W>1.5*H&&Math.abs(u-0.5)<0.08)return;pu.push(+u.toFixed(2));G.push(bar(u*W,0,0,u*W,H,0,t));np++})}}}catch(e){console.log('p2mid: isoPosts err '+e)}}
 window.__isoMembers={bars:G.length,posts:np,u:pu};console.log('p2mid: isoMembers '+JSON.stringify(window.__isoMembers));
 var g=mergeG(G);g=window.finalize?window.finalize(g):g;return {name:'rama przestrzenna (P2 + izometria)',geo:g,how:'P2: rama + izometria – krawędzie izo '+[L.a,L.b,L.v].map(Math.round).join('/')+' px → '+[W,H,D].map(Math.round).join('×')+' mm'+(gab>0?' (gabaryt z P2)':' (skala z rysunku – sprawdź)')+', profil '+t+'×'+t+(np?' · '+np+' słupki pośrednie z izo (przód)':''),force:1,p2iso:1}}
window.__p2isoFrame=isoFrame;/* t937u: eksport dla iso_ref_first.js */
/* candidates: zawężenie wg P2 */

/* 05: płyty z rzutów (P2 płaskowniki+płyty, gruba bryła → cienkie płyty) */
function shp(P,fx,fy){var S=new THREE.Shape(P.map(function(q){return new THREE.Vector2(fx(q),fy(q))}));return S}
function platesCand(m,C){var V=m.V||{},F=V.front,T=V.top,k=m.mmpx,p=window.__p2pre||{};if(!F||!T||!F.poly||!T.poly||!(k>0))return null;
 var t=+p.thick||10,W=F.ob.w*k,H=F.ob.h*k,Dp=T.ob.h*k;if(Math.min(W,H,Dp)<=3*t)return null;
 var sF=shp(F.poly,function(q){return (q[0]-F.ob.x)*k},function(q){return (F.ob.y+F.ob.h-q[1])*k});(F.__ph||[]).forEach(function(P){sF.holes.push(new THREE.Path(P.map(function(q){return new THREE.Vector2((q[0]-F.ob.x)*k,(F.ob.y+F.ob.h-q[1])*k)})))});
 var gA=new THREE.ExtrudeGeometry(sF,{depth:t,bevelEnabled:false,curveSegments:4});
 var hs=(F.segs||[]).filter(function(g){return (g.ang<5||g.ang>175)&&g.len>F.ob.w*0.35&&Math.min(g.a[1],g.b[1])>F.ob.y+F.ob.h*0.12&&Math.max(g.a[1],g.b[1])<F.ob.y+F.ob.h*0.95}).sort(function(a,b){return b.len-a.len});
 var yS=hs.length?(hs[0].a[1]+hs[0].b[1])/2:F.ob.y+F.ob.h*0.5,yP=(F.ob.y+F.ob.h-yS)*k;
 var dx=(T.ob.x-F.ob.x)*k,sT=shp(T.poly,function(q){return (q[0]-T.ob.x)*k+dx},function(q){return (q[1]-T.ob.y)*k});
 var gB=new THREE.ExtrudeGeometry(sT,{depth:t,bevelEnabled:false,curveSegments:4});gB.rotateX(Math.PI/2);gB.translate(0,yP+t/2,0);
 var g=mergeG([gA,gB]);g=window.finalize?window.finalize(g):g;g.computeBoundingBox();var b=g.boundingBox;
 return {name:'płyty z rzutów (P2: płaskowniki + płyty, t='+t+')',geo:g,how:'P2 płaskowniki+płyty: płyta pionowa z obrysu przodu ('+Math.round(W)+'×'+Math.round(H)+') + płyta pozioma z obrysu góry ('+Math.round(T.ob.w*k)+'×'+Math.round(Dp)+') na wys. '+Math.round(yP)+' mm, grubość '+t+' mm',force:1,p2plates:1,thick:t}}
function wrapCand(){var o=window.candidates;if(typeof o!=='function'||o.__mid)return;var w=function(m){var C=o.apply(this,arguments);var p=window.__p2pre;D('p2mid: kandydaci '+C.map(function(c){return c.name+(c.geo&&c.geo.boundingBox?'':'')}).join(' | '));if(!p||!m.__p2preApplied||m.__p2Revert)return C;if(m.kind==='frame'&&p.iso&&!/^(nie|no|0)$/i.test(String(p.iso))){try{var IF=isoFrame(m,C);if(IF){C.unshift(IF);m.__p2Narrow=[IF.name];D('p2mid: '+IF.how);return C}}catch(e){D('p2mid: isoFrame err '+e)}}
  if(m.kind==='plate'&&window.__p2pre&&window.__p2pre.kind==='Płaskowniki + płyty'){try{var PC=platesCand(m,C);if(PC){C.unshift(PC);m.__p2Narrow=[PC.name];m.thickChoice=PC.thick;m.__thAsked=1;D('p2mid: '+PC.how);return C}}catch(e){D('p2mid: plates err '+e)}}
  var re=m.__p2tube?/rur|tarcz|tulej|obrot/i:m.kind==='bent'?/gięt|blach/i:m.kind==='plate'?/blach|płyt|g0|wyciągnięcie przodu/i:m.kind==='frame'?/ram|profil/i:null;
  if(re){var hit=C.filter(function(c){return re.test(c.name||'')||(m.kind==='plate'||m.kind==='bent')&&(c.g0||c.g0b)});
   if(hit.length){C.splice(0,C.length,...hit.concat(C.filter(function(c){return hit.indexOf(c)<0})));if(m.__p2tube||m.kind==='frame'){hit[0].force=1;}m.__p2Narrow=hit.map(function(c){return c.name});D('p2mid: zawężone',m.__p2Narrow.join(' | '))}}
  return C};w.__mid=1;window.candidates=w}
wrapRebuild();wrapCand();
/* grubość blachy: STOP + pytanie (przed wynikiem; przed dimConflict) */
function scaleAx(m,i,f){var k=[1,1,1];k[i]=f;m.geo.scale(k[0],k[1],k[2]);m.geo.computeBoundingBox();var c=m.geo.boundingBox;m.size=[c.max.x-c.min.x,c.max.y-c.min.y,c.max.z-c.min.z];if(m.mesh){m.mesh.W=m.size[0];m.mesh.H=m.size[1];m.mesh.D=m.size[2]}}
function thickSus(m){if(!m||m.kind!=='plate'||!m.size||!m.geo)return null;var a=[0,1,2].map(function(i){return {i:i,s:+m.size[i]||0}}).sort(function(x,y){return y.s-x.s});var t=a[2];if(t.s>25||t.s>0.08*a[1].s)return t;return null}
function wrapShow(){var o=window.showAuto2;if(!o||o.__th)return;var w=function(m){var self=this,args=arguments,t=null;
  if(m&&!m.__thAsked){m.__thAsked=1;t=thickSus(m)}
  if(!t)return o.apply(self,args);
  var A=window.__p2Auto,TK=(A&&A.thick)||(window.__p2pre&&+window.__p2pre.thick);if(TK>0){var f0=TK/t.s;scaleAx(m,t.i,f0);m.thickChoice=TK;m.__thickFrom=Math.round(t.s);try{window.__autoResult=sum2(m)}catch(e){}return o.apply(self,args)}
  var app=document.getElementById('app');app.innerHTML='<h1>⚡</h1><div class="card" id="thq" style="border:1px solid #9b74f8"><b>'+tt(0)+'</b><p class="small">'+tt(1)+' '+Math.round(t.s)+' '+tt(2)+'</p><input id="thv" type="number" inputmode="decimal" placeholder="4" style="width:120px"> <button class="btn" id="thok">'+tt(3)+'</button> <button class="btn sec" id="thno">'+tt(4)+'</button></div>';
  document.getElementById('thok').onclick=function(){var v=parseFloat(String(document.getElementById('thv').value).replace(',','.'));if(v>0){scaleAx(m,t.i,v/t.s);m.thickChoice=v;m.__thickFrom=Math.round(t.s);try{window.__autoResult=sum2(m)}catch(e){}}o.apply(self,args)};
  document.getElementById('thno').onclick=function(){o.apply(self,args)};};
 w.__th=1;window.showAuto2=w}
window.addEventListener('load',function(){setTimeout(function(){wrapRebuild();wrapCand();wrapEnd();wrapShow()},0)});
})();
/* F2 (f2_lines, offline python) lokalnie: kontur ≠ wymiar/pomocnicza. Włącz: __p2Auto.f2=1 / localStorage oria_f2=1 / #f2=1 */
(function(){function on(){try{return (window.__p2Auto&&window.__p2Auto.f2)||localStorage.getItem('oria_f2')==='1'||/[#&]f2=1/.test(location.hash)}catch(e){return 0}}
 function D(){if(window.__p2Dbg)console.log.apply(console,arguments)}
 function load(){if(!on())return Promise.resolve();var mm=decodeURIComponent((location.hash.match(/img=([^&]+)/)||[])[1]||'').match(/([^\/]+)\.(jpe?g|png)$/i);if(!mm)return Promise.resolve();
  return fetch('f2/'+mm[1]+'.sheet.json').then(function(r){return r.ok?r.json():null}).then(function(j){window.__f2=j;D('p2mid: F2 wczytane '+(j?j.lines.length:0)+' linii')}).catch(function(){})}
 function dps(p,s){var ax=s[0],ay=s[1],bx=s[2],by=s[3],dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p[0]-ax)*dx+(p[1]-ay)*dy)/l)):0;return Math.hypot(p[0]-ax-t*dx,p[1]-ay-t*dy)}
 function near(p,LL,r){for(var i=0;i<LL.length;i++)if(dps(p,LL[i])<r)return 1;return 0}
 function clean(m){var J=window.__f2;if(!J||m.__f2done||!m.V)return;m.__f2done=1;var K=J.lines.filter(function(l){return l.cls==='kontur'}).map(function(l){return l.s}),N=J.lines.filter(function(l){return l.cls!=='kontur'}).map(function(l){return l.s});
  var V=m.V,vs=[];[V.front,V.top,V.side].concat(V.all||[],V.ortho||[]).forEach(function(v){if(v&&v.ob&&vs.indexOf(v)<0)vs.push(v)});var rep=[];
  vs.forEach(function(v){var o=v.ob,r={ob0:[o.x,o.y,o.w,o.h].map(Math.round),s0:(v.segs||[]).length};
   if(v.segs){v.segs=v.segs.filter(function(g){var c=[(g.a[0]+g.b[0])/2,(g.a[1]+g.b[1])/2];return !(near(c,N,4)&&!near(c,K,4))})}r.s1=(v.segs||[]).length;
   var ins=K.filter(function(s){return s[0]>=o.x-4&&s[2]>=o.x-4&&s[0]<=o.x+o.w+4&&s[2]<=o.x+o.w+4&&s[1]>=o.y-4&&s[3]>=o.y-4&&s[1]<=o.y+o.h+4&&s[3]<=o.y+o.h+4});
   if(ins.length>=3){var xs=[],ys=[];ins.forEach(function(s){xs.push(s[0],s[2]);ys.push(s[1],s[3])});var x0=Math.max(o.x,Math.min.apply(0,xs)-3),y0=Math.max(o.y,Math.min.apply(0,ys)-3),x1=Math.min(o.x+o.w,Math.max.apply(0,xs)+3),y1=Math.min(o.y+o.h,Math.max.apply(0,ys)+3);
    if((x1-x0)*(y1-y0)>=0.6*o.w*o.h&&((x1-x0)<o.w-4||(y1-y0)<o.h-4)){var nb={x:x0,y:y0,w:x1-x0,h:y1-y0};v.ob=nb;if(v.poly)v.poly=v.poly.map(function(p){return [Math.max(x0,Math.min(x1,p[0])),Math.max(y0,Math.min(y1,p[1]))]});r.ob1=[x0,y0,x1-x0,y1-y0].map(Math.round)}}
   rep.push(r)});m.__f2rep=rep;D('p2mid: F2 '+JSON.stringify(rep))}
 window.__f2Clean=clean;
 var pm=window.p2Mid;if(pm&&!pm.__f2){var w=function(info){return load().then(function(){return pm(info)})};w.__f2=1;window.p2Mid=w}
 function wc(){var o=window.classify;if(typeof o!=='function'||o.__f2)return;var w=function(m){try{clean(m)}catch(e){D('p2mid: F2 err '+e)}return o.apply(this,arguments)};w.__f2=1;window.classify=w}
 wc();window.addEventListener('load',function(){setTimeout(wc,0)});})();
/* F2 wcześniej: prepViews – obrys widoku docięty do konturu F2 przed segsIn/thinness */
(function(){function D(){if(window.__p2Dbg)console.log.apply(console,arguments)}
 function bb(Q){var xs=Q.map(function(p){return p[0]}),ys=Q.map(function(p){return p[1]});var x=Math.min.apply(0,xs),y=Math.min.apply(0,ys);return {x:x,y:y,w:Math.max.apply(0,xs)-x,h:Math.max.apply(0,ys)-y}}
 function wp(){var o=window.prepViews;if(typeof o!=='function'||o.__f2)return;var w=function(cv,info){var J=window.__f2,rep=[];
  if(J&&info&&info.res&&info.res.views){var K=J.lines.filter(function(l){return l.cls==='kontur'}).map(function(l){return l.s});
   info.res.views.forEach(function(v){var Q=v.outlinePolygon;if(!Q||Q.length<3||v.p2main)return;var b=bb(Q),m=4;if(b.w*b.h<0.05*info.sheet.width*info.sheet.height){rep.push('skip<5%:'+[b.x,b.y,b.w,b.h].map(Math.round).join(','));return}
    var ins=K.filter(function(s){return Math.min(s[0],s[2])>=b.x-m&&Math.max(s[0],s[2])<=b.x+b.w+m&&Math.min(s[1],s[3])>=b.y-m&&Math.max(s[1],s[3])<=b.y+b.h+m});if(ins.length<3)return;
    var xs=[],ys=[];ins.forEach(function(s){xs.push(s[0],s[2]);ys.push(s[1],s[3])});var x0=Math.max(b.x,Math.min.apply(0,xs)-2),y0=Math.max(b.y,Math.min.apply(0,ys)-2),x1=Math.min(b.x+b.w,Math.max.apply(0,xs)+2),y1=Math.min(b.y+b.h,Math.max.apply(0,ys)+2);
    var A=(x1-x0)*(y1-y0);if(A<0.5*b.w*b.h||((x1-x0)>b.w*0.98&&(y1-y0)>b.h*0.98))return;
    v.f2Pre=Q;v.outlinePolygon=Q.map(function(p){return [Math.max(x0,Math.min(x1,p[0])),Math.max(y0,Math.min(y1,p[1]))]});if(v.bbox)v.bbox={x:x0,y:y0,w:x1-x0,h:y1-y0};
    rep.push([b.x,b.y,b.w,b.h].map(Math.round).join(',')+'→'+[x0,y0,x1-x0,y1-y0].map(Math.round).join(','))});D('p2mid: F2 prepViews '+JSON.stringify(rep))}
  var r=o.apply(this,arguments);return r};w.__f2=1;window.prepViews=w}
 wp();window.addEventListener('load',function(){setTimeout(wp,0)});})();
