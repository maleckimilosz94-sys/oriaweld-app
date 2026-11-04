/* OriaElementClassifier v0.1 (t956u P3) — klasyfikacja REGUŁAMI (nie AI). Wynik = SUGESTIA do P2 (final:false), nigdy nie nadpisuje wyboru użytkownika.
   Reguły: przekrój okrągły/owalny + Ø → rura | prostokąt zamknięty (ścianka t < min(w,h)/2) → profil | płaska powierzchnia + grubość (t ≤ 0.25·min wymiaru płaszczyzny) → blacha/płyta (t≥8 mm → płyta).
   Wejście element: {id, section:{shape:'circle'|'oval'|'rect'|'flat', d, d2, w, h, t, closed}, L, A:[a,b]} lub tekst wymiaru (Ø, □, t=). Flaga: ?elemcls=1 / __elemCls=1 (OFF). */
(function(root){
  function rule(e){var s=e&&e.section||{},sh=s.shape,t=+s.t||null;
    if((sh==='circle'||sh==='oval')&&(+s.d>0)){return {type:'rura',why:(sh==='oval'?'przekrój owalny':'przekrój okrągły')+' + Ø'+s.d+(s.d2?'/'+s.d2:'')+(t?' ×'+t:''),rule:'R1'};}
    if(sh==='rect'&&s.closed&&+s.w>0&&+s.h>0&&(t==null||t<Math.min(s.w,s.h)/2)){return {type:'profil',why:'prostokąt zamknięty '+s.w+'×'+s.h+(t?'×'+t:''),rule:'R2'};}
    var A=e&&e.A;if((sh==='flat'||(sh==='rect'&&!s.closed))&&t>0){var m=A&&A.length===2?Math.min(A[0],A[1]):Math.max(+s.w||0,+s.h||0);
      if(m>0&&t<=0.25*m)return {type:t>=8?'płyta':'blacha',why:'płaska powierzchnia + grubość t='+t+(A?' ('+A[0]+'×'+A[1]+')':''),rule:'R3'};}
    if(e&&e.kw==='profil')return {type:'profil',why:'słowo kluczowe profilu w tekście: '+e.src,rule:'K1'};
    if(e&&e.kw==='bom'&&e.bt)return {type:e.bt,why:'wiersz BOM poz.'+e.pos+': '+e.src,rule:'K3'};
    if(e&&e.kw==='bent')return {type:'gięta',why:'blacha + gięcie w tekście: '+e.src,rule:'K2'};
    return {type:null,why:'brak reguły — decyzja w P2',rule:null};}
  function fromText(txt){txt=String(txt||'');var m;
    if((m=txt.match(/[Øø⌀]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?/)))return {section:{shape:'circle',d:+m[1].replace(',','.'),t:m[2]?+m[2].replace(',','.'):null}};
    if((m=txt.match(/(?:□|RK|RHS|SHS|kw\.?)\s*(\d+)\s*[x×]\s*(\d+)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?/i)))return {section:{shape:'rect',closed:true,w:+m[1],h:+m[2],t:m[3]?+m[3].replace(',','.'):null}};
    if((m=txt.match(/(?:\bt\s*=?\s*|BL\s*|blacha\s*)(\d+(?:[.,]\d+)?)/i)))return {section:{shape:'flat',t:+m[1].replace(',','.')}};
    return null;}
  var KMAP={rura:'Rury okrągłe',profil:'Profile zamknięte',blacha:'Blachy / płyty','płyta':'Blachy / płyty'};
  function classify(elements,opts){opts=opts||{};elements=elements||[];var strong=elements.filter(function(e){return !e.ocr0&&e.kw!=='bom'&&rule(e).type});if(strong.length)elements=strong.concat(elements.filter(function(e){return e.kw==='bom'}));/* t981: BOM addytywny — nie wypiera słabych ocr0 */var out=(elements||[]).map(function(e,i){var r=rule(e);return {id:e.id||('E'+(i+1)),type:r.type,why:r.why,rule:r.rule};});
    var ty={};out.forEach(function(o){if(o.type)ty[o.type==='płyta'?'blacha':o.type]=1;});var k=Object.keys(ty),kind=null,label=null;if(ty['gięta']&&k.length===1)return {final:false,source:'reguły (nie AI)',kind:'bent',label:'Konstrukcja blaszana / gięta',profile:'Blachy / płyty',elements:out,unknown:out.filter(function(o){return !o.type;}).length};
    if(k.length===1){kind=k[0]==='profil'?'frame':k[0]==='blacha'?'plate':'mixed';label=k[0]==='profil'?'Rama (profile zamknięte)':k[0]==='blacha'?'Płaskowniki + płyty':'Rura + wsporniki + płyta';}
    else if(k.length>1){kind='mixed';label=ty.rura?'Rura + wsporniki + płyta':'Konstrukcja mieszana';}
    return {final:false,source:'reguły (nie AI)',kind:kind,label:label,profile:k.length===1?KMAP[k[0]]:k.length>1?'Mieszane':null,elements:out,unknown:out.filter(function(o){return !o.type;}).length};}
  /* do P2: tylko sugestia; jeśli użytkownik już wybrał (p2pre.kind≠auto) — nie ruszamy */
  function toP2(sug,w){w=w||(typeof window!=='undefined'?window:{});if(w.__p2pre&&w.__p2pre.kind&&w.__p2pre.kind!=='auto')return {applied:false,reason:'decyzja użytkownika ma pierwszeństwo'};
    w.__p2Suggest=sug;return {applied:true};}
  /* t961: tokeny wymiarów z całego tekstu silnika (OCR boxy) → elementy */
  function fromAll(txt,bomRows){txt=String(txt||'');var re=/[Øø⌀]\s*\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?|(?:□|RK|RHS|SHS)\s*\d+\s*[x×]\s*\d+(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?/gi,m,o=[],seen={};while((m=re.exec(txt))){var k=m[0].replace(/\s+/g,'').toUpperCase();if(seen[k])continue;seen[k]=1;var e=fromText(m[0]);if(e){e.src=m[0];o.push(e);}}
    /* t963: OCR czyta Ø jako wiodące „0” — tylko CAŁY box wymiaru: 0ddd lub 0dd(d),00 (np. „0205”, „045,00”); słabe (ocr0), odpadają gdy jest silny typ */
    if(!o.some(function(x){return x.section&&x.section.shape==='circle'}))txt.split(/\s*\|\s*/).forEach(function(seg){var q=/^0(\d{3})$/.exec(seg)||/^0(\d{2,3})[.,]00$/.exec(seg);if(q&&+q[1]>=10){var k='O'+(+q[1]);if(seen[k])return;seen[k]=1;o.push({section:{shape:'circle',d:+q[1]},src:seg,ocr0:1});}});
    /* t962: słowa kluczowe OCR (bez wymiarów) — tylko gdy brak tokenów wymiarowych tego typu */
    if(!o.some(function(x){return x.section&&x.section.shape==='rect'})&&(m=txt.match(/\b(RHS|SHS|Kwadratrohr|Rechteckrohr|profil zamkni\w*)\b/i)))o.push({kw:'profil',src:m[0]});
    var bl=txt.match(/\b(BLECH|Dicke\s*\(mm\))/),bg=txt.match(/Biege\w*|Kantteil|gięt\w*|\bR\d{1,3}\b/i),pl=/blach\w*\s+gięt|gięt\w*\s+blach/i.exec(txt);if(pl)o.push({kw:'bent',src:pl[0]});else if(bl&&bg)o.push({kw:'bent',src:bl[0]+' + '+bg[0]});else if((m=txt.match(/Biegeprozess|Kantteil/i)))o.push({kw:'bent',src:m[0]});
    /* t981: nazwy pozycji z tabeli BOM (ścisły parser qty_mat.bom, ≥2 wiersze) → typ elementu. Nieznana nazwa → pomijana (bez zgadywania). */
    (bomRows||[]).forEach(function(r){var nm=String(r&&r.name||''),bt=/gięt|kant/i.test(nm)?'gięta':/^(rur|rohr|tube|pipe)/i.test(nm)?'rura':/^(bl[ao]ch|blech|plate|p[łl]askownik|flach)/i.test(nm)?'blacha':/^profil\s+zamkn|^(RHS|SHS)\b/i.test(nm)?'profil':null;if(!bt)return;var k='B'+bt+r.pos;if(seen[k])return;seen[k]=1;o.push({kw:'bom',bt:bt,pos:r.pos,src:nm});});
    return o;}
  function infoTxt(i){try{if(!i)return '';var a=[].concat(i.allBoxes||[],i.sheetBoxes||[]).map(function(b){return b&&b.text||''});if(i.title&&i.title.text)a.push(i.title.text);(i.views||[]).forEach(function(v){(v&&v.boxes||[]).forEach(function(b){a.push(b&&b.text||'')})});return a.join(' | ')}catch(e){return ''}}
  /* t961: wpięcie w istniejący kanał sugestii P2 (fm.vlmKind → preselect w p2_checkpoint). VLM ma pierwszeństwo; pamięć pliku/wybór użytkownika — nie ruszamy. */
  function wrapP2(w){w=w||root;var pm=w.p2Mid;if(typeof pm!=='function'||pm.__elemcls)return false;
    var f=function(info){var self=this,args=arguments,ui=w.p2CheckpointUI,sug=null;
      try{var _it=infoTxt(info),Q=w.__qtyMat,_br=null;try{if(Q&&Q.bom)_br=Q.bom(_it);if(Q&&Q.bomCells&&Q.rowsText){var _bc=Q.bomCells(Q.rowsText([].concat((info||{}).allBoxes||[],(info||{}).sheetBoxes||[])));if(_bc&&_bc.length>(_br||[]).length)_br=_bc}}catch(_){}var el=fromAll(_it,_br);if(el.length){sug=classify(el);sug.from='tekst rysunku';}}catch(e){sug=null}
      w.__elemClsLast=sug;if(!sug||!sug.label||!toP2(sug,w).applied||typeof ui!=='function')return pm.apply(self,args);
      w.p2CheckpointUI=function(fm){if(fm&&!fm.vlmKind){fm.vlmKind=sug.label;fm.elemCls=sug;}return ui.apply(this,arguments)};
      var back=function(){if(w.p2CheckpointUI!==ui)w.p2CheckpointUI=ui};
      var r=pm.apply(self,args);if(r&&typeof r.then==='function')return r.then(function(x){back();return x},function(e){back();throw e});back();return r};
    f.__elemcls=1;f.__vlm=pm.__vlm;f.__f2=pm.__f2;w.p2Mid=f;return true;}
  var api={rule:rule,fromText:fromText,fromAll:fromAll,classify:classify,toP2:toP2,wrapP2:wrapP2};
  if(typeof window!=='undefined'&&!(typeof module!=='undefined'&&module.exports)){wrapP2(window);window.addEventListener('load',function(){setTimeout(function(){wrapP2(window)},0)});}
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaElementClassifier=api;
})(typeof window!=='undefined'?window:this);
