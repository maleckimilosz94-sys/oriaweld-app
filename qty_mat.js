/* t888u (LOKALNIE): sugestia ILOŚCI SZTUK i MATERIAŁU z OCR silnika (tabela/BOM/napisy). VLM nieużywany (zapas: tylko gdy brak OCR – wyłączony domyślnie).
   Freeze: konflikt dwóch wartości / brak słowa-klucza → brak sugestii. „4x Ø8,5” (otwory) NIE jest liczbą sztuk.
   Wynik: fm.qtyMat={qty,qtySrc,mat,matSrc,thick,thickSrc}; P2 krok 4: prefill grubości (gdy pusta) + linia podpowiedzi. Wyłącznik: __noQtyHint=1 / ?qty=0. */
(function(G){
function norm(t){return String(t||'').replace(/[|\[\]{}]/g,' ').replace(/\s+/g,' ')}
var MAT=[ [/\bS\s?(235|275|355|420|460)\s?(J[R02]|JR|J2\+?N?|N|MC)?\b/gi,function(m){return 'S'+m[1]+(m[2]?m[2].toUpperCase():'')}],
 [/\b[S5]t\s?(3[S5s]|37(?:-2)?|52(?:-3)?|44)\b/gi,function(m){var g=m[1].toUpperCase().replace(/^35$/,'3S').replace(/^3[S5]$/,'3S');return 'St'+g}],
 [/\b1[.,]\s?(4301|4307|4404|4571|4541|0038|0037|0570|0577)\b/g,function(m){return '1.'+m[1]}],
 [/\b(AISI|A)\s?(304L?|316L?)\b/gi,function(m){return 'AISI '+m[2].toUpperCase()}],
 [/\b(EN\s?AW[- ]?\d{4}|AlMg\s?\d(?:[.,]\d)?|AlMgSi\s?\d(?:[.,]\d)?|Al\s?99[.,]5)\b/gi,function(m){return m[1].replace(/\s/g,'')}],
 [/\b(DC0[1-6]|DX5[1-4]D?|S\d{3}MC|Hardox\s?\d{3})\b/gi,function(m){return m[1].toUpperCase()}] ];
var GEN=[[/\b(stahl|steel|stal)\b/i,'stal'],[/\b(aluminium|aluminum|alu)\b/i,'aluminium'],[/\b(edelstahl|nierdzewn\w*|stainless|inox)\b/i,'stal nierdzewna']];
var QTY=[/\b(\d{1,3})\s?(?:st(?:ü|u|ue)ck|stk\.?|szt\.?|pcs\.?|pieces|sztuk[ai]?)\b/gi,
 /\b(?:st(?:ü|u|ue)ckzahl|anzahl|menge|ilo(?:ść|sc)|qty|quantity|liczba\s+sztuk)\s?[:=]?\s?(\d{1,3})\b/gi];

/* t888u .pre_table: parser wierszy BOM/Stückliste z istniejącego tekstu OCR. Wiersz = Poz | Nazwa(słowo-klucz) | Ilość | [norma] | [materiał].
   Bezpiecznik: tylko nazwy z listy półwyrobów; ta sama poz. z różną ilością → wiersz odrzucony; Ø/otwory nigdy. */
var NAME=/(bl[ao]ch\w*|rur\w*|p[łl]askownik\w*|k[ąa]townik\w*|ceownik\w*|dwuteownik\w*|pr[ęe]t\w*|profil\w*|blech\w*|rohr\w*|flach\w*|winkel\w*|plate|tube|pipe|flat\w*)/i;
var ROW=/(?:^|[\s\[(|])(\d{1,2})\s*[\[|]\s*([A-Za-zÀ-ž][A-Za-zÀ-ž_]{3,}[ _][^|\[]{1,32}?)\s*[|\[]\s*(\d{1,3})\s*_?\s*[|\[J]([^|]{0,24})\|?\s*([^|\[]{0,14})/g;
function rowMat(seg){var t=' '+seg+' ',m;if((m=/\b[S5]t\s?3[S5s]\b/i.exec(t)))return 'St3S';if((m=/\bS\s?(235|355)(JR|J2)?\b/i.exec(t)))return 'S'+m[1]+(m[2]||'').toUpperCase();if((m=/\bR\s?(35|45)\b/.exec(t)))return 'R'+m[1];return null}
function cleanName(n){return n.replace(/[:;,.]+$/,'').replace(/_/g,' ').replace(/konsfrukcyjna|konstrukcyina/i,'konstrukcyjna').replace(/^Bl[ao]ch[ae]/i,'Blacha').replace(/\s+/g,' ').trim()}
function bom(txt){var t=String(txt||'').replace(/\s+/g,' '),m,rows={},bad={};ROW.lastIndex=0;
 while((m=ROW.exec(t))){var pos=+m[1],name=m[2],q=+m[3];if(!NAME.test(name)||/[Ø@⌀]/.test(name)||q<1||q>200||pos<1||pos>40)continue;
  var mat=rowMat(m[4]+' '+m[5]);var r=rows[pos];
  if(r){if(r.qty!==q){bad[pos]=1;continue}if(!r.mat&&mat)r.mat=mat;else if(r.mat&&mat&&r.mat!==mat)r.matConflict=1;r.n++}
  else rows[pos]={pos:pos,name:cleanName(name),qty:q,mat:mat,n:1};ROW.lastIndex=m.index+m[1].length+1}
 var out=Object.keys(rows).filter(function(k){return !bad[k]}).map(function(k){var r=rows[k];if(r.matConflict)r.mat=null;delete r.matConflict;return r}).sort(function(a,b){return b.pos-a.pos});
 return out.length>=2||(out.length===1&&out[0].n>=2)?out:[]}

/* .pre_table: parser komórkowy wierszy (z rowsText): [pos] | NAZWA(słowo-klucz) | [wymiar×] | ilość | [norma] | [materiał]. */
function bomCells(rt){var rows={},bad={};String(rt||'').split(/\s\n\s/).forEach(function(line){var c=line.split(' | ').map(function(x){return x.trim()});
  var ni=-1;for(var i=0;i<c.length;i++)if(NAME.test(c[i])&&/^[A-Za-zÀ-ž_]{4,}/.test(c[i])){ni=i;break}if(ni<0)return;
  var pos=null;for(var j=ni-1;j>=0&&j>=ni-2;j--)if(/^\[?\d{1,2}$/.test(c[j])){pos=+c[j].replace('[','');break}
  var q=null;for(var k=ni+1;k<c.length&&k<=ni+3;k++){if(/[×x*]\s?\d/i.test(c[k]))continue;if(/^\d{1,3}$/.test(c[k])){q=+c[k];break}if(/[A-Za-z]{2}/.test(c[k]))break}
  if(!pos||pos>40||!q||q>200||/[Ø@⌀]/.test(line))return;var mat=rowMat(c.slice(ni+1).join(' '));
  var r=rows[pos];if(r){if(r.qty!==q){bad[pos]=1;return}if(!r.mat)r.mat=mat;r.n++}else rows[pos]={pos:pos,name:cleanName(c[ni]),qty:q,mat:mat,n:1}});
 var out=Object.keys(rows).filter(function(k){return !bad[k]}).map(function(k){return rows[k]}).sort(function(a,b){return b.pos-a.pos});
 return out.length>=2?out:[]}
function uniq(a){var o={};a.forEach(function(x){o[x]=(o[x]||0)+1});return o}
function extract(txt){var t=norm(txt),r={qty:null,qtySrc:null,mat:null,matSrc:null,thick:null,thickSrc:null,raw:{}};
 var mats=[];MAT.forEach(function(p){var m;p[0].lastIndex=0;while((m=p[0].exec(t)))mats.push(p[1](m))});
 var u=uniq(mats),k=Object.keys(u);r.raw.mat=u;
 if(k.length===1){r.mat=k[0];r.matSrc='OCR gatunek ×'+u[k[0]]}
 else if(k.length>1){var fam={};k.forEach(function(x){fam[x.replace(/(J[R02]|JR|\+N)$/,'')]=1});var f=Object.keys(fam);if(f.length===1){r.mat=k.sort(function(a,b){return b.length-a.length})[0];r.matSrc='OCR gatunek (warianty)'}else r.matSrc='konflikt: '+k.join('/')}
 if(!r.mat&&k.length===0){var g=GEN.filter(function(p){return p[0].test(t)}).map(function(p){return p[1]});if(g.length===1&&/\b(material|werkstoff|materiał)\b/i.test(t)){r.mat=g[0];r.matSrc='OCR ogólne (Material)'}}
 var qs=[];QTY.forEach(function(p){var m;p.lastIndex=0;while((m=p.exec(t))){var n=+m[1];if(n>=1&&n<=500)qs.push(n)}});
 var uq=uniq(qs),kq=Object.keys(uq);r.raw.qty=uq;if(kq.length===1){r.qty=+kq[0];r.qtySrc='OCR „szt/Stück” ×'+uq[kq[0]]}else if(kq.length>1)r.qtySrc='konflikt: '+kq.join('/');
 var th=[],m,re=/\b(?:t|s|dicke|grubo(?:ść|sc)|blech|thk|thickness)\s?[=:]\s?(\d{1,2}(?:[.,]\d)?)\s?(?:mm)?\b/gi;while((m=re.exec(t)))th.push(+m[1].replace(',','.'));
 var ut=uniq(th),kt=Object.keys(ut);if(kt.length===1&&+kt[0]>0&&+kt[0]<=50){r.thick=+kt[0];r.thickSrc='OCR t='}
 /* t964: profil zamknięty z OCR (RHS/SHS/RK a×b×t). Fragment „120x” + pełne „20x60x3 RHS” → 120 tylko gdy fragment KOŃCZY się na a (zgubiona cyfra OCR). Konflikt → brak. */
 var pf=[],pm,pre=/(?:\b(RHS|SHS|RK)\s?)?(\d{2,3})?\s?[x×]\s?(\d{2,3})\s?[x×]\s?(\d{1,2}(?:[.,]\d)?)(?:\s?(RHS|SHS|RK)(?!\s?\d{2,3}\s?[x×]))?\b/gi;while((pm=pre.exec(t))){if(!(pm[1]||pm[5]))continue;pf.push({a:pm[2]?+pm[2]:null,b:+pm[3],t:+pm[4].replace(',','.'),k:(pm[1]||pm[5]).toUpperCase()})}
 if(pf.length){var fr=[],fm,fre=/\b(\d{2,4})\s?[x×](?!\s?\d)/g;while((fm=fre.exec(t)))fr.push(fm[1]);
  pf.forEach(function(p){var c=fr.filter(function(f){return p.a==null||(f.length>String(p.a).length&&f.slice(-String(p.a).length)===String(p.a))});if(c.length&&new Set(c).size===1){p.a=+c[0];p.fix=1}});
  var ok=pf.filter(function(p){return p.a>0&&p.b>0&&p.t>0&&p.t<Math.min(p.a,p.b)/2}),ks=uniq(ok.map(function(p){return p.k+' '+Math.max(p.a,p.b)+'×'+Math.min(p.a,p.b)+'×'+p.t})),kk=Object.keys(ks);
  if(kk.length===1){r.prof=kk[0];r.profSrc='OCR profil'+(ok.some(function(p){return p.fix})?' (scalony fragment)':'')}else if(kk.length>1)r.profSrc='konflikt: '+kk.join('/')}
 r.bom=bom(txt);if(r.bom.length)r.bomSrc='OCR tabela BOM ('+r.bom.length+' poz.)';
 return r}
G.__qtyMat={extract:extract,bom:bom,rowsText:null};
/* .pre_table: rekonstrukcja wierszy tabeli z boxów OCR (x,y,w,h) → „a | b | c” na wiersz (PP-OCR zwraca kolumnami). */
function rowsText(boxes){var B=(boxes||[]).filter(function(b){return b&&b.text&&b.w!=null&&b.y!=null&&!b.vert&&!(String(b.text).trim().length>3&&(b.h||0)>(b.w||1)*1.2)}).map(function(b){return {t:String(b.text).trim(),x:+b.x,y:+b.y+(+b.h||0)/2,h:+b.h||10}}).sort(function(a,b){return a.y-b.y});
 var rows=[];B.forEach(function(b){var r=rows[rows.length-1];if(r&&Math.abs(b.y-r.y)<Math.min(b.h,r.h)*0.55){r.c.push(b);r.y=(r.y*(r.c.length-1)+b.y)/r.c.length}else rows.push({y:b.y,h:b.h,c:[b]})});
 return rows.map(function(r){return r.c.sort(function(a,b){return a.x-b.x}).map(function(b){return b.t}).join(' | ')}).join(' \n ')}

/* .pre_cellocr: P0.1/P0.2 komórka Dicke — kotwica na nagłówku (siatka w przeglądarce niewykrywalna na zdjęciach), komórka wartości w tym samym wierszu; OCR komórki → jeśli czysta liczba x.y przyjmij; jeśli zlepiona („40Biant”) → 1 pytanie VLM na wycinku, OCR = sędzia (cyfry muszą się zgadzać), rozjazd → brak. Wyłącznik: __noCellOcr=1. */
var TH_LAB=/\b(dicke|stärke|staerke|grubo(?:ść|sc)|thickness|blechdicke)\b/i;
function cellThick(info){var B=[].concat(info.allBoxes||[],info.sheetBoxes||[]).filter(function(b){return b&&b.text&&b.w!=null});
 var labs=B.filter(function(b){return TH_LAB.test(b.text)});if(labs.length!==1)return {lab:null,n:labs.length};var L=labs[0],cy=L.y+L.h/2;
 var tail=String(L.text).replace(/^.*?(?:dicke|stärke|staerke|grubo(?:ść|sc)|thickness)\s*(?:\(mm\))?\s*/i,'');
 var vals=B.filter(function(b){return b!==L&&Math.abs(b.y+b.h/2-cy)<L.h*0.6&&b.x>=L.x+L.w*0.6&&b.x<L.x+L.w*3.5}).sort(function(a,b){return a.x-b.x});
 var raw=(tail||'').trim()||(vals[0]&&String(vals[0].text).trim())||'';
 var clean=raw.match(/^(\d{1,2}[.,]\d{1,2})(?![\d])/),dig=(raw.match(/^\d{1,3}/)||[''])[0];
 return {lab:L,raw:raw,clean:clean?+clean[1].replace(',','.'):null,dig:dig,crop:{x:L.x-L.w*0.1,y:L.y-L.h*0.5,w:L.w*3.4,h:L.h*2}}}
function judge(c,v){if(v==null||!(v>0&&v<=50))return null;if(c.clean!=null)return Math.abs(c.clean-v)<1e-6?v:null;
 if(!c.dig)return null;var vd=String(v).replace('.','');var vd1=(+v).toFixed(1).replace('.','');return (c.dig===vd||c.dig===vd1||+c.dig===v)?v:null}
G.__qtyMat.cellThick=cellThick;G.__qtyMat.judge=judge;G.__qtyMat.dickeParse=dickeParse;
/* .pre_bomword: format pozycji BOM w linii ★ — grubość „N mm” oddzielnie od „N szt.” (Wizja/Grafika 1600). Tylko string, logika OCR bez zmian. */
function fmtBom(b,T){T=T||function(s){return s};var n=String(b.name||'').trim(),w=n.split(' ')[0],th=null,m;
 if(/^(bl[ao]ch|p[łl]yt|p[łl]askownik|blech|plate|flach)/i.test(w)&&(m=/\s(\d{1,2}(?:[.,]\d)?)\s*(?:mm)?$/.exec(n))&&!/[×x*]\s*\d+\s*$/i.test(n)){th=m[1].replace(',','.');n=w}
 else if(/^\S+\s+[a-ząćęłńóśźż]{6,}\s/i.test(n))n=n.replace(/^(\S+)\s+[a-ząćęłńóśźż]{6,}\s/i,'$1 ');
 var nm=T(n.split(' ')[0])+(n.indexOf(' ')>0?n.slice(n.indexOf(' ')):'');
 return b.pos+': '+nm+(th?' '+th+' mm':'')+' · '+b.qty+' '+T('szt.')+(b.mat?' · '+b.mat:'')}
G.__qtyMat.fmtBom=fmtBom;
G.__qtyRows=rowsText;
G.__qtyMat.rowsText=rowsText;G.__qtyMat.bomCells=bomCells;
/* t976: kontrola struktury BOM — OK tylko gdy poz. unikalne i ciągłe 1..N, każda qty całkowita 1..200. Ilość całego złożenia NIGDY z BOM (asmQty zawsze null). Inaczej INCOMPLETE. */
function bomCheck(b){if(!b||!b.length)return {status:'INCOMPLETE',why:'brak wierszy BOM',items:null,asmQty:null};var P={},mx=0;for(var i=0;i<b.length;i++){var r=b[i];if(!r||P[r.pos]||!(r.qty>=1&&r.qty<=200)||r.qty%1)return {status:'INCOMPLETE',why:'poz. zdublowana/qty niepewna',items:null,asmQty:null};P[r.pos]=1;if(r.pos>mx)mx=r.pos}if(mx!==b.length)return {status:'INCOMPLETE',why:'luka w numeracji poz. (1..'+mx+', jest '+b.length+')',items:null,asmQty:null};return {status:'OK',why:null,items:b.slice().sort(function(x,y){return x.pos-y.pos}).map(function(r){return {pos:r.pos,name:r.name,qty:r.qty,mat:r.mat||null}}),asmQty:null}}
G.__qtyMat.bomCheck=bomCheck;
/* t979: materiał całości. Jeden jasny gatunek z OCR → hint; gdy BOM (status OK) ma ≥2 różne gatunki → całość mieszana: mat null + lista matMixed (bez zgadywania jednego). */
function matFinal(QM,bc){var r={mat:QM&&QM.mat||null,src:QM&&QM.matSrc||null,mixed:null};if(bc&&bc.status==='OK'&&bc.items){var u={};bc.items.forEach(function(i){if(i.mat)u[i.mat]=1});var k=Object.keys(u);if(k.length>=2){r.mat=null;r.src='BOM: różne gatunki';r.mixed=k.sort()}}return r}
G.__qtyMat.matFinal=matFinal;
/* t966: ilość z komórki tabeli — kotwica na etykiecie (Menge/Anzahl/Stückzahl/Qty/Quantity/Ilość/Szt.), wartość: czysta liczba całkowita 1..500 w tym samym wierszu (prawo) albo w tej samej kolumnie (pod). Tylko 1 etykieta i 1 kandydat; Blatt/Sheet/von nigdy. */
var QL=/^(menge|anzahl|st(?:ü|u|ue)ckzahl|stk\.?|qty\.?|quantity|ilo(?:ść|sc)|szt\.?|pcs\.?)\s*[:.]?\s*(\d{1,3})?$/i;
function qtyCell(B){B=(B||[]).filter(function(b){return b&&b.text&&b.w!=null});var labs=B.filter(function(b){return QL.test(String(b.text).trim())});if(labs.length!==1)return null;var L=labs[0],m=String(L.text).trim().match(QL);
 var ok=function(n){return n>=1&&n<=500};if(m[2]){return ok(+m[2])?{qty:+m[2],src:'OCR komórka „'+L.text+'”'}:null}
 var cy=L.y+L.h/2,cx=L.x+L.w/2,isN=function(b){return b!==L&&/^\d{1,3}$/.test(String(b.text).trim())&&!/blatt|sheet|von|of/i.test(b.text)};
 var row=B.filter(function(b){return isN(b)&&Math.abs(b.y+b.h/2-cy)<L.h*0.6&&b.x>=L.x+L.w*0.6&&b.x<L.x+L.w*3}).sort(function(a,b){return a.x-b.x});
 var col=B.filter(function(b){return isN(b)&&Math.abs(b.x+b.w/2-cx)<Math.max(L.w*0.6,b.w)&&b.y>L.y+L.h*0.5&&b.y<L.y+L.h*3}).sort(function(a,b){return a.y-b.y});
 var c=row.length?row[0]:(col.length===1?col[0]:null);if(row.length&&col.length&&String(row[0].text).trim()!==String(col[0].text).trim())return null;
 if(!c||!ok(+c.text))return null;return {qty:+String(c.text).trim(),src:'OCR komórka „'+L.text+'” ('+(row.length?'wiersz':'kolumna')+')'}}
G.__qtyMat.qtyCell=qtyCell;
if(typeof window==='undefined')return;
function off(){try{return window.__noQtyHint||/[?&#]qty=0/.test(location.search+location.hash)}catch(e){return 1}}
function txt(info){try{var a=[].concat(info.allBoxes||[],info.sheetBoxes||[]).map(function(b){return b&&b.text||''});if(info.title&&info.title.text)a.push(info.title.text);(info.views||[]).forEach(function(v){(v&&v.boxes||[]).forEach(function(b){a.push(b&&b.text||'')})});return a.join(' ')+' '+(window.__vlmOcrTextUser||'')}catch(e){return ''}}

function vlmCell(info,c){try{if(!(window.__vlmOn||/[?&#]vlm=1/.test(location.search+location.hash))||window.__noVlm||/[?&#]vlm=0/.test(location.search+location.hash)||!info.sheet||!window.fetch)return Promise.resolve(null);
 var im=info.sheet,k=(im.naturalWidth||im.width)/(info.sheetW||im.naturalWidth||im.width),cv=document.createElement('canvas'),sc=Math.max(1,Math.min(4,300/(c.crop.w*k)));
 cv.width=Math.round(c.crop.w*k*sc);cv.height=Math.round(c.crop.h*k*sc);var x=cv.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(im,c.crop.x*k,c.crop.y*k,c.crop.w*k,c.crop.h*k,0,0,cv.width,cv.height);
 var _du=cv.toDataURL('image/png');window.__cellCrop=_du;var b64=_du.split(',')[1],ac=window.AbortController?new AbortController():null,to=setTimeout(function(){ac&&ac.abort()},120000);
 return fetch((window.__vlmUrl||'http://127.0.0.1:11434')+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:ac&&ac.signal,body:JSON.stringify({model:window.__vlmModel||'qwen3-vl:4b-instruct',stream:false,format:"json",options:{temperature:0,num_ctx:8192},messages:[{role:"user",content:'This is a crop of a table cell row from a technical drawing title block. Read the label and its numeric value exactly as printed. Reply JSON {"label":str,"value":str or null}. If unreadable, value null.',images:[b64]}]})}).then(function(r){return r.json()}).then(function(j){clearTimeout(to);var o=JSON.parse(j.message.content);window.__cellVlm=o;if(!o||!/dicke|thick|grubo|stärke/i.test(o.label||''))return null;var v=parseFloat(String(o.value||'').replace(',','.'));return isFinite(v)?v:null}).catch(function(e){clearTimeout(to);console.log('qty cellVlm err '+e);return null})}catch(e){return Promise.resolve(null)}}
/* t965: ?dicke=1 / __dickeOcr — zawężony re-OCR (PP-OCR silnika) komórki wartości obok etykiety Dicke; przyjmij tylko czysty zapis x.y zgodny cyframi z OCR ogólnym (judge). OFF domyślnie. */
function dickeOn(){try{return !!(window.__dickeOcr||/[?&#]dicke=1/.test(location.search+location.hash))}catch(e){return false}}
function dickeParse(arr){var v=[];(arr||[]).forEach(function(o){var m=String(o&&o.text||'').trim().match(/^(\d{1,2}[.,]\d{1,2})(?:\s*mm)?$/i);if(m)v.push(+m[1].replace(',','.'))});var u=uniq(v),k=Object.keys(u);return k.length===1?+k[0]:null}
function dickeCell(info,c){try{var E=window.RamaEngine;if(!dickeOn()||!E||!E.ppocr||!info.sheet)return Promise.resolve(null);var im=info.sheet,k=(im.naturalWidth||im.width)/(info.sheetW||im.naturalWidth||im.width),L=c.lab,all=[],raw=[],q=Promise.resolve();
 [[2.0,2.45,0],[1.9,2.45,1],[2.1,2.44,0]].forEach(function(v){q=q.then(function(){var r={x:L.x+L.w*v[0],y:L.y-L.h*0.3,w:L.w*(v[1]-v[0]),h:L.h*1.6},sc=4,cv=document.createElement('canvas');cv.width=Math.round(r.w*k*sc);cv.height=Math.round(r.h*k*sc);var x=cv.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(im,r.x*k,r.y*k,r.w*k,r.h*k,0,0,cv.width,cv.height);
  if(v[2]){var d=x.getImageData(0,0,cv.width,cv.height),D=d.data,lo=255,hi=0,i;for(i=0;i<D.length;i+=4){var g=(D[i]+D[i+1]+D[i+2])/3;if(g<lo)lo=g;if(g>hi)hi=g}var sp=Math.max(1,hi-lo);for(i=0;i<D.length;i+=4){var g2=((D[i]+D[i+1]+D[i+2])/3-lo)*255/sp;D[i]=D[i+1]=D[i+2]=g2}x.putImageData(d,0,0)}
  (window.__dickeCrops=window.__dickeCrops||[]).push(cv.toDataURL('image/png'));return E.ppocr(cv).then(function(o){(o||[]).forEach(function(b){raw.push(b.text);all.push(b)})}).catch(function(e){raw.push('err '+e)})})});
 return q.then(function(){window.__dickeRaw=raw;return dickeParse(all)})}catch(e){return Promise.resolve(null)}}

function cellStep(info,s){if(window.__noCellOcr||!s||s.thick)return Promise.resolve();var c;try{c=cellThick(info||{})}catch(e){return Promise.resolve()}window.__cellLast=c&&{raw:c.raw,clean:c.clean,dig:c.dig};if(!c||!c.lab)return Promise.resolve();
 if(c.clean!=null&&c.clean>0&&c.clean<=50){s.thick=c.clean;s.thickSrc='OCR komórka Dicke';return Promise.resolve()}
 if(!c.dig)return Promise.resolve();return dickeCell(info,c).then(function(d){var t=judge(c,d);window.__cellLast.dicke=d;if(t!=null){s.thick=t;s.thickSrc='OCR zawężony komórka Dicke „'+d+'” = „'+c.dig+'”';return}return vlmCell(info,c).then(function(v){var t=judge(c,v);window.__cellLast.vlm=v;window.__cellLast.ok=t;if(t!=null){s.thick=t;s.thickSrc='komórka Dicke: VLM '+v+' = OCR „'+c.dig+'”'}})})}
function wrap(){var pm=window.p2Mid;if(!pm||pm.__qty||window.__qtyWrapped)return;window.__qtyWrapped=1;
 var w=function(info){if(off())return pm.apply(this,arguments);var s=null;try{var _tx=txt(info||{});window.__qtyTxt=_tx;s=extract(_tx);try{var _rt=rowsText([].concat((info||{}).allBoxes||[],(info||{}).sheetBoxes||[]));window.__qtyRowsTxt=_rt;if(!s.bom.length){var _b=bomCells(_rt);if(!_b.length)_b=bom(_rt);if(_b.length){s.bom=_b;s.bomSrc='OCR wiersze tabeli ('+_b.length+' poz.)'}}}catch(e){}try{if(!s.qty&&!s.qtySrc){var _qc=qtyCell([].concat((info||{}).allBoxes||[],(info||{}).sheetBoxes||[]));if(_qc){s.qty=_qc.qty;s.qtySrc=_qc.src}}}catch(e){}s.ms=0;window.__qtyLast=s}catch(e){}
  var self=this,args=arguments;return cellStep(info,s).then(function(){
  var ui=window.p2CheckpointUI;if(s&&ui&&(s.qty||s.mat||s.thick||(s.bom&&s.bom.length))){window.p2CheckpointUI=function(fm){fm.qtyMat=s;return ui(fm)}}
  return pm.apply(self,args).then(function(r){window.p2CheckpointUI=ui;return r},function(e){window.p2CheckpointUI=ui;throw e})})};
 w.__qty=1;w.__vlm=pm.__vlm;w.__f2=pm.__f2;window.p2Mid=w}
wrap();window.addEventListener('load',function(){setTimeout(wrap,5)});
})(typeof window!=='undefined'?window:globalThis);
