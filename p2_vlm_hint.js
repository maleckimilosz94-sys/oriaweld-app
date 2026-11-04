/* P2 krok 1: widoczna interpretacja VLM (t977u „VLM główny”) — typ + pewność + lista elementów z checkboxami.
   Wybór → m.p2.vlmElementsAccepted (kontrakt vlm_first.js krok 1b). Tylko gdy m.vlmFirst bez blockera (?vlmfirst=1); OFF = '' no-op. */
(function(root){
 var TL={rama:'Rama',rury:'Rury + wsporniki',blacha:'Blacha / płyty',mieszana:'Konstrukcja mieszana'};
 function els(m){var I=m&&m.vlmFirst;return I&&!I.blocker&&Array.isArray(I.elementy)?I.elementy:[]}
 function initAcc(m,st){var E=els(m);if(!st.vlmAcc&&E.length)st.vlmAcc=E.map(function(e,i){return e.bbox?i:-1}).filter(function(i){return i>=0});return st.vlmAcc||null}
 function html(m,st,esc,T){var I=m&&m.vlmFirst;T=T||function(s){return s};esc=esc||String;if(!I||I.blocker||!I.typ)return '';var E=els(m),A=initAcc(m,st)||[];
  var pw=+I.pewnosc||0,lv=pw>=.7?'wysoka':pw>=.4?'średnia':'niska';
  var h='<div id="p2vlm" role="status" style="margin:8px 0 10px;padding:10px 12px;border-radius:10px;background:rgba(16,20,29,.92);border:1px solid rgba(34,211,238,.45);border-left:4px solid #22D3EE;color:#E6EAF2;font-size:13px">'+
   '<b>🤖 '+esc(T('VLM czyta rysunek:'))+'</b> '+esc(TL[I.typ]||I.typ)+' <span style="opacity:.7">('+esc(T('pewność'))+' '+esc(T(lv))+(pw?' '+Math.round(pw*100)+'%':'')+')</span>';
  if(I.opis)h+='<div style="opacity:.8;margin-top:4px">'+esc(String(I.opis).slice(0,200))+'</div>';
  if(E.length){h+='<div style="margin-top:6px;opacity:.8">'+esc(T('Elementy (odznacz błędne — nie pójdą do modelu):'))+'</div>';
   E.forEach(function(e,i){var ok=!!e.bbox;h+='<label style="display:block;margin:3px 0'+(ok?'':';opacity:.5')+'"><input type="checkbox" class="p2ve" data-i="'+i+'"'+(A.indexOf(i)>=0?' checked':'')+(ok?'':' disabled')+'> '+esc(e.nazwa||('element '+(i+1)))+(e.rodzaj?' · '+esc(e.rodzaj):'')+(ok?'':' <i>('+esc(e.bboxPowod||T('bez położenia'))+')</i>')+'</label>'})}
  return h+'<div style="opacity:.6;font-size:11px;margin-top:4px">APPROXIMATE · NEEDS_REVIEW — '+esc(T('potwierdź lub popraw typ poniżej'))+'</div></div>'}
 function toggle(st,i,on){i=+i;st.vlmAcc=(st.vlmAcc||[]).filter(function(x){return x!==i});if(on)st.vlmAcc.push(i);st.vlmAcc.sort(function(a,b){return a-b});return st.vlmAcc}
 function apply(m,st){if(m&&m.p2&&els(m).length&&Array.isArray(st.vlmAcc))m.p2.vlmElementsAccepted=st.vlmAcc.slice();return m}
 var api={html:html,toggle:toggle,apply:apply,initAcc:initAcc};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.__p2VlmHint=api;
})(typeof window!=='undefined'?window:this);
