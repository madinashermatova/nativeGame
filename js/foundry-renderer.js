import { SECTIONS } from './foundry.js';
import { drawFactorySprite, FACTORY_RATIO } from './art.js';

// Har bir sprite kodda chiziladi (art.js); ratio — balandlik/kenglik nisbati.
export const FOUNDRY_SPRITES = Object.fromEntries(Object.keys(FACTORY_RATIO).map(k => [k, {ratio: FACTORY_RATIO[k]}]));
export function sprite(ctx,key,x,y,width,angle=0) {
  return drawFactorySprite(ctx,key,x,y,width,angle);
}
function glow(ctx,x,y,r,color,alpha=.5) {
  ctx.save();ctx.globalCompositeOperation='screen';
  const g=ctx.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
}
function text(ctx,label,x,y,color='#ffdda7',size=6) {
  ctx.save();ctx.font=size+'px monospace';ctx.textAlign='left';ctx.fillStyle=color;ctx.fillText(label,x,y);ctx.restore();
}
const visible=(x,w,cx,vw)=>x+w>=cx-60&&x<=cx+vw+60;
function tiled(ctx,key,x,y,width,moduleWidth) {
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,270-y);ctx.clip();
  for(let dx=0;dx<width;dx+=moduleWidth)sprite(ctx,key,x+dx,y,moduleWidth);
  ctx.restore();
}
export function drawFoundryBackground(ctx,vw,cx,gs) {
  const f=gs.foundry,time=f?f.time:0;
  ctx.save();
  // Fabrika devori: kodda chizilgan panellar, parallax bilan
  const bgGrad=ctx.createLinearGradient(0,0,0,270);bgGrad.addColorStop(0,'#2a2f3d');bgGrad.addColorStop(1,'#12141c');
  ctx.fillStyle=bgGrad;ctx.fillRect(0,0,vw,270);
  const panelOff=(cx*.12)%160;
  for(let x=-panelOff-160;x<vw+160;x+=160){ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(x,0,4,270);ctx.fillStyle='rgba(255,255,255,.04)';ctx.fillRect(x+4,0,156,270);}
  // Lighting overlays
  ctx.fillStyle='rgba(7, 8, 13, .6)';ctx.fillRect(0,0,vw,270);
  for(let i=Math.floor(cx*.28/280)-1;i<Math.ceil((cx*.28+vw)/280)+1;i++) {
    const x=i*280-cx*.28;
    ctx.globalAlpha=.42;sprite(ctx,'metal',x,72,176);
    sprite(ctx,'pipe',x+100,130,54);
    sprite(ctx,'gear',x+92,40,64,time*.35);
    sprite(ctx,'bridge',x+Math.sin(time*.28+i)*20,23,114);
    for(let y=0;y<45;y+=18)sprite(ctx,'brace',x+24+Math.sin(time*.7+i)*2,y,5);
    ctx.globalAlpha=1;
    sprite(ctx,'lamp',x+140,80,9);
    glow(ctx,x+145,91,52,i%2?'#ef4820':'#ff9b21',.35+.12*Math.sin(time*7+i));
    glow(ctx,x+60,130,68,'#ed4b16',.14);
  }
  ctx.restore();
}
function molten(ctx,pool,cx,time,vw) {
  if(!visible(pool.x,pool.w,cx,vw))return;
  const left=Math.max(pool.x-cx,-12),right=Math.min(pool.x+pool.w-cx,vw+12),y=pool.y;
  ctx.save();
  const g=ctx.createLinearGradient(0,y,0,270);g.addColorStop(0,'#fff4a4');g.addColorStop(.14,'#ffb52c');g.addColorStop(.6,'#ed5217');g.addColorStop(1,'#81291b');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(left,270);ctx.lineTo(left,y);
  for(let x=left;x<=right;x+=5)ctx.lineTo(x,y+Math.sin(x*.07+time*3)*1.7+Math.sin(x*.17-time*2));
  ctx.lineTo(right,y);ctx.lineTo(right,270);ctx.closePath();ctx.fill();
  for(let x=left;x<right;x+=48)glow(ctx,x+24,y,56,'#ff9327',.3);
  // Heat shimmer is animated lighting, limited to the air above the bath.
  ctx.strokeStyle='rgba(255, 207, 140, .13)';ctx.lineWidth=.5;
  for(let j=0;j<3;j++){ctx.beginPath();for(let x=left;x<right;x+=5){const dy=y-8-j*6+Math.sin(x*.08+time*4+j)*2;if(x===left)ctx.moveTo(x,dy);else ctx.lineTo(x,dy);}ctx.stroke();}
  ctx.restore();
}
function surface(ctx,s,cx,vw,time) {
  if(!visible(s.x,s.w,cx,vw))return;
  if(s.collapsed){
    if(s.age<1.5){ctx.save();ctx.globalAlpha=Math.max(0,1-(s.age-.95)*2);sprite(ctx,'bridge',s.x-cx,s.y+(s.age-.95)*140,s.w,(s.age-.95)*.3);ctx.restore();}
    return;
  }
  const warning=s.kind==='collapse'&&s.age>0;
  const shake=warning?Math.sin(time*48)*Math.min(1.8,s.age*2):0;
  if(s.kind==='static')tiled(ctx,'metal',s.x-cx,s.y,s.w,48);
  else if(warning&&s.age>.6) {
    // Crack warning splits the platform into two clipped halves.
    ctx.save();ctx.beginPath();ctx.rect(s.x-cx-3,s.y,s.w/2+2,40);ctx.clip();sprite(ctx,'bridge',s.x-cx-1+shake,s.y,s.w);ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(s.x-cx+s.w/2,s.y,s.w/2+4,40);ctx.clip();sprite(ctx,'bridge',s.x-cx+2+shake,s.y+1,s.w);ctx.restore();
  } else sprite(ctx,'bridge',s.x-cx+shake,s.y,s.w);
  if(warning){glow(ctx,s.x+s.w/2-cx,s.y,25,'#ff6027',.45);text(ctx,'QULAYDI!',s.x-cx,s.y-7,'#ffad69',5);}
  if(s.kind==='moving') {
    ctx.save();ctx.globalAlpha=.5;
    for(let y=26;y<s.y;y+=25)sprite(ctx,'brace',s.x+s.w/2-cx-3,y,6);
    ctx.restore();
  }
}
function laser(ctx,h,cx) {
  const x=h.x-cx;
  if(h.mode==='active')sprite(ctx,'laser',x,h.y,h.w);
  else {
    sprite(ctx,'leftEmitter',x,h.y,8.81);
    sprite(ctx,'rightEmitter',x+h.w-10.43,h.y,10.43);
  }
  glow(ctx,x+h.w/2,h.y+20,30,h.mode==='active'?'#ff3524':h.mode==='warning'?'#ffb926':'#3e9b70',.3);
}
function hazard(ctx,h,cx,time) {
  const x=h.x-cx;
  if(h.type==='laser'){laser(ctx,h,cx);return;}
  if(h.type==='press') {
    sprite(ctx,'bridge',x,h.y-22,h.w);
    for(let y=h.y;y<h.drawY;y+=25)sprite(ctx,'brace',x+h.w/2-3,y,6);
    sprite(ctx,'bridge',x,h.drawY,h.w);
    sprite(ctx,'spikes',x+4,h.drawY+h.h-8,24);
    sprite(ctx,'spikes',x+h.w-28,h.drawY+h.h-8,24);
    if(h.mode==='warning')glow(ctx,x+h.w/2,h.floor,44,'#f92c19',.45+.2*Math.sin(time*25));
  } else if(h.type==='debris') {
    if(h.mode==='warning') {
      // Shadow and dust mark the exact future impact column.
      ctx.save();ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.ellipse(x+9,h.floor,16,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
      glow(ctx,x+9,h.floor,20,'#ef762d',.22);text(ctx,'!',x+6,h.floor-15,'#ffba63',9);
    }
    if(h.mode==='warning'||h.mode==='fall')sprite(ctx,'chunk',x,h.drawY,h.w,h.mode==='fall'?time*2:0);
  } else {
    sprite(ctx,'pipe',x-2,h.y+h.h-8,26);
    if(h.mode==='warning')glow(ctx,x+10,h.y+h.h,24,h.type==='steam'?'#d4e7ee':'#ff5319',.4);
    if(h.type==='fire'&&h.mode==='active') {
      // Flame is drawn at the pipe mouth.
      ctx.save();const g=ctx.createLinearGradient(0,h.y,0,h.y+h.h);
      g.addColorStop(0,'rgba(255,70,10,0)');g.addColorStop(.35,'#ff7b20');g.addColorStop(.8,'#fff4a0');g.addColorStop(1,'#fffde8');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,h.y+h.h);
      ctx.bezierCurveTo(x+5,h.y+20,x-3+Math.sin(time*22)*5,h.y+10,x+10,h.y);
      ctx.bezierCurveTo(x+23,h.y+20,x+14,h.y+36,x+20,h.y+h.h);ctx.closePath();ctx.fill();ctx.restore();
      glow(ctx,x+10,h.y+25,48,'#ff942a',.65);
    }
  }
  if(h.mode==='warning')text(ctx,h.type==='steam'?'BUG!':h.type==='fire'?'OLOV!':h.type==='press'?'PRESS!':'!',x,h.y-6,'#ffd372',5);
}
export function drawFoundryWorld(ctx,vw,cx,gs,actors) {
  const f=gs.foundry;if(!f)return;
  const time=f.time;
  for(let x=Math.floor(cx/80)*80;x<cx+vw;x+=80)sprite(ctx,'beam',x-cx,0,80);
  for(const p of f.pools)molten(ctx,p,cx,time,vw);
  // Midground furnace and pipes are independently lit.
  for(const x of [1840,2150])if(visible(x,160,cx,vw)) {
    sprite(ctx,'metal',x-cx,80,160);sprite(ctx,'pipe',x+90-cx,118,48);
    glow(ctx,x+83-cx,118,65,'#ff8629',.35+.07*Math.sin(time*9));
  }
  for(const s of f.surfaces)surface(ctx,s,cx,vw,time);
  for(const r of f.ramps)if(visible(r.x,r.w,cx,vw))sprite(ctx,'ramp',r.x-cx,r.y,r.w);
  for(const saw of f.saws)if(visible(saw.x-saw.r,saw.r*2,cx,vw))sprite(ctx,saw.ax?'movingGear':'gear',saw.x-saw.r-cx,saw.y-saw.r,saw.r*2,saw.angle);
  for(const h of f.hazards)if(visible(h.x,h.w,cx,vw))hazard(ctx,h,cx,time);
  for(const c of f.checkpoints)if(visible(c.x,20,cx,vw)) {
    sprite(ctx,'lamp',c.x-cx,c.y-20,12);glow(ctx,c.x+6-cx,c.y-8,30,c.active?'#69ffa9':'#ffd44d',.35);
    text(ctx,c.active?'SAQLANDI':'CHECKPOINT',c.x-cx-15,c.y-25,c.active?'#95ffc0':'#ffda8a',5);
  }
  for(const c of f.coins)if(!c.got&&visible(c.x,12,cx,vw)) {
    // Pickup is a glowing lamp; the HUD explains its healing effect.
    sprite(ctx,'lamp',c.x-cx,c.y,9);glow(ctx,c.x+4-cx,c.y+6,15,'#e7ffae',.4);
  }
  const exit=f.exit;
  if(visible(exit.x,exit.w,cx,vw)) {
    sprite(ctx,'leftEmitter',exit.x-cx,exit.y,12);
    sprite(ctx,'rightEmitter',exit.x+exit.w-14-cx,exit.y,14);
    sprite(ctx,'beam',exit.x-cx-8,exit.y-6,exit.w+16);
    sprite(ctx,'bridge',exit.x-cx-8,208,exit.w+16);
    glow(ctx,exit.x+24-cx,exit.y+28,48,'#8cdba0',.27);
    text(ctx,'FREIGHT EXIT',exit.x-cx-9,exit.y-13,'#bfffd4',6);
  }
  actors.drawBoy(ctx,gs.p,cx,gs.anim,gs);
  for(const a of f.particles) {
    if(!visible(a.x,a.r,cx,vw))continue;
    ctx.save();ctx.globalAlpha=Math.min(.65,a.life/a.max);ctx.fillStyle=a.color;
    if(a.type==='smoke'||a.type==='steam') {
      const g=ctx.createRadialGradient(a.x-cx,a.y,0,a.x-cx,a.y,a.r);g.addColorStop(0,a.color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;
    }
    ctx.beginPath();ctx.arc(a.x-cx,a.y,a.r,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  // Foreground suspended supports, with their own parallax and slow sway.
  ctx.save();ctx.globalAlpha=.24;
  const offset=(cx*1.08)%420;
  for(let x=410-offset;x<vw;x+=420)for(let y=0;y<70;y+=24)sprite(ctx,'brace',x+Math.sin(time*.6)*1.5,y,6);
  ctx.restore();
  if(f.flash>0){ctx.save();ctx.globalAlpha=f.flash;ctx.fillStyle='#ffe5bd';ctx.fillRect(0,0,vw,270);ctx.restore();}
  text(ctx,SECTIONS[f.section].name,12,29,'#ffd899',7);
  if(gs.p&&gs.p.x<180) {text(ctx,'FOUNDRY / METALL ERITISH SEXI',32-cx,140,'#ffd899',7);text(ctx,'BUG VA PRESS: OGOHLANTIRISHDAN KEYIN KUT!',32-cx,151,'#b9aaa0',5);}
}
export function drawFoundryComplete(ctx,vw) {
  ctx.save();ctx.fillStyle='rgba(8,8,12,.78)';ctx.fillRect(0,0,vw,270);
  text(ctx,'LEVEL 3 COMPLETE',vw/2-77,112,'#ffe7ad',12);
  text(ctx,'SEX ORTDA QOLDI. KEYINGI LEVEL...',vw/2-88,139,'#f2b872',7);ctx.restore();
}
