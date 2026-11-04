/* OriaViewAssembler v0.1 (t956u P2) — front+bok+góra → jedna bryła po wspólnych wymiarach. Owija OriaViewCompose.
   Pary wspólne: front.w↔top.w (szer.), front.h↔side.h (wys.), side.d↔top.d (głęb.). Tolerancja jawna: tolMm (domyślnie 1 mm) + tolRel (1%).
   Konflikt → status 'conflict', solid=null, BEZ zgadywania (nie uśredniamy sprzecznych). Brak osi → 'incomplete'. Bez UI, bez side-effectów. */
(function(root){
  var VC=root.OriaViewCompose||(typeof require!=='undefined'?require('./view_compose.js'):null);
  var PAIRS=[['width','front','top'],['height','front','side'],['depth','side','top']];
  function assemble(views,opts){opts=opts||{};var tolMm=opts.tolMm!=null?opts.tolMm:1,tolRel=opts.tolRel!=null?opts.tolRel:0.01;
    var c=VC.compose(views,{tol:tolMm,tolRel:tolRel});
    var checks=PAIRS.map(function(p){var s=c.solid[p[0]],vs=s.views||[];var both=vs.indexOf(p[1])>=0&&vs.indexOf(p[2])>=0;
      return {axis:p[0],views:[p[1],p[2]],status:s.status==='conflict'?'conflict':both?'match':s.status==='recognized'?'single':'missing'};});
    var conflicts=c.conflicts.map(function(k){return {axis:k.axis,values:k.values.map(function(v){return Math.round(v*10)/10;}),views:k.views,tolMm:Math.round(k.tol*100)/100,msg:'niespójny wymiar '+k.axis+': '+k.values.map(function(v){return Math.round(v*10)/10;}).join(' vs ')+' mm ('+k.views.join('/')+') — do P2, bez zgadywania'};});
    var missing=['width','height','depth'].filter(function(a){return c.solid[a].status==='unknown';});
    var status=conflicts.length?'conflict':missing.length?'incomplete':'ok';
    var solid=status==='ok'?{W:c.solid.width.value,H:c.solid.height.value,D:c.solid.depth.value}:null;
    /* t967 ETAP4: approx questions[] — tylko dane dla P2 (bez UI): konflikt → wybór spośród odczytanych wartości (bez średniej), brak → pytanie o wartość. approx = rozjazd ≤ 2×tol (prawdopodobnie ten sam wymiar). Nic nie wybieramy za użytkownika. */
    var questions=conflicts.map(function(k){var sp=Math.max.apply(null,k.values)-Math.min.apply(null,k.values);return {id:'vaConf_'+k.axis,kind:'conflict',axis:k.axis,ask:'Który wymiar '+k.axis+' jest poprawny?',options:k.values.slice(),views:k.views,approx:sp<=2*k.tolMm,spreadMm:Math.round(sp*10)/10,pick:null};})
      .concat(missing.map(function(a){return {id:'vaMiss_'+a,kind:'missing',axis:a,ask:'Podaj wymiar '+a+' (mm)',options:[],views:[],approx:false,pick:null};}));
    var res={status:status,solid:solid,axes:c.solid,checks:checks,conflicts:conflicts,missing:missing,questions:questions,needsP2:status!=='ok',usedViews:c.usedViews,meta:{v:'0.1',tolMm:tolMm,tolRel:tolRel}};
    /* t968: ostatni wynik dla P2 (tylko przeglądarka, tylko gdy moduł załadowany = ?viewc=1) */
    try{if(typeof window!=='undefined')window.__viewAsmLast=res;}catch(e){}
    return res;}
  /* t969 ETAP4: scalenie viewQ (assembler) z questions[] grafu approx — 1 pytanie na oś; pick użytkownika (pamięć P2 / decyzja / overall confirmed) blokuje ponowne pytanie. Czyste dane, wejścia nietknięte. */
  var AX={h:'height',height:'height',hoehe:'height',w:'width',width:'width',breite:'width',d:'depth',depth:'depth',tiefe:'depth'};
  function axisOf(q){if(!q)return null;if(q.axis&&AX[String(q.axis).toLowerCase()])return AX[String(q.axis).toLowerCase()];var m=/^overall\.(\w+)$/.exec(q.about||q.q||'');return m&&AX[m[1].toLowerCase()]||null;}
  function mergeQ(viewQ,graph,picks){picks=picks||{};var done={},out=[],byAx={};
    Object.keys(picks).forEach(function(k){var a=AX[String(k).toLowerCase()];if(a&&picks[k]!=null)done[a]=1;});
    var G=graph||{},od=G.overall_dimensions||{};['width','height','depth'].forEach(function(k){if(od[k]&&od[k].status==='confirmed')done[k]=1;});
    var dq={};(G.decisions||[]).forEach(function(d){dq[d.q]=1;var a=axisOf(d)||axisOf((G.questions||[]).concat(G.answered||[]).filter(function(x){return x.id===d.q})[0]);if(a)done[a]=1;});
    (G.questions||[]).forEach(function(q){if(dq[q.id])return;var a=axisOf(q);if(a&&done[a])return;var c=Object.assign({},q,{src:'approx'});if(a){if(byAx[a])return;byAx[a]=c;c.axis=a;}out.push(c);});
    (viewQ||[]).forEach(function(q){if(q.pick!=null)return;var a=axisOf(q);if(a&&done[a])return;if(a&&byAx[a]){var t=byAx[a];t.options=(t.options||[]).concat(q.options||[]).filter(function(v,i,A){return A.indexOf(v)===i});t.views=q.views;t.alsoFrom='viewc';return;}var c=Object.assign({},q,{src:'viewc'});if(a)byAx[a]=c;out.push(c);});
    return out;}
  var PK='oria_viewq_picks';
  function loadPicks(key){if(!/^f:/.test(key||''))return {};try{var M=JSON.parse(localStorage.getItem(PK)||'{}');return key&&M[key]||{};}catch(e){return {};}}
  function savePick(key,axis,val){try{var a=AX[String(axis).toLowerCase()];if(!/^f:/.test(key||'')||!a||val==null)return false;/* t972: tylko klucz pliku f:… (bez nazwy pliku klucz |vN koliduje między plikami) */var M=JSON.parse(localStorage.getItem(PK)||'{}');M[key]=M[key]||{};M[key][a]=val;localStorage.setItem(PK,JSON.stringify(M));return true;}catch(e){return false;}}
  /* t971: gabaryt z istniejącego gabAsk (p2_mid) → oś pytania viewQ, której opcja = v (tol max(1mm,1%)); jednoznacznie albo nic */
  function gabPick(viewQ,v){v=+v;if(!(v>0))return null;var hit=[];(viewQ||[]).forEach(function(q){var a=axisOf(q);if(!a||q.pick!=null)return;if((q.options||[]).some(function(o){return Math.abs(+o-v)<=Math.max(1,0.01*v)}))hit.push(a);});hit=hit.filter(function(a,i){return hit.indexOf(a)===i});return hit.length===1?{axis:hit[0],value:v}:null;}
  var api={assemble:assemble,PAIRS:PAIRS,mergeQ:mergeQ,axisOf:axisOf,loadPicks:loadPicks,savePick:savePick,gabPick:gabPick};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaViewAssembler=api;
  /* t970: zapis pick — istniejący handler decyzji P2 grafu (window.__approxApply), bez UI. Decyzja na osi (overall.<k> / pytanie z about overall.<k>) z liczbą → savePick(klucz pliku P2). */
  function pickFromDecisions(ds,graph){var out=[];(Array.isArray(ds)?ds:[ds]).forEach(function(d){if(!d||d.action==='reject'||d.action==='leave_unknown')return;var v=+d.answer;if(!(v>0))return;var q=((graph&&graph.questions)||[]).filter(function(x){return x.id===d.q})[0];var a=axisOf(d)||axisOf(q);if(a)out.push({axis:a,value:v});});return out;}
  api.pickFromDecisions=pickFromDecisions;
  if(typeof window!=='undefined'){var tr=0;(function hook(){var f=window.__approxApply;if(typeof f!=='function'){if(++tr<40)setTimeout(hook,250);return;}if(f.__va)return;
    var w=function(ds){try{pickFromDecisions(ds,window.__approxEngGraph).forEach(function(p){savePick(window.__p2LastKey,p.axis,p.value)});}catch(e){}return f.apply(this,arguments);};w.__va=1;window.__approxApply=w;try{if(window.OriaSGHook)window.OriaSGHook.apply=w;}catch(e){}})();}
})(typeof window!=='undefined'?window:this);
