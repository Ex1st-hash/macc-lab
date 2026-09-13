/* Shared material: stable per-node illumination, directional specular and a dark lower rim. */
window.__maccSphere=function(ctx,p,r,c,seed=0,active=0,alpha=1){
  const s=(Math.sin(seed*12.9898+78.233)*43758.5453)%1;
  const key=Math.abs(s),light=.52+.48*key;
  active=Math.max(0,Math.min(1,active));
  const rgba=(rgb,a)=>`rgba(${rgb.map(v=>Math.round(v)).join(',')},${Math.min(1,Math.max(0,a))})`;
  const opacity=Math.min(1,alpha*(.72+.28*light)+active*.16),h=r*(2.8+key*2.0);
  const halo=ctx.createRadialGradient(p.x,p.y,r*.45,p.x,p.y,h);
  halo.addColorStop(0,rgba(c,(.035+key*.12+active*.16)*alpha));halo.addColorStop(1,rgba(c,0));
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(p.x,p.y,h,0,Math.PI*2);ctx.fill();
  const hx=p.x-r*(.24+key*.15),hy=p.y-r*(.31+key*.12);
  const g=ctx.createRadialGradient(hx,hy,r*.03,p.x+r*.15,p.y+r*.20,r*1.18);
  g.addColorStop(0,rgba([244,255,251],opacity));
  g.addColorStop(.15,rgba(c.map(v=>Math.min(255,v*(1.04+key*.18+active*.20))),opacity));
  g.addColorStop(.48,rgba(c.map(v=>v*(.64+light*.20)),opacity));
  g.addColorStop(.82,rgba(c.map(v=>v*.30),opacity));
  g.addColorStop(1,rgba(c.map(v=>v*.12),opacity));
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=rgba(c,.12+key*.27+active*.2);ctx.lineWidth=.5;ctx.stroke();
  ctx.fillStyle=rgba([249,255,253],Math.min(1,(.25+key*.58)*alpha+active*.25));ctx.beginPath();ctx.arc(hx,hy,Math.max(.3,r*(.09+key*.08)),0,Math.PI*2);ctx.fill();
};
