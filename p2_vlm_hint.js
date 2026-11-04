/* P2 krok 1: widoczna interpretacja VLM (t977u „VLM główny”) — typ + pewność + lista elementów z checkboxami.
   Wybór → m.p2.vlmElementsAccepted (kontrakt vlm_first.js krok 1b). Tylko gdy m.vlmFirst bez blockera (?vlmfirst=1); OFF = '' no-op. */
(function(root){
 var TLL={pl:{rama:'Rama',rury:'Rury + wsporniki',blacha:'Blacha / płyty',mieszana:'Konstrukcja mieszana'},en:{rama:'Frame',rury:'Pipes + supports',blacha:'Sheet / plates',mieszana:'Mixed structure'},de:{rama:'Rahmen',rury:'Rohre + Halterungen',blacha:'Blech / Platten',mieszana:'Gemischte Konstruktion'}};
 var D={'VLM czyta rysunek:':{en:'VLM reads the drawing:',de:'VLM liest die Zeichnung:'},'pewność':{en:'confidence',de:'Sicherheit'},'wysoka':{en:'high',de:'hoch'},'średnia':{en:'medium',de:'mittel'},'niska':{en:'low',de:'niedrig'},'Elementy (odznacz błędne — nie pójdą do modelu):':{en:'Elements (untick wrong ones — they will not go into the model):',de:'Elemente (falsche abwählen — gehen nicht ins Modell):'},'bez położenia':{en:'no position',de:'ohne Position'},'potwierdź lub popraw typ poniżej':{en:'confirm or correct the type below',de:'Typ unten bestätigen oder korrigieren'}};
 function lang(){try{var l=(location.search.match(/[?&]lang=(en|pl|de)/)||location.hash.match(/lang=(en|pl|de)/)||[])[1]||(root.localStorage&&localStorage.getItem('oria_lang'))||'pl';return /^(en|de)/.test(l)?l.slice(0,2):'pl'}catch(e){return 'pl'}}
 function TT(T,s,l){var x=T(s);if(x!==s)return x;return D[s]&&D[s][l]||s}
 function els(m){var I=m&&m.vlmFirst;return I&&!I.blocker&&Array.isArray(I.elementy)?I.elementy:[]}
 function initAcc(m,st){var E=els(m);if(!st.vlmAcc&&E.length)st.vlmAcc=E.map(function(e,i){return e.bbox?i:-1}).filter(function(i){return i>=0});return st.vlmAcc||null}
 function html(m,st,esc,T){var I=m&&m.vlmFirst;var _T=T||function(s){return s},_l=(m&&m.lang)||lang(),TL=TLL[_l]||TLL.pl;T=function(s){return TT(_T,s,_l)};esc=esc||String;if(!I||I.blocker||!I.typ)return '';var E=els(m),A=initAcc(m,st)||[];
  var pw=+I.pewnosc||0,lv=pw>=.7?'wysoka':pw>=.4?'średnia':'niska';
  var h='<div id="p2vlm" role="status" style="margin:8px 0 10px;padding:10px 12px;border-radius:10px;background:rgba(16,20,29,.92);border:1px solid rgba(34,211,238,.45);border-left:4px solid #22D3EE;color:#E6EAF2;font-size:13px">'+
   '<b>🤖 '+esc(T('VLM czyta rysunek:'))+'</b> '+esc(TL[I.typ]||I.typ)+' <span style="opacity:.7">('+esc(T('pewność'))+' '+esc(T(lv))+(pw?' '+Math.round(pw*100)+'%':'')+')</span>';
  if(I.opis)h+='<div style="opacity:.8;margin-top:4px">'+esc(String(I.opis).slice(0,200))+'</div>';
  if(E.length){h+='<div style="margin-top:6px;opacity:.8">'+esc(T('Elementy (odznacz błędne — nie pójdą do modelu):'))+'</div>';
   E.forEach(function(e,i){var ok=!!e.bbox;h+='<label style="display:block;margin:3px 0'+(ok?'':';opacity:.5')+'"><input type="checkbox" class="p2ve" data-i="'+i+'"'+(A.indexOf(i)>=0?' checked':'')+(ok?'':' disabled')+'> '+esc(e.nazwa||('element '+(i+1)))+(e.rodzaj?' · '+esc(e.rodzaj):'')+(ok?'':' <i>('+esc(e.bboxPowod||T('bez położenia'))+')</i>')+'</label>'})}
  return h+'<div style="opacity:.6;font-size:11px;margin-top:4px">APPROXIMATE · NEEDS_REVIEW — '+esc(T('potwierdź lub popraw typ poniżej'))+'</div></div>'}
 function toggle(st,i,on){i=+i;st.vlmAcc=(st.vlmAcc||[]).filter(function(x){return x!==i});if(on)st.vlmAcc.push(i);st.vlmAcc.sort(function(a,b){return a-b});return st.vlmAcc}
 function apply(m,st){if(m&&m.p2&&els(m).length&&Array.isArray(st.vlmAcc))m.p2.vlmElementsAccepted=st.vlmAcc.slice();return m}
 /* t977u+: prostokąty elementów VLM na miniaturze #p2th1 (bbox 0-1000 całego obrazu → %); klik = toggle, sync z checkboxami .p2ve */
 function rects(m,st,esc){esc=esc||String;var E=els(m);if(!E.length)return '';var A=initAcc(m,st)||[],h='';
  E.forEach(function(e,i){var b=e.bbox;if(!b||b.length!==4)return;var on=A.indexOf(i)>=0;
   h+='<div class="p2vr'+(on?' on':'')+'" data-i="'+i+'" role="checkbox" aria-checked="'+on+'" tabindex="0" title="'+esc(e.nazwa||('element '+(i+1)))+'" style="position:absolute;box-sizing:border-box;cursor:pointer;left:'+b[0]/10+'%;top:'+b[1]/10+'%;width:'+(b[2]-b[0])/10+'%;height:'+(b[3]-b[1])/10+'%;'+rs(on)+'"><span style="position:absolute;left:0;top:0;font:700 10px/1 system-ui;padding:1px 3px;background:'+(on?'#22D3EE':'#888')+';color:#000">'+(i+1)+'</span></div>'});
  return h}
 function rs(on){return on?'border:2px solid #22D3EE;background:rgba(34,211,238,.15)':'border:2px dashed #888;background:rgba(0,0,0,.05)'}
 function sync(root,st){if(!root||!root.querySelectorAll)return;var A=st.vlmAcc||[];
  [].forEach.call(root.querySelectorAll('.p2vr'),function(r){var on=A.indexOf(+r.dataset.i)>=0;r.className='p2vr'+(on?' on':'');r.setAttribute('aria-checked',String(on));r.style.cssText=r.style.cssText.replace(/border:[^;]*;background:[^;]*/,'');r.style.border=on?'2px solid #22D3EE':'2px dashed #888';r.style.background=on?'rgba(34,211,238,.15)':'rgba(0,0,0,.05)';var l=r.firstChild;if(l&&l.style)l.style.background=on?'#22D3EE':'#888'});
  [].forEach.call(root.querySelectorAll('.p2ve'),function(c){if(!c.disabled)c.checked=A.indexOf(+c.dataset.i)>=0})}
 function wire(root,st){if(!root||!root.querySelectorAll)return;
  [].forEach.call(root.querySelectorAll('.p2vr'),function(r){function t(ev){if(ev){ev.preventDefault();ev.stopPropagation()}toggle(st,r.dataset.i,(st.vlmAcc||[]).indexOf(+r.dataset.i)<0);sync(root,st)}r.onclick=t;r.onkeydown=function(ev){if(ev.key===' '||ev.key==='Enter')t(ev)}});
  [].forEach.call(root.querySelectorAll('.p2ve'),function(c){c.onchange=function(){toggle(st,c.dataset.i,c.checked);sync(root,st)}})}
 var api={TLL:TLL,D:D,lang:lang,html:html,toggle:toggle,apply:apply,initAcc:initAcc,rects:rects,sync:sync,wire:wire};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.__p2VlmHint=api;
})(typeof window!=='undefined'?window:this);
