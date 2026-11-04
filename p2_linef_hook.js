/* p2_linef_hook v0.2 — cienki hook OriaLineFilter → miniatura P2. Aktywny tylko gdy ?linef=1 / window.__lineFilter=1 (loader w index.html). Opcjonalnie ?keepBend=1 / __lineFilterBend=1. Zero nowych elementów UI, zero kolorów (czarne linie na białym = rysunek). Flaga OFF → plik nieładowany, zachowanie jak dziś. */
(function(root){
 function on(){try{var q=new URLSearchParams(location.search).get('linef');if(q==='0')return false;return q==='1'||root.__lineFilter===1||root.__lineFilter===true}catch(e){return false}}
 /* 167: auto — F2 wczytane dla bieżącego pliku (brak ?linef=0) */
 function auto(){try{if(new URLSearchParams(location.search).get('linef')==='0')return false}catch(e){return false}return !!(root.__f2&&root.__f2File&&root.__f2File===name())}
 function bend(){try{return new URLSearchParams(location.search).get('keepBend')==='1'||root.__lineFilterBend===1||root.__lineFilterBend===true}catch(e){return false}}
 function name(){var mm=decodeURIComponent((location.hash.match(/img=([^&]+)/)||[])[1]||'').match(/([^\/]+)\.(jpe?g|png)$/i);return mm?mm[1]:null}
 function dims(){try{return new URLSearchParams(location.search).get('linefDims')==='1'||root.__lineFilterDims===1||root.__lineFilterDims===true}catch(e){return false}}
 /* v0.2: cache F2 tylko dla tego samego pliku (root.__f2File); zmiana rysunku (hash) → nowy fetch, stary F2 kasowany */
 function load(){var n=name();if(root.__f2&&root.__f2File===n)return Promise.resolve(root.__f2);root.__f2=null;root.__f2File=null;if(!n||typeof fetch!=='function')return Promise.resolve(null);
  /* v0.3 oria-168: whitelist stemów z F2 (zero 404 na losowe uploady) + negatywny cache sesji */
  var WL={'01_szpula':1,'04_konsole_liebherr':1,'05_uchwyt_certo':1,'06_blech':1};var NEG=root.__f2Neg||(root.__f2Neg={});if(!WL[n]||NEG[n])return Promise.resolve(null);
  return fetch('f2/'+n+'.sheet.json').then(function(r){if(!r.ok){NEG[n]=1;return null}return r.json()}).then(function(j){if(name()!==n)return null;if(j){root.__f2=j;root.__f2File=n}return root.__f2||null}).catch(function(){return null})}
 /* czysta funkcja (testowalna w Node): F2 json → wynik filtra + segmenty do rysowania */
 function prep(J,opts){var F=root.OriaLineFilter;if(!F||!J||!J.lines)return null;var r=F.filterF2(J,{keepBend:!!(opts&&opts.keepBend),strict:!!(opts&&opts.strict||(typeof window!=='undefined'&&(window.__lineFilterStrict===true||/(^|[#&?])linef=2/.test((window.location&&(window.location.hash+window.location.search))||''))))});var cs=F.toCleanSet(r.keep);var ko=!(opts&&opts.thumbKonturOnly===false);
  /* v0.2: miniatura domyślnie tylko kontur (+gięcie gdy keepBend); wymiary tylko gdy thumbKonturOnly=false (?linefDims=1) */
  var segs=ko?cs.segments.filter(function(s){return s.cls==='kontur'||s.cls==='linia_giecia'}):cs.segments;return {res:r,segs:segs,W:J.W,H:J.H}}
 function render(P,w,h){if(!P||typeof document==='undefined')return null;var W=P.W||w,H=P.H||h;var c=document.createElement('canvas');c.width=w||W;c.height=h||H;var g=c.getContext('2d');if(!g)return null;
  var ox=0,oy=0;/* 167: crop do bbox konturu, pad 6% */if(P.segs&&P.segs.length){var a=1e9,b=1e9,e=-1e9,f=-1e9;P.segs.forEach(function(s){[s.a,s.b].forEach(function(p){if(p[0]<a)a=p[0];if(p[0]>e)e=p[0];if(p[1]<b)b=p[1];if(p[1]>f)f=p[1]})});var px=(e-a)*.06+2,py=(f-b)*.06+2;a=Math.max(0,a-px);b=Math.max(0,b-py);e=Math.min(W,e+px);f=Math.min(H,f+py);if(e-a>8&&f-b>8){ox=a;oy=b;W=e-a;H=f-b;var kk=Math.min(1,1200/Math.max(W,H));c.width=Math.max(1,Math.round(W*kk));c.height=Math.max(1,Math.round(H*kk))}}
  var sx=c.width/W,sy=c.height/H;g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#000';g.lineWidth=Math.max(1,1.5*Math.min(sx,sy));var sd=typeof g.setLineDash==='function';
  function pass(fl,dash){g.beginPath();var k=0;P.segs.forEach(function(s){if((s.cls==='linia_giecia')!==fl)return;k++;g.moveTo((s.a[0]-ox)*sx,(s.a[1]-oy)*sy);g.lineTo((s.b[0]-ox)*sx,(s.b[1]-oy)*sy)});if(!k)return;if(sd)g.setLineDash(dash);g.stroke()}
  pass(false,[]);pass(true,[8*Math.min(sx,sy)+2,5*Math.min(sx,sy)+2]);if(sd)g.setLineDash([]);return c.toDataURL('image/jpeg',.7)}
 /* wołane z p2_checkpoint.js po zebraniu miniatury; zwraca dataURL lub null (= bez zmian) */
 function thumb(m,w,h){if(!on()&&!auto())return null;if(root.__f2&&root.__f2File&&root.__f2File!==name())return null;var P=prep(root.__f2,{keepBend:bend(),thumbKonturOnly:!dims()});if(!P)return null;if(m)m.__linef=P.res.stats;return render(P,w,h)}
 var api={on:on,prep:prep,thumb:thumb,load:load,v:'0.2'};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return}
 root.__linefHook=api;
 /* F2 musi być wczytane przed P2: owijamy p2Checkpoint (async) — tylko gdy flaga ON */
 function wrap(){var o=root.p2Checkpoint;if(typeof o!=='function'||o.__linef)return;try{if(new URLSearchParams(location.search).get('linef')==='0')return}catch(e){return}var w=function(m){var a=arguments,t=this;return load().then(function(){return o.apply(t,a)})};w.__linef=1;root.p2Checkpoint=w}
 wrap();if(typeof window!=='undefined')window.addEventListener('load',function(){setTimeout(wrap,0)});
})(typeof window!=='undefined'?window:this);
