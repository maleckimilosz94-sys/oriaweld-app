/* t888u P0.3 (LOKALNIE): AI+silnik podpowiadają w ISTNIEJĄCYCH pustych polach P2. Bez nowych pól/UI.
   Źródło znacznika „rzut główny”: największy rzut wykryty przez silnik, tylko gdy dominuje (≥1,8× drugi) i nie jest arkuszem/tabelką.
   Wynik: fm.aiFill={main:[fx,fy],mainSrc}. Profil/grubość liczone w p2_checkpoint (VLM kind / qty_mat). Wyłącznik: __noP2AiFill=1 / ?p2ai=0 / #p2ai=0. */
(function(){
function off(){try{return window.__noP2AiFill||/[?&#]p2ai=0/.test(location.search+location.hash)}catch(e){return 1}}
window.__p2AiOff=off;
function mainHint(info){var V=(info&&info.res&&info.res.views)||[],S=info&&info.sheet;if(!S||!V.length)return null;var SA=S.width*S.height;
 var c=V.map(function(v){var b=v.bbox||{};return {b:b,A:(b.w||0)*(b.h||0)}}).filter(function(o){return o.A>SA*0.04&&o.A<SA*0.6&&o.b.h<0.9*S.height&&o.b.w<0.9*S.width}).sort(function(a,b){return b.A-a.A});
 if(!c.length)return {why:'brak rzutu'};if(c[1]&&c[0].A<1.8*c[1].A)return {why:'konflikt: 2 rzuty podobne ('+(c[0].A/c[1].A).toFixed(2)+'×)'};
 var b=c[0].b;return {main:[+((b.x+b.w/2)/S.width).toFixed(3),+((b.y+b.h/2)/S.height).toFixed(3)],mainSrc:'silnik: największy rzut ('+(c[1]?(c[0].A/c[1].A).toFixed(1)+'× drugi':'jedyny')+')'}}
function wrap(){var pm=window.p2Mid;if(!pm||pm.__ai)return;
 var w=function(info){if(off()||window.__p2Auto)return pm.apply(this,arguments);var h=null;try{h=mainHint(info)}catch(e){}window.__p2AiLast={main:h,views:((info.res&&info.res.views)||[]).map(function(v){var b=v.bbox||{};return [b.x,b.y,b.w,b.h].map(Math.round)}),sheet:[info.sheet.width,info.sheet.height]};
  var ui=window.p2CheckpointUI;if(ui){window.p2CheckpointUI=function(fm){fm.aiFill=h&&h.main?h:null;return ui(fm)}}
  return pm.apply(this,arguments).then(function(r){window.p2CheckpointUI=ui;return r},function(e){window.p2CheckpointUI=ui;throw e})};
 w.__ai=1;w.__qty=pm.__qty;w.__vlm=pm.__vlm;w.__f2=pm.__f2;window.p2Mid=w}
window.addEventListener("load",function(){setTimeout(wrap,20)});
})();
