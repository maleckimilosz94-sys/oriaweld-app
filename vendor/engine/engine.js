/* Rama beta – silnik odczytu rysunku (opencv.js + tesseract.js, offline)
   API: RamaEngine.readDrawing(canvas|img, {log}) -> Promise<{sheetBox,titleBlockBox,views,dimensions,scaleGuess,timing}>
   Wszystkie współrzędne w pikselach obrazu wejściowego. */
(function(){
var base=(document.currentScript&&document.currentScript.src||'').replace(/engine\.js.*$/,'');
var cvP=null,ocrP=null,ppP=null;
function loadPP(){if(ppP)return ppP;ppP=new Promise(function(res,rej){function go(){try{ort.env.wasm.wasmPaths=base+'ort/';ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;}catch(e){}
  Promise.all([ort.InferenceSession.create(base+'ppocr/ch_PP-OCRv3_det_infer.onnx',{executionProviders:['wasm']}),ort.InferenceSession.create(base+'ppocr/ch_PP-OCRv3_rec_infer.onnx',{executionProviders:['wasm']}),fetch(base+'ppocr/keys.txt').then(function(r){return r.text()})])
  .then(function(a){res({det:a[0],rec:a[1],keys:a[2].split('\n').filter(function(x,i,arr){return !(i==arr.length-1&&x=='')})});}).catch(rej);}
 if(window.ort)return go();var s=document.createElement('script');s.src=base+'ort/ort.min.js';s.onload=go;s.onerror=function(){rej('brak ort')};document.head.appendChild(s);});return ppP;}
function toTensor(c,mean,std){var W=c.width,H=c.height,d=c.getContext('2d').getImageData(0,0,W,H).data,f=new Float32Array(3*W*H);for(var i=0;i<W*H;i++){for(var ch=0;ch<3;ch++)f[ch*W*H+i]=(d[i*4+ch]/255-mean[ch])/std[ch];}return new ort.Tensor('float32',f,[1,3,H,W]);}
function ppDet(pp,cv,canvas){var W=canvas.width,H=canvas.height,k=Math.min(1,1280/Math.max(W,H)),w=Math.max(32,Math.round(W*k/32)*32),h=Math.max(32,Math.round(H*k/32)*32),c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.drawImage(canvas,0,0,w,h);
 var feeds={};feeds[pp.det.inputNames[0]]=toTensor(c,[0.485,0.456,0.406],[0.229,0.224,0.225]);return pp.det.run(feeds).then(function(o){var t=o[pp.det.outputNames[0]],p=t.data,m=new cv.Mat(h,w,cv.CV_8U),md=m.data;for(var i=0;i<w*h;i++)md[i]=p[i]>0.3?255:0;
  var cs=new cv.MatVector(),hi=new cv.Mat(),out=[];cv.findContours(m,cs,hi,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);for(var i=0;i<cs.size();i++){var b=cv.boundingRect(cs.get(i));if(b.width<3||b.height<3)continue;var sc=0,n=0;for(var yy=b.y;yy<b.y+b.height;yy++)for(var xx=b.x;xx<b.x+b.width;xx++){var v=p[yy*w+xx];if(v>0.3){sc+=v;n++;}}if(!n||sc/n<0.5)continue;
   var a=cv.contourArea(cs.get(i)),per=cv.arcLength(cs.get(i),true),dd=a*1.6/Math.max(1,per);out.push({x:(b.x-dd)*W/w,y:(b.y-dd)*H/h,width:(b.width+2*dd)*W/w,height:(b.height+2*dd)*H/h,score:sc/n});}cs.delete();hi.delete();m.delete();return out;});}
function ppRec(pp,c){var h=48,w=Math.min(1600,Math.max(48,Math.round(c.width*48/c.height))),r=document.createElement('canvas');r.width=w;r.height=h;var x=r.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(c,0,0,w,h);
 var feeds={};feeds[pp.rec.inputNames[0]]=toTensor(r,[0.5,0.5,0.5],[0.5,0.5,0.5]);return pp.rec.run(feeds).then(function(o){var t=o[pp.rec.outputNames[0]],T=t.dims[1],C=t.dims[2],d=t.data,txt='',last=0,ps=[];
  for(var i=0;i<T;i++){var bi=0,bv=-1;for(var j=0;j<C;j++){var v=d[i*C+j];if(v>bv){bv=v;bi=j;}}if(bi!=0&&bi!=last){txt+=bi-1<pp.keys.length?pp.keys[bi-1]:' ';ps.push(bv);}last=bi;}
  return {t:txt.trim(),c:ps.length?100*ps.reduce(function(a,b){return a+b},0)/ps.length:0};});}
function loadCV(){if(cvP)return cvP;cvP=new Promise(function(res,rej){ if(window.cv&&window.cv.Mat)return res({cv:cv});var s=document.createElement('script');s.src=base+'opencv.js';s.onerror=function(){rej('brak opencv.js')};
 s.onload=function(){if(cv.Mat)return res({cv:cv});cv.onRuntimeInitialized=function(){res({cv:cv})};};document.head.appendChild(s);});return cvP;}
function ocrW(){if(ocrP)return ocrP;var vb=base.replace(/engine\/$/,'');ocrP=Tesseract.createWorker('eng',1,{workerPath:vb+'worker.min.js',corePath:vb+'core',langPath:vb+'lang',gzip:true})
 .then(function(w){return w.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789.,øØR×x±'}).then(function(){return w;});});return ocrP;}
function rect(r,k){return {x:Math.round(r.x/k),y:Math.round(r.y/k),w:Math.round(r.width/k),h:Math.round(r.height/k)};}
function inside(a,b){return a.x>=b.x&&a.y>=b.y&&a.x+a.w<=b.x+b.w&&a.y+a.h<=b.y+b.h;}
function parse(t){var ref=/^\s*\(.*\)\s*$/.test(t);t=t.replace(/[()]/g,'');var r0=parse0(t);if(r0)r0.ref=ref;return r0;}
function parse0(t){var s=t.replace(/[ΦφØ⌀@]/g,'ø').replace(/,/g,'.').replace(/\s+/g,'');var dg=(s.match(/[0-9]/g)||[]).length;if(dg<1||dg<s.length*0.5)return null;var m=s.match(/^([øØR]?)(\d+(?:\.\d+)?)(?:[x×](\d+(?:\.\d+)?))?(?:±(\d+(?:\.\d+)?))?/);if(!m)return null;
 var v=parseFloat(m[2]);return {prefix:m[1]?(m[1]=='R'?'R':'ø'):'',value:v,times:m[3]?parseFloat(m[3]):null,tol:m[4]?parseFloat(m[4]):null};}
function readDrawing(input,opt){opt=opt||{};var LG=opt.log||function(){};var t0=performance.now();return Promise.all([loadCV(),ocrW(),opt.noPP?null:loadPP().catch(function(e){LG('PP-OCR niedostępny: '+e);return null;})]).then(function(r){var cv=r[0].cv,w=r[1],pp=r[2];
 var src0=cv.imread(input),W0=src0.cols,H0=src0.rows,k=Math.min(3,2000/Math.max(W0,H0)),src=new cv.Mat();cv.resize(src0,src,new cv.Size(Math.round(W0*k),Math.round(H0*k)),0,0,k>1?cv.INTER_CUBIC:cv.INTER_AREA);src0.delete();
 var W=src.cols,H=src.rows,gray=new cv.Mat(),bin=new cv.Mat();var ch=new cv.MatVector();cv.split(src,ch);cv.min(ch.get(0),ch.get(1),gray);cv.min(gray,ch.get(2),gray);ch.delete();var orig=document.createElement('canvas');cv.imshow(orig,src);src.delete();
 cv.adaptiveThreshold(gray,bin,255,cv.ADAPTIVE_THRESH_MEAN_C,cv.THRESH_BINARY_INV,31,15);
 LG('cv ok '+W+'x'+H);
 // 1) długie linie = ramka arkusza
 function lines(len,horiz){var o=new cv.Mat(),kk=cv.getStructuringElement(cv.MORPH_RECT,horiz?new cv.Size(len,1):new cv.Size(1,len));cv.morphologyEx(bin,o,cv.MORPH_OPEN,kk);kk.delete();return o;}
 var lh=lines(Math.round(W*0.3),1),lv=lines(Math.round(H*0.3),0),border=new cv.Mat();cv.bitwise_or(lh,lv,border);lh.delete();lv.delete();
 var sheet={x:0,y:0,width:W,height:H},BD=border.data,x0=W,y0=H,x1=-1,y1=-1,cnt=0;for(var yy=0;yy<H;yy++)for(var xx=0;xx<W;xx++)if(BD[yy*W+xx]){cnt++;if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy;}
 if(cnt>50&&x1-x0>W*0.8&&y1-y0>H*0.8)sheet={x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};
 if(sheet.width<W||sheet.x>0){var mg=Math.round(Math.min(sheet.width,sheet.height)*0.03);cv.rectangle(border,new cv.Point(sheet.x+mg,sheet.y+mg),new cv.Point(sheet.x+sheet.width-mg,sheet.y+sheet.height-mg),new cv.Scalar(0),-1);}
 // 2) tabliczka: prostokąty średnich linii w prawym dolnym rogu
 var mh=lines(Math.round(W*0.06),1),mv=lines(Math.round(H*0.04),0),grid=new cv.Mat();cv.bitwise_or(mh,mv,grid);mh.delete();mv.delete();
 var cs=new cv.MatVector(),hi=new cv.Mat(),tb=null;cv.findContours(grid,cs,hi,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);var SA=sheet.width*sheet.height;
 for(var i=0;i<cs.size();i++){var b=cv.boundingRect(cs.get(i)),a=b.width*b.height;if(a>SA*0.01&&a<SA*0.3&&b.x+b.width>sheet.x+sheet.width*0.93&&b.y+b.height>sheet.y+sheet.height*0.93&&b.x>sheet.x+sheet.width*0.3&&b.y>sheet.y+sheet.height*0.5){if(!tb||a>tb.width*tb.height)tb=b;}}
 cs.delete();hi.delete();grid.delete();
 // 3) usuń ramkę, tabliczkę i brzeg
 var work=new cv.Mat();if(sheet.width<W)cv.subtract(bin,border,work);else bin.copyTo(work);border.delete();var pad=Math.round(Math.min(W,H)*0.01);
 function fill(x,y,w2,h2){cv.rectangle(work,new cv.Point(x,y),new cv.Point(x+w2,y+h2),new cv.Scalar(0),-1);}
 fill(0,0,W,sheet.y+pad);fill(0,sheet.y+sheet.height-pad,W,H);fill(0,0,sheet.x+pad,H);fill(sheet.x+sheet.width-pad,0,W,H);if(tb)fill(tb.x-pad,tb.y-pad,tb.width+2*pad,tb.height+2*pad);
 LG('ramka/tabliczka');
 // 4) składowe: tekst vs geometria (do wykrycia tekstu odejmujemy linie dłuższe niż ~3 znaki)
 var LL=Math.max(15,Math.round(Math.max(W,H)*0.045)),k1=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(LL,1)),k2=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(1,LL)),o1=new cv.Mat(),o2=new cv.Mat(),wt=new cv.Mat();
 cv.morphologyEx(work,o1,cv.MORPH_OPEN,k1);cv.morphologyEx(work,o2,cv.MORPH_OPEN,k2);cv.bitwise_or(o1,o2,o1);cv.subtract(work,o1,wt);k1.delete();k2.delete();var lineM=o1;o2.delete();
 var labT=new cv.Mat(),stT=new cv.Mat(),ceT=new cv.Mat(),nT=cv.connectedComponentsWithStats(wt,labT,stT,ceT,8,cv.CV_32S);
 var lab=new cv.Mat(),st=new cv.Mat(),ce=new cv.Mat(),n=cv.connectedComponentsWithStats(work,lab,st,ce,8,cv.CV_32S),geo=cv.Mat.zeros(H,W,cv.CV_8U),txt=cv.Mat.zeros(H,W,cv.CV_8U),hs=[];
 var maxT=Math.max(8,Math.max(W,H)*0.06);var comps=[];
 for(var i=1;i<n;i++){var x=st.intAt(i,0),y=st.intAt(i,1),cw=st.intAt(i,2),ch=st.intAt(i,3),ar=st.intAt(i,4);if(ar<4)continue;
  var isT=Math.max(cw,ch)<maxT&&ar<maxT*maxT*0.6;comps.push([x,y,cw,ch,isT]);if(isT)hs.push(Math.max(cw,ch));}
 hs.sort(function(a,b){return a-b});var hm=hs.length?hs[hs.length>>1]:10;
 // maski przez etykiety
 var L=lab.data32S,G=geo.data,T=txt.data,isTxt=new Uint8Array(n);comps.forEach(function(c,ix){});
 for(var i=1;i<n;i++){var cw=st.intAt(i,2),ch=st.intAt(i,3),ar=st.intAt(i,4);isTxt[i]=(ar>=4&&Math.max(cw,ch)<maxT&&ar<maxT*maxT*0.6)?1:(ar<4?2:0);}
 for(var p=0;p<L.length;p++){var l=L[p];if(!l)continue;if(isTxt[l]==0)G[p]=255;}
 var LT=labT.data32S,isT2=new Uint8Array(nT),hs2=[];for(var i=1;i<nT;i++){var cw=stT.intAt(i,2),ch2=stT.intAt(i,3),ar=stT.intAt(i,4);isT2[i]=(ar>=6&&Math.max(cw,ch2)<maxT&&Math.max(cw,ch2)>=4)?1:0;if(isT2[i])hs2.push(Math.max(cw,ch2));}
 for(var p=0;p<LT.length;p++){if(isT2[LT[p]])T[p]=255;}var tall=[],tcomp=[];for(var i=1;i<nT;i++)if(isT2[i]){var cw=stT.intAt(i,2),ch2=stT.intAt(i,3);tcomp.push({x:stT.intAt(i,0),y:stT.intAt(i,1),w:cw,h:ch2});if((ch2>=cw*0.9||cw>=ch2*0.9)&&Math.max(cw,ch2)>=6)tall.push(Math.max(cw,ch2));}
 tall.sort(function(a,b){return a-b});if(tall.length)hm=tall[Math.floor(tall.length*0.6)];labT.delete();stT.delete();ceT.delete();wt.delete();
 lab.delete();st.delete();ce.delete();work.delete();
 if(opt.debug){var dc=document.createElement('canvas');cv.imshow(dc,txt);opt.debug.txt=dc.toDataURL();var dg=document.createElement('canvas');cv.imshow(dg,geo);opt.debug.geo=dg.toDataURL();}
 // 5) grupy tekstu
 function grp(kw,kh,keep){var kt=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(kw,kh)),td=new cv.Mat();cv.dilate(txt,td,kt);kt.delete();var tc=new cv.MatVector(),th=new cv.Mat(),o=[];cv.findContours(td,tc,th,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
  for(var i=0;i<tc.size();i++){var b=cv.boundingRect(tc.get(i));var sh=Math.min(b.width,b.height),hasCh=tcomp.some(function(c){var L=Math.max(c.w,c.h),S2=Math.min(c.w,c.h);return c.x>=b.x&&c.y>=b.y&&c.x+c.w<=b.x+b.width&&c.y+c.h<=b.y+b.height&&L>=hm*0.6&&L<=hm*1.7&&S2>=L*0.3;});if(hasCh&&sh>=Math.max(6,hm*0.6)&&Math.max(b.width,b.height)<maxT*8&&keep(b))o.push(b);}tc.delete();th.delete();td.delete();return o;}
 var hmS=Math.max(3,Math.round(hm*1.0)),hmT=Math.max(1,Math.round(hm*0.25));
 var gH=grp(hmS,hmT,function(b){return b.width>=b.height*0.8}),gV=grp(hmT,hmS,function(b){return b.height>b.width*1.3});
 function iou(a,b){var x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),x2=Math.min(a.x+a.width,b.x+b.width),y2=Math.min(a.y+a.height,b.y+b.height);if(x2<=x||y2<=y)return 0;var I=(x2-x)*(y2-y);return I/Math.min(a.width*a.height,b.width*b.height);}
 var groups=gH.concat(gV.filter(function(v){return !gH.some(function(h){return iou(h,v)>0.5&&h.width>h.height*1.5})}));
 // 6) widoki
 var kv=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(Math.round(Math.min(W,H)*0.025),Math.round(Math.min(W,H)*0.025))),gd=new cv.Mat();cv.dilate(geo,gd,kv);kv.delete();
 var vc=new cv.MatVector(),vh=new cv.Mat(),views=[];cv.findContours(gd,vc,vh,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
 for(var i=0;i<vc.size();i++){var b=cv.boundingRect(vc.get(i));if(b.width*b.height>SA*0.004&&b.width>hm*3&&b.height>hm*3)views.push({bb:b});}vc.delete();vh.delete();gd.delete();
 LG('widoki '+views.length);
 // 8) linie wymiarowe (Hough na geometrii)
 var hl=new cv.Mat();cv.HoughLinesP(geo,hl,1,Math.PI/180,40,Math.round(Math.min(W,H)*0.03),3);var segs=[];
 for(var i=0;i<hl.rows;i++){var x1=hl.data32S[i*4],y1=hl.data32S[i*4+1],x2=hl.data32S[i*4+2],y2=hl.data32S[i*4+3],dx=x2-x1,dy=y2-y1;if(Math.abs(dy)<=Math.abs(dx)*0.05)segs.push({h:1,a:[Math.min(x1,x2),(y1+y2)/2],b:[Math.max(x1,x2),(y1+y2)/2]});else if(Math.abs(dx)<=Math.abs(dy)*0.05)segs.push({h:0,a:[(x1+x2)/2,Math.min(y1,y2)],b:[(x1+x2)/2,Math.max(y1,y2)]});}
 hl.delete();var txtKeep=txt;bin.delete();
 // 9) OCR każdej grupy tekstu (poziomo / pionowo), psm 7
 var tbK=tb?{x:tb.x,y:tb.y,width:tb.width,height:tb.height}:null;
 var gcan=document.createElement('canvas');gcan.width=W;gcan.height=H;var ld=new cv.Mat(),kd=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(3,3));cv.dilate(lineM,ld,kd);kd.delete();gray.setTo(new cv.Scalar(255),ld);ld.delete();lineM.delete();cv.imshow(gcan,gray);txtKeep.delete();gray.delete();
 groups=groups.filter(function(g){return !(tbK&&g.x>=tbK.x-pad&&g.y>=tbK.y-pad&&g.x+g.width<=tbK.x+tbK.width+pad&&g.y+g.height<=tbK.y+tbK.height+pad);}).slice(0,opt.maxGroups||150);
 function crop(g,rot){var p=3,c=document.createElement('canvas'),x=Math.max(0,g.x-p),y=Math.max(0,g.y-p),cw=Math.min(W-x,g.width+2*p),ch=Math.min(H-y,g.height+2*p),sh=rot?cw:ch,s=Math.max(1,48/sh);
  var ow=Math.round((rot?ch:cw)*s)+20,oh=Math.round((rot?cw:ch)*s)+20;c.width=ow;c.height=oh;var cx=c.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,ow,oh);cx.save();cx.translate(ow/2,oh/2);if(rot)cx.rotate(rot*Math.PI/2);cx.imageSmoothingEnabled=true;cx.drawImage(srcCan,x,y,cw,ch,-cw*s/2,-ch*s/2,cw*s,ch*s);cx.restore();return c;}
 function rotCW(c){var o=document.createElement('canvas');o.width=c.height;o.height=c.width;var x=o.getContext('2d');x.translate(o.width,0);x.rotate(Math.PI/2);x.drawImage(c,0,0);return o;}
 function ov(a,b){var x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),x2=Math.min(a.x+a.width,b.x+b.width),y2=Math.min(a.y+a.height,b.y+b.height);return x2>x&&y2>y?(x2-x)*(y2-y)/Math.min(a.width*a.height,b.width*b.height):0;}
 var detP=pp?ppDet(pp,cv,orig).then(function(b1){return ppDet(pp,cv,rotCW(orig)).then(function(b2){var Ho=orig.height;b2.forEach(function(r){var o={x:r.y,y:Ho-(r.x+r.width),width:r.height,height:r.width,score:r.score,rot:1};if(o.height>o.width*1.2&&!b1.some(function(q){return ov(q,o)>0.3}))b1.push(o);});return b1;});}).then(function(bx){LG('PP det '+bx.length);return bx.filter(function(g){return !(tbK&&g.x>=tbK.x-pad&&g.y>=tbK.y-pad&&g.x+g.width<=tbK.x+tbK.width+pad&&g.y+g.height<=tbK.y+tbK.height+pad);}).map(function(g){return {x:Math.round(g.x),y:Math.round(g.y),width:Math.round(g.width),height:Math.round(g.height)}});}).catch(function(e){LG('PP det błąd '+e);pp=null;return groups;}):Promise.resolve(groups);
 function ocrCrop(c){return pp?ppRec(pp,c):w.recognize(c).then(function(o){return {t:(o.data.text||'').trim(),c:o.data.confidence};});}
 var srcCan=pp?orig:gcan;var dims=[];var chain=detP.then(function(gs){groups=gs.slice(0,opt.maxGroups||200);LG('ocr start '+groups.length+(pp?' (PP-OCR)':' (tesseract)'));});
 chain=chain.then(function(){var c2=Promise.resolve();groups.forEach(function(g){c2=c2.then(function(){var vert=g.height>g.width*1.3,tries=vert?[-1,1]:[0];var best=null;var tc2=Promise.resolve();
  tries.forEach(function(rt){tc2=tc2.then(function(){return ocrCrop(crop(g,rt)).then(function(o){var t=o.t;if(!best||o.c>best.c)best={t:t,c:o.c,rt:rt};if(opt.debug){(opt.debug.crops=opt.debug.crops||[]).push([crop(g,rt).toDataURL(),t,o.c]);}});});});
  return tc2.then(function(){if(!best)return;var pr=parse(best.t);if(!pr)return;var v=pr.value;
   var why=null;if(v<0.5)why='za mała';else if(/^\d{4}$/.test(best.t.replace(/\D/g,''))&&v>=1800&&v<=2100)why='rok?';else if(best.t.replace(/\D/g,'').length==1&&!pr.prefix&&g.width<hm*1.6&&g.height<hm*1.6)why='numer pozycji?';else if(best.t.replace(/\D/g,'').length==1&&best.c<60)why='pojedyncza cyfra, niepewna';
   var d={value:v,text:best.t,prefix:pr.prefix,times:pr.times,tol:pr.tol,bbox:{x:g.x,y:g.y,w:g.width,h:g.height},angle:vert?90:0,confidence:Math.round(best.c),dimLine:null,linkedEdge:null,reject:why};
   // linia wymiarowa: równoległa, blisko tekstu, obejmuje jego środek
   var cx=g.x+g.width/2,cy=g.y+g.height/2,bl=null,bd=1e9,th=vert?g.width:g.height;segs.forEach(function(s){if(s.h==(vert?1:0))return;var dd,cov;
    if(s.h){dd=Math.abs(s.a[1]-cy);cov=cx>=s.a[0]-th&&cx<=s.b[0]+th;}else{dd=Math.abs(s.a[0]-cx);cov=cy>=s.a[1]-th&&cy<=s.b[1]+th;}if(cov&&dd<th*2.2&&dd<bd){bd=dd;bl=s;}});
   if(bl){d.dimLine=[bl.a,bl.b];}dims.push(d);});});});return c2;});
 return chain.then(function(){
  // scalanie odcinków: wydłuż linię wymiarową do skrajnych współliniowych segmentów
  dims.forEach(function(d){if(!d.dimLine)return;var a=d.dimLine[0],b=d.dimLine[1],h=a[1]==b[1];segs.forEach(function(s){if(s.h!=(h?1:0))return;if(h&&Math.abs(s.a[1]-a[1])<2&&s.a[0]<=b[0]+4&&s.b[0]>=a[0]-4){a=[Math.min(a[0],s.a[0]),a[1]];b=[Math.max(b[0],s.b[0]),b[1]];}if(!h&&Math.abs(s.a[0]-a[0])<2&&s.a[1]<=b[1]+4&&s.b[1]>=a[1]-4){a=[a[0],Math.min(a[1],s.a[1])];b=[b[0],Math.max(b[1],s.b[1])];}});d.dimLine=[a,b];});

  // 7) tłumienie linii wymiarowych, pomocniczych, osi i kreskowania, potem obrys
  var sp=geo.clone();var Sc=new cv.Scalar(0);dims.forEach(function(d){if(!d.dimLine||d.reject)return;cv.line(sp,new cv.Point(d.dimLine[0][0],d.dimLine[0][1]),new cv.Point(d.dimLine[1][0],d.dimLine[1][1]),Sc,5);
   segs.forEach(function(s2){if(s2.h==(d.dimLine[0][1]==d.dimLine[1][1]?1:0))return;[d.dimLine[0],d.dimLine[1]].forEach(function(e){if(Math.min(Math.hypot(s2.a[0]-e[0],s2.a[1]-e[1]),Math.hypot(s2.b[0]-e[0],s2.b[1]-e[1]))<10||(s2.h?Math.abs(s2.a[1]-e[1])<4&&e[0]>=s2.a[0]-4&&e[0]<=s2.b[0]+4:Math.abs(s2.a[0]-e[0])<4&&e[1]>=s2.a[1]-4&&e[1]<=s2.b[1]+4))cv.line(sp,new cv.Point(s2.a[0],s2.a[1]),new cv.Point(s2.b[0],s2.b[1]),Sc,5);});});});
  var hd=new cv.Mat();cv.HoughLinesP(geo,hd,1,Math.PI/180,25,Math.round(Math.min(W,H)*0.01),2);var nh=0,DG=[];for(var i=0;i<hd.rows;i++){var x1=hd.data32S[i*4],y1=hd.data32S[i*4+1],x2=hd.data32S[i*4+2],y2=hd.data32S[i*4+3],an=Math.atan2(y2-y1,x2-x1)*180/Math.PI;if(an<0)an+=180;var a9=an%90;if(a9>20&&a9<70&&Math.hypot(x2-x1,y2-y1)<Math.min(W,H)*0.15)DG.push([x1,y1,x2,y2,an]);}
  var hsp=Math.max(10,Math.min(W,H)*0.03);DG.forEach(function(g){var mx=(g[0]+g[2])/2,my=(g[1]+g[3])/2,nb=DG.filter(function(o){if(o===g||Math.abs(o[4]-g[4])>4)return false;var ox=(o[0]+o[2])/2-mx,oy=(o[1]+o[3])/2-my,r=g[4]*Math.PI/180,perp=Math.abs(-Math.sin(r)*ox+Math.cos(r)*oy);return perp>2&&perp<hsp&&Math.hypot(ox,oy)<hsp*3;}).length;if(nb>=2){cv.line(sp,new cv.Point(g[0],g[1]),new cv.Point(g[2],g[3]),Sc,3);nh++;}});hd.delete();
  var l2=new cv.Mat(),s2m=new cv.Mat(),c2m=new cv.Mat(),n2=cv.connectedComponentsWithStats(sp,l2,s2m,c2m,8,cv.CV_32S),kill=new Uint8Array(n2),nd=0;for(var i=1;i<n2;i++){var a1=s2m.intAt(i,2),b1=s2m.intAt(i,3),mx=Math.max(a1,b1),mn=Math.max(1,Math.min(a1,b1));if(mx<LL&&mx/mn>3){kill[i]=1;nd++;}}var LD=l2.data32S,SD=sp.data;for(var p=0;p<LD.length;p++)if(kill[LD[p]])SD[p]=0;l2.delete();s2m.delete();c2m.delete();
  var thk=new cv.Mat(),k22=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(3,3));cv.morphologyEx(sp,thk,cv.MORPH_OPEN,k22);k22.delete();if(opt.thick&&cv.countNonZero(thk)>cv.countNonZero(sp)*0.3){sp.delete();sp=thk;LG('obrys: grube linie');}else thk.delete();
  LG('tłumienie: kreskowanie '+nh+', kreski osi '+nd);var geoO=sp;
 // 7) obrys części w każdym widoku: największy zamknięty kontur
 var gc=new cv.Mat(),kc=Math.max(3,Math.round(Math.min(W,H)*0.008)),k3=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(kc,kc));cv.morphologyEx(geoO,gc,cv.MORPH_CLOSE,k3);k3.delete();
 var ec=new cv.MatVector(),eh=new cv.Mat();cv.findContours(gc,ec,eh,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);var filled=cv.Mat.zeros(H,W,cv.CV_8U);cv.drawContours(filled,ec,-1,new cv.Scalar(255),-1);ec.delete();eh.delete();
 var ko=Math.max(5,Math.round(Math.min(W,H)*0.012)),k5=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(ko,ko));cv.morphologyEx(filled,gc,cv.MORPH_OPEN,k5);k5.delete();var filled0=filled;
 var oc=new cv.MatVector(),oh=new cv.Mat();cv.findContours(gc,oc,oh,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);var cand=[];
 for(var i=0;i<oc.size();i++){var c=oc.get(i),a=cv.contourArea(c);if(a<SA*0.002)continue;var b=cv.boundingRect(c);var ap=new cv.Mat();cv.approxPolyDP(c,ap,Math.max(2,0.006*cv.arcLength(c,true)),true);var pts=[];for(var j=0;j<ap.rows;j++)pts.push([ap.data32S[j*2],ap.data32S[j*2+1]]);ap.delete();cand.push({a:a,bb:b,pts:pts,fill:a/(b.width*b.height)});}
 oc.delete();oh.delete();gc.delete();
 // cienkie rzuty (blacha) znikają po otwarciu – drugi zestaw kandydatów bez otwarcia
 var oc2=new cv.MatVector(),oh2=new cv.Mat(),cand2=[];cv.findContours(filled0,oc2,oh2,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);for(var i=0;i<oc2.size();i++){var c=oc2.get(i),a=cv.contourArea(c);if(a<SA*0.0005)continue;var b=cv.boundingRect(c);if(Math.max(b.width,b.height)<Math.min(W,H)*0.05)continue;var ap=new cv.Mat();cv.approxPolyDP(c,ap,Math.max(1.5,0.004*cv.arcLength(c,true)),true);var pts=[];for(var j=0;j<ap.rows;j++)pts.push([ap.data32S[j*2],ap.data32S[j*2+1]]);ap.delete();cand2.push({a:a,bb:b,pts:pts,thin:1});}oc2.delete();oh2.delete();filled0.delete();

 views.forEach(function(v){var best=null;cand.forEach(function(c){var b=c.bb,vb=v.bb;if(b.x>=vb.x-2&&b.y>=vb.y-2&&b.x+b.width<=vb.x+vb.width+2&&b.y+b.height<=vb.y+vb.height+2&&(!best||c.a>best.a))best=c;});
  if(!best)cand2.forEach(function(c){var b=c.bb,vb=v.bb;if(b.x>=vb.x-2&&b.y>=vb.y-2&&b.x+b.width<=vb.x+vb.width+2&&b.y+b.height<=vb.y+vb.height+2&&(!best||c.a>best.a))best=c;});
  v.outline=best?best.pts:null;v.contours=cand.filter(function(c){return c!==best&&c.bb.x>=v.bb.x&&c.bb.y>=v.bb.y&&c.bb.x+c.bb.width<=v.bb.x+v.bb.width&&c.bb.y+c.bb.height<=v.bb.y+v.bb.height}).slice(0,10).map(function(c){return c.pts});});
 views=views.filter(function(v){return v.outline});
 if(!opt.noSplitViews){var extra=[];views.forEach(function(v){if(!v.outline)return;var vb=v.bb,bo=null;cand.forEach(function(c){if(c.pts===v.outline)bo=c;});if(!bo)return;var B=bo.bb;cand.forEach(function(c){if(c===bo)return;var b=c.bb;if(!(b.x>=vb.x-2&&b.y>=vb.y-2&&b.x+b.width<=vb.x+vb.width+2&&b.y+b.height<=vb.y+vb.height+2))return;if(c.a<bo.a*0.3)return;var ox=Math.min(b.x+b.width,B.x+B.width)-Math.max(b.x,B.x),oy=Math.min(b.y+b.height,B.y+B.height)-Math.max(b.y,B.y);var side=ox<=0.1*Math.min(b.width,B.width)&&oy>0.6*Math.min(b.height,B.height)&&b.height>0.6*B.height,stack=oy<=0.1*Math.min(b.height,B.height)&&ox>0.6*Math.min(b.width,B.width)&&b.width>0.6*B.width;if(!side||b.height<0.8*B.height||views.length<2)return;if(extra.some(function(e){var q=e.outB;return Math.min(q.x+q.width,b.x+b.width)>Math.max(q.x,b.x)&&Math.min(q.y+q.height,b.y+b.height)>Math.max(q.y,b.y)}))return;
   var nb=side?{x:b.x,y:vb.y,width:b.width,height:vb.height}:{x:vb.x,y:b.y,width:vb.width,height:b.height};extra.push({bb:nb,outline:c.pts,outB:b,contours:[],splitFrom:1});});if(extra.length){var cut=extra.filter(function(e){return e.splitFrom});}});
  extra.forEach(function(e){views.forEach(function(v){if(v.outline&&!v.splitFrom){var vb=v.bb,b=e.outB;if(b.x>=vb.x-2&&b.x+b.width<=vb.x+vb.width+2&&b.y>=vb.y-2&&b.y+b.height<=vb.y+vb.height+2){var B=null;cand.forEach(function(c){if(c.pts===v.outline)B=c.bb;});if(B){if(b.x>=B.x+B.width){var nx=Math.max(B.x+B.width,Math.round((B.x+B.width+b.x)/2));e.bb.x=nx;e.bb.width=vb.x+vb.width-nx;v.bb={x:vb.x,y:vb.y,width:nx-vb.x,height:vb.height};}else if(b.x+b.width<=B.x){var nx2=Math.round((b.x+b.width+B.x)/2);e.bb.x=vb.x;e.bb.width=nx2-vb.x;v.bb={x:nx2,y:vb.y,width:vb.x+vb.width-nx2,height:vb.height};}}}}});v=null;});
  if(extra.length)LG('podział widoków +'+extra.length+' '+JSON.stringify(extra.map(function(e){return [e.outB.x,e.outB.y,e.outB.width,e.outB.height]})));views=views.concat(extra);}
 // nazwy rzutów (układ europejski: przód lewy-górny, góra pod nim, bok po prawej)
 views.sort(function(a,b){return (b.bb.width*b.bb.height)-(a.bb.width*a.bb.height)});var fr=views[0];
 if(fr){views.forEach(function(v){if(v===fr){v.name='przod';return;}var cx=v.bb.x+v.bb.width/2,cy=v.bb.y+v.bb.height/2;
  if(cx>fr.bb.x&&cx<fr.bb.x+fr.bb.width)v.name=cy>fr.bb.y+fr.bb.height?'gora':'gora?';else if(cy>fr.bb.y&&cy<fr.bb.y+fr.bb.height)v.name='bok';else v.name='inny';});}
  geoO.delete();geo.delete();
  views.sort(function(a,b){return (b.bb.width*b.bb.height)-(a.bb.width*a.bb.height)});var fr=views[0];
  if(fr){views.forEach(function(v){if(v===fr){v.name='przod';return;}var cx=v.bb.x+v.bb.width/2,cy=v.bb.y+v.bb.height/2;
   if(cx>fr.bb.x&&cx<fr.bb.x+fr.bb.width)v.name=cy>fr.bb.y+fr.bb.height?'gora':'gora?';else if(cy>fr.bb.y&&cy<fr.bb.y+fr.bb.height)v.name='bok';else v.name='inny';});}
  // krawędź obrysu o tej samej długości i orientacji
  dims.forEach(function(d){if(!d.dimLine)return;var L=Math.hypot(d.dimLine[1][0]-d.dimLine[0][0],d.dimLine[1][1]-d.dimLine[0][1]),h=d.dimLine[0][1]==d.dimLine[1][1],best=null;
   views.forEach(function(v,vi){var o=v.outline;for(var i=0;i<o.length;i++){var p=o[i],q=o[(i+1)%o.length],ex=q[0]-p[0],ey=q[1]-p[1],el=Math.hypot(ex,ey);if(el<5)continue;var eh=Math.abs(ey)<el*0.1,ev=Math.abs(ex)<el*0.1;if(h?!eh:!ev)continue;
    var proj=h?Math.abs(ex):Math.abs(ey),err=Math.abs(proj-L)/L;if(err<0.08&&(!best||err<best.err))best={view:vi,edge:i,err:err};}});if(best)d.linkedEdge=best;});
  // skala z wymiarów zgodnych ze sobą
  var rs=dims.filter(function(d){return d.dimLine&&!d.reject&&!d.prefix}).map(function(d){return d.value/Math.hypot(d.dimLine[1][0]-d.dimLine[0][0],d.dimLine[1][1]-d.dimLine[0][1])});
  var sg=null;if(rs.length){var srt=rs.slice().sort(function(a,b){return a-b}),best=null;srt.forEach(function(r){var c=srt.filter(function(x){return Math.abs(x-r)/r<0.06}).length;if(!best||c>best.c)best={r:r,c:c};});
   var grp=srt.filter(function(x){return Math.abs(x-best.r)/best.r<0.06}),med=grp[grp.length>>1];sg={mmPerPx:med*k,support:grp.length,of:rs.length,confidence:grp.length>=2?(grp.length/rs.length>=0.5?'średnia':'niska'):'niska'};
   dims.forEach(function(d){if(d.dimLine&&!d.reject&&!d.prefix){var r=d.value/Math.hypot(d.dimLine[1][0]-d.dimLine[0][0],d.dimLine[1][1]-d.dimLine[0][1]);d.consistent=Math.abs(r-med)/med<0.06;}});}
  // przeskaluj do obrazu wejściowego
  function P(p){return [Math.round(p[0]/k),Math.round(p[1]/k)];}
  var out={sheetBox:rect(sheet,k),titleBlockBox:tb?rect(tb,k):null,
   views:views.map(function(v){return {name:v.name,bbox:rect(v.bb,k),outlinePolygon:v.outline.map(P),contours:v.contours.map(function(c){return c.map(P)})};}),
   dimensions:dims.map(function(d){d.bbox={x:Math.round(d.bbox.x/k),y:Math.round(d.bbox.y/k),w:Math.round(d.bbox.w/k),h:Math.round(d.bbox.h/k)};if(d.dimLine)d.dimLine=d.dimLine.map(P);return d;}),
   scaleGuess:sg,stats:{textGroups:groups.length,lines:segs.length,charH:Math.round(hm/k)},timing:Math.round(performance.now()-t0)};
  return out;});});}
// OCR na dowolnym wycinku (do powiększonych kafelków): det + det po obrocie 90°, rec w obu kierunkach dla pionowych
function ppocr(c){return Promise.all([loadCV(),loadPP()]).then(function(r){var cv=r[0].cv,pp=r[1];
 function rotC(c,cw){var o=document.createElement('canvas');o.width=c.height;o.height=c.width;var x=o.getContext('2d');if(cw){x.translate(o.width,0);x.rotate(Math.PI/2);}else{x.translate(0,o.height);x.rotate(-Math.PI/2);}x.drawImage(c,0,0);return o;}
 function cropC(b){var p=Math.round(Math.min(b.width,b.height)*0.15),o=document.createElement('canvas');o.width=Math.max(4,Math.round(b.width+2*p));o.height=Math.max(4,Math.round(b.height+2*p));var x=o.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,o.width,o.height);x.drawImage(c,b.x-p,b.y-p,o.width,o.height,0,0,o.width,o.height);return o;}
 var rc=document.createElement('canvas');rc.width=c.height;rc.height=c.width;var rx=rc.getContext('2d');rx.translate(rc.width,0);rx.rotate(Math.PI/2);rx.drawImage(c,0,0);
 return ppDet(pp,cv,c).then(function(b1){return ppDet(pp,cv,rc).then(function(b2){b2.forEach(function(r){var o={x:r.y,y:c.height-(r.x+r.width),width:r.height,height:r.width,score:r.score};if(o.height>o.width*1.2)b1.push(o);});return b1;});})
 .then(function(bx){var out=[],ch=Promise.resolve();bx.forEach(function(b){ch=ch.then(function(){var cr=cropC(b),vert=b.height>b.width*1.2,cands=vert?[rotC(cr,false),rotC(cr,true)]:[cr],best=null,q=Promise.resolve();
   cands.forEach(function(cc,ci){q=q.then(function(){return ppRec(pp,cc).then(function(o){var pv=parse(o.t);var sc=o.c+(pv?20:0);if(!best||sc>best.sc)best={t:o.t,c:o.c,sc:sc,p:pv,dir:vert?(ci?'cw':'ccw'):'h'};});});});
   return q.then(function(){if(best)out.push({box:{x:b.x,y:b.y,w:b.width,h:b.height},text:best.t,conf:best.c,parsed:best.p,vert:vert});});});});return ch.then(function(){return out;});});});}
window.RamaEngine={readDrawing:readDrawing,loadCV:loadCV,ppocr:ppocr,parse:parse};
})();
