/* HALA f2 etap C — WebGL orbita (three.js z lib/). Kontrakt CONTRACT_ORBIT t841:
   select = obrót kamery w prawo do obiektu 550 ms ease-out; enter(nowy) = obrót na stół + zjazd z góry 500 ms, potem nawigacja.
   Synchro: DOM (orbita.js) jest jedynym źródłem sel; GL tylko renderuje i woła pick(i). */
(function(){
var T=window.THREE,R,S,C,G,objs=[],labels=[],raf=0,run=false,anim=null,root,pickFn,getSel,ang=0,camY=4.2,camR=8.6,lookY=.4;
function ease(t){return 1-Math.pow(1-t,3)}
function mat(c,o){return new T.MeshStandardMaterial({color:c,metalness:.7,roughness:.35,emissive:o||0x000000})}
function edges(m,col){var e=new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineBasicMaterial({color:col||0x22d3ee,transparent:true,opacity:.55}));m.add(e);return e}
function build(){var g=new T.Group(),k;
 // 0 nowy: stół spawalniczy
 k=new T.Group();var top=new T.Mesh(new T.BoxGeometry(1.6,.08,1),mat(0x3a4250));top.position.y=.8;edges(top);k.add(top);
 [[-.7,-.42],[.7,-.42],[-.7,.42],[.7,.42]].forEach(function(p){var l=new T.Mesh(new T.BoxGeometry(.07,.8,.07),mat(0x2a303a));l.position.set(p[0],.4,p[1]);edges(l,0x67e8f9);k.add(l)});g.add(k);objs.push(k);
 // 1 otworz: stos blach
 k=new T.Group();for(var i=0;i<4;i++){var b=new T.Mesh(new T.BoxGeometry(1.2,.05,.8),mat(0x5b6472));b.position.y=.1+i*.09;b.rotation.y=i*.06;edges(b);k.add(b)}g.add(k);objs.push(k);
 // 2 ostatnie: rura (historia)
 k=new T.Group();var r=new T.Mesh(new T.CylinderGeometry(.22,.22,1.5,28,1,true),mat(0x6b7480));r.rotation.z=Math.PI/2;r.position.y=.3;edges(r);k.add(r);g.add(k);objs.push(k);
 // 3 ustaw: kołnierz
 k=new T.Group();var f=new T.Mesh(new T.TorusGeometry(.45,.12,16,40),mat(0x6b7480));f.rotation.x=Math.PI/2;f.position.y=.15;edges(f);k.add(f);g.add(k);objs.push(k);
 objs.forEach(function(o,i){var a=i*Math.PI/2;o.position.set(Math.sin(a)*2.4,0,Math.cos(a)*2.4);o.userData.i=i});
 var ringG=new T.RingGeometry(2.38,2.42,96);var ring=new T.Mesh(ringG,new T.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:.35,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;g.add(ring);
 var fl=new T.Mesh(new T.CircleGeometry(6,48),new T.MeshStandardMaterial({color:0x0b0d14,metalness:.2,roughness:.9,transparent:true,opacity:.6}));fl.rotation.x=-Math.PI/2;fl.position.y=-.01;g.add(fl);
 return g}
function lbl(N,tr){var w=root.querySelector('.glbl')||document.createElement('div');w.className='glbl';w.innerHTML='';root.querySelector('.stage').appendChild(w);
 [].forEach.call(root.querySelectorAll('#hring .n'),function(n,i){var b=document.createElement('button');b.type='button';b.className='gn';b.innerHTML=n.querySelector('b').outerHTML+n.querySelector('small').outerHTML;b.onclick=function(){pickFn(i)};w.appendChild(b);labels.push(b)})}
function place(){var sel=getSel(),v=new T.Vector3(),W=R.domElement.clientWidth,H=R.domElement.clientHeight;
 objs.forEach(function(o,i){v.set(0,1.25,0);o.localToWorld(v);v.project(C);var b=labels[i];if(!b)return;b.style.transform='translate('+((v.x+1)/2*W)+'px,'+((1-v.y)/2*H)+'px) translate(-50%,-100%)';b.classList.toggle('sel',i===sel);b.style.opacity=v.z<1?'1':'0'})}
function cam(){C.position.set(Math.sin(ang)*camR,camY,Math.cos(ang)*camR);C.lookAt(Math.sin(ang)*(camR>4?0:1.6),lookY,Math.cos(ang)*(camR>4?0:1.6))}
function rm(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
function loop(t){raf=requestAnimationFrame(loop);if(root.clientWidth&&R.domElement.width!==Math.round(root.clientWidth*R.getPixelRatio()))resize();if(anim){var p=rm()?1:Math.min(1,(t-anim.t0)/anim.d),e=ease(p);anim.f(e);if(p>=1){var cb=anim.cb;anim=null;cb&&cb()}}
 var sel=getSel();objs.forEach(function(o,i){var s=i===sel?1.12:1;o.scale.lerp(new T.Vector3(s,s,s),rm()?1:.15);o.traverse(function(m){if(m.isLineSegments){m.material.opacity=i===sel?1:.45;m.material.color.setHex(i===sel?0x67e8f9:0x22d3ee)}})});
 cam();place();R.render(S,C)}
function resize(){var w=root.clientWidth||innerWidth,h=root.clientHeight||innerHeight;R.setSize(w,h,false);C.aspect=w/h;C.updateProjectionMatrix()}
var API={on:false,
 init:function(r,pk,gs){try{if(!T)return false;root=r;pickFn=pk;getSel=gs;
  var cv=document.createElement('canvas');cv.className='glcv';root.querySelector('.stage').prepend(cv);
  R=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});R.setPixelRatio(Math.min(2,devicePixelRatio||1));
  S=new T.Scene();C=new T.PerspectiveCamera(42,1,.1,100);
  S.add(new T.HemisphereLight(0xbfefff,0x0b0d14,.9));var sp=new T.SpotLight(0xffffff,1.6,20,.6,.5);sp.position.set(0,7,0);S.add(sp);var cy=new T.PointLight(0x22d3ee,.8,12);cy.position.set(3,2,3);S.add(cy);
  G=build();S.add(G);lbl();root.classList.add('gl');resize();addEventListener('resize',resize);
  var ray=new T.Raycaster(),m=new T.Vector2();cv.addEventListener('click',function(e){var b=cv.getBoundingClientRect();m.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(m,C);var h=ray.intersectObjects(objs,true)[0];if(h){var o=h.object;while(o&&o.userData.i===undefined)o=o.parent;if(o)pickFn(o.userData.i)}});
  var s0=getSel();if(s0>=0)ang=s0*Math.PI/2;
  API.on=true;raf=requestAnimationFrame(loop);run=true;
  dispatchEvent(new CustomEvent('orbit:ready',{detail:{gl:true}}));return true}catch(e){console.warn('hala gl',e);API.on=false;return false}},
 select:function(i){if(i<0)return;var a0=ang,tgt=i*Math.PI/2,d=tgt-a0;d=((d%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;/* w prawo = krótsza droga */
  anim={t0:performance.now(),d:550,f:function(e){ang=a0+d*e}}},
 enter:function(i,cb){var a0=ang,tgt=i*Math.PI/2,d=tgt-a0;d=((d%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;var r0=camR,y0=camY,l0=lookY;
  /* obrót na obiekt + zjazd z góry 500 ms */
  anim={t0:performance.now(),d:500,f:function(e){ang=a0+d*e;camR=r0+(3.2-r0)*e;camY=y0+(2.1-y0)*e;lookY=l0+(.6-l0)*e},cb:function(){setTimeout(function(){camR=r0;camY=y0;lookY=l0;cb&&cb()},60)}}},
 pause:function(){if(run){cancelAnimationFrame(raf);run=false}},
 resume:function(){if(!run&&API.on){run=true;raf=requestAnimationFrame(loop)}}};
window.HALA_GL=API})();
