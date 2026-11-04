/* Oriaweld Approximate — ETAP 2 hook (tylko przy __approxOn). Opakowuje globalne candidates(m) z app_main.js
   BEZ jego edycji. Kandydat przybliżony NIE trafia do listy C (nie bierze udziału w wyborze/score) —
   jest odkładany obok jako m.approxCand oraz window.__approxCands. Domyślny wybór BETA bez zmian.
   Graf: window.__approxGraph (obiekt) albo ?approxfx=01..06 -> approx/fixtures/*.sg.json. */
(function(){'use strict';if(!window.__approxOn)return;
var FX={'01':'01_szpula','02':'02_ramy','03':'03_wspornik','04':'04_liebherr','05':'05_certo','06':'06_blech'};
var k=new URLSearchParams(location.search).get('approxfx');
if(k&&FX[k]&&!window.__approxGraph)fetch('approx/fixtures/'+FX[k]+'.sg.json').then(function(r){return r.json()}).then(function(g){window.__approxGraph=g;console.log('approx: fixture '+FX[k])}).catch(function(e){console.warn('approx fx',e)});
window.__approxCands=[];
function mk(m){var g=window.__approxGraph;if(!g&&!k&&window.OriaSGFromBeta){try{g=window.OriaSGFromBeta.fromBeta(m)}catch(e){console.warn('approx fromBeta',e)}if(g)console.log('approx: graf z BETA (isoFrame)');}if(!g&&!k&&window.OriaSGFromEngine&&(window.__approxEng||new URLSearchParams(location.search).get('approxeng')==='1')&&m&&m.a3b){try{g=window.OriaSGFromEngine.fromEngine(m,{force:1,holes:window.__noApproxHoles?[]:window.OriaSGFromEngine.holesFromViews(m,Math.round((m.size||[])[0]))});if(g){window.__approxEngGraph=g;console.log('approx: graf z silnika (ETAP 4.1)',g.questions.length+' pytań');}}catch(e){console.warn('approx fromEngine',e)}}if(!g||!window.OriaSGBuild)return null;var v=window.OriaSGValidate?window.OriaSGValidate.validate(g):{ok:true};
 if(!v.ok){console.warn('approx: graf niepoprawny',v.errors);return null;}var r=window.OriaSGBuild.build(g);
 var c={name:'przybliżony (graf)',approx:1,group:r.group,geo:r.geo,meshes:r.meshes,how:'Approximate SG v'+g.schema_version+' · '+r.meshes+' elementów · '+(g.questions||[]).length+' pytań'};
 if(window.__approxBound&&window.OriaApproxBoundary){try{c.bound=window.OriaApproxBoundary.evaluate({sg:g,compose:window.__viewCompose||null});window.__approxBoundLast=c.bound;}catch(e){console.warn('approx bound',e)}}
 if(window.__p2Gate&&window.OriaP2Gate){var pg=window.OriaP2Gate.check(c.bound||null,window.OriaP2Gate.p2State());c.p2gate=pg;window.__p2GateLast=pg;console.log('p2gate:',pg.allowed?'OK':'STOP','|',pg.reason);if(!pg.allowed){c.gated=1;return null;}}
 window.__approxCands.push(c);if(m)m.approxCand=c;console.log('approx: kandydat obok —',c.how);return c;}
/* ETAP 4.2: m.a3b powstaje po candidates() (iso_lock) -> odroczone mk dla approxeng */
function late(m){if(!m||m.a3b||m.__approxLate||window.__approxEngGraph||!(window.__approxEng||new URLSearchParams(location.search).get('approxeng')==='1'))return;m.__approxLate=1;var n=0;(function p(){var mm=(window.AUTO&&window.AUTO.last)||m;if(mm&&mm.a3b){try{mk(mm)}catch(e){console.warn('approx late',e)}return;}if(++n<240)setTimeout(p,500);})();}
/* ETAP 4.3: P2 – zastosuj decyzje i przebuduj kandydata (tylko approxeng) */
function apply(ds){var g=window.__approxEngGraph;if(!g||!window.OriaSGFromEngine)return null;g=window.OriaSGFromEngine.rebuildP2(g,Array.isArray(ds)?ds:[ds]);var v=window.OriaSGValidate?window.OriaSGValidate.validate(g):{ok:true};if(!v.ok){console.warn('approx: P2 graf niepoprawny',v.errors);return null;}window.__approxEngGraph=g;var r=window.OriaSGBuild&&window.OriaSGBuild.build(g);
 var c={name:'przybliżony (graf)',approx:1,group:r&&r.group,geo:r&&r.geo,meshes:r&&r.meshes,how:'Approximate SG v'+g.schema_version+' · P2 · '+(r&&r.meshes)+' elementów · '+g.questions.length+' pytań'};window.__approxCands.push(c);var L=window.AUTO&&window.AUTO.last;if(L)L.approxCand=c;console.log('approx: P2 przebudowa —',c.how);return {graph:g,cand:c};}
window.__approxApply=apply;
window.OriaSGHook={make:mk,apply:apply};
var tries=0;(function wrap(){var f=window.candidates;if(typeof f!=='function'){if(++tries<40)setTimeout(wrap,250);return;}if(f.__approx)return;
 var w=function(m){var C=f.apply(this,arguments);try{mk(m)}catch(e){console.warn('approx hook',e)}try{late(m)}catch(e){}return C;};w.__approx=1;window.candidates=w;console.log('approx: hook candidates OK');})();
})();
