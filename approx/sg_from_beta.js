/* Oriaweld Approximate — ETAP 3: adapter wyniku BETA (isoFrame / ramy) -> Scene Graph v0.1.
   NIE zmienia funkcji BETA. Wejście: m (AUTO.last) + window.__isoMembers {bars,posts,u} + window.__p2pre {gab,H,W,D}.
   fromBeta(m, o?) -> graf | null. o pozwala podać dane wprost (testy): {W,H,D,t,u,id,dimSrc}. */
(function(root){'use strict';
function n(v){v=+v;return v>0&&isFinite(v)?v:0}
function fromBeta(m,o){o=o||{};var w=root.window||root,p=w.__p2pre||{},im=o.iso||w.__isoMembers||{};
 var sz=(m&&m.size)||[],pk=m&&m.pick&&m.pick.name||'',frame=o.force||(m&&m.kind==='frame')||/rama/.test(pk)||im.bars>0;if(!frame)return null;
 function dim(k,i){var u=n(o[k])||n(p[k]);if(u)return{value:Math.round(u),status:o.dimSrc==='user_p2'||n(p[k])?'confirmed':'estimated',source:n(p[k])||o.dimSrc==='user_p2'?'user_p2':'iso'};
  var s=n(sz[i]);return s?{value:Math.round(s),status:'estimated',source:'iso'}:null}
 var W=dim('W',0),H=dim('H',1),D=dim('D',2);if(!W||!H)return null;if(!D)D={value:Math.round(0.6*W.value),status:'estimated',source:'rule'};
 var t=n(o.t)||Math.max(20,Math.round(0.02*Math.max(W.value,H.value,D.value)/5)*5),h=t/2,X=[h,W.value-h],Z=[h,D.value-h],Y=[h,H.value-h];
 var N=[],M=[],Q=[],sec={type:'SHS',dims:[t,t],status:'estimated',source:'rule'};
 function nd(id,x,y,z){N.push({id:id,pos:[Math.round(x),Math.round(y),Math.round(z)],status:'inferred'});return id}
 function mb(id,role,a,b,src,c){M.push({id:id,role:role,geom:'bar',a:a,b:b,plate:null,section:sec,orientation_deg:0,confidence:c,status:'inferred',sources:[{src:src,w:1}],verify:'pending',view_refs:['v_iso']})}
 var C=[[X[0],Z[0]],[X[1],Z[0]],[X[1],Z[1]],[X[0],Z[1]]];
 C.forEach(function(c,i){nd('n_b'+i,c[0],Y[0],c[1]);nd('n_t'+i,c[0],Y[1],c[1]);mb('m_col'+i,'column','n_b'+i,'n_t'+i,'iso',0.75)});
 ['b','t'].forEach(function(L){for(var i=0;i<4;i++)mb('m_'+L+'_'+i,'beam','n_'+L+i,'n_'+L+((i+1)%4),'iso',0.7)});
 var u=(o.u||im.u||[]).slice();if(W.value>1.5*H.value&&u.indexOf(0.5)<0){u.push(0.5);}
 u.forEach(function(k,j){var x=X[0]+k*(X[1]-X[0]);[[Z[0],'f'],[Z[1],'r']].forEach(function(z){if(z[1]==='r'&&!(W.value>1.5*H.value&&k===0.5))return;
  var a=nd('n_p'+j+z[1]+'b',x,Y[0],z[0]),b=nd('n_p'+j+z[1]+'t',x,Y[1],z[0]);mb('m_post'+j+z[1],'column',a,b,k===0.5&&W.value>1.5*H.value?'rule':'iso',0.55)})});
 var Qs=[{id:'q_depth',kind:'depth',about:'overall.depth',text:'Podaj głębokość ramy (D) w mm.'},{id:'q_section',kind:'type',about:'m_col0',text:'Jaki profil? (szac. '+t+'×'+t+')'}];
 if(D.status==='confirmed')Qs.shift();
 return {schema_version:'0.1',mode:'approximate',units:'mm',drawing:{id:o.id||(m&&m.file)||'beta',views:[{id:'v_iso',kind:'iso'}]},
  coordinate_system:{x:'width',y:'height',z:'depth',origin:'left-bottom-front'},overall_dimensions:{width:W,height:H,depth:D},
  model_type:{value:'rama przestrzenna z profili',confidence:0.6,source:'iso',alternatives:[]},nodes:N,members:M,relations:[],conflicts:[],questions:Qs,decisions:[],
  provenance:{engine:'sg_from_beta-etap3',vlm:null,flags:{approx:1},author:'adapter isoFrame',iso:{bars:im.bars||null,posts:im.posts||0,u:u}}}}
var API={fromBeta:fromBeta};root.OriaSGFromBeta=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:this);
