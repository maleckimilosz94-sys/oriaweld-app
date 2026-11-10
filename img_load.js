/* t1028u/t1029u: bezpieczne wczytanie zdjęcia rysunku (iOS Safari: limit pamięci canvas, duże foto, HEIC → czarny rysunek).
   __imgNorm(file|dataURL) → Promise<dataURL JPEG>: downscale max 2400 px (aspect), kompozyt na białym, detekcja pustego canvasa + 1 retry,
   zwolnienie canvasów (width=0). Błąd → Error z komunikatem PL. Ścieżka demo/desktop (fetch→AUTO.run) nie przechodzi tędy. */
(function(){
var MAXPX=2400;
function isHeic(f){return !!f&&(/image\/hei[cf]/i.test(f.type||'')||/\.(heic|heif)$/i.test(f.name||''))}
function okType(f){return !f||!f.type||/^image\//.test(f.type)||/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(f.name||'')}
function free(c){try{if(c){c.width=0;c.height=0}}catch(e){}}
function blank(c){try{var s=document.createElement('canvas');s.width=s.height=32;var y=s.getContext('2d');y.drawImage(c,0,0,32,32);var d=y.getImageData(0,0,32,32).data,mn=255,mx=0;for(var i=0;i<d.length;i+=4){var L=(d[i]+d[i+1]+d[i+2])/3;if(L<mn)mn=L;if(L>mx)mx=L}free(s);return mx-mn<8}catch(e){return false}}
window.__imgBlank=blank;
function decode(src){return new Promise(function(res,rej){var i=new Image();i.onload=function(){(i.decode?i.decode().catch(function(){}):Promise.resolve()).then(function(){res(i)})};i.onerror=function(){rej(new Error('decode'))};i.src=src})}
function draw(img,k){var w=Math.max(1,Math.round(img.naturalWidth*k)),h=Math.max(1,Math.round(img.naturalHeight*k)),c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');if(!x){free(c);return null}x.fillStyle='#fff';x.fillRect(0,0,w,h);x.imageSmoothingEnabled=true;try{x.imageSmoothingQuality='high'}catch(e){}x.drawImage(img,0,0,w,h);return c}
function render(img){var W=img.naturalWidth||img.width,H=img.naturalHeight||img.height;if(!W||!H)return null;
 var k=Math.min(1,MAXPX/Math.max(W,H)),c=draw(img,k);

 if(!c||blank(c)){free(c);c=draw(img,Math.min(k,1600/Math.max(W,H)));/* retry raz, mniejszy */if(!c||blank(c)){free(c);return null}}
 var u=c.toDataURL('image/jpeg',0.92);free(c);return u&&u.length>100?u:null}
var MSG='Nie udało się wczytać rysunku (obraz pusty/czarny). Spróbuj ponownie albo wybierz inne zdjęcie (JPG/PNG).';
var HEIC='Nie udało się odczytać zdjęcia HEIC. Na iPhonie: Ustawienia → Aparat → Formaty → „Najbardziej zgodne” (JPG) albo zrób zrzut ekranu rysunku.';
window.__imgMsg=MSG;
/* oria-184 LOAD-1: błąd wczytania w UI (PL/EN/DE) zamiast alert(); wskaźnik etapu */
var LGN=function(){var l='pl';try{l=localStorage.getItem('oria_lang')||document.documentElement.lang||'pl'}catch(e){}var m=(location.hash||'').match(/lang=(en|pl|de)/);if(m)l=m[1];return /^(pl|en|de)$/.test(l)?l:'pl'};
var TX={pl:{t:'Nie udało się wczytać rysunku.',pdf:'Czytnik PDF niedostępny offline. Spróbuj przy sieci albo wybierz inny plik.',pt:'Nie udało się otworzyć PDF.',rt:'Spróbuj ponownie',heic:'Nie udało się odczytać zdjęcia HEIC. Na iPhonie: Ustawienia → Aparat → Formaty → „Najbardziej zgodne” (JPG) albo zrób zrzut ekranu rysunku.',type:'Nieobsługiwany typ pliku. Wybierz zdjęcie JPG/PNG albo PDF.',blank:'Obraz jest pusty lub czarny. Spróbuj ponownie albo wybierz inne zdjęcie (JPG/PNG).',gen:'Spróbuj ponownie albo wybierz inny plik (JPG/PNG/PDF).',btn:'Wybierz inny plik',dt:'Duży rysunek — zmniejszam do 2400 px.',db:'Wynik może się nieznacznie różnić od oryginału.',st:{pdfopen:'Otwieram PDF…',pdfreader:'Ładuję czytnik PDF…',pdfrender:'Renderuję stronę 1…',img:'Wczytuję rysunek…'}},
 en:{t:'Couldn’t load the drawing.',pdf:'The PDF reader isn’t available offline. Try again on a network or choose another file.',pt:'Couldn’t open this PDF.',rt:'Try again',heic:'Couldn’t read the HEIC photo. On iPhone: Settings → Camera → Formats → “Most Compatible” (JPG), or take a screenshot of the drawing.',type:'Unsupported file type. Choose a JPG/PNG photo or a PDF.',blank:'The image is empty or black. Try again or choose another photo (JPG/PNG).',gen:'Try again or choose another file (JPG/PNG/PDF).',btn:'Choose another file',dt:'Large drawing — scaling down to 2400 px.',db:'The result may differ slightly from the original.',st:{pdfopen:'Opening PDF…',pdfreader:'Loading PDF reader…',pdfrender:'Rendering page 1…',img:'Loading drawing…'}},
 de:{t:'Zeichnung konnte nicht geladen werden.',pdf:'PDF-Reader offline nicht verfügbar. Erneut versuchen oder andere Datei.',pt:'PDF konnte nicht geöffnet werden.',rt:'Erneut versuchen',heic:'HEIC-Foto konnte nicht gelesen werden. iPhone: Einstellungen → Kamera → Formate → „Maximale Kompatibilität“ (JPG) oder Screenshot der Zeichnung.',type:'Dateityp nicht unterstützt. JPG/PNG-Foto oder PDF wählen.',blank:'Das Bild ist leer oder schwarz. Erneut versuchen oder anderes Foto wählen (JPG/PNG).',gen:'Erneut versuchen oder andere Datei wählen (JPG/PNG/PDF).',btn:'Andere Datei wählen',dt:'Große Zeichnung — auf 2400 px.',db:'Das Ergebnis kann leicht vom Original abweichen.',st:{pdfopen:'PDF wird geöffnet…',pdfreader:'PDF-Reader wird geladen…',pdfrender:'Seite 1 wird gerendert…',img:'Zeichnung wird geladen…'}}};
window.__loadNote=function(t,b,ms){try{var o=document.getElementById('lfnote');if(o)o.remove();o=document.createElement('div');o.id='lfnote';o.setAttribute('role','status');o.style.cssText='position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:9999;max-width:420px;margin:0 auto;padding:10px 14px;border:1px solid #283040;border-left:3px solid #22d3ee;border-radius:12px;background:#10141d;color:#e3e8ef;font:13px/1.35 Inter,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4)';var h=document.createElement('b');h.textContent=t;h.style.display='block';var p=document.createElement('span');p.style.color='#9aa4b4';p.textContent=b||'';o.appendChild(h);o.appendChild(p);document.body.appendChild(o);setTimeout(function(){try{o.remove()}catch(e){}},ms||7000)}catch(x){}};
window.__loadStage=function(k,extra){try{var e=document.getElementById('aprog');if(!e)return;var p=document.createElement('p');p.className='aprog';p.setAttribute('role','status');var sp=document.createElement('span');sp.className='spin';p.appendChild(sp);p.appendChild(document.createTextNode(' '+((TX[LGN()].st||{})[k]||k)+(extra?' '+extra:'')));e.innerHTML='';e.appendChild(p);window.__autoProg=p.textContent}catch(x){}};
window.__loadFail=function(err,kind){var m=String(err&&err.message||err||''),L=TX[LGN()],k=kind||(/HEIC/i.test(m)?'heic':/Nieobsługiwany typ/i.test(m)?'type':/pusty|czarny/i.test(m)?'blank':/PDF|czytnik|limit czasu|dynamically imported|Failed to fetch/i.test(m)?'pdf':'gen');
 var msg=L[k]||L.gen;try{console.warn('loadFail',k,m)}catch(x){}
 var t=document.getElementById('aprog')||document.getElementById('app');if(!t){try{alert(L.t+' '+msg)}catch(x){}return}
 t.innerHTML='';var d=document.createElement('div');d.id='loadfail';d.className='lferr';d.style.cssText='margin:12px 0;padding:14px;border:1px solid #283040;border-left:3px solid #f59e0b;border-radius:12px;background:#10141d;color:#e3e8ef;text-align:left';d.setAttribute('role','alert');var b=document.createElement('b');b.textContent=(k=='pdf'&&L.pt)||L.t;var pp=document.createElement('p');pp.textContent=msg;var bt=document.createElement('button');bt.type='button';bt.className='main alt';bt.style.marginTop='10px';bt.style.cssText+=';margin-top:10px;background:rgba(10,16,32,.8);border:1px solid rgba(34,211,238,.45);color:#e3e8ef';bt.textContent=(k=='pdf'&&LGN()=='de')?'Andere Datei':L.btn;bt.onclick=function(){var i=document.getElementById('agal')||document.getElementById('acam');if(i)i.click();else if(window.AUTO&&AUTO.start)AUTO.start()};d.appendChild(b);d.appendChild(pp);
 var pf=window.__lastPdfFile;if(k=='pdf'&&pf&&window.__pdfRead){var rb=document.createElement('button');rb.type='button';rb.className=bt.className;rb.style.cssText=bt.style.cssText;rb.style.marginRight='8px';rb.textContent=L.rt;rb.onclick=function(){window.__loadStage&&window.__loadStage('pdfopen');window.__pdfRead(pf).then(function(u){window.__syncPatentFlags&&window.__syncPatentFlags();AUTO.run(u)}).catch(function(e){window.__loadFail(e,'pdf')})};d.appendChild(rb)}d.appendChild(bt);t.appendChild(d);window.__autoProg=null};

window.__imgNorm=function(src){var f=(typeof Blob!='undefined'&&src instanceof Blob)?src:null;
 if(f&&!okType(f))return Promise.reject(new Error('Nieobsługiwany typ pliku ('+(f.type||f.name||'?')+'). Wybierz zdjęcie JPG/PNG'+(window.__pdfVec===true?' albo PDF':'')+'.'));
 var url=f?URL.createObjectURL(f):src;
 var done=function(){if(f)try{URL.revokeObjectURL(url)}catch(e){}};
 var rawURL=function(img,u){/* oria-183 LOAD-1: obraz ≤3000 px i ≤9 Mpx (bezpieczne dla iOS: limit canvas 16,7 Mpx) i jest JPG/PNG → oddaj ORYGINALNE bajty (bez re-kodowania canvasem): silnik jest bardzo wrażliwy na rekompresję JPEG (06: bent 602×580×70 → blacha 40×15) */
  var W=img.naturalWidth||img.width,H=img.naturalHeight||img.height;if(!f||!u||!/^image\/(jpeg|png)$/i.test(f.type||'')||Math.max(W,H)>3000||W*H>9e6||f.size>25*1048576)return u;
  return new Promise(function(res){var r=new FileReader();r.onload=function(){res(typeof r.result=='string'&&r.result.length>100?r.result:u)};r.onerror=function(){res(u)};r.readAsDataURL(f)})};
 return decode(url).then(function(img){var u=render(img);if(!u)return new Promise(function(r){setTimeout(r,250)}).then(function(){return decode(url)}).then(function(i2){return rawURL(i2,render(i2))});return rawURL(img,u)})
 .then(function(u){done();if(!u)throw new Error(MSG);return u},function(e){done();throw new Error(isHeic(f)?HEIC:(e&&e.message&&e.message!='decode'?e.message:MSG))})};
window.__imgNormRead=function(f,cb){window.__imgNorm(f).then(cb).catch(function(e){window.__loadFail(e)})};
})();

/* oria-191 CTR: normalizacja kontrastu rysunku PRZED analizą (słabe/blade kontury profili → zwykle nie przechodzą progów <120/<140/<160/<170 i są
   traktowane jak tło/linie pomocnicze). __ctrBoost(canvas,info): poziomy (levels) po percentylach – atrament(p0.4)→0, papier(p60)→255, tylko gdy
   rysunek jest „blady” (atrament ≥100 lub rozstęp papier–atrament ≤95, przy jasnym papierze ≥120). Dobry kontrast = zero zmian (no-op, bez zapisu pikseli).
   Wyłączniki: ?ctr=0 / #ctr=0 / window.__noCtr; wymuszenie: ?ctr=1 / #ctr=1. Wynik w info.ctr oraz window.__ctr (diagnostyka). Działa in-place na canvasie. */
(function(){
function mode(){try{var m=(location.search+'&'+location.hash).match(/[?&#]ctr=([0123])/);return m?+m[1]:null}catch(e){return null}}
function pct(h,n,q){var t=q*n,a=0;for(var i=0;i<256;i++){a+=h[i];if(a>=t)return i}return 255}
function ctrLevels(c,info){
 var R={applied:false};
 try{
  if(window.__noCtr||mode()===0){R.off=1;window.__ctr=R;if(info)info.ctr=R;return R}
  var w=c.width,h=c.height,x=c.getContext('2d'),im=x.getImageData(0,0,w,h),d=im.data,H=new Uint32Array(256),n=0;
  for(var i=0;i<d.length;i+=8){var L=(d[i]*77+d[i+1]*151+d[i+2]*28)>>8;H[L]++;n++}
  var ink=pct(H,n,0.004),bg=pct(H,n,0.6),dd=bg-ink;R.ink=ink;R.bg=bg;R.d=dd;
  var weak=bg>=120&&(ink>=100||dd<=95),force=mode()===1;
  if(!(weak||force)||dd<12){R.reason=(weak||force)?'rozstęp<12':'kontrast OK';window.__ctr=R;if(info)info.ctr=R;return R}
  /* zdjęcie: nierówne tło (cień/gradient) → spłaszczenie: tło lokalne = p80 w blokach 48 px (bilinearnie), v→v·255/tło; tylko gdy rozrzut tła bloków (p90−p10) ≥25 */
  var BW=48,gx=Math.ceil(w/BW),gy=Math.ceil(h/BW),bgm=new Float32Array(gx*gy),minB=0.7*bg,bx,by,xx,yy,hh,nn,L2;
  for(by=0;by<gy;by++)for(bx=0;bx<gx;bx++){hh=new Uint32Array(256);nn=0;for(yy=by*BW;yy<Math.min(h,by*BW+BW);yy+=2)for(xx=bx*BW;xx<Math.min(w,bx*BW+BW);xx+=2){var q=(yy*w+xx)*4;hh[(d[q]*77+d[q+1]*151+d[q+2]*28)>>8]++;nn++}bgm[by*gx+bx]=Math.max(minB,nn?pct(hh,nn,0.8):bg)}
  var sb=Array.prototype.slice.call(bgm).sort(function(a,b){return a-b}),spread=sb[Math.floor(sb.length*0.9)]-sb[Math.floor(sb.length*0.1)];R.spread=Math.round(spread);
  if(spread>=25&&!window.__noCtrFlat&&mode()!==3){
   var cx0=new Int32Array(w),cx1=new Int32Array(w),cwx=new Float32Array(w);for(xx=0;xx<w;xx++){var fx=Math.min(gx-1,Math.max(0,(xx+0.5)/BW-0.5)),i0=Math.floor(fx);cx0[xx]=i0;cx1[xx]=Math.min(gx-1,i0+1);cwx[xx]=fx-i0}
   for(yy=0;yy<h;yy++){var fy=Math.min(gy-1,Math.max(0,(yy+0.5)/BW-0.5)),j0=Math.floor(fy),j1=Math.min(gy-1,j0+1),wy=fy-j0;
    for(xx=0;xx<w;xx++){var a=bgm[j0*gx+cx0[xx]]*(1-cwx[xx])+bgm[j0*gx+cx1[xx]]*cwx[xx],b2=bgm[j1*gx+cx0[xx]]*(1-cwx[xx])+bgm[j1*gx+cx1[xx]]*cwx[xx],g=255/(a*(1-wy)+b2*wy),k=(yy*w+xx)*4;
     d[k]=Math.min(255,d[k]*g+0.5)|0;d[k+1]=Math.min(255,d[k+1]*g+0.5)|0;d[k+2]=Math.min(255,d[k+2]*g+0.5)|0}}
   H=new Uint32Array(256);n=0;for(var i3=0;i3<d.length;i3+=8){var L3=(d[i3]*77+d[i3+1]*151+d[i3+2]*28)>>8;H[L3]++;n++}
   ink=pct(H,n,0.004);bg=pct(H,n,0.6);R.flat=true;R.ink2=ink;R.bg2=bg;}
  var lo=ink,hi=Math.max(lo+12,bg),lut=new Uint8Array(256);
  for(var v=0;v<256;v++){var t=(v-lo)/(hi-lo);lut[v]=t<=0?0:t>=1?255:Math.round(255*t)}
  for(var j=0;j<d.length;j+=4){d[j]=lut[d[j]];d[j+1]=lut[d[j+1]];d[j+2]=lut[d[j+2]]}
  x.putImageData(im,0,0);R.applied=true;R.lo=lo;R.hi=hi;R.forced=force&&!weak;
  try{if(info&&info.log)info.log.push('kontrast: poziomy '+lo+'→0, '+hi+'→255 (blady rysunek: atrament '+ink+', papier '+bg+')')}catch(e){}
 }catch(e){R.err=String(e&&e.message||e)}
 window.__ctr=R;if(info)info.ctr=R;return R}
window.__ctrBoost=function(c,info){var r=ctrLevels(c,info);if(mode()===2&&!window.__noCtr&&window.__ctrFaint)r.faint=window.__ctrFaint(c,info);return r};
/* oria-191 CTR2 (opt-in ?ctr=2): „ratunek” bladych kresek przy MIESZANYM kontraście (czarny tekst/ramka + blade kontury profili – globalne poziomy nic nie dadzą).
   Kreska uznana za bladą, gdy w oknie 5×5 nie ma żadnego piksela ciemniejszego niż 140 i black-hat 7×7 ≥22; wtedy piksel ciemnieje o 2.5×black-hat.
   Nie rusza obwódek antyaliasingu ciemnych linii (tam min 5×5 <140). Auto-trigger niemożliwy bez ryzyka regresji (patrz RAPORT_191) – dlatego opt-in. */
function minmax(g,w,h,r,isMax){var t=new Uint8Array(g.length),o=new Uint8Array(g.length),i,x,y,k,v,u;
 for(y=0;y<h;y++){for(x=0;x<w;x++){v=g[y*w+x];for(k=-r;k<=r;k++){var xx=x+k;if(xx<0||xx>=w)continue;u=g[y*w+xx];if(isMax?u>v:u<v)v=u}t[y*w+x]=v}}
 for(y=0;y<h;y++){for(x=0;x<w;x++){v=t[y*w+x];for(k=-r;k<=r;k++){var yy=y+k;if(yy<0||yy>=h)continue;u=t[yy*w+x];if(isMax?u>v:u<v)v=u}o[y*w+x]=v}}
 return o}
window.__ctrFaint=function(c,info){var R={applied:false};try{var w=c.width,h=c.height,x=c.getContext('2d'),im=x.getImageData(0,0,w,h),d=im.data,g=new Uint8Array(w*h),i;
 for(i=0;i<g.length;i++)g[i]=(d[i*4]*77+d[i*4+1]*151+d[i*4+2]*28)>>8;
 var cl=minmax(minmax(g,w,h,3,true),w,h,3,false),m5=minmax(g,w,h,2,false),n=0;
 for(i=0;i<g.length;i++){var bh=cl[i]-g[i];if(bh>=22&&m5[i]>=140){var dl=Math.round(2.5*bh),j=i*4;d[j]=Math.max(0,d[j]-dl);d[j+1]=Math.max(0,d[j+1]-dl);d[j+2]=Math.max(0,d[j+2]-dl);n++}}
 if(n){x.putImageData(im,0,0);R.applied=true;R.px=n}}catch(e){R.err=String(e&&e.message||e)}
 window.__ctrF=R;if(info)info.ctrF=R;return R};
})();
