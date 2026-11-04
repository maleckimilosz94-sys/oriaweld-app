/* OriaElementClassifier v0.1 (t956u P3) — klasyfikacja REGUŁAMI (nie AI). Wynik = SUGESTIA do P2 (final:false), nigdy nie nadpisuje wyboru użytkownika.
   Reguły: przekrój okrągły/owalny + Ø → rura | prostokąt zamknięty (ścianka t < min(w,h)/2) → profil | płaska powierzchnia + grubość (t ≤ 0.25·min wymiaru płaszczyzny) → blacha/płyta (t≥8 mm → płyta).
   Wejście element: {id, section:{shape:'circle'|'oval'|'rect'|'flat', d, d2, w, h, t, closed}, L, A:[a,b]} lub tekst wymiaru (Ø, □, t=). Flaga: ?elemcls=1 / __elemCls=1 (OFF). */
(function(root){
  function rule(e){var s=e&&e.section||{},sh=s.shape,t=+s.t||null;
    if((sh==='circle'||sh==='oval')&&(+s.d>0)){return {type:'rura',why:(sh==='oval'?'przekrój owalny':'przekrój okrągły')+' + Ø'+s.d+(s.d2?'/'+s.d2:'')+(t?' ×'+t:''),rule:'R1'};}
    if(sh==='rect'&&s.closed&&+s.w>0&&+s.h>0&&(t==null||t<Math.min(s.w,s.h)/2)){return {type:'profil',why:'prostokąt zamknięty '+s.w+'×'+s.h+(t?'×'+t:''),rule:'R2'};}
    var A=e&&e.A;if((sh==='flat'||(sh==='rect'&&!s.closed))&&t>0){var m=A&&A.length===2?Math.min(A[0],A[1]):Math.max(+s.w||0,+s.h||0);
      if(m>0&&t<=0.25*m)return {type:t>=8?'płyta':'blacha',why:'płaska powierzchnia + grubość t='+t+(A?' ('+A[0]+'×'+A[1]+')':''),rule:'R3'};}
    return {type:null,why:'brak reguły — decyzja w P2',rule:null};}
  function fromText(txt){txt=String(txt||'');var m;
    if((m=txt.match(/[Øø⌀]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?/)))return {section:{shape:'circle',d:+m[1].replace(',','.'),t:m[2]?+m[2].replace(',','.'):null}};
    if((m=txt.match(/(?:□|RK|kw\.?)\s*(\d+)\s*[x×]\s*(\d+)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?/i)))return {section:{shape:'rect',closed:true,w:+m[1],h:+m[2],t:m[3]?+m[3].replace(',','.'):null}};
    if((m=txt.match(/(?:\bt\s*=?\s*|BL\s*|blacha\s*)(\d+(?:[.,]\d+)?)/i)))return {section:{shape:'flat',t:+m[1].replace(',','.')}};
    return null;}
  var KMAP={rura:'Rury okrągłe',profil:'Profile zamknięte',blacha:'Blachy / płyty','płyta':'Blachy / płyty'};
  function classify(elements,opts){opts=opts||{};var out=(elements||[]).map(function(e,i){var r=rule(e);return {id:e.id||('E'+(i+1)),type:r.type,why:r.why,rule:r.rule};});
    var ty={};out.forEach(function(o){if(o.type)ty[o.type==='płyta'?'blacha':o.type]=1;});var k=Object.keys(ty),kind=null,label=null;
    if(k.length===1){kind=k[0]==='profil'?'frame':k[0]==='blacha'?'plate':'mixed';label=k[0]==='profil'?'Rama (profile zamknięte)':k[0]==='blacha'?'Płaskowniki + płyty':'Rura + wsporniki + płyta';}
    else if(k.length>1){kind='mixed';label=ty.rura?'Rura + wsporniki + płyta':'Konstrukcja mieszana';}
    return {final:false,source:'reguły (nie AI)',kind:kind,label:label,profile:k.length===1?KMAP[k[0]]:k.length>1?'Mieszane':null,elements:out,unknown:out.filter(function(o){return !o.type;}).length};}
  /* do P2: tylko sugestia; jeśli użytkownik już wybrał (p2pre.kind≠auto) — nie ruszamy */
  function toP2(sug,w){w=w||(typeof window!=='undefined'?window:{});if(w.__p2pre&&w.__p2pre.kind&&w.__p2pre.kind!=='auto')return {applied:false,reason:'decyzja użytkownika ma pierwszeństwo'};
    w.__p2Suggest=sug;return {applied:true};}
  var api={rule:rule,fromText:fromText,classify:classify,toP2:toP2};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaElementClassifier=api;
})(typeof window!=='undefined'?window:this);
