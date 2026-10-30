/* oria-146: arauto domyślnie ON; ?arauto=0 wyłącza (persist 0). */
(function(){
try{if(/[?&]arauto=0/.test(location.search)){localStorage.setItem('oria_arauto','0');}else if(/[?&]arauto=1/.test(location.search))localStorage.setItem('oria_arauto','1')}catch(e){}
var ON=localStorage.getItem('oria_arauto')!=='0';if(!ON)return;
var LOG=window.__arAutoLog=[];function log(m){LOG.push(Date.now()+' '+m);try{console.log('[arauto]',m)}catch(e){}}
var E=window.__arEnv||{};var R=window.__arReady=null;var busy=0,tm=0,DIR=null;
// --- prawdziwy folder (File System Access): tylko gdzie przeglądarka to ma (Chrome/Edge komputer, część Androidów). iOS Safari: brak API → share sheet.
var FSA=typeof window.showDirectoryPicker=='function';
function idb(){return new Promise(function(ok,no){var r=indexedDB.open('oria_arauto',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};r.onsuccess=function(){ok(r.result)};r.onerror=no})}
function kv(k,v){return idb().then(function(d){return new Promise(function(ok,no){var t=d.transaction('kv',v===undefined?'readonly':'readwrite'),s=t.objectStore('kv'),q=v===undefined?s.get(k):s.put(v,k);q.onsuccess=function(){ok(q.result)};q.onerror=no})})}
function perm(h,ask){if(!h||!h.queryPermission)return Promise.resolve(false);return h.queryPermission({mode:'readwrite'}).then(function(p){if(p=='granted')return true;if(!ask)return false;return h.requestPermission({mode:'readwrite'}).then(function(q){return q=='granted'})})}
kv('dir').then(function(h){if(h)return perm(h,false).then(function(ok){DIR=ok?h:null;window.__arDirPending=ok?null:h;log('dir '+(ok?'ok':'needs-perm'))})}).catch(function(){});
// pierwsze włączenie: zapytaj raz (gest użytkownika wymagany → przy pierwszym dotknięciu w apce)
function firstRun(){if(localStorage.getItem('oria_arauto_asked'))return;
 var b=document.createElement('div');b.id='arAutoAsk';b.style.cssText='position:fixed;left:8px;right:8px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:2147483645;background:#10141d;border:1px solid #22d3ee;border-radius:14px;padding:12px;color:#e3e8ef;font:14px system-ui';
 b.innerHTML=FSA?(function(){var g=(document.documentElement.lang||localStorage.getItem('oria_lang')||'pl').slice(0,2),T={pl:['Folder AR','Zgoda na folder w Plikach – każdy model 3D zapiszę tam sam, a AR otworzy go od razu.','Wybierz / utwórz folder','Nie teraz'],en:['AR folder','Allow access to a folder in Files – every 3D model will be saved there automatically, and AR will open it right away.','Choose / create folder','Not now'],de:['AR-Ordner','Erlauben Sie den Zugriff auf einen Ordner in „Dateien“ – jedes 3D-Modell speichern wir dort automatisch, und AR öffnet es sofort.','Ordner wählen / erstellen','Nicht jetzt']}[g]||0;if(!T)T=['Folder AR','Zgoda na folder w Plikach – każdy model 3D zapiszę tam sam, a AR otworzy go od razu.','Wybierz / utwórz folder','Nie teraz'];return '<b>'+T[0]+'</b><br>'+T[1]+'<br><button id="arAskY" class="main orange">'+T[2]+'</button> <button id="arAskN" class="main alt">'+T[3]+'</button>'})()
  :(function(){var g=(document.documentElement.lang||localStorage.getItem('oria_lang')||'pl').slice(0,2),T={pl:['Pliki AR na iPhonie','Na iPhonie nie możemy sami zapisać modelu w Plikach. Nic nie trzeba robić — model jest gotowy w aplikacji. Wciśnij AR, aby go zobaczyć. Chcesz kopię? Wciśnij Udostępnij → Zachowaj w Plikach.'],en:['AR files on iPhone','On iPhone we can\'t save the model to Files automatically. Nothing to do — the model is ready in the app. Tap AR to view it. Want a copy? Tap Share → Save to Files.'],de:['AR-Dateien auf dem iPhone','Auf dem iPhone können wir das Modell nicht automatisch in „Dateien“ speichern. Sie müssen nichts tun – das Modell ist in der App bereit. Tippen Sie auf AR, um es anzusehen. Kopie gewünscht? Teilen → In „Dateien“ sichern.']}[g]||0;if(!T)T=['Pliki AR na iPhonie','Na iPhonie nie możemy sami zapisać modelu w Plikach. Nic nie trzeba robić — model jest gotowy w aplikacji. Wciśnij AR, aby go zobaczyć. Chcesz kopię? Wciśnij Udostępnij → Zachowaj w Plikach.'];return '<b>'+T[0]+'</b><br>'+T[1]+'<br><button id="arAskN" class="main alt">OK</button>'})();
 document.body.appendChild(b);function done(){localStorage.setItem('oria_arauto_asked','1');b.remove()}
 b.querySelector('#arAskN').onclick=done;var y=b.querySelector('#arAskY');if(y)y.onclick=function(){window.showDirectoryPicker({id:'oria_ar',mode:'readwrite',startIn:'documents'}).then(function(p){return p.getDirectoryHandle('Oriaweld AR',{create:true})}).then(function(d){DIR=d;return kv('dir',d)}).then(function(){log('dir created');done();if(R)toDir(R)}).catch(function(e){log('dir err '+e);done()})}}
function toDir(r){if(!DIR&&window.__arDirPending)return Promise.resolve();if(!DIR)return Promise.resolve();
 var nm=safe(r.name);function w(f,b){return DIR.getFileHandle(f,{create:true}).then(function(h){return h.createWritable()}).then(function(s){return s.write(b).then(function(){return s.close()})})}
 return Promise.all([w('live.usdz',r.usdz),w('live.glb',r.glb),w(nm+'.usdz',r.usdz),w(nm+'.glb',r.glb)]).then(function(){r.dir=true;log('dir write '+nm)}).catch(function(e){log('dir write err '+e)})}
function readDir(){if(!DIR)return Promise.resolve(null);return Promise.all(['live.usdz','live.glb'].map(function(f){return DIR.getFileHandle(f).then(function(h){return h.getFile()})})).then(function(a){return {usdz:a[0],glb:a[1]}}).catch(function(){return null})}
// --- 1) po zbudowaniu 3D: w tle
var FN=null;window.addEventListener('change',function(e){var t=e.target;if(t&&t.tagName=='INPUT'&&t.type=='file'&&t.files&&t.files[0]){FN=t.files[0].name.replace(/\.[^.]+$/,'');log('file '+FN)}},true);
function name(){var m=window.__arProjM,K=window.__arKinds||{},GEN=/^\s*(projekt|project|projet|projekt \(v\d+\))\s*$/i,n='';
 function ok(x){x=(x==null?'':String(x)).trim();return x&&!GEN.test(x)?x:''}
 function dims(){try{return m&&m.size?m.size.map(Math.round).join('x'):''}catch(e){return ''}}
 try{var L=window.AUTO&&AUTO.last;if(m&&!ok(m.__hname)&&L&&L===m&&ok(L.__hname))m.__hname=L.__hname}catch(e){}
 try{var he=document.getElementById('hname'),ha=document.querySelector('.hitem.active b,.hitem[aria-current] b,.hitem.sel b');
  n=ok(m&&m.__hname)||ok(he&&he.textContent)||ok(ha&&ha.textContent);
  if(!n&&FN)n=FN+(dims()?'_'+dims():'');
  if(!n&&m&&m.size)n=(K[m.kind]||m.kind||'Rama')+' '+dims()}catch(e){}
 if(!ok(n)){var t=(document.title||'').trim();n=ok(t)&&!/^oria/i.test(t)?t:'Oriaweld_'+new Date().toISOString().slice(0,16).replace(/[T:]/g,'-')}
 return n}
window.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('.hitem');if(b){setTimeout(function(){try{var he=document.getElementById('hname'),L=window.AUTO&&AUTO.last,v=he&&he.textContent.trim();if(v&&L&&!L.__hname)L.__hname=v;if(L&&L.geo)window.__arProjM=L;R=window.__arReady=null;sched()}catch(x){}},600)}},true);
function safe(n){return String(n).normalize('NFC').replace(/[×]/g,'x').replace(/[\\\/:*?"<>|#%\u0000-\u001f]+/g,'_').replace(/\s+/g,'_').replace(/_+/g,'_').slice(0,80)||'Oriaweld'}
function build(){if(busy||document.getElementById('ar'))return;var k=window.__arKey();if(!k)return;if(R&&R.k===k)return;busy=1;R=window.__arReady=null;var t0=performance.now();log('build start');
 (window.requestIdleCallback||function(f){setTimeout(f,300)})(function(){try{(window.__exportGLB||exportGLB)(function(glb,w){(window.__exportUSDZ||window.exportUSDZ)(w).then(function(u){
  if(k!==window.__arKey()){busy=0;log('stale');return sched()}
  var r={k:k,glb:glb,usdz:u,w:w,name:name(),ts:Date.now()};window.__arPre={k:k,glb:glb,w:w,usdz:Promise.resolve(u)};
  Promise.all([window.__arURL(u,'live.usdz'),window.__arURL(glb,'live.glb')]).then(function(a){r.uUrl=a[0].url;r.gUrl=a[1].url;r.how=a[0].how;
   r.uBlob=URL.createObjectURL(u);r.gBlob=URL.createObjectURL(glb);R=window.__arReady=r;busy=0;log('ready '+Math.round(performance.now()-t0)+'ms how='+r.how+' usdz='+u.size+' glb='+glb.size);
   toDir(r);try{window.dispatchEvent(new CustomEvent('rama:arready',{detail:{k:k}}))}catch(e){}})}).catch(function(e){busy=0;log('usdz err '+e)})},false)}catch(e){busy=0;log('err '+e)}},{timeout:4000})}
function sched(){clearTimeout(tm);tm=setTimeout(build,1200)}
// 3) unieważnienie: każdy render sprawdza klucz (wymiary/geometria) + zmiana stylu/materiału
var oR=window.arRender;if(typeof oR=='function')window.arRender=function(){var x=oR.apply(this,arguments);if(R&&R.k!==window.__arKey()){log('invalidate');R=window.__arReady=null}sched();return x};
['rama:done','rama:style','rama:material'].forEach(function(t){window.addEventListener(t,function(){R=window.__arReady=null;sched()})});
setInterval(function(){var k=window.__arKey();if(!k)return;if(R&&R.k!==k){log('invalidate(poll)');R=window.__arReady=null}if(!R&&!busy&&!document.getElementById('ar'))build()},2500);
// --- 2) tap AR = od razu (w tym samym dotknięciu)
function qlClick(url){var a=document.createElement('a');a.rel='ar';a.href=url+'#allowsContentScaling=0';var i=document.createElement('img');i.width=1;i.height=1;a.appendChild(i);document.body.appendChild(a);a.click();setTimeout(function(){a.remove()},2000)}
function shareFile(r){var f=new File([r.usdz],safe(r.name)+'.usdz',{type:'model/vnd.usdz+zip'});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f]}).catch(function(){});return true}return false}
function fast(ev){var r=R;if(!r||r.k!==window.__arKey()){log('tap: not ready → stare okno');return false}
 try{ev&&ev.preventDefault();ev&&ev.stopPropagation()}catch(e){}
 if(E.ios&&!E.standalone){log('tap: QL');qlClick(r.uUrl);return true}
 if(E.ios&&E.standalone){log('tap: share');if(shareFile(r))return true;window.open(r.uUrl,'_blank');return true}   // 4) PWA: arkusz Udostępnij (pełny QL w PWA nie)
 if(E.android&&E.webxr&&window.__arXRgo){log('tap: webxr');var ov=window.__arFastOv||document.createElement('div');window.__arXRgo(ov,false).catch(function(){(window.__M11open||window.M11open)(false)});return true}
 log('tap: fallback M11 (pre-ready)');return false}
var oGo=window.__oriaGoAR;window.__oriaGoAR=function(ev){if(fast(ev))return;return oGo?oGo(ev):(window.__M11open||window.M11open)(false)};
window.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('#aar,#arb,#har,#fsar');if(!t)return;if(fast(e)){e.stopImmediatePropagation()}},true);
document.addEventListener('pointerdown',function f(){document.removeEventListener('pointerdown',f,true);setTimeout(firstRun,50)},true);
window.__arAuto={build:build,fast:fast,readDir:readDir,state:function(){return {name:R&&R.name,file:R&&safe(R.name),ready:!!R,k:R&&R.k,how:R&&R.how,dir:!!DIR,fsa:FSA,log:LOG.slice(-20)}}};
log('on fsa='+FSA+' ios='+!!E.ios+' sa='+!!E.standalone);
})();
