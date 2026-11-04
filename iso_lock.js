// t945 A1+A2 ISO-lock (gałąź testowa fix/a1a2-iso-lock). Wyłączniki: window.__isoPickLock=false | #isolock=0 ; __noIsoThin ; __noIsoLockStatus
(function(){
var off=function(){return window.__isoPickLock===false||/[#&]isolock=0/.test(location.hash)};
var L=function(){try{console.log.apply(console,['isolock:'].concat([].slice.call(arguments)))}catch(e){}};
// (3) cienkie linie: gdy żaden widok nie jest iso – skan arkusza z niższym progiem
window.__isoThinScan=function(cv,info,V,segsIn){if(off()||window.__noIsoThin||!info||!info.sheet)return;if(V.some(function(v){return v.iso}))return;
 var sh=info.sheet,W=sh.width,H=sh.height;try{
 var c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(sh,0,0);var m=cv.imread(c),g=new cv.Mat(),bw=new cv.Mat(),ls=new cv.Mat();cv.cvtColor(m,g,cv.COLOR_RGBA2GRAY);cv.adaptiveThreshold(g,bw,255,cv.ADAPTIVE_THRESH_MEAN_C,cv.THRESH_BINARY_INV,15,6);
 cv.HoughLinesP(bw,ls,1,Math.PI/180,20,Math.max(12,Math.min(W,H)*0.025),2);
 var S=[];for(var i=0;i<ls.rows;i++){var x1=ls.data32S[i*4],y1=ls.data32S[i*4+1],x2=ls.data32S[i*4+2],y2=ls.data32S[i*4+3],a=Math.atan2(-(y2-y1),x2-x1)*180/Math.PI;if(a<0)a+=180;S.push({a:[x1,y1],b:[x2,y2],ang:a,len:Math.hypot(x2-x1,y2-y1)});}
 m.delete();g.delete();bw.delete();ls.delete();
 var isoA=function(a){return (a>8&&a<42)||(a>138&&a<172)};var ort=function(a){return a<6||a>174||Math.abs(a-90)<6};
 // siatka 16x16: udział iso w komórkach, potem największy spójny obszar komórek z iso
 var N=16,cw=W/N,chh=H/N,ci=[],co=[];for(var k=0;k<N*N;k++){ci.push(0);co.push(0);}
 S.forEach(function(q){var cx=Math.min(N-1,Math.floor((q.a[0]+q.b[0])/2/cw)),cy=Math.min(N-1,Math.floor((q.a[1]+q.b[1])/2/chh));if(isoA(q.ang))ci[cy*N+cx]+=q.len;else if(ort(q.ang))co[cy*N+cx]+=q.len;});
 var inV=function(x,y){return V.some(function(v){return !v.profOnly&&x>=v.ob.x-cw*0.3&&x<=v.ob.x+v.ob.w+cw*0.3&&y>=v.ob.y-chh*0.3&&y<=v.ob.y+v.ob.h+chh*0.3})};
 var hot=ci.map(function(v,k){var x=(k%N+0.5)*cw,y=(Math.floor(k/N)+0.5)*chh;return v>cw*0.6&&v>co[k]*0.35&&!inV(x,y)});
 var seen={},best=null;for(var k=0;k<N*N;k++){if(!hot[k]||seen[k])continue;var st=[k],cl=[];seen[k]=1;while(st.length){var u=st.pop();cl.push(u);var ux=u%N,uy=Math.floor(u/N);for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var nx=ux+dx,ny=uy+dy,n=ny*N+nx;if(nx<0||ny<0||nx>=N||ny>=N||seen[n]||!hot[n])continue;seen[n]=1;st.push(n);}}
  var Li=0,Lo=0;cl.forEach(function(u){Li+=ci[u];Lo+=co[u]});if(!best||Li>best.Li)best={cl:cl,Li:Li,Lo:Lo};}
 window.__isoGrid={ci:ci.map(Math.round),co:co.map(Math.round),cw:cw};if(!best||best.cl.length<4)return L('thin: brak klastra iso',best&&best.cl.length);
 var xs=best.cl.map(function(u){return u%N}),ys=best.cl.map(function(u){return Math.floor(u/N)});var ob={x:Math.min.apply(0,xs)*cw,y:Math.min.apply(0,ys)*chh,w:(Math.max.apply(0,xs)-Math.min.apply(0,xs)+1)*cw,h:(Math.max.apply(0,ys)-Math.min.apply(0,ys)+1)*chh};
 var fr=best.Li/(best.Li+best.Lo);if(fr<0.3||ob.w*ob.h<W*H*0.03)return L('thin: klaster za słaby',fr.toFixed(2),best.cl.length);
 var nv={i:-1,bb:null,poly:[[ob.x,ob.y],[ob.x+ob.w,ob.y],[ob.x+ob.w,ob.y+ob.h],[ob.x,ob.y+ob.h]],ob:ob,contours:[],comp:4,segs:S.filter(function(q){var x=(q.a[0]+q.b[0])/2,y=(q.a[1]+q.b[1])/2;return x>=ob.x&&x<=ob.x+ob.w&&y>=ob.y&&y<=ob.y+ob.h}),iso:true,isoThin:1,isoFrac:fr};
 V.push(nv);window.__isoThin={ob:[ob.x,ob.y,ob.w,ob.h].map(Math.round),fr:+fr.toFixed(2),cells:best.cl.length};L('thin: ISO z cienkich linii',JSON.stringify(window.__isoThin));
 }catch(e){L('thin err '+e)}};
// (1)+(2) ISO-lock + weto ISO vs G0/viou/force
window.__isoLockPick=function(m,C,pick){if(off()||!m||!m.V||!m.V.iso||!C||!C.length)return pick;var bi=C.filter(function(c){return c.geo&&c.iou!=null}).sort(function(a,b){return b.iou-a.iou})[0];
 m.isoLock={on:1,bi:bi&&bi.name,biou:bi&&+(+bi.iou).toFixed(2),pick0:pick&&pick.name,piou:pick&&pick.iou!=null?+(+pick.iou).toFixed(2):null,thin:!!m.V.iso.isoThin};
 if(!bi||!(bi.iou>=0.3)||pick===bi)return pick;
 if(pick&&pick.iou!=null&&pick.iou>=bi.iou-0.05){m.isoLock.keep='pick bliski ISO';return pick;}
 m.isoLock.veto=(pick===m.__forceG0||pick===m.__g0Soft)?'G0':'viou/override';m.isoLock.pick=bi.name;L('veto',m.isoLock.veto,pick&&pick.name,'->',bi.name,bi.iou);
 if(pick&&(pick.g0||pick.g0b)&&(m.kindWhy||[]).indexOf('wybrane ręcznie')<0&&/^G0:/.test((m.kindWhy||[])[0]||'')){m.kind=m.kindFrom||m.kind;}
 return bi};
// (4) status: ISO jest na arkuszu, a bryła z G0 / samych rzutów
function wrap(){var o=window.rebuild;if(typeof o!=='function'||o.__isoLock)return;var w=function(m){var r=o.apply(this,arguments);try{if(!off()&&!window.__noIsoLockStatus&&m&&m.V&&m.V.iso&&m.pick){var p=m.pick,iou=p.iou,src=null;
 if(p.g0||p.g0b||/^blacha z obrysu/.test(p.name||''))src='G0';else if(/^(przecięcie rzutów|wyciągnięcie )/.test(p.name||''))src='rzuty';
 if(src){var R=m.isoRef||(m.isoRef={status:'OK',hint:null,notes:[]});R.notes=R.notes||[];var weak=!(iou>=0.3);var st=(src&&weak)||(m.V.iso.isoThin&&weak)?'NEEDS_REVIEW':'APPROXIMATE';
  var note='ISO-lock: izometria na arkuszu'+(m.V.iso.isoThin?' (cienkie linie)':'')+', bryła z '+(src||'kandydata')+' (iou '+(iou==null?'?':(+iou).toFixed(2))+')';
  if(R.status==='OK'||(R.status==='APPROXIMATE'&&st==='NEEDS_REVIEW')){R.status=st;R.approx=1;R.src=R.src||'isolock';if(st==='NEEDS_REVIEW'){R.match='UNKNOWN';R.toP2=1;}}
  if(R.notes.indexOf(note)<0)R.notes.push(note);if(String(p.how||'').indexOf(R.status)<0)p.how=R.status+' · '+(p.how||'');m.isoLock=m.isoLock||{};m.isoLock.status=R.status;L('status',R.status,note);}}}catch(e){L('err '+e)}return r};w.__isoLock=1;w.__isoRef=o.__isoRef;w.__mid=o.__mid;window.rebuild=w}
window.addEventListener('load',function(){setTimeout(function(){setTimeout(function(){setTimeout(wrap,0)},0)},0)});
})();
// A3.1: ISO-topologia → interpretacja rzutów. Rama płaska z ISO: największy rzut to PLAN (widok z góry), cienki rzut o tej samej szerokości to widok z przodu/przekrój → zamiana front/top przy liczeniu zgodności rzutów dla kandydata a3swap.
window.__a3Viou=function(m,C){if(window.__a3Gen===false||/[#&]a3=0/.test(location.hash)||!m||!m.V||!m.V.iso||!m.V.front||!m.V.top||typeof viewIoU!=='function')return;
 var F=m.V.front.ob,T=m.V.top.ob;if(!(T.h<0.35*F.h&&Math.abs(T.w-F.w)<0.35*F.w))return;
 C.forEach(function(c){if(!c.a3swap||!c.geo)return;var f0=m.V.front,t0=m.V.top;try{m.V.front=t0;m.V.top=f0;var gg=c.geo.clone();if(!window.__a3Rot)gg.rotateY(Math.PI/2);gg.computeBoundingBox();var r=viewIoU(m,gg,m.kind=='frame'||m.kind=='mixed');var v=r.length?r.reduce(function(s,x){return s+x.iou},0)/r.length:0;}finally{m.V.front=f0;m.V.top=t0;}
  console.log('isolock: a3 swap viou',c.name,(c.viou||0).toFixed(2),'->',v.toFixed(2));if(v>(c.viou||0)){c.viou0=c.viou;c.viou=v;c.vi=r;c.a3=1;m.a3={swap:1,viou0:+(c.viou0||0).toFixed(2),viou:+v.toFixed(2)};c.how=(c.how||'')+' · A3: rzuty jako plan/przekrój wg izometrii (zgodność '+v.toFixed(2)+')';}});};
// A3.2: 06 – blacha gięta z ISO + cienki rzut boczny + G0 (obrys/okna). Flagi: __a3Gen=false/#a3=0, __noA3Bent
window.__a3Bent=function(m,C){if(window.__a3Gen===false||/[#&]a3=0/.test(location.hash)||window.__noA3Bent||!m||!m.V||!m.V.iso||!window.THREE)return;
 var g0=C.filter(function(c){return c.g0&&(c.g0h||0)>=2&&c.geo})[0];if(!g0)return;
 var sv=(m.V.ortho||[]).concat([m.V.side,m.V.top,m.V.front]).filter(function(v){return v&&!v.iso&&v.ob&&v.ob.w<0.25*v.ob.h})[0];if(!sv)return m.a3b={skip:'brak cienkiego rzutu'};
 var T=String(m.allText||'');var nums=(m.nums||[]).map(function(n){return n.p&&+n.p.value}).filter(function(v){return v>0});var has=function(v){return nums.indexOf(v)>=0||new RegExp('\\b'+v+'\\b').test(T)};
 g0.geo.computeBoundingBox();var B=g0.geo.boundingBox,ex=[B.max.x-B.min.x,B.max.y-B.min.y,B.max.z-B.min.z],ax=['x','y','z'];var it=ex.indexOf(Math.min.apply(0,ex));var rest=[0,1,2].filter(function(i){return i!==it});
 var ih=ex[rest[0]]<ex[rest[1]]?rest[0]:rest[1],iw=ih===rest[0]?rest[1]:rest[0];var t=ex[it]||4,W=ex[iw],H=ex[ih];
 var H2=has(560)?560:H,ft=has(40)?40:Math.round(0.07*H2),fb=has(46)?46:Math.round(0.08*H2),sc=H2/H;
 var src=g0.geo.index?g0.geo.toNonIndexed():g0.geo.clone();
 /* R16: łuk gięcia parametrycznie (R z OCR 'R16'/wymiaru albo szacunek 4·t). Flaga: __noA3R16 / #r16=0 */
 var rOn=!window.__noA3R16&&!/[#&]r16=0/.test(location.hash),rm=T.match(/\bR\s?(\d{1,2})\b/),rv=rm?+rm[1]:(has(16)&&/R\s?16/.test(T)?16:0),RB=rOn?(rv>=2&&rv<=40?rv:Math.round(4*t)):0,Rsrc=rv>=2&&rv<=40?'rysunek (OCR R'+rv+')':'szacunek 4·t';
 function mk(sign){var G=[src.clone()];function box(dw,dh,dt,cw,chh,ct){var s=[0,0,0],c=[0,0,0];s[iw]=dw;s[ih]=dh;s[it]=dt;c[iw]=cw;c[ih]=chh;c[it]=ct;var g=new THREE.BoxGeometry(s[0],s[1],s[2]);g.translate(c[0],c[1],c[2]);return g.index?g.toNonIndexed():g}
  var mn=[B.min.x,B.min.y,B.min.z],mx=[B.max.x,B.max.y,B.max.z],cw=(mn[iw]+mx[iw])/2,base=sign>0?mx[it]:mn[it];
  function arc(cH,cT,a0,a1,r1,r2){var N=8,P=[],w0=cw-W*0.45,w1=cw+W*0.45;function v(a,r,w){var q=[0,0,0];q[iw]=w;q[ih]=cH+r*Math.cos(a);q[it]=cT+r*Math.sin(a);return q}function quad(A,B2,C2,D2){P.push.apply(P,A.concat(B2,C2,A,C2,D2))}
   for(var j=0;j<N;j++){var b0=a0+(a1-a0)*j/N,b1=a0+(a1-a0)*(j+1)/N;quad(v(b0,r2,w0),v(b1,r2,w0),v(b1,r2,w1),v(b0,r2,w1));quad(v(b0,r1,w1),v(b1,r1,w1),v(b1,r1,w0),v(b0,r1,w0));quad(v(b0,r1,w0),v(b1,r1,w0),v(b1,r2,w0),v(b0,r2,w0));quad(v(b0,r2,w1),v(b1,r2,w1),v(b1,r1,w1),v(b0,r1,w1));}
   var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));return g}
  var R=RB,o0=arguments[1]||{};if(R){var P0=G[0].attributes.position.array,lo=mn[ih]+t+R,hi=mx[ih]-t-R;for(var i0=ih;i0<P0.length;i0+=3){if(P0[i0]>hi)P0[i0]=hi;if(P0[i0]<lo&&!(o0.k45))P0[i0]=lo;}}
  G.push(box(W*0.9,t,ft-R,cw,mx[ih]-t/2,base+sign*(R+ft)/2));G.push(box(W*0.9,t,fb-(o0.k45?0:R),cw,mn[ih]+t/2,base+sign*(fb+(o0.k45?0:R))/2));
  var A90=Math.PI/2;if(R){G.push(arc(mx[ih]-t-R,base+sign*R,-sign*A90,0,R,R+t));}
  var iArcB=-1;if(R&&!o0.k45){iArcB=G.length;G.push(arc(mn[ih]+t+R,base+sign*R,-sign*A90,-Math.PI*(sign>0?1:-1)+(sign>0?0:0),R,R+t));}
  var g0pl=[],tw;var hb=has(280)?280/sc:0.5*H,yj=mn[ih]+hb,jg=(has(20)?20:0)/1,o=arguments[1]||{};
  if(o.jog&&hb>0){var P=G[0].attributes.position.array;for(var i=0;i<P.length;i+=9){var cy=(P[i+ih]+P[i+3+ih]+P[i+6+ih])/3;if(cy<yj)for(var k=0;k<9;k+=3)P[i+k+it]+=o.jog*jg;}
   G.push(box(W*0.9,t,jg,cw,yj,base+(o.jog>0?0:-jg)+jg/2-(sign>0?t/2:-t/2)));for(var q=1;q<G.length;q++){var Pq=G[q].attributes.position.array;if(q===2||q===iArcB)for(var i2=0;i2<Pq.length;i2+=3)Pq[i2+it]+=o.jog*jg;}}
  if(o.k45){var gb=G[2],L=fb*Math.SQRT2,bx=box(W*0.9,L,t,0,0,0);var r=new THREE.Matrix4();var e=[0,0,0];e[iw]=1;r.makeRotationAxis(new THREE.Vector3(e[0],e[1],e[2]),sign*Math.PI/4*(iw===0?-1:1));bx.applyMatrix4(r);var c3=[0,0,0];c3[iw]=cw;c3[ih]=mn[ih]+fb/2;c3[it]=base+sign*fb/2;bx.translate(c3[0],c3[1],c3[2]);G[2]=bx;}
  if(o.lip){G.push(box(W*0.9,9,t,cw,mx[ih]+4.5,base+sign*(ft-t/2)));}
  if(o.tabs){tw=has(60)?60:0.1*W,th=20,xs=[-0.32,0,0.32];xs.forEach(function(f){G.push(box(tw,th,t,cw+f*W,mn[ih]-th/2,base+sign*fb+(o.jog||0)*jg-sign*t/2))});}
  if(o.jog)g0pl.push('przesunięcie (joggle) '+jg+' mm na wys. 280 (APPROXIMATE)');if(o.tabs)g0pl.push('3 zaczepy ~'+Math.round(tw||60)+'×20 pod kołnierzem dolnym (pozycje zgadnięte)');
  var n=0;G.forEach(function(g){n+=g.attributes.position.count});var a=new Float32Array(n*3),o=0;G.forEach(function(g){a.set(g.attributes.position.array,o);o+=g.attributes.position.array.length});var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));if(sc!==1){var s3=[1,1,1];s3[ih]=sc;g.scale(s3[0],s3[1],s3[2]);}g.computeVertexNormals();g.computeBoundingBox();
  g.userData={partsList:['blacha '+Math.round(W)+'×'+Math.round(H2)+'×'+Math.round(t)+' z '+(g0.g0h||g0.holes)+' oknami (obrys G0)','kołnierz górny '+ft+' mm (z rzutu bocznego/ISO; zaczepy zgadnięte)','kołnierz dolny '+fb+' mm (z rzutu bocznego/ISO'+(R?(o0.k45?'':'; gięcie R'+R):'; R16 pominięte')+')'].concat(R?['gięcia R'+R+' (łuk, '+Rsrc+'; APPROXIMATE – NEEDS_REVIEW)'+(o0.k45?' – tylko górne, dolne 45° ostre':' – górne i dolne')]:[]).concat(g0pl),elements:[{id:'E1',t:'blacha'},{id:'E2',t:'kołnierz'},{id:'E3',t:'kołnierz'}]};
  return {name:'blacha gięta z oknami (ISO+G0)',geo:g,g0b:1,a3b:1,how:'A3 · APPROXIMATE: blacha z obrysu G0 + kołnierze '+ft+'/'+fb+' mm z rzutu bocznego, potwierdzone izometrią; zaczepy zgadnięte; '+(R?'gięcia R'+R+' jako łuk ('+Rsrc+')':'R16 nie modelowane (flaga)')+'',r16:R?{R:R,src:Rsrc,k45:!!o0.k45}:null}}
 var VAR=[{}];if(!window.__noA3Joggle){VAR.push({jog:1},{jog:-1});}if(!window.__noA3K45)VAR=VAR.concat(VAR.map(function(v){return Object.assign({k45:1,lip:1},v)}));if(!window.__noA3Tabs)VAR=VAR.concat(VAR.map(function(v){return Object.assign({tabs:1},v)}));var best=null,ALL=[];[1,-1].forEach(function(sg){VAR.forEach(function(o){var c=mk(sg,o);c.a3o=JSON.stringify(o);try{matchIso(m,[c]);var r=viewIoU(m,c.geo,false);c.vi=r;c.viou=r.length?r.reduce(function(s,x){return s+x.iou},0)/r.length:0;}catch(e){c.iou=0;c.viou=0;}c.a3sg=sg;c.a3oo=o;ALL.push(c);if(!best||c.iou>best.iou)best=c;console.log('a3b var',sg,c.a3o,(c.iou||0).toFixed(3),(c.viou||0).toFixed(3))})});
 var bk=best;if(best&&best.r16&&!window.__noA3R16Pref){var ep=0.02,pf=ALL.filter(function(c){return c.r16&&!c.a3oo.k45&&c.a3oo.jog&&(c.iou||0)>=best.iou-ep}).sort(function(a,b){return b.iou-a.iou||b.viou-a.viou})[0];if(pf&&pf!==best){pf.r16pref={from:best.a3o,iou0:+best.iou.toFixed(3),viou0:+(best.viou||0).toFixed(3),eps:ep};console.log('a3b pref R+joggle',best.a3o,'->',pf.a3o);best=pf;}}
 m.a3b={iou:+best.iou.toFixed(2),viou:+best.viou.toFixed(2),g0iou:+(g0.iou||0).toFixed(2),g0viou:+(g0.viou||0).toFixed(2),H:H2,ft:ft,fb:fb,var:best.a3o,r16:best.r16||null,pref:best.r16pref||null};console.log('isolock: a3 bent',JSON.stringify(m.a3b));
 C.push(best);
 if(!window.__noA3Prof&&sv.poly&&typeof extrudeView=='function'){var kk=H2/sv.ob.h;m.a3prof={n:sv.poly.length,k:+kk.toFixed(3),poly:sv.poly.map(function(p){return [Math.round((p[0]-sv.ob.x)*kk),Math.round((sv.ob.y+sv.ob.h-p[1])*kk)]})};
  try{var pc={name:'blacha gięta (profil z rzutu cienkiego × szer. G0)',geo:extrudeView(sv,kk,W,'x'),how:'A3.3 · APPROXIMATE: profil z rzutu bocznego ('+sv.poly.length+' wierzch.) wyciągnięty na '+Math.round(W)+' mm; okna nie wycięte'};matchIso(m,[pc]);var r2=viewIoU(m,pc.geo,false);pc.viou=r2.length?r2.reduce(function(s,x){return s+x.iou},0)/r2.length:0;m.a3prof.iou=+(pc.iou||0).toFixed(2);m.a3prof.viou=+pc.viou.toFixed(2);C.push(pc);}catch(e){m.a3prof.err=String(e)}
  console.log('isolock: a3 prof',JSON.stringify(m.a3prof));}if(best.iou>(g0.iou||0)+0.02&&best.viou>=(g0.viou||0)-0.02){m.__a3BentPick=best;best.__g0=g0;}};
