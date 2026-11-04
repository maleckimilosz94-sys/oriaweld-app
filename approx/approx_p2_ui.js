/* approx-p2-ui (2026-11-04): ekran „pytania o elementy” (Approximate) z makiety P2 hybrydowej.
   TYLKO warstwa UI. Nie liczy/nie przebudowuje/nie waliduje grafu (to Silnik ETAP 4). Klasyczny p2Checkpoint bez zmian.
   API: window.showApproxP2UI(graph, opts) -> Promise<{graph, decisions, skipped}>
        opts: {mount: element (domyślnie #app), lang:'pl'|'en'|'de'}
   Wpięcie: DOMYŚLNIE OFF. Włączenie: ?approx=1 albo #approx=1 albo window.__approxOn=true.
   Po klasycznym P2 (wrapper p2Checkpoint) — tylko gdy jest graf: m.approxGraph || window.__approxGraph z questions[].
   Bez grafu / bez pytań → early-resolve (UI się nie pokazuje). */
(function(){'use strict';
var I18N={
pl:{title:"Kilka pytań o Twój rysunek",classic:"Klasyczny checkpoint P2 (typ / rzut) — bez zmian.",dims:"Wymiary całości (wys. / szer. / głęb.)",H:"WYSOKOŚĆ",W:"SZEROKOŚĆ",D:"GŁĘBOKOŚĆ",confirmed:"pewne",estimated:"na oko",unknown:"niejasne",recognized:"z rysunku",inferred:"domysł",questions:"Pytania do Ciebie",noq:"Brak pytań dla tego rysunku.",confirm:"Tak, pasuje",reject:"Nie",leave:"Nie wiem",changeType:"Inny typ…",members:"Części, które widzimy",legend:"Co znaczą kolory",debug:"decisions[] (debug)",answered:"odpowiedziano",about:"chodzi o",skip:"Pomiń",go:"✓ Kontynuuj"},
en:{title:"A few questions about your drawing",classic:"Classic P2 checkpoint (type / view) — unchanged.",dims:"Overall size (height / width / depth)",H:"HEIGHT",W:"WIDTH",D:"DEPTH",confirmed:"solid",estimated:"rough guess",unknown:"unclear",recognized:"from drawing",inferred:"we figured",questions:"Questions for you",noq:"No questions for this drawing.",confirm:"Yes, that fits",reject:"No",leave:"Not sure",changeType:"Different type…",members:"Parts we can see",legend:"What the colours mean",debug:"decisions[] (debug)",answered:"answered",about:"about",skip:"Skip",go:"✓ Continue"},
de:{title:"Ein paar Fragen zu Ihrer Zeichnung",classic:"Klassischer P2-Checkpoint (Typ / Ansicht) — unverändert.",dims:"Gesamtmaße (Höhe / Breite / Tiefe)",H:"HÖHE",W:"BREITE",D:"TIEFE",confirmed:"sicher",estimated:"geschätzt",unknown:"unklar",recognized:"aus Zeichnung",inferred:"abgeleitet",questions:"Fragen an Sie",noq:"Keine Fragen zu dieser Zeichnung.",confirm:"Ja, passt",reject:"Nein",leave:"Weiß nicht",changeType:"Anderer Typ…",members:"Teile, die wir erkennen",legend:"Was die Farben bedeuten",debug:"decisions[] (Debug)",answered:"beantwortet",about:"betrifft",skip:"Überspringen",go:"✓ Weiter"}};
var ROLES=['column','beam','brace','leg','plate','bracket','rib','tube','disc','aux'],GEOM=['bar','plate','tube','disc','bent_plate'];
function on(){return window.__approxOn===true||/[?&]approx=1/.test(location.search)||/(^|[#&])approx=1/.test(location.hash)}
function curLang(){var L;try{L=(location.hash.match(/lang=(en|pl|de)/)||[])[1]||localStorage.getItem('oria_lang')||'pl'}catch(e){L='pl'}return I18N[L]?L:'pl'}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function mkDec(q,answer,prev,extra){if(window.OriaSG&&window.OriaSG.decision)return window.OriaSG.decision(q,answer,prev,extra);
 extra=extra||{};var d={q:q,answer:answer,by:'user',ts:new Date().toISOString(),prev:prev||{}};['action','role','geom','delta','_ui_note'].forEach(function(k){if(extra[k]!=null)d[k]=extra[k]});return d}
function overallQ(k){return window.OriaSG&&window.OriaSG.overallQ?window.OriaSG.overallQ(k):'overall.'+k}
var MAP=[['H','height'],['W','width'],['D','depth']];

window.showApproxP2UI=function(graph,opts){opts=opts||{};
 var host=opts.mount||document.getElementById('app');
 if(!graph||!host)return Promise.resolve({graph:graph,decisions:[],skipped:true});
 var g=graph,S={lang:opts.lang||curLang(),decisions:(g.decisions||[]).slice(),done:{},active:null,hl:null};
 var qs=g.questions||[];S.active=(qs[0]||{}).id||null;
 function t(k){return (I18N[S.lang]||I18N.pl)[k]||k}
 function qtxt(q){var H=window.Q_HUMAN||{},h=(H[S.lang]||{})[q.id]||(H.pl||{})[q.id];if(h)return h;return S.lang==='pl'?q.text:(q.text||'')+' [PL]'}
 function roleL(k){return ((window.ROLE_H||{})[S.lang]||{})[k]||k}
 function geomL(k){return ((window.GEOM_H||{})[S.lang]||{})[k]||k}
 function opts(list,lab,sel){return list.map(function(r){return '<option value="'+esc(r)+'"'+(sel===r?' selected':'')+'>'+esc(lab(r))+'</option>'}).join('')}
 function kindL(k){return ((window.Q_KIND||{})[S.lang]||{})[k]||k}
 function thumb(q){try{return window.qThumb?window.qThumb(q):''}catch(e){return ''}}
 function member(id){return (g.members||[]).filter(function(m){return m.id===id})[0]}
 var root=document.createElement('div');root.className='approx-p2';
 var prevHTML=host.innerHTML;
 return new Promise(function(res){
  function finish(skipped){g.decisions=S.decisions;host.innerHTML='';if(opts.restore)host.innerHTML=prevHTML;window.__approxDecisions=S.decisions;res({graph:g,decisions:S.decisions,skipped:!!skipped})}
  function dec(q,answer,prev,ex){S.decisions.push(mkDec(q,answer,prev,ex));render()}
  function render(){var od=g.overall_dimensions=g.overall_dimensions||{};
   var h='<section class="card"><h2>'+t('title')+'</h2><div class="note">'+t('classic')+'</div></section>';
   h+='<section class="card"><h2>'+t('dims')+'</h2><div class="dims">'+MAP.map(function(p){var o=od[p[1]]||{value:null,status:'unknown'},st=o.status||'unknown';
     return '<div class="tile"><div class="k">'+p[0]+'</div><div class="l">'+t(p[0])+'</div><input type="number" inputmode="numeric" data-k="'+p[1]+'" value="'+(o.value==null?'':esc(o.value))+'" placeholder="mm"><span class="chip s-'+esc(st)+'">'+esc(t(st))+'</span><div class="note mono">'+esc(o.source||'—')+'</div></div>'}).join('')+'</div></section>';
   h+='<section class="card"><h2>'+t('questions')+' <span class="note">'+(qs.length?'('+Object.keys(S.done).length+'/'+qs.length+')':'')+'</span></h2>';
   h+=qs.length?qs.map(function(q){var m=member(q.about),ab=String(q.about||''),st=m?m.status:((ab.indexOf('overall.')===0&&od[ab.slice(8)])?od[ab.slice(8)].status:'unknown');
     var x='<div class="q'+(S.active===q.id?' active':'')+(S.done[q.id]?' done':'')+'" data-q="'+esc(q.id)+'"><div class="meta"><span class="chip kind">'+esc(kindL(q.kind))+'</span><span>'+t('about')+' <span class="mono">'+esc(ab)+'</span></span><span class="chip s-'+esc(st)+'">'+esc(t(st))+'</span>'+(S.done[q.id]?'<span class="chip s-confirmed">✓ '+t('answered')+': '+esc(S.done[q.id])+'</span>':'')+'</div><div class="qrow">'+thumb(q)+'<div class="t">'+esc(qtxt(q))+'</div></div>';
     if(q.kind==='depth'){var v=(od[ab.slice(8)]||{}).value;x+='<div class="extra"><input type="number" inputmode="numeric" class="dv" value="'+(v==null?'':esc(v))+'" placeholder="mm"> <span class="note">mm</span></div>'}
     if(q.kind==='type'){x+='<div class="extra"><select class="tr">'+opts(ROLES,roleL,m&&m.role)+'</select><select class="tg">'+opts(GEOM,geomL,m&&m.geom)+'</select><button class="b-ok" data-a="change_type">'+t('changeType')+'</button></div>'}
     return x+'<div class="acts"><button class="b-ok" data-a="confirm">'+t('confirm')+'</button><button class="b-no" data-a="reject">'+t('reject')+'</button><button class="b-lv" data-a="leave_unknown">'+t('leave')+'</button></div></div>'}).join(''):'<div class="note">'+t('noq')+'</div>';
   h+='</section><section class="card"><h2>'+t('members')+'</h2><div class="note">'+t('legend')+'</div><div class="legend">'+['recognized','inferred','estimated','unknown','confirmed'].map(function(s){return '<span class="chip s-'+s+'">'+t(s)+'</span>'}).join('')+'</div>';
   var aq=qs.filter(function(q){return q.id===S.active})[0],hl=S.hl||(aq&&aq.about);
   h+='<ul class="mlist">'+(g.members||[]).map(function(m){return '<li data-m="'+esc(m.id)+'" class="'+(hl===m.id?'hl':'')+'"><span class="mono">'+esc(m.id)+'</span><span class="note">'+esc(roleL(m.role))+' · '+esc(geomL(m.geom))+'</span><span class="chip s-'+esc(m.status)+'">'+esc(t(m.status))+'</span></li>'}).join('')+'</ul></section>';
   if(opts.debug||/approxdbg=1/.test(location.search+location.hash))h+='<details class="card" open><summary class="note">'+t('debug')+'</summary><pre>'+esc(JSON.stringify(S.decisions,null,1))+'</pre></details>';
   h+='<div class="ap-foot"><button class="ap-skip">'+t('skip')+'</button><button class="ap-go">'+t('go')+'</button></div>';
   root.innerHTML=h;wire()}
  function wire(){var od=g.overall_dimensions;
   [].forEach.call(root.querySelectorAll('.dims input'),function(inp){inp.onchange=function(){var k=inp.dataset.k,o=od[k]||{},v=inp.value===''?null:+inp.value;
     var prev={value:o.value==null?null:o.value,status:o.status||'unknown',source:o.source||null};od[k]={value:v,status:'confirmed',source:'user_p2'};
     var q=qs.filter(function(q){return q.about==='overall.'+k})[0];
     dec(q?q.id:overallQ(k),String(v),prev,q?{action:'confirm'}:{action:'confirm',_ui_note:'brak pytania o overall.'+k+' — q do ustalenia z Silnikiem'})}});
   [].forEach.call(root.querySelectorAll('.q'),function(c){var q=qs.filter(function(z){return z.id===c.dataset.q})[0];if(!q)return;
    c.onclick=function(e){if(e.target.closest('button,input,select'))return;S.active=q.id;S.hl=q.about;render()};
    [].forEach.call(c.querySelectorAll('button[data-a]'),function(b){b.onclick=function(){var a=b.dataset.a,ans=a==='confirm'?'yes':a==='reject'?'no':a==='leave_unknown'?'unknown':'change_type',prev={},ex={action:a},ab=String(q.about||'');
      var m=member(q.about);if(m)prev={status:m.status,verify:m.verify,role:m.role,geom:m.geom};
      if(q.kind==='depth'&&a==='confirm'){var k=ab.slice(8),inp=c.querySelector('.dv'),v=inp&&inp.value!==''?+inp.value:null,o=od[k]||{};prev={value:o.value,status:o.status,source:o.source};if(ab.indexOf('overall.')===0)od[k]={value:v,status:'confirmed',source:'user_p2'};ans=String(v)}
      if(a==='change_type'){ex.role=c.querySelector('.tr').value;ex.geom=c.querySelector('.tg').value}
      if(m){m.verify=a==='confirm'?'confirmed':a==='reject'?'rejected':a==='leave_unknown'?'left_unknown':'changed';if(a==='confirm'||a==='change_type')m.status='confirmed';if(a==='leave_unknown')m.status='unknown';if(a==='change_type'){m.role=ex.role;m.geom=ex.geom}}
      S.done[q.id]=t(a==='leave_unknown'?'leave':a==='change_type'?'changeType':a);
      var nx=qs.filter(function(z){return !S.done[z.id]})[0];S.active=nx?nx.id:null;S.hl=nx?nx.about:null;dec(q.id,ans,prev,ex)}})});
   [].forEach.call(root.querySelectorAll('.mlist li'),function(li){li.onclick=function(){S.hl=li.dataset.m;render()}});
   root.querySelector('.ap-skip').onclick=function(){finish(true)};
   root.querySelector('.ap-go').onclick=function(){finish(false)}}
  host.innerHTML='';host.appendChild(root);render();try{window.scrollTo(0,0)}catch(e){}
 })};

/* Wpięcie po klasycznym P2 — wrapper, p2_checkpoint.js nie jest edytowany. Bez flagi: nic się nie dzieje. */
function graphFor(m){var g=(m&&m.approxGraph)||window.__approxGraph;return g&&typeof g==='object'?g:null}
var tries=0;(function wrap(){if(!on())return;var f=window.p2Checkpoint;if(typeof f!=='function'){if(++tries<40)setTimeout(wrap,250);return}if(f.__approxUI)return;
 var w=function(m){return Promise.resolve(f.apply(this,arguments)).then(function(r){var g=graphFor(m);
   if(!g||!(g.questions||[]).length)return r; /* early-resolve: brak grafu/pytań */
   return window.showApproxP2UI(g).then(function(o){if(m){m.approxGraph=o.graph;m.approxDecisions=o.decisions}return r})})};
 w.__approxUI=1;for(var k in f)if(Object.prototype.hasOwnProperty.call(f,k))w[k]=f[k];window.p2Checkpoint=w;console.log('approx-p2-ui: wrapper p2Checkpoint OK')})();
})();
