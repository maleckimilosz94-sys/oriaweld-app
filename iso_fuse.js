/* oria-206 ISO FUSE (2.4): z izometrii układ części, z rzutów/tabeli wymiary → jeden model.
 1) rama z płaskowników + kątowników (tabela części FLAT BAR/L ANGLE, izometria = rama, rozwinięcie nie wymuszane – elecbox):
    rama dolna z płaskowników (gabaryt z rzutu z góry), rama górna (długości z tabeli), słupki z kątowników → wysokość z rzutu bocznego.
 2) rura + blachy laserowe (izometria ze skanu arkusza, napis TUBE/RURA + LASER, wymiar Ø): rura pionowa (Ø z wymiaru, długość = największy wymiar),
    blacha tylna z rzutu przedniego, 2 blachy łączące (wysięg z wymiaru), grubość blach standardowa.
 Wyłącznik: #isofuse=0 / window.__noIsoFuse=1 → wynik 2.3 1:1. */
(function(){
function q(){return String(location.search||'')+'&'+String(location.hash||'')}
function off(){return window.__noIsoFuse===1||window.__noIsoFuse===true||/[?&#]isofuse=0(?:&|$)/.test(q())||/[?&#]isofirst=0(?:&|$)/.test(q())||window.__noIsoFirst===1}
function L(){try{console.log.apply(console,['isofuse:'].concat([].slice.call(arguments)))}catch(e){}}
function manual(m){return (m.kindWhy||[]).indexOf('wybrane ręcznie')>=0}
function acc(){var pos=[],col=[];return {add:function(g,c){g=g.index?g.toNonIndexed():g;var a=g.attributes.position.array,i;for(i=0;i<a.length;i++)pos.push(a[i]);for(i=0;i<a.length/3;i++)col.push(c[0],c[1],c[2])},geo:function(){var G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));G.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return window.finalize(G)}}}
function box(A,sx,sy,sz,x,y,z,c){var g=new THREE.BoxGeometry(sx,sy,sz);g.translate(x,y,z);A.add(g,c)}
/* wymiary z rzutów: liczby leżące przy rzutach ortogonalnych (nie w tabeli części / tabelce) */
function viewNums(m){var V=(m.V&&m.V.ortho||[]).filter(function(v){return v&&v.ob&&!v.iso}),out=[],tab=[];(m.nums||[]).forEach(function(n){if(!n||!n.p||!(+n.p.value>0))return;var v=+n.p.value,near=V.some(function(w){var o=w.ob,e=0.3*Math.max(o.w,o.h);return n.x>=o.x-e&&n.x<=o.x+o.w+e&&n.y>=o.y-e&&n.y<=o.y+o.h+e});(near?out:tab).push({v:v,n:n})});return {dim:out,tab:tab}}
/* liczby z rysunku poza ramką arkusza (siatka 1..8/A..F), tabelką rysunkową (prawy dolny róg) i samą izometrią */
function freeNums(m,isoBox){var sh=m.info&&m.info.sheet,SW=sh&&sh.width||1,SH=sh&&sh.height||1;return (m.nums||[]).filter(function(n){if(!n||!n.p||!(+n.p.value>=3)||(n.p.prefix&&!/[Ø⌀ØR]/i.test(String(n.p.prefix))))return false;var x=n.x,y=n.y;if(x<0.04*SW||x>0.96*SW||y<0.04*SH||y>0.96*SH)return false;if(x>0.55*SW&&y>0.72*SH)return false;if(isoBox&&x>=isoBox[0]&&x<=isoBox[0]+isoBox[2]&&y>=isoBox[1]&&y<=isoBox[1]+isoBox[3])return false;return true}).map(function(n){return n.p.prefix&&/[Ø⌀Ø]/.test(String(n.p.prefix))?-(+n.p.value):+n.p.value})}/* średnice ze znakiem minus */
function snap(x,vals,tol){var b=null;vals.forEach(function(v){var r=Math.abs(v-x)/v;if(r<=tol&&(!b||Math.abs(v-x)<Math.abs(b-x)))b=v});return b||x}
function TX(m){return String(m.allText||'').toUpperCase()}
/* --- 1) rama z płaskowników i kątowników --- */
function flatAngleFrame(m){var I=m.iso204,tx=TX(m);if(!I||I.cls!=='frame'||I.src||!(I.bom>=3))return null;
 var nFB=(tx.match(/FLAT\s?BAR|P[ŁL]ASKOWNIK|FLACHSTAHL/g)||[]).length,nL=(tx.match(/L[\s-]?ANGLE|K[ĄA]TOWNIK|WINKEL/g)||[]).length;if(nFB<2||nL<1)return null;
 var V=m.V||{},f=V.front,t=V.top,s=V.side,k=m.mmpx;if(!f||!f.ob||!(k>0)||!(t||s)||m.scaleConf==='zgadnięta')return null;
 var N=viewNums(m),D=N.dim.map(function(o){return o.v}),T=N.tab.map(function(o){return o.v});
 var W=snap(f.ob.w*k,D,0.05),H=snap(f.ob.h*k,D,0.05),Z=snap(t?t.ob.h*k:s.ob.w*k,D,0.08);if(!(W>50&&H>50&&Z>10&&Z<0.6*Math.min(W,H)))return null;
 var fb=tx.match(/(?:FLAT\s?BAR|P[ŁL]ASKOWNIK)\s*(\d+(?:[.,]\d+)?)\s*[X×]\s*(\d+(?:[.,]\d+)?)/),b=fb?+fb[1].replace(',','.'):20,th=fb?+fb[2].replace(',','.'):5;
 var la=tx.match(/(?:L[\s-]?ANGLE|K[ĄA]TOWNIK)\s*(\d+(?:[.,]\d+)?)\s*[X×]\s*(\d+(?:[.,]\d+)?)\s*[X×]\s*(\d+(?:[.,]\d+)?)/),a=la?+la[1].replace(',','.'):20,ta=la?+la[3].replace(',','.'):3;
 if(!(b>=8&&b<=120&&th>=2&&th<=30&&a>=10&&a<=120&&ta>=1.5&&ta<=15))return null;
 /* rama górna z długości w tabeli części (jeśli są), inaczej wcięcie o 2 szer. płaskownika */
 var Wi=T.filter(function(v){return v<W&&v>0.8*W}).sort(function(p,q){return q-p})[0]||W-2*b-2*th,Hi=T.filter(function(v){return v<H&&v>0.6*H}).sort(function(p,q){return q-p})[0]||H-2*b-2*th;
 var A=acc(),cF=[0.25,0.55,0.85],cU=[0.2,0.75,0.4],cL=[0.9,0.55,0.15],x,y;
 /* układ (izometria): rama dolna leży płasko (gr. th), rama górna z płaskowników na sztorc, słupki z kątowników na krótszych bokach */
 box(A,W,b,th,0,H/2-b/2,th/2,cF);box(A,W,b,th,0,-H/2+b/2,th/2,cF);box(A,b,H-2*b,th,W/2-b/2,0,th/2,cF);box(A,b,H-2*b,th,-W/2+b/2,0,th/2,cF);
 var zt=Z-b/2;box(A,Wi,th,b,0,Hi/2-th/2,zt,cU);box(A,Wi,th,b,0,-Hi/2+th/2,zt,cU);box(A,th,Hi-2*th,b,Wi/2-th/2,0,zt,cU);box(A,th,Hi-2*th,b,-Wi/2+th/2,0,zt,cU);
 var hp=Z-b-th;if(hp>2)[-1,1].forEach(function(sg){var xc=sg*(Wi/2-th-a/2);box(A,a,ta,hp,xc,0,th+hp/2,cL);box(A,ta,a,hp,xc-sg*(a/2-ta/2),0,th+hp/2,cL)});
 var g=A.geo();/* finalize: y=wysokość od 0 – oś Z rysunku na Y bryły */
 g.userData=g.userData||{};g.userData.partsList=['rama dolna: płaskownik '+b+'×'+th+' – 2 × '+Math.round(W)+' + 2 × '+Math.round(H-2*b)+' mm','rama górna: płaskownik '+b+'×'+th+' na sztorc – 2 × '+Math.round(Wi)+' + 2 × '+Math.round(Hi)+' mm','2 × słupek: kątownik L '+a+'×'+a+'×'+ta+', dł. '+Math.round(hp)+' mm'];
 return {name:'rama z płaskowników i kątowników (izometria + tabela części)',geo:g,how:'układ z izometrii: rama dolna + rama górna na słupkach z kątowników; gabaryt '+Math.round(W)+'×'+Math.round(H)+'×'+Math.round(Z)+' z rzutów, przekroje i długości z tabeli części (płaskownik '+b+'×'+th+', L '+a+'×'+a+'×'+ta+')'}}
/* --- 2) rura + blachy laserowe --- */
function tubePlates(m){var I=m.iso204,tx=TX(m);if(!I||!I.src)return null;if(!/TUBE|RURA|ROHR/.test(tx)||!/LASER/.test(tx))return null;if(m.kind==='rot'||m.certoLow)return null;
 var V=m.V||{},f=V.front,k=m.mmpx;if(!f||!f.ob||!(k>0))return null;var D0=freeNums(m,I.scan),DM=D0.filter(function(v){return v<0}).map(function(v){return -v}),D=D0.filter(function(v){return v>0});window.__isoFuseD=D0;if(D.length+DM.length<3)return null;
 var Lt=Math.max.apply(0,D);/* średnica: liczba z Ø w tekście, inaczej druga co do wielkości mniejsza od Lt/2 */
 var dm=DM.concat((tx.match(/[Ø⌀]\s*(\d+(?:[.,]\d+)?)/g)||[]).map(function(s){return +s.replace(/[^\d.,]/g,'').replace(',','.')})).filter(function(v){return v>5&&v<Lt});
 var cand=D.filter(function(v){return v<Lt/2.5&&v>=15}).sort(function(p,q){return q-p}),OD=dm.length?Math.max.apply(0,dm):cand[0];if(!OD)return null;var ID=dm.length>1?Math.min.apply(0,dm):OD-6;if(!(ID>0&&ID<OD))ID=OD-6;
 var Wp=f.ob.w*k;/* rzut przedni: szerokość blachy tylnej */Wp=Math.min(Wp,Lt*1.2);if(!(Wp>OD*1.5))Wp=OD*3;
 var ear=D.filter(function(v){return v>=OD*0.5&&v<OD*1.2&&v!==OD})[0]||OD*0.8,off=D.filter(function(v){return v<OD*0.5&&v>=5})[0]||10,tp=5;
 var A=acc(),cT=[0.9,0.55,0.15],cP=[0.25,0.55,0.85],cE=[0.2,0.75,0.4];
 /* rura: pełny pierścień (Lathe) – widoczna z każdej strony */var pr=[new THREE.Vector2(ID/2,0),new THREE.Vector2(OD/2,0),new THREE.Vector2(OD/2,Lt),new THREE.Vector2(ID/2,Lt),new THREE.Vector2(ID/2,0)],tube=new THREE.LatheGeometry(pr,32),zc=tp+OD/2;tube.translate(0,0,zc);A.add(tube,cT);
 var hb=Math.max(Lt-2*off,Lt*0.6);box(A,Wp,hb,tp,0,Lt/2,tp/2,cP);
 [off,Lt-off-tp].forEach(function(yy){box(A,Wp*0.85,tp,ear,0,yy+tp/2,tp+ear/2,cE)});
 var g=A.geo();g.userData=g.userData||{};g.userData.partsList=['rura ø'+Math.round(OD)+'/ø'+Math.round(ID)+', dł. '+Math.round(Lt)+' mm','blacha tylna (laser) '+Math.round(Wp)+'×'+Math.round(hb)+'×'+tp+' mm','2 × blacha łącząca (laser) '+Math.round(Wp*0.85)+'×'+Math.round(ear)+'×'+tp+' mm'];
 return {name:'rura + blachy laserowe (izometria + rzuty)',geo:g,how:'APPROXIMATE · układ z izometrii (skan arkusza): rura ø'+Math.round(OD)+'×'+Math.round(Lt)+' + blacha tylna + 2 blachy łączące; wymiary z rzutów, grubość blach '+tp+' mm (standard)'}}
function wrapPick(){var o=window.__isoLockPick;if(o&&o.__isoFuse)return;var w=function(m,C,pick){var p=o?(o(m,C,pick)||pick):pick;try{if(off()||!m||manual(m)||!C||m.kind==='rot'||m.certoLow||m.kindAlias==='mixpp')return p;var r=null,why='';
  if(p&&/^rama z profili/.test(p.name||'')&&m.iso204&&m.iso204.net){r=flatAngleFrame(m);why='frameFA'}
  if(!r&&m.iso204&&m.iso204.src&&p&&/^(wyciągnięcie |przecięcie rzutów|blacha gięta)/.test(p.name||'')){r=tubePlates(m);why='tubePlates'}
  if(!r)return p;r.iou=p.iou;r.fuse=why;C.push(r);m.isoFuse={from:p.name,to:r.name,why:why};if(why==='tubePlates'){m.kindFrom=m.kind;m.kind='mixed';m.kindWhy=['izometria (skan arkusza): rura + blachy laserowe – zespół'].concat(m.kindWhy||[])}
  else{m.kind='frame';m.kindWhy=['izometria + tabela części: rama z płaskowników i kątowników'].concat((m.kindWhy||[]).filter(function(x){return !/^izometria: rama z profili/.test(x)}))}
  L('pick',p.name,'->',r.name);return r}catch(e){L('err '+e);window.__isoFuseErr=String(e&&e.stack||e)}return p};w.__isoFuse=1;w.__iso204=o&&o.__iso204;window.__isoLockPick=w}
window.addEventListener('load',function(){setTimeout(function(){setTimeout(function(){setTimeout(function(){setTimeout(wrapPick,0)},0)},0)},0)});
})();
