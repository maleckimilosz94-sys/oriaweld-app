/* oria-207 proflib (WIP, osobny branch, NIE wpięte w aplikację): biblioteka standardowych profili + parser oznaczeń z rysunku.
   API (window.ProfLib albo module.exports): load(json) · parse(tekst) → {fam,name,dims,kg_m,A_mm2,match:'exact'|'nearest'|'custom'} | null
   · nearest(fam,dims) · std(kind) → domyślne wartości dla modelu bez wymiarów · mass(p,len_mm) → kg. */
(function(root){
var LIB=null;
function load(j){LIB=j;return LIB}
function num(s){return parseFloat(String(s).replace(',','.'))}
var X='\\s*[x×X\\*]\\s*',N='(\\d+(?:[.,]\\d+)?)';
var RX=[
 {fam:'CHS',re:new RegExp('(?:CHS|RURA|ROHR|TUBE|PIPE|[ØøΦ⌀])\\s*'+N+X+N,'i'),f:function(m){return {d:num(m[1]),t:num(m[2])}}},
 {fam:'SHS/RHS',re:new RegExp('(?:SHS|RHS|PROFIL\\s+ZAMKNI[ĘE]TY|PROFIL|KWADRAT|QUADRATROHR|RECHTECKROHR)\\s*'+N+X+N+X+N,'i'),f:function(m){return {h:num(m[1]),b:num(m[2]),t:num(m[3])}}},
 {fam:'L',re:new RegExp('(?:\\bL|K[ĄA]TOWNIK|WINKEL|ANGLE)\\s*'+N+X+N+'(?:'+X+N+')?','i'),f:function(m){return m[3]?{a:num(m[1]),b:num(m[2]),t:num(m[3])}:{a:num(m[1]),b:num(m[1]),t:num(m[2])}}},
 {fam:'UPN',re:/(?:UPN|\bU|\bC|CEOWNIK|U-STAHL)\s*(\d{2,3})\b/i,f:function(m){return {h:+m[1]}}},
 {fam:'IPE',re:/IPE\s*(\d{2,3})\b/i,f:function(m){return {h:+m[1]}}},
 {fam:'HEA',re:/HE\s*(\d{2,3})\s*A\b|HEA\s*(\d{2,3})\b/i,f:function(m){return {n:+(m[1]||m[2])}}},
 {fam:'HEB',re:/HE\s*(\d{2,3})\s*B\b|HEB\s*(\d{2,3})\b/i,f:function(m){return {n:+(m[1]||m[2])}}},
 {fam:'FL',re:new RegExp('(?:FL|P[ŁL]ASKOWNIK|FLACHSTAHL|FLAT(?:\\s*BAR)?)\\s*'+N+X+N,'i'),f:function(m){return {b:num(m[1]),t:num(m[2])}}},
 {fam:'SHS/RHS',re:new RegExp('(?:^|\\s)'+N+X+N+X+N+'(?:\\s|$)'),f:function(m){return {h:num(m[1]),b:num(m[2]),t:num(m[3])}},weak:1}];
function pl(){return (LIB&&LIB.profiles)||[]}
function key(fam,d){if(fam==='CHS')return ['d','t'];if(fam==='L')return ['a','b','t'];if(fam==='FL')return ['b','t'];if(fam==='SHS'||fam==='RHS'||fam==='SHS/RHS')return ['h','b','t'];return ['h','b','tw','tf']}
function nearest(fam,d){var P=pl().filter(function(p){return fam==='SHS/RHS'?(p.fam==='SHS'||p.fam==='RHS'):p.fam===fam});if(!P.length)return null;
 if(fam==='UPN'||fam==='IPE')return P.filter(function(p){return p.h===d.h})[0]||null;if(fam==='HEA'||fam==='HEB')return P.filter(function(p){return +p.name.split(' ')[1]===d.n})[0]||null;
 var K=key(fam),best=null,bs=1e9;P.forEach(function(p){var s=0,ok=true;K.forEach(function(k){if(d[k]==null||p[k]==null)return;var a=Math.max(d[k],p[k]);s+=Math.abs(d[k]-p[k])/a;});if(fam==='L'&&p.a!==d.a&&p.a===d.b&&p.b===d.a)s=0;if(s<bs){bs=s;best=p;}});return best?Object.assign({score:+bs.toFixed(3)},best):null}
function parse(txt){var s=String(txt||'');for(var i=0;i<RX.length;i++){var r=RX[i],m=s.match(r.re);if(!m)continue;var d=r.f(m),n=nearest(r.fam,d),exact=n&&(n.score===0||n.score==null);
 if(n&&exact)return {fam:n.fam,name:n.name,dims:d,kg_m:n.kg_m,A_mm2:n.A_mm2,match:'exact',weak:!!r.weak};
 return {fam:r.fam==='SHS/RHS'?(d.h===d.b?'SHS':'RHS'):r.fam,name:null,dims:d,kg_m:n&&n.score<0.15?n.kg_m:null,near:n&&n.name,match:n&&n.score<0.15?'nearest':'custom',weak:!!r.weak};}return null}
function std(kind){var D=(LIB&&LIB.defaults)||{};var g=function(nm){return pl().filter(function(p){return p.name===nm})[0]||null};
 if(kind==='plate')return {t:D.plate_t||5,src:'standard: blacha '+(D.plate_t||5)+' mm'};if(kind==='bent')return {t:D.bent_t||3,src:'standard: blacha gięta '+(D.bent_t||3)+' mm'};
 if(kind==='frame')return {profile:g(D.frame_profile),src:'standard: '+D.frame_profile};if(kind==='pipe'||kind==='rot')return {profile:g(D.tube),src:'standard: '+D.tube};
 if(kind==='mixed')return {profile:g(D.frame_profile),plate_t:D.plate_t||5,src:'standard: '+D.frame_profile+' + blacha '+(D.plate_t||5)+' mm'};return {src:'brak standardu'}}
function snapT(t){var S=(LIB&&LIB.sheet_t_mm)||[];var b=null;S.forEach(function(x){if(b==null||Math.abs(x-t)<Math.abs(b-t))b=x});return b}
function mass(p,len){return p&&p.kg_m?+(p.kg_m*len/1000).toFixed(2):null}
var API={load:load,parse:parse,nearest:nearest,std:std,snapT:snapT,mass:mass};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.ProfLib=API;
})(this);
