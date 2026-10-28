/* 28.10 noc: F1/F1n maska domyślnie WYŁ. – odrzucała prawdziwe wymiary 562/662 na saven_frame. Włącz: window.__p1Mask=1 */
if(window.__noP1Mask===undefined&&!window.__p1Mask)window.__noP1Mask=1;
/* P1 filtry testowe (gałąź silnik_p0). Wyłączniki: window.__noP1Mask, __noP1Ocr, __noP1Line, __noP1Gate */
(function(){var E=window.RamaEngine;if(!E||E.__p1)return;var orig=E.readDrawing;E.__p1=1;window.__p1log=[];
function L(m){window.__p1log.push(m);}
function inR(b,r,pad){if(!r)return false;var cx=b.x+b.w/2,cy=b.y+b.h/2;return cx>=r.x-pad&&cx<=r.x+r.w+pad&&cy>=r.y-pad&&cy<=r.y+r.h+pad;}
E.readDrawing=function(src,opt){return orig.call(E,src,opt).then(function(res){try{var ds=res.dimensions||[];
 ds.forEach(function(d){if(d.reject)return;
  // F1: maska – wymiar poza arkuszem albo w tabelce rysunkowej
  if(!window.__noP1Mask){if(res.sheetBox&&!inR(d.bbox,res.sheetBox,-2)){d.reject='P1 poza arkuszem';L('F1 out '+d.text);return;}
   if(res.titleBlockBox&&inR(d.bbox,res.titleBlockBox,2)){d.reject='P1 tabelka';L('F1 tb '+d.text);return;}}
  // F3: OCR tylko cyfry i symbole wymiarowe
  if(!window.__noP1Ocr){var t=String(d.text||''),bad=t.replace(/[0-9\s.,xX×Ø⌀øR±+\-°()\/MmtT:]/g,'');
   if(bad.length&&bad.length>=t.replace(/\s/g,'').length*0.3){d.reject='P1 znaki nie-wymiarowe';L('F3 '+t);}}
  // F2 (stub, lekki): wymiar bez linii wymiarowej i o niskiej pewności OCR → odrzuć
  if(!window.__noP1Line&&!d.reject&&!d.dimLine&&d.confidence<50){d.reject='P1 bez linii wymiarowej';L('F2 '+d.text);}
 });}catch(e){L('P1 err '+e);}return res;});};
// F4: bramka niepewności – nie zatwierdzaj automatycznie
var ar;Object.defineProperty(window,'__autoResult',{configurable:true,get:function(){return ar},set:function(v){try{if(v&&!window.__noP1Gate&&window.AUTO&&AUTO.last){var m=AUTO.last,c=null,f=null;f=m.dimChk&&m.dimChk.factor;var hard=m.dimChk?(m.dimChk.contra||[]).filter(function(v){return (m.dimChk.ign||[]).indexOf(v)<0}).length:null;try{c=typeof samoConf=="function"?samoConf(m):(m.viou!=null?m.viou*(f!=null?f:1):null)}catch(e){}
  var vi=m.viou!=null?m.viou:null,ask=window.__p1GateOld?((c!=null&&c<0.7)||(f!=null&&f<0.8)):(hard!=null?(hard>0||(vi!=null&&vi<0.25)):(c!=null&&c<0.7));v.p1gate={conf:c!=null?+c.toFixed(2):null,dimFactor:f,viou:vi!=null?+vi.toFixed(2):null,hard:hard,status:ask?'ASK':'OK'};}}catch(e){}ar=v;}});
})();
/* P1 tor liczb (zoomOCR → info.nums): F1 maska + D1 odczyt wymiarów ukośnych. Wyłączniki: __noP1Mask, __noP1Diag */
window.__P1nums=function(nums,info){nums=nums||[];var res=info&&info.res,log=window.__p1log;
 try{if(!window.__noP1Mask&&res){var sb=res.sheetBox,tb=res.titleBlockBox,n0=nums.length;nums=nums.filter(function(a){var cx=a.x+a.w/2,cy=a.y+a.h/2;
   if(sb&&(cx<sb.x||cy<sb.y||cx>sb.x+sb.w||cy>sb.y+sb.h)){log.push('F1n out '+a.text);return false;}
   if(tb&&tb.w*tb.h<(sb?sb.w*sb.h:1e12)*0.5&&cx>=tb.x&&cy>=tb.y&&cx<=tb.x+tb.w&&cy<=tb.y+tb.h){log.push('F1n tb '+a.text);return false;}return true;});}}catch(e){log.push('F1n err '+e);}
 try{if(!window.__noP1Digit&&info){var T=((info.allBoxes||[]).map(function(b){return b.text}).join(' ')+' '+(info.title&&info.title.text||'')).toUpperCase().replace(/,/g,'.');if(window.__p1DiagDbg)log.push('C1txt '+T.slice(0,300));
  var PS={};(T.match(/(?:RO|RHS|SHS|CHS|RURA|[ØΦ⌀])\s*\d+(?:\.\d)?(?:\s*[X×]\s*\d+(?:\.\d)?){0,2}/g)||[]).forEach(function(s){(s.match(/\d+(?:\.\d)?/g)||[]).forEach(function(x){PS[+x]=1;PS[Math.round(+x)]=1;});});
  var CF={'9':['0','8'],'0':['9','8','6'],'5':['9','6'],'6':['5','0','8'],'8':['0','6','9','3'],'3':['8']};
  nums.forEach(function(n){var v=n.p&&n.p.value;if(!(v>0)||PS[v])return;var s=String(v),hit=[];for(var i=0;i<s.length;i++)(CF[s[i]]||[]).forEach(function(d){var w=+(s.slice(0,i)+d+s.slice(i+1));if(w>0&&PS[w]&&String(w).length==s.length)hit.push(w);});
   if(hit.length==1&&!nums.some(function(o){return o!==n&&o.p&&o.p.value==hit[0]})){log.push('C1 '+v+'→'+hit[0]);n.p.value=hit[0];n.text=String(hit[0]);n.c1=v;}});}}catch(e){log.push('C1 err '+e);}
 if(window.__noP1Diag||!info||!info.sheet)return nums;
 return RamaEngine.loadCV().then(function(r){var cv=(r&&r.cv)||r||window.cv,sh=info.sheet,W=sh.width,H=sh.height;
  var src=cv.imread(sh),g=new cv.Mat(),bw=new cv.Mat(),L=new cv.Mat();cv.cvtColor(src,g,cv.COLOR_RGBA2GRAY);cv.threshold(g,bw,180,255,cv.THRESH_BINARY_INV);
  cv.HoughLinesP(bw,L,1,Math.PI/360,60,Math.max(60,W*0.04),3);var segs=[];
  for(var i=0;i<L.rows;i++){var x1=L.data32S[i*4],y1=L.data32S[i*4+1],x2=L.data32S[i*4+2],y2=L.data32S[i*4+3],a=Math.atan2(y2-y1,x2-x1)*180/Math.PI;a=((a%180)+180)%180;
   if(a<12||a>168||(a>78&&a<102))continue;var len=Math.hypot(x2-x1,y2-y1),mx=(x1+x2)/2,my=(y1+y2)/2;
   if(res&&res.titleBlockBox){var t=res.titleBlockBox;if(mx>=t.x&&my>=t.y&&mx<=t.x+t.w&&my<=t.y+t.h)continue;}
   if(segs.some(function(s){return Math.abs(s.a-a)<4&&Math.hypot(s.mx-mx,s.my-my)<40})){continue;}segs.push({a:a,len:len,mx:mx,my:my});}
  [src,g,bw,L].forEach(function(q){q.delete()});segs.sort(function(p,q){return q.len-p.len});segs=segs.slice(0,10);log.push('D1 seg '+segs.length);if(window.__p1DiagDbg)segs.forEach(function(s){log.push('S '+Math.round(s.a)+' '+Math.round(s.len)+' '+Math.round(s.mx)+','+Math.round(s.my))});
  var have={};nums.forEach(function(n){if(n.p&&n.p.value>0)have[Math.round(n.p.value)]=1;});var ch=Promise.resolve(),k=2.5;
  segs.forEach(function(s){ch=ch.then(function(){var cw=Math.round(Math.min(s.len*0.8,500)),chh=window.__p1DiagH||150,c=document.createElement('canvas');c.width=Math.round(cw*k);c.height=Math.round(chh*k);var x=c.getContext('2d');
    x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.scale(k,k);x.translate(cw/2,chh/2);var ang=s.a>90?s.a-180:s.a;x.rotate(-ang*Math.PI/180);x.drawImage(sh,-s.mx,-s.my);
    if(window.__p1DiagDbg){(window.__p1crops=window.__p1crops||[]).push(c.toDataURL());}return RamaEngine.ppocr(c).then(function(rr){if(window.__p1DiagDbg)log.push('n '+(rr||[]).length);(rr||[]).forEach(function(o){var t=String(o.text||'').trim();if(window.__p1DiagDbg)log.push('D1raw '+Math.round(s.a)+' '+t+' '+Math.round(o.conf||0));if(!/^\d{2,4}([.,]\d)?$/.test(t))return;var v=parseFloat(t.replace(',','.'));if(!(v>=10&&v<=6000)||have[Math.round(v)])return;
      if((o.conf||0)<60)return;have[Math.round(v)]=1;log.push('D1 '+t+' @'+Math.round(s.a)+'°');nums.push({x:s.mx-10,y:s.my-10,w:20,h:20,text:t,conf:o.conf,p:{value:v},vert:false,slant:s.a,src:'p1diag'});});}).catch(function(e){log.push('D1 ocr err '+e)});});});
  return ch.then(function(){return nums;});}).catch(function(e){log.push('D1 err '+e);return nums;});};
/* P1-M1: zespół RURA Ø + 2× WSPORNIK L (+ płyta) – kandydat gabarytu dla kind=mixed. Wyłącznik: __noP1Mixed */
window.P1mixedCand=function(m){if(window.__noP1Mixed||!m||m.kind!='mixed'||typeof THREE=='undefined')return null;
 var tx=(m.allText||'').toUpperCase().replace(/,/g,'.'),tr=tx.match(/RUR[AYE]\s*[Ø⌀Φ0O]?\s*(\d{2,3}(?:\.\d)?)/),br=tx.match(/(\d)\s*[X×]\s*WSPORNIK\w*\s*L\s*(\d{2,3})\s*[X×]\s*(\d{2,3})(?:\s*[X×]\s*(\d{1,2}))?/);
 if(!tr||!br)return null;var D=+tr[1],nB=+br[1],a=+br[2],b=+br[3],t=+(br[4]||6);var vals=(m.nums||[]).map(function(n){return n.p&&+n.p.value}).filter(function(v){return v>0});
 var L=Math.max.apply(0,vals.concat([0]));if(!(L>3*a&&D>10&&D<400))return null;
 var parts=[],cy=new THREE.CylinderGeometry(D/2,D/2,L,32);cy.rotateZ(Math.PI/2);parts.push(cy);
 for(var i=0;i<Math.min(nB,2);i++){var x0=i?L/2-t/2:-L/2+t/2,dir=i?-1:1;var v=new THREE.BoxGeometry(t,a,D);v.translate(x0,-D/2-a/2,0);parts.push(v);var h=new THREE.BoxGeometry(b,t,D);h.translate(x0+dir*(b/2-t/2),-D/2-a+t/2,0);parts.push(h);}
 var pos=[];parts.forEach(function(g){var n=g.index?g.toNonIndexed():g,p=n.attributes.position.array;for(var k=0;k<p.length;k++)pos.push(p[k]);});
 var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.computeVertexNormals();geo.computeBoundingBox();
 geo.userData={partsList:['RURA Ø'+D+' L='+L,nB+'× WSPORNIK L '+a+'×'+b+'×'+t].concat(/PLYTA|PŁYTA/.test(tx)?['PŁYTA (osobno, poza gabarytem)']:[])};
 try{window.__p1log&&window.__p1log.push('M1 rura '+D+'×'+L+' + '+nB+'×L'+a);}catch(e){}
 return {name:'zespół rura + wsporniki L (P1)',geo:geo,how:'P1-M1: rura Ø'+D+' L='+L+' + '+nB+'× wspornik L'+a+'×'+b,force:1};};
