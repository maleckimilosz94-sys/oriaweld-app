/* Sterowanie dłonią – PIASKOWNICA. MediaPipe HandLandmarker (Apache-2.0, vendor/mediapipe). Tylko widok 3D w aplikacji, nigdy AR. */
(function(root){
'use strict';
// ---------- czysta logika (testowalna bez kamery) ----------
function d(a,b){return Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0))}
function classify(lm){var w=lm[0],palm=d(w,lm[9])||1e-6,ext=0;
 [[8,6],[12,10],[16,14],[20,18]].forEach(function(p){if(d(w,lm[p[0]])>d(w,lm[p[1]])*1.12)ext++});
 var pr=d(lm[4],lm[8])/palm,c={x:0,y:0};[0,5,9,13,17].forEach(function(i){c.x+=lm[i].x/5;c.y+=lm[i].y/5});
 var g=ext===0?'fist':(pr<0.35&&ext>=2&&d(w,lm[12])>d(w,lm[10])*1.12)?'pinch':ext>=4?'open':'other';
 return {g:g,ext:ext,pinch:pr,cx:c.x,cy:c.y,palm:palm}}
function Mapper(o){o=o||{};var S={dead:o.dead||0.004,gain:o.gain||6,alpha:o.alpha||0.35,zoomGain:o.zoomGain||1.6,lostMs:o.lostMs||450,cycMs:o.cycMs||1600,mirror:o.mirror!==false};
 var st={prev:null,vx:0,vy:0,pin0:null,lastSeen:-1e9,paused:true,hist:[],last:null};
 function step(lm,t){var out={yaw:0,pitch:0,zoom:1,gesture:'none',paused:false,explode:false};
  if(!lm){st.pinL=false;if(t-st.lastSeen>S.lostMs){st.paused=true;st.prev=null;st.pin0=null;st.vx=st.vy=0}out.paused=st.paused;out.gesture='lost';return out}
  st.lastSeen=t;st.paused=false;var c=classify(lm);if(c.g=='pinch')st.pinL=true;else if(st.pinL&&c.g!='fist'&&c.pinch<0.85)c.g='pinch';else st.pinL=false;out.gesture=c.g;
  // cykle otwórz-zamknij
  var k=c.g=='open'?'O':c.g=='fist'?'F':null;if(k&&k!==st.last){st.hist.push({k:k,t:t});st.last=k}
  st.hist=st.hist.filter(function(h){return t-h.t<=S.cycMs});var s=st.hist.map(function(h){return h.k}).join('');
  if(/OFOF$/.test(s)){out.explode=true;st.hist=[]}
  if(c.g=='open'&&st.prev&&st.prev.g=='open'){var dx=c.cx-st.prev.cx,dy=c.cy-st.prev.cy;if(S.mirror)dx=-dx;
   if(Math.abs(dx)<S.dead)dx=0;if(Math.abs(dy)<S.dead)dy=0;st.vx=st.vx*(1-S.alpha)+dx*S.alpha;st.vy=st.vy*(1-S.alpha)+dy*S.alpha;
   out.yaw=-st.vx*S.gain;out.pitch=-st.vy*S.gain}
  else{st.vx=st.vy=0}
  if(c.g=='pinch'){if(st.pin0!=null){var r=c.pinch/st.pin0;if(Math.abs(r-1)>0.02)out.zoom=Math.pow(r,-S.zoomGain)}st.pin0=c.pinch}else st.pin0=null;
  // pięść = chwyt/stop: brak ruchu
  st.prev=c;out.info=c;return out}
 return {step:step,state:st,opts:S}}
var api={classify:classify,Mapper:Mapper};
if(typeof module!=='undefined'&&module.exports){module.exports=api;return}
root.GestMap=api;
// ---------- integracja z aplikacją ----------
var Tr=function(k){try{return root.__arT?root.__arT(k):k}catch(e){return k}};
var G={on:false,stream:null,lm:null,video:null,timer:0,facing:'user',stats:{fps:0,lat:0,n:0,lat_sum:0,lat_max:0},mapper:null,gumCalls:0,explode:0};
root.__gesty=G;
function oc(){return root.__arOc}
function apply(o){var c=oc();if(!c||!c.object)return;var cam=c.object,T=c.target,off=cam.position.clone().sub(T),sp=new THREE.Spherical().setFromVector3(off);
 sp.theta+=o.yaw;sp.phi=Math.max(0.08,Math.min(Math.PI/2-0.02,sp.phi+o.pitch));
 sp.radius=Math.max(c.minDistance||1,Math.min(c.maxDistance||1e9,sp.radius*o.zoom));off.setFromSpherical(sp);cam.position.copy(T).add(off);cam.lookAt(T);c.update()}
function explodeToggle(){G.explode++;if(root.EX&&typeof root.EX.toggle=='function'){root.EX.toggle();return 'api'}
 document.dispatchEvent(new CustomEvent('gesty:explode',{detail:{n:G.explode}}));return 'stub'}
var CONN=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function draw(cv,lm,g){var x=cv.getContext('2d'),W=cv.width,H=cv.height;x.clearRect(0,0,W,H);if(!lm)return;var m=G.facing=='user';
 var P=function(p){return [(m?1-p.x:p.x)*W,p.y*H]};x.lineWidth=2;x.strokeStyle=g=='fist'?'#f87171':g=='pinch'?'#a78bfa':'#22d3ee';
 CONN.forEach(function(c){var a=P(lm[c[0]]),b=P(lm[c[1]]);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke()});
 x.fillStyle='#e3e8ef';lm.forEach(function(p){var q=P(p);x.fillRect(q[0]-1.5,q[1]-1.5,3,3)})}
var MP=null;
function loadLm(){if(G.lm)return Promise.resolve(G.lm);var base=new URL('vendor/mediapipe/',document.baseURI).href;
 return import(base+'vision_bundle.mjs').then(function(v){MP=v;return v.FilesetResolver.forVisionTasks(base+'wasm')}).then(function(fs){
  var mk=function(dl){return MP.HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:base+'hand_landmarker.task',delegate:dl},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:0.5,minTrackingConfidence:0.5})};
  var pref=(function(){try{return localStorage.getItem('gesty_dl')}catch(e){return null}})();G.delegate=pref||'GPU';return mk(G.delegate).catch(function(){G.delegate='CPU';return mk('CPU')})}).then(function(l){G.lm=l;return l})}
function ui(){var v=document.getElementById('view');if(!v)return null;var u=document.getElementById('gestUI');if(u)return u;
 u=document.createElement('div');u.id='gestUI';u.innerHTML='<button id="gestBtn" class="gbtn" aria-pressed="false"></button><button id="gestCam" class="gbtn sm" hidden></button>'+
 '<div id="gestPv" hidden><video id="gestV" playsinline muted autoplay></video><canvas id="gestC" width="160" height="120"></canvas><div id="gestS"></div></div>';
 v.appendChild(u);label();u.querySelector('#gestBtn').onclick=function(e){e.stopPropagation();G.on?stop('user'):start()};
 u.querySelector('#gestCam').onclick=function(e){e.stopPropagation();G.facing=G.facing=='user'?'environment':'user';if(G.on){stopCam();openCam()}label()};
 u.addEventListener('pointerdown',function(e){e.stopPropagation()});return u}
function label(){var b=document.getElementById('gestBtn'),c=document.getElementById('gestCam');if(!b)return;b.textContent='✋ '+Tr(G.on?'gHandOff':'gHand');b.setAttribute('aria-pressed',G.on?'true':'false');b.classList.toggle('on',G.on);
 c.textContent=Tr(G.facing=='user'?'gCamB':'gCamF');c.hidden=!G.on;document.getElementById('gestPv').hidden=!G.on}
function status(t){var s=document.getElementById('gestS');if(s)s.textContent=t}
function openCam(){G.gumCalls++;return navigator.mediaDevices.getUserMedia({video:{facingMode:G.facing,width:{ideal:320},height:{ideal:240},frameRate:{ideal:20,max:30}},audio:false}).then(function(s){
  if(!G.on){s.getTracks().forEach(function(t){t.stop()});return}G.stream=s;var v=document.getElementById('gestV');v.srcObject=s;v.style.transform=G.facing=='user'?'scaleX(-1)':'';G.video=v;return v.play().catch(function(){})})}
function stopCam(){if(G.stream){G.stream.getTracks().forEach(function(t){t.stop()});G.stream=null}var v=document.getElementById('gestV');if(v)v.srcObject=null}
function start(){if(G.on)return;G.on=true;G.mapper=Mapper({mirror:true});G.stats={fps:0,lat:0,n:0,lat_sum:0,lat_max:0};label();status(Tr('gLoad'));
 Promise.all([loadLm(),openCam()]).then(function(){if(!G.on)return;G.mapper.opts.mirror=G.facing=='user';loop()}).catch(function(e){status(Tr('gNoCam')+(e&&e.name||e));G.err=String(e&&e.message||e);stop('error')})}
function stop(why){G.on=false;G.lastStop=why||'';clearTimeout(G.timer);stopCam();label();var c=document.getElementById('gestC');if(c)c.getContext('2d').clearRect(0,0,c.width,c.height)}
G.start=start;G.stop=stop;
var FPS=17,PER=1000/FPS,last=0,frames=[];
function loop(){if(!G.on)return;var v=G.video,now=performance.now();
 if(v&&v.readyState>=2&&v.currentTime!==G._lt){G._lt=v.currentTime;var t0=performance.now(),src=v;if(G.delegate=='CPU'){G._cv=G._cv||document.createElement('canvas');G._cv.width=v.videoWidth||320;G._cv.height=v.videoHeight||240;G._cv.getContext('2d').drawImage(v,0,0);src=G._cv}var r=G.lm.detectForVideo(src,t0),lat=performance.now()-t0;
  var lm=r&&r.landmarks&&r.landmarks[0]||null,o=G.mapper.step(lm,t0);if(o.yaw||o.pitch||o.zoom!=1)apply(o);
  if(o.explode)G.lastExplode=explodeToggle();
  frames.push(t0);frames=frames.filter(function(f){return t0-f<1000});var S=G.stats;S.n++;S.lat=lat;S.lat_sum+=lat;S.lat_max=Math.max(S.lat_max,lat);S.fps=frames.length;S.gesture=o.gesture;(G.log=G.log||[]).push({t:Math.round(t0),g:o.gesture,lat:+lat.toFixed(1),p:o.paused,e:o.explode});if(G.log.length>2000)G.log.shift();
  draw(document.getElementById('gestC'),lm,o.gesture);
  status(o.paused?Tr('gLost'):(S.fps+' fps · '+lat.toFixed(0)+' ms · '+(o.gesture=='open'?Tr('gOpen'):o.gesture=='pinch'?Tr('gPinch'):o.gesture=='fist'?Tr('gFist'):o.gesture)));}
 var wait=Math.max(5,PER-(performance.now()-now));G.timer=setTimeout(loop,wait)}
// AR: stop PRZED akcją, w fazie capture; nigdy getUserMedia
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[rel=ar],#aar,#har,#arb,#fsar,#arQL,[slot=ar-button]');if(a&&G.on)stop('ar')},true);
document.addEventListener('visibilitychange',function(){if(document.hidden&&G.on)stop('hidden')});
// zamknięcie 3D: canvas renderera zniknął
new MutationObserver(function(){var v=document.getElementById('view'),cv=v&&v.querySelector('canvas:not(#gestC)');
 if(cv&&!document.getElementById('gestUI'))ui();if(G.on&&(!v||!cv||!document.body.contains(cv)))stop('3d-close');
 if(!cv){var u=document.getElementById('gestUI');if(u)u.remove()}}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-lang],.lang button,#lang'))setTimeout(label,50)});
})(typeof window!=='undefined'?window:this);
