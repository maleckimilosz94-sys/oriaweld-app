// Gesty – warstwa UI (tylko układ): dok, chip stanu, pływający podgląd w rogu (zwijanie + przeciąganie do rogu). Nie dotyka wykrywania dłoni.
(function(){
var IC={open:"M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v7M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13M8 12l-1.6-1.8a1.5 1.5 0 0 0-2.3 1.9L7.5 17a6 6 0 0 0 5 3h.5a5 5 0 0 0 5-5v-4.5a1.5 1.5 0 0 0-3 0",
 pinch:"M7 17l4-4M13 11l4-4M7 13v4h4M17 11V7h-4",fist:"M6 6l12 12M18 6L6 18",lost:"M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M9 12h6",load:"M12 3a9 9 0 1 1-9 9"};
var LB={pl:{open:'Obrót',pinch:'Zoom',fist:'Stop',lost:'Pauza',load:'Start…'},en:{open:'Rotate',pinch:'Zoom',fist:'Stop',lost:'Paused',load:'Starting…'},de:{open:'Drehen',pinch:'Zoom',fist:'Stopp',lost:'Pause',load:'Start…'}};
function svg(d){return 'url("data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#000' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='"+d+"'/></svg>")+'")'}
function lang(){var l='pl';try{l=localStorage.getItem('oria_lang')||'pl'}catch(e){}var m=location.hash.match(/lang=(en|pl|de)/);return LB[m?m[1]:l]?(m?m[1]:l):'pl'}
var M=8,corner=(function(){try{return localStorage.getItem('gesty_pv_corner')||'tr'}catch(e){return 'tr'}})(),mini=false;
function place(pv,c){var u=pv.parentNode;if(!u)return;var W=u.clientWidth,H=u.clientHeight,w=pv.offsetWidth,h=pv.offsetHeight,
 top=Math.max(M,parseInt(getComputedStyle(u).getPropertyValue('--g-top'))||0),bot=60; // dół: miejsce na dok
 pv.style.left=(c[1]=='l'?M:W-w-M)+'px';pv.style.top=(c[0]=='t'?top:H-h-bot)+'px';pv.dataset.corner=c}
function wire(){var u=document.getElementById('gestUI');if(!u||u.dataset.ui2)return;u.dataset.ui2=1;
 var b=u.querySelector('#gestBtn'),c=u.querySelector('#gestCam'),pv=u.querySelector('#gestPv');
 var d=document.createElement('div');d.id='gestDock';d.appendChild(b);d.appendChild(c);var ch=document.createElement('div');ch.id='gestChip';ch.hidden=true;ch.setAttribute('role','status');ch.innerHTML='<i></i><span></span>';d.appendChild(ch);u.insertBefore(d,pv);
 /* BETA (v95): odznaka na przycisku + krótka notka przy włączonym sterowaniu */ var bg=document.createElement('span');bg.className='gestBeta';bg.setAttribute('aria-hidden','true');bg.textContent='BETA';b.appendChild(bg);var nt=document.createElement('div');nt.id='gestNote';nt.hidden=true;nt.setAttribute('role','note');d.appendChild(nt);
 [b,c].forEach(function(x){x.setAttribute('aria-label',x.textContent.replace(/^\W+\s*/,'').replace(/BETA$/,''));x.title=x.getAttribute('aria-label');new MutationObserver(function(){var t=x.textContent.replace(/^\W+\s*/,'').replace(/BETA$/,'');if(x.getAttribute('aria-label')!=t){x.setAttribute('aria-label',t);x.title=t}}).observe(x,{childList:true,characterData:true,subtree:true})});
 var mb=document.createElement('button');mb.id='gestMin';mb.type='button';mb.setAttribute('aria-label','–');pv.appendChild(mb);
 mb.addEventListener('click',function(e){e.stopPropagation();if(pv._moved)return;mini=!mini;pv.classList.toggle('min',mini);setTimeout(function(){place(pv,corner)},0);place(pv,corner)});
 // przeciąganie -> przyciąganie do najbliższego rogu
 var sx,sy,ox,oy,on=false;pv.addEventListener('pointerdown',function(e){on=true;pv._moved=false;sx=e.clientX;sy=e.clientY;ox=pv.offsetLeft;oy=pv.offsetTop;try{pv.setPointerCapture(e.pointerId)}catch(_){}e.stopPropagation()});
 pv.addEventListener('pointermove',function(e){if(!on)return;var dx=e.clientX-sx,dy=e.clientY-sy;if(!pv._moved&&Math.hypot(dx,dy)<6)return;pv._moved=true;pv.classList.add('drag');pv.style.left=(ox+dx)+'px';pv.style.top=(oy+dy)+'px'});
 function end(){if(!on)return;on=false;pv.classList.remove('drag');if(pv._moved){var W=u.clientWidth,H=u.clientHeight,cx=pv.offsetLeft+pv.offsetWidth/2,cy=pv.offsetTop+pv.offsetHeight/2;
  corner=(cy<H/2?'t':'b')+(cx<W/2?'l':'r');try{localStorage.setItem('gesty_pv_corner',corner)}catch(_){}place(pv,corner);setTimeout(function(){pv._moved=false},50)}}
 pv.addEventListener('pointerup',end);pv.addEventListener('pointercancel',end);
 new MutationObserver(function(){if(!pv.hidden)place(pv,corner)}).observe(pv,{attributes:true,attributeFilter:['hidden']});
 if(window.ResizeObserver)new ResizeObserver(function(){place(pv,corner)}).observe(u);
 place(pv,corner)}
function tick(){wire();var g=window.__gesty,ch=document.getElementById('gestChip');var nt=document.getElementById('gestNote');if(nt){var A=(window.AR_I18N||{})[lang()]||{};var gb=document.getElementById('gestBtn'),bt=gb&&gb.querySelector('.gestBeta');if(gb&&!bt){bt=document.createElement('span');bt.className='gestBeta';bt.setAttribute('aria-hidden','true');gb.appendChild(bt)}if(bt&&A.gBeta)bt.textContent=A.gBeta;nt.textContent=A.gBetaNote||'';nt.hidden=!(g&&g.on)}if(ch&&g){if(!g.on){ch.hidden=true}else{var s=g.stats||{},k=!s.n?'load':(g.log&&g.log.length&&g.log[g.log.length-1].p)?'lost':(s.gesture=='pinch'||s.gesture=='fist'?s.gesture:'open');
 if(ch.dataset.g!=k||ch.dataset.l!=lang()){ch.dataset.g=k;ch.dataset.l=lang();ch.querySelector('i').style.setProperty('--ic',svg(IC[k]));ch.querySelector('span').textContent=LB[lang()][k]}ch.hidden=false}}}
setInterval(tick,200);
window.__gestyUI={place:function(c){corner=c;var pv=document.getElementById('gestPv');if(pv)place(pv,c)}};
})();
