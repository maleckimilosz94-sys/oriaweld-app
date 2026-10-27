/* Oriaweld – dźwięki (Web Audio, syntetyczne, bez plików). Nie dotyka AR. */
(function(){
var K='oria_snd',S={on:true,amb:true,vol:0.35,pre:'C_szklo'};
/* SND_PRESET: klik wspólny; różnią się powiew obrotu, powiew zoomu i ambient */
var SND_PRESET={
 A_stal:{z:{lp:187,sub:[45,60],g:0.0395,ng:0.05,tone:{f:311,g:0.006,vib:5}},
  a:{f:[50,100,150,200],g:[0.5,0.22,0.1,0.05],wv:'sawtooth',lp:380,n:0.03,lfo:0.04,dl:0}},
 B_drewno:{z:{lp:136,sub:[40,55],g:0.048,ng:0.04,tone:null},
  a:{f:[55,82.4,110,138.6],g:[0.5,0.25,0.12,0.06],wv:'triangle',lp:260,n:0.04,lfo:0.06,dl:0}},
 C_szklo:{ck:{g:0.63,at:0.002},z:{lp:230,sub:[55,70],g:0.0096,ng:0.0142,at:0.35,d:0.8,tone:{f:880,g:0.0012,vib:0}},
  a:{lvl:0.63,f:[65.4,98,130.8,196,784],g:[0.45,0.22,0.12,0.06,0.006],wv:'sine',lp:900,n:0.02,lfo:0.03,dl:0.45}}};
function P(){return SND_PRESET[S.pre]||SND_PRESET.C_szklo}
window.SND_PRESET=SND_PRESET;
try{var j=JSON.parse(localStorage.getItem(K));if(j)for(var k in j)S[k]=j[k]}catch(e){}
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
var C=null,M=null,FX=null,AMB=null,ambNodes=null,hidden=false;
function ctx(){if(C)return C;var A=window.AudioContext||window.webkitAudioContext;if(!A)return null;
 C=new A();M=C.createGain();M.gain.value=1;M.connect(C.destination);
 FX=C.createGain();FX.gain.value=S.on?0.9:0;FX.connect(M);
 AMB=C.createGain();AMB.gain.value=0;AMB.connect(M);return C}
function noiseBuf(sec){var n=C.sampleRate*sec|0,b=C.createBuffer(1,n,C.sampleRate),d=b.getChannelData(0),l=0;
 for(var i=0;i<n;i++){var w=Math.random()*2-1;l=(l+0.02*w)/1.02;d[i]=w*0.5+l*3}return b}
var NB=null;function nb(){return NB||(NB=noiseBuf(2))}
function arOpen(){return !!document.getElementById('ar')}
function ok(){return C&&S.on&&!hidden&&!arOpen()}
/* 1) klik – cyfrowy blip: kwadrat ~2.2 kHz, 20 ms, ostry atak, górnoprzepustowy transient, bez rezonansu */
function click(){if(!ok())return;var t=C.currentTime,o=C.createOscillator(),g=C.createGain(),h=C.createBiquadFilter();
 o.type='square';o.frequency.setValueAtTime(2200,t);h.type='highpass';h.frequency.value=900;h.Q.value=0.5;
 var ck=P().ck||{},cg=0.035*(ck.g||1),ca=ck.at||0.001;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(cg,t+ca);g.gain.setValueAtTime(cg,t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+0.02);
 o.connect(h);h.connect(g);g.connect(FX);o.start(t);o.stop(t+0.025)}
/* 2) powiew przy obracaniu – usunięty (Milosz 10:21: powiew tylko przy zoomie) */
/* 3) zoom = basowy powiew: szum LP + miękki sub, atak 120 ms, ~0.6 s, bez piknięcia */
var lastZ=0;
function zoom(dir){if(!ok())return;var now=performance.now();if(now-lastZ<250)return;lastZ=now;var z=P().z,t=C.currentTime,D=z.d||0.6;
 function env(g,pk){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(pk,t+(z.at||0.18));g.gain.exponentialRampToValueAtTime(0.0001,t+D)}
 var n=C.createBufferSource();n.buffer=nb();var f=C.createBiquadFilter();f.type='lowpass';f.Q.value=0.3;
 f.frequency.setValueAtTime(dir>0?z.lp*0.7:z.lp,t);f.frequency.linearRampToValueAtTime(dir>0?z.lp:z.lp*0.7,t+D);var ng=C.createGain();env(ng,z.ng);n.connect(f);f.connect(ng);ng.connect(FX);n.start(t,Math.random());n.stop(t+D+0.05);
 var o=C.createOscillator(),og=C.createGain();o.type='sine';var a=dir>0?z.sub[0]:z.sub[1],b=dir>0?z.sub[1]:z.sub[0];o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+D);env(og,z.g);o.connect(og);og.connect(FX);o.start(t);o.stop(t+D+0.05);
 if(z.tone){var q=C.createOscillator(),qg=C.createGain();q.type='sine';q.frequency.value=z.tone.f*(dir>0?1:0.94);if(z.tone.vib){var l=C.createOscillator(),lg=C.createGain();l.frequency.value=z.tone.vib;lg.gain.value=3;l.connect(lg);lg.connect(q.frequency);l.start(t);l.stop(t+D)}
  qg.gain.setValueAtTime(0.0001,t);qg.gain.exponentialRampToValueAtTime(z.tone.g,t+0.25);qg.gain.exponentialRampToValueAtTime(0.0001,t+D);q.connect(qg);qg.connect(FX);q.start(t);q.stop(t+D+0.05)}}
/* 4) ambient (wg presetu) */
function ambStart(){if(!C||ambNodes)return;var a=P().a,t=C.currentTime,lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=a.lp;lp.connect(AMB);
 if(a.dl){var d=C.createDelay(2),fb=C.createGain();d.delayTime.value=a.dl;fb.gain.value=0.45;lp.connect(d);d.connect(fb);fb.connect(d);d.connect(AMB)}
 var ns=[];a.f.forEach(function(fr,i){var o=C.createOscillator();o.type=i?'sine':a.wv;o.frequency.value=fr;o.detune.value=(i%2?3:-3);
  var g=C.createGain();g.gain.value=a.g[i];var l=C.createOscillator(),lg=C.createGain();l.frequency.value=a.lfo+i*0.031;lg.gain.value=a.g[i]*0.5;l.connect(lg);lg.connect(g.gain);
  o.connect(g);g.connect(lp);o.start(t);l.start(t);ns.push(o,l)});
 var n=C.createBufferSource();n.buffer=nb();n.loop=true;var nf=C.createBiquadFilter();nf.type='lowpass';nf.frequency.value=180;var ng=C.createGain();ng.gain.value=a.n;n.connect(nf);nf.connect(ng);ng.connect(lp);n.start(t);ns.push(n);
 ambNodes={ns:ns,out:lp};ambApply()}
function ambRestart(){if(!ambNodes)return;var x=ambNodes;ambNodes=null;AMB.gain.setTargetAtTime(0,C.currentTime,0.2);setTimeout(function(){x.ns.forEach(function(n){try{n.stop()}catch(e){}});try{x.out.disconnect()}catch(e){}ambStart()},700)}
function ambApply(){if(!C)return;var v=(S.amb&&!hidden&&!arOpen())?S.vol*0.12*(P().a.lvl||1):0;AMB.gain.setTargetAtTime(v,C.currentTime,v?1.5:0.3)}
function fxApply(){if(FX)FX.gain.setTargetAtTime(S.on&&!hidden?0.9:0,C.currentTime,0.05)}
/* gest użytkownika – iOS */
function unlock(){var c=ctx();if(!c)return;if(c.state!='running')c.resume();ambStart()}
['pointerdown','touchend','keydown'].forEach(function(e){document.addEventListener(e,unlock,{capture:true,passive:true})});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button,[role=button],a.btn');if(b)click()},true);
document.addEventListener('visibilitychange',function(){hidden=document.hidden;if(C){if(hidden)C.suspend();else C.resume()}ambApply();fxApply()});
setInterval(ambApply,1500);/* wycisza ambient gdy otwarte AR */
/* hook OrbitControls – tylko obserwacja kamery, bez zmiany logiki */
function hook(){var O=window.THREE&&THREE.OrbitControls;if(!O||O.prototype.__snd)return!!O;var up=O.prototype.update;O.prototype.__snd=1;
 O.prototype.update=function(){var c=this.object,tg=this.target,r=up.apply(this,arguments);if(!c||!tg||!C)return r;
  var d=c.position.distanceTo(tg),az=Math.atan2(c.position.x-tg.x,c.position.z-tg.z),el=Math.acos(Math.max(-1,Math.min(1,(c.position.y-tg.y)/(d||1)))),p=this.__sp;
  if(p){   var dz=(d-p.d)/(p.d||1);if(Math.abs(dz)>0.004)zoom(dz<0?1:-1)}
  this.__sp={a:az,e:el,d:d};return r};return true}
if(!hook()){var hi=setInterval(function(){if(hook())clearInterval(hi)},500)}
/* ustawienia */
function row(){var w=document.createElement('div');w.id='sndrows';
 w.innerHTML='<div class="fsrow"><span>Dźwięki</span><div class="fsseg" data-snd="on"><button data-v="1">Wł.</button><button data-v="0">Wył.</button></div></div>'+
 '<div class="fsrow"><span>Brzmienie</span><div class="fsseg" data-pre="1"><button data-v="A_stal">Stal</button><button data-v="B_drewno">Drewno</button><button data-v="C_szklo">Szkło</button></div></div>'+
 '<div class="fsrow"><span>Tło skupienia</span><div class="fsseg" data-snd="amb"><button data-v="1">Wł.</button><button data-v="0">Wył.</button></div></div>'+
 '<div class="fsrow"><span>Głośność tła</span><input type="range" id="sndvol" min="0" max="1" step="0.05" aria-label="Głośność tła" style="flex:1;max-width:160px;accent-color:#2ad"></div>';
 function sync(){[].forEach.call(w.querySelectorAll('[data-snd]'),function(sg){var k=sg.dataset.snd;[].forEach.call(sg.children,function(b){var on=(b.dataset.v=='1')==!!S[k];b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})});[].forEach.call(w.querySelectorAll('[data-pre] button'),function(b){var on=b.dataset.v==S.pre;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});w.querySelector('#sndvol').value=S.vol}
 w.addEventListener('click',function(e){var pb=e.target.closest('[data-pre] button');if(pb){S.pre=pb.dataset.v;save();sync();unlock();ambRestart();return}var b=e.target.closest('[data-snd] button');if(!b)return;S[b.parentNode.dataset.snd]=b.dataset.v=='1';save();sync();unlock();fxApply();ambApply()});
 w.querySelector('#sndvol').addEventListener('input',function(e){S.vol=+e.target.value;save();unlock();ambApply()});sync();return w}
new MutationObserver(function(){var p=document.querySelector('#msheet .mpanel');if(p&&!p.querySelector('#sndrows')){var r=row(),i=p.querySelector('#minst');p.insertBefore(r,i)}}).observe(document.body,{childList:true,subtree:true});
window.__snd={click:click,zoom:zoom,S:S,preset:function(k){if(SND_PRESET[k]){S.pre=k;save();ambRestart()}}};
})();
