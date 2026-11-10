/* oria-186 PERF-2: raster matchIso/viewIoU w workerach OffscreenCanvas (collect → równolegle → replay z cache).
   Wynik bit-identyczny: kod rastra w rq_worker.js = 1:1 z isoRender/silMask; sonda startowa porównuje piksele worker vs <canvas> — przy różnicy tryb OFF (raster inline jak dawniej). */
(function(){
/* iso: raster workera != <canvas> dla bardzo dużych siatek (obs. różnice przy >=25k trójkątów) → duże siatki liczone inline */
function TMAX(){return window.__rqTmax||15000}
var cache=new Map(),Q=null,pool=null,ok=false,initP=null,ST=window.__rqStats={heavy:0,hit:0,miss:0,collected:0,jobs:0,pre:0,preMs:0,workers:0,verify:0,bad:0,off:''};
function hk(p){var u=new Uint32Array(p.buffer,p.byteOffset,p.length),h1=2166136261,h2=5381;for(var i=0;i<u.length;i++){var v=u[i];h1=Math.imul(h1^v,16777619);h2=(Math.imul(h2,33)^v)|0}return p.length+':'+(h1>>>0)+':'+(h2>>>0)}
function supported(){try{return window.__rqOn===1&&window.__rqOff!==1&&typeof Worker=='function'&&typeof OffscreenCanvas=='function'&&!!new OffscreenCanvas(2,2).getContext('2d')}catch(e){return false}}
function mkPool(){var n=Math.max(1,Math.min(window.__rqN||3,(navigator.hardwareConcurrency||2)-1)),ws=[],base=(document.currentScript&&document.currentScript.src)||'';
 for(var i=0;i<n;i++){var w=new Worker('rq_worker.js?v='+(window.VERSION||''));w.__q=null;w.__id=0;w.__cb={};w.onmessage=function(e){var d=e.data,cb=this.__cb[d.id];delete this.__cb[d.id];if(cb)cb(d)};w.onerror=function(){ST.off='worker error';ok=false};ws.push(w)}
 return ws}
function call(w,msg,tr){return new Promise(function(res,rej){var id=++w.__id;msg.id=id;w.__cb[id]=function(d){d.err?rej(new Error(d.err)):res(d)};w.postMessage(msg,tr||[])})}
function init(){if(initP)return initP;initP=new Promise(function(res){if(!supported()){ST.off='unsupported';return res(false)}
 try{pool=mkPool();ST.workers=pool.length;var W=180,H=124,N=300,s=12345,T=new Float64Array(N*6);function rnd(){s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff}for(var i=0;i<N;i++){var cx=rnd()*W,cy=rnd()*H;for(var k=0;k<3;k++){T[i*6+k*2]=cx+(rnd()-.5)*30;T[i*6+k*2+1]=cy+(rnd()-.5)*30}}
  var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle='rgb(200,100,30)';x.strokeStyle=x.fillStyle;x.lineWidth=0.6;for(var i=0;i<T.length;i+=6){x.beginPath();x.moveTo(T[i],T[i+1]);x.lineTo(T[i+2],T[i+3]);x.lineTo(T[i+4],T[i+5]);x.closePath();x.fill();x.stroke()}var A=x.getImageData(0,0,W,H).data;
  call(pool[0],{k:'probe',T:T,W:W,H:H}).then(function(d){var B=d.r,bad=0;for(var i=0;i<A.length;i++)if(A[i]!==B[i]){bad++;break}ok=!bad;if(bad)ST.off='probe mismatch';res(ok)}).catch(function(e){ST.off='probe '+e;res(false)});
 }catch(e){ST.off='init '+e;res(false)}});return initP}
function rec(geo,job){var p=geo.attributes.position.array,gk=hk(p),g=Q.get(gk);if(!g){var bb=geo.boundingBox||(geo.computeBoundingBox(),geo.boundingBox);g={p:p,bb:{min:{x:bb.min.x,y:bb.min.y,z:bb.min.z},max:{x:bb.max.x,y:bb.max.y,z:bb.max.z}},jobs:new Map(),gk:gk};Q.set(gk,g)}
 return g}
function bbk(geo){var b=geo.boundingBox||(geo.computeBoundingBox(),geo.boundingBox);return b.min.x+','+b.min.y+','+b.min.z+','+b.max.x+','+b.max.y+','+b.max.z}
window.__rqE=function(cv,geo,W,H,mi){
 if(ok||Q){var p=geo.attributes.position.array,gk=hk(p),key=gk+'|i|'+W+'|'+H+'|'+(mi?1:0),h=cache.get(key);
  if(h){if(!h.E)h.E=edgeFromPix(cv,h.pix,W,H);ST.hit++;if(window.__rqDummy)dum(W,H);if(window.__rqVerify){var E2=edgeMap(cv,isoRender(geo,W,H,mi),false);ST.verify++;var nb=0;for(var i=0;i<E2.length;i++)if(E2[i]!==h.E[i])nb++;if(nb){ST.bad++;(ST.badl=ST.badl||[]).push(['i',key,nb,W,H,p.length/9])}}return h.E}
  if(Q){if(p.length>9*TMAX()){ST.heavy++;return new Uint8Array(W*H)}var g=rec(geo);g.jobs.set(key,{k:'i',key:key,W:W,H:H,m:mi?1:0});ST.collected++;return new Uint8Array(W*H)}
  ST.miss++}
 return edgeMap(cv,isoRender(geo,W,H,mi),false)};
window.__rqS=function(geo,ax,W,H,fx,fy){
 if(ok||Q){var p=geo.attributes.position.array,gk=hk(p),key=gk+'|s|'+bbk(geo)+'|'+ax.join('')+'|'+W+'|'+H+'|'+(fx?1:0)+'|'+(fy?1:0),h=cache.get(key);
  if(h){ST.hit++;if(window.__rqDummy)dum(W,H);if(window.__rqVerify){var M2=silMask(geo,ax,W,H,fx,fy);ST.verify++;var nb=0;for(var i=0;i<M2.length;i++)if(M2[i]!==h.M[i])nb++;if(nb){ST.bad++;(ST.badl=ST.badl||[]).push(['s',key,nb,W,H,p.length/9])}}return h.M}
  if(Q){var g=rec(geo);g.jobs.set(key,{k:'s',key:key,ax:ax.slice(),W:W,H:H,fx:fx?1:0,fy:fy?1:0});ST.collected++;return new Uint8Array(W*H)}
  ST.miss++}
 return silMask(geo,ax,W,H,fx,fy)};
function dum(W,H){var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');x.fillRect(0,0,1,1);x.getImageData(0,0,W,H)}
function edgeFromPix(cv,pix,W,H){var m=cv.matFromImageData(new ImageData(new Uint8ClampedArray(pix.buffer?pix:pix),W,H));return edgeMapM(cv,m,false)}
function compute(Qm){var tasks=[];Qm.forEach(function(g){var jobs=[];g.jobs.forEach(function(j){jobs.push(j)});if(jobs.length)tasks.push({g:g,jobs:jobs})});ST.jobs+=tasks.reduce(function(a,t){return a+t.jobs.length},0);
 if(!tasks.length)return Promise.resolve();var i=0,errs=0;
 return Promise.all(pool.map(function(w){return (function next(){if(i>=tasks.length)return Promise.resolve();var t=tasks[i++],p=t.g.p.slice();
   return call(w,{p:p,bb:t.g.bb,jobs:t.jobs.map(function(j){return j.k==='i'?{k:'i',key:j.key,W:j.W,H:j.H,m:j.m}:{k:'s',key:j.key,ax:j.ax,W:j.W,H:j.H,fx:j.fx,fy:j.fy}})},[p.buffer]).then(function(d){d.out.forEach(function(o){if(o.key.indexOf('|i|')>0)cache.set(o.key,{pix:o.r});else cache.set(o.key,{M:o.r})})},function(){errs++}).then(next)})()}))}
function isP(v){if(!v||typeof v!=='object')return false;if(Array.isArray(v))return 1;var p=Object.getPrototypeOf(v);return (p===Object.prototype||p===null)?2:false}
/* migawka grafu info (obiekty/tablice/typed arrays) → pełne przywrócenie IN PLACE (tożsamość obiektów zachowana) po przebiegu collect */
function gsnap(root){var seen=new Set(),L=[],st=[root];while(st.length){var v=st.pop();if(!v||typeof v!=='object'||seen.has(v))continue;seen.add(v);
 if(ArrayBuffer.isView(v)&&!(v instanceof DataView)){L.push({o:v,t:v.slice()});continue}
 var k=isP(v);if(!k||(k===2&&typeof v.imread==='function'))continue;if(k===1){var a=v.slice();L.push({o:v,a:a});for(var i=0;i<a.length;i++)if(a[i]&&typeof a[i]==='object')st.push(a[i])}else{var ks=Object.keys(v),e=[];for(var i=0;i<ks.length;i++){var x=v[ks[i]];e.push([ks[i],x]);if(x&&typeof x==='object')st.push(x)}L.push({o:v,e:e})}}
 return L}
function grest(L){for(var j=0;j<L.length;j++){var s=L[j],o=s.o;if(s.t){o.set(s.t);continue}if(s.a){o.length=0;for(var i=0;i<s.a.length;i++)o.push(s.a[i])}else{var keep={};s.e.forEach(function(p){keep[p[0]]=1});Object.keys(o).forEach(function(k){if(!keep[k])delete o[k]});s.e.forEach(function(p){if(o[p[0]]!==p[1])o[p[0]]=p[1]})}}}
function snap(o){var out={},seen=new WeakSet();function ser(v,dep){if(v===null||typeof v!=='object')return typeof v==='function'?'f':String(v);if(dep>6)return '~';if(v instanceof HTMLElement||v instanceof HTMLCanvasElement||(typeof v.delete==='function'&&v.rows!==undefined))return 'X';if(ArrayBuffer.isView(v)){var h=0;for(var i=0;i<v.length;i+=Math.max(1,v.length/200|0))h=(Math.imul(h,31)+(v[i]*1000|0))|0;return 'T'+v.length+':'+h}if(seen.has(v))return '@';seen.add(v);var s='';if(Array.isArray(v)){for(var i=0;i<v.length;i++)s+=ser(v[i],dep+1)+',';return '['+s+']'}for(var k in v){try{s+=k+':'+ser(v[k],dep+1)+';'}catch(e){}}return '{'+s+'}'}for(var k in o){seen=new WeakSet();var s=ser(o[k],0),h=0;for(var i=0;i<s.length;i++)h=(Math.imul(h,31)+s.charCodeAt(i))|0;out[k]=s.length+':'+h}return out}
window.__rqInit=init;
window.__rqPre=function(info,fn){var run=function(){try{return Promise.resolve(fn())}catch(e){return Promise.reject(e)}};
 if(!supported())return run();
 return init().then(function(good){if(!good)return run();var t0=performance.now(),L=info.log&&info.log.length;cache.clear();var S0=window.__rqDbg&&snap(info);var GS=gsnap(info);Q=new Map();var Q0;try{fn()}catch(e){}finally{Q0=Q;Q=null}grest(GS);if(S0){var S1=snap(info),d=[];for(var k in S1)if(S1[k]!==S0[k])d.push(k);for(var k in S0)if(!(k in S1))d.push('-'+k);window.__rqDiff=d;console.log('RQDIFF '+d.join(','))}
  ST.pre++;return compute(Q0).then(function(){ST.preMs=Math.round(performance.now()-t0)},function(){}).then(run,run)},function(){return run()})};
})();
