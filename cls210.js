/* oria-210 cls210 – klasyfikator typu konstrukcji (P2) dla ETYKIETY i PEWNOŚCI klasy, po zbudowaniu modelu.
   Nie zmienia m.kind, geometrii ani wymiarów: liczy m.cls={kind,alias,conf,why,from} z punktów silnika (m.kindScores)
   + cech tekstu rysunku (tabliczka/opis: laser-cut, materiał blachy, sklejka, rura, kolano, rama, profile).
   Jeśli typ różni się od generatora modelu – „Rozpoznano: <typ>” + „(model: <generator>)” i niska pewność → „potwierdź rodzaj”.
   Wyłącznik: #cls=0 / ?cls=0 / window.__noCls = 2.6. Ręczny wybór typu (P2, „wybrane ręcznie”) – bez zmian. */
(function(){
var OFF=false;try{OFF=/[#&?]cls=0(?:&|$)/.test(location.hash+'&'+location.search)||!!window.__noCls}catch(e){}
window.__cls210={off:OFF,v:1};if(OFF)return;
var KN={rot:'część obrotowa (toczona)',solid:'bryła / część lita',plate:'blacha płaska',bent:'blacha gięta',frame:'rama z profili',mixed:'mieszana (rura/rama + kątowniki/żebra + blachy)',pipe:'rury/kolanka'};
var AL={sheetconstr:'konstrukcja blaszana',bentplates:'konstrukcja z płyt giętych',mixpp:'mieszana: profile/rury + płyty'};
function manual(m){return (m.kindWhy||[]).indexOf('wybrane ręcznie')>=0||!!m.p2}
function classify(m){
 var S={},k,why={},T=String(m.allText||'').toUpperCase().replace(/\s+/g,' ');
 var base=m.kindScores||{};for(k in base)S[k]=+base[k]||0;['rot','solid','plate','bent','frame','mixed','pipe'].forEach(function(q){if(S[q]==null)S[q]=0;why[q]=[]});
 function add(q,v,w){S[q]=(S[q]||0)+v;why[q].push(w);fired++}
 var alias=null,f={},fired=0,mx=0;for(k in S)mx=Math.max(mx,S[k]);if(m.kind&&S[m.kind]!=null){S[m.kind]=Math.max(S[m.kind],mx)+0.4;why[m.kind].push('silnik: generator modelu')}
 f.lcOne=/LASER[\s-]?CUT\s?PART(?!S)\b/.test(T);
 f.lcMany=/LASER[\s-]?CUT\s?PARTS|WELD\s+LASER/.test(T);
 f.tube=/\bSTEEL TUBE\b|\bTUBE USED\b|\bRURA\b|\bROHR\b|\bPIPE\b/.test(T);
 f.elbow=/\bELBOW\b|\bKOLANO\b|\bKRÜMMER\b|\bROHRBOGEN\b/.test(T);
 f.sheetMat=/\b\d{1,2}(?:[.,]\d)?\s?MM\s+(?:S\d{3}|DC0\d|STAL|STEEL|STAHL|ALU)/.test(T);
 f.ply=/\bPLYWOOD\b|\bSKLEJKA\b|\bSPERRHOLZ\b/.test(T);
 f.frameT=/\b(?:MAIN|SIDE|TOP|BASE|UPPER|LOWER|PLATE)\s+FRAME\b|\bRAMA\b|\bRAHMEN\b|\bFRAME\b/.test(T);
 f.prof=/\bSQUARE\s?TUBE\b|\bRHS\b|\bSHS\b|\bRECTANGULAR\s+TUBE\b|\bL-?ANGLE\b|\bFLAT\s?BAR\b|\bKĄTOWNIK|\bPŁASKOWNIK|\bKATOWNIK|\bPLASKOWNIK/.test(T);
 if(f.elbow){add('pipe',2.0,'tekst: kolano / elbow');S.solid*=0.6;}
 if(f.lcOne&&!f.lcMany){add('plate',1.2,'tekst: „laser-cut part” – pojedyncza wycinana blacha');S.solid*=0.5;}
 if(f.lcMany){if(f.tube){add('mixed',1.2,'tekst: części wycinane laserem + rura – zespół');}else{add('bent',1.5,'tekst: spawane części wycinane laserem – konstrukcja blaszana');alias='sheetconstr';}S.solid*=0.5;}
 if(f.sheetMat&&!f.prof){add('plate',0.6,'materiał: blacha o podanej grubości');S.solid*=0.8;}
 if(f.ply){add('plate',1.0,'materiał: sklejka – płyta');S.solid*=0.6;}
 if(f.frameT&&S.frame>0.5)add('frame',0.5,'tytuł/opis: rama');
 if(f.prof&&S.frame>0.5)add('frame',0.3,'opis: profile (rura kw./kątownik/płaskownik)');
 f.mount=/\bMOUNT\b|\bBRACKET\b|\bWSPORNIK\b|\bHALTER(?:UNG)?\b|\bUCHWYT\b/.test(T);
 var fw=(m.kindWhy||[]).join(' ');f.weakFrame=m.kind==='frame'&&/oznaczenie profilu/.test(fw)&&!/par równoległych|tabel|izometria \+ tabela|BOM/.test(fw)&&!f.prof&&!f.frameT;
 if(f.weakFrame&&f.mount){add('mixed',1.3,'tytuł: mocowanie/wspornik, a „profil” tylko z jednego oznaczenia – zespół płyt (płyta + ucha)');S.frame*=0.6;}
 if(!fired)return {kind:m.kind,alias:(m.kindAlias&&!m.kindAliasFb)?m.kindAlias:null,conf:m.kindConf,why:(m.kindWhy||[]).slice(0,2),from:m.kind,fromConf:m.kindConf,S:S,f:f,changed:false,fired:0};
 var ks=Object.keys(S).sort(function(a,b){return S[b]-S[a]}),tot=ks.reduce(function(s,q){return s+Math.exp(2*S[q])},0),top=ks[0];
 if(top!=='bent')alias=null;
 /* mixpp/ręczne aliasy silnika zostają */
 if(m.kindAlias&&!m.kindAliasFb&&top===m.kind){alias=m.kindAlias}
 return {kind:top,alias:alias,conf:Math.round(100*Math.exp(2*S[top])/tot),why:why[top].length?why[top]:(m.kindWhy||[]).slice(0,2),from:m.kind,fromConf:m.kindConf,S:S,f:f,fired:fired,changed:top!==m.kind||(alias||null)!==((m.kindAlias&&!m.kindAliasFb)?m.kindAlias:null)};
}
window.__clsClassify=classify;
function lbl(c){return (c.alias&&AL[c.alias])||KN[c.kind]||c.kind}
function patch(m){var c=m.cls;if(!c)return;var r=document.getElementById('recog1');if(!r)return;
 var b=r.querySelector('b');if(c.changed&&b){var L=(window.__lang||(localStorage.getItem('oria_lang')||'pl')).slice(0,2),M={pl:'Rozpoznano',en:'Detected',de:'Erkannt'};
  b.textContent=(M[L]||M.pl)+': '+lbl(c);var s=document.createElement('span');s.className='muted small clsmod';s.setAttribute('data-cls',c.kind);
  var MW={pl:'model',en:'model',de:'Modell'},s1=document.createElement('span'),s2=document.createElement('span');s1.textContent=(MW[L]||MW.pl);s2.textContent=((m.kindAlias&&!m.kindAliasFb&&AL[m.kindAlias])||KN[m.kind]||m.kind);s.appendChild(document.createTextNode(' ('));s.appendChild(s1);s.appendChild(document.createTextNode(': '));s.appendChild(s2);s.appendChild(document.createTextNode(')'));r.appendChild(s);}
 var kb=document.querySelector('#app .kbadge');
 if(kb&&window.__B2UI&&window.__B2UI.KB){var cf=(m.conf!=null?m.conf:100),cc=c.changed?Math.min(c.conf,59):Math.min(Math.max(c.conf,m.kindConf||0),cf);
  if(c.changed||cc!==Math.min(m.kindConf||0,cf)){var tmp=document.createElement('div');tmp.innerHTML=window.__B2UI.KB(m,cc,lbl(c));var nk=tmp.querySelector('.kbadge');
   var nx=kb.nextElementSibling;if(nx&&nx.classList&&nx.classList.contains('kstat'))nx.remove();if(nk){kb.replaceWith(nk);var st=tmp.querySelector('.kstat');if(st)nk.after(st);}c.shownConf=cc;}}
}
function wrap(){var o=window.showAuto2;if(typeof o!=='function'||o.__cls)return false;var w=function(m){try{m.cls=(!m||manual(m))?null:classify(m);window.__clsLast=m&&m.cls}catch(e){window.__clsErr=String(e)}
 var r=o.apply(this,arguments);try{if(m&&m.cls)patch(m)}catch(e){window.__clsErr=String(e)}return r};w.__cls=1;window.showAuto2=w;return true}
if(!wrap())document.addEventListener('DOMContentLoaded',wrap);
})();
