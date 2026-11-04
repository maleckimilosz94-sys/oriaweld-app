/* OriaP2HardGate v0.1 (t956u P4) — obowiązkowe P2 przed generowaniem modelu. Flaga ?p2gate=1 / #p2gate=1 / __p2Gate=1|true (OFF domyślnie).
   Przy fladze ON obejścia p2=0 / ask=0 / __p2MidOff / __p2Auto NIE pomijają P2; bez UI → HOLD (proces stoi, brak build3d). */
(function(root){
  function on(w){w=w||root;var L=w.location||{},q=(L.search||'')+'&'+(L.hash||'');return w.__p2Gate===true||w.__p2Gate===1||/(^|[?#&])p2gate=1(&|$)/.test(q);}
  function decide(w){w=w||root;if(!on(w))return 'off';return w.p2CheckpointUI?'ui':'hold';}
  function hold(w,sug){w=w||root;var r={allowed:false,reason:'P2 obowiązkowe — brak zatwierdzenia, model NIE jest generowany',suggest:sug||w.__p2Suggest||null,t:Date.now()};w.__p2GateLast=r;
    try{var a=w.document&&w.document.getElementById('app');if(a)a.insertAdjacentHTML('beforeend','<div class="card" id="p2hold"><b>P2 wymagane</b><p class="small">'+r.reason+'</p></div>');}catch(e){}
    return new Promise(function(){});}
  var api={on:on,decide:decide,hold:hold};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaP2HardGate=api;
})(typeof window!=='undefined'?window:this);
