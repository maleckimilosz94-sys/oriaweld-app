/* Sterowanie dłonią – PIASKOWNICA. MediaPipe HandLandmarker (Apache-2.0, vendor/mediapipe). Tylko widok 3D w aplikacji, nigdy AR. */
(function(root){
'use strict';
// ---------- czysta logika (testowalna bez kamery) ----------
function d(a,b){return Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0))}
function classify(lm){var w=lm[0],palm=d(w,lm[9])||1e-6,ext=0;
 [[8,6],[12,10],[16,14],[20,18]].forEach(function(p){if(d(w,lm[p[0]])>d(w,lm[p[1]])*1.12)ext++});
 var pr=d(lm[4],lm[8])/palm,c={x:0,y:0};[0,5,9,13,17].forEach(function(i){c.x+=lm[i].x/5;c.y+=lm[i].y/5});
 var g=ext===0?'fist':(pr<0.35&&ext>=2&&d(w,lm[12])>d(w,lm[10])*1.12)?'pinch':ext>=4?'open':(ext===1&&d(w,lm[8])>d(w,lm[6])*1.12)?'point':(ext===2&&d(w,lm[8])>d(w,lm[6])*1.12&&d(w,lm[12])>d(w,lm[10])*1.12)?'v2':'other';
 return {g:g,ext:ext,pinch:pr,cx:c.x,cy:c.y,palm:palm}}
function Mapper(o){o=o||{};var S={dead:o.dead||0.004,gain:o.gain||6,alpha:o.alpha||0.35,zoomGain:o.zoomGain||1.6,lostMs:o.lostMs||450,cycMs:o.cycMs||1600,mirror:o.mirror!==false,tapMs:o.tapMs||250,vHoldMs:o.vHoldMs||800,ruler:o.ruler!==false,span:o.span||0.14,zIn:o.zIn||0.4,zOut:o.zOut||0.25,rate:o.rate||2,centerMs:o.centerMs||450,centerHold:o.centerHold||2500};
 var st={prev:null,vx:0,vy:0,pin0:null,lastSeen:-1e9,paused:true,hist:[],last:null,pinT:null,vT:null,vFired:false,zP:null,zone:'center',zT:0,zV:false,zC:false,zAx:0,lastT:null};
 function step(lm,t){var out={yaw:0,pitch:0,zoom:1,gesture:'none',paused:false,explode:false,click:false,reset:false,pointer:null};
  if(!lm){st.pinL=false;st.pinT=null;st.vT=null;st.vFired=false;st.zP=null;st.lastT=null;if(t-st.lastSeen>S.lostMs){st.paused=true;st.prev=null;st.pin0=null;st.vx=st.vy=0}out.paused=st.paused;out.gesture='lost';return out}
  st.lastSeen=t;st.paused=false;var c=classify(lm);if(c.g=='pinch')st.pinL=true;else if(st.pinL&&c.g!='fist'&&c.pinch<0.85)c.g='pinch';else st.pinL=false;out.gesture=c.g;
  // cykle otwórz-zamknij
  var k=c.g=='open'?'O':c.g=='fist'?'F':null;if(k&&k!==st.last){st.hist.push({k:k,t:t});st.last=k}
  st.hist=st.hist.filter(function(h){return t-h.t<=S.cycMs});var s=st.hist.map(function(h){return h.k}).join('');
  if(/OFOF$/.test(s)){out.explode=true;st.hist=[]}
  if(c.g=='open'&&st.prev&&st.prev.g=='open'){var dx=c.cx-st.prev.cx,dy=c.cy-st.prev.cy;if(S.mirror)dx=-dx;
   if(Math.abs(dx)<S.dead)dx=0;if(Math.abs(dy)<S.dead)dy=0;st.vx=st.vx*(1-S.alpha)+dx*S.alpha;st.vy=st.vy*(1-S.alpha)+dy*S.alpha;
   out.yaw=-st.vx*S.gain;out.pitch=-st.vy*S.gain}
  else{st.vx=st.vy=0}
  if(c.g=='pinch'&&!S.ruler){if(st.pin0!=null){var r=c.pinch/st.pin0;if(Math.abs(r-1)>0.02)out.zoom=Math.pow(r,-S.zoomGain)}st.pin0=c.pinch}else st.pin0=null;
  /* oria-192: miarka zoomu — pinch (kciuk+wskazujący) przytrzymany >tapMs otwiera miarkę; ruch dłoni w bok: − Oddal | Center | + Przybliż (z histerezą, snap do najbliższej strefy). Szybki pinch (<tapMs) nadal = klik. */
  var dtt=st.lastT==null?0:Math.min(100,Math.max(0,t-st.lastT));st.lastT=t;
  if(S.ruler&&c.g=='pinch'){if(st.zP==null){st.zP=t;st.zAx=c.cx;st.zone='center';st.zT=t;st.zV=false;st.zC=false}
   if(t-st.zP>=S.tapMs){var u=(S.mirror?-1:1)*(c.cx-st.zAx)/S.span;u=Math.max(-1,Math.min(1,u));var z=st.zone;
    if(z=='center'){if(u>S.zIn)z='in';else if(u<-S.zIn)z='out'}else if(z=='in'){if(u<S.zOut)z=u<-S.zIn?'out':'center'}else{if(u>-S.zOut)z=u>S.zIn?'in':'center'}
    if(z!==st.zone){st.zone=z;st.zT=t;st.zC=false;if(z!='center')st.zV=true}
    if(z=='in')out.zoom=Math.pow(S.rate,-dtt/1000);else if(z=='out')out.zoom=Math.pow(S.rate,dtt/1000);
    else if(!st.zC){var dw=t-st.zT;if((st.zV&&dw>=S.centerMs)||dw>=S.centerHold){out.center=true;st.zC=true}}
    out.ruler={on:true,zone:z,u:u}}}
  else st.zP=null;
  // v3: szybki pinch = klik, V przytrzymane = reset, wskazujący = kursor
  if(c.g=='pinch'){if(st.pinT==null)st.pinT=t}else{if(st.pinT!=null&&t-st.pinT<=S.tapMs)out.click=true;st.pinT=null}
  if(c.g=='v2'){if(st.vT==null)st.vT=t;if(!st.vFired&&t-st.vT>=S.vHoldMs){out.reset=true;st.vFired=true}}else{st.vT=null;st.vFired=false}
  if(c.g=='point'){var px=lm[8].x;out.pointer={x:S.mirror?1-px:px,y:lm[8].y}}
  var tx=c.g=='pinch'?(lm[4].x+lm[8].x)/2:lm[8].x,ty=c.g=='pinch'?(lm[4].y+lm[8].y)/2:lm[8].y;out.tip={x:S.mirror?1-tx:tx,y:ty};
  // pięść = chwyt/stop: brak ruchu
  st.prev=c;out.info=c;return out}
 return {step:step,state:st,opts:S}}
var api={classify:classify,Mapper:Mapper};
if(typeof module!=='undefined'&&module.exports){module.exports=api;return}
root.GestMap=api;
// ---------- integracja z aplikacją ----------
var Tr=function(k){try{return root.__arT?root.__arT(k):k}catch(e){return k}};
var G={twId:0,tw:0,on:false,stream:null,lm:null,video:null,timer:0,facing:'user',stats:{fps:0,lat:0,n:0,lat_sum:0,lat_max:0},mapper:null,gumCalls:0,explode:0};
root.__gesty=G;
var QS=(function(){try{return location.search+location.hash}catch(e){return ''}})();
G.v3=!(/[?&#]gesty_v3=0/.test(QS)||(function(){try{return localStorage.getItem('gesty_v3')==='0'}catch(e){return false}})());
G.zr=!(/[?&#]gzr=0/.test(QS)||(function(){try{return localStorage.getItem('gesty_zr')==='0'}catch(e){return false}})());/* oria-192: miarka zoomu (kill: ?gzr=0 / localStorage gesty_zr=0 → stary zoom odległością palców) */
G.dbg=/[?&#]gestdbg=1/.test(QS);G.dbgUi=/[?&#]debug(=1|&|$)/.test(QS+(location.hash||''));G.trackN=5;G.restoreMs=1500;G.hit=0;G.lastHand=-1e9;G.tracked=false;
function oc(){return root.__arOc}
function apply(o){var c=oc();if(!c||!c.object)return;G.tw=0;var cam=c.object,T=c.target,off=cam.position.clone().sub(T),sp=new THREE.Spherical().setFromVector3(off);
 sp.theta+=o.yaw;sp.phi=Math.max(0.08,Math.min(Math.PI/2-0.02,sp.phi+o.pitch));
 sp.radius=Math.max(c.minDistance||1,Math.min(c.maxDistance||1e9,sp.radius*o.zoom));off.setFromSpherical(sp);cam.position.copy(T).add(off);cam.lookAt(T);c.update()}
/* oria-192: poza startowa widoku (Center / V-reset). OrbitControls.reset() w nowych projektach wraca do target0=(0,0,0) sprzed oc.target.copy(tc) — zły środek; dlatego pamiętamy własną pozę przy pierwszym wykryciu kontrolera (+ korekta po 1,5 s, gdy app dosuwa model do stołu bez dotyku). */
function noteOc(){var c=oc();if(!c||!c.object||!c.target)return;if(G.home&&G.home.oc===c)return;G.home={oc:c,pos:c.object.position.clone(),tgt:c.target.clone()};var h=G.home,p0=PT;setTimeout(function(){if(G.home===h&&!G.on&&PT===p0&&!G.homeMoved){h.pos.copy(c.object.position);h.tgt.copy(c.target)}},1500)}
function gHome(){var c=oc();if(!c||!c.object)return 'none';var h=G.home;if(!h||h.oc!==c){if(typeof c.reset=='function'){c.reset();return 'oc'}return 'none'}
 var cam=c.object,p0=cam.position.clone(),t0=c.target.clone(),t1=performance.now(),k0=++G.twId;G.tw=k0;
 (function f(){if(G.tw!==k0||oc()!==c)return;var k=Math.min(1,(performance.now()-t1)/350),e=1-Math.pow(1-k,3);cam.position.lerpVectors(p0,h.pos,e);c.target.lerpVectors(t0,h.tgt,e);cam.lookAt(c.target);c.update();if(k<1)requestAnimationFrame(f)})();return 'home'}
function explodeToggle(){G.explode++;if(root.EX&&typeof root.EX.toggle=='function'){root.EX.toggle();return 'api'}
 document.dispatchEvent(new CustomEvent('gesty:explode',{detail:{n:G.explode}}));return 'stub'}
var CONN=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function draw(cv,lm,g){var x=cv.getContext('2d'),W=cv.width,H=cv.height;x.clearRect(0,0,W,H);if(!lm)return;var m=G.facing=='user';
 var P=function(p){return [(m?1-p.x:p.x)*W,p.y*H]};x.lineWidth=2;x.strokeStyle=g=='fist'?'#f87171':g=='pinch'?'#a78bfa':'#22d3ee';
 CONN.forEach(function(c){var a=P(lm[c[0]]),b=P(lm[c[1]]);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()});
 x.fillStyle='#e3e8ef';lm.forEach(function(p){var q=P(p);x.fillRect(q[0]-1.5,q[1]-1.5,3,3)})}
var MP=null;
/* oria-189 GEST-IOS: iPhone/iPad (Safari/PWA). Pułapki iOS: delegate GPU (WebGL2) potrafi zawiesić wątek/proces i nie da się go złapać try/catch; pierwsza klatka GPU = kompilacja shaderów (0,8–3,5 s bloku); wasm 13,5 MB + model 7,8 MB bez postępu; inferencja jest synchroniczna na wątku głównym; limit pamięci karty. */
var IOS=(function(){try{var u=navigator.userAgent||'';return /iPhone|iPad|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}catch(e){return false}})();G.ios=IOS;
var IOS_DEFAULT_OFF=true;/* wariant B: na iOS domyślnie wyłączone (opt-in ?gest=1); false = wariant A (włączone z zabezpieczeniami: CPU, 15 fps, watchdog 500 ms) */
function lsg(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lss(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
(function(){var m=/[?&#]gest=(0|1|auto)(?![0-9a-z])/.exec(QS);if(!m)return;if(m[1]=='1'){lss('gesty_ios','1');lss('gesty_dis',null)}else{lss('gesty_ios',null);lss('gesty_dis',null)}})();
/* blokada: 'default' (iOS, wariant B bez opt-in) | 'fail' (watchdog/timeout na tym urządzeniu w ostatnich 14 dniach) | '' */
function blocked(){if(!IOS)return '';var d=+lsg('gesty_dis')||0;if(d&&Date.now()-d<14*864e5)return 'fail';if(IOS_DEFAULT_OFF&&lsg('gesty_ios')!=='1')return 'default';return ''}
G.blocked=blocked;
var SZ={mjs:156139,wasm:13519922,task:7819105};
/* ładowanie zasobów z postępem i Anuluj (AbortController); wasm tylko rozgrzewa cache SW (potem fetch MediaPipe trafia w cache), model .task zwracany jako bufor */
function fetchP(url,exp,prog,sig,keep){return fetch(url,{signal:sig}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status+' '+url.split('/').pop());if(!r.body||!r.body.getReader){return r.arrayBuffer().then(function(b){prog(b.byteLength);return keep?new Uint8Array(b):null})}
  var rd=r.body.getReader(),ch=[];return (function pump(){return rd.read().then(function(x){if(x.done)return keep?cat(ch):null;prog(x.value.length);if(keep)ch.push(x.value);return pump()})})()})}
function cat(ch){var n=0,i;for(i=0;i<ch.length;i++)n+=ch[i].length;var o=new Uint8Array(n),p=0;for(i=0;i<ch.length;i++){o.set(ch[i],p);p+=ch[i].length}return o}
function paint(){return new Promise(function(r){var d=false,f=function(){if(!d){d=true;r()}};try{requestAnimationFrame(function(){setTimeout(f,0)})}catch(e){}setTimeout(f,80)})}
/* oria-192: rozgrzewka modelu — pierwsza klatka (kompilacja shaderów GPU/XNNPACK) blokuje wątek 0,8–4,7 s (QA 1.6: 2564 ms). Robimy ją raz, na pustym płótnie, jeszcze w fazie ładowania (komunikat „Rozgrzewam model…” namalowany przed blokiem, Anuluj widoczne), zanim ruszy kamera i pętla – użytkownik nie traci wtedy sterowania 3D w trakcie gestów. */
function warmLm(l,id){if(G.warmed===l||(id!=null&&id!==G.lid))return l;G.warmed=l;if(G.on&&!G.stats.n)status(Tr('gWarm'));
 return paint().then(function(){if(id!=null&&id!==G.lid)return l;var t0=performance.now();try{var c=document.createElement('canvas');c.width=c.height=192;var x=c.getContext('2d');x.fillStyle='#222';x.fillRect(0,0,192,192);l.detectForVideo(c,t0)}catch(e){}G.warmMs=Math.round(performance.now()-t0);return l})}
function loadLm(id){if(G.lm)return Promise.resolve(G.lm);if(G.lmP)return G.lmP;var base=new URL('vendor/mediapipe/',document.baseURI).href,done={a:0,b:0,c:0},tot=SZ.mjs+SZ.wasm+SZ.task;
 var ac=window.AbortController?new AbortController():null;G.ac=ac;var sig=ac?ac.signal:undefined;G.loadPct=0;
 var up=function(k){return function(n){done[k]+=n;G.lastProg=performance.now();G.loadPct=Math.min(99,Math.round(100*(done.a+done.b+done.c)/tot));if(G.on&&!G.stats.n)status(Tr('gLoad')+' '+G.loadPct+'%')}};
 var pref=lsg('gesty_dl')||((/[?&#]gestdl=(GPU|CPU)/i.exec(QS)||[])[1]||'').toUpperCase()||null;G.delegate=pref||(IOS?'CPU':'GPU');
 var p=Promise.all([fetchP(base+'vision_bundle.mjs',SZ.mjs,up('a'),sig,false),fetchP(base+'wasm/vision_wasm_internal.wasm',SZ.wasm,up('b'),sig,false),fetchP(base+'hand_landmarker.task',SZ.task,up('c'),sig,true)]).then(function(res){G.dlDone=true;
  return paint().then(function(){return import(base+'vision_bundle.mjs')}).then(function(v){MP=v;return v.FilesetResolver.forVisionTasks(base+'wasm')}).then(function(fs){
  var mk=function(dl){return MP.HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetBuffer:res[2],delegate:dl},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:0.5,minTrackingConfidence:0.5})};
  return paint().then(function(){return mk(G.delegate)}).catch(function(){if(G.delegate=='CPU')throw new Error('model');G.delegate='CPU';return mk('CPU')})})}).then(function(l){if(G.lmP===p)G.lmP=null;
   if(id!=null&&id!==G.lid&&IOS){try{l.close()}catch(e){}throw new Error('cancelled')}/* anulowano w trakcie: nie trzymaj ~100 MB */G.lm=l;return warmLm(l,id)},function(e){if(G.lmP===p)G.lmP=null;throw e});
 G.lmP=p;return p}
/* oria-192 GEST-UI wariant A: PNG @2x (96 px, wyświetlane 48 px), hotspot w px logicznych 48 px */
var IMG={open:'img/gest/glove_open.png',pinch:'img/gest/glove_pinch.png',ball:'img/gest/ball.png',loupe:'img/gest/loupe.png'},HOT={open:[19,5],pinch:[15,18],ball:[24,24]};
function ui(){var v=document.getElementById('view');if(!v)return null;var u=document.getElementById('gestUI');if(u)return u;
 u=document.createElement('div');u.id='gestUI';u.innerHTML='<button id="gestBtn" class="gbtn" aria-pressed="false"></button><button id="gestCam" class="gbtn sm" hidden></button>'+
 '<div id="gestPv" hidden><video id="gestV" playsinline muted autoplay></video><canvas id="gestC" width="160" height="120"></canvas><i id="gestDot" hidden></i><div id="gestS"></div><button id="gestCancel" class="gcancel" type="button" hidden></button></div>'+
 '<div id="gestCur" hidden data-k="open"><img id="gestCurI" alt="" draggable="false" src="'+IMG.open+'"><img id="gestLoupe" alt="" draggable="false" src="'+IMG.loupe+'" hidden></div>'+
 '<div id="gestHint" role="note" hidden></div>'+
 '<div id="gestRuler" role="group" hidden data-z="center"><div class="grl"><i class="gt" style="left:17.9%"></i><i class="gt gtc" style="left:50%"></i><i class="gt" style="left:82.1%"></i><b class="gk"></b></div><div class="grs"><span data-z="out"></span><span data-z="center"></span><span data-z="in"></span></div><div class="grn"></div></div>';
 v.appendChild(u);label();u.querySelector('#gestBtn').onclick=function(e){e.stopPropagation();G.on?stop(G.stats.n?'user':'cancel'):start()};
 u.querySelector('#gestCancel').onclick=function(e){e.stopPropagation();stop('cancel')};
 u.querySelector('#gestCam').onclick=function(e){e.stopPropagation();G.facing=G.facing=='user'?'environment':'user';if(G.on){stopCam();openCam()}label()};
 u.addEventListener('pointerdown',function(e){e.stopPropagation()});return u}
function label(){var b=document.getElementById('gestBtn'),c=document.getElementById('gestCam');if(!b)return;var na=!G.on&&!!blocked(),ld=G.on&&!(G.stats&&G.stats.n);b.textContent='✋ '+Tr(na?'gHandNA':ld?'gCancel':G.on?'gHandOff':'gHand');b.setAttribute('aria-pressed',G.on?'true':'false');b.classList.toggle('on',G.on);b.classList.toggle('na',na);var cb=document.getElementById('gestCancel');if(cb){cb.hidden=!ld;cb.textContent=Tr('gCancel')}
 c.textContent=Tr(G.facing=='user'?'gCamB':'gCamF');c.hidden=!G.on;document.getElementById('gestPv').hidden=!G.on}
function status(t){var s=document.getElementById('gestS');if(s)s.textContent=t}
function openCam(){G.gumCalls++;return navigator.mediaDevices.getUserMedia({video:{facingMode:G.facing,width:{ideal:320},height:{ideal:240},frameRate:IOS?{ideal:15,max:15}:{ideal:20,max:30}},audio:false}).then(function(s){
  if(!G.on){s.getTracks().forEach(function(t){t.stop()});return}G.stream=s;var v=document.getElementById('gestV');v.srcObject=s;v.style.transform=G.facing=='user'?'scaleX(-1)':'';G.video=v;return v.play().catch(function(){})})}
function stopCam(){if(G.stream){G.stream.getTracks().forEach(function(t){t.stop()});G.stream=null}var v=document.getElementById('gestV');if(v)v.srcObject=null}
function start(){if(G.on)return;var bl=blocked();if(bl){G.blockWhy=bl;toast('unavail');return}G.on=true;G.camStall=0;G.zrSeen=0;noteOc();document.body.classList.add('gest-on');var id=++G.lid;G.wd={err:0,hard:0,slow:0};if(G.v3)G.facing='user';G.mapper=Mapper({mirror:true,ruler:G.zr});G.stats={fps:0,lat:0,n:0,lat_sum:0,lat_max:0};label();status(Tr('gLoad'));
 clearTimeout(G.wdT);G.loadT0=performance.now();G.lastProg=G.loadT0;G.dlDone=false;G.wdT=setTimeout(function(){startTO(id)},WD.startMs);/* oria-183 HANG-1: start nie może wisieć (model/kamera) */
 /* oria-189: model ładowany bez blokady UI (fetch z postępem + paint przed createFromOptions); kamera dopiero po modelu na iOS (jedna ciężka rzecz naraz) */
 (IOS?loadLm(id).then(function(){if(!G.on||id!==G.lid)return;/* model gotowy: pozostało zezwolenie na kamerę (użytkownik może długo klikać) – 60 s, bez blokady urządzenia */clearTimeout(G.wdT);G.wdT=setTimeout(function(){if(G.on&&id===G.lid&&!G.stats.n){G.camStall=1;safeOff('timeout')}},60000);return openCam()}):Promise.all([loadLm(id),openCam()])).then(function(){if(!G.on||id!==G.lid)return;G.mapper.opts.mirror=G.facing=='user';G.loadMs=Math.round(performance.now()-G.loadT0);label();loop(id)}).catch(function(e){if(id!==G.lid)return;status(Tr('gNoCam')+(e&&e.name||e));G.err=String(e&&e.message||e);if(IOS&&!(e&&e.name=='NotAllowedError'))safeOff('err');else stop('error')})}
function setTracked(on){G.tracked=on;var p=document.getElementById('gestPv');if(p)p.classList.toggle('tracked',on);var c=document.getElementById('gestCur');if(c)c.hidden=!on;var d=document.getElementById('gestDot');if(d)d.hidden=!on;if(!on){rulerUI(null);hintUI(false)}document.body.classList.toggle('gest-on',!!(on||G.on));document.dispatchEvent(new CustomEvent('gesty:track',{detail:{on:on}}))}
/* kursor: rękawica otwarta / OK (pinch) / kulka (wskazujący, pięść); hotspot = czubek wskazującego / styk palców; w trybie miarki obok pinch lupa (cyan) */
function cursor(x,y,g,rl){var c=document.getElementById('gestCur');if(!c)return;var k=g=='pinch'?'pinch':(g=='fist'||g=='point')?'ball':'open',h=HOT[k];c.style.left=(x*100)+'%';c.style.top=(y*100)+'%';c.style.marginLeft=(-h[0])+'px';c.style.marginTop=(-h[1])+'px';c.dataset.g=g||'';
 if(c.dataset.k!==k){c.dataset.k=k;var im=document.getElementById('gestCurI');if(im)im.src=IMG[k]}
 var lp=document.getElementById('gestLoupe');if(lp)lp.hidden=!rl}
function rulerUI(r){var e=document.getElementById('gestRuler');if(!e)return;if(!r||!r.on){if(!e.hidden){e.hidden=true;G.rzone=''}return}
 if(e.hidden){e.hidden=false;var l=e.querySelectorAll('.grs span');l[0].textContent=Tr('gZout');l[1].textContent=Tr('gZc');l[2].textContent=Tr('gZin');e.querySelector('.grn').textContent=Tr('gSnap');e.setAttribute('aria-label',Tr('gZoom'));G.zrSeen=1;lss('gesty_zr_seen','1')}
 if(G.rzone!==r.zone){G.rzone=r.zone;e.dataset.z=r.zone}}
function hintUI(on){var h=document.getElementById('gestHint');if(!h)return;if(on){if(h.hidden){h.textContent=Tr('gHint');h.hidden=false}}else if(!h.hidden)h.hidden=true}
function v3frame(lm,o,t){if(!G.v3)return;if(lm){G.hit++;G.lastHand=t;if(!G.tracked&&G.hit>=G.trackN)setTracked(true);
  var P=o.tip||o.pointer||{x:1-o.info.cx,y:o.info.cy};G.cur=P;if(o.gesture=='pinch')G.pinP=P;var rl=!!(o.ruler&&o.ruler.on);
  if(G.tracked){cursor(P.x,P.y,o.gesture,rl);var d=document.getElementById('gestDot');if(d){d.style.left=(P.x*100)+'%';d.style.top=(P.y*100)+'%'}rulerUI(o.ruler);
   hintUI(!rl&&!G.zrSeen&&!lsg('gesty_zr_seen')&&G.zr&&o.gesture!='pinch'&&o.gesture!='fist')}}
 else{G.hit=0;if(G.tracked&&t-G.lastHand>G.restoreMs)setTracked(false)}
 if(o.click)G.lastClick=gClick();if(o.reset)G.lastReset=gReset();if(o.center)G.lastCenter=gCenter()}
function gClick(){var P=G.pinP||G.cur||{x:.5,y:.5},v=document.getElementById('view'),cv=v&&v.querySelector('canvas:not(#gestC)');
 document.dispatchEvent(new CustomEvent('gesty:click',{detail:{x:P.x,y:P.y}}));if(!cv)return 'event';var r=cv.getBoundingClientRect(),cx=r.left+P.x*r.width,cy=r.top+P.y*r.height;
 // klik tylko w canvas 3D (bez przycisków UI/AR)
 var oc0=oc(),en0=oc0&&oc0.enabled;if(oc0)oc0.enabled=false;/* oria-192: syntetyczny pointerdown nie ma aktywnego wskaźnika – OrbitControls rzucał NotFoundError (setPointerCapture) */
 ['pointerdown','pointerup','click'].forEach(function(n){try{cv.dispatchEvent(new (n=='click'?MouseEvent:(root.PointerEvent||MouseEvent))(n,{bubbles:true,clientX:cx,clientY:cy}))}catch(e){}});if(oc0)oc0.enabled=en0!==false;return 'canvas'}
function gReset(){document.dispatchEvent(new CustomEvent('gesty:reset'));var r=gHome();return r=='none'?'event':r}
function gCenter(){document.dispatchEvent(new CustomEvent('gesty:center'));G.centerN=(G.centerN||0)+1;return gHome()}
function stop(why){G.on=false;G.lid++;clearTimeout(G.wdT);try{if(G.ac&&!G.lm){G.ac.abort();G.lmP=null}}catch(e){}if(IOS){var l0=G.lm;G.lm=null;if(l0&&l0.close)setTimeout(function(){try{l0.close()}catch(e){}},60)}try{var v0=document.getElementById('gestV');if(v0&&v0.pause)v0.pause()}catch(e){}if(G.v3){G.hit=0;setTracked(false)}G.lastStop=why||'';G.tw=0;rulerUI(null);hintUI(false);document.body.classList.remove('gest-on');clearTimeout(G.timer);stopCam();label();var c=document.getElementById('gestC');if(c)c.getContext('2d').clearRect(0,0,c.width,c.height)}
G.start=start;G.stop=stop;
var FPS=IOS?15:17,PER=1000/FPS,last=0,frames=[];
/* oria-183 HANG-1: jedna pętla (token G.lid), oddaj wątek ≥ czas inferencji (≤50% CPU głównego wątku), watchdog: klatka >1.5 s po rozgrzewce lub 3 błędy → bezpieczne wyłączenie + toast */
var WD=IOS?{hardMs:500,warm:5,maxErr:3,startMs:30000,slowN:3}:{hardMs:1500,warm:5,maxErr:3,startMs:20000,slowN:2};G.WD=WD;
var TT={pl:{slow:'Sterowanie dłonią wyłączone – urządzenie nie nadąża (bezpiecznie). Spróbuj ponownie.',err:'Sterowanie dłonią wyłączone – błąd modelu/kamery. Spróbuj ponownie.',timeout:'Sterowanie dłonią wyłączone – kamera lub model nie odpowiada.',unavail:'Sterowanie dłonią niedostępne na tym urządzeniu.|Obracaj model palcem.'},en:{slow:'Hand control turned off – device can’t keep up. Try again.',err:'Hand control turned off – model/camera error. Try again.',timeout:'Hand control turned off – camera or model not responding.',unavail:'Hand control isn’t available on this device.|Rotate the model with your finger.'},de:{slow:'Handsteuerung deaktiviert – Gerät zu langsam. Erneut versuchen.',err:'Handsteuerung deaktiviert – Modell-/Kamerafehler. Erneut versuchen.',timeout:'Handsteuerung deaktiviert – Kamera oder Modell reagiert nicht.',unavail:'Handsteuerung ist auf diesem Gerät nicht verfügbar.|Modell mit dem Finger drehen.'}};
function lg(){var l='pl';try{l=localStorage.getItem('oria_lang')||'pl'}catch(e){}var m=(location.hash||'').match(/lang=(en|pl|de)/);l=m?m[1]:l;return TT[l]?l:'pl'}
function toast(k){try{var t=document.getElementById('gestToast');if(t)t.remove();t=document.createElement('div');t.id='gestToast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');var s=String(TT[lg()][k]||TT.pl[k]).split('|'),a=document.createElement('div'),h;a.textContent=s[0];a.style.cssText='font:600 13px/1.35 system-ui,-apple-system,sans-serif;color:#E6EAF2';t.appendChild(a);if(s[1]){h=document.createElement('div');h.textContent=s[1];h.style.cssText='font:500 12px/1.35 system-ui,-apple-system,sans-serif;color:#8a94a6;margin-top:2px';t.appendChild(h)}var hd=document.querySelector('header'),tp=64;try{if(hd){var r=hd.getBoundingClientRect();if(r.bottom>0&&r.bottom<200)tp=Math.round(r.bottom)+8}}catch(e){}t.style.cssText='position:fixed;left:50%;top:'+tp+'px;transform:translateX(-50%);z-index:99999;width:max-content;max-width:min(92vw,420px);box-sizing:border-box;padding:9px 14px 9px 16px;border-radius:10px;background:#10141d;border:1px solid rgba(34,211,238,.35);border-left:3px solid #22d3ee;box-shadow:0 6px 24px rgba(0,0,0,.4)';document.body.appendChild(t);setTimeout(function(){t.remove()},6000)}catch(e){}}
function safeOff(k){G.wdTrip=(G.wdTrip||0)+1;G.wdWhy=k;stop('watchdog:'+k);if(IOS&&!G.camStall){lss('gesty_dis',String(Date.now()));k='unavail';label()}/* iOS: po awarii/timeoucie nie próbuj ponownie (14 dni; ?gest=1 resetuje) */toast(k);try{document.dispatchEvent(new CustomEvent('gesty:watchdog',{detail:{why:k}}))}catch(e){}}
G.lid=0;
/* oria-189: twardy timeout startu (iOS 30 s). Wolne pobieranie (21 MB po LTE) nie jest winą urządzenia: dopóki bajty płyną (≤10 s przerwy, max 120 s) czekamy; timeout pobierania = komunikat bez blokady 14 dni */
function startTO(id){if(!(G.on&&id===G.lid&&!G.stats.n))return;var now=performance.now();if(IOS&&!G.dlDone&&now-G.loadT0<120000&&now-G.lastProg<10000){G.wdT=setTimeout(function(){startTO(id)},5000);return}if(IOS&&!G.dlDone)G.camStall=1;safeOff('timeout')}
/* oria-183 HANG-1: wnioskowanie MediaPipe jest SYNCHRONICZNE na wątku głównym (300–3000 ms/klatkę na słabym GPU/CPU) – w trakcie dotyku/obrotu/pinch nie wnioskujemy, żeby nie blokować gestów dotykowych i OrbitControls */
var PT=0;['pointerdown','pointermove','touchstart','touchmove','wheel'].forEach(function(n){document.addEventListener(n,function(){PT=performance.now()},{capture:true,passive:true})});G.touchQuiet=250;
function loop(id){if(!G.on||id!==G.lid)return;var v=G.video,now=performance.now(),lat=0;
 if(now-PT<G.touchQuiet){G.skipTouch=(G.skipTouch||0)+1;G.timer=setTimeout(function(){loop(id)},120);return}
 if(v&&v.readyState>=2&&v.currentTime!==G._lt){G._lt=v.currentTime;var t0=performance.now(),src=v,r=null;try{if(G.delegate=='CPU'){G._cv=G._cv||document.createElement('canvas');var vw=v.videoWidth||320,vh=v.videoHeight||240;if(G._cv.width!==vw)G._cv.width=vw;if(G._cv.height!==vh)G._cv.height=vh;G._cv.getContext('2d').drawImage(v,0,0);src=G._cv}r=G.lm.detectForVideo(src,t0)}catch(e){G.wd.err++;G.err=String(e&&e.message||e);if(G.wd.err>=WD.maxErr){safeOff('err');return}G.timer=setTimeout(function(){loop(id)},200);return}lat=performance.now()-t0;
  if(G.stats.n>=WD.warm){if(lat>WD.hardMs){if(++G.wd.slow>=WD.slowN){safeOff('slow');return}}else G.wd.slow=0}
  var lm=r&&r.landmarks&&r.landmarks[0]||null,o=G.mapper.step(lm,t0);if(o.yaw||o.pitch||o.zoom!=1)apply(o);
  if(o.explode)G.lastExplode=explodeToggle();v3frame(lm,o,t0);
  frames.push(t0);frames=frames.filter(function(f){return t0-f<1000});var S=G.stats;S.n++;if(S.n===1)label();S.lat=lat;S.lat_sum+=lat;S.lat_max=Math.max(S.lat_max,lat);S.fps=frames.length;S.gesture=o.gesture;(G.log=G.log||[]).push({t:Math.round(t0),g:o.gesture,lat:+lat.toFixed(1),p:o.paused,e:o.explode});if(G.log.length>2000)G.log.shift();
  draw(document.getElementById('gestC'),lm,o.gesture);
  status((G.dbg?'['+G.delegate+(G.lastStop?' stop:'+G.lastStop:'')+(G.tracked?' T':'')+'] ':'')+(o.paused?Tr('gLost'):((G.dbg||G.dbgUi?S.fps+' fps · '+lat.toFixed(0)+' ms · ':'')+(o.gesture=='open'?Tr('gOpen'):o.gesture=='pinch'?Tr('gPinch'):o.gesture=='fist'?Tr('gFist'):o.gesture))));}
 if(!G.on||id!==G.lid)return;var wait=Math.max(5,PER-(performance.now()-now),Math.min(2000,lat*2));G.timer=setTimeout(function(){loop(id)},wait)}
// AR: stop PRZED akcją, w fazie capture; nigdy getUserMedia
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[rel=ar],#aar,#har,#arb,#fsar,#arQL,[slot=ar-button]');if(a&&G.on)stop('ar')},true);
document.addEventListener('visibilitychange',function(){if(document.hidden&&G.on)stop('hidden')});
window.addEventListener('pagehide',function(){if(G.on)stop('pagehide')});/* oria-183 HANG-1: iOS PWA – kamera nie zostaje włączona po zamknięciu/przejściu */
// zamknięcie 3D: canvas renderera zniknął
var GONE_MS=900,goneT=0;
function watch(){var v=document.getElementById('view'),cv=v&&v.querySelector('canvas:not(#gestC)');
 if(cv){clearTimeout(goneT);goneT=0;try{noteOc()}catch(e){}var u=document.getElementById('gestUI');
  if(u&&u.parentNode!==v){v.appendChild(u);/* oria-192: przeniesiony <video> jest wstrzymany przez przeglądarkę – wznów (inaczej po przebudowie widoku nowego projektu brak klatek) */if(G.on){try{var vv=document.getElementById('gestV');if(vv&&vv.paused&&vv.srcObject)vv.play().catch(function(){})}catch(e){}}}else if(!u){ui();if(G.on&&G.v3){/* #view podmieniony: nowe video, ta sama sesja */stopCam();G.on=true;openCam().catch(function(){stop('cam-reopen')});label()}}return}
 if(!G.v3){if(G.on)stop('3d-close');var u2=document.getElementById('gestUI');if(u2)u2.remove();return}
 if(!goneT)goneT=setTimeout(function(){goneT=0;var v2=document.getElementById('view'),c2=v2&&v2.querySelector('canvas:not(#gestC)');if(c2)return;
  if(G.on)stop('3d-close');var u3=document.getElementById('gestUI');if(u3)u3.remove()},GONE_MS)}
G._watch=watch;
new MutationObserver(watch).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-lang],.lang button,#lang'))setTimeout(label,50)});
})(typeof window!=='undefined'?window:this);
