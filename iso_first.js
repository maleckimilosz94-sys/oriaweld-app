/* oria-204 ISO FIRST (t1240u): izometria = główne źródło układu konstrukcji.
 1) isoAnalyze: z pikseli rzutu izometrycznego (region dorośnięty po tuszu, bez tabelki/ramki arkusza) – liczba wydłużonych pól (ściany prętów/profili),
    duże pola (płaszczyzny/prześwity), wypełnienie tuszem → m.iso204 {cls: frame|plate|?, ...}.
 2) klasyfikacja: iso = rama → głos „frame” do punktów classify (tylko gdy klasa była plate/bent/solid; nie rusza rot/certoLow/szpuli/ręcznego wyboru).
 3) bramki: iso = rama → skrót G0 „blacha z obrysu” i „pudełko z rozwinięcia” NIE są wymuszane (rzut iso liczy się jak rzut).
 4) wybór: iso = rama, a wynik to płyta/blacha/wyciągnięcie/przecięcie (dziwna bryła) → kandydat ramowy o najlepszej zgodności z izometrią;
    gabaryt ramy z izometrii dociągany do wymiarów z rzutów (front/góra/bok × skala), gdy są.
 5) APPROXIMATE: skala zgadnięta (brak wymiarów) → nota „gabaryt z obrysu izometrii, profil standardowy”.
 6) P2: podpowiedź z izometrii (PL/EN/DE) – window.__p2IsoHint.
 Wyłącznik: #isofirst=0 / ?isofirst=0 / window.__noIsoFirst=1 (2.1 1:1). #isofirst=dry → tylko analiza (m.iso204), bez zmian wyniku. */
(function(){
function q(){return String(location.search||'')+'&'+String(location.hash||'')}
function off(){return window.__noIsoFirst===1||window.__noIsoFirst===true||/[?&#]isofirst=0(?:&|$)/.test(q())}
function dry(){return /[?&#]isofirst=dry(?:&|$)/.test(q())}
function L(){try{console.log.apply(console,['isofirst:'].concat([].slice.call(arguments)))}catch(e){}}
function manual(m){return (m.kindWhy||[]).indexOf('wybrane ręcznie')>=0}
function lum(d,i){return d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114}
function dil(A,w,h,r){if(r<1)return A;var B=new Uint8Array(w*h),C=new Uint8Array(w*h),x,y,k;
 for(y=0;y<h;y++){var o=y*w,run=-1e9;for(x=0;x<w;x++){if(A[o+x])run=x;if(x-run<=r)B[o+x]=1}run=1e9;for(x=w-1;x>=0;x--){if(A[o+x])run=x;if(run-x<=r)B[o+x]=1}}
 for(x=0;x<w;x++){var run2=-1e9;for(y=0;y<h;y++){if(B[y*w+x])run2=y;if(y-run2<=r)C[y*w+x]=1}run2=1e9;for(y=h-1;y>=0;y--){if(B[y*w+x])run2=y;if(run2-y<=r)C[y*w+x]=1}}return C}
function dilX(A,w,h){/* dylatacja krzyżem 3×3 (jak scipy) – nie zamyka skośnych pasków izometrii */var B=new Uint8Array(w*h);for(var y=0;y<h;y++)for(var x=0;x<w;x++){var i=y*w+x;B[i]=A[i]||(x>0&&A[i-1])||(x<w-1&&A[i+1])||(y>0&&A[i-w])||(y<h-1&&A[i+w])?1:0}return B}
function label(A,w,h,val){var Lb=new Int32Array(w*h),n=0,st=new Int32Array(w*h),R=[];for(var i=0;i<w*h;i++){if(A[i]!==val||Lb[i])continue;n++;var sp=0;st[sp++]=i;Lb[i]=n;var a=0,x0=w,x1=0,y0=h,y1=0;
  while(sp){var p=st[--sp],x=p%w,y=(p-x)/w;a++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
   if(x>0&&A[p-1]===val&&!Lb[p-1]){Lb[p-1]=n;st[sp++]=p-1}if(x<w-1&&A[p+1]===val&&!Lb[p+1]){Lb[p+1]=n;st[sp++]=p+1}if(y>0&&A[p-w]===val&&!Lb[p-w]){Lb[p-w]=n;st[sp++]=p-w}if(y<h-1&&A[p+w]===val&&!Lb[p+w]){Lb[p+w]=n;st[sp++]=p+w}}
  R.push({id:n,a:a,x0:x0,x1:x1,y0:y0,y1:y1})}return {L:Lb,R:R}}
function chamfer(A,w,h){/* odległość (px) od tuszu dla pól białych; A=1 tusz */var D=new Float32Array(w*h),INF=1e9,i,x,y;for(i=0;i<w*h;i++)D[i]=A[i]?0:INF;
 for(y=0;y<h;y++)for(x=0;x<w;x++){i=y*w+x;if(!D[i])continue;var v=D[i];if(x>0)v=Math.min(v,D[i-1]+1);if(y>0){v=Math.min(v,D[i-w]+1);if(x>0)v=Math.min(v,D[i-w-1]+1.414);if(x<w-1)v=Math.min(v,D[i-w+1]+1.414)}D[i]=v}
 for(y=h-1;y>=0;y--)for(x=w-1;x>=0;x--){i=y*w+x;if(!D[i])continue;var u=D[i];if(x<w-1)u=Math.min(u,D[i+1]+1);if(y<h-1){u=Math.min(u,D[i+w]+1);if(x<w-1)u=Math.min(u,D[i+w+1]+1.414);if(x>0)u=Math.min(u,D[i+w-1]+1.414)}D[i]=u}return D}
function px(sheet,sx,sy,sw,sh,W,H){var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.drawImage(sheet,sx,sy,sw,sh,0,0,W,H);return x.getImageData(0,0,W,H).data}
/* --- 1) analiza izometrii --- */
function isoAnalyze(m){var iv=m&&m.V&&m.V.iso,sh=m&&m.info&&m.info.sheet;if(!iv||!iv.ob||!sh||!(sh.width>0))return null;var t0=Date.now();
 var SW=sh.width,SH=sh.height,k=Math.min(1,600/Math.max(SW,SH)),w=Math.max(8,Math.round(SW*k)),h=Math.max(8,Math.round(SH*k)),d=px(sh,0,0,SW,SH,w,h),A=new Uint8Array(w*h),i;
 for(i=0;i<w*h;i++)A[i]=lum(d,i*4)<170?1:0;
 /* region izometrii: składowe tuszu (po zlepieniu) przechodzące przez środek rzutu iso; bez ramki arkusza i tabelki (składowe > 80% arkusza lub w rogu tabelki) */
 var r=Math.max(2,Math.round(0.008*Math.max(w,h))),D=dil(A,w,h,r),lb=label(D,w,h,1),o=iv.ob,cx0=Math.floor((o.x+o.w*0.25)*k),cx1=Math.ceil((o.x+o.w*0.75)*k),cy0=Math.floor((o.y+o.h*0.25)*k),cy1=Math.ceil((o.y+o.h*0.75)*k),ids={};
 for(var y=Math.max(0,cy0);y<=Math.min(h-1,cy1);y++)for(var x=Math.max(0,cx0);x<=Math.min(w-1,cx1);x++){var id=lb.L[y*w+x];if(id)ids[id]=1}
 if(!Object.keys(ids).length){/* mały rzut iso (wycinek) – ziarno z całego prostokąta */for(var y2=Math.max(0,Math.floor(o.y*k));y2<=Math.min(h-1,Math.ceil((o.y+o.h)*k));y2++)for(var x2=Math.max(0,Math.floor(o.x*k));x2<=Math.min(w-1,Math.ceil((o.x+o.w)*k));x2++){var id3=lb.L[y2*w+x2];if(id3)ids[id3]=1}}var bx0=1e9,by0=1e9,bx1=-1,by1=-1;lb.R.forEach(function(R){if(!ids[R.id])return;if(R.x1-R.x0>0.6*w||R.y1-R.y0>0.6*h)return;if(R.x0<bx0)bx0=R.x0;if(R.y0<by0)by0=R.y0;if(R.x1>bx1)bx1=R.x1;if(R.y1>by1)by1=R.y1});
 var grown=bx1>bx0;if(!grown){bx0=o.x*k;by0=o.y*k;bx1=(o.x+o.w)*k;by1=(o.y+o.h)*k}
 /* nie rośnij więcej niż 6× pola rzutu iso (dymki/odnośniki/tabelka) */
 var gA=(bx1-bx0)*(by1-by0),oA=o.w*o.h*k*k;if(grown&&gA>Math.max(6*oA,0.06*w*h)){var ux0=Math.max(bx0,o.x*k-o.w*k*0.3),uy0=Math.max(by0,o.y*k-o.h*k*0.3),ux1=Math.min(bx1,(o.x+o.w)*k+o.w*k*0.3),uy1=Math.min(by1,(o.y+o.h)*k+o.h*k*0.3);bx0=ux0;by0=uy0;bx1=ux1;by1=uy1;grown='clip'}
 var X0=bx0/k,Y0=by0/k,XW=Math.max(4,(bx1-bx0)/k),YH=Math.max(4,(by1-by0)/k),s2=480/Math.max(XW,YH),cw=Math.max(8,Math.round(XW*s2)),ch=Math.max(8,Math.round(YH*s2)),d2=px(sh,X0,Y0,XW,YH,cw,ch),I=new Uint8Array(cw*ch),ink=0;
 for(i=0;i<cw*ch;i++)I[i]=lum(d2,i*4)<175?1:0;I=dilX(I,cw,ch);for(i=0;i<cw*ch;i++)ink+=I[i];
 var wl=label(I,cw,ch,0),bord={},tot=cw*ch,DT=chamfer(I,cw,ch),mx=new Float32Array(wl.R.length+1);
 for(i=0;i<cw;i++){bord[wl.L[i]]=1;bord[wl.L[(ch-1)*cw+i]]=1}for(i=0;i<ch;i++){bord[wl.L[i*cw]]=1;bord[wl.L[i*cw+cw-1]]=1}
 for(i=0;i<tot;i++){var id2=wl.L[i];if(id2&&DT[i]>mx[id2])mx[id2]=DT[i]}
 var el=0,big=0,bigA=0,mid=0,elL=0,reg=[],M=Math.max(cw,ch);
 wl.R.forEach(function(R){if(bord[R.id]||R.a<0.0008*tot)return;var bw=R.x1-R.x0+1,bh=R.y1-R.y0+1,Lr=Math.max(bw,bh,1),th=2*mx[R.id],e=th/Lr;
  /* wydłużone pole = ściana pręta/profilu (lub krawędź blachy) */
  if(e<0.18&&Lr>0.12*M){el++;elL+=Lr}else if(R.a>0.03*tot){big++;bigA+=R.a}else mid++;
  if(reg.length<60)reg.push([R.a,+e.toFixed(3),Lr])});
 var tx=String(m.allText||'').toUpperCase(),prof=/RHS|SHS|IPE|UPN|HEA|HEB|PROFIL|RURA|\bTUBE|SQUARE|ANGLE|\bL\s?\d+\s?[X×]\s?\d+|\d+\s?[X×]\s?\d+\s?[X×]\s?\d+/.test(tx),sheetTx=/\bT\s*=\s*\d|BLACH|SHEET|THICK|LASER/.test(tx);
 var cls='?',conf=0,why=[];
 if(el>=8||(el>=5&&prof)){cls='frame';conf=Math.min(1,0.45+0.06*el+(prof?0.15:0));why.push(el+' wydłużonych pól (ściany prętów)'+(prof?' + oznaczenie profilu':''))}
 else if(el<=2&&big>=1&&bigA>0.12*tot&&!prof){cls='plate';conf=0.6;why.push('jedna duża płaszczyzna, '+el+' krawędzi')}
 var R={cls:cls,conf:+conf.toFixed(2),el:el,elL:Math.round(elL/M*100)/100,big:big,bigA:+(bigA/tot).toFixed(3),mid:mid,ink:+(ink/tot).toFixed(3),prof:prof?1:0,sheetTx:sheetTx?1:0,box:[X0|0,Y0|0,XW|0,YH|0],grown:grown,gr:+((bx1-bx0)*(by1-by0)/Math.max(1,oA)).toFixed(2),iso:[o.x|0,o.y|0,o.w|0,o.h|0],why:why,ms:Date.now()-t0,dry:dry()?1:0};
 window.__iso204=R;L('analiza',JSON.stringify(R));return R}
window.__isoAnalyze204=isoAnalyze;
function isFrameIso(m){return !off()&&!dry()&&m&&m.iso204&&m.iso204.cls==='frame'&&!manual(m)}
function protectedKind(m){/* nie ruszam: bryły obrotowe/certoLow, szpula, mixpp ręczny, PDF b2e */return m.kind==='rot'||!!m.certoLow||m.kindAlias==='mixpp'||!!m.b2e||m.kind==='pipe'}
/* --- 2) klasyfikacja --- */
function wrapClassify(){var o=window.classify;if(typeof o!=='function'||o.__iso204)return;var w=function(m){var r=o.apply(this,arguments);try{if(off()||!m||!m.V||!m.V.iso)return r;m.iso204=isoAnalyze(m);if(!m.iso204||dry())return r;
  var I=m.iso204,S=m.kindScores;I.kind0=m.kind;I.conf0=m.kindConf;if(I.cls!=='frame'||manual(m)||protectedKind(m)||!S)return r;
  if(m.kind==='frame'||m.kind==='mixed'){I.act='ok:'+m.kind;return r}
  /* plate/bent/solid → głos izometrii na ramę (konstrukcje mieszane: rama + cechy blachy → mixed liczy classify sam) */
  var add=1.2+I.conf;S.frame+=add;if(S.frame>0.8&&(S.plate>0.8||S.bent>0.8)&&S.mixed<(S.frame+Math.max(S.plate,S.bent))/2)S.mixed=(S.frame+Math.max(S.plate,S.bent))/2;
  var ks=Object.keys(S).sort(function(a,b){return S[b]-S[a]}),tot=ks.reduce(function(s,k){return s+Math.exp(2*S[k])},0);m.kind=ks[0];m.kindConf=Math.round(100*Math.exp(2*S[ks[0]])/tot);
  var wy='izometria: '+I.why.join(', ')+' – rama z profili (ISO first)';m.kindWhy=[wy].concat((m.kindWhy||[]).filter(function(x){return !/^brak wyraźnych cech/.test(x)}));I.act='kind '+I.kind0+'→'+m.kind;L(I.act)}catch(e){L('classify err '+e)}return r};w.__iso204=1;w.__f2=o.__f2;window.classify=w}
/* --- 3) bramki G0 / pudełko --- */
function wrapGate(){var o=window.sheetGateOK;if(typeof o!=='function'||o.__iso204)return;var w=function(m){if(isFrameIso(m)&&!protectedKind(m)){m.iso204.gate='G0 wstrzymany (iso = rama)';return false}return o.apply(this,arguments)};w.__iso204=1;window.sheetGateOK=w}
function wrapCand(){var o=window.candidates;if(typeof o!=='function'||o.__iso204)return;var w=function(m){var C=o.apply(this,arguments);try{if(!isFrameIso(m)||protectedKind(m))return C;var I=m.iso204;
  C.forEach(function(c){if(c&&c.force&&/^pudełko z rozwinięcia$/.test(c.name||'')){c.force=0;C.splice(C.indexOf(c),1);C.push(c);if(m.kind==='bent'&&/rozwinięcie blachy/.test((m.kindWhy||[])[0]||'')){m.kind='frame';m.kindWhy=['izometria: rama z profili – rozwinięcie nie wymuszane'];}I.net='pudełko nie wymuszane'}});
  /* 2) gabaryt ramy z izometrii ← wymiary z rzutów */
  var IF=C.filter(function(c){return c&&c.geo&&/izometria/.test(c.name||'')&&/rama/.test(c.name||'')})[0];if(IF&&!IF.__iso204)fitDims(m,IF)}catch(e){L('cand err '+e)}return C};w.__iso204=1;w.__isoRef=o.__isoRef;w.__mid=o.__mid;window.candidates=w}
function fitDims(m,c){c.__iso204=1;var V=m.V||{},f=V.front,t=V.top,s=V.side,k=m.mmpx;if(!f||!(k>0)||!(t||s))return;if(m.scaleConf==='zgadnięta')return;
 var W=f.ob.w*k,H=f.ob.h*k,Dp=t?t.ob.h*k:s.ob.w*k;c.geo.computeBoundingBox();var b=c.geo.boundingBox,bw=b.max.x-b.min.x,bh=b.max.y-b.min.y,bd=b.max.z-b.min.z;if(!(bw>0&&bh>0&&bd>0))return;
 /* dopasuj osie po wielkości (izo może mieć zamienione szer./głęb.) */var tg=[W,H,Dp],cur=[bw,bh,bd],ok=tg.every(function(v,i){var r=v/cur[i];return r>0.4&&r<2.5});if(!ok){var alt=[Dp,H,W];if(alt.every(function(v,i){var r=v/cur[i];return r>0.4&&r<2.5}))tg=alt;else{m.iso204.fit='rzuty niezgodne z izo – zostaje gabaryt z izo';return}}
 c.geo.scale(tg[0]/bw,tg[1]/bh,tg[2]/bd);c.geo.computeBoundingBox();if(window.finalize)try{c.geo=window.finalize(c.geo)}catch(e){}c.how=(c.how||'')+' · gabaryt z rzutów '+tg.map(Math.round).join('×')+' mm (układ z izometrii)';m.iso204.fit=tg.map(Math.round)}
/* --- 4) wybór: bez „dziwnych brył” przy izometrii ramy --- */
/* 2b) gabaryt ramy ← wymiary napisane na rzutach: oś bryły, która różni się od wymiaru o 3–20%, dociągam do niego (tylko ramy przy iso = rama; wymiary ≥100 mm, pewność OCR ≥60). Wyłącznik #isofit=0 */
function snapDims(m,c){if(!c||!c.geo||c.__isoSnap||/[?&#]isofit=0/.test(q()))return;c.__isoSnap=1;var V=(m.nums||[]).filter(function(n){return n&&n.p&&+n.p.value>=100&&!n.p.prefix&&(n.conf==null||n.conf>=60)}).map(function(n){return +n.p.value});if(!V.length)return;
 c.geo.computeBoundingBox();var b=c.geo.boundingBox,S=[b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z],mx=Math.max.apply(0,S),K=[1,1,1],ch=[];
 S.forEach(function(sv,i){if(sv<0.25*mx)return;var best=null;V.forEach(function(v){var r=Math.abs(v-sv)/v;if(r>=0.03&&r<=0.2&&(!best||Math.abs(v-sv)<Math.abs(best-sv)))best=v});if(best){K[i]=best/sv;ch.push(Math.round(sv)+'→'+best)}});
 if(!ch.length)return;c.geo.scale(K[0],K[1],K[2]);c.geo.computeBoundingBox();c.how=(c.how||'')+' · gabaryt dociągnięty do wymiarów z rzutów ('+ch.join(', ')+')';m.iso204.snap=ch}
var ODD=/^(przecięcie rzutów|wyciągnięcie |blacha z obrysu|płyta|tylko widok 3D|pudełko z rozwinięcia|blacha gięta|wspornik uchowy|zespół spawany)/;
function wrapPick(){var o=window.__isoLockPick;if(o&&o.__iso204)return;var w=function(m,C,pick){var p=o?(o(m,C,pick)||pick):pick;try{if(!isFrameIso(m)||protectedKind(m)||!p||!ODD.test(p.name||''))return p;
  var FR=C.filter(function(c){return c&&c.geo&&/^rama /.test(c.name||'')}).sort(function(a,b){return (b.iou||0)-(a.iou||0)});var fr=FR[0];if(!fr)return p;
  m.iso204.pick=[p.name,fr.name,+(+(p.iou||0)).toFixed(2),+(+(fr.iou||0)).toFixed(2)];if((fr.iou||0)<(p.iou||0)-0.08)return p;/* 204b: ostrzej (liebherr 0.33→0.22 zostaje 2.1) */
  if(m.kind!=='frame'&&m.kind!=='mixed'){m.kindFrom=m.kind;m.kind='frame';m.kindWhy=['izometria: rama z profili – zamiast '+p.name].concat((m.kindWhy||[]).filter(function(x){return !/^G0:/.test(x)}))}
  if(m.scaleConf==='zgadnięta'&&String(fr.how||'').indexOf('APPROXIMATE')<0)fr.how='APPROXIMATE · brak wymiarów: gabaryt z obrysu izometrii, profil standardowy · '+(fr.how||'');
  L('pick',p.name,'->',fr.name);try{snapDims(m,fr)}catch(e){}return fr}catch(e){L('pick err '+e)}return p};w.__iso204=1;window.__isoLockPick=w}
/* --- 5) status APPROXIMATE po wyborze (skala zgadnięta + iso) --- */
function wrapRebuild(){var o=window.rebuild;if(typeof o!=='function'||o.__iso204)return;var w=function(m){var r=o.apply(this,arguments);try{if(isFrameIso(m)&&m.pick&&m.scaleConf==='zgadnięta'){var R=m.isoRef||(m.isoRef={status:'OK',hint:null,notes:[]});R.notes=R.notes||[];var nt='brak wymiarów – model z obrysu izometrii i wartości standardowych (APPROXIMATE)';if(R.notes.indexOf(nt)<0)R.notes.push(nt);if(R.status==='OK')R.status='APPROXIMATE';R.approx=1}}catch(e){}return r};w.__iso204=1;w.__isoRef=o.__isoRef;w.__isoLock=o.__isoLock;w.__mid=o.__mid;window.rebuild=w}
/* --- 6) P2: podpowiedź z izometrii --- */
var TX={pl:{h:'Izometria na rysunku',frame:'wygląda na ramę z profili',plate:'wygląda na płaską blachę / płytę',unk:'jest – użyję jej jako wzoru układu części',n:'widoczne ściany prętów',use:'Model buduję wg izometrii (układ części), wymiary biorę z rzutów.'},
 en:{h:'Isometric view on the drawing',frame:'looks like a frame made of sections',plate:'looks like a flat sheet / plate',unk:'found – I will use it as the layout reference',n:'visible member faces',use:'I build the model from the isometric view (part layout) and take dimensions from the views.'},
 de:{h:'Isometrie auf der Zeichnung',frame:'sieht aus wie ein Rahmen aus Profilen',plate:'sieht aus wie ein flaches Blech / eine Platte',unk:'vorhanden – ich nutze sie als Vorlage für die Anordnung',n:'sichtbare Stabflächen',use:'Ich baue das Modell nach der Isometrie (Anordnung) und nehme die Maße aus den Ansichten.'}};
function lang(){var l='pl';try{l=localStorage.getItem('oria_lang')||document.documentElement.lang||'pl'}catch(e){}l=String(l).slice(0,2);return TX[l]?l:'pl'}
window.__p2IsoHint=function(m,st,esc){if(off()||!m||!m.V||!m.V.iso)return '';var I=m.iso204||null,T=TX[lang()],c=I&&I.cls,tt=c==='frame'?T.frame:(c==='plate'&&(m.kind==='plate'||m.kind==='bent'))?T.plate:T.unk;esc=esc||function(s){return String(s)};
 try{if(st&&st.iso==null&&!st.__iso204)st.iso=true;if(st)st.__iso204=1}catch(e){}
 return '<div class="iso204hint" role="status" style="margin:8px 0 10px;padding:10px 12px;border-radius:10px;background:rgba(16,20,29,.92);border:1px solid rgba(34,211,238,.45);border-left:4px solid #22D3EE;color:#E6EAF2;font:500 14px/1.4 system-ui"><b>⬡ '+esc(T.h)+'</b>: '+esc(tt)+(c==='frame'&&I.el?' ('+I.el+' '+esc(T.n)+')':'')+'<br><small style="opacity:.8">'+esc(T.use)+'</small></div>'};
function all(){wrapClassify();wrapGate();wrapCand();wrapPick();wrapRebuild()}
window.addEventListener('load',function(){setTimeout(function(){setTimeout(function(){setTimeout(all,0)},0)},0)});
})();
