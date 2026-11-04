/* OriaLineFilter v0.3 (t956u P1: opts.strict = dodatkowe docięcie: strokeWidth<thr_w, dash, poza głównym obrysem; OFF default) — v0.2 — osobny filtr linii F2: keep = kontur + wymiar; opts.keepBend=true (default false) + 'linia_giecia'; opts.keepHidden=true (default false) + 'ukryta_kreskowa'. Zero side-effectów (G0/classify nietknięte). */
(function(root){
  var KEEP=['kontur','wymiar'];
  function clsOf(l){return l&&(l.cls||l.kind)||null;}
  function filterF2(j,opts){
    opts=opts||{};var keepSet=KEEP.slice();if(opts.keepHidden)keepSet.push('ukryta_kreskowa');if(opts.keepBend)keepSet.push('linia_giecia');
    var lines=Array.isArray(j)?j:(j&&j.lines)||[];
    var keep=[],drop=[],byCls={},stx={};
    for(var i=0;i<lines.length;i++){var l=lines[i],c=clsOf(l);if(!c)continue;
      var b=byCls[c]||(byCls[c]={keep:0,drop:0});
      var why=keepSet.indexOf(c)<0?'cls':(opts.strict?strictWhy(l,c,j,opts):null);
      if(!why){keep.push(l);b.keep++;}else{if(why!=='cls'){l=Object.assign({},l,{dropWhy:why});(stx[why]=(stx[why]||0)+1);}drop.push(l);b.drop++;}}
    return {keep:keep,drop:drop,stats:{byCls:byCls,strictDrop:stx,nKeep:keep.length,nDrop:drop.length},
      meta:{v:'0.3',strict:!!opts.strict,keepCls:keepSet,src:(!Array.isArray(j)&&j&&j.src)||null,W:j&&j.W,H:j&&j.H}};
  }
  /* strict: kontur cienki (w<thr_w*0.6), przerywany (dash), kontur/wymiar całkiem poza głównym obrysem (bbox konturów, margines opts.margin=0.15) */
  function mainBox(j){var L=(j&&j.lines)||[],x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,n=0;
    for(var i=0;i<L.length;i++){var l=L[i];if(clsOf(l)!=='kontur'||!l.s)continue;n++;x0=Math.min(x0,l.s[0],l.s[2]);x1=Math.max(x1,l.s[0],l.s[2]);y0=Math.min(y0,l.s[1],l.s[3]);y1=Math.max(y1,l.s[1],l.s[3]);}
    return n?[x0,y0,x1,y1]:null;}
  function strictWhy(l,c,j,o){var tw=j&&j.thr_w,w=l.w!=null?l.w:l.strokeWidth;
    if(c==='kontur'&&w!=null&&tw&&w<tw*0.6)return 'cienka';
    if(l.dash||l.dashed)return 'przerywana';
    var B=o.__mb!==undefined?o.__mb:(o.__mb=mainBox(j));if(B&&l.s){var mw=(B[2]-B[0])*(o.margin!=null?o.margin:0.15),mh=(B[3]-B[1])*(o.margin!=null?o.margin:0.15);
      var lx0=Math.min(l.s[0],l.s[2]),lx1=Math.max(l.s[0],l.s[2]),ly0=Math.min(l.s[1],l.s[3]),ly1=Math.max(l.s[1],l.s[3]);
      if(lx1<B[0]-mw||lx0>B[2]+mw||ly1<B[1]-mh||ly0>B[3]+mh)return 'poza_obrysem';}
    return null;}
  function toCleanSet(keep){
    var seg=[];for(var i=0;i<(keep||[]).length;i++){var l=keep[i],s=l.s;
      var a=l.a||(s?[s[0],s[1]]:null),b=l.b||(s?[s[2],s[3]]:null);if(!a||!b)continue;
      var o={a:a,b:b,cls:clsOf(l)};if(s)o.s=s;seg.push(o);}
    return {segments:seg,n:seg.length};
  }
  function clean(j,opts){var r=filterF2(j,opts);var c=toCleanSet(r.keep);c.stats=r.stats;c.meta=r.meta;return c;}
  var api={filterF2:filterF2,toCleanSet:toCleanSet,clean:clean,mainBox:mainBox,KEEP:KEEP};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaLineFilter=api;
})(typeof window!=='undefined'?window:this);
