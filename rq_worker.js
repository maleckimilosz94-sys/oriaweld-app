/* oria-186 PERF-2: worker rastra (OffscreenCanvas 2D). Kod rysowania = 1:1 z isoRender/silMask z js/app_main.js (bit-identyczny raster; weryfikowany sondą w rq.js). */
function iso(p,W,H,mirror){var c=new OffscreenCanvas(W,H);var x=c.getContext('2d'),n=p.length/9,T=[],c30=0.866,s30=0.5,mx=1e9,my=1e9,Mx=-1e9,My=-1e9,sg=mirror?-1:1,col=undefined;
 function pr(i){var X=sg*p[i],Y=p[i+1],Z=p[i+2];return [(X-Z)*c30,-(Y-(X+Z)*s30),(X+Z)-Y*0.01];}
 for(var t=0;t<n;t++){var a=pr(t*9),b=pr(t*9+3),d=pr(t*9+6);[a,b,d].forEach(function(q){mx=Math.min(mx,q[0]);Mx=Math.max(Mx,q[0]);my=Math.min(my,q[1]);My=Math.max(My,q[1]);});
  var ux=p[t*9+3]-p[t*9],uy=p[t*9+4]-p[t*9+1],uz=p[t*9+5]-p[t*9+2],vx=p[t*9+6]-p[t*9],vy=p[t*9+7]-p[t*9+1],vz=p[t*9+8]-p[t*9+2],nx=sg*(uy*vz-uz*vy),ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,nl=Math.hypot(nx,ny,nz)||1;T.push({a:a,b:b,d:d,z:(a[2]+b[2]+d[2])/3,n:[nx/nl,ny/nl,nz/nl]});}
 var k=Math.min((W-8)/Math.max(1,Mx-mx),(H-8)/Math.max(1,My-my)),ox=(W-(Mx-mx)*k)/2,oy=(H-(My-my)*k)/2;T.sort(function(a,b){return a.z-b.z});x.fillStyle='#fff';x.fillRect(0,0,W,H);
 T.forEach(function(t){var ny=Math.abs(t.n[1]),nx=Math.abs(t.n[0]),sh=ny>0.7?0.92:nx>0.7?0.7:0.5,cc=col||[230,126,34];x.fillStyle='rgb('+Math.round(cc[0]*sh)+','+Math.round(cc[1]*sh)+','+Math.round(cc[2]*sh)+')';x.strokeStyle=x.fillStyle;x.lineWidth=0.6;x.beginPath();[t.a,t.b,t.d].forEach(function(q,i){var X=ox+(q[0]-mx)*k,Y=oy+(q[1]-my)*k;i?x.lineTo(X,Y):x.moveTo(X,Y);});x.closePath();x.fill();x.stroke();});
 return x.getImageData(0,0,W,H).data;}
function sil(p,b,ax,W,H,fx,fy){var c=new OffscreenCanvas(W,H);var x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,W,H);x.fillStyle='#fff';var u0=b.min[ax[0]],u1=b.max[ax[0]],v0=b.min[ax[1]],v1=b.max[ax[1]],I={x:0,y:1,z:2};
 function P(i){var u=(p[i+I[ax[0]]]-u0)/Math.max(1e-6,u1-u0),v=(p[i+I[ax[1]]]-v0)/Math.max(1e-6,v1-v0);if(fx)u=1-u;if(!fy)v=1-v;return [u*W,v*H];}
 for(var t=0;t<p.length;t+=9){var a=P(t),b2=P(t+3),d=P(t+6);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b2[0],b2[1]);x.lineTo(d[0],d[1]);x.closePath();x.fill();}x.strokeStyle='#fff';x.lineWidth=1;
 var D=x.getImageData(0,0,W,H).data,M=new Uint8Array(W*H);for(var i=0;i<W*H;i++)M[i]=D[i*4]>127?1:0;return M;}
function probe(T,W,H){var c=new OffscreenCanvas(W,H),x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle='rgb(200,100,30)';x.strokeStyle=x.fillStyle;x.lineWidth=0.6;for(var i=0;i<T.length;i+=6){x.beginPath();x.moveTo(T[i],T[i+1]);x.lineTo(T[i+2],T[i+3]);x.lineTo(T[i+4],T[i+5]);x.closePath();x.fill();x.stroke()}return x.getImageData(0,0,W,H).data}
onmessage=function(e){var d=e.data;try{
 if(d.k==='probe'){var r=probe(d.T,d.W,d.H);postMessage({id:d.id,r:r},[r.buffer]);return}
 var p=d.p,out=[],tr=[];
 d.jobs.forEach(function(j){if(j.k==='i'){var r=iso(p,j.W,j.H,j.m);out.push({key:j.key,r:r});tr.push(r.buffer)}else{var M=sil(p,d.bb,j.ax,j.W,j.H,j.fx,j.fy);out.push({key:j.key,r:M});tr.push(M.buffer)}});
 postMessage({id:d.id,out:out},tr);
 }catch(err){postMessage({id:d.id,err:String(err&&err.message||err)})}};
