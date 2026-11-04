/* oria155 – WIZJA (lokalnie). Wyłącznik: window.__noW155=1 lub #w155=0. Geometria w mm bez zmian (m.size, m.mesh, eksport nietknięte).
 1) Cienka blacha (t < 2% największego wymiaru) w podglądzie 3D: kładziemy ją na stole (jak płytę) i pogrubiamy WIZUALNIE
    tylko scale.z siatki + krawędzi do min. 1,2% max wymiaru; jaśniejsza emisja. Etykiety wymiarów (np. „4 mm”) bez zmian.
 2) Odznaka klasy: po P2 rodzaj wybrał użytkownik, więc „100% pewność klasy” obok „Pewność analizy 58%” było sprzeczne.
    Teraz odznaka nie pokazuje procentu – „wybrane w P2”. Jedynym procentem zostaje pewność analizy (conf2 po pewnosc152). */
(function(){function off(){try{return window.__noW155||/[#&]w155=0/.test(location.hash)}catch(e){return false}}
var T={pl:'wybrane w P2',en:'chosen in P2',de:'in P2 gewählt'};
function patchKB(){var B=window.__B2UI;if(!B||!B.KB||B.KB.__w155)return;var o=B.KB;B.KB=function(m,c,fb){if(off()||!(m&&m.p2))return o.apply(this,arguments);
 var h=o.call(this,m,100,fb),l=(this.L&&this.L())||'pl';return h.replace(/<b>100%<\/b><\/span> <small>[^<]*<\/small>/,'</span> <small class="w155p2">'+(T[l]||T.pl)+'</small>')};B.KB.__w155=1}
var last=null;function thin(){if(off())return;var R=window.R3,g=R&&R.grp;if(!g||g===last||!window.THREE)return;var m=window.AUTO&&AUTO.last;if(!m||!m.size)return;
 var s=m.size.slice().sort(function(a,b){return a-b}),t=s[0],mx=s[2];if(!(t>0&&t<0.02*mx)){last=g;return}
 var b=new THREE.Box3().setFromObject(g),z=b.getSize(new THREE.Vector3());if(!(z.z<0.03*Math.max(z.x,z.y))){last=g;return} /* już leży / inna orientacja */
 last=g;var k=Math.max(1,0.012*mx/t);g.children.forEach(function(o){if(o.isMesh||o.isLineSegments){if(!o.userData.holo||o.isLineSegments)o.scale.z*=k;if(o.isMesh&&o.material&&o.material.emissive){o.material.emissiveIntensity=Math.max(o.material.emissiveIntensity,0.55);if(o.material.userData&&o.material.userData.h)o.material.userData.h.e=0.55}}});
 g.rotation.x=-Math.PI/2;g.updateMatrixWorld(true);var b2=new THREE.Box3().setFromObject(g),c=b2.getCenter(new THREE.Vector3());g.position.x-=c.x;g.position.z-=c.z;g.position.y-=b2.min.y;
 g.userData.w155={k:+k.toFixed(2),t:t};try{fix156(g,m,t)}catch(e){console.log('w156 err '+e)}try{fix157(g,t)}catch(e){console.log('w157 err '+e)}console.log('w155: cienka blacha t='+t+' mm, wizualnie ×'+k.toFixed(2)+', położona na stole')}

/* oria156: po położeniu blachy (1) cień – wymuszamy jednorazowe przeliczenie mapy cieni (autoUpdate=false w arStage);
   (2) wymiary – arDecor zbudował „arDims” w świecie dla pozycji pionowej; przebudowujemy je dla nowej orientacji.
   Etykiety to sprite’y (zawsze przodem do kamery). Teksty = mm z modelu (m.size), grubość = rzeczywiste t, nie wizualne. */
function fix156(g,m,t){if(window.__noW156)return;var sc=g;while(sc.parent)sc=sc.parent;g.updateMatrixWorld(true);
 sc.onBeforeRender=function(ren){try{ren.shadowMap.needsUpdate=true}catch(e){}sc.onBeforeRender=function(){}};
 var old=sc.getObjectByName('arDims');if(!old||typeof arDim!=='function'){g.userData.w156={dims:0,shadow:1};return}
 var keep=old.children.filter(function(o){return o.isMesh&&o.geometry&&o.geometry.type==='PlaneGeometry'});sc.remove(old);
 var bx=new THREE.Box3();g.children.forEach(function(o){if(o.isMesh)bx.expandByObject(o)});var sz=bx.getSize(new THREE.Vector3()),mn=bx.min,mx=bx.max,h=Math.max(30,Math.max(sz.x,sz.y,sz.z)*0.075),dg=new THREE.Group();dg.name='arDims';
 var S=m.size.slice().sort(function(a,b){return b-a}),lx=sz.x>=sz.z?S[0]:S[1],lz=sz.x>=sz.z?S[1]:S[0];
 arDim(dg,new THREE.Vector3(mn.x,mx.y,mx.z),new THREE.Vector3(mx.x,mx.y,mx.z),new THREE.Vector3(0,0,h*2.2),Math.round(lx)+' mm',h);
 arDim(dg,new THREE.Vector3(mx.x,mx.y,mn.z),new THREE.Vector3(mx.x,mx.y,mx.z),new THREE.Vector3(h*2.2,0,0),Math.round(lz)+' mm',h);
 arDim(dg,new THREE.Vector3(mn.x,mn.y,mx.z),new THREE.Vector3(mn.x,mx.y,mx.z),new THREE.Vector3(-h*2.2,0,0),Math.round(t)+' mm',h);
 keep.forEach(function(p){p.position.set((mn.x+mx.x)/2,mn.y+1.5,(mn.z+mx.z)/2);dg.add(p)});
 dg.traverse(function(o){o.raycast=function(){}});sc.add(dg);try{if(window.__r3m)window.__r3m()}catch(e){}
 g.userData.w156={dims:[Math.round(lx),Math.round(lz),Math.round(t)],shadow:1}}
/* oria157 (wyłącznik __noW157=1 / #w157=0): (1) płyta nieprzezroczysta – materiał siatki opacity 1, depthWrite (stół nie prześwituje
   przez pasy między oknami; geometria/otwory/m.size bez zmian), (2) leader od etykiety grubości „t mm” do krawędzi płyty. */
function fix157(g,t){if(window.__noW157||/[#&]w157=0/.test(location.hash))return;var n=0;
 g.children.forEach(function(o){if(o.isMesh&&!o.userData.holo&&o.material){var M=o.material;M.userData.op=1;M.transparent=false;M.opacity=1;M.depthWrite=true;M.needsUpdate=true;n++}});
 var sc=g;while(sc.parent)sc=sc.parent;var dg=sc.getObjectByName('arDims'),lab=null,L=null;
 if(dg){dg.traverse(function(o){if(o.isSprite&&o.userData&&String(o.userData.txt||'').indexOf(Math.round(t)+' mm')===0)lab=o});if(!lab){var sp=[];dg.traverse(function(o){if(o.isSprite)sp.push(o)});lab=sp[2]||null}}
 if(lab){var bx=new THREE.Box3();g.children.forEach(function(o){if(o.isMesh)bx.expandByObject(o)});var e=new THREE.Vector3(bx.min.x,(bx.min.y+bx.max.y)/2,bx.max.z),
  p=lab.position.clone(),h=Math.max(12,0.03*Math.max(bx.max.x-bx.min.x,bx.max.z-bx.min.z)),a=p.clone().add(e.clone().sub(p).normalize().multiplyScalar(h*0.45));
  var G=new THREE.BufferGeometry().setFromPoints([a,e,e.clone().add(new THREE.Vector3(h*0.25,h*0.25,0)),e,e.clone().add(new THREE.Vector3(h*0.25,-h*0.25,0))]);
  L=new THREE.Line(G,new THREE.LineBasicMaterial({color:0xcffafe,transparent:false,opacity:1,depthTest:false,toneMapped:false}));L.renderOrder=999;L.name='w157leader';L.raycast=function(){};dg.add(L)}
 g.userData.w157={opaque:n,leader:!!L};try{if(window.__r3m)window.__r3m()}catch(e){}}
function keep157(){var g=window.R3&&R3.grp;if(!g||!g.userData.w157||window.__noW157)return;g.children.forEach(function(o){var M=o.material;if(o.isMesh&&!o.userData.holo&&M&&(M.transparent||M.opacity<1)){M.userData.op=1;M.transparent=false;M.opacity=1;M.depthWrite=true;M.needsUpdate=true}})}
setInterval(function(){try{patchKB();thin();keep157()}catch(e){console.log('w155 err '+e)}},300)})();
