
(() => {
'use strict';
const canvas=document.querySelector('[data-topology-canvas]'),ctx=canvas.getContext('2d');if(!ctx)return;
const button=document.querySelector('[data-motion-toggle]'),label=document.querySelector('[data-wave-phase]'),backdrop=document.querySelector('[data-tides-backdrop]');
const media=matchMedia('(prefers-reduced-motion: reduce)'),TAU=Math.PI*2,TEAL=[143,217,210],GOLD=[222,194,142];
const rt={w:700,h:700,dpr:1,t:0,last:null,raf:0,paused:media.matches,visible:true,frames:0};
const rgba=(c,a)=>`rgba(${c.join(',')},${Math.max(0,Math.min(1,a))})`,bell=(x,w)=>Math.exp(-((x/w)**2));
const rows=17,cols=9,nodes=[],edges=[],faces=[],adj=[];
const anchorUV=[[2,2],[4,6],[7,1],[9,7],[12,3],[14,6]],anchors=anchorUV.map(([i,j])=>i*cols+j),hub=8*cols+4;
const starts=[.35,1.1,.75,1.85,1.5,2.3];
for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
 const id=i*cols+j;nodes.push({id,i,j,u:(i+.29*Math.sin(i*1.3+j*1.7)*Math.sin(Math.PI*i/16))/16,v:(j+.22*Math.sin(j*2.1+i*.7)*Math.sin(Math.PI*j/8))/8,size:1.65+((i*7+j*11)%11)*.10,warm:anchors.includes(id),hub:id===hub});adj.push([]);
 if(i)edges.push([id-cols,id]);if(j)edges.push([id-1,id]);
 if(i&&j){faces.push([id,id-1,id-cols],[id-1,id-cols,id-cols-1]);if((i+j)%4===0)edges.push([id-cols-1,id]);}
}
for(const [a,b] of edges){const x=nodes[a],y=nodes[b],d=Math.hypot((x.u-y.u)*2.1,(x.v-y.v)*2.15);adj[a].push([b,d]);adj[b].push([a,d]);}
function distances(root){
 const d=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set();d[root]=0;
 for(let k=0;k<nodes.length;k++){let u=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(u<0||d[j]<d[u]))u=j;if(!Number.isFinite(d[u]))break;done.add(u);for(const [v,w] of adj[u])if(d[u]+w<d[v]){d[v]=d[u]+w;prev[v]=u;}}
 return{d,prev};
}
const local=anchors.map(distances),shared=distances(hub);
nodes.forEach(n=>{n.sector=local.map((q,k)=>[q.d[n.id],k]).sort((a,b)=>a[0]-b[0])[0][1];n.arrival=starts[n.sector]+local[n.sector].d[n.id]*2.1;});
const routes=anchors.map((a,k)=>{const path=[a];while(path.at(-1)!==hub)path.push(shared.prev[path.at(-1)]);let lengths=[0];for(let i=1;i<path.length;i++){const x=nodes[path[i-1]],y=nodes[path[i]];lengths.push(lengths.at(-1)+Math.hypot((x.u-y.u)*2.1,(x.v-y.v)*2.15));}return{path,lengths,length:lengths.at(-1),start:4.2+k*.40};});
function energy(n,t){const phase=t%14;return Math.max(bell(phase-n.arrival,.46),bell(phase-(8.45+shared.d[n.id]*1.5),.50));}
// Broad water surface: bounded breathing and vertical displacement, no orbital advection.
let preparedTime=-1,activeRipples=[];
function view(t){return{roll:-.58+.026*Math.sin(TAU*t/22),tilt:.82+.025*Math.sin(TAU*t/19+.5)};}
function point(u,v,t){
 if(t!==preparedTime){preparedTime=t;activeRipples=anchors.map((id,k)=>({u:nodes[id].u,v:nodes[id].v,age:t%14-starts[k]})).filter(q=>q.age>0&&q.age<3.5);}
 let x=(u-.5)*2.1*(1-.065*Math.pow(2*v-1,4)),y=(v-.5)*2.15*(1-.08*Math.pow(2*u-1,4));
 const radius=Math.hypot(x*.86,y*.82),phase=TAU*t/7.4-radius*4.2;
 const breathing=1+.021*Math.sin(phase);
 // V4-like radial ripple with a broad crossing swell. The slope stays gentle at every phase.
 let z=.15*Math.sin(x*2.8-t*.55)+.06*Math.sin(x*2.0+t*.43+y*.7)+.045*Math.sin(phase)+.025*Math.sin(y*2.4+TAU*t/12.6);
 for(const q of activeRipples){const d=Math.hypot((u-q.u)*2.1,(v-q.v)*2.15);z+=.014*bell(d-q.age*.27,.24)*Math.sin(d*9-q.age*2.8)*Math.sin(q.age/3.5*Math.PI);}
 z+=.027*bell((t%14)-(8.45+radius*1.7),.7);
 x*=breathing;y*=breathing;
 const {roll,tilt}=view(t),depth=y*Math.sin(tilt)+z*Math.cos(tilt),yy=y*Math.cos(tilt)-z*Math.sin(tilt),perspective=6.8/(6.8+depth*.42),scale=Math.min(rt.w,rt.h)*.35;
 return{x:rt.w*.5+(x*Math.cos(roll)-yy*Math.sin(roll))*scale*perspective,y:rt.h*.52+(x*Math.sin(roll)+yy*Math.cos(roll))*scale*perspective+Math.sin(TAU*t/12)*scale*.017,z,depth,near:.40+.5*v};
}
function nodePoint(n,t){return{...point(n.u,n.v,t),energy:energy(n,t)};}
function pathStroke(a,b,t){ctx.beginPath();for(let k=0;k<=3;k++){let u=k/3,p=point(a.u+(b.u-a.u)*u,a.v+(b.v-a.v)*u,t);if(k)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.stroke();}
function spray(t,paint=true){
 const out=[],event=Math.floor(t/.6);
 for(let e=Math.max(0,event-3);e<=event;e++){
  const candidates=Array.from({length:7},(_,j)=>nodes[(e*57+j*79+41)%nodes.length]);const n=candidates.sort((a,b)=>point(b.u,b.v,e*.6).z-point(a.u,a.v,e*.6).z)[0],p=point(n.u,n.v,t);
  for(let j=0;j<3;j++){let age=t-e*.6-j*.13;if(age<=0||age>=1.3)continue;const q=age/1.3,x=p.x+(j-1)*(8+19*q),y=p.y-8-q*(30+j*10),alpha=Math.sin(Math.PI*q)*.43,char=String((e+j)%2);out.push({x,y,alpha,char});if(paint){ctx.font=`${Math.max(11,Math.min(16,rt.w/52+j))}px monospace`;ctx.fillStyle=rgba([208,239,232],alpha);ctx.fillText(char,x,y);}}
 }return out;
}
function draw(t){
 ctx.setTransform(rt.dpr,0,0,rt.dpr,0,0);ctx.clearRect(0,0,rt.w,rt.h);const ps=nodes.map(n=>nodePoint(n,t));
 if(backdrop){backdrop.style.setProperty('--field-breath',String(1+.005*Math.sin(t*.7)));backdrop.style.setProperty('--visual-trace-opacity','.24');}
 // Only a few activated cells become translucent. Empty space remains visible between agents.
 faces.forEach((f,k)=>{const a=ps[f[0]],b=ps[f[1]],c=ps[f[2]],e=Math.max(a.energy,b.energy,c.energy);if(k%3||e<.22)return;ctx.fillStyle=rgba(TEAL,e*.045);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fill();});
 edges.forEach(([a,b],k)=>{const e=Math.max(ps[a].energy,ps[b].energy),near=(ps[a].near+ps[b].near)/2;ctx.strokeStyle=rgba(TEAL,.09+near*.09+e*.32);ctx.lineWidth=.55+e*.5;pathStroke(nodes[a],nodes[b],t);});
 for(const route of routes){
  const q=((t%14)-route.start)/2.1;if(q<0||q>1)continue;const target=q*route.length;let k=1;while(k<route.lengths.length-1&&route.lengths[k]<target)k++;const a=nodes[route.path[k-1]],b=nodes[route.path[k]],u=(target-route.lengths[k-1])/(route.lengths[k]-route.lengths[k-1]);
  for(let j=1;j<route.path.length;j++){ctx.strokeStyle=rgba(GOLD,.18*Math.sin(q*Math.PI));ctx.lineWidth=1.1;pathStroke(nodes[route.path[j-1]],nodes[route.path[j]],t);}
  const p=point(a.u+(b.u-a.u)*u,a.v+(b.v-a.v)*u,t);window.__maccSphere(ctx,p,2.2,GOLD,route.start,1,.95);
 }
 const unit=Math.max(.6,Math.min(1.16,Math.min(rt.w,rt.h)/700));
 ps.map((p,i)=>({p,n:nodes[i]})).sort((a,b)=>a.p.near-b.p.near).forEach(({p,n})=>{
  const fade=(.55+.45*Math.sin(Math.PI*n.u))*(.6+.4*Math.sin(Math.PI*n.v)),crest=Math.max(0,p.z)*.8;
  window.__maccSphere(ctx,p,(n.hub?4.8:n.warm?4.1:n.size)*unit,n.hub?[225,244,240]:n.warm?GOLD:TEAL,n.id*.73,p.energy,Math.min(1,fade*(.55+p.near*.3+crest)));
 });
 spray(t);if(label)label.textContent=t%14<4.2?'01 / Neighbourhood ripples':t%14<8.4?'02 / Signals converge':t%14<12.5?'03 / Shared wave':'04 / Settle & renew';rt.frames++;
}
function resize(){const r=canvas.getBoundingClientRect();rt.w=Math.max(1,r.width);rt.h=Math.max(1,r.height);rt.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rt.w*rt.dpr);canvas.height=Math.round(rt.h*rt.dpr);draw(rt.t);}
function running(){return !rt.paused&&rt.visible&&document.visibilityState!=='hidden';}
function tick(now){rt.raf=0;if(!running()){rt.last=null;return;}if(rt.last!==null)rt.t+=Math.min((now-rt.last)/1000,.08);rt.last=now;draw(rt.t);rt.raf=requestAnimationFrame(tick);}
function sync(){if(rt.raf)cancelAnimationFrame(rt.raf);rt.raf=0;rt.last=null;if(running())rt.raf=requestAnimationFrame(tick);if(button){button.textContent=rt.paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(rt.paused));}}
button?.addEventListener('click',()=>{rt.paused=!rt.paused;sync();});document.addEventListener('visibilitychange',sync);media.addEventListener('change',()=>{rt.paused=media.matches;sync();draw(rt.t);});window.addEventListener('resize',resize);
if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);if('IntersectionObserver'in window)new IntersectionObserver(([e])=>{rt.visible=e.isIntersecting;sync();}).observe(canvas);
window.__maccConcept={kind:'B-V3',sample:t=>nodes.map(n=>nodePoint(n,t)),binary:t=>spray(t,false),nodes:nodes.length,edges:edges.length,routes:routes.map(r=>r.path),connections:edges,view,get state(){return{time:rt.t,paused:rt.paused,frames:rt.frames};}};
resize();sync();
})();

