/* Oriaweld Approximate — walidator Scene Graph v0.1 (ETAP 1). Czysty JS, bez zależności.
   validate(g, opts) -> {ok, errors[], warnings[]}; opts.prev = poprzedni graf (kontrola confirmed). */
(function(root){
'use strict';
var S=root.OriaSG||(typeof require!=='undefined'?require('./sg_schema.js'):null);
function isNum(v){return typeof v==='number'&&isFinite(v);}
function validate(g,opts){
 opts=opts||{};var E=[],W=[];
 function crit(c,m){E.push({level:'critical',code:c,msg:m});}
 function warn(c,m){W.push({level:'warning',code:c,msg:m});}
 if(!g||typeof g!=='object'){crit('no_graph','brak grafu');return {ok:false,errors:E,warnings:W};}
 if(g.schema_version!==S.VERSION)warn('version','schema_version='+g.schema_version);
 if(g.units!=='mm')crit('units','units musi być "mm" (jest '+g.units+')');
 var ids={};
 function reg(id,kind){if(!id){crit('no_id',kind+' bez id');return;}if(ids[id])crit('dup_id','zduplikowane id '+id);ids[id]=kind;}
 ['nodes','members','relations','conflicts','questions','decisions'].forEach(function(k){if(g[k]!=null&&!Array.isArray(g[k]))crit('type',k+' musi być tablicą');});
 var nodes=g.nodes||[],mem=g.members||[];
 (g.drawing&&g.drawing.views||[]).forEach(function(v){reg(v.id,'view');if(S.VIEW_KINDS.indexOf(v.kind)<0)warn('view_kind',v.id+': kind '+v.kind);});
 nodes.forEach(function(n){reg(n.id,'node');});
 mem.forEach(function(m){reg(m.id,'member');});
 (g.conflicts||[]).forEach(function(c){reg(c.id,'conflict');});
 (g.questions||[]).concat(g.answered||[]).forEach(function(q){reg(q.id,'question');}); /* 4.3: answered[] po P2 */
 function conf(x,where){if(x==null)return;if(!isNum(x)||x<0||x>1)crit('confidence',where+': confidence poza [0,1] ('+x+')');}
 function st(s,where,list){if(s!=null&&(list||S.STATUS).indexOf(s)<0)crit('status',where+': nieznany status '+s);}
 // wymiary gabarytowe: liczba wymaga source
 var od=g.overall_dimensions||{},box={};
 ['width','height','depth'].forEach(function(k){var d=od[k];if(!d)return;st(d.status,'overall.'+k,S.DIM_STATUS);
  if(d.value!=null){if(!isNum(d.value)||d.value<=0)crit('dim_value','overall.'+k+': zła wartość');else if(!d.source)crit('no_source','overall.'+k+': liczba bez source');else box[k]=d.value;}});
 if(g.model_type){conf(g.model_type.confidence,'model_type');if(g.model_type.value!=null&&!g.model_type.source)crit('no_source','model_type bez source');}
 // węzły + obwiednia ±5%
 var t=S.BBOX_TOL,lim={x:box.width,y:box.height,z:box.depth};
 nodes.forEach(function(n){st(n.status,n.id);
  if(!Array.isArray(n.pos)||n.pos.length!==3||!n.pos.every(isNum)){crit('pos',n.id+': pos musi być [x,y,z] mm');return;}
  ['x','y','z'].forEach(function(a,i){var L=lim[a];if(L==null)return;var v=n.pos[i];if(v<-L*t||v>L*(1+t))crit('bbox',n.id+': '+a+'='+v+' poza obwiednią 0..'+L+' ±5%');});});
 // members
 mem.forEach(function(m){var w='member '+m.id;
  if(S.ROLES.indexOf(m.role)<0)crit('role',w+': rola '+m.role);
  if(S.GEOM.indexOf(m.geom)<0)crit('geom',w+': geom '+m.geom);
  st(m.status,w);conf(m.confidence,w);
  if(m.verify!=null&&S.VERIFY.indexOf(m.verify)<0)crit('verify',w+': verify '+m.verify);
  ['a','b'].forEach(function(k){if(m[k]!=null&&ids[m[k]]!=='node')crit('ref',w+': '+k+'='+m[k]+' nie jest węzłem');});
  if((m.geom==='bar'||m.geom==='tube')&&(m.a==null||m.b==null))crit('ref',w+': '+m.geom+' wymaga a i b');
  if(m.geom==='plate'||m.geom==='bent_plate'){if(!m.plate)warn('plate',w+': brak plate{}');else{if(S.PLANES.indexOf(m.plate.plane)<0)crit('plane',w+': plane '+m.plate.plane);if(m.plate.thickness!=null&&!m.plate.source)crit('no_source',w+': plate.thickness bez source');}}
  var sec=m.section;if(sec){if(S.SECTION.indexOf(sec.type)<0)crit('section',w+': przekrój '+sec.type);st(sec.status,w+'.section',S.DIM_STATUS);
   if(Array.isArray(sec.dims)&&sec.dims.length&&!sec.source)crit('no_source',w+': section.dims bez source');}
  if(isNum(m.orientation_deg)&&m.orientation_deg!==0&&!m.orientation_source&&!(m.sources&&m.sources.length))warn('no_source',w+': orientation bez źródła');
  (m.sources||[]).forEach(function(s){if(S.SOURCES.indexOf(s.src)<0)crit('source',w+': źródło '+s.src);if(s.w!=null&&(!isNum(s.w)||s.w<0||s.w>1))crit('weight',w+': waga źródła poza [0,1]');});
  (m.view_refs||[]).forEach(function(v){if(ids[v]!=='view')warn('view_ref',w+': view '+v+' nie istnieje');});});
 (g.relations||[]).forEach(function(r,i){var w='relation#'+i;if(S.RELATIONS.indexOf(r.type)<0)crit('rel_type',w+': typ '+r.type);
  ['a','b'].forEach(function(k){if(!ids[r[k]]||ids[r[k]]==='question')crit('ref',w+': '+k+'='+r[k]+' nie istnieje');});st(r.status,w);conf(r.confidence,w);});
 (g.conflicts||[]).forEach(function(c){if(S.CONFLICTS.indexOf(c.kind)<0)warn('conflict_kind',c.id+': '+c.kind);});
 (g.questions||[]).forEach(function(q){if(S.QUESTION_KINDS.indexOf(q.kind)<0)crit('q_kind',q.id+': kind '+q.kind);
  if(q.about&&!ids[q.about]&&!/^overall\./.test(q.about))crit('ref',q.id+': about='+q.about+' nie istnieje');});
 if((g.questions||[]).length>5)warn('q_limit','więcej niż 5 pytań P2');
 (g.decisions||[]).forEach(function(d,i){
  var syn=/^overall\.(width|height|depth)$/.test(d.q||'');
  if(ids[d.q]!=='question'&&!syn)crit('ref','decision#'+i+': q='+d.q+' nie istnieje');
  if(d.action!=null&&S.ACTIONS.indexOf(d.action)<0)crit('action','decision#'+i+': action='+d.action);
  if(d.action==='change_type'){
   if(d.role!=null&&S.ROLES.indexOf(d.role)<0)crit('role','decision#'+i+': role='+d.role);
   if(d.geom!=null&&S.GEOM.indexOf(d.geom)<0)crit('geom','decision#'+i+': geom='+d.geom);}
 });
 // confirmed nie może być nadpisane poza decisions
 var p=opts.prev;if(p&&p.overall_dimensions){var dec=g.decisions||[];
  ['width','height','depth'].forEach(function(k){var a=p.overall_dimensions[k],b=od[k];if(!a||a.status!=='confirmed')return;
   if(!b||b.value!==a.value||b.status!=='confirmed'){var ok=dec.some(function(d){if(d.q==='overall.'+k)return true;var q=(g.questions||[]).filter(function(x){return x.id===d.q})[0];return q&&q.about==='overall.'+k;});
    if(!ok)crit('confirmed_overwrite','overall.'+k+': confirmed '+a.value+' nadpisane bez decisions');}});}
 return {ok:E.length===0,errors:E,warnings:W};
}
var V={validate:validate};
root.OriaSGValidate=V;if(root.OriaSG)root.OriaSG.validate=validate;
if(typeof module!=='undefined'&&module.exports)module.exports=V;
})(typeof window!=='undefined'?window:globalThis);
