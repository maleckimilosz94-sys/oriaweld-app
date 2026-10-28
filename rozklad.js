/* ORIAWELD – ekran „Rozbiórka”: rozkład modelu na części (dotknij model = rozłóż/złóż, dotknij część = nazwa + wymiary),
   siatka holograficzna (glow=strong), przełącznik skali 1:1 / Swobodna, AR: iPhone = animowany USDZ (Quick Look), Android = WebXR na stole.
   Osobny ekran – istniejący mechanizm AR (openAR, ar/live.html, startARFlow) NIE jest zmieniany. */
(function(){
var A=window.AR_I18N=window.AR_I18N||{pl:{},en:{},de:{}};
var K={pl:{rzBtn:'⊞ Rozbiórka na części',rzTitle:'Rozbiórka',rzXR:'AR na stole',rzQL:'AR: animacja rozkładu',rzPrep:'Przygotowuję AR…',rzNoXR:'AR (WebXR) niedostępne na tym urządzeniu',rzHint:'Dotknij model: rozłóż / złóż · dotknij część: nazwa i wymiary',rzClose:'Zamknij',rzNoModel:'Najpierw otwórz model 3D.'},
 en:{rzBtn:'⊞ Exploded view',rzTitle:'Exploded view',rzXR:'AR on table',rzQL:'AR: explode animation',rzPrep:'Preparing AR…',rzNoXR:'AR (WebXR) not available on this device',rzHint:'Tap the model: explode / collapse · tap a part: name and dimensions',rzClose:'Close',rzNoModel:'Open a 3D model first.'},
 de:{rzBtn:'⊞ Explosionsansicht',rzTitle:'Explosionsansicht',rzXR:'AR auf dem Tisch',rzQL:'AR: Explosionsanimation',rzPrep:'AR wird vorbereitet…',rzNoXR:'AR (WebXR) auf diesem Gerät nicht verfügbar',rzHint:'Modell antippen: zerlegen / zusammensetzen · Teil antippen: Name und Maße',rzClose:'Schließen',rzNoModel:'Zuerst ein 3D-Modell öffnen.'}};
['pl','en','de'].forEach(function(l){A[l]=A[l]||{};for(var k in K[l]){A[l][k]=K[l][k];if(window.TX&&TX[l]&&!(k in TX[l]))TX[l][k]=K[l][k]}});
function T(k){return (window.EX&&EX.T(k))||(K[EX?EX.lang():'pl']||K.pl)[k]||K.pl[k]}
var ISIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform=='MacIntel'&&navigator.maxTouchPoints>1);
/* animowany USDZ w przeglądarce (port anim_usdz.py): timeSamples xformOp:transform części, 0.6 s rozkład, 1 s pauza, 0.6 s złożenie, 30 fps, 80 klatek */
var KEYS=[18,48,66,80];function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function fac(f){return f<=18?ease(f/18):f<=48?1:f<=66?1-ease((f-48)/18):0}
function animUSDZ(blob,w){return blob.arrayBuffer().then(function(ab){var files=fflate.unzipSync(new Uint8Array(ab)),names=Object.keys(files),root=names.filter(function(n){return /\.usda?$/.test(n)})[0];
 var txt=fflate.strFromU8(files[root]),n=0;
 w.userData.ex.info.forEach(function(o){var id='Object_'+o.p.id,re=new RegExp('(def Xform "'+id+'"[\\s\\S]*?)matrix4d xformOp:transform = (\\( \\([^\\n]*\\) \\))');var m=txt.match(re);if(!m)return;
  var rows=m[2].replace(/^\( \(|\) \)$/g,'').split('), (').map(function(r){return r.split(',').map(Number)});var ts=[];
  for(var f=0;f<=80;f+=2){var k=fac(f),r=rows.map(function(x){return x.slice()});r[3][0]+=o.off.x*k;r[3][1]+=o.off.y*k;r[3][2]+=o.off.z*k;
   ts.push('        '+f+': ( '+r.map(function(x){return '('+x.join(', ')+')'}).join(', ')+' ),')}
  txt=txt.replace(m[0],m[1]+'matrix4d xformOp:transform.timeSamples = {\n'+ts.join('\n')+'\n    }');n++});
 txt=txt.replace('upAxis = "Y"','upAxis = "Y"\n    startTimeCode = 0\n    endTimeCode = 80\n    timeCodesPerSecond = 30\n    framesPerSecond = 30');
 files[root]=fflate.strToU8(txt);var off=0,out={};names.sort(function(x,y){return x==root?-1:y==root?1:0}).forEach(function(fn){var f=files[fn],h=off+30+fn.length+4,pad=(64-(h&63))&63;out[fn]=[f,{level:0,extra:{12345:new Uint8Array(pad)}}];off=h+pad+f.length});
 var b=new Blob([fflate.zipSync(out,{level:0})],{type:'model/vnd.usdz+zip'});b.animated=n;return b})}
var RZ=window.RZ={animUSDZ:animUSDZ,open:open,close:close,st:null};
function open(){if(!window.R3||!R3.grp){alert(T('rzNoModel'));return}if(document.getElementById('rozk'))return;
 var prevOc=window.__arOc,ov=document.createElement('div');ov.id='rozk';ov.setAttribute('role','dialog');ov.setAttribute('aria-label',T('rzTitle'));
 ov.innerHTML='<div class="rzv"></div><div class="rzt"><button class="rzx" id="rzX" aria-label="'+T('rzClose')+'">‹</button><span class="pill" id="rzPill"></span><span class="pill" id="rzCell"></span></div><div class="rzl" id="rzL"></div><div class="rzh" id="rzH"></div>'+
  '<div class="rzb"><button id="rzEx"></button><button id="rzGrid" aria-pressed="true"></button><button id="rzSc" aria-pressed="false"></button>'+
  (ISIOS?'<a id="rzQL" rel="ar" class="rzbtn ar" href="#"><img src="ar/ar_go.png" alt=""><span id="rzQLt"></span></a>':'<button id="rzXR" class="rzbtn ar"></button>')+'</div>';
 document.body.appendChild(ov);var $=function(i){return document.getElementById(i)};
 var ren=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});ren.setPixelRatio(Math.min(2,devicePixelRatio||1));ren.setSize(innerWidth,innerHeight);ren.xr.enabled=true;
 try{ren.outputEncoding=THREE.sRGBEncoding}catch(e){}ov.querySelector('.rzv').appendChild(ren.domElement);
 var sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xdfe8ff,0x20242c,1.1));var dl=new THREE.DirectionalLight(0xffffff,1.6);dl.position.set(1,2,1.2);sc.add(dl);
 var cam=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,0.005,50),holder=new THREE.Group();sc.add(holder);
 var gridOn=true,GLOWV='strong',w=null,dead=false,usdUrl=null,seq=0;
 function rebuild(){var t=w?w.userData.ex.t:0;holder.clear();w=EX.exportGroup(gridOn,GLOWV);EX.prepare(w);EX.set(w,t);holder.add(w);RZ.st.w=w;refreshAR()}
 var oc=new THREE.OrbitControls(cam,ren.domElement);
 RZ.st={get w(){return w},holder:holder,cam:cam,ren:ren,sc:sc,oc:oc,tap:null,toggle:null,refreshAR:null,ready:false};
 rebuild();EX.set(w,1);var bb=new THREE.Box3();EX.parts(w).forEach(function(p){bb.union(EX.box(p))});EX.set(w,0);var sz=bb.getSize(new THREE.Vector3()),D=Math.max(sz.x,sz.y,sz.z)*1.6+0.15;
 cam.position.set(D*0.75,D*0.62,D*0.95);oc.target.set(0,sz.y*0.4,0);oc.update();
 function ui(){var ex=w.userData.ex.t>0.5,m=EX.scale.get();$('rzEx').textContent=(ex?'⊟ ':'⊞ ')+(ex?T('exClose'):T('exOpen'));$('rzGrid').textContent='▦ '+T('grid');$('rzGrid').setAttribute('aria-pressed',gridOn);
  $('rzSc').textContent='📏 '+(m=='free'?T('scFree'):T('sc11'));$('rzSc').setAttribute('aria-pressed',m=='free');$('rzPill').textContent=EX.scale.pill(m);$('rzPill').className='pill'+(m=='free'?' warn':'');
  $('rzCell').textContent=gridOn?'▦ '+T('gridCell')+(m=='free'?' *':''):'';$('rzCell').style.display=gridOn?'':'none';$('rzH').textContent=T('rzHint');
  if($('rzQLt'))$('rzQLt').textContent=T('rzQL');if($('rzXR'))$('rzXR').textContent='◎ '+T('rzXR')}
 /* iPhone: <a rel=ar> z jednym <img>; plik przez ten sam cache SW co aplikacja (arURL/sameOrigin), skala przez #allowsContentScaling */
 function refreshAR(){ui();var a=$('rzQL');if(!a)return Promise.resolve();var my=++seq,m=EX.scale.get();a.removeAttribute('href');a.style.opacity=.55;$('rzQLt').textContent=T('rzPrep');
  var s=EX.exportGroup(gridOn,GLOWV);EX.prepare(s);EX.set(s,0);/* nakładka HOLOGRAM aplikacji przebudowuje grupę (nowe id) – tu eksport 1:1 tej samej grupy, żeby offsety animacji trafiały w części */if(s.userData)delete s.userData.holo;
  return EX.exportUSDZ(s).then(function(b){return animUSDZ(b,s)}).then(function(b){RZ.st.lastUSDZ=b;return (window.__arURL?__arURL(b,'rozklad.usdz'):Promise.resolve({url:URL.createObjectURL(b)}))}).then(function(r){if(my!==seq||dead)return;
   a.href=EX.scale.href(r.url,m);a.style.opacity=1;$('rzQLt').textContent=T('rzQL')}).catch(function(e){console.warn('rozklad AR',e);if(!dead&&$('rzQLt'))$('rzQLt').textContent=T('rzQL')})}
 RZ.st.refreshAR=refreshAR;
 $('rzEx').onclick=function(){toggle()};$('rzGrid').onclick=function(){gridOn=!gridOn;rebuild()};
 $('rzSc').onclick=function(){EX.scale.set(EX.scale.get()=='free'?'fixed':'free');$('rzL').innerHTML='';rebuild();if(EX.scale.get()=='fixed')w.scale.setScalar(1)};
 function toggle(cb){var to=w.userData.ex.t>0.5?0:1;$('rzL').innerHTML='';EX.animate(w,to,600,null,function(){ui();cb&&cb()})}RZ.st.toggle=toggle;
 var rc=new THREE.Raycaster(),down=null;
 ren.domElement.addEventListener('pointerdown',function(e){down=[e.clientX,e.clientY]});
 ren.domElement.addEventListener('pointerup',function(e){if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;var r=ren.domElement.getBoundingClientRect();tap((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1)});
 function tap(x,y,ray){if(ray)rc.ray.copy(ray);else rc.setFromCamera(new THREE.Vector2(x,y),cam);var h=rc.intersectObjects(EX.parts(w),false)[0];
  if(h){var l=EX.label(h.object);$('rzL').innerHTML='<span></span>';$('rzL').firstChild.textContent=l.text;return {part:l}}toggle();return {toggle:true}}RZ.st.tap=tap;
 function onGest(){if(!dead)toggle()}document.addEventListener('gesty:explode',onGest);
 /* Android: własna sesja WebXR tego ekranu (hit-test -> model na stole); dotknięcie = rozłóż/złóż / część; szczypanie tylko w trybie Swobodna */
 if($('rzXR'))$('rzXR').onclick=function(){(navigator.xr?navigator.xr.isSessionSupported('immersive-ar'):Promise.resolve(false)).then(function(ok){if(!ok){alert(T('rzNoXR'));return}
  return navigator.xr.requestSession('immersive-ar',{requiredFeatures:['hit-test'],optionalFeatures:['anchors','dom-overlay'],domOverlay:{root:ov}}).then(function(s){
   ren.xr.setReferenceSpaceType('local');return ren.xr.setSession(s).then(function(){return s.requestReferenceSpace('viewer')}).then(function(ref){return s.requestHitTestSource({space:ref})}).then(function(hts){
    holder.visible=false;holder.matrixAutoUpdate=false;var placed=false,pinch=null;
    s.addEventListener('select',function(ev){if(!placed)return;var p=ev.frame.getPose(ev.inputSource.targetRaySpace,ren.xr.getReferenceSpace());if(!p)return;var mm=new THREE.Matrix4().fromArray(p.transform.matrix);
     tap(0,0,new THREE.Ray(new THREE.Vector3().setFromMatrixPosition(mm),new THREE.Vector3(0,0,-1).transformDirection(mm)))});
    function tm(e){if(EX.scale.get()!='free'||e.touches.length!=2)return;var dd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(pinch)w.scale.multiplyScalar(dd/pinch);pinch=dd}
    function te(){pinch=null}addEventListener('touchmove',tm,{passive:true});addEventListener('touchend',te);
    s.addEventListener('end',function(){removeEventListener('touchmove',tm);removeEventListener('touchend',te);ren.setAnimationLoop(null);holder.matrixAutoUpdate=true;holder.matrix.identity();holder.visible=true;loop()});
    ren.setAnimationLoop(function(t,f){if(f&&!placed){var r=f.getHitTestResults(hts)[0];if(r){holder.matrix.fromArray(r.getPose(ren.xr.getReferenceSpace()).transform.matrix);holder.visible=true;placed=true}}ren.render(sc,cam)})})})}).catch(function(e){alert(T('rzNoXR')+' ('+e.message+')')})};
 function rs(){cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();ren.setSize(innerWidth,innerHeight)}addEventListener('resize',rs);
 function loop(){if(dead||ren.xr.isPresenting)return;ren.render(sc,cam);requestAnimationFrame(loop)}loop();
 function close(){dead=true;document.removeEventListener('gesty:explode',onGest);removeEventListener('resize',rs);try{oc.dispose();ren.dispose()}catch(e){}ov.remove();window.__arOc=prevOc;RZ.st=null}
 RZ.close=close;$('rzX').onclick=close;ui();RZ.st.ready=true}
function close(){if(RZ.st&&RZ.close!==close)RZ.close()}
/* przycisk obok „Zobacz w AR” w widokach wyniku 3D */
function inject(){['aar','arb','har'].forEach(function(id){var b=document.getElementById(id);if(!b||b.dataset.rz)return;b.dataset.rz=1;var n=document.createElement('button');n.className=(b.className||'main')+' alt rzopen';n.id='rzOpen';n.type='button';n.textContent=T('rzBtn');n.onclick=open;b.insertAdjacentElement('afterend',n)})}
new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});inject();
})();
