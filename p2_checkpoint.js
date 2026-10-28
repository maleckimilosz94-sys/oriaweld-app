/* P2: punkt kontrolny w połowie analizy (gałąź test/p2-checkpoint) */
(function(){
var KINDS=[['Rama (profile zamknięte)','frame'],['Rura + wsporniki + płyta','mixed'],['Konstrukcja mieszana','mixed'],['Konstrukcja blaszana / gięta','bent'],['Płaskowniki + płyty','plate'],['Kątowniki / ceowniki + płyty','mixed'],['Pojedynczy element','solid'],['Konstrukcja przestrzenna','frame'],['Inne','']];
var PROF=['Rury okrągłe','Profile zamknięte','Płaskowniki','Blachy / płyty','Kątowniki','Mieszane'];
var P2D={"Rama (profile zamknięte)":["Frame (hollow sections)","Rahmen (Hohlprofile)"],"Rura + wsporniki + płyta":["Tube + brackets + plate","Rohr + Konsolen + Platte"],"Konstrukcja mieszana":["Mixed structure","Gemischte Konstruktion"],"Konstrukcja blaszana / gięta":["Sheet metal / bent","Blech / gekantet"],"Płaskowniki + płyty":["Flat bars + plates","Flachstahl + Platten"],"Kątowniki / ceowniki + płyty":["Angles / channels + plates","Winkel / U-Profile + Platten"],"Pojedynczy element":["Single part","Einzelteil"],"Konstrukcja przestrzenna":["Space frame","Raumtragwerk"],"Inne":["Other","Sonstiges"],"Rury okrągłe":["Round tubes","Rundrohre"],"Profile zamknięte":["Hollow sections","Hohlprofile"],"Płaskowniki":["Flat bars","Flachstahl"],"Blachy / płyty":["Sheets / plates","Bleche / Platten"],"Kątowniki":["Angles","Winkel"],"Mieszane":["Mixed","Gemischt"],"rura":["tube","Rohr"],"płyta":["plate","Platte"],"profil":["profile","Profil"],"kątownik":["angle","Winkel"],"Tak":["Yes","Ja"],"Nie":["No","Nein"],"← Wstecz":["← Back","← Zurück"],"Dalej →":["Next →","Weiter →"],"🧭 Punkt kontrolny":["🧭 Checkpoint","🧭 Kontrollpunkt"],"Krok":["Step","Schritt"]," · podpowiedź z podobnego rysunku":[" · suggestion from a similar drawing"," · Vorschlag aus ähnlicher Zeichnung"],"Rodzaj konstrukcji":["Structure type","Konstruktionsart"],"Opisz konstrukcję":["Describe the structure","Konstruktion beschreiben"],"Dominujący typ profilu":["Dominant profile type","Vorherrschender Profiltyp"],"(opcjonalnie)":["(optional)","(optional)"],"Czy na rysunku jest rzut 3D / izometryczny?":["Does the drawing have a 3D / isometric view?","Enthält die Zeichnung eine 3D-/isometrische Ansicht?"],"Liczba elementów":["Number of parts","Anzahl der Teile"],"Oznacz na rysunku (opcjonalnie)":["Mark on the drawing (optional)","In der Zeichnung markieren (optional)"],"Typ:":["Type:","Typ:"],"Wybierz typ i stuknij w miejsce na rysunku.":["Pick a type and tap the spot on the drawing.","Typ wählen und auf die Stelle in der Zeichnung tippen."],"(brak miniatury – dodaj oznaczenia bez pozycji)":["(no thumbnail – add marks without position)","(keine Vorschau – Markierungen ohne Position hinzufügen)"],"+ Dodaj oznaczenie":["+ Add mark","+ Markierung hinzufügen"],"Rozumiem:":["Understood:","Verstanden:"],"Kontynuować?":["Continue?","Fortfahren?"],"✎ Popraw":["✎ Correct","✎ Korrigieren"],"✓ Kontynuuj":["✓ Continue","✓ Fortfahren"],"profil: —":["profile: —","Profil: —"],"izometria: ":["isometric: ","Isometrie: "],"elementów: ":["parts: ","Teile: "]," oznacz.)":[" marks)"," Mark.)"],"Inne: ":["Other: ","Sonstiges: "],"⚡ Pełny automat":["⚡ Full auto","⚡ Vollautomatik"],"Przebudowuję model…":["Rebuilding the model…","Modell wird neu aufgebaut…"]};
function T(s){var L;try{L=(location.hash.match(/lang=(en|pl|de)/)||[])[1]||localStorage.getItem('oria_lang')||'pl'}catch(e){L='pl'}var d=P2D[s];return (L==='pl'||!d)?s:d[L==='en'?0:1]}
window.__p2T=T;
var CHIPS=['rura','płyta','profil','kątownik'],MK='oria_p2_memory';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fid(){try{var fs=[].slice.call(document.querySelectorAll('input[type=file]'));for(var i=0;i<fs.length;i++){var f=fs[i].files&&fs[i].files[0];if(f)return f.name+'#'+f.size+'#'+(f.lastModified||0)}}catch(e){}return ''}
function fp(m){var s=(m.size||[]).map(function(v){return Math.round((+v||0)/50)*50}).join('x');var g=s+'|v'+((m.views||[]).length||0);var id=m.fileId||fid();return id?'f:'+id+'|'+g:g}
function mem(){try{return JSON.parse(localStorage.getItem(MK)||'{}')}catch(e){return{}}}
function kindMap(p){if(p.kind==='Inne'){var t=(p.other||'').toLowerCase();return /blach|gię/.test(t)?'bent':/płyt|plyt/.test(t)?'plate':/rama|profil/.test(t)?'frame':/wał|wal|toczon|obrot/.test(t)?'turned':'mixed'}
 for(var i=0;i<KINDS.length;i++)if(KINDS[i][0]===p.kind)return KINDS[i][1];return null}
window.__p2KindMap=kindMap;
window.p2Checkpoint=function(m){
 if(window.__p2On===false||/(^|[#&])p2=0/.test(location.hash)||/ask=0/.test(location.hash)||/[?&]p2=0/.test(location.search))return Promise.resolve(m);
 var app=document.getElementById('app');if(!app)return Promise.resolve(m);
 var thumb=null;try{var cs=[].slice.call(document.querySelectorAll('#app canvas')).filter(function(c){return c.width>40&&c.height>40}).sort(function(a,b){return b.width*b.height-a.width*a.height});if(cs[0])thumb=cs[0].toDataURL('image/jpeg',.7)}catch(e){}
 if(!thumb&&m.thumb)thumb=m.thumb;
 var key=fp(m),M=mem(),pre=(key&&M[key])||null;
 var st={kind:pre&&pre.kind||null,other:pre&&pre.other||'',profile:pre&&pre.profile||null,iso:pre?pre.iso:null,nParts:pre&&pre.nParts||1,marks:[]},step=1,fromMem=!!pre;
 return new Promise(function(res){
  function btns(list,sel,cls){return list.map(function(t,i){return '<button class="'+cls+(t===sel?' on':'')+'" data-i="'+i+'" style="display:block;width:100%;margin:6px 0;padding:12px;border-radius:10px;text-align:left;'+(t===sel?'outline:2px solid #4af;font-weight:bold':'')+'">'+esc(T(t))+'</button>'}).join('')}
  function nav(back,next,dis){return '<div style="display:flex;gap:8px;margin-top:12px">'+(back?'<button id="p2b" style="flex:1;padding:12px">'+T('← Wstecz')+'</button>':'')+'<button id="p2n" style="flex:2;padding:12px;font-weight:bold"'+(dis?' disabled':'')+'>'+T('Dalej →')+'</button></div>'}
  function summary(){var k=st.kind==='Inne'?T('Inne: ')+(st.other||'?'):T(st.kind);return [k,st.profile?T(st.profile):T('profil: —'),T('izometria: ')+T(st.iso?'Tak':'Nie'),T('elementów: ')+st.nParts+(st.marks.length?' ('+st.marks.length+T(' oznacz.)'):'')].join(' · ')}
  function draw(){var h='<h1>'+T('🧭 Punkt kontrolny')+'</h1><p class="aprog" style="opacity:.75">'+T('Krok')+' '+Math.min(step,5)+'/5'+(fromMem&&step===1?T(' · podpowiedź z podobnego rysunku'):'')+'</p>';
   if(step===1){h+='<h3>'+T('Rodzaj konstrukcji')+'</h3>'+btns(KINDS.map(function(k){return k[0]}),st.kind,'p2k')+(st.kind==='Inne'?'<input id="p2o" placeholder="'+T('Opisz konstrukcję')+'" value="'+esc(st.other)+'" style="width:100%;padding:10px;box-sizing:border-box">':'')+nav(0,1,!st.kind);}
   else if(step===2){h+='<h3>'+T('Dominujący typ profilu')+'</h3><p style="opacity:.7">'+T('(opcjonalnie)')+'</p>'+btns(PROF,st.profile,'p2p')+nav(1,1);}
   else if(step===3){h+='<h3>'+T('Czy na rysunku jest rzut 3D / izometryczny?')+'</h3>'+btns(['Tak','Nie'],st.iso==null?null:(st.iso?'Tak':'Nie'),'p2i')+nav(1,1,st.iso==null);}
   else if(step===4){h+='<h3>'+T('Liczba elementów')+'</h3><input id="p2c" type="number" min="1" value="'+st.nParts+'" style="width:100%;padding:10px;box-sizing:border-box"><h3>'+T('Oznacz na rysunku (opcjonalnie)')+'</h3><div>'+T('Typ:')+' '+CHIPS.map(function(c){return '<button class="p2t" data-t="'+c+'" style="margin:2px;padding:6px 10px'+(c===st.chip?';outline:2px solid #4af':'')+'">'+esc(T(c))+'</button>'}).join('')+'</div>'+
    (thumb?'<div id="p2th" style="position:relative;margin-top:8px"><img src="'+thumb+'" style="width:100%;display:block;border-radius:8px">'+st.marks.map(function(k,i){return '<span style="position:absolute;left:'+(k.x*100)+'%;top:'+(k.y*100)+'%;transform:translate(-50%,-50%);background:#4af;color:#000;font-size:12px;padding:2px 6px;border-radius:10px;pointer-events:none">'+(i+1)+'. '+esc(T(k.t))+'</span>'}).join('')+'</div><p style="opacity:.7;font-size:12px">'+T('Wybierz typ i stuknij w miejsce na rysunku.')+'</p>':'<p style="opacity:.7">'+T('(brak miniatury – dodaj oznaczenia bez pozycji)')+'</p><button id="p2add" style="padding:8px">'+T('+ Dodaj oznaczenie')+'</button>')+
    '<div>'+st.marks.map(function(k,i){return '<div style="margin:4px 0">'+(i+1)+'. <select data-i="'+i+'" class="p2s">'+CHIPS.map(function(c){return '<option value="'+c+'"'+(c===k.t?' selected':'')+'>'+esc(T(c))+'</option>'}).join('')+'</select> <button class="p2d" data-i="'+i+'">✕</button></div>'}).join('')+'</div>'+nav(1,1);}
   else {h+='<h3>'+T('Rozumiem:')+' '+esc(summary())+'. '+T('Kontynuować?')+'</h3><div style="display:flex;gap:8px;margin-top:12px"><button id="p2fix" style="flex:1;padding:12px">'+T('✎ Popraw')+'</button><button id="p2ok" style="flex:2;padding:12px;font-weight:bold">'+T('✓ Kontynuuj')+'</button></div>';}
   app.innerHTML=h;wire();}
  function q(s){return [].slice.call(app.querySelectorAll(s))}
  function wire(){
   q('.p2k').forEach(function(b){b.onclick=function(){st.kind=KINDS[+b.dataset.i][0];fromMem=false;draw()}});
   q('.p2p').forEach(function(b){b.onclick=function(){var v=PROF[+b.dataset.i];st.profile=st.profile===v?null:v;draw()}});
   q('.p2i').forEach(function(b){b.onclick=function(){st.iso=b.dataset.i==='0';draw()}});
   q('.p2t').forEach(function(b){b.onclick=function(){st.chip=b.dataset.t;keepN();draw()}});
   q('.p2s').forEach(function(s){s.onchange=function(){st.marks[+s.dataset.i].t=s.value}});
   q('.p2d').forEach(function(b){b.onclick=function(){keepN();st.marks.splice(+b.dataset.i,1);draw()}});
   var o=app.querySelector('#p2o');if(o)o.oninput=function(){st.other=o.value};
   var th=app.querySelector('#p2th');if(th)th.onclick=function(e){var r=th.getBoundingClientRect();keepN();st.marks.push({t:st.chip||'profil',x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height});draw()};
   var ad=app.querySelector('#p2add');if(ad)ad.onclick=function(){keepN();st.marks.push({t:st.chip||'profil',x:null,y:null});draw()};
   var b=app.querySelector('#p2b');if(b)b.onclick=function(){keepN();step--;draw()};
   var n=app.querySelector('#p2n');if(n)n.onclick=function(){keepN();step++;draw()};
   var f=app.querySelector('#p2fix');if(f)f.onclick=function(){step=1;draw()};
   var ok=app.querySelector('#p2ok');if(ok)ok.onclick=finish;}
  function keepN(){var c=app.querySelector('#p2c');if(c)st.nParts=Math.max(1,parseInt(c.value)||1)}
  function finish(){
   m.p2={kind:st.kind==='Inne'?'Inne: '+st.other:st.kind,profile:st.profile,iso:!!st.iso,nParts:st.nParts,marks:st.marks.slice()};
   var k=kindMap(st);if(k){m.kindFrom=m.kind;m.kind=k;}
   m.kindWhy=['P2 użytkownik','wybrane ręcznie'];m.kindConf=100;m.autoMixed=false;
   try{var M2=mem(),rec={kind:st.kind,other:st.other,profile:st.profile,iso:st.iso,nParts:st.nParts,t:Date.now()};M2[key]=rec;M2.__last=rec;localStorage.setItem(MK,JSON.stringify(M2))}catch(e){}
   app.innerHTML='<h1>'+T('⚡ Pełny automat')+'</h1><div id="aprog"><p class="aprog"><span class="spin"></span> '+T('Przebudowuję model…')+'</p></div>';
   setTimeout(function(){try{if(typeof rebuild==='function'&&k)rebuild(m)}catch(e){console.warn('p2 rebuild',e);m.p2.rebuildErr=String(e&&e.message||e)}try{if(window.__autoResult&&typeof sum2==='function'){window.__autoResult=sum2(m);}if(window.__autoResult)window.__autoResult.p2=m.p2}catch(e){}res(m)},40);}
  draw();});
};})();
