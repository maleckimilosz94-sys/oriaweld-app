try{window.__dimFitGuard=new URLSearchParams(location.search).get('dfg')!=='0'}catch(e){}
/* SI: wtyczka "Wsparcie SI" (gałąź test/p2-checkpoint). Flaga window.__siAssist <- localStorage oria_si_assist (domyślnie ON na teście). */
(function(){
var K='oria_si_assist';
function get(){try{var v=localStorage.getItem(K);return v==null?true:v==='1'}catch(e){return true}}
/* SI ON -> lokalne flagi geometrii blachy/okien (NIE chmura, NIE __siWin/__siShape). OFF -> przywróć stan sprzed ON (domyślnie false). */
var GF=['__geoSheetFromHoles','__geoHolesKeep'],GP=null;
function geoFlags(on){if(on){if(!GP){GP={};GF.forEach(function(f){GP[f]=window[f]===true})}GF.forEach(function(f){window[f]=true})}
 else{GF.forEach(function(f){window[f]=GP?GP[f]:false});GP=null}}
function set(v){window.__siAssist=!!v;geoFlags(window.__siAssist);try{localStorage.setItem(K,v?'1':'0')}catch(e){}sync()}
window.__siAssist=get();geoFlags(window.__siAssist);window.siAssistSet=set;
function L(){try{return (location.hash.match(/lang=(en|pl|de)/)||[])[1]||localStorage.getItem('oria_lang')||'pl'}catch(e){return 'pl'}}
var TX={pl:['Wsparcie SI','włączone','wyłączone'],en:['AI assist','on','off'],de:['KI-Unterstützung','an','aus']};
function tx(i){return (TX[L()]||TX.pl)[i]}
/* CSS: fiolet #9b74f8, neon pulse */
var css=document.createElement('style');css.id='siAssistCss';
css.textContent='.siasw{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0 4px;padding:8px 10px;border-radius:12px;border:1px solid rgba(155,116,248,.35);background:rgba(155,116,248,.06);font-size:13px;color:#d8ccff;cursor:pointer;user-select:none;min-height:44px;box-sizing:border-box}'+
'.siasw .sitr{position:relative;flex:none;width:44px;height:24px;border-radius:12px;background:#283040;transition:background .25s}'+
'.siasw .sitr::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#9aa4b4;transition:transform .25s,background .25s}'+
'.siasw[aria-checked="true"] .sitr{background:#9b74f8;animation:sipulse 1.8s ease-in-out infinite}'+
'.siasw[aria-checked="true"] .sitr::after{transform:translateX(20px);background:#fff}'+
'.siasw[aria-checked="true"] .silb{color:#c4b0ff;text-shadow:0 0 6px rgba(155,116,248,.8)}'+
'@keyframes sipulse{0%,100%{box-shadow:0 0 4px #9b74f8,0 0 8px rgba(155,116,248,.45)}50%{box-shadow:0 0 10px #9b74f8,0 0 22px rgba(155,116,248,.75)}}'+
'@media (prefers-reduced-motion:reduce){.siasw[aria-checked="true"] .sitr{animation:none;box-shadow:0 0 8px #9b74f8}}';
(document.head||document.documentElement).appendChild(css);
function mk(){var d=document.createElement('div');d.className='siasw';d.setAttribute('role','switch');d.tabIndex=0;
 d.innerHTML='<span class="silb"></span><span class="sitr" aria-hidden="true"></span>';
 d.onclick=function(e){e.stopPropagation();set(!window.__siAssist)};
 d.onkeydown=function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();set(!window.__siAssist)}};
 return d}
function sync(){[].slice.call(document.querySelectorAll('.siasw')).forEach(function(d){d.setAttribute('aria-checked',window.__siAssist?'true':'false');d.setAttribute('aria-label',tx(0)+': '+tx(window.__siAssist?1:2));d.querySelector('.silb').textContent='✦ '+tx(0)})}
/* wstaw suwak do ekranu postępu automatu (#aprogov) */
function inject(){var ov=document.getElementById('aprogov');if(!ov||ov.querySelector('.siasw'))return;
 var host=ov.querySelector('.m28cl')||ov.querySelector('.pst')||ov.firstElementChild||ov;
 var d=mk();if(host.parentNode&&host!==ov)host.parentNode.insertBefore(d,host);else ov.appendChild(d);sync()}
new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
window.siAssistMount=function(el){var d=mk();el.appendChild(d);sync();return d}; /* dla ustawień */
/* Stub asystenta – lokalny, bez API/cloud. TODO(później): VLM kind hint, dim-conflict ask. */
window.siAssist={
 kindHint:function(m){ /* REAL5: kind_clf 1/5, fałszywa "rama" z wysoką pewnością -> NIE podpowiadamy ani nie wymuszamy kind z clf.
   Tylko za flagą window.__kindClfHint (domyślnie OFF) i wyłącznie jako słaba informacja (weak, bez auto-select w P2). */
  if(!window.__kindClfHint)return null;
  var h=m&&(m.kindHint||m.kind_clf);if(!h||!h.kind)return null;
  return {kind:h.kind,conf:Math.min(+h.conf||0,0.3),weak:true,noSelect:true}},
 dimConflict:function(m){ /* wymiary (nums) vs gabaryt modelu (m.size): czynnik osi >~28% od 1 -> konflikt */
  if(!m||!m.size||!m.nums)return null;var TH=window.__dimTh||0.28;
  var TB=m.titleBlockBox||(m.info&&m.info.titleBlockBox)||window.__titleBlockBox||null,MX=Math.max.apply(0,m.size.map(function(x){return +x||0}));m.__dimTbDrop=[];
  var inTB=function(n){if(window.__dimTbKeep||!TB||n.x==null)return false;var cx=n.x+(n.w||0)/2,cy=n.y+(n.h||0)/2,e=4;return cx>=TB.x-e&&cx<=TB.x+TB.w+e&&cy>=TB.y-e&&cy<=TB.y+TB.h+e};
  var tbNum=function(n,v){if(window.__dimTbKeep)return false;if(inTB(n))return true;var t=String(n.text||'');/* tabliczka: duże liczby całkowite (nr rys., data, skala) daleko od gabarytu, np. 2810 */
   if(v>=1000&&MX>0&&v>2.5*MX&&!/[.,]/.test(t))return true;if(/^(19|20)\d\d$/.test(t.trim())&&MX>0&&Math.abs(v/MX-1)>0.1)return true;return false};
  var N=[],seen={};m.nums.forEach(function(n){var p=n.p;if(p&&tbNum(n,p.value)){m.__dimTbDrop.push(p.value);return}if(!p||!(p.value>=10&&p.value<6000)||p.prefix=='ø'||p.prefix=='Ø'||p.tol)return;if((n.conf||0)<70&&n.src!='strip')return;var v=Math.round(p.value*10)/10;if(seen[v])return;seen[v]=1;N.push(v)});
  (m.manual||[]).forEach(function(x){if(x.value>=10&&!seen[x.value]){seen[x.value]=1;N.push(x.value)}});
  if(!N.length)return null;N.sort(function(a,b){return b-a});
  var ax=[0,1,2].map(function(i){return {i:i,s:+m.size[i]||0}}).filter(function(a){return a.s>=20}).sort(function(a,b){return b.s-a.s});if(!ax.length)return null;
  if(N.some(function(v){return Math.abs(v/ax[0].s-1)<=(window.__dimOk||0.1)}))return null; /* gabaryt już ma swój wymiar na rysunku (np. 04: 578) – bez pytania */
  var NM=['długość','wysokość','głębokość'],axes=[],factors=[1,1,1],bad=[];
  /* oś największa vs największy wymiar (gabaryt); kolejne osie vs najbliższy wymiar */
  ax.forEach(function(a,r){var t;if(r==0)t=N[0];else{t=null;N.forEach(function(v){if(v<=N[0]&&(t==null||Math.abs(Math.log(v/a.s))<Math.abs(Math.log(t/a.s))))t=v})}
   if(!t)return;var f=t/a.s;axes.push({axis:a.i,name:NM[a.i],model:Math.round(a.s),dim:t,f:+f.toFixed(2)});if(Math.abs(f-1)>TH&&(r==0||Math.abs(f-1)>0.5)){factors[a.i]=+f.toFixed(3);bad.push(a.i)}});
  if(bad.indexOf(ax[0].i)<0)return null; /* liczy się gabaryt – reszta tylko gdy główna oś też nie pasuje */
  var A=axes.filter(function(a){return bad.indexOf(a.axis)>=0});
  if(window.__dimFitGuard===true&&m.kind==='plate'&&A.length==1&&(A[0].f>1.5||A[0].f<1/1.5)){m.__dimFitGuarded=A[0];console.log('si: dimFitGuard – plate, jedna oś ×'+A[0].f+' – bez Dopasuj');return null}
  return {axes:A,factors:factors,maxDim:N[0],maxModel:Math.round(ax[0].s),
   msg:tx('mod')+' '+A.map(function(a){return tx(a.name)+' '+a.model+' mm'}).join(', ')+' – '+tx('fr')+': '+A.map(function(a){return a.dim+' mm'}).join(', ')+' (×'+A.map(function(a){return a.f}).join(', ×')+').'}}
};
/* STOP i pytanie przed showAuto2 (tylko Wsparcie SI ON) */
var DT={pl:['⚠ Wymiary nie pasują do modelu. Co robić?','Dopasuj do wymiarów','Zostaw z rysunku','Popraw ręcznie','Zastosuj','Wpisz gabaryt [mm]'],en:['⚠ Dimensions do not match the model. What to do?','Fit to dimensions','Keep drawing geometry','Correct manually','Apply','Enter overall size [mm]'],de:['⚠ Maße passen nicht zum Modell. Was tun?','An Maße anpassen','Zeichnung beibehalten','Manuell korrigieren','Übernehmen','Gesamtmaß eingeben [mm]']};
function dt(i){return (DT[L()]||DT.pl)[i]}
var TX={en:{'długość':'length','wysokość':'height','głębokość':'depth',h:'⚡ Full auto',mod:'Model',fr:'drawing dimensions',fit:'Dimensions did not match the model – fitted to drawing dimensions',keep:'Dimensions do not match the model – drawing geometry kept (to check).',man:'Overall size entered manually: '},de:{'długość':'Länge','wysokość':'Höhe','głębokość':'Tiefe',h:'⚡ Vollautomatik',mod:'Modell',fr:'Maße aus der Zeichnung',fit:'Maße passten nicht zum Modell – an Zeichnungsmaße angepasst',keep:'Maße passen nicht zum Modell – Zeichnungsgeometrie beibehalten (prüfen).',man:'Gesamtmaß manuell eingegeben: '},pl:{h:'⚡ Pełny automat',mod:'Model',fr:'wymiary z rysunku',fit:'Wymiary nie pasowały do modelu – dopasowano do wymiarów z rysunku',keep:'Wymiary nie pasują do modelu – zostawiono geometrię z rysunku (do sprawdzenia).',man:'Gabaryt wpisany ręcznie: '}};
function tx(k){var d=TX[L()]||TX.pl;return d[k]!=null?d[k]:k}
function scaleTo(m,k){if(!m.geo||!m.geo.scale)return;m.geo.scale(k[0],k[1],k[2]);m.geo.computeBoundingBox();var c=m.geo.boundingBox;m.size=[c.max.x-c.min.x,c.max.y-c.min.y,c.max.z-c.min.z];if(m.mesh){m.mesh.W=m.size[0];m.mesh.H=m.size[1];m.mesh.D=m.size[2]}}
function askDim(m,c,done){var app=document.getElementById('app');if(!app)return done();var N=['długość','wysokość','głębokość'];
 app.innerHTML='<h1>'+tx('h')+'</h1><div class="card" id="dimq" style="border:1px solid #9b74f8;box-shadow:0 0 10px rgba(155,116,248,.45)"><b>'+dt(0)+'</b><p class="small">'+c.msg+'</p>'+
 '<div style="display:flex;flex-direction:column;gap:8px"><button class="btn" data-a="fit">'+dt(1)+'</button><button class="btn sec" data-a="keep">'+dt(2)+'</button><button class="btn sec" data-a="man">'+dt(3)+'</button></div><div id="dimman" style="display:none;margin-top:10px"><small>'+dt(5)+'</small>'+
 [0,1,2].map(function(i){return '<label style="display:flex;justify-content:space-between;gap:8px;margin:6px 0">'+tx(N[i])+' <input type="number" inputmode="decimal" data-i="'+i+'" value="'+Math.round(m.size[i])+'" style="width:110px"></label>'}).join('')+'<button class="btn" data-a="apply">'+dt(4)+'</button></div></div>';
 app.querySelectorAll('#dimq button').forEach(function(b){b.onclick=function(){var a=b.dataset.a;
  if(a=='man'){document.getElementById('dimman').style.display='block';return}
  if(a=='fit'){scaleTo(m,c.factors);m.dimChoice='fit';m.dimNote=tx('fit')+' ('+c.axes.map(function(x){return tx(x.name)+' ×'+x.f}).join(', ')+').'}
  else if(a=='keep'){m.dimChoice='keep';m.dimNote=tx('keep')}
  else if(a=='apply'){var k=[1,1,1];app.querySelectorAll('#dimman input').forEach(function(inp){var i=+inp.dataset.i,v=parseFloat(String(inp.value).replace(',','.'));if(v>0&&m.size[i]>0)k[i]=v/m.size[i]});scaleTo(m,k);m.dimChoice='manual';m.dimNote=tx('man')+m.size.map(function(x){return Math.round(x)}).join('×')+' mm.'}
  if(m.pick&&m.pick.how&&m.dimNote)m.pick.how=m.dimNote+' · '+m.pick.how;
  try{window.__autoResult=window.sum2?sum2(m):window.__autoResult;if(window.__autoResult)window.__autoResult.dimConflict=c,window.__autoResult.dimChoice=m.dimChoice}catch(e){}
  done()}})}
function wrapShow(){var o=window.showAuto2;if(!o||o.__si)return;var w=function(m){var self=this,args=arguments;
  if(window.__siAssist&&m&&!m.__dimAsked&&!window.__noDimAsk){m.__dimAsked=1;var c=null;try{c=window.siAssist.dimConflict(m)}catch(e){console.warn('dimConflict',e)}
   if(c){m.dimConflict=c;window.__dimConflict=c;console.log('si: dimConflict',JSON.stringify(c));return askDim(m,c,function(){o.apply(self,args)})}}
  return o.apply(this,arguments)};w.__si=1;window.showAuto2=w}
window.addEventListener('load',wrapShow);
/* geoHolesKeep (flaga window.__geoHolesKeep, domyślnie OFF): pick blacha/płyta/gięta bez okien + kandydat G0 z >=2 oknami
   -> wycinamy okna G0 (CSG) w płaszczyźnie głównego rzutu wybranego modelu. Zwraca nowy kandydat albo null. */
window.siAssist.holesKeep=function(m,pick,C,H){
 if(window.__geoHolesKeep!==true||!m||!pick||!pick.geo||pick.g0||pick.holesKept)return null;
 var K=m.kind||'',p2k=m.p2&&window.__p2KindMap?window.__p2KindMap(m.p2):null;
 if(!/^(plate|bent|sheet)$/.test(K)&&!/^(plate|bent|sheet)$/.test(p2k||''))return null;
 var g0=(C||[]).filter(function(c){return c.g0&&c.g0h>=2&&c.g0v&&c.g0v.holes&&c.g0v.outlinePolygon}).sort(function(a,b){return b.g0h-a.g0h})[0];if(!g0)return null;
 try{if(g0.vi&&g0.vi.length)m.__g0ViouMain=+Math.max.apply(0,g0.vi.map(function(x){return x.iou||0})).toFixed(3)}catch(e){}
 var MF=window.__MF;if(!MF||!H||!H.geoToMan||!H.scPrism||!H.mfToGeo)return null;
 var g=pick.geo;g.computeBoundingBox();var B=g.boundingBox,mi=[B.min.x,B.min.y,B.min.z],S=[B.max.x-mi[0],B.max.y-mi[1],B.max.z-mi[2]];
 var ord=[0,1,2].sort(function(a,b){return S[b]-S[a]}),u=ord[0],w=ord[1],t=ord[2];if(!(S[t]>0)||S[t]>0.25*S[w])return null; /* tylko cienkie */
 var O=g0.g0v.outlinePolygon,xs=O.map(function(p){return p[0]}),ys=O.map(function(p){return p[1]}),x0=Math.min.apply(0,xs),y0=Math.min.apply(0,ys),ow=Math.max.apply(0,xs)-x0,oh=Math.max.apply(0,ys)-y0;if(!(ow>0&&oh>0))return null;
 var sw=ow>=oh; /* dłuższy bok obrysu -> oś u */
 var map=function(p){var a=(p[0]-x0)/ow,b=1-(p[1]-y0)/oh;var A=sw?a:b,Bq=sw?b:a;return [mi[u]+A*S[u],mi[w]+Bq*S[w]]};
 var Gm=H.geoToMan(MF,g),cut=[];g0.g0v.holes.forEach(function(h){if(h&&h.length>=3)try{cut.push(H.scPrism(MF,h.map(map),[u,w,t],mi[t]-1,S[t]+2))}catch(e){}});
 if(cut.length<2)return null;var r=Gm.subtract(MF.Manifold.union(cut));if(!(r.volume()>0.4*Gm.volume())||r.volume()>=Gm.volume()*0.999)return null;
 var ng=H.mfToGeo(r,[0.62,0.65,0.70]);ng.computeBoundingBox();ng.userData=g.userData;
 var nc=Object.assign({},pick,{geo:ng,holesKept:cut.length,how:cut.length+' okien z G0 (geoHolesKeep) · '+(pick.how||'')});
 console.log('si: geoHolesKeep',pick.name,'+',cut.length,'okien, viouMain G0',m.__g0ViouMain);m.__geoHolesKept=cut.length;return nc};
/* Szkielet lokalnych helperów SI (bez chmury). Wołane TYLKO gdy Wsparcie SI ON. Każdy helper ma własną flagę (domyślnie OFF).
   Rejestracja: siAssist.local.register(name,{flag:'__siX',stage:'preRebuild'|'postPick',fn:function(m,ctx){...}}) */
window.siAssist.local={H:{},
 register:function(n,o){if(n&&o&&typeof o.fn=='function')this.H[n]=o},
 run:function(stage,m,ctx){if(!window.__siAssist||window.__siCloud===true&&!window.__siCloudOK)return [];var out=[],H=this.H;
  Object.keys(H).forEach(function(n){var h=H[n];if(h.stage!==stage||!window[h.flag])return;try{var r=h.fn(m,ctx||{});if(r!=null)out.push({n:n,r:r})}catch(e){console.warn('si.local',n,e)}});
  if(out.length&&m)m.__siLocal=(m.__siLocal||[]).concat(out.map(function(x){return stage+':'+x.n}));return out}};
/* Stuby: okna/kształt z rysunku (lokalnie). Zwracają null do czasu wpięcia (F2 linie / g0_window_filter port do JS). */
window.siAssist.local.register('windows',{flag:'__siWin',stage:'postPick',fn:function(m,ctx){return null /* TODO: liczba/położenie okien z rzutu głównego (port g0_window_filter) */}});
window.siAssist.local.register('shape',{flag:'__siShape',stage:'preRebuild',fn:function(m,ctx){return null /* TODO: rama/okna/gięcia z linii F2 – tylko słaba podpowiedź, bez auto-wyboru */}});
/* Chmura: NIE wpinamy. window.__siCloud musi być jawnie włączone + __siCloudOK (zgoda użytkownika „TAK”). */
/* Gate P2: ON -> P2 działa; OFF -> pomijamy jak p2=0 */
function wrap(){var orig=window.p2Checkpoint;if(!orig||orig.__si)return;
 var w=function(m){if(!window.__siAssist)return Promise.resolve(m);
  try{window.siAssist.local.run('preRebuild',m)}catch(e){}
  try{var h=window.siAssist.kindHint(m);if(h)m.__siKindHint=h}catch(e){}
  return orig(m)};w.__si=1;window.p2Checkpoint=w}
wrap();document.addEventListener('DOMContentLoaded',wrap);
})();
