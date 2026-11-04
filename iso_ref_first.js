/* t937u ISO REFERENCE FIRST (minimalny, revertowalny). Wyłącz: window.__noIsoRef=1 lub #isoref=0.
 1) V.iso + kind=frame (klasyfikator, nie kreskowanie) -> kandydat isoFrame; kreskowanie solid->frame tylko OPT-IN __isoRefFrame (kolano/03 dawały fałszywą ramę); kandydat isoFrame na początek (bez wymogu __p2preApplied; bramka P2 w UI bez zmian).
 2) V.iso + wskazanie rura/kolano/kołnierz a brak kandydata rurowego -> NEEDS_REVIEW (bez fałszywej bryły jako "poprawny").
 3) V.iso + pick = przecięcie/wyciągnięcie z iou<0.3 -> NEEDS_REVIEW / APPROXIMATE (meta m.isoRef + prefiks w pick.how). */
(function(){
function off(){return window.__noIsoRef||/[#&]isoref=0/.test(location.hash)}
var TUBE=/\brur|rohr|pipe|kolan|bogen|elbow|flansch|flange|kołnierz|sweep/i,TUBEC=/rur|tarcz|tulej|obrot|kolan|kołnierz/i,BLOCK=/^(przecięcie rzutów|wyciągnięcie )/;
function L(){console.log.apply(console,['isoref:'].concat([].slice.call(arguments)))}
function manual(m){return (m.kindWhy||[]).indexOf('wybrane ręcznie')>=0}
function tubeHint(m){var p=window.__p2pre;if(p&&/Rura/.test(p.kind||''))return 'P2';if(TUBE.test(String(m.allText||'')))return 'tekst rysunku';return null}

/* t941u: płaska rama drabinkowa (ISO = rama płaska, wys. izo << gabaryt) – topologia z izo, skala z wymiarów, profil z tabelki (RHS a×b×t). Wyłącz: #isoladder=0 / __noIsoLadder */
function flatLadder(m,IF){if(window.__noIsoLadder||/[#&]isoladder=0/.test(location.hash)||!IF.geo||!window.THREE)return null;
 var T=String(m.allText||''),pr=T.match(/(\d{2,3})\s*[x×]\s*(\d{2,3})\s*[x×]\s*(\d{1,2}(?:[.,]\d)?)\s*(RHS|SHS|rura prost|Vierkant)/i);if(!pr)return null;
 IF.geo.computeBoundingBox();var b=IF.geo.boundingBox,ex=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z];if(!(ex[1]<0.25*Math.max(ex[0],ex[2])))return null;
 var cnt={};(T.match(/\b\d{2,4}[,.]00\b/g)||[]).forEach(function(x){var v=Math.round(parseFloat(x.replace(',','.')));if(v>=20)cnt[v]=(cnt[v]||0)+1});var vs=Object.keys(cnt).map(Number).sort(function(a,b){return b-a});if(vs.length<2)return null;
 var A=vs[0],B=vs.filter(function(v){return v>=0.3*A&&v<A})[0];if(!B)return null;var pa=+pr[1],pb=+pr[2];if(pa<pb){var r1=T.match(new RegExp('\\b\\d'+pa+'\\s*[x×]'));if(r1)pa=+r1[0].replace(/[^0-9]/g,'')}var pt=parseFloat(pr[3].replace(',','.')),ph=Math.max(pa,pb),pw=Math.min(pa,pb);
 var sm=vs.filter(function(v){return v>=0.05*A&&v<=0.3*A}).sort(function(a,b){return cnt[b]-cnt[a]||b-a})[0]||Math.round(0.15*A),G=[],zr=B/2-pw/2;
 function box(w,h,d,x,y,z){var g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return g.index?g.toNonIndexed():g}
 var Ll=2*zr-pw;G.push(box(pw,ph,A,-zr,ph/2,0),box(pw,ph,A,zr,ph/2,0));[-sm/2-pw/2,sm/2+pw/2].forEach(function(z){G.push(box(Ll,ph,pw,0,ph/2,z))});var a3=!(window.__a3Gen===false||/[#&]a3=0/.test(location.hash));if(a3&&!window.__noA3Mid)G.push(box(pw,ph,sm,0,ph/2,0));
 var n=0;G.forEach(function(g){n+=g.attributes.position.count});var a=new Float32Array(n*3),o=0;G.forEach(function(g){a.set(g.attributes.position.array,o);o+=g.attributes.position.array.length});var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));if(a3&&window.__a3Rot)g.rotateY(Math.PI/2);g.computeVertexNormals();g=window.finalize?window.finalize(g):g;
 var prof=pr[4].toUpperCase()+' '+pa+'×'+pb+'×'+pt;g.userData=g.userData||{};g.userData.partsList=['poprzeczka '+prof+', dł. '+A+' mm ×2 (rozstaw zewn. '+B+')','podłużnica '+prof+', dł. '+Math.round(Ll)+' mm ×2 (rozstaw w świetle '+sm+')'];
 g.userData.elements=[{id:'E1',t:'poprzeczka'},{id:'E2',t:'poprzeczka'},{id:'E3',t:'podłużnica'},{id:'E4',t:'podłużnica'}];if(a3&&!window.__noA3Mid){g.userData.partsList.push('łącznik środkowy '+prof+', dł. '+sm+' mm (z izometrii; wycięcia laserowe zgadnięte)');g.userData.elements.push({id:'E5',t:'łącznik'});}
 var note='rama płaska z izometrii: skala z wymiarów ('+A+'/'+B+'/'+sm+'), profil z tabelki '+prof+'; połączenia/wycięcia laserowe nie modelowane';
 return {name:'rama płaska drabinkowa (izometria – ISO first)',geo:g,how:'ISO-first · APPROXIMATE: '+note,force:1,p2iso:1,a3swap:a3?1:0,note:note}}
function wrapC(){var o=window.candidates;if(typeof o!=='function'||o.__isoRef)return;var w=function(m){
  if(off()||!m||!m.V||!m.V.iso)return o.apply(this,arguments);
  var R=m.isoRef={status:'OK',hint:tubeHint(m),notes:[]},hatch=m.kind==='solid'&&!manual(m)&&/kreskow/.test((m.kindWhy||[]).join(' '));
  var C=o.apply(this,arguments);
  if(!R.hint&&(m.kind==='frame'&&!hatch||window.__isoRefFrame&&hatch)&&!C.some(function(c){return c.p2iso})&&window.__p2isoFrame){try{var IF=window.__p2isoFrame(m,C);if(IF){IF.name='rama przestrzenna (izometria – ISO first)';IF.how='ISO-first: '+IF.how;C.unshift(IF);if(hatch){m.kindFrom=m.kind;m.kind='frame';m.kindWhy=['ISO first: izometria = rama (kreskowanie nie wygrywa)'].concat(m.kindWhy||[])}R.notes.push('isoFrame z izometrii');L('isoFrame',IF.how);try{var LD=flatLadder(m,IF);if(LD){C[0]=LD;R.status='APPROXIMATE';R.approx=1;R.src='isoLadder';R.notes.push(LD.note);L('isoLadder',LD.how)}}catch(e){L('isoLadder err '+e)}}}catch(e){L('isoFrame err '+e)}}
  if(R.hint&&!C.some(function(c){return TUBEC.test(c.name||'')})){R.status='NEEDS_REVIEW';R.notes.push('izometria/'+R.hint+' wskazuje rurę/kolano/kołnierz – brak kandydata rurowego');}
  return C};w.__isoRef=1;w.__mid=o.__mid;window.candidates=w}
/* integr t939u: arkusz nie wygląda na rysunek (ciemne tło ≥50% – zrzut ekranu aplikacji/UI) → NEEDS_REVIEW także bez izometrii. Wyłącz: #isorefscr=0 / __noIsoRefScr=1 */
function darkFrac(m){var I=m&&m.info,best=0;[I&&I.cv,I&&I.sheet].forEach(function(c){try{if(!c||!(c.width>0))return;var k=Math.min(1,160/Math.max(c.width,c.height)),w=Math.max(1,Math.round(c.width*k)),h=Math.max(1,Math.round(c.height*k)),t=document.createElement('canvas');t.width=w;t.height=h;var x=t.getContext('2d');x.drawImage(c,0,0,w,h);var a=x.getImageData(0,0,w,h).data,n=0;for(var i=0;i<a.length;i+=4)if(0.299*a[i]+0.587*a[i+1]+0.114*a[i+2]<60)n++;best=Math.max(best,n/(w*h))}catch(e){}});return best}
function scrGate(m){if(window.__noIsoRefScr||/[#&]isorefscr=0/.test(location.hash)||!m||!m.pick||manual(m))return;if(m.__darkF==null)m.__darkF=+darkFrac(m).toFixed(2);if(m.__darkF<0.5)return;
 var R=m.isoRef||(m.isoRef={status:'OK',hint:null,notes:[]});var nt='arkusz nie wygląda na rysunek techniczny (ciemne tło '+Math.round(m.__darkF*100)+'% – zrzut ekranu/UI?) – brak pokrycia wymiarami';if(R.notes.indexOf(nt)<0)R.notes.push(nt);R.status='NEEDS_REVIEW';R.src='zrzut'}
function wrapR(){var o=window.rebuild;if(typeof o!=='function'||o.__isoRef)return;var w=function(m){var r=o.apply(this,arguments);try{if(!off())scrGate(m);var R=m&&m.isoRef;if(R&&!off()&&m.pick){var p=m.pick;
  if(R.status==='OK'&&BLOCK.test(p.name||'')&&!(p.iou>=0.3)){R.status='NEEDS_REVIEW';R.notes.push('izometria jest, a wynik to '+p.name+' (iou '+(p.iou==null?'?':p.iou.toFixed(2))+') – bryła uproszczona')}
  if(R.status==='OK'&&!window.__noIsoGuessGate&&m.viou!=null&&m.viou<0.1){var gl=[];try{gl=(p.geo.userData.partsList||[]).filter(function(x){return /zgadni/.test(x)})}catch(e){}if(gl.length){R.status='APPROXIMATE';R.approx=1;R.src=R.src||'guess';R.notes.push('rzuty zgodne tylko '+m.viou.toFixed(2)+', '+gl.length+' elem. zgadnięte – APPROXIMATE');if(String(p.how||'').indexOf('APPROXIMATE')<0)p.how='APPROXIMATE · '+(p.how||'')}}
  if(R.status==='NEEDS_REVIEW'){R.approx=1;R.match='UNKNOWN';R.toP2=1;if(String(p.how||'').indexOf('NEEDS_REVIEW')<0)p.how='⚠ NEEDS_REVIEW · APPROXIMATE (tylko wizualizacja) – sprawdź w P2: '+R.notes.join('; ')+' · '+(p.how||'');try{var pl=p.geo.userData.partsList;if(pl&&pl[0]&&pl[0].indexOf('NEEDS_REVIEW')<0)p.geo.userData.partsList=['⚠ NEEDS_REVIEW – nierozpoznane: '+R.notes.join('; ')].concat(pl)}catch(e){}}
  L(m.kind,p.name,R.status,R.notes.join('; '))}}catch(e){L('err '+e)}return r};w.__isoRef=1;w.__mid=o.__mid;window.rebuild=w}
wrapC();wrapR();window.addEventListener('load',function(){setTimeout(function(){setTimeout(function(){wrapC();wrapR()},0)},0)});
})();
