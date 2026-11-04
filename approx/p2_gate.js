/* OriaP2Gate v0.1 — obowiązkowa bramka P2 przed budową Precise/3D. Flaga ?p2gate=1 / __p2Gate=1 (OFF). Bez UI.
   Wejście: bound (OriaApproxBoundary.evaluate) + stan P2: confirmed | open | skipped.
   Reguły: blocked → nigdy; p2_required → tylko po confirmed; ok_to_build → też wymaga confirmed (P2 obowiązkowe, mid-checkpoint). */
(function(root){
  function p2State(w){w=w||(typeof window!=='undefined'?window:{});
    if(w.__p2pre&&w.__p2pre.kind&&w.__p2pre.kind!=='auto')return 'confirmed';
    var h=(w.location&&w.location.hash)||'';
    if(w.__p2MidOff||w.__p2On===false||/(^|[#&])(p2|ask)=0/.test(h))return 'skipped';
    return 'open';}
  function check(bound,p2){var g=bound&&bound.gate;
    if(!g)return {allowed:false,reason:'brak wyniku granicy — bez zgadywania',needsP2:true};
    if(g==='blocked')return {allowed:false,reason:'konflikt geometrii ('+(bound.reason||'')+') — budowa zablokowana',needsP2:true};
    if(p2==='confirmed')return {allowed:true,reason:'P2 potwierdzone · gate '+g,needsP2:false};
    return {allowed:false,reason:(p2==='skipped'?'P2 pominięte':'P2 otwarte')+' — P2 obowiązkowe przed budową (gate '+g+')',needsP2:true};}
  var api={check:check,p2State:p2State};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaP2Gate=api;
})(this);
