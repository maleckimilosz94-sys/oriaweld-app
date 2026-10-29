/*tblmask OFF unless ?tblmask=1; local only*/(function(){
// SZKIC (nie wpięty, OFF): port eDOCr2 layer_segm -> JS (OpenCV.js lub czysty JS na Uint8 masce).
// Cel: przed naszym PP-det wyciąć ramkę arkusza + tabelki (clustery prostokątów), zostawić strefę rysunku.
// 1) findFrame: projekcje linii pionowych/poziomych (morph open 1x20 / 20x1), piki >=0.8*max,
//    najbliższa para pików po obu stronach środka o rozstawie > frame_thres*W/H (0.85).
// 2) findRectangles: binaryzacja INV(127) -> findContours(RETR_TREE) -> approxPolyDP(0.01*arc)
//    -> 4 wierzchołki, kąty 88..92°, osiowe (tol 10px), w*h>1000.
// 3) clusters: prostokąty stykające się (touching, 1.1) -> fire propagation -> cluster;
//    cluster z polem > GDT_thres(0.02)*W*H = tabelka (maska); małe = ramki GD&T / dim boxes.
// 4) maska: poza frame + tabelki = 0 -> PP-det tylko na strefie rysunku.
function findFrame(bin, W, H, thr = 0.85) {           // bin: Uint8Array 0/1 (ink=1)
  const run = (len, horiz) => { const acc = new Float32Array(horiz ? H : W);
    for (let y = 0; y < H; y++) { let r = 0; for (let x = 0; x < W; x++) {
      const v = bin[y * W + x]; r = v ? r + 1 : 0;      // uproszczony morph-open: długie odcinki
      if (horiz && r >= 20) acc[y]++; } }
    if (!horiz) for (let x = 0; x < W; x++) { let r = 0; for (let y = 0; y < H; y++) {
      r = bin[y * W + x] ? r + 1 : 0; if (r >= 20) acc[x]++; } }
    return smooth(acc, 9); };
  const pick = (acc, n) => { const mx = Math.max(...acc), pk = [];
    for (let i = 1; i < n - 1; i++) if (acc[i] >= 0.8 * mx && acc[i] >= acc[i - 1] && acc[i] > acc[i + 1]) pk.push(i);
    let best = null; for (const a of pk) if (a < n / 2) for (const b of pk) if (b > n / 2 && b - a > thr * n && (!best || b - a < best[1] - best[0])) best = [a, b];
    return best; };
  const v = pick(run(20, false), W), h = pick(run(20, true), H);
  if (!v || !h) { const mx = W * (1 - thr) / 2, my = H * (1 - thr) / 2; return { x: mx, y: my, w: W * thr, h: H * thr, auto: false }; }
  return { x: v[0], y: h[0], w: v[1] - v[0], h: h[1] - h[0], auto: true };
}
function smooth(a, k) { const o = new Float32Array(a.length), h = k >> 1; for (let i = 0; i < a.length; i++) { let s = 0; for (let j = -h; j <= h; j++) s += a[i + j] || 0; o[i] = s / k; } return o; }
// findRectangles/clusters: przez cv.findContours (OpenCV.js ~8 MB wasm) albo własny tracer konturów; TODO.

// Bramka pewności + filtr absurdów (do engine, przed wyborem gabarytu)
const DIMRE = /^(?:[RMØ⌀]?\d{1,4}(?:[.,]\d{1,2})?)$/;
function gateTokens(tokens, { gab = null, ppConf = 1, confMin = 0.6 } = {}) {
  // tokens: [{t:'86,00', conf, src:'pp'|'edo', box}]
  const out = [];
  for (const k of tokens) {
    const t = String(k.t).replace(/\s|±.*/g, '');
    if (!DIMRE.test(t)) continue;                                   // śmieci z tabelki: 'M=9ht', '2768-C'
    const v = parseFloat(t.replace(/^[RMØ⌀]/, '').replace(',', '.'));
    if (!(v > 0)) continue;
    if (gab && v > 1.5 * Math.max(...gab)) continue;                // absurd: 8600 przy gabarycie 86
    if (/^\d+0{2,}$/.test(t) && tokens.some(o => o !== k && parseFloat(String(o.t).replace(',', '.')) * 100 === v)) continue; // 8600 vs 86,00 (zgubiony przecinek)
    if (k.src === 'pp' && (k.conf ?? 1) < confMin) { k.needEdo = true; }  // gate: tylko niepewne -> eDOCr
    out.push({ ...k, v });
  }
  return { tokens: out, useEdo: ppConf < confMin || out.some(k => k.needEdo) };
}
if (typeof module !== 'undefined') module.exports = { findFrame, gateTokens };

// Prototyp (OFF): maska tabliczki rysunkowej własnymi konturami (bez OpenCV.js). Wejście: gray Uint8 W×H.

function tableMask(g,W,H){
  const ink=new Uint8Array(W*H);for(let i=0;i<W*H;i++)ink[i]=g[i]<224?1:0;
  const fr=findFrame(ink,W,H);
  const L=new Uint8Array(W*H),minH=Math.round(0.04*W),minV=Math.round(0.025*H);
  for(let y=0;y<H;y++){let s=-1;for(let x=0;x<=W;x++){const v=x<W&&ink[y*W+x];if(v&&s<0)s=x;if(!v&&s>=0){if(x-s>=minH)for(let k=s;k<x;k++)L[y*W+k]=1;s=-1}}}
  for(let x=0;x<W;x++){let s=-1;for(let y=0;y<=H;y++){const v=y<H&&ink[y*W+x];if(v&&s<0)s=y;if(!v&&s>=0){if(y-s>=minV)for(let k=s;k<y;k++)L[k*W+x]=1;s=-1}}}
  // usuń ramkę arkusza (±1.5% od krawędzi frame), żeby tabliczka nie zlała się z ramką
  const m=Math.round(0.006*Math.max(W,H)),fx0=fr.x+m,fy0=fr.y+m,fx1=fr.x+fr.w-m,fy1=fr.y+fr.h-m;
  // komponenty na siatce 4px
  const s=4,gw=Math.ceil(W/s),gh=Math.ceil(H/s),G=new Int32Array(gw*gh).fill(-1);
  for(let y=fy0;y<fy1;y++)for(let x=fx0;x<fx1;x++)if(L[y*W+x])G[((y/s)|0)*gw+((x/s)|0)]=0;
  const comps=[];let id=0;
  for(let i=0;i<G.length;i++)if(G[i]===0){id++;const st=[i];G[i]=id;let x0=1e9,y0=1e9,x1=-1,y1=-1,n=0;
    while(st.length){const j=st.pop(),x=j%gw,y=(j/gw)|0;n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<gw&&b<gh&&G[b*gw+a]===0){G[b*gw+a]=id;st.push(b*gw+a)}}}
    comps.push({x:x0*s,y:y0*s,w:(x1-x0+1)*s,h:(y1-y0+1)*s,n})}
  // tabliczka: przy dole frame, pole 2–35% frame, gęsta siatka (n/obwód)
  const FA=fr.w*fr.h;const c=comps.filter(k=>{const a=k.w*k.h;return a>0.02*FA&&a<0.35*FA&&k.y+k.h>=fy1-0.03*H&&k.w>0.2*fr.w&&k.h<0.45*fr.h})
    .sort((a,b)=>b.n-a.n)[0]||null;
  return {frame:fr,table:c};
}

function tblMaskFilter(nums,info){try{var sh=info&&info.sheet;if(!sh||!nums||!nums.length)return nums;var W=sh.width,H=sh.height;
 var M=window.__tblMaskM;if(!M||M.W!==W){var d=sh.getContext('2d').getImageData(0,0,W,H).data,g=new Uint8Array(W*H);for(var i=0;i<W*H;i++)g[i]=(d[4*i]*77+d[4*i+1]*150+d[4*i+2]*29)>>8;M=tableMask(g,W,H);M.W=W;window.__tblMaskM=M;}
 var t=M.table,f=M.frame,st=window.__tblMaskSt=window.__tblMaskSt||{in:0,tab:0,out:0,calls:0};st.calls++;st.mask={t:t,f:f,W:W,H:H};if(!f||!f.auto){st.skip=(st.skip||0)+1;console.log('tblmask: brak ramki (fallback) - nic nie wycinam');return nums;}
 return nums.filter(function(n){if(!n||n.x==null)return true;var cx=n.x+(n.w||0)/2,cy=n.y+(n.h||0)/2;st.in++;
  if(t&&cx>=t.x&&cx<=t.x+t.w&&cy>=t.y&&cy<=t.y+t.h){st.tab++;return false}
  if(f&&!(cx>=f.x&&cx<=f.x+f.w&&cy>=f.y&&cy<=f.y+f.h)){st.out++;return false}return true});}catch(e){console.warn('tblmask',e);return nums}}
window.__tblMaskF=tblMaskFilter;
})();
