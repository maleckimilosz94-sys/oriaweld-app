/* p2_viewq_ui.js – lista pytań P2 (viewQ/jogQ). OFF domyślnie: tylko ?p2q=1 / window.__p2q. LOKALNIE, zero LIVE.
   API: window.p2ViewQAsk(m) -> Promise<m>. Zapis: __approxApply([{q,action,answer}]) gdy jest (Silnik robi JogPick+savePick w hooku);
   fallback bez __approxApply: OriaViewAssembler.savePick + OriaJogPick.save. */
(function(){
var D={pl:['Kilka pytań o wymiary / gięcie','Odpowiedz, co wiesz – puste = bez zgadywania.','Zastosuj','Pomiń na razie','Nie wiem','Tak pasuje','mm'],
 en:['A few questions about dimensions / bending','Answer what you know – empty = no guessing.','Apply','Skip for now','I don’t know','Yes, fits','mm'],
 de:['Ein paar Fragen zu Maßen / Biegung','Beantworte, was du weißt – leer = keine Annahme.','Übernehmen','Vorerst überspringen','Weiß nicht','Ja, passt','mm']};
function L(){try{return (location.hash.match(/lang=(en|pl|de)/)||[])[1]||localStorage.getItem('oria_lang')||'pl'}catch(e){return 'pl'}}
function on(){try{return !!window.__p2q||/[?&#]p2q=1\b/.test(location.search+location.hash)}catch(e){return false}}
function esc(x){return String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function isJog(q){return /^q_jog_/.test(q.id)||q.src==='jogfix'||q.jkind==='joggle'||q.kind==='joggle'}
function type(q){if(q.id==='q_r16_vs_r1_6')return {t:'chips',o:['R1.6','R16']};
 var o=(q.options||[]).filter(function(x){return x!=null&&x!==''});
 if(q.kind==='conflict'&&o.length)return {t:'chips',o:o,mm:1};
 if(q.kind==='missing'||isJog(q)||q.unit==='mm')return {t:'num'};
 if(o.length)return {t:'chips',o:o};return {t:'yn'}}
function list(m){var s={};return ((m&&m.p2&&m.p2.viewQ)||[]).filter(function(q){if(!q||!q.id||s[q.id])return false;if(q.pick!=null&&q.pick!=='')return false;if(q.val!=null&&q.val!=='')return false;s[q.id]=1;return true})}
function num(v){var n=parseFloat(String(v).replace(',','.'));return n>0?n:null}
function apply(qs,ans,M){var ds=[],jp={};qs.forEach(function(q){var v=ans[q.id];if(v==null||v==='')return;
  var a=q.id==='q_r16_vs_r1_6'?String(v):(v==='__no'?null:(v==='__yes'?'yes':num(v)));
  if(v==='__no'){ds.push({q:q.id,action:'leave_unknown',answer:null});return}
  if(a==null)return;q.pick=a;ds.push({q:q.id,action:'confirm',answer:a});
  if(q.id==='q_jog_h')jp.h=a;if(q.id==='q_jog_off')jp.off=a;if(q.id==='q_r16_vs_r1_6')jp.r=a});
 if(!ds.length)return ds;
 if(typeof window.__approxApply==='function'){try{window.__approxApply(ds)}catch(e){console.warn('p2viewq apply',e)}}
 else{try{var OV=window.OriaViewAssembler,key=window.__p2LastKey;if(OV&&OV.savePick)qs.forEach(function(q){var ax=q.axis||(OV.axisOf&&OV.axisOf(q));if(ax&&!isJog(q)&&typeof q.pick==='number')OV.savePick(key,ax,q.pick)});
   }catch(e){console.warn('p2viewq fallback',e)}}
 /* t995: ZAWSZE (także przy __approxApply) jp -> __a3JogAns + OriaJogPick.save(key(m)); OFF/brak jp = no-op */
 try{if(jp.h||jp.off||jp.r){var JA0=window.__a3JogAns||{};if(jp.h)JA0.h=jp.h;if(jp.off)JA0.off=jp.off;if(jp.r)JA0.r=jp.r;window.__a3JogAns=JA0;var JP=window.OriaJogPick;if(JP&&JP.save){var k=JP.key(M||(window.AUTO&&AUTO.last));if(jp.h)JP.save(k,'q_jog_h',jp.h);if(jp.off)JP.save(k,'q_jog_off',jp.off);if(jp.r)JP.save(k,'q_r16_vs_r1_6',jp.r)}console.log('p2viewq t995 jogAns',JSON.stringify(JA0))}}catch(e){console.warn('p2viewq t995',e)}
 window.__p2ViewQLast=ds;return ds}
function css(){if(document.getElementById('p2vq-css'))return;var s=document.createElement('style');s.id='p2vq-css';s.textContent=
'#p2vq{background:#0b0d14;color:#e6e9f2;font:15px/1.4 Inter,Montserrat,system-ui,sans-serif;padding:12px;max-width:560px;margin:0 auto}'+
'#p2vq h2{font-size:18px;margin:4px 0 2px}#p2vq .sub{color:#9aa3b5;font-size:13px;margin:0 0 12px}'+
'.p2vq-c{background:#10141D;border:1px solid #1f2633;border-radius:12px;padding:12px;margin:0 0 10px}.p2vq-c.done{border-color:#22d3ee}'+
'.p2vq-t{margin:0 0 8px}.p2vq-chips{display:flex;flex-wrap:wrap;gap:8px}'+
'.p2vq-chip{min-height:44px;padding:0 14px;border-radius:22px;border:1px solid #2a3344;background:#151a25;color:#e6e9f2;font-size:15px}'+
'.p2vq-chip.on{background:#22d3ee;color:#061018;border-color:#22d3ee;font-weight:600}'+
'.p2vq-in{display:flex;align-items:center;gap:8px}.p2vq-in input{width:130px;min-height:44px;font-size:16px;border-radius:10px;border:1px solid #2a3344;background:#0b0d14;color:#fff;padding:0 10px}'+
'.p2vq-bar{display:flex;gap:10px;position:sticky;bottom:0;background:#0b0d14;padding:10px 0}'+
'.p2vq-bar button{flex:1;min-height:48px;border-radius:12px;font-size:16px;border:1px solid #2a3344;background:#151a25;color:#e6e9f2}'+
'.p2vq-bar .ok{background:#22d3ee;color:#061018;border-color:#22d3ee;font-weight:700}';document.head.appendChild(s)}
function ask(m){var qs=list(m);if(!on()||!qs.length)return Promise.resolve(m);
 var app=document.getElementById('app');if(!app)return Promise.resolve(m);css();var g=D[L()]||D.pl,ans={};
 return new Promise(function(res){
  app.innerHTML='<div id="p2vq"><h2>'+g[0]+'</h2><p class="sub">'+g[1]+'</p>'+qs.map(function(q,i){var ty=type(q),h;
   if(ty.t==='chips')h='<div class="p2vq-chips">'+ty.o.map(function(o){return '<button class="p2vq-chip" data-v="'+esc(o)+'">'+esc(o)+(ty.mm?' mm':'')+'</button>'}).join('')+'<button class="p2vq-chip" data-v="__no">'+g[4]+'</button></div>';
   else if(ty.t==='yn')h='<div class="p2vq-chips"><button class="p2vq-chip" data-v="__yes">'+g[5]+'</button><button class="p2vq-chip" data-v="__no">'+g[4]+'</button></div>';
   else h='<div class="p2vq-in"><input type="number" inputmode="decimal" step="any" min="0" value="'+esc(q.val!=null?q.val:'')+'"> '+esc(q.unit||'mm')+'</div>';
   return '<div class="p2vq-c" data-i="'+i+'"><p class="p2vq-t">'+esc(q.text||q.q||q.ask||q.id)+'</p>'+h+'</div>'}).join('')+
   '<div class="p2vq-bar"><button id="p2vqno">'+g[3]+'</button><button class="ok" id="p2vqok">'+g[2]+'</button></div></div>';
  app.querySelectorAll('.p2vq-c').forEach(function(c){var q=qs[+c.dataset.i];
   c.querySelectorAll('.p2vq-chip').forEach(function(b){b.onclick=function(){c.querySelectorAll('.p2vq-chip').forEach(function(x){x.classList.remove('on')});b.classList.add('on');ans[q.id]=b.dataset.v;c.classList.add('done')}});
   var inp=c.querySelector('input');if(inp){if(inp.value)ans[q.id]=inp.value;inp.oninput=function(){ans[q.id]=inp.value;c.classList.toggle('done',!!num(inp.value))}}});
  document.getElementById('p2vqno').onclick=function(){res(m)};
  document.getElementById('p2vqok').onclick=function(){try{apply(qs,ans,m)}catch(e){}res(m)};
 })}
window.p2ViewQAsk=ask;window.OriaP2ViewQUI={on:on,list:list,type:type,apply:apply};
})();
