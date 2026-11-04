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
    return {status:status,solid:solid,axes:c.solid,checks:checks,conflicts:conflicts,missing:missing,needsP2:status!=='ok',usedViews:c.usedViews,meta:{v:'0.1',tolMm:tolMm,tolRel:tolRel}};}
  var api={assemble:assemble,PAIRS:PAIRS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaViewAssembler=api;
})(typeof window!=='undefined'?window:this);
