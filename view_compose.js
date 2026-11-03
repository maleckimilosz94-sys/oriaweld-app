/* OriaViewCompose v0.1 — składanie rzutów wymiarowo (H/W/D). Konwencja approx: x=width, y=height, z=depth.
   front: w->width, h->height | side: w(lub d)->depth, h->height | top: w->width, d(lub h)->depth.
   Wartości w mm albo px+scale (mm/px). Konflikt => ok=false, bez zgadywania. */
(function(root){
  function mm(v,view){if(v==null||!isFinite(v))return null;var s=view&&view.scale;return s?v*s:+v;}
  function compose(views,opts){
    opts=opts||{};views=views||{};var tolRel=opts.tolRel!=null?opts.tolRel:0.01,tolAbs=opts.tol!=null?opts.tol:1;
    var f=views.front,s=views.side,t=views.top,obs={width:[],height:[],depth:[]},used=[];
    function add(ax,v,vw,src){var x=mm(v,vw);if(x!=null){obs[ax].push({value:x,view:src,source:vw.source||null});if(used.indexOf(src)<0)used.push(src);}}
    if(f){add('width',f.w,f,'front');add('height',f.h,f,'front');}
    if(s){add('depth',s.d!=null?s.d:s.w,s,'side');add('height',s.h,s,'side');}
    if(t){add('width',t.w,t,'top');add('depth',t.d!=null?t.d:t.h,t,'top');}
    var solid={},conflicts=[],ok=true;
    ['width','height','depth'].forEach(function(ax){var o=obs[ax];
      if(!o.length){solid[ax]={value:null,status:'unknown',views:[]};return;}
      var vals=o.map(function(x){return x.value;}),mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);
      var tol=Math.max(tolAbs,tolRel*mx),vs=o.map(function(x){return x.view;});
      if(mx-mn>tol){ok=false;solid[ax]={value:null,status:'conflict',views:vs};conflicts.push({axis:ax,values:vals,views:vs,tol:tol});}
      else solid[ax]={value:vals.reduce(function(a,b){return a+b;},0)/vals.length,status:'recognized',views:vs,single:o.length===1};
    });
    return {ok:ok&&conflicts.length===0,solid:solid,conflicts:conflicts,usedViews:used,meta:{v:'0.1',tolAbs:tolAbs,tolRel:tolRel}};
  }
  var api={compose:compose};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OriaViewCompose=api;
})(typeof window!=='undefined'?window:this);
