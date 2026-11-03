/* OriaLineFilter v0.2 — osobny filtr linii F2: keep = kontur + wymiar; opts.keepBend=true (default false) + 'linia_giecia'; opts.keepHidden=true (default false) + 'ukryta_kreskowa'. Zero side-effectów (G0/classify nietknięte). */
(function(root){
  var KEEP=['kontur','wymiar'];
  function clsOf(l){return l&&(l.cls||l.kind)||null;}
  function filterF2(j,opts){
    opts=opts||{};var keepSet=KEEP.slice();if(opts.keepHidden)keepSet.push('ukryta_kreskowa');if(opts.keepBend)keepSet.push('linia_giecia');
    var lines=Array.isArray(j)?j:(j&&j.lines)||[];
    var keep=[],drop=[],byCls={};
    for(var i=0;i<lines.length;i++){var l=lines[i],c=clsOf(l);if(!c)continue;
      var b=byCls[c]||(byCls[c]={keep:0,drop:0});
      if(keepSet.indexOf(c)>=0){keep.push(l);b.keep++;}else{drop.push(l);b.drop++;}}
    return {keep:keep,drop:drop,stats:{byCls:byCls,nKeep:keep.length,nDrop:drop.length},
      meta:{v:'0.2',keepCls:keepSet,src:(!Array.isArray(j)&&j&&j.src)||null,W:j&&j.W,H:j&&j.H}};
  }
  function toCleanSet(keep){
    var seg=[];for(var i=0;i<(keep||[]).length;i++){var l=keep[i],s=l.s;
      var a=l.a||(s?[s[0],s[1]]:null),b=l.b||(s?[s[2],s[3]]:null);if(!a||!b)continue;
      var o={a:a,b:b,cls:clsOf(l)};if(s)o.s=s;seg.push(o);}
    return {segments:seg,n:seg.length};
  }
  var api={filterF2:filterF2,toCleanSet:toCleanSet,KEEP:KEEP};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaLineFilter=api;
})(typeof window!=='undefined'?window:this);
