/* t-pipe: klasa „rury/kolanka” (ekran 3D → Zmień klasę). Gdy m.kind==='pipe':
   - m.vlmHint={class:'pipe'} + window.__vlmClassHint → prompt VLM (vlm_first) dostaje „to rury i kolanka”
   - iso_elbow traktuje to jako hint rury (kandydat kolana bez słowa „rura” w tekście)
   - kandydaci geometrii: tylko rurowe (rura/kolano/tuleja/obrotowa/szpula); brak → prosta rura z obrysu przodu. Profil/blacha odrzucone.
   Inne klasy = no-op. Wyłącz: window.__noPipeClass=1 */
(function(root){
 var LABEL='rury/kolanka',HINT='Klasa wybrana przez uzytkownika: RURY I KOLANKA (pipe). Wszystkie elementy traktuj jako rury, kolana rurowe i ewentualnie kolnierze – nie jako profile ani blachy.';
 var PIPE=/rur|kolan|elbow|tulej|obrot|lathe|szpul|pipe|tube/i;
 function isPipe(m){return !!(m&&m.kind==='pipe')}
 function setHint(m){if(!m)return m;if(isPipe(m)){var _H=root.__p2VlmHint,_l=_H&&_H.lang?_H.lang():'pl',_LB={pl:LABEL,en:'pipes/elbows',de:'Rohre/Bögen'};m.vlmHint={class:'pipe',label:_LB[_l]||LABEL,labelPL:LABEL,prompt:HINT};if(m.pick&&m.pick.name&&_H&&_H.trL&&_l!=='pl'){m.pick.nameL=_H.trL(m.pick.name,_l)}if(typeof window!=='undefined')window.__vlmClassHint=m.vlmHint}else{if(m.vlmHint&&m.vlmHint.class==='pipe')delete m.vlmHint;if(typeof window!=='undefined'&&window.__vlmClassHint&&window.__vlmClassHint.class==='pipe')window.__vlmClassHint=null}return m}
 function tubeFallback(THREE,m){var f=m&&m.V&&m.V.front,k=m&&m.mmpx||1;if(!f||!f.ob||!THREE)return null;var W=f.ob.w*k,H=f.ob.h*k,L=Math.max(W,H),D=Math.max(1,Math.min(W,H)),t=Math.max(2,Math.round(D*0.08));
  var sh=new THREE.Shape();sh.absarc(0,0,D/2,0,2*Math.PI,false);var ho=new THREE.Path();ho.absarc(0,0,D/2-t,0,2*Math.PI,true);sh.holes.push(ho);
  var g=new THREE.ExtrudeGeometry(sh,{depth:L,bevelEnabled:false,curveSegments:40});if(W>=H)g.rotateY(Math.PI/2);else g.rotateX(-Math.PI/2);g.computeBoundingBox();
  return {name:'rura prosta (klasa rury/kolanka)',geo:g,force:1,pipeClass:1,how:'klasa rury/kolanka: rura Ø'+Math.round(D)+'×'+t+' L'+Math.round(L)+' mm z obrysu przodu · APPROXIMATE · NEEDS_REVIEW'}}
 function filterC(C,m,THREE){if(!isPipe(m)||!Array.isArray(C))return C;var P=C.filter(function(c){return c&&PIPE.test((c.name||'')+' '+(c.isoElbow?'kolano':''))});
  if(!P.length){var fb=null;try{fb=tubeFallback(THREE,m)}catch(e){}if(fb)P=[fb]}if(!P.length){P=C.filter(function(c){return c&&c.force&&!/blach|profil|płyt|plyt|żebr|zebr|pudeł/i.test(c.name||'')});if(typeof console!=='undefined')console.warn('pipeclass: brak kandydata rurowego i tubeFallback – bez blach',P.length);if(!P.length){m.pipeDropped=C.length;m.pipeNoCand=1;return C.filter(function(c){return c&&!/blach|profil|płyt|plyt/i.test(c.name||'')}).length?C.filter(function(c){return c&&!/blach|profil|płyt|plyt/i.test(c.name||'')}):C}}P.forEach(function(c,i){c.force=i===0?1:0});m.pipeDropped=C.length-P.length;return P}
 function nameL(p,l){var H=(typeof window!=='undefined')&&window.__p2VlmHint;if(!p||!p.name)return '';l=l||(H&&H.lang?H.lang():'pl');if(l==='pl'||!H)return p.name;var n=String(p.name).replace('rury/kolanka',l==='de'?'Rohre/Bögen':'pipes/elbows').replace(/^rura prosta/,l==='de'?'gerades Rohr':'straight pipe').replace(/\(klasa /,l==='de'?'(Klasse ':'(class ');return H.trL(n,l)}
 var api={nameL:nameL,LABEL:LABEL,HINT:HINT,isPipe:isPipe,setHint:setHint,filterC:filterC,tubeFallback:tubeFallback};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return}
 root.__pipeClass=api;
 function wrapC(){var o=root.candidates;if(typeof o!=='function'||o.__pipe)return;var w=function(m){var C=o.apply(this,arguments);if(root.__noPipeClass)return C;try{setHint(m);return filterC(C,m,root.THREE)}catch(e){console.warn('pipeclass',e);return C}};
  ['__isoElbow','__isoRef','__mid'].forEach(function(k){w[k]=o[k]});w.__pipe=1;root.candidates=w}
 root.addEventListener('load',function(){setTimeout(function(){setTimeout(function(){setTimeout(function(){setTimeout(wrapC,0)},0)},0)},0)});
})(typeof window!=='undefined'?window:this);
