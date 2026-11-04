/* Kolano rury + 2 kołnierze kwadratowe z otworami (ISO reference). Czyste THREE, bez zależności.
 P={D:290,d:210,R:260,L1:100,L2:100,F:360,tf:50,rc:20,pitch:260,dh:30,dcb:60,hcb:10,nh:4} (mm). Oś: wlot w górę (+Y), wylot w +X. */
(function(root){
function build(THREE,P){
 var S=[],add=function(g){S.push(g.index?g.toNonIndexed():g)};
 var ro=P.D/2,ri=P.d/2,R=P.R,L1=P.L1,L2=P.L2;
 // oś: kołnierz górny (twarz) na y=yTop; prosty odcinek w dół L1, łuk R do poziomu, prosty L2 w +X
 var yA=0,path=new THREE.CurvePath();
 var p0=new THREE.Vector3(0,L1+R,0),p1=new THREE.Vector3(0,R,0);path.add(new THREE.LineCurve3(p0,p1));
 var arc=new THREE.Curve();arc.getPoint=function(t){var a=t*Math.PI/2;return new THREE.Vector3(R-R*Math.cos(a),R-R*Math.sin(a),0)};path.add(arc);
 var p2=new THREE.Vector3(R,0,0),p3=new THREE.Vector3(R+L2,0,0);path.add(new THREE.LineCurve3(p2,p3));
 add(new THREE.TubeGeometry(path,P.ts||96,ro,P.rs||48,false));if(!P.noInner)add(new THREE.TubeGeometry(path,96,ri,48,false));
 function flange(){var h=P.F/2,r=P.rc,s=new THREE.Shape();s.moveTo(-h+r,-h);s.lineTo(h-r,-h);s.absarc(h-r,-h+r,r,-Math.PI/2,0);s.lineTo(h,h-r);s.absarc(h-r,h-r,r,0,Math.PI/2);s.lineTo(-h+r,h);s.absarc(-h+r,h-r,r,Math.PI/2,Math.PI);s.lineTo(-h,-h+r);s.absarc(-h+r,-h+r,r,Math.PI,1.5*Math.PI);
  var hb=new THREE.Path();hb.absarc(0,0,ri,0,2*Math.PI,true);s.holes.push(hb);var q=P.pitch/2,C=[[q,q],[-q,q],[-q,-q],[q,-q]];
  C.forEach(function(c){var hp=new THREE.Path();hp.absarc(c[0],c[1],P.dh/2,0,2*Math.PI,true);s.holes.push(hp)});
  var g=new THREE.ExtrudeGeometry(s,{depth:P.tf-P.hcb,bevelEnabled:false,curveSegments:24});
  var s2=new THREE.Shape();s2.moveTo(-h+r,-h);s2.lineTo(h-r,-h);s2.absarc(h-r,-h+r,r,-Math.PI/2,0);s2.lineTo(h,h-r);s2.absarc(h-r,h-r,r,0,Math.PI/2);s2.lineTo(-h+r,h);s2.absarc(-h+r,h-r,r,Math.PI/2,Math.PI);s2.lineTo(-h,-h+r);s2.absarc(-h+r,-h+r,r,Math.PI,1.5*Math.PI);
  var hb2=new THREE.Path();hb2.absarc(0,0,ri,0,2*Math.PI,true);s2.holes.push(hb2);C.forEach(function(c){var hp=new THREE.Path();hp.absarc(c[0],c[1],P.dcb/2,0,2*Math.PI,true);s2.holes.push(hp)});
  var g2=new THREE.ExtrudeGeometry(s2,{depth:P.hcb,bevelEnabled:false,curveSegments:24});g2.translate(0,0,P.tf-P.hcb);
  return [g,g2]}
 // kołnierz górny: płaszczyzna XZ, od y=L1+R-tf do L1+R (pogłębienia na górze)
 flange().forEach(function(g){g.rotateX(-Math.PI/2);g.translate(0,L1+R-P.tf,0);add(g)});
 // kołnierz boczny: płaszczyzna YZ, x od R+L2-tf do R+L2, pogłębienia na zewnątrz (+X)
 flange().forEach(function(g){g.rotateY(Math.PI/2);g.translate(R+L2-P.tf,0,0);add(g)});
 var n=0;S.forEach(function(g){n+=g.attributes.position.array.length});var A=new Float32Array(n),o=0;S.forEach(function(g){A.set(g.attributes.position.array,o);o+=g.attributes.position.array.length});
 var G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(A,3));G.computeVertexNormals();G.computeBoundingBox();
 G.userData={partsList:['kolano rury Ø'+P.D+'/Ø'+P.d+' R'+P.R,'kołnierz '+P.F+'×'+P.F+'×'+P.tf+' + '+P.nh+'×Ø'+P.dh+'/Ø'+P.dcb+' (wlot)','kołnierz '+P.F+'×'+P.F+'×'+P.tf+' + '+P.nh+'×Ø'+P.dh+'/Ø'+P.dcb+' (wylot)'],elbowP:P};
 return G}
root.ElbowGeo=build;if(typeof module!=='undefined')module.exports=build;
})(typeof window!=='undefined'?window:globalThis);
/* t939u ISO ELBOW: kandydat „kolano rury + 2 kołnierze” z wymiarów rysunku, gdy widok 3D + sygnał rury/kolana.
 Wyłącz: window.__noIsoElbow=1 lub #isoelbow=0 (rc z OCR 45°: #isoelbowrot=0). Nie dotyka G0, P2, granicy APPROXIMATE/PRECISE. Wymiary nieodczytane = źródło 'domyślne' + NEEDS_REVIEW. */
(function(){
function off(){return window.__noIsoElbow||/[#&]isoelbow=0/.test(location.hash)}
function L(){console.log.apply(console,['isoelbow:'].concat([].slice.call(arguments)))}
function dims(m){var tx=String(m.allText||'').replace(/,/g,'.'),D=[],N=[],R=[];
 (m.nums||[]).forEach(function(n){var v=n.p&&+n.p.value;if(!(v>0))return;var t=String(n.text||'');if(n.p.prefix==='ø'||/[ØøΦ⌀]/.test(t))D.push(v);else if(/R\s*\d/.test(t)||n.p.prefix==='R')R.push(v);else N.push(v)});
 String(m.allText||'').split(/\s+/).forEach(function(t){var q;t=t.replace(/[\[\]]/g,'');if(!t)return;
  if((q=t.match(/^[@ØøΦ⌀$](\d{2,3})$/))||(q=t.match(/^0(\d{2,3})$/)))D.push(+q[1]);
  else if((q=t.match(/^\d{1,2}-[@ØøΦ⌀$0](\d{2,3})$/)))D.push(+q[1]);
  else if((q=t.match(/^\d{1,2}-R(\d{1,3})$/)))R.push(+q[1]);
  else if((q=t.match(/^R(\d{2,4})$/)))R.push(+q[1]);
  else if((q=t.match(/^\d?-?R([1-9][0-9OoZz])$/))&&/[OoZz]/.test(q[1]))R.push(+q[1].replace(/[Oo]/g,'0').replace(/[Zz]/g,'2'));/* r20: OCR 'R2O'/'4-RZO' */
  else if((q=t.match(/^\(?([1-9]\d{1,3})\)?$/)))N.push(+q[1]);});
 var RR=[],rot=rotR(m);rot.forEach(function(v){RR.push(v)});
 var cnt=function(a,v){return a.filter(function(x){return x===v}).length};
 var ds=D.filter(function(v){return v>=40}).sort(function(a,b){return a-b}),P={},S={};
 // otwór rury d i średnica zewn. D: para (d,D) z 1.1<D/d<1.8, d najczęstsze
 var best=null;ds.forEach(function(d){ds.forEach(function(o){if(o/d>1.1&&o/d<1.8){var sc=cnt(D,d)+cnt(D,o)+d/1000;if(!best||sc>best.sc)best={d:d,D:o,sc:sc}}})});
 if(!best)return null;P.d=best.d;P.D=best.D;S.d=S.D='rysunek';
 var rb=R.filter(function(r){return r>=P.D/2&&r<=P.D*4}).sort(function(a,b){return b-a})[0];P.R=rb||Math.round(P.D*0.9);S.R=rb?'rysunek':'domyślne';
 var rc=R.filter(function(r){return r>=10&&r<P.D/4}).sort(function(a,b){return a-b})[0],rcs='rysunek';
 if(!rc){rc=RR.filter(function(r){return r>=3&&r<P.D/4}).sort(function(a,b){return cnt(RR,b)-cnt(RR,a)||a-b})[0];rcs='rysunek (OCR 45°)'}
 P.rc=rc||0.5;S.rc=rc?rcs:'domyślne';
 var all=N.concat(R),fc=all.filter(function(v){return v>P.D*1.05&&v<=P.D*2.5}),F=null,fb=-1;fc.forEach(function(v){var c=cnt(all,v)+v/1e4;if(c>fb&&v>=P.D*1.15){fb=c;F=v}});
 P.F=F||Math.round(P.D*1.25);S.F=F?'rysunek':'domyślne';
 var pc=all.filter(function(v){return v>P.D*0.75&&v<P.F*0.95&&(v!==P.R||cnt(N,v)>=2)&&v!==P.D&&v!==P.d&&cnt(all,v)>=2}),pb=-1,pt=null;pc.forEach(function(v){var c=cnt(all,v);if(c>pb){pb=c;pt=v}});
 if(!pt&&R.indexOf(P.R)>=0&&cnt(all,P.R)>1&&P.R<P.F)pt=P.R;P.pitch=pt||Math.round((P.F+P.D)/2);S.pitch=pt?'rysunek':'domyślne';
 var tfc=all.filter(function(v){return v>=P.F/14&&v<=P.F/4.5&&cnt(all,v)>=2}).sort(function(a,b){return cnt(all,b)-cnt(all,a)||a-b});P.tf=tfc[0]||Math.round(P.F/7);S.tf=tfc[0]?'rysunek':'domyślne';
 var lc=all.filter(function(v){return v>P.tf*1.5&&v<P.F&&v!==P.pitch&&v!==P.R&&cnt(all,v)>=2}).sort(function(a,b){return cnt(all,b)-cnt(all,a)||a-b});var Lv=lc[0];P.L1=P.L2=Lv||P.tf*3;S.L='rysunek'+(Lv?'':'?');if(!Lv)S.L='domyślne';
 var hs=D.filter(function(v){return v<P.d/2&&v>=6}).sort(function(a,b){return cnt(D,b)-cnt(D,a)||a-b});P.dh=hs[0]||18;S.dh=hs[0]?'rysunek':'domyślne';var cb=hs.filter(function(v){return v>P.dh*1.4&&v<P.dh*3})[0];P.dcb=cb||0;S.dcb=cb?'rysunek':'brak';
 var hc=all.filter(function(v){return v<P.tf*0.5&&v>=5&&cnt(all,v)>=2}).sort(function(a,b){return a-b});P.hcb=P.dcb?(hc[0]||Math.round(P.tf/5)):0.001;S.hcb=P.dcb?(hc[0]?'rysunek':'domyślne'):'brak';P.nh=4;P.noInner=0;
 return {P:P,S:S}}

/* r20b: napisy ukośne (np. „4-R20” na odnośniku naroża) – PP-OCR nie czyta tekstu pod 45°.
 Po RamaEngine.readDrawing: gdy w wymiarach jest para Ø i sygnał R → jeden dodatkowy przebieg PP-OCR na arkuszu obróconym o 45° (~4 s).
 Wynik tylko jako źródło promieni naroży (rc) – nie zmienia innych wymiarów. Wyłącz: #isoelbowrot=0 / window.__noIsoElbowRot=1. */
function rotOff(){return off()||window.__noIsoElbowRot||/[#&]isoelbowrot=0/.test(location.hash)}
function rotR(m){var r=m&&m.info&&m.info.res&&m.info.res.__rotR;return r&&r.R?r.R.slice():[]}
function wantRot(res){try{var T=(res.dimensions||[]).map(function(d){return String(d.text||'')}),nd=0,nr=0;
 T.forEach(function(t){t=t.trim();if(/^[@ØøΦ⌀$0]\d{2,3}$/.test(t)||/^\d{1,2}-[@ØøΦ⌀$0]\d{2,3}$/.test(t))nd++;if(/R\s*\d{2,4}/.test(t))nr++});return nd>=2&&nr>=1}catch(e){return false}}
function rotOCR(sheet){var W=sheet.width||sheet.naturalWidth,H=sheet.height||sheet.naturalHeight;if(!(W>0&&H>0))return Promise.resolve(null);
 var Sd=Math.ceil(Math.hypot(W,H)),c=document.createElement('canvas');c.width=Sd;c.height=Sd;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,Sd,Sd);x.translate(Sd/2,Sd/2);x.rotate(Math.PI/4);x.drawImage(sheet,-W/2,-H/2);
 return RamaEngine.ppocr(c).then(function(rs){var R=[],T=[];(rs||[]).forEach(function(o){var t=String(o.text||'').trim(),q=t.match(/(?:^|[^A-Z0-9])(\d{0,2})\s*[-–]?\s*R\s*(\d{1,3})$/i)||t.match(/^R(\d{1,3})$/i);
  if(q){var v=+(q[2]||q[1]);if(v>0){R.push(v);T.push(t)}}});return {R:R,T:T}})}
function wrapRD(){var E=window.RamaEngine;if(!E||typeof E.readDrawing!=='function'||E.readDrawing.__isoElbow)return;var o=E.readDrawing;
 var w=function(input,opt){return o.apply(this,arguments).then(function(res){if(rotOff()||!res||!wantRot(res))return res;var t0=Date.now();if(input&&input.__rotR){res.__rotR=input.__rotR;return res}
  return Promise.race([rotOCR(input),new Promise(function(r){setTimeout(function(){r(null)},20000)})]).then(function(rr){res.__rotR=rr||{R:[],T:[],timeout:1};try{if(rr)input.__rotR=rr}catch(e){}L('rot',JSON.stringify(res.__rotR),(Date.now()-t0)+'ms');return res},function(e){L('rot err '+e);return res})})};
 w.__isoElbow=1;E.readDrawing=w}
var TUBE=/\brur|rohr|pipe|kolan|bogen|elbow|sweep|flansch|flange|kołnierz/i;
function wrapC(){var o=window.candidates;if(typeof o!=='function'||o.__isoElbow)return;var w=function(m){var C=o.apply(this,arguments);
 try{if(off()||!m||!m.V||!m.V.iso||!window.ElbowGeo)return C;var hint=TUBE.test(String(m.allText||''))||(m.isoRef&&m.isoRef.hint)||m.kind==='pipe';var r=dims(m);
  m.isoElbow={hint:!!hint,dims:r};L('dims',JSON.stringify(r),'hint',!!hint);
  if(!r||(!hint&&!(r.S.R==='rysunek')))return C;
  var MAJ=['D','d','R','F','tf','L','pitch','dh'],g=window.ElbowGeo(THREE,r.P),miss=MAJ.filter(function(k){return r.S[k]!=='rysunek'}),minor=['rc','hcb'].filter(function(k){return r.S[k]==='domyślne'});
  var E=[{id:'E1',typ:'kolano rury',D:r.P.D,d:r.P.d,R:r.P.R,zrodlo:r.S.D+'/'+r.S.R},{id:'F1',typ:'kołnierz',a:r.P.F,t:r.P.tf,otw:r.P.nh+'×Ø'+r.P.dh,rel:'spaw do E1 (wlot)',zrodlo:r.S.F+'/'+r.S.tf},{id:'F2',typ:'kołnierz',a:r.P.F,t:r.P.tf,otw:r.P.nh+'×Ø'+r.P.dh,rel:'spaw do E1 (wylot)',zrodlo:r.S.F+'/'+r.S.tf}];
  g.userData.elements=E;g.userData.missing=miss;g.userData.minorDefault=minor;g.userData.dimSrc=r.S;
  m.isoElbow.rot=(m.info&&m.info.res&&m.info.res.__rotR)||null;
  /* połączenia: styk geometryczny kołnierz–koniec rury sprawdzany w modelu; typ spawu bez symbolu na rysunku = ZAŁOŻONY (nie „OK”) */
  var AT=String(m.allText||''),wsym=/\b(spaw|weld|schwei|kehlnaht|kehl)/i.test(AT)||/(^|\s)a\s?[2-9](\s|$)/.test(AT),J=[['F1','E1','wlot'],['F2','E1','wylot']].map(function(j){return {id:'J'+j[0].slice(1),a:j[0],b:j[1],typ:'spaw obwodowy kołnierz–rura ('+j[2]+')',styk:(r.P.D>r.P.d&&r.P.D<r.P.F&&r.P.d<r.P.F)?'OK (Ø'+r.P.D+' w obrysie kołnierza '+r.P.F+', otwór Ø'+r.P.d+' = Ø wewn. rury)':'KONFLIKT',spaw:wsym?'symbol na rysunku':'ZAŁOŻONY – brak symbolu spawu na rysunku'}});
  g.userData.joints=J;
  var DK=MAJ.concat(['dcb','rc','hcb']),okD=DK.filter(function(k){return /^rysunek/.test(r.S[k]||'')}),jOk=J.every(function(j){return /^OK/.test(j.styk)});
  g.userData.zgodnosc={ksztalt:{zrodlo:'izometria (sylwetka)',status:'DO_POMIARU',uwaga:'edge-IoU liczone po matchIso (pick.iou); sufit metryki ~0.79 – nie mylić z %'},
   elementy:{oczekiwane:3,zbudowane:E.length,lista:E.map(function(e){return e.id+':'+e.typ}),status:E.length===3?'OK':'NEEDS_REVIEW'},
   polaczenia:{n:J.length,status:jOk?(wsym?'OK':'STYK_OK · SPAW_ZAŁOŻONY'):'NEEDS_REVIEW',lista:J.map(function(j){return j.id+' '+j.a+'–'+j.b+': styk '+j.styk.split(' ')[0]+', spaw '+j.spaw.split(' ')[0]})},
   wymiary:{zgodne:okD.length,z:DK.length,zrodla:r.S,status:miss.length?'NEEDS_REVIEW':'OK'},
   kompletnosc:{brak:miss,domyslne_drobne:minor,status:miss.length?'NEEDS_REVIEW':(minor.length?'CZĘŚCIOWA (drobne domyślne: '+minor.join(',')+')':'OK')}};
  L('zg',JSON.stringify(g.userData.zgodnosc));
  var c={name:'kolano rury + 2 kołnierze (ISO)',geo:g,isoElbow:1,force:miss.length?0:1,how:'ISO-first: kolano Ø'+r.P.D+'/Ø'+r.P.d+' R'+r.P.R+' + 2 kołnierze '+r.P.F+'×'+r.P.F+'×'+r.P.tf+' ('+r.P.nh+'×Ø'+r.P.dh+(r.P.dcb?'/Ø'+r.P.dcb:'')+')'+(miss.length?' · ⚠ NEEDS_REVIEW: wymiary domyślne: '+miss.join(','):'')};
  C.unshift(c);if((m.kindWhy||[]).indexOf('wybrane ręcznie')<0){m.kindFrom=m.kind;m.kind='mixed';m.kindWhy=['ISO first: kolano rury + kołnierze (widok 3D + wymiary Ø/R)'].concat(m.kindWhy||[])}
  if(m.isoRef&&m.isoRef.status==='NEEDS_REVIEW'&&!miss.length){m.isoRef.status='OK';m.isoRef.notes.push('kandydat kolana z wymiarów')}
  if(miss.length&&m.isoRef){m.isoRef.status='NEEDS_REVIEW';m.isoRef.notes.push('kolano: wymiary domyślne '+miss.join(','))}
 }catch(e){L('err '+e)}return C};w.__isoElbow=1;w.__isoRef=o.__isoRef;w.__mid=o.__mid;window.candidates=w}
function wrapR(){var o=window.rebuild;if(typeof o!=='function'||o.__isoElbow)return;var w=function(m){var r=o.apply(this,arguments);try{var p=m&&m.pick,z=p&&p.isoElbow&&p.geo&&p.geo.userData&&p.geo.userData.zgodnosc;if(z&&!off()){var i=p.iou;z.ksztalt.edgeIoU=i==null?null:+i.toFixed(2);z.ksztalt.status=i==null?'UNKNOWN':(i>=0.45?'OK':'NEEDS_REVIEW');}}catch(e){L('err '+e)}return r};w.__isoElbow=1;w.__isoRef=o.__isoRef;w.__mid=o.__mid;window.rebuild=w}
wrapRD();wrapC();window.addEventListener('load',function(){wrapRD();setTimeout(function(){setTimeout(function(){setTimeout(function(){wrapC();wrapR()},0)},0)},0)});
})();
