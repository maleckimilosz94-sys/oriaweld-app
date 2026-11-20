const P=require('./profile_lib.js');P.load(require('./profile_lib.json'));
const T=[['RHS 40x40x3','SHS 40x40x3'],['rura Ø48,3x2,6','CHS 48.3x2.6'],['L 50x5','L 50x50x5'],['kątownik 40x40x4','L 40x40x4'],['UPN 100','UPN 100'],['IPE200','IPE 200'],['HEB 160','HEB 160'],['FL 40x5','FL 40x5'],['płaskownik 20x5','FL 20x5'],['profil zamknięty 60x40x3','RHS 60x40x3'],['80x40x3','RHS 80x40x3'],['Ø34x3','~'],['L 20x20x3','L 20x20x3'],['tekst bez profilu',null]];
let ok=0;T.forEach(([s,w])=>{const r=P.parse(s);const got=r?(r.name||('~'+(r.near||''))):null;const pass=w===null?r===null:w==='~'?(r&&r.match!=='exact'):got===w;if(pass)ok++;console.log(pass?'OK ':'ŹLE',JSON.stringify(s),'→',JSON.stringify(r&&{name:r.name,fam:r.fam,match:r.match,kg_m:r.kg_m,near:r.near}));});
console.log('std plate',JSON.stringify(P.std('plate')),'frame',P.std('frame').src,'snapT(2.8)=',P.snapT(2.8),'mass SHS40 1m=',P.mass(P.parse('SHS 40x40x3'),1000));
console.log('WYNIK',ok+'/'+T.length);
