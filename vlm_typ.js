/* oria-151: VLM OFF default na live — włącz ?vlm=1 / #vlm=1 / window.__vlmOn=1 */
/* t873u (LOKALNIE): VLM (Ollama qwen3-vl:4b-instruct) – SUGESTIA typu konstrukcji w P2 (krok 1 „Rodzaj konstrukcji”).
   Logika v4 z vlm_qwen/run_vlm_classify.py: 4 pytania tak/nie → mapowanie + reguła gięć (bez OCR w przeglądarce; hook: window.__vlmOcrText).
   Moment: w p2Mid (po OCR rzutów, przed prepViews/candidates/rebuild). Tylko preselect – użytkownik potwierdza. Wymiary NIE z VLM.
   Wyłącznik: window.__noVlm=1 lub ?vlm=0 / #vlm=0. Brak Ollamy / błąd / timeout → cicho, P2 jak dotąd. */
(function(){
var URL0=window.__vlmUrl||'http://127.0.0.1:11434',MODEL=window.__vlmModel||'qwen3-vl:4b-instruct',TMO=75000;
function off(){try{return !(window.__vlmOn||/[?&#]vlm=1/.test(location.search+location.hash))||window.__noVlm||/[?&]vlm=0/.test(location.search)||/[#&]vlm=0/.test(location.hash)}catch(e){return 1}}
function D(){if(window.__p2Dbg||window.__vlmDbg)console.log.apply(console,arguments)}
var FEAT='Rysunek techniczny konstrukcji spawanej. Odpowiedz na pytania o to, co WIDAC na rysunku (bez wymiarow):\n1. tuleja_rura: czy glownym elementem jest rura, tuleja lub walek (koncentryczne okregi w widoku lub przekroju, nie same otwory na sruby)?\n2. giecia_blachy: czy sa blachy giete - zaokraglone naroza z promieniem R w przekrojach, tekst "Biege"/"gięcie"/"Abwicklung", profile C/L wygiete z blachy?\n3. rama_z_profili: czy to prostokatny szkielet z profili zamknietych lub ksztaltownikow (rury kwadratowe/prostokatne)?\n4. spawane_plyty: czy konstrukcja jest zlozona z kilku plaskich plyt spawanych ze soba (np. uchwyt z plyt)?\n5. elementy: 3-8 krotkich nazw glownych czesci, ktore realnie widzisz.\nOdpowiedz WYLACZNIE JSON:\n{"tuleja_rura":true,"giecia_blachy":false,"rama_z_profili":false,"spawane_plyty":false,"elementy":["..."],"uwagi":"..."}';
var FC='Rysunek techniczny konstrukcji spawanej. Wybierz JEDEN opis, ktory NAJLEPIEJ pasuje do glownej czesci (bez wymiarow):\nA: rura/tuleja/walek jako glowny element\nB: blacha gieta (zaokraglone naroza R, profile C/L z blachy)\nC: rama/szkielet z profili zamknietych lub ksztaltownikow\nD: kilka plaskich plyt lub plaskownikow spawanych ze soba (uchwyt, wspornik z plyt)\nE: katowniki lub ceowniki z przyspawanymi plytami\nF: nie wiem / nie pasuje zadne\nPewnosc 0.0-1.0 podaj uczciwie; jesli wahasz sie miedzy dwoma, podaj ponizej 0.8.\nOdpowiedz WYLACZNIE JSON: {"wybor":"A","pewnosc":0.0,"uzasadnienie":"..."}';
/* t888u pass3: krótkie pytanie, tylko gdy pass2 graniczny (<P2MIN) */
var FC3='Rysunek techniczny. Jednym slowem: co to jest? rama / rura / blacha / plyty / nie_wiem. Odpowiedz WYLACZNIE JSON: {"typ":"plyty","pewnosc":0.0}';
var P2MIN=0.8,P3MIN=0.7;
/* enum VLM → etykieta KINDS w p2_checkpoint.js (dokładne stringi) */
var KMAP={rama:'Rama (profile zamknięte)',rura_wsporniki_plyta:'Rura + wsporniki + płyta',blacha_gieta:'Konstrukcja blaszana / gięta',mieszana:'Konstrukcja mieszana',plyty_spawane:'Płaskowniki + płyty',katowniki_plyty:'Kątowniki / ceowniki + płyty'};
function yes(v){return v===true||v==='true'||v==='tak'}
/* t888u: „mieszana” tylko przy realnym konflikcie cech (gięcia+płyty / gięcia+rama); same płyty → „Płaskowniki + płyty” (kind plate, ścieżka platesCand w p2_mid) */
function mapuj(f){if(yes(f.tuleja_rura))return 'rura_wsporniki_plyta';if(f.katowniki_plyty)return 'katowniki_plyty';var g=yes(f.giecia_blachy),r=yes(f.rama_z_profili),p=yes(f.spawane_plyty);
 if(g&&!p&&!r)return 'blacha_gieta';if(r&&!g)return 'rama';if(p&&!g)return 'plyty_spawane';if(g&&(p||r))return 'mieszana';return 'niepewny'}
function ocrFlags(t){t=t||'';var r=(t.match(/\bR\s?\d{1,3}(?:[.,]\d)?\b/g)||[]).length,bi=/bieg|abwickl|abkant/i.test(t),bl=/blech/i.test(t);return {biege:bi,blech:bl,r_wymiar:r,giecie_silne:bi||(bl&&r>=2)}}
function hybryda(f,o){var typ=mapuj(f),zr='vlm',uw='';
 if(yes(f.giecia_blachy)&&!yes(f.tuleja_rura)&&typ!=='blacha_gieta'&&!yes(f.rama_z_profili)){typ='blacha_gieta';zr='hybrid';uw='VLM gięcia=tak bez rury'}
 if(o&&o.giecie_silne&&!yes(f.tuleja_rura)&&typ!=='blacha_gieta'){uw='OCR gięcie nadpisał '+typ;typ='blacha_gieta';zr='ocr_override'}
 return {typ:typ,zrodlo:zr,uwagi:uw}}
function engTxt(i){try{if(window.__noVlmEngOcr||!i)return '';var a=[].concat(i.allBoxes||[],i.sheetBoxes||[]).map(function(b){return b&&b.text||''});if(i.title&&i.title.text)a.push(i.title.text);(i.views||[]).forEach(function(v){(v&&v.boxes||[]).forEach(function(b){a.push(b&&b.text||'')})});return a.join(' ')}catch(e){return ''}}
/* Z3 (typ→P2): poziom pewności sugestii. niska → brak preselectu (nie zgadujemy), srednia → pass3 lub pass2 po odrzuceniu, wysoka → cechy pass1 / pass2≥0.8 / OCR override */
function pewnosc(h,f){if(!h||h.typ==='niepewny'||!KMAP[h.typ])return 'niska';if(h.zrodlo==='ocr_override')return 'wysoka';if(f&&f.pass3&&f.pass3.ok)return 'srednia';return 'wysoka'}
window.__vlmTyp={pewnosc:pewnosc,engTxt:engTxt,mapuj:mapuj,hybryda:hybryda,ocrFlags:ocrFlags,KMAP:KMAP};
function img64(sheet){var W=sheet.naturalWidth||sheet.width,H=sheet.naturalHeight||sheet.height,c=document.createElement('canvas'),s=Math.min(1,1280/Math.max(W,H));c.width=Math.round(W*s);c.height=Math.round(H*s);var x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(sheet,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.9).split(',')[1]}
function chat(b64,ac,pr){return fetch(URL0+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:ac&&ac.signal,body:JSON.stringify({model:MODEL,stream:false,format:'json',options:{temperature:0,num_ctx:8192},messages:[{role:'user',content:pr||FEAT,images:[b64]}]})}).then(function(r){return r.json()})}
function loadI(u){return new Promise(function(ok,ko){var i=new Image();i.onload=function(){ok(i)};i.onerror=ko;i.src=u})}
function ask(info){if(off()||!info||!info.sheet||!window.fetch)return Promise.resolve(null);var t0=Date.now();
 var ac=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ac)ac.abort()},TMO);
 var probe=window.AbortController?new AbortController():null,pt=setTimeout(function(){if(probe)probe.abort()},1500);
 return fetch(URL0+'/api/version',{signal:probe&&probe.signal}).then(function(r){clearTimeout(pt);if(!r.ok)throw 0;
  return chat(img64(info.sheet),ac)})
 .then(function(j){var f=JSON.parse(j.message.content);
  /* pass2 (wyłącznik __noVlmPass2=1): TYLKO gdy wszystkie 4 cechy=nie → jedno pytanie wymuszonego wyboru A/B/C/D na oryginalnych bajtach obrazu (info.dataUrl; inaczej arkusz).
     Przyjmujemy tylko pewnosc≥0.8; wybór ustawia odpowiadającą cechę=tak, dalej to samo mapowanie (D→mieszana, B→blacha_gieta…). */
  if(!window.__noVlmPass2&&!['tuleja_rura','giecia_blachy','rama_z_profili','spawane_plyty'].some(function(k){return yes(f[k])})){
   var mt=info.dataUrl&&/^data:image\/(jpeg|png);base64,/.exec(info.dataUrl),b=(mt&&info.dataUrl.length<6e6)?info.dataUrl.slice(mt[0].length):img64(info.sheet);
   return chat(b,ac,FC).then(function(j2){var c=JSON.parse(j2.message.content),w=String(c.wybor||'').trim().toUpperCase().charAt(0),k={A:'tuleja_rura',B:'giecia_blachy',C:'rama_z_profili',D:'spawane_plyty',E:'katowniki_plyty'}[w];D('vlm: pass2 '+JSON.stringify(c));
    f.pass2={wybor:c.wybor,pewnosc:c.pewnosc,ok:!!(k&&+c.pewnosc>=P2MIN)};if(f.pass2.ok){f[k]=true;return f}
    if(window.__noVlmPass3||w==='F')return f;
    /* pass3: pass2 graniczny → krótkie pytanie; „nie_wiem” lub <P3MIN → brak sugestii */
    return chat(b,ac,FC3).then(function(j3){var c3=JSON.parse(j3.message.content),t=String(c3.typ||'').toLowerCase(),k3=/plyt|płyt/.test(t)?'spawane_plyty':/ram/.test(t)?'rama_z_profili':/rur/.test(t)?'tuleja_rura':/blach/.test(t)?'giecia_blachy':null;D('vlm: pass3 '+JSON.stringify(c3));
     f.pass3={typ:c3.typ,pewnosc:c3.pewnosc,ok:!!(k3&&+c3.pewnosc>=P3MIN&&(!k||k===k3))};if(f.pass3.ok)f[k3]=true;return f})}).catch(function(){return f})}
  return f})
 .then(function(f){clearTimeout(tm);var h=hybryda(f,ocrFlags(window.__vlmOcrText=(window.__vlmOcrTextUser||'')+' '+engTxt(window.__vlmInfo)));
  var pw=pewnosc(h,f);var res={pass2:f.pass2,pass3:f.pass3,typ:h.typ,kind:pw==='niska'?null:(KMAP[h.typ]||null),pewnosc:pw,niepewny:pw==='niska',zrodlo:h.zrodlo,uwagi:h.uwagi,vlm_features:f,ms:Date.now()-t0,ocr:String(window.__vlmOcrText||"").slice(0,1500),ocrF:ocrFlags(window.__vlmOcrText||"")};window.__vlmLast=res;D('vlm: '+JSON.stringify(res));return res})
 .catch(function(e){clearTimeout(tm);clearTimeout(pt);D('vlm: pominięte ('+(e&&e.name||e)+')');return null})}
function wrap(){var pm=window.p2Mid;if(!pm||pm.__vlm)return;
 var w=function(info){if(off()||window.__p2Auto||/ask=0/.test(location.hash)||!window.p2CheckpointUI)return pm.apply(this,arguments);var self=this,args=arguments;window.__vlmInfo=info;
  return ask(info).then(function(s){var ui=window.p2CheckpointUI;if(s&&(s.kind||s.niepewny)){window.p2CheckpointUI=function(fm){if(s.kind)fm.vlmKind=s.kind;fm.vlm=s;return ui(fm)}}
   return pm.apply(self,args).then(function(r){window.p2CheckpointUI=ui;return r},function(e){window.p2CheckpointUI=ui;throw e})})};
 w.__vlm=1;w.__f2=pm.__f2;window.p2Mid=w}
wrap();window.addEventListener('load',function(){setTimeout(wrap,0)});
})();
