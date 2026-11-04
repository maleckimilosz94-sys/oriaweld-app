/* OriaApproxBoundary v0.1 — granica Approximate <-> Precise + log statusów. Flaga ?bound=1 / __approxBound=1 (OFF).
   Status osi/elementu: approx | precise | conflict | unknown (bez zgadywania).
   gate: blocked (konflikt) | p2_required (brak/przybliżone osie krytyczne) | ok_to_build (wszystkie osie precise). */
(function(root){
  var AX=['width','height','depth'],K={width:'w',height:'h',depth:'d'};
  var PREC_SRC=/ocr|view|rzut|compose|dim/i;
  function axisStatus(ax,sg,comp){
    var c=comp&&comp.solid&&comp.solid[ax];
    if(c&&c.status==='conflict')return {status:'conflict',value:null,src:'compose',views:c.views||[]};
    if(c&&c.value!=null&&c.status!=='unknown')return {status:'precise',value:c.value,src:'compose',views:c.views||[]};
    var o=sg&&sg.overall_dimensions&&sg.overall_dimensions[ax];
    if(o&&o.status==='conflict')return {status:'conflict',value:null,src:o.source||'sg'};
    if(o&&o.value!=null&&isFinite(o.value)){
      var pr=(o.status==='confirmed'||o.status==='measured')&&PREC_SRC.test(o.source||'');
      return {status:pr?'precise':'approx',value:+o.value,src:o.source||'sg'};}
    return {status:'unknown',value:null,src:null};
  }
  function memberStatus(m){var s=(m&&m.status)||'';
    if(s==='conflict')return 'conflict';
    if(s==='confirmed'||s==='measured')return 'precise';
    if(s==='inferred'||s==='estimated'||s==='approx')return 'approx';
    return 'unknown';}
  function evaluate(input,opts){
    input=input||{};opts=opts||{};var sg=input.sg||null,comp=input.compose||null,filt=input.filter||null;
    var critical=opts.critical||AX,axes={},detail={},conflicts=[];
    AX.forEach(function(ax){var a=axisStatus(ax,sg,comp);axes[K[ax]]=a.status;detail[ax]=a;
      if(a.status==='conflict')conflicts.push({axis:ax,src:a.src,views:a.views||[]});});
    (comp&&comp.conflicts||[]).forEach(function(c){if(!conflicts.some(function(x){return x.axis===c.axis}))conflicts.push({axis:c.axis,src:'compose'});});
    (sg&&sg.conflicts||[]).forEach(function(c){conflicts.push({axis:c.about||c.axis||null,src:'sg',note:c.text||c.kind||null});});
    var members=null;
    if(sg&&Array.isArray(sg.members)){members={approx:0,precise:0,conflict:0,unknown:0,list:[]};
      sg.members.forEach(function(m){var s=memberStatus(m);members[s]++;members.list.push({id:m.id,status:s});
        if(s==='conflict')conflicts.push({member:m.id,src:'sg'});});}
    var crit=critical.map(function(ax){return detail[ax].status;}),gate,reason;
    if(conflicts.length){gate='blocked';reason='konflikt: '+conflicts.map(function(c){return c.axis||c.member}).join(',');}
    else if(crit.indexOf('unknown')>=0){gate='p2_required';reason='brak osi: '+critical.filter(function(ax){return detail[ax].status==='unknown'}).join(',');}
    else if(crit.every(function(s){return s==='precise'})){gate='ok_to_build';reason='wszystkie osie krytyczne precise';}
    else {gate='p2_required';reason='osie przybliżone — potwierdź w P2';}
    var mode=gate==='ok_to_build'?'precise':(sg?'approximate':'none');
    var res={mode:mode,axes:axes,dims:{w:detail.width.value,h:detail.height.value,d:detail.depth.value},
      members:members&&{approx:members.approx,precise:members.precise,conflict:members.conflict,unknown:members.unknown},
      conflicts:conflicts,gate:gate,reason:reason,preciseAllowed:gate==='ok_to_build',
      filter:filt?{kept:filt.kept!=null?filt.kept:null,total:filt.total!=null?filt.total:null}:null,meta:{v:'0.1'}};
    if(!opts.silent&&typeof console!=='undefined')console.log('approx-bound:',res.gate,'| mode',res.mode,'| w/h/d',axes.w+'/'+axes.h+'/'+axes.d,'| '+reason);
    return res;
  }
  var api={evaluate:evaluate,axisStatus:axisStatus,memberStatus:memberStatus};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaApproxBoundary=api;
})(this);
