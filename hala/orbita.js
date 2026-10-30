/* HALA f2 etap B — orbita DOM/CSS 3D + fallback body.fb. Kontrakt: hala_f2_handoff_t841/CONTRACT_ORBIT.md. WebGL = etap C (stub). */
(function(){if(!document.body.classList.contains('hala'))return;
var q=new URLSearchParams(location.search);
var OT={'NOWY PROJEKT':['NEW PROJECT','NEUES PROJEKT'],'zacznij od rysunku':['start from a drawing','mit Zeichnung starten'],'OTWÓRZ PLIK':['OPEN FILE','DATEI ÖFFNEN'],'PDF lub zdjęcie':['PDF or photo','PDF oder Foto'],'OSTATNIE':['RECENT','ZULETZT'],'historia projektów':['project history','Projektverlauf'],'USTAWIENIA':['SETTINGS','EINSTELLUNGEN'],'język · stół':['language · table','Sprache · Tisch'],'WYBIERZ':['CHOOSE','AUSWÄHLEN'],'DALEJ: ':['NEXT: ','WEITER: '],'Dotknij elementu na orbicie':['Tap an item on the orbit','Element auf der Umlaufbahn antippen'],'Dotknij ponownie, aby wejść':['Tap again to open','Erneut tippen zum Öffnen'],'Menu (lista zapasowa)':['Menu (fallback list)','Menü (Ersatzliste)']};
function lng(){var l=(q.get('lang')||localStorage.getItem('oria_lang')||document.documentElement.lang||'pl').toUpperCase();return l==='EN'?0:l==='DE'?1:-1}
function tr(k){var i=lng();return i<0||!OT[k]?k:OT[k][i]}
var N=[{k:'nowy',t:'NOWY PROJEKT',d:'zacznij od rysunku',i:'<path class="f" d="M5 17l7-5h24l7 5z"/><path d="M5 17l7-5h24l7 5zM5 17v3h38v-3"/><path d="M9 20v20M39 20v20M13 20v14M35 20v14M9 33h30"/><path class="a" d="M24 4v5M20 6l2 3M28 6l-2 3"/><path d="M17 14h14" class="a" stroke-dasharray="2 2"/>'},
{k:'otworz',t:'OTWÓRZ PLIK',d:'PDF lub zdjęcie',i:'<path class="f" d="M6 30l18-9 18 9-18 9z"/><path d="M6 30l18-9 18 9-18 9zM6 30v3l18 9 18-9v-3"/><path d="M6 23l18-9 18 9" /><path class="a" d="M6 16l18-9 18 9"/><path class="a" d="M14 34l4 2"/>'},
{k:'ostatnie',t:'OSTATNIE',d:'historia projektów',i:'<circle class="f" cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="16"/><path d="M24 14v10l7 5"/><path class="a" d="M24 9v2M24 37v2M9 24h2M37 24h2"/>'},
{k:'ustaw',t:'USTAWIENIA',d:'język · stół',i:'<path class="f" d="M24 8l3 5 6-1 1 6 5 3-3 5 3 5-5 3-1 6-6-1-3 5-3-5-6 1-1-6-5-3 3-5-3-5 5-3 1-6 6 1z"/><path d="M24 8l3 5 6-1 1 6 5 3-3 5 3 5-5 3-1 6-6-1-3 5-3-5-6 1-1-6-5-3 3-5-3-5 5-3 1-6 6 1z"/><circle class="a" cx="24" cy="24" r="6"/>'}];window.HALA_N=N;
var sel=q.has('sel')?+q.get('sel'):-1,root,ring,list,cta,hint;
function emit(n,d){try{window.dispatchEvent(new CustomEvent('orbit:'+n,{detail:d}))}catch(e){}}
function weak(){try{var c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');if(!g)return 'nogl';if(g.getParameter(g.MAX_TEXTURE_SIZE)<4096)return 'tex'}catch(e){return 'nogl'}/* a11y 1401: reduced-motion NIE przełącza na listę; GL statyczny (orbita_gl.js) */return ''}
function build(){root=document.createElement('div');root.id='horbit';root.hidden=true;
root.innerHTML='<div class="top"><div class="logo">ORIAWELD<sub>SI</sub></div></div><div class="stage"><div class="ring" id="hring"></div></div><div class="hint" id="hhint"></div><button class="cta" id="hcta" type="button"></button><nav class="list" id="hlist"></nav>';
document.body.appendChild(root);ring=root.querySelector('.ring');list=root.querySelector('.list');cta=root.querySelector('.cta');hint=root.querySelector('.hint');
var fp=q.get('fallback'),r=fp==='1'?'param':(fp==='0'?'':weak());
if(r){document.body.classList.add('fb');emit('fallback',{reason:r})}
N.forEach(function(n,i){var svg='<svg viewBox="0 0 48 48">'+n.i+'</svg>';var b=document.createElement('button');b.type='button';b.className='n';b.dataset.k=n.k;b.style.setProperty('--a',(i*90)+'deg');
b.innerHTML=svg+'<b>'+tr(n.t)+'</b><small>'+tr(n.d)+'</small>';b.onclick=function(){pick(i)};ring.appendChild(b);
var l=document.createElement('button');l.type='button';l.dataset.k=n.k;l.innerHTML=svg+'<span><b>'+tr(n.t)+'</b><small>'+tr(n.d)+'</small></span>';l.onclick=function(){pick(i)};list.appendChild(l)});
list.setAttribute('aria-label',tr('Menu (lista zapasowa)'));cta.onclick=function(){if(sel>=0)pick(sel)};render();
if(document.body.classList.contains('fb')||!window.HALA_GL||!HALA_GL.init(root,pick,function(){return sel}))emit('ready',{gl:false})}
function render(){ring.style.setProperty('--rz',(sel<0?0:-sel*90)+'deg');[].forEach.call(ring.children,function(b,i){b.classList.toggle('sel',i===sel)});[].forEach.call(list.children,function(b,i){b.classList.toggle('sel',i===sel)});
if(window.HALA_GL&&HALA_GL.on)HALA_GL.select(sel);cta.textContent=sel<0?tr('WYBIERZ'):tr('DALEJ: ')+tr(N[sel].t);hint.textContent=sel<0?tr('Dotknij elementu na orbicie'):tr('Dotknij ponownie, aby wejść')}
var entered=false,lastK=null;function hide(){entered=true;root.classList.add('out');setTimeout(function(){root.hidden=true;root.classList.remove('out');if(window.HALA_GL&&HALA_GL.on)HALA_GL.pause()},300)}
function enter(i){entered=true;if(window.HALA_GL&&HALA_GL.on){HALA_GL.enter(i,function(){go(i)})}else go(i)}
function go(i){var k=N[i].k;lastK=k;emit('enter',{i:i,k:k});hide();route(k)}
function route(k){
 if(k==='nowy'){var b=document.querySelector('#mnav [data-n=scan]');if(b&&!b.classList.contains('on'))b.click()}
 else if(k==='otworz'){var t=document.querySelector('#app .tile[data-i="0"]');if(t)t.click();setTimeout(function(){var f=document.querySelector('#app label.fbtn>input[type=file]');if(f)f.click()},250)}
 else if(k==='ostatnie'){try{HIST.show()}catch(e){console.error(e)}}
 else if(k==='ustaw'){var s=document.querySelector('#mnav [data-n=set]');if(s)s.click()}}
function pick(i){if(!root||!N[i])return;if(sel===i){enter(i);return}sel=i;render();emit('select',{i:i,k:N[i].k})}
window.HALA_ORBIT={pick:pick,show:function(){if(!root)build();root.hidden=false;if(window.HALA_GL&&HALA_GL.on)HALA_GL.resume();render()},hide:hide,get sel(){return sel}};
window.addEventListener('orbit:select',function(e){if(e.detail&&e.detail.src==='gl'&&e.detail.i!==sel){sel=e.detail.i;render()}});
/* splash -> orbita: po "Rozpocznij" (m21go) */
document.addEventListener('click',function(e){var g=e.target.closest&&e.target.closest('#splash .m21go');if(g)setTimeout(once,50)},true);
var shown=false;function once(){if(entered){/* splash zniknął po wejściu: nie pokazuj orbity, odśwież routing (live po splashu wraca do huba) */if(lastK==='ustaw'||lastK==='nowy'){route(lastK);setTimeout(function(){route(lastK)},1000)}return}if(shown)return;shown=true;HALA_ORBIT.show()}
/* splash znika sam (auto-fade live) -> też orbita */
(function(){var sp=document.getElementById('splash');if(!sp)return;var mo=new MutationObserver(function(){if(!document.body.contains(sp)||sp.classList.contains('out')||sp.hidden||getComputedStyle(sp).display==='none'){mo.disconnect();setTimeout(once,50)}});mo.observe(sp,{attributes:true});mo.observe(document.body,{childList:true})})();
if(q.get('orbit')==='1')setTimeout(function(){if(!entered)HALA_ORBIT.show()},300);
})();
