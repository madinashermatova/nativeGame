import { TOXIC_SECTIONS } from './toxic.js';
import { drawToxicSprite, TOXIC_RATIO } from './art.js';
// Har bir sprite kodda chiziladi (art.js); ratio — balandlik/kenglik nisbati.
export const TOXIC_SPRITES = Object.fromEntries(Object.keys(TOXIC_RATIO).map(k => [k, {ratio: TOXIC_RATIO[k]}]));
export function toxicSprite(ctx,key,x,y,width,angle=0,flip=false){
  return drawToxicSprite(ctx,key,x,y,width,angle,flip);
}
const visible=(x,w,cx,vw)=>x+w>cx-40&&x<cx+vw+40;
function glow(ctx,x,y,r,color,alpha=.25){
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;
  const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
}
function label(ctx,value,x,y,color='#e2f0b6',size=6){ctx.save();ctx.font=size+'px monospace';ctx.textAlign='left';ctx.fillStyle=color;ctx.fillText(value,x,y);ctx.restore();}
function tileSpan(ctx,key,x,y,width,size=48){
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,270-y);ctx.clip();
  for(let dx=0;dx<width;dx+=size)toxicSprite(ctx,key,x+dx,y,size);ctx.restore();
}
const labHash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
export function drawToxicBackground(ctx,vw,cx,gs){
  const f=gs.toxic,time=f?f.time:0;ctx.save();
  // Kimyo laboratoriyasi devori: sovuq yashil-kulrang gradient, yumshoq yorug'lik
  const wall=ctx.createLinearGradient(0,0,0,270);wall.addColorStop(0,'#1f3029');wall.addColorStop(0.7,'#15221c');wall.addColorStop(1,'#0b130f');
  ctx.fillStyle=wall;ctx.fillRect(0,0,vw,270);
  // Keramik plitka: vertikal va gorizontal chokli (sekin parallax)
  const tileOff=(cx*.15)%24;ctx.fillStyle='rgba(190,230,205,.05)';
  for(let x=-tileOff;x<vw;x+=24)ctx.fillRect(Math.round(x),0,1,200);
  for(let y=0;y<200;y+=12)ctx.fillRect(0,y,vw,1);
  // Tavandagi lampalar yorug'ligi (yumshoq konus)
  for(let x=-((cx*.1)%160);x<vw+160;x+=160){
    const g=ctx.createLinearGradient(x+80,0,x+80,200);g.addColorStop(0,'rgba(220,255,225,.10)');g.addColorStop(1,'rgba(220,255,225,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x+74,0);ctx.lineTo(x+86,0);ctx.lineTo(x+110,200);ctx.lineTo(x+50,200);ctx.closePath();ctx.fill();
  }
  // Javonlar va shisha kolbalar (o'rta parallax): ichida zaharli va rangli suyuqlik
  const shelfOff=(cx*.3)%96;
  for(const sy of [70,136]){
    ctx.fillStyle='#34483f';ctx.fillRect(0,sy,vw,4);ctx.fillStyle='#22332b';ctx.fillRect(0,sy+4,vw,3);
    for(let x=-shelfOff;x<vw+96;x+=96){
      const idx=Math.round((x+cx*.3)/96)+sy;
      for(let k=0;k<3;k++){
        const fx=x+10+k*26,h=18+labHash(idx+k)*10,liq=labHash(idx*3+k)>.55?'rgba(120,230,60,.7)':'rgba(230,200,70,.55)';
        // Shisha
        ctx.fillStyle='rgba(200,235,220,.16)';ctx.beginPath();ctx.roundRect?ctx.roundRect(fx,sy-h,14,h,3):ctx.rect(fx,sy-h,14,h);ctx.fill();
        // Suyuqlik (pastki qismi)
        ctx.fillStyle=liq;ctx.fillRect(fx+1,sy-h*.55,12,h*.55-1);
        // Bo'yin va yorug' chiziq
        ctx.fillStyle='rgba(230,250,240,.3)';ctx.fillRect(fx+11,sy-h+3,1,h-6);ctx.fillRect(fx+5,sy-h-4,4,4);
      }
    }
  }
  // Devor quvurlari (orqa parallax)
  const pipeOff=(cx*.22)%240;
  ctx.save();ctx.globalAlpha=.5;
  for(let x=-pipeOff-60;x<vw+60;x+=240){ctx.fillStyle='#3f5249';ctx.fillRect(x,30,240,6);ctx.fillStyle='#5b7266';ctx.fillRect(x,30,240,2);ctx.fillStyle='#2e3d35';ctx.fillRect(x+60,26,8,14);}
  ctx.restore();
  // Zaharli bug: pastdagi yashil nur (nafas oladi)
  const pulse=.5+.5*Math.sin(time*2.2);
  glow(ctx,vw*.5,240,vw*.6,'#7dff3a',.10+.05*pulse);
  ctx.fillStyle='rgba(4,12,8,.35)';ctx.fillRect(0,0,vw,270);
  ctx.restore();
}
function pool(ctx,pool,cx,time,vw){
  if(!visible(pool.x,pool.w,cx,vw))return;
  const l=Math.max(pool.x-cx,-50),r=Math.min(pool.x+pool.w-cx,vw+50),y=pool.y;
  ctx.save();ctx.beginPath();ctx.moveTo(l,270);ctx.lineTo(l,y);
  for(let x=l;x<r;x+=6)ctx.lineTo(x,y+Math.sin((x+cx)*.09+time*2.4)*1.3);
  ctx.lineTo(r,y);ctx.lineTo(r,270);ctx.closePath();ctx.clip();
  // Liquid tiles keep the sprite native ratio.
  const tileH=48*205/240;
  for(let py=y-3;py<270;py+=tileH)for(let px=Math.floor((l+cx)/48)*48-cx;px<r;px+=48)toxicSprite(ctx,'liquid',px,py,48);
  ctx.restore();
  for(let x=l;x<r;x+=80)glow(ctx,x+40,y,47,'#b4ff43',.18+.025*Math.sin(time*3));
}
function platform(ctx,s,cx,vw,time){
  if(!visible(s.x,s.w,cx,vw))return;
  const age=s.age,shake=age>.2&&!s.collapsed?Math.sin(time*43)*Math.min(1.3,age*2):0;
  if(s.collapsed){if(age<1.3){ctx.save();ctx.globalAlpha=Math.max(0,1-(age-.8)*2);toxicSprite(ctx,'bridge',s.x-cx,s.y+(age-.8)*130,s.w,(age-.8)*.2);ctx.restore();}return;}
  if(s.kind==='collapse'&&age>.4){
    ctx.save();ctx.beginPath();ctx.rect(s.x-cx-3,s.y,s.w/2+2,80);ctx.clip();toxicSprite(ctx,'bridge',s.x-cx-1+shake,s.y,s.w);ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(s.x-cx+s.w/2,s.y,s.w/2+4,80);ctx.clip();toxicSprite(ctx,'bridge',s.x-cx+2+shake,s.y+1,s.w);ctx.restore();
  }else if(s.kind==='static')tileSpan(ctx,'tile',s.x-cx,s.y,s.w);
  else toxicSprite(ctx,'bridge',s.x-cx+shake,s.y,s.w);
  // Warning band marks solid platform faces.
  if(s.kind!=='static')toxicSprite(ctx,'stripe',s.x+s.w/2-cx-14,s.y+12,28);
  if(s.kind==='moving'){ctx.save();ctx.globalAlpha=.42;for(let y=24;y<s.y;y+=31)toxicSprite(ctx,'support',s.x+s.w/2-cx-4,y,8);ctx.restore();}
  if(s.kind==='collapse'&&age>.2){glow(ctx,s.x+s.w/2-cx,s.y,24,'#ed9e35',.25);label(ctx,'YEMIRILMOQDA!',s.x-cx,s.y-7,'#ffc580',5);}
}
function fan(ctx,fan,cx,time){
  const x=fan.x-cx,y=fan.y;ctx.save();ctx.globalAlpha=.85;toxicSprite(ctx,'fan',x,y,88);ctx.restore();
  const centerX=x+39,centerY=y+44;ctx.save();ctx.beginPath();ctx.ellipse(centerX,centerY,18,24,0,0,Math.PI*2);ctx.clip();
  toxicSprite(ctx,'rotor',centerX-20,centerY-23.4,40,time*(fan.on?4:.14));ctx.restore();
  glow(ctx,centerX,centerY,32,fan.on?'#b7e984':'#6c8b40',.16);
  label(ctx,fan.on?'VENT ON':'VENT OFF',x+5,y-5,fan.on?'#b5ffc2':'#f5be74',5);
}
export function drawToxicWorld(ctx,vw,cx,gs,actors){
  const f=gs.toxic;if(!f)return;const time=f.time;
  for(const p of f.pools)pool(ctx,p,cx,time,vw);
  // Before rupture, the final bath is low and clearly visible below the platforms.
  pool(ctx,{x:5504,y:f.chase.active?f.chase.toxicY:254,w:896},cx,time,vw);
  for(const x of [80,1680,4030,4500,5524])if(visible(x,180,cx,vw)){
    ctx.save();ctx.globalAlpha=x===5524?1:.75;toxicSprite(ctx,x===5524?'poolTank':'barrelAssembly',x-cx,74,x===5524?190:170);ctx.restore();
    glow(ctx,x+90-cx,129,45,'#b5ef38',.18);
  }
  for(const s of f.surfaces)platform(ctx,s,cx,vw,time);
  for(const r of f.ramps)if(visible(r.x,r.w,cx,vw))toxicSprite(ctx,'stairs',r.x-cx,r.y,r.w);
  for(const h of f.drips)if(visible(h.x-60,100,cx,vw)){
    toxicSprite(ctx,'pipe',h.x-55-cx,h.y-20,80);toxicSprite(ctx,'pipeLeg',h.x+4-cx,h.y,16);
    if(h.warning){glow(ctx,h.x-cx,h.y,26,'#edc949',.35);label(ctx,'ACID!',h.x-cx-9,h.y-25,'#ffd98a',5);}
  }
  for(const h of f.sprays)if(visible(h.x-60,h.w+60,cx,vw)){
    toxicSprite(ctx,'pipe',h.x-56-cx,h.y-20,80);
    if(h.mode==='warning'){glow(ctx,h.x-cx,h.y+7,30,'#ffa533',.4);label(ctx,'BOSIM!',h.x-cx,h.y-24,'#ffcf80',5);}
    if(h.mode==='active'){
      ctx.save();ctx.translate(h.x-cx,h.y+15);ctx.rotate(-Math.PI/2);
      toxicSprite(ctx,'stream',0,0,h.w*126/620);ctx.restore();glow(ctx,h.x+h.w/2-cx,h.y,42,'#bfff45',.24);
    }
  }
  for(const b of f.barrels)if(visible(b.x,40,cx,vw)){
    toxicSprite(ctx,'barrel',b.x-cx,b.y-32.9,28);
    if(b.mode==='warning'){glow(ctx,b.x+14-cx,b.y-12,29,'#ef942f',.32);label(ctx,'LEAK!',b.x-cx,b.y-39,'#ffbc72',5);}
    if(b.mode==='leak'){toxicSprite(ctx,'leak',b.x-10-cx,b.y-12,40);glow(ctx,b.x+10-cx,b.y-8,30,'#c7ff51',.25);}
  }
  for(const d of f.debris)if(visible(d.x,30,cx,vw)){
    if(d.mode==='warning'){label(ctx,'!',d.x-cx,128,'#ffcf83',10);glow(ctx,d.x+7-cx,144,18,'#faad4c',.15);}
    if(d.mode==='warning'||d.mode==='fall')toxicSprite(ctx,'debris',d.x-cx,d.drawY,14,d.mode==='fall'?time:0);
  }
  for(const item of f.fans)if(visible(item.x,88,cx,vw))fan(ctx,item,cx,time);
  const g=f.gas;
  if(visible(g.x,g.w,cx,vw)){
    ctx.save();ctx.beginPath();ctx.rect(g.x-cx,148,g.w,82);ctx.clip();
    for(let x=Math.max(g.x-cx,-140);x<Math.min(g.x+g.w-cx,vw);x+=96){ctx.globalAlpha=g.density*.2;toxicSprite(ctx,'mist',x+Math.sin(time*.4)*10,162,96);}
    ctx.restore();label(ctx,'GAZ: YUQORI YOLDAN OT!',g.x+24-cx,58,'#c1e78b',6);
  }
  for(const c of f.checkpoints)if(visible(c.x,30,cx,vw)){
    toxicSprite(ctx,'lamp',c.x-cx,c.y-18,18);glow(ctx,c.x+9-cx,c.y-13,28,c.active?'#a8ffc6':'#ffcf6f',.25);
    label(ctx,c.active?'SAQLANDI':'CHECKPOINT',c.x-cx-14,c.y-25,c.active?'#c4ffd2':'#ffdc99',5);
  }
  for(const c of f.pickups)if(!c.got&&visible(c.x,14,cx,vw)){toxicSprite(ctx,'lamp',c.x-cx,c.y,12);glow(ctx,c.x+6-cx,c.y+4,17,'#ebffcc',.3);}
  const exit=f.exit;if(visible(exit.x,72,cx,vw)){
    toxicSprite(ctx,'door',exit.x-cx,exit.y-8,72);glow(ctx,exit.x+36-cx,exit.y+40,40,'#caf7c3',.22);label(ctx,'CONTAINMENT EXIT',exit.x-cx-13,exit.y-16,'#d9ffd7',6);
  }
  actors.drawBoy(ctx,gs.p,cx,gs.anim,gs);
  for(const d of f.drops)if(visible(d.x,8,cx,vw)){
    ctx.save();ctx.fillStyle='#d7ff57';ctx.beginPath();ctx.ellipse(d.x-cx,d.y,d.r*.7,d.r*1.5,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  for(const a of f.particles){if(!visible(a.x,a.r,cx,vw))continue;ctx.save();ctx.globalAlpha=Math.min(a.type==='mist'?.16:.7,a.life/a.max);ctx.fillStyle=a.color;
    if(a.type==='mist'||a.type==='smoke'){const grad=ctx.createRadialGradient(a.x-cx,a.y,0,a.x-cx,a.y,a.r);grad.addColorStop(0,a.color);grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;}
    ctx.beginPath();ctx.arc(a.x-cx,a.y,a.r,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  ctx.save();ctx.globalAlpha=.22;const off=(cx*1.08)%420;
  for(let x=410-off;x<vw;x+=420){toxicSprite(ctx,'chain',x+Math.sin(time*.5)*2,0,6);toxicSprite(ctx,'pipeLeg',x+70,224,22);}
  ctx.restore();
  label(ctx,TOXIC_SECTIONS[f.section].name,12,29,'#d5f2b5',7);
  if(gs.p&&gs.p.x<180){label(ctx,'LEVEL 4 / KIMYO LABORATORIYASI',32-cx,139,'#d8ffab',7);label(ctx,'ZAHARLI IDISHLAR VA SUYUQLIK: XAVFLI. SARIQ CHIZIQ: TAYANCH.',32-cx,150,'#b7c2a9',5);}
  if(g.warning){label(ctx,g.exposure>=2.5?'GAZ ZARAR YETKAZYAPTI!':'GAZ! YUQORIGA CHIQ!',vw/2-64,43,'#ffd088',7);}
  if(f.chase.active&&gs.p&&gs.p.x>=5504)label(ctx,f.chase.elapsed<2?'TANK BUZILDI! QOCH!':'QOCH! ZAHAR KOTARILMOQDA!',vw/2-76,43,'#f3ff91',7);
  if(f.flash>0){ctx.save();ctx.globalAlpha=f.flash;ctx.fillStyle='#caff70';ctx.fillRect(0,0,vw,270);ctx.restore();}
}
export function drawToxicComplete(ctx,vw){
  ctx.save();ctx.fillStyle='rgba(4,15,9,.86)';ctx.fillRect(0,0,vw,270);
  label(ctx,'LEVEL 4 COMPLETE',vw/2-77,110,'#dfffaf',12);label(ctx,'LABORATORIYA ORTDA QOLDI',vw/2-75,133,'#b3d594',8);ctx.restore();
}
