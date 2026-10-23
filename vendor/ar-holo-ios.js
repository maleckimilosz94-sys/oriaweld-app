/* M11: półprzezroczysty cyjanowy hologram w USDZ (Quick Look). Podmienia materiał holo_iOS_czesc tuż przed eksportem. */
(function(){var X=THREE.USDZExporter;if(!X||X.prototype.__m11)return;var P=X.prototype.parse;X.prototype.__m11=1;
X.prototype.parse=function(sc,o){var cache={};sc.traverse(function(m){if(!m.isMesh||!m.material)return;var n=m.material.name||'';
 if(n=='holo_iOS_czesc'){m.material=cache.p||(cache.p=Object.assign(new THREE.MeshStandardMaterial({color:0x22d3ee,emissive:0x0891b2,emissiveIntensity:0.5,metalness:0,roughness:0.6,transparent:true,opacity:0.55}),{name:'holo_iOS_czesc_tr'}));}
 else if(m.material.isMeshBasicMaterial&&m.material.map){var B=m.material;m.material=Object.assign(new THREE.MeshStandardMaterial({map:B.map,emissiveMap:B.map,emissive:0xffffff,metalness:0,roughness:1,alphaTest:0.5}),{name:B.name||'etykieta'});} // etykiety wymiarów: USDZExporter eksportuje tylko MeshStandardMaterial
 else if(n=='holo_iOS_krawedz'){m.material=cache.e||(cache.e=Object.assign(new THREE.MeshStandardMaterial({color:0x67e8f9,emissive:0x22d3ee,emissiveIntensity:0.5,metalness:0,roughness:0.5}),{name:'holo_iOS_krawedz_c'}));}});
 return P.call(this,sc,o)};
/* kompaktowy zapis geometrii do hasha (0,1 mm, indeksy, delta) */
window.__arPack=function(w,style,mm){var parts=[];w.children.forEach(function(o){if(!o.isMesh||!/^czesc_/.test(o.name))return;var p=o.geometry.attributes.position,ix=o.geometry.index,map={},V=[],I=[],n=0;
 for(var i=0;i<p.count;i++){var x=Math.round(p.getX(i)*1e4),y=Math.round(p.getY(i)*1e4),z=Math.round(p.getZ(i)*1e4),k=x+','+y+','+z;if(map[k]==null){map[k]=n++;V.push(x,y,z)}I.push(map[k])}
 if(ix){var J=[];for(var j=0;j<ix.count;j++)J.push(I[ix.getX(j)]);I=J}
 for(var a=V.length-1;a>=3;a--)V[a]-=V[a-3];for(var b=I.length-1;b>=1;b--)I[b]-=I[b-1];parts.push([V,I])});
 return LZString.compressToEncodedURIComponent(JSON.stringify({v:1,s:style,mm:mm,p:parts}))};
window.__arUnpack=function(h){var d=JSON.parse(LZString.decompressFromEncodedURIComponent(h));if(!d||d.v!==1)throw new Error('bad');
 d.g=d.p.map(function(q){var V=q[0].slice(),I=q[1].slice();for(var a=3;a<V.length;a++)V[a]+=V[a-3];for(var b=1;b<I.length;b++)I[b]+=I[b-1];
  var P=new Float32Array(I.length*3);for(var i=0;i<I.length;i++){P[i*3]=V[I[i]*3]/1e4;P[i*3+1]=V[I[i]*3+1]/1e4;P[i*3+2]=V[I[i]*3+2]/1e4}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.computeVertexNormals();return g});return d};
})();
