/* oria152 (LOKALNIE): fałszywa wysoka pewność. Gdy brak odpowiedzi P2 i wymiary modelu kłócą się z liczbami z rysunku:
   A) największy gabaryt modelu nie ma pokrycia w żadnej liczbie OCR (tol. max(2 mm, 3%)),
   B) na rysunku jest wiarygodny wymiar (≤3000) > 2× największy gabaryt modelu,
   → pewność ≤45%, p1gate=ASK, karta „Doprecyzuj (P2)”. Wyłącznik: window.__noPew152=1 lub #pew=0. */
(function(){
function off(){return window.__noPew152||/(^|[#&])pew=0/.test(location.hash)}
function chk(m){if(!m||!m.size||off())return null;var P=m.p2||window.__p2pre;if(P&&P.kind&&P.kind!=='auto')return null;
 var S=m.size.map(Number).filter(function(v){return v>0}),L=Math.max.apply(null,S);if(!(L>0))return null;
 var TB=m.titleBlockBox||(m.info&&m.info.titleBlockBox)||window.__titleBlockBox||null;
 function inTB(n){if(!TB||n.x==null)return false;var cx=n.x+(n.w||0)/2,cy=n.y+(n.h||0)/2;return cx>=TB.x-4&&cx<=TB.x+TB.w+4&&cy>=TB.y-4&&cy<=TB.y+TB.h+4}
 /* oria153: tylko czyste wymiary – bez nr rysunku (1368-631.00…), kodów (660.16GRE), 10x450, tabliczki, niskiej pewności OCR */
 function ok(n){if(!n||!n.p||inTB(n))return false;var v=+n.p.value,t=String(n.text||'').trim();if(!(v>=5&&v<=3000))return false;if(window.__pew152Old)return true;
  return (n.conf||0)>=70&&/^[øØ@R]?\(?\d{1,4}([.,]\d{1,2})?\)?$/.test(t)}
 var NN=(m.nums||[]).filter(ok),N=NN.map(function(n){return +n.p.value});
 /* B: tylko wymiar odczytany przez silnik z linią wymiarową (src silnik, pewność ≥90) */
 var NB=window.__pew152Old?N:NN.filter(function(n){return n.src==='silnik'&&(n.conf||0)>=90}).map(function(n){return +n.p.value});if(N.length<3)return null;
 var why=[];function hit(x){return N.some(function(v){return Math.abs(v-x)<=Math.max(2,0.03*x)})}
 if(!hit(L))why.push('gabaryt '+Math.round(L)+' mm nie występuje w wymiarach rysunku');
 var big=NB.filter(function(v){return v>2*L}).sort(function(a,b){return b-a})[0];if(big)why.push('na rysunku wymiar '+big+' mm > 2× model ('+Math.round(L)+')');
 return why.length?why:null}
window.__pew152=chk;
var oc=window.conf2;if(typeof oc==='function'){window.conf2=function(m){var c=oc(m),w=chk(m);m.confWhy=w;m.__pewAsk=!!w;if(w){m.confRaw=c;c=Math.min(c,45);}return c}}
var d=Object.getOwnPropertyDescriptor(window,'__autoResult');if(d&&d.set){Object.defineProperty(window,'__autoResult',{configurable:true,get:d.get,set:function(v){d.set.call(window,v);try{var m=window.AUTO&&AUTO.last,w=chk(m);if(v&&w){v.pew152=w;if(v.p1gate){v.p1gate.statusRaw=v.p1gate.status;v.p1gate.status='ASK';v.p1gate.pew=w}}}catch(e){}}})}
var os=window.showAuto2;if(typeof os==='function'){window.showAuto2=function(m){var r=os.apply(this,arguments);try{var w=chk(m);if(w&&window.p2CheckpointUI){var a=document.getElementById('app'),h1=a&&a.querySelector('h1');if(h1&&!a.querySelector('#pew152')){var c=document.createElement('div');c.id='pew152';c.className='card';c.style.cssText='border:1px solid #f97316;margin:8px 0;padding:10px';
  c.innerHTML='<b>⚠ Niepewny wynik</b><p class="small">'+w.join('; ')+'.</p><button class="btn" id="pew152b">Doprecyzuj (P2)</button>';h1.insertAdjacentElement('afterend',c);
  document.getElementById('pew152b').onclick=function(){window.p2CheckpointUI(m).then(function(){window.showAuto2(m)})}}}}catch(e){console.log('pew152',e)}return r}}
})();
