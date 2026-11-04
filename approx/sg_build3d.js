/* Oriaweld Approximate — ETAP 2: Scene Graph -> THREE.Group. Własne kopie prymitywów (bar/plate), app_main.js nietknięty.
   API: OriaSGBuild.build(graph,{THREE}) -> {group, meshes, skipped[], geo(merged BufferGeometry|null)} */
(function(root){
'use strict';
var DEF_SEC={RHS:[60,40],SHS:[50,50],CHS:[48,48],I:[100,55],U:[80,45],L:[50,50],flat:[40,8],unknown:[40,40]};
var COL={recognized:0x4a90d9,inferred:0x7fa7c9,estimated:0xc9a14a,unknown:0x999999,confirmed:0x3aa655};
function secWH(m){var s=m.section||{};if(Array.isArray(s.dims)&&s.dims.length>=1){var w=+s.dims[0],h=+(s.dims[1]!=null?s.dims[1]:s.dims[0]);if(w>0&&h>0)return [w,h];}
 return DEF_SEC[s.type]||DEF_SEC.unknown;}
function build(g,opt){opt=opt||{};var T=opt.THREE||root.THREE;if(!T)throw new Error('OriaSGBuild: brak THREE');
 var grp=new T.Group();grp.name='approx-sg';grp.userData.sgDrawing=g&&g.drawing&&g.drawing.id;
 var N={},skipped=[],geos=[];(g.nodes||[]).forEach(function(n){N[n.id]=n.pos;});
 function mat(m){return new T.MeshStandardMaterial({color:COL[m.status]||COL.unknown,metalness:0.3,roughness:0.6,transparent:m.status==='unknown',opacity:m.status==='unknown'?0.55:1});}
 function add(geo,m){var me=new T.Mesh(geo,mat(m));me.userData.sgId=m.id;me.userData.sgRole=m.role;me.userData.sgStatus=m.status;grp.add(me);geos.push(geo);}
 // bar: prostopadłościan / walec wzdłuż a->b (dowolny kierunek)
 function bar(a,b,w,h,round){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),d=B.clone().sub(A),L=d.length();if(L<1e-6)return null;
  var geo=round?new T.CylinderGeometry(w/2,w/2,L,24):new T.BoxGeometry(w,L,h);
  var q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());geo.applyMatrix4(new T.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5),q,new T.Vector3(1,1,1)));return geo;}
 // plate: outline 2D [[u,v]...] w płaszczyźnie plane, offset = współrzędna osi normalnej, grubość wzdłuż normalnej
 function plate(p){var o=p.outline,t=+p.thickness||(p.thickness_default||5);if(!Array.isArray(o)||o.length<3)return null;
  var sh=new T.Shape();o.forEach(function(q,i){i?sh.lineTo(q[0],q[1]):sh.moveTo(q[0],q[1]);});
  (p.holes||[]).forEach(function(hh){if(!Array.isArray(hh)||hh.length<3)return;var pa=new T.Path();hh.forEach(function(q,i){i?pa.lineTo(q[0],q[1]):pa.moveTo(q[0],q[1]);});sh.holes.push(pa);});
  var geo=new T.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false}),off=+p.offset||0;
  if(p.plane==='xy')geo.translate(0,0,off);                    // u=x v=y, grubość +z
  else if(p.plane==='xz'){geo.rotateX(Math.PI/2);geo.translate(0,off+t,0);} // u=x v=z, grubość w y
  else if(p.plane==='yz'){geo.applyMatrix4(new T.Matrix4().set(0,0,1,0, 0,1,0,0, 1,0,0,0, 0,0,0,1));geo.translate(off,0,0);} // u=z v=y, grubość +x
  return geo;}
 (g.members||[]).forEach(function(m){var geo=null;try{
  if(m.geom==='bar'||m.geom==='tube'){var a=N[m.a],b=N[m.b];if(!a||!b){skipped.push(m.id+': brak węzła');return;}var wh=secWH(m);
   geo=bar(a,b,wh[0],wh[1],m.geom==='tube'||(m.section&&m.section.type==='CHS'));}
  else if(m.geom==='disc'){var c=N[m.a],e=N[m.b];var r=(m.disc&&m.disc.r)||secWH(m)[0]/2;if(c&&e)geo=bar(c,e,2*r,2*r,true);}
  else if(m.geom==='plate'||m.geom==='bent_plate'){if(m.plate)geo=plate(m.plate);}
 }catch(err){skipped.push(m.id+': '+err.message);return;}
  if(geo&&m.xform){try{var X=m.xform;if(X.rz){geo.computeBoundingBox();var c=new T.Vector3();geo.boundingBox.getCenter(c);geo.translate(-c.x,-c.y,-c.z);geo.rotateZ(X.rz*Math.PI/180);geo.translate(c.x,c.y,c.z);}if(X.t)geo.translate(X.t[0]||0,X.t[1]||0,X.t[2]||0);}catch(e){skipped.push(m.id+': xform '+e.message)}} // ETAP 4.3 move/rotate
  if(geo)add(geo,m);else skipped.push(m.id+': brak geometrii');});
 var merged=null;try{var MU=T.BufferGeometryUtils||root.BufferGeometryUtils;if(MU&&geos.length)merged=MU.mergeBufferGeometries(geos.map(function(x){return x.index?x.toNonIndexed():x;}),false);}catch(e){}
 return {group:grp,meshes:grp.children.length,skipped:skipped,geo:merged};}
var API={build:build,DEF_SEC:DEF_SEC};root.OriaSGBuild=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
