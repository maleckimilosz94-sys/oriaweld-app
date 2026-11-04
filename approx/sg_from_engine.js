/* Oriaweld Approximate — ETAP 4.1: adapter wyniku silnika (pick APPROXIMATE/NEEDS_REVIEW, np. A3 blacha gięta) -> SG v0.1 + questions[].
   Nie zmienia silnika. fromEngine(m,o) -> graf|null. m: {size,pick:{name},a3b,nums,status}; o: nadpisania (testy/fixture). */
(function(root){'use strict';
function n(v){v=+v;return v>0&&isFinite(v)?v:0}
function fromEngine(m,o){o=o||{};m=m||{};var pk=(m.pick&&m.pick.name)||o.pick||'',a=m.a3b||o.a3b||null,st=m.status||o.status||'APPROXIMATE';
 if(!/APPROXIMATE|NEEDS_REVIEW/.test(st)&&!o.force)return null;
 var nums=(o.nums||(m.nums||[]).map(function(x){return x.p&&+x.p.value})).filter(n);function has(v){return nums.indexOf(v)>=0}
 var sz=(m.size||o.size||[]).map(n);var W=Math.round(sz[0]),H=Math.round(a&&a.H||sz[1]),t=n(o.t)||4;if(!W||!H)return null;
 function dim(v,isMain){return {value:v,status:has(v)?'confirmed':'estimated',source:has(v)?'ocr':'iso'}}
 var bent=!!a||/gięt/.test(pk),ft=a?a.ft:0,fb=a?a.fb:0,V=a&&a.var?JSON.parse(a.var):{};
 var D=bent?Math.max(ft,fb)+t:t,M=[],Q=[];
 function plate(id,role,geom,plane,outline,off,holes,conf,status,src){M.push({id:id,role:role,geom:geom,a:null,b:null,plate:{plane:plane,outline:outline,thickness:t,offset:off,holes:holes||[],source:has(t)?'ocr':'rule'},
  section:{type:'flat',dims:[t],status:has(t)?'confirmed':'estimated',source:has(t)?'ocr':'rule'},orientation_deg:0,confidence:conf,status:status,sources:[{src:src,w:1}],verify:'pending',view_refs:['v_iso','v_side']})}
 var holes=o.holes||[];
 plate('m_sheet','plate',bent?'bent_plate':'plate','xy',[[0,0],[W,0],[W,H],[0,H]],0,holes,0.8,holes.length?'recognized':'inferred','geometry');
 if(bent){if(ft)plate('m_flange_top','plate','plate','xz',[[0,0],[W,0],[W,ft],[0,ft]],H-t,[],0.55,'estimated','ocr');
  if(fb)plate('m_flange_bot','plate','plate','xz',[[0,0],[W,0],[W,fb],[0,fb]],0,[],0.5,'estimated','ocr');
  if(V.tabs){[0.18,0.5,0.82].forEach(function(f,i){var c=f*W;plate('m_tab'+i,'bracket','plate','xy',[[c-30,-20],[c+30,-20],[c+30,0],[c-30,0]],fb||0,[],0.3,'unknown','rule')});}}
 Q.push({id:'q_type',i18n:bent?'approx.q_type_bent':'approx.q_type_flat',kind:'type',about:'m_sheet',text:bent?'Czy to blacha gięta z kołnierzami (nie płaska płyta)?':'Czy to płaska płyta?',options:['plate','bent_plate'],reason:'status='+st});
 if(bent)Q.push({id:'q_bend',i18n:'approx.q_bend',params:{fb:fb},kind:'orientation',about:'m_flange_bot',text:'W którą stronę gięty jest dolny kołnierz '+fb+' mm (45°)? Kierunek zgadnięty z izometrii.',reason:'A3 wariant '+(a&&a.var||'?')});
 if(V.tabs)Q.push({id:'q_tabs',i18n:'approx.q_tabs',kind:'position',about:'m_tab0',text:'Gdzie są zaczepy pod kołnierzem dolnym? Pozycje zgadnięte (wymiary 124/160 nieprzypisane).',reason:'rzut z dołu niewykryty'});
 var r16=a&&a.r16||null;if(bent&&r16){if(!/^rysunek/.test(r16.src||''))Q.push({id:'q_r16',i18n:'approx.q_r16_est',params:{R:r16.R},kind:'depth',about:'m_flange_top',text:'Promień gięcia szacowany na R'+r16.R+' (brak w OCR). Podaj promień gięcia w mm.',reason:'R gięcia estimated'});}
 else if(bent&&!has(16))0;else if(bent)Q.push({id:'q_r16',i18n:'approx.q_r16',kind:'exists',about:'m_flange_top',text:'Gięcie R16 jest modelowane jako ostre. Czy to wystarczy?',reason:'R16 z OCR, niemodelowane'});
 var od={width:dim(W),height:dim(H),depth:{value:D,status:'estimated',source:'rule'}};
 /* ETAP 4.4: OCR H 5↔6 (np. 560 czytane jako 660) – TYLKO podpowiedź za flagą, nigdy confirmed */
 var hf=o.ocrHfix||(typeof window!=='undefined'&&(window.__ocrHfix||/[#&]ocrh=1/.test((window.location&&window.location.hash)||'')));
 if(hf&&od.height.status!=='confirmed'){var hv=nums.filter(function(v){return Math.abs(v-(H+100))<=1||Math.abs(v-(H-100))<=1}).sort(function(a,b){return Math.min(Math.abs(a-H-100),Math.abs(a-H+100))-Math.min(Math.abs(b-H-100),Math.abs(b-H+100))})[0];if(hv!=null)od.height.ocr_hint={read:hv,fix:String(hv)+'->'+H,why:'cyfra 5/6 (OCR), H z ISO/A3',flag:'ocrh',status:'NEEDS_REVIEW'};}
 /* ETAP 4.4: H estimated -> zawsze jawne pytanie (priorytet nad q_r16/q_depth przy limicie 5) */
 if(od.height.status!=='confirmed'){var hh=od.height.ocr_hint;Q.splice(1,0,{id:'q_height',i18n:hh?'approx.q_height_ocr':'approx.q_height',params:{H:H,read:hh&&hh.read},kind:'depth',about:'overall.height',
  text:hh?'Podaj całkowitą wysokość (H) w mm. OCR odczytał '+hh.read+', z izometrii wynika ok. '+H+' – czy to '+H+'?':'Podaj całkowitą wysokość (H) w mm. Szacunek '+H+' (z izometrii, brak w OCR).',reason:'H estimated'+(hh?' · OCR '+hh.read:'')});
  if(Q.length>=5){var ir=Q.map(function(q){return q.id}).indexOf('q_r16');if(ir>=0)Q.splice(ir,1);}}
 if(od.depth.status!=='confirmed'&&Q.length<5)Q.push({id:'q_depth',i18n:'approx.q_depth',params:{D:D},kind:'depth',about:'overall.depth',text:'Podaj całkowitą głębokość (D) w mm. Szacunek '+D+'.',reason:'D z kołnierzy'});
 /* t978: grubość domyślna (brak o.t i brak w OCR) → pytanie, najniższy priorytet (nie wypiera innych). */
 var _pm=M.filter(function(x){return x.plate})[0];if(_pm&&!n(o.t)&&!has(t)&&Q.length<5)Q.push({id:'q_thick',i18n:'approx.q_thick',params:{t:t},kind:'depth',about:_pm.id,text:'Grubość blachy przyjęta '+t+' mm (brak w OCR). Podaj grubość w mm.',reason:'t domyślne'});
 return {schema_version:'0.1',mode:'approximate',units:'mm',drawing:{id:o.id||m.file||'engine',views:[{id:'v_iso',kind:'iso'},{id:'v_side',kind:'side'}]},
  coordinate_system:{x:'width',y:'height',z:'depth',origin:'left-bottom-front'},overall_dimensions:od,
  model_type:{value:bent?'blacha gięta z oknami':'płyta',confidence:0.5,source:'iso',alternatives:bent?['płyta z oknami']:[]},nodes:[],members:M,relations:[],conflicts:[],questions:Q.slice(0,5),decisions:[],
  provenance:{engine:'sg_from_engine-etap4.1',vlm:null,flags:{approx:1},pick:pk,status:st,iou:m.pick&&m.pick.iou||o.iou||null}}}
/* sg_p2: zastosuj decyzję (shape OriaSG.decision z action/role/geom; q może być "overall.<k>") -> nowy graf. */
function applyDecision(g,d){var S=root.OriaSG,G=JSON.parse(JSON.stringify(g));var prev={};
 var mo=/^overall\.(width|height|depth)$/.exec(d.q),q=(G.questions||[]).filter(function(x){return x.id===d.q})[0],k=mo?mo[1]:(q&&/^overall\./.test(q.about)?q.about.slice(8):null);
 if(k){prev[k]=G.overall_dimensions[k];if(d.action!=='reject'&&d.action!=='leave_unknown'&&n(d.answer))G.overall_dimensions[k]={value:n(d.answer),status:'confirmed',source:'user_p2'};}
 if(d.q==='q_thick'&&d.action!=='reject'&&d.action!=='leave_unknown'&&n(d.answer)){var tv=n(d.answer);prev.thickness=[];(G.members||[]).forEach(function(x){if(x.plate){prev.thickness.push(x.plate.thickness);x.plate.thickness=tv;x.plate.source='user_p2';if(x.section){x.section.dims=[tv];x.section.status='confirmed';x.section.source='user_p2'}}})}
 var mem=q&&d.q!=='q_thick'&&(G.members||[]).filter(function(x){return x.id===q.about})[0];
 if(mem){prev.status=mem.status;prev.verify=mem.verify;var A=d.action||(d.answer==='yes'?'confirm':d.answer==='no'?'reject':'leave_unknown');
  if(A==='confirm'){mem.status='confirmed';mem.verify='confirmed'}else if(A==='reject'){mem.verify='rejected'}else if(A==='leave_unknown'){mem.verify='left_unknown';mem.status='unknown'}
  else if(A==='change_type'){if(d.role)mem.role=d.role;if(d.geom)mem.geom=d.geom;mem.status='confirmed';mem.verify='changed'}
  else if(A==='move'||A==='rotate'){prev.xform=mem.xform?JSON.parse(JSON.stringify(mem.xform)):null;var X=mem.xform||{t:[0,0,0],rz:0},dl=d.delta;
   if(A==='move'){var v=Array.isArray(dl)?dl:dl&&typeof dl==='object'?[dl.dx,dl.dy,dl.dz]:[0,0,0];X.t=[0,1,2].map(function(i){return (X.t[i]||0)+(+v[i]||0)});}
   else{var r=+(dl&&typeof dl==='object'?dl.deg:dl)||0;X.rz=((X.rz||0)+r)%360;mem.orientation_deg=((mem.orientation_deg||0)+r)%360;}
   mem.xform=X;mem.status='confirmed';mem.verify='changed';}}
 var dd=S.decision(d.q,d.answer,prev,d);G.decisions=(G.decisions||[]).concat([dd]);return G;}
/* ETAP 4.3: przebudowa P2 – decyzje -> graf + pozostałe pytania (odpowiedziane znikają z questions[], trafiają do answered[]). */
function rebuildP2(g,ds){var G=g;(ds||[]).forEach(function(d){G=applyDecision(G,d)});var done={};(G.decisions||[]).forEach(function(d){done[d.q]=1});
 var all=(G.questions||[]).concat(G.answered||[]);G.answered=all.filter(function(q){return done[q.id]});G.questions=all.filter(function(q){return !done[q.id]});
 var od=G.overall_dimensions||{};['width','height','depth'].forEach(function(k){var x=od[k];if(x&&x.status==='confirmed')G.questions=G.questions.filter(function(q){return q.about!=='overall.'+k})});
 var I=root.OriaSGI18nPL;if(I)G.questions.forEach(function(q){q.text=I.text(q)||q.text});
 G.p2={pending:G.questions.length,answered:G.answered.length,done:G.questions.length===0};return G;}
/* ETAP 4.2: otwory G0 z widoku silnika (px, Y w dół) -> mm (Y w górę), ta sama skala co buildSheetG0 (W/szer.obrysu). NEEDS_REVIEW: bez g0strip/cutBars. */
function holesFromCands(m){var C=((m&&m.cands)||[]).filter(function(c){return c&&(c.g0||/G0/.test(c.name||''))&&c.geo&&c.geo.parameters&&c.geo.parameters.shapes}).sort(function(a,b){return (b.g0h||0)-(a.g0h||0)});var c=C[0];if(!c)return [];var S=c.geo.parameters.shapes;S=Array.isArray(S)?S:[S];var out=[];
 S.forEach(function(sh){(sh.holes||[]).forEach(function(h){var P=(h.getPoints?h.getPoints():[]).map(function(q){return [Math.round(q.x*10)/10,Math.round(q.y*10)/10]});if(P.length>=3)out.push(P)})});return out;}
function holesFromViews(m,W){var hc=holesFromCands(m);if(hc.length)return hc;var vs=((m&&m.views)||[]).filter(function(v){return v.outlinePolygon&&v.outlinePolygon.length>=3&&v.holes&&v.holes.length}).sort(function(a,b){return b.holes.length-a.holes.length});var v=vs[0];if(!v||!(W>0))return [];
 var O=v.outlinePolygon,xs=O.map(function(p){return p[0]}),x0=Math.min.apply(0,xs),w=Math.max.apply(0,xs)-x0,y1=Math.max.apply(0,O.map(function(p){return p[1]}));if(!(w>0))return [];var s=W/w;
 return v.holes.filter(function(h){return Array.isArray(h)&&h.length>=3}).map(function(h){return h.map(function(q){return [Math.round((q[0]-x0)*s*10)/10,Math.round((y1-q[1])*s*10)/10]})});}
var API={fromEngine:fromEngine,applyDecision:applyDecision,rebuildP2:rebuildP2,holesFromViews:holesFromViews};root.OriaSGFromEngine=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:this);
