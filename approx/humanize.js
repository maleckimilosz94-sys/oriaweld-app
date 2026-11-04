/* approx-p2-ui: z makiety P2 hybrydowej (testy_grafika/approx_p2_hybrid/humanize.js), bez zmian treści. */
// Overlay potocznych tekstów pytań (id→tekst) + miniatury SVG. Fixtures JSON bez zmian.
window.Q_HUMAN={
pl:{q_rib:"Są jakieś żebra albo wsporniki między tarczami?",q_back:"Czy z tyłu też są takie same belki jak z przodu?",q_brace:"Są skosy / zastrzały z boku?",q_depth:"Głębokość wyszła nam ok. 1612 mm — zgadza się?",q_mid:"Ta belka w środku jest mniej więcej w połowie wysokości?",q_dims:"Ile ten wspornik ma wysokości, szerokości i głębokości?",q_bend:"Tylna półka jest zagięta w tę samą stronę co przednia?",q_top:"Na górze jest płyta, która spina te płaskowniki?"},
en:{q_rib:"Are there any ribs or supports between the discs?",q_back:"Does the back have the same beams as the front?",q_brace:"Any diagonal braces on the sides?",q_depth:"We got a depth of about 1612 mm — does that sound right?",q_mid:"Is that middle beam roughly halfway up?",q_dims:"How tall, wide and deep is this bracket?",q_bend:"Is the back flange bent the same way as the front one?",q_top:"Is there a top plate tying these flat bars together?"},
de:{q_rib:"Gibt es Rippen oder Stützen zwischen den Scheiben?",q_back:"Hat die Rückseite die gleichen Riegel wie vorne?",q_brace:"Gibt es seitlich Schrägstreben?",q_depth:"Wir kommen auf ca. 1612 mm Tiefe — passt das?",q_mid:"Sitzt der mittlere Riegel ungefähr auf halber Höhe?",q_dims:"Wie hoch, breit und tief ist die Konsole?",q_bend:"Ist der hintere Schenkel in dieselbe Richtung gekantet wie der vordere?",q_top:"Gibt es oben eine Platte, die die Flachstähle verbindet?"}};
window.Q_KIND={pl:{exists:"czy to jest?",depth:"wymiar",position:"gdzie?",orientation:"w którą stronę?",type:"co to jest?"},en:{exists:"is it there?",depth:"size",position:"where?",orientation:"which way?",type:"what is it?"},de:{exists:"gibt es das?",depth:"Maß",position:"wo?",orientation:"welche Richtung?",type:"was ist das?"}};
(function(){
var C='#22d3ee',V='#9b74f8',G='#64748b',F='rgba(34,211,238,.18)',FV='rgba(155,116,248,.18)';
function box(x,y,w,h,d,s,f){ // prosty izometryczny prostopadłościan
 return '<path d="M'+x+' '+y+'h'+w+'v'+h+'h-'+w+'z M'+x+' '+y+'l'+d+' -'+d+'h'+w+'l-'+d+' '+d+' M'+(x+w)+' '+y+'l'+d+' -'+d+'v'+h+'l-'+d+' '+d+'" fill="'+(f||'none')+'" stroke="'+(s||G)+'" stroke-width="1.5" stroke-linejoin="round"/>'}
var A='<defs><marker id="ar" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L6 3L0 6z" fill="'+V+'"/></marker></defs>';
var S={
 frame:function(hl){ // rama: przód + tył, rygle
  var s=box(14,24,48,48,16,G);
  s+='<path d="M14 48h48" stroke="'+G+'" stroke-width="1.5"/>';
  if(hl==='back')s+='<path d="M30 8h48M30 32h48M30 8v48" stroke="'+C+'" stroke-width="3"/>';
  if(hl==='brace')s+='<path d="M62 72l16-40M62 24l16 32" stroke="'+C+'" stroke-width="3"/>';
  if(hl==='mid')s+='<path d="M14 48h48" stroke="'+C+'" stroke-width="3.5"/><path d="M6 72V48" stroke="'+V+'" stroke-width="1.5" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="2" y="44" fill="'+V+'" font-size="9">½</text>';
  return s},
 spool:function(){return '<ellipse cx="22" cy="46" rx="8" ry="24" fill="none" stroke="'+G+'" stroke-width="1.5"/><ellipse cx="66" cy="46" rx="8" ry="24" fill="none" stroke="'+G+'" stroke-width="1.5"/><path d="M22 22h44M22 70h44" stroke="'+G+'" stroke-width="1"/><rect x="34" y="38" width="20" height="16" fill="'+F+'" stroke="'+C+'" stroke-width="2.5"/><text x="40" y="34" fill="'+C+'" font-size="11">?</text>'},
 top:function(){return box(16,34,52,38,12,G)+'<path d="M16 34l12-12h52l-12 12z" fill="'+F+'" stroke="'+C+'" stroke-width="3"/><path d="M26 34v38M42 34v38M58 34v38" stroke="'+G+'" stroke-width="1"/>'},
 depth:function(){return box(12,30,46,40,20,G,'rgba(100,116,139,.12)')+'<path d="M62 74l18-18" stroke="'+V+'" stroke-width="2.5" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="76" y="76" fill="'+V+'" font-size="12" font-weight="700">D</text>'},
 dims:function(){return box(16,30,40,40,18,G,'rgba(100,116,139,.12)')+'<path d="M8 30v40" stroke="'+C+'" stroke-width="2" marker-start="url(#ar)" marker-end="url(#ar)"/><path d="M16 78h40" stroke="'+C+'" stroke-width="2" marker-start="url(#ar)" marker-end="url(#ar)"/><path d="M62 76l16-16" stroke="'+V+'" stroke-width="2" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="1" y="26" fill="'+C+'" font-size="9">H</text><text x="32" y="90" fill="'+C+'" font-size="9">W</text><text x="80" y="72" fill="'+V+'" font-size="9">D</text>'},
 bend:function(){return '<path d="M14 60h56" stroke="'+G+'" stroke-width="4"/><path d="M14 60v-24" stroke="'+G+'" stroke-width="4"/><path d="M70 60v-24" stroke="'+C+'" stroke-width="4"/><path d="M14 60L4 52" stroke="none"/><path d="M58 30q16 -14 22 6" fill="none" stroke="'+V+'" stroke-width="2" marker-end="url(#ar)"/><path d="M26 30q-16 -14 -22 6" fill="none" stroke="'+G+'" stroke-width="1.5" stroke-dasharray="3 2"/>'},
 fallback:function(){return box(20,34,40,36,16,G,FV)+'<text x="40" y="60" fill="'+C+'" font-size="20" font-weight="700">?</text>'}
};
window.qThumb=function(q){var k;
 if(q.kind==='depth')k=q.id==='q_dims'||q.about!=='overall.depth'?S.dims():S.depth();
 else if(q.kind==='position')k=S.frame('mid');
 else if(q.kind==='orientation')k=S.bend();
 else if(q.kind==='exists'){k=q.id==='q_back'?S.frame('back'):q.id==='q_brace'?S.frame('brace'):q.id==='q_rib'?S.spool():q.id==='q_top'?S.top():S.fallback()}
 else k=S.fallback();
 return '<svg class="qthumb" viewBox="0 0 92 92" width="84" height="84" aria-hidden="true"><rect width="92" height="92" rx="10" fill="#0b1220"/>'+A+k+'</svg>'};
})();
