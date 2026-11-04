/* t977u VLM-FIRST (LOKALNIE): VLM = GŁÓWNY interpretator rysunku + obowiązkowe P2 przed bryłą.
   Flaga: ?vlmfirst=1 / #vlmfirst=1 / window.__vlmFirst=1 (OFF domyślnie → pełny no-op). ?vlm=1 (vlm_typ.js) zostaje pomocnikiem.
   ON: 1) Qwen3-VL (Ollama) → {typ: rama|rury|blacha|mieszana, elementy[{nazwa,rodzaj,bbox 0-1000}], wazne_linie[], glowny_rzut bbox, pewnosc}
       2) interpretacja → sugestia P2 (typ→KINDS, profil, znacznik 'rzut główny' z bbox) → po zatwierdzeniu __p2pre steruje rebuild (kind PRZED kandydatami linii)
       3) P2 wymuszone: __p2Gate=1 (hardgate: p2=0/ask=0/__p2Auto nie omijają; brak UI → HOLD, brak build3d).
   Brak Ollamy → NIE udaje: m.vlmFirst={blocker}, P2 nadal obowiązkowe bez sugestii. Mock: ?vlmfirst_mock=1 lub window.__vlmFirstFixture. */
(function(){
var URL0=window.__vlmUrl||'http://127.0.0.1:11434',MODEL=window.__vlmModel||'qwen3-vl:4b-instruct',TMO=240000;
function on(){try{var q=(location.search||'')+'&'+(location.hash||'');if(/(^|[?#&])vlmfirst=0(&|$)/.test(q))return false;var ls=null;try{ls=localStorage.getItem('oria_vlmfirst')}catch(_){}return !!window.__vlmFirst||/(^|[?#&])vlmfirst=1(&|$)/.test(q)||ls==='1'}catch(e){return false}}
function mock(){try{return window.__vlmFirstFixture||(/(^|[?#&])vlmfirst_mock=1(&|$)/.test((location.search||'')+'&'+(location.hash||''))?FIX:null)}catch(e){return null}}
var FIX={typ:'rama',pewnosc:0.8,elementy:[{nazwa:'rama główna',rodzaj:'profil zamknięty',bbox:[200,200,800,700]}],wazne_linie:['obrys ramy na rzucie głównym'],glowny_rzut:[200,200,800,700],uwagi:'FIXTURE (mock) – nie z modelu'};
var PR='Jesteś inżynierem. Przeanalizuj rysunek techniczny konstrukcji spawanej. Odpowiedz TYLKO JSON:\n{"typ":"rama|rury|blacha|mieszana","pewnosc":0..1,"elementy":[{"nazwa":"...","rodzaj":"profil zamknięty|rura|blacha|płaskownik|kątownik|inne","bbox":[x1,y1,x2,y2]}],"wazne_linie":["krótki opis linii/krawędzi istotnych dla bryły"],"glowny_rzut":[x1,y1,x2,y2],"uwagi":"..."}\nbbox = [x1,y1,x2,y2] w skali 0-1000 względem CAŁEGO obrazu (0,0 = lewy górny róg, 1000,1000 = prawy dolny). Każdy element musi mieć WŁASNY bbox obejmujący jego obrys na rysunku – różne elementy mają różne bboxy. glowny_rzut = bbox rzutu (widoku) najlepiej pokazującego bryłę. Podaj prawdziwe współrzędne odczytane z obrazu, nie okrągłe liczby ani siatkę; tylko gdy elementu naprawdę nie da się zlokalizować, wpisz bbox null. rama=konstrukcja z profili; rury=rury/tuleje dominują; blacha=blacha gięta lub płyty; mieszana=kilka rodzajów. Pomiń tabelkę rysunkową i wykaz części.';
var TK={rama:'Rama (profile zamknięte)',rury:'Rura + wsporniki + płyta',blacha:'Konstrukcja blaszana / gięta',mieszana:'Konstrukcja mieszana'};
var TP={rama:'Profile zamknięte',rury:'Rury okrągłe',blacha:'Blachy / płyty',mieszana:'Mieszane'};
function norm(j){if(!j||typeof j!=='object')return null;var t=String(j.typ||'').toLowerCase();t=/ram/.test(t)?'rama':/rur/.test(t)?'rury':/blach|płyt|plyt/.test(t)?'blacha':/miesz/.test(t)?'mieszana':null;
 var bb=function(b){return Array.isArray(b)&&b.length===4&&b.every(function(v){return isFinite(+v)})?b.map(Number):null};
 return {typ:t,pewnosc:Math.max(0,Math.min(1,+j.pewnosc||0)),elementy:(Array.isArray(j.elementy)?j.elementy:[]).slice(0,12).map(function(e){return {nazwa:String(e&&e.nazwa||''),rodzaj:String(e&&e.rodzaj||''),bbox:bb(e&&e.bbox)}}),wazne_linie:(Array.isArray(j.wazne_linie)?j.wazne_linie:[]).slice(0,10).map(String),glowny_rzut:bb(j.glowny_rzut),uwagi:String(j.uwagi||'')}}
/* t977b walidacja bboxów: skala (0-1/0-1000/px), kolejność, min. rozmiar, placeholdery, duplikaty, cały arkusz. Odrzucone → NIE trafiają do geometrii. */
var PH=[[100,100,300,300],[0,0,1000,1000],[0,0,100,100],[0,0,0,0]];
function sc(b,W,H){if(!b)return {b:null,why:'brak bbox'};var m=Math.max.apply(null,b.map(Math.abs));
 if(b.some(function(v){return v<0}))return {b:null,why:'ujemne współrzędne'};
 if(m<=1.0001&&m>0)b=b.map(function(v){return v*1000});else if(m>1000){if(W>0&&H>0&&b[0]<=W&&b[2]<=W&&b[1]<=H&&b[3]<=H)b=[b[0]/W*1000,b[1]/H*1000,b[2]/W*1000,b[3]/H*1000];else return {b:null,why:'poza skalą 0-1000'}}
 var x1=Math.min(b[0],b[2]),x2=Math.max(b[0],b[2]),y1=Math.min(b[1],b[3]),y2=Math.max(b[1],b[3]);b=[x1,y1,x2,y2].map(function(v){return Math.round(Math.max(0,Math.min(1000,v)))});
 return {b:b}}
function eq(a,b){return a&&b&&a.every(function(v,i){return Math.abs(v-b[i])<=2})}
function iou(a,b){var ix=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0])),iy=Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1])),I=ix*iy,U=(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-I;return U>0?I/U:0}
function chk1(b,W,H){var r=sc(b,W,H);if(!r.b)return r;b=r.b;var w=b[2]-b[0],h=b[3]-b[1];
 if(PH.some(function(p){return eq(b,p)}))return {b:null,raw:b,why:'placeholder '+JSON.stringify(b)};
 if(w<25||h<25||w*h<3000)return {b:null,raw:b,why:'za mały ('+w+'x'+h+')'};
 if(w*h>0.92e6)return {b:null,raw:b,why:'cały arkusz'};return {b:b}}
function validate(n,W,H){if(!n||n.blocker)return n;var E=n.elementy||[],rej=[],ok=0;
 E.forEach(function(e){var r=chk1(e.bbox,W,H);e.bboxRaw=e.bbox;e.bbox=r.b;e.bboxPowod=r.why||null});
 for(var i=0;i<E.length;i++)for(var j=i+1;j<E.length;j++)if(E[i].bbox&&E[j].bbox&&iou(E[i].bbox,E[j].bbox)>0.9){E[i].dup=E[j].dup=1}
 E.forEach(function(e,i){if(e.dup){e.bboxPowod='duplikat bbox innego elementu';e.bbox=null;delete e.dup}e.bboxStatus=e.bbox?'APPROXIMATE':'ODRZUCONY';if(e.bbox)ok++;else rej.push({i:i,nazwa:e.nazwa,powod:e.bboxPowod})});
 var g=chk1(n.glowny_rzut,W,H);n.glowny_rzutRaw=n.glowny_rzut;n.glowny_rzut=g.b;n.glowny_rzutPowod=g.why||null;
 /* rzut główny = ten sam bbox co odrzucony duplikat → też niewiarygodny */
 if(n.glowny_rzut&&E.some(function(e){return !e.bbox&&/duplikat/.test(e.bboxPowod||'')&&eq(sc(e.bboxRaw,W,H).b,n.glowny_rzut)})){n.glowny_rzut=null;n.glowny_rzutPowod='= zduplikowany bbox elementów'}
 /* siatka/szablon: ≥2 elementy z wszystkimi współrzędnymi podzielnymi przez 50 i tym samym rozmiarem → zgadywanie, nie lokalizacja */
 var R=E.filter(function(e){return e.bbox&&e.bbox.every(function(v){return v%50===0})});
 if(R.length>=2&&R.every(function(e){return e.bbox[2]-e.bbox[0]===R[0].bbox[2]-R[0].bbox[0]&&e.bbox[3]-e.bbox[1]===R[0].bbox[3]-R[0].bbox[1]})){R.forEach(function(e){e.bbox=null;e.bboxStatus='ODRZUCONY';e.bboxPowod='siatka okrągłych liczb (szablon)';ok--;rej.push({i:E.indexOf(e),nazwa:e.nazwa,powod:e.bboxPowod})})}
 n.bbox={ok:ok,odrzucone:rej,glowny:n.glowny_rzut?'OK':'ODRZUCONY: '+n.glowny_rzutPowod,wiarygodne:ok>0};return n}
function img64(s){var W=s.naturalWidth||s.width,H=s.naturalHeight||s.height,c=document.createElement('canvas'),k=Math.min(1,1280/Math.max(W,H));c.width=Math.round(W*k);c.height=Math.round(H*k);c.getContext('2d').drawImage(s,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.9).split(',')[1]}
function interpret(info){var t0=Date.now(),F=mock();var SW=info&&info.sheet&&(info.sheet.naturalWidth||info.sheet.width),SH=info&&info.sheet&&(info.sheet.naturalHeight||info.sheet.height);
 if(F)return Promise.resolve(Object.assign(validate(norm(JSON.parse(JSON.stringify(F))),SW,SH),{zrodlo:'mock',ms:0}));
 if(!info||!info.sheet||!window.fetch)return Promise.resolve({blocker:'brak arkusza/fetch',zrodlo:'brak'});
 var ac=window.AbortController?new AbortController():null,tm=setTimeout(function(){ac&&ac.abort()},TMO);
 return fetch(URL0+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:ac&&ac.signal,body:JSON.stringify({model:MODEL,stream:false,format:'json',options:{temperature:0,num_ctx:8192},messages:[{role:'user',content:PR,images:[img64(info.sheet)]}]})})
  .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(j){clearTimeout(tm);var n=validate(norm(JSON.parse(j.message.content)),SW,SH);if(!n||!n.typ)return {blocker:'VLM bez rozpoznanego typu',raw:String(j.message.content).slice(0,400),zrodlo:'vlm'};n.zrodlo='vlm';n.ms=Date.now()-t0;return n})
  .catch(function(e){clearTimeout(tm);return {blocker:'VLM niedostępny: '+(e&&(e.message||e.name)||e),zrodlo:'brak'}})}
/* rzut główny z VLM → powiąż z wykrytym widokiem (IoU), bez zgadywania bryły. Brak trafienia → zostaje znacznik (p2_mid.injectMain dołoży kontur wokół punktu). */
function bindView(info,p){var V=info&&info.res&&info.res.views,B=p.mainBox;if(!V||!B)return;var b=[B.x,B.y,B.x+B.w,B.y+B.h],best=null;
 V.forEach(function(v,i){var r=v.bbox;if(!r&&v.outlinePolygon&&v.outlinePolygon.length>2){var xs=v.outlinePolygon.map(function(q){return q[0]}),ys=v.outlinePolygon.map(function(q){return q[1]});r={x:Math.min.apply(0,xs),y:Math.min.apply(0,ys),w:Math.max.apply(0,xs)-Math.min.apply(0,xs),h:Math.max.apply(0,ys)-Math.min.apply(0,ys)}}
  if(!r)return;var u=iou(b,[r.x,r.y,r.x+r.w,r.y+r.h]);if(!best||u>best.u)best={i:i,u:u}});
 if(best&&best.u>=0.3){V[best.i].vlmMain=1;p.mainView={idx:best.i,iou:+best.u.toFixed(2)};window.__vlmFirstView=p.mainView}else p.mainView={idx:null,iou:best?+best.u.toFixed(2):0}}
window.__vlmFirstApi={on:on,norm:norm,validate:validate,iou:iou,bindView:bindView,interpret:interpret,TK:TK,FIX:FIX};
function wrap(){var pm=window.p2Mid;if(!pm||pm.__vlmFirst)return;
 var w=function(info){if(!on())return pm.apply(this,arguments);var self=this,args=arguments;window.__p2Gate=1;/* P2 obowiązkowe */
  return interpret(info).then(function(I){window.__vlmFirstLast=I;window.__p2Suggest=I;var ui=window.p2CheckpointUI;
   if(ui)window.p2CheckpointUI=function(fm){fm.vlmFirst=I;if(I&&!I.blocker&&TK[I.typ]){fm.vlmKind=TK[I.typ];fm.vlm={typ:I.typ,kind:TK[I.typ],pewnosc:I.pewnosc>=.7?'wysoka':I.pewnosc>=.4?'srednia':'niska',niepewny:I.pewnosc<.4,zrodlo:'vlmfirst'}}
    var BN=null;if(I&&I.blocker&&typeof document!=='undefined'&&document.body){try{BN=document.createElement('div');BN.id='vlmFirstBlocker';BN.setAttribute('role','alert');BN.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;background:rgba(11,13,20,.9);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#E6EAF2;padding:8px 14px;border-radius:10px;border:1px solid rgba(34,211,238,.45);border-left:4px solid #F5B43C;font:500 13px system-ui;max-width:92vw;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:opacity .4s';BN.textContent='⚠ VLM niedostępny (brak Ollamy) — wybierz typ ręcznie.';BN.title=String(I.blocker).slice(0,200);BN.setAttribute('data-detail',String(I.blocker).slice(0,200));document.body.appendChild(BN)}catch(e){BN=null}}
    var P=ui(fm);if(BN&&P&&P.then)P.then(function(){BN.remove&&BN.remove()},function(){BN.remove&&BN.remove()});
    return P.then(function(r){var p=fm.p2;if(p){p.vlmFirst={typ:I&&I.typ||null,zatwierdzono:!!(I&&TK[I.typ]&&p.kind===TK[I.typ]),poprawiono:!!(I&&TK[I.typ]&&p.kind!==TK[I.typ]),blocker:I&&I.blocker||null};
     if(!p.profile&&I&&TP[I.typ])p.profile=TP[I.typ];var g=I&&!I.blocker&&I.glowny_rzut,S=info&&info.sheet,W=S&&(S.naturalWidth||S.width),H=S&&(S.naturalHeight||S.height);
     p.vlmFirst.bbox=I&&I.bbox||null;
     /* elementy: tylko zwalidowane bboxy, jako APPROXIMATE + NEEDS_REVIEW (do potwierdzenia w P2; bez budowania bryły) */
     /* kontrakt Grafiki (krok 1b): p.vlmElementsAccepted=[indeksy w fm.vlmFirst.elementy]; brak pola → wszystkie (wstecznie); odrzucone nie idą do modelu */
     var EL=(I&&!I.blocker&&I.elementy||[]),ACC=Array.isArray(p.vlmElementsAccepted)?p.vlmElementsAccepted.map(Number).filter(function(i){return i===Math.floor(i)&&i>=0&&i<EL.length}):null;
     if(ACC){ACC=ACC.filter(function(i,k){return ACC.indexOf(i)===k});p.vlmElementsAccepted=ACC;p.vlmElementsRejected=EL.map(function(e,i){return i}).filter(function(i){return ACC.indexOf(i)<0})}
     var D=p.vlmFirstDraft;if(D&&typeof D==='object'){if(typeof D.zatwierdzono==='boolean')p.vlmFirst.zatwierdzono=D.zatwierdzono;if(typeof D.poprawiono==='boolean')p.vlmFirst.poprawiono=D.poprawiono;p.vlmFirst.draft=D}
     p.vlmFirst.elementyIdx=ACC;
     p.vlmElements=EL.map(function(e,i){return {e:e,i:i}}).filter(function(o){return (!ACC||ACC.indexOf(o.i)>=0)&&o.e.bbox}).map(function(o){var e=o.e,b=e.bbox;return {idx:o.i,potwierdzono:!!ACC,nazwa:e.nazwa,rodzaj:e.rodzaj,bbox:b,bboxPx:W?[Math.round(b[0]/1000*W),Math.round(b[1]/1000*H),Math.round(b[2]/1000*W),Math.round(b[3]/1000*H)]:null,status:'APPROXIMATE',review:'NEEDS_REVIEW',zrodlo:'vlmfirst'}});
     if(!p.vlmElements.length)p.vlmFirst.geometria=I&&I.blocker?'brak (VLM niedostępny)':(ACC&&!ACC.length&&EL.length?'brak – użytkownik odrzucił wszystkie elementy, tylko typ + P2':'brak – bboxy VLM odrzucone, tylko typ + P2');
     if(g&&W&&!(p.marks||[]).some(function(k){return k.t==='rzut główny'})){(p.marks=p.marks||[]).push({t:'rzut główny',x:+((g[0]+g[2])/2000).toFixed(4),y:+((g[1]+g[3])/2000).toFixed(4),vlm:1});
      p.mainBox={x:Math.round(g[0]/1000*W),y:Math.round(g[1]/1000*H),w:Math.round((g[2]-g[0])/1000*W),h:Math.round((g[3]-g[1])/1000*H),zrodlo:'vlmfirst'};bindView(info,p)}}
     else{var HG=window.OriaP2HardGate;if(HG)return HG.hold(window,I);window.__p2GateLast={allowed:false,reason:'vlmfirst: P2 nie zatwierdzone',suggest:I};return new Promise(function(){})}return r})};
   return pm.apply(self,args).then(function(r){window.p2CheckpointUI=ui;return r},function(e){window.p2CheckpointUI=ui;throw e})})};
 w.__vlmFirst=1;w.__vlm=pm.__vlm;w.__f2=pm.__f2;window.p2Mid=w}
wrap();window.addEventListener('load',function(){setTimeout(wrap,5)});
})();
