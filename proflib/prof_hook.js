/* oria-208 proflib hook: dopasowanie przekrojów oszacowanych z rastra do wymiarów standardowych (biblioteka proflib/profile_lib.json).
   Tylko tam, gdzie silnik zgaduje (pomiar z rastra / wartość domyślna) i odchyłka mieści się w tolerancji; wartości z opisu/wymiaru – bez zmian.
   Wyłącznik: #proflib=0 (lub ?proflib=0, window.__noProflib) = zachowanie 2.5. Brak biblioteki (np. offline bez cache) = brak dopasowania. */
(function(){
var L=null,REC=[];
function on(){try{if(window.__noProflib)return false;return !/[#&?]proflib=0(?:&|$)/.test(location.hash+'&'+location.search)}catch(e){return true}}
function lang(){var l='pl';try{l=(localStorage.getItem('oria_lang')||'pl').slice(0,2)}catch(e){}return (l==='en'||l==='de')?l:'pl'}
var TX={pl:{std:'norma',meas:'pomiar'},en:{std:'standard',meas:'measured'},de:{std:'Norm',meas:'gemessen'}};
function tx(k){return TX[lang()][k]}
function P(){return (L&&L.profiles)||[]}
function rec(what,from,to,name){var r={what:what,from:Math.round(from*10)/10,to:to,name:name||null};REC.push(r);if(REC.length>50)REC.shift();window.__plRec=REC;return r}
/* grubość blachy: najbliższa z typoszeregu, jeśli |Δ| ≤ max(0.5 mm, 20%) */
function plT(t,what){if(!on()||!L||!(t>0.6))return t;var S=L.sheet_t_mm||[],b=null;S.forEach(function(x){if(b==null||Math.abs(x-t)<Math.abs(b-t))b=x});if(b==null||b===t)return t;if(Math.abs(b-t)>Math.max(0.5,0.2*t))return t;rec(what||'t',t,b);return b}
/* bok profilu zamkniętego (SHS): najbliższy bok z biblioteki, jeśli |Δ| ≤ max(2 mm, 12%) */
function sides(){var s={};P().forEach(function(p){if(p.fam==='SHS'||p.fam==='RHS'){s[p.h]=1;s[p.b]=1}});return Object.keys(s).map(Number).sort(function(a,b){return a-b})}
function plW(w,what){if(!on()||!L||!(w>5))return w;var b=null;sides().forEach(function(x){if(b==null||Math.abs(x-w)<Math.abs(b-w))b=x});if(b==null||b===w)return w;if(Math.abs(b-w)>Math.max(2,0.12*w))return w;if(what!==false)rec(what||'w',w,b);return b}
/* standardowy profil SHS/RHS o bokach w×d: ścianka typowa (najbliższa w/13) */
function plShs(w,d){if(!on()||!L)return null;d=d||w;var c=P().filter(function(p){return (p.fam==='SHS'||p.fam==='RHS')&&((p.h===w&&p.b===d)||(p.h===d&&p.b===w))});if(!c.length)return null;var tt=w/13;c.sort(function(a,b){return Math.abs(a.t-tt)-Math.abs(b.t-tt)});return c[0]}
function label(p){return p?p.name.replace(/x/g,'×')+' ('+tx('std')+')':''}
function load(){try{if(!window.ProfLib)return;var u='proflib/profile_lib.json';fetch(u).then(function(r){return r.json()}).then(function(j){L=window.ProfLib.load(j);window.__plReady=1}).catch(function(e){window.__plErr=String(e&&e.message||e)})}catch(e){window.__plErr=String(e)}}
window.__plOn=on;window.__plT=plT;window.__plW=plW;window.__plShs=plShs;window.__plLabel=label;window.__plTx=tx;
load();
})();
