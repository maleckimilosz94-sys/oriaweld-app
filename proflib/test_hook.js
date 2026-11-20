// test prof_hook (węzeł, bez przeglądarki): node proflib/test_hook.js
global.window=global;global.location={hash:'',search:''};global.localStorage={getItem:function(){return null}};
global.fetch=function(){return new Promise(function(){})};
var PL=global.ProfLib=require('./profile_lib.js');PL.load(require('./profile_lib.json'));
require('./prof_hook.js');
// po fetch brak – wstrzyknij bibliotekę przez ProfLib.load i wymuś L przez drugi load: hook trzyma własne L → ustawiamy przez fetch-mock
var ok=0,bad=0;function T(n,c){if(c)ok++;else{bad++;console.log('FAIL',n)}}
global.fetch=function(){return Promise.resolve({json:function(){return Promise.resolve(require('./profile_lib.json'))}})};
delete require.cache[require.resolve('./prof_hook.js')];require('./prof_hook.js');
setTimeout(function(){
 T('ready',window.__plReady===1);
 T('t 2.8->3',window.__plT(2.8,'x')===3); T('t 3->3 bez rec',window.__plT(3,'x')===3);
 T('t 7 -> 6 lub 8 (Δ1 >20%? 7→6: 1<=1.4)',[6,8].indexOf(window.__plT(7,'x'))>=0);
 T('t 0.3 bez zmian',window.__plT(0.3)===0.3);
 T('w 41->40',window.__plW(41,'x')===40); T('w 47->50',window.__plW(47,'x')===50||window.__plW(47,'x')===47);
 T('w 55 (między 50 a 60) bez zmiany gdy Δ>tol',[50,60,55].indexOf(window.__plW(55,'x'))>=0);
 T('w 200 bez zmian',window.__plW(200,'x')===200);
 var s=window.__plShs(40,40);T('shs 40x40 -> 40x40x3',s&&s.name==='SHS 40x40x3');
 T('label',window.__plLabel(s).indexOf('40×40×3')>=0);
 T('shs 33 brak',window.__plShs(33,33)===null);
 location.hash='#proflib=0';T('off',window.__plOn()===false&&window.__plT(2.8)===2.8&&window.__plW(41)===41);
 console.log('WYNIK',ok+'/'+(ok+bad));
},50);
