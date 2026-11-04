/* Oriaweld Approximate — Spatial Scene Graph schema v0.1 (ETAP 1). Bez zależności. */
(function(root){
'use strict';
var S={
 VERSION:'0.1', MODE:'approximate', UNITS:'mm',
 STATUS:['recognized','inferred','estimated','unknown','confirmed'],
 DIM_STATUS:['confirmed','estimated','inferred','unknown'],
 VERIFY:['pending','confirmed','rejected','changed','left_unknown'],
 ROLES:['column','beam','brace','leg','plate','bracket','rib','tube','disc','aux'],
 GEOM:['bar','plate','tube','disc','bent_plate'],
 SECTION:['RHS','SHS','CHS','I','U','L','flat','unknown'],
 SOURCES:['vlm','opencv','f2','ocr','iso','user_p2','rule','geometry','default','user'],
 VIEW_KINDS:['iso','front','side','top','section','unknown'],
 RELATIONS:['connected','symmetric_to','copy_of','behind','on_top_of'],
 CONFLICTS:['dim_vs_proportion','vlm_vs_ocr','view_mismatch'],
 QUESTION_KINDS:['type','position','copy','exists','depth','orientation'],
 ACTIONS:['confirm','reject','change_type','move','rotate','leave_unknown'],
 PLANES:['xy','yz','xz'],
 BBOX_TOL:0.05,
 COORDS:{x:'width',y:'height',z:'depth',origin:'left-bottom-front'}
};
function dim(){return {value:null,status:'unknown',source:null};}
S.emptyGraph=function(drawingId){return {
 schema_version:S.VERSION,mode:S.MODE,units:S.UNITS,
 drawing:{id:drawingId||null,views:[]},
 coordinate_system:JSON.parse(JSON.stringify(S.COORDS)),
 overall_dimensions:{width:dim(),height:dim(),depth:dim()},
 model_type:{value:null,confidence:0,source:null,alternatives:[]},
 nodes:[],members:[],relations:[],conflicts:[],questions:[],decisions:[],
 provenance:{engine:'approx-'+S.VERSION,vlm:null,flags:{approx:1}}};};
S.node=function(id,pos,status){return {id:id,pos:pos,status:status||'inferred'};};
S.member=function(id,role,geom,a,b,o){o=o||{};return {id:id,role:role,geom:geom,a:a||null,b:b||null,plate:o.plate||null,
 section:o.section||{type:'unknown',dims:null,status:'unknown',source:null},orientation_deg:o.orientation_deg||0,
 confidence:o.confidence==null?0:o.confidence,status:o.status||'unknown',sources:o.sources||[],verify:o.verify||'pending',view_refs:o.view_refs||[]};};
S.decision=function(q,answer,prev,extra){
 extra=extra||{};
 var d={q:q,answer:answer,by:extra.by||'user',ts:extra.ts||new Date().toISOString(),prev:prev||{}};
 if(extra.action)d.action=extra.action;
 if(extra.role!=null)d.role=extra.role;
 if(extra.geom!=null)d.geom=extra.geom;
 if(extra.delta!=null)d.delta=extra.delta;
 return d;};
/** Syntetyczne id decyzji dla kafelków H/W/D bez osobnego pytania w questions[]. */
S.overallQ=function(axis){return 'overall.'+axis;};
root.OriaSG=S;
if(typeof module!=='undefined'&&module.exports)module.exports=S;
})(typeof window!=='undefined'?window:globalThis);
