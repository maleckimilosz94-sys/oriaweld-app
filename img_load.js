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
window.__imgNorm=function(src){var f=(typeof Blob!='undefined'&&src instanceof Blob)?src:null;
 if(f&&!okType(f))return Promise.reject(new Error('Nieobsługiwany typ pliku ('+(f.type||f.name||'?')+'). Wybierz zdjęcie JPG/PNG'+(window.__pdfVec===true?' albo PDF':'')+'.'));
 var url=f?URL.createObjectURL(f):src;
 var done=function(){if(f)try{URL.revokeObjectURL(url)}catch(e){}};
 return decode(url).then(function(img){var u=render(img);if(!u)return new Promise(function(r){setTimeout(r,250)}).then(function(){return decode(url)}).then(render);return u})
 .then(function(u){done();if(!u)throw new Error(MSG);return u},function(e){done();throw new Error(isHeic(f)?HEIC:(e&&e.message&&e.message!='decode'?e.message:MSG))})};
window.__imgNormRead=function(f,cb){window.__imgNorm(f).then(cb).catch(function(e){alert(e&&e.message||e)})};
})();
