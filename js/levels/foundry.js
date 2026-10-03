import { overlap, clamp } from '../utils.js';
import {MAX_LIVES} from '../config.js';

export const PARTICLE_LIMIT = 220;
export const SECTIONS = [
  {x:0, name:'01 / ISSIQ SEX'}, {x:384,name:'02 / ERITILGAN METALL'},
  {x:832,name:'03 / PRESS ZALI'}, {x:1072,name:"04 / YUQORI YO'LAK"},
  {x:1552,name:'05 / ERITISH PECHI'}, {x:2256,name:'06 / TEZKOR CHIQISH'}
];
export function createFoundryLayout() {
  const rows = Array.from({length:17},()=>Array(192).fill('.'));
  rows.forEach(r=>{r[0]=r[191]='#';}); rows[0].fill('#'); rows[12][3]='P';
  return rows.map(r=>r.join(''));
}
export function hazardPhase(h, time) {
  const t = (time + (h.offset || 0) + 1e-8) % h.period;
  if(h.type==='press') return t<2 ? 'open' : t<2.7 ? 'warning' : t<2.9 ? 'slam' : t<3.6 ? 'hold' : 'opening';
  if(h.type==='debris') return t<2 ? 'safe' : t<2.85 ? 'warning' : t<3.6 ? 'fall' : 'cooldown';
  return t<1.6 ? 'safe' : t<2.3 ? 'warning' : t<3.35 ? 'active' : 'cooldown';
}
export function createFoundry() {
  let id=0;
  const surface=(x,y,w,kind='static',extra={})=>({id:id++,x,y,w,h:8,kind,baseX:x,baseY:y,dx:0,dy:0,age:0,collapsed:false,...extra});
  const surfaces=[
    surface(16,208,368), surface(400,196,64),
    surface(496,184,56,'moving',{ax:48,ay:0,speed:1.2}),
    surface(624,176,56,'collapse'),surface(720,192,64),
    surface(832,208,96),surface(928,208,64,'collapse'),surface(992,208,80),
    surface(1088,192,80),surface(1200,160,72),surface(1312,128,80),surface(1424,96,96),
    surface(1544,128,72),surface(1640,160,72),surface(1752,192,144),
    surface(1944,192,64,'moving',{ax:0,ay:24,speed:1.1}),
    surface(2056,176,200),surface(2288,192,56),
    surface(2392,176,56,'moving',{ax:32,ay:16,speed:1.3}),
    surface(2504,160,56,'collapse'),surface(2616,184,56,'moving',{ax:0,ay:24,speed:1.4}),
    surface(2728,176,64),surface(2832,192,64),surface(2944,208,112)
  ];
  const hazards=[
    {type:'steam',x:272,y:144,w:20,h:64,period:4.4,offset:0},
    {type:'press',x:928,y:56,w:64,h:31.4,floor:208,period:4.8,offset:0},
    {type:'steam',x:1226,y:96,w:20,h:64,period:4.4,offset:1.1},
    {type:'fire',x:1444,y:48,w:20,h:48,period:4.4,offset:0.8},
    {type:'debris',x:1800,y:24,w:18,h:18,period:5,offset:0,floor:192},
    {type:'press',x:2104,y:40,w:64,h:31.4,floor:176,period:4.8,offset:1.2},
    {type:'debris',x:2192,y:24,w:18,h:18,period:5,offset:2,floor:176},
    {type:'fire',x:2744,y:128,w:20,h:48,period:4.4,offset:1.8},
    {type:'laser',x:2838,y:148.8,w:40,h:43.2,period:4.4,offset:0.4}
  ].map(h=>({...h,mode:'safe',previousMode:null,drawY:h.y}));
  return {time:0,surfaces,hazards,
    ramps:[{x:176,y:176,w:64,h:40.92},{x:1094,y:151.08,w:64,h:40.92}],
    pools:[{x:384,y:238,w:448,h:32},{x:1072,y:246,w:680,h:24},{x:1896,y:238,w:160,h:32},{x:2256,y:238,w:688,h:32}],
    saws:[{x:578,y:160,baseX:578,baseY:160,r:15,angle:0,ax:0,ay:22},
      {x:1388,y:40,baseX:1388,baseY:40,r:15,angle:0,ax:25,ay:0},
      {x:2470,y:70,baseX:2470,baseY:70,r:14,angle:0,ax:24,ay:10}],
    checkpoints:[{x:1024,y:194,active:false},{x:2230,y:162,active:false}],
    coins:[{x:744,y:164,got:false},{x:1482,y:67,got:false},{x:2000,y:144,got:false},{x:2670,y:135,got:false}],
    exit:{x:2992,y:144,w:48,h:64},particles:[],shake:0,flash:0,
    events:[],section:0,heatTick:0};
}
export function emit(f,type,x,y,count=1) {
  const colors={spark:'#fff5bd',ember:'#ff8f24',smoke:'#393239',steam:'#eef3e8',dust:'#ae8e77',bubble:'#ffe19b',molten:'#ffc750'};
  for(let i=0;i<count && f.particles.length<PARTICLE_LIMIT;i++) {
    f.particles.push({type,x,y,vx:(Math.random()-.5)*(type==='spark'?44:14),
      vy:type==='dust'?8:-12-Math.random()*20,life:type==='smoke'?2.8:type==='steam'?1.2:.65+Math.random()*.5,
      max:type==='smoke'?2.8:type==='steam'?1.2:1.15,r:type==='smoke'?5:type==='steam'?3:1+Math.random(),color:colors[type]||colors.dust});
    if(type==='molten') Object.assign(f.particles[f.particles.length-1],{vx:0,vy:42,life:2.5,max:2.5,r:1.2});
  }
}
export function resetFoundryBodies(f) {
  for(const s of f.surfaces) {s.age=0;s.collapsed=false;}
  f.particles.length=0;f.shake=0;f.flash=0;
  // Give the respawning player a full safe window near the saved checkpoint.
  for(const h of f.hazards) {h.offset=(h.period-f.time%h.period)%h.period;h.previousMode=null;}
}
export function stepFoundry(gs,dt,viewWidth=480) {
  const f=gs.foundry;if(!f)return;
  f.time+=dt;f.events.length=0;f.shake=Math.max(0,f.shake-dt*8);f.flash=Math.max(0,f.flash-dt*3);
  const p=gs.p;
  f.section=SECTIONS.reduce((best,s,i)=>p&&p.x>=s.x?i:best,0);
  for(const s of f.surfaces) {
    const oldX=s.x,oldY=s.y;
    if(s.kind==='moving') {s.x=s.baseX+Math.sin(f.time*s.speed)*s.ax;s.y=s.baseY+Math.sin(f.time*s.speed)*s.ay;}
    s.dx=s.x-oldX;s.dy=s.y-oldY;
    if(p&&p.onGround&&p.foundryGround===s.id&&!s.collapsed){p.x+=s.dx;p.y+=s.dy;}
    if(s.kind==='collapse'&&s.age>0) {
      const before=s.age;s.age+=dt;
      if(!s.collapsed&&s.x>gs.camX-64&&s.x<gs.camX+viewWidth&&Math.random()<dt*12)emit(f,'dust',s.x+Math.random()*s.w,s.y+9);
      if(before<.95&&s.age>=.95) {s.collapsed=true;f.shake=Math.max(f.shake,1.4);emit(f,'dust',s.x+s.w/2,s.y,12);f.events.push({type:'collapse',x:s.x});}
      if(s.age>4.5){s.collapsed=false;s.age=0;}
    }
  }
  for(const s of f.saws) {s.angle=f.time*4.8;s.x=s.baseX+Math.sin(f.time*1.25)*s.ax;s.y=s.baseY+Math.sin(f.time*1.25)*s.ay;}
  const visible=x=>x>=gs.camX-64&&x<=gs.camX+viewWidth+64;
  for(const h of f.hazards) {
    h.mode=hazardPhase(h,f.time);
    const t=(f.time+h.offset+1e-8)%h.period;
    if(h.type==='press') {
      const down=clamp((t-2.7)/.2,0,1),up=clamp((t-3.6)/1.2,0,1);
      h.drawY=h.y+(h.floor-h.h-h.y)*(t<3.6?down:1-up);
    }
    if(h.type==='debris')h.drawY=h.mode==='fall'?h.y+((t-2.85)/.75)**2*(h.floor-h.y):h.y;
    if(h.mode!==h.previousMode) {
      if(visible(h.x))f.events.push({type:h.type+'-'+h.mode,x:h.x});
      if(h.type==='press'&&h.mode==='hold'&&visible(h.x)) {f.shake=Math.max(f.shake,2.4);emit(f,'dust',h.x+h.w/2,h.floor,16);}
      h.previousMode=h.mode;
    }
    if(visible(h.x)&&(h.mode==='warning'||h.mode==='active')&&Math.random()<dt*35) {
      emit(f,h.type==='steam'?'steam':h.type==='fire'?'ember':'dust',h.x+h.w/2,h.y+h.h);
    }
    if(h.type==='steam'&&h.mode==='active'&&visible(h.x))emit(f,'steam',h.x+h.w/2,h.y+h.h,2);
    if(h.type==='fire'&&h.mode==='active'&&visible(h.x))emit(f,'smoke',h.x+10,h.y,1);
  }
  f.heatTick+=dt;
  if(f.heatTick>.065) {
    f.heatTick=0;
    for(const pool of f.pools) {
      const left=Math.max(pool.x,gs.camX),right=Math.min(pool.x+pool.w,gs.camX+viewWidth);
      if(right>left) {const x=left+Math.random()*(right-left);emit(f,'ember',x,pool.y);emit(f,'bubble',x,pool.y+2);if(Math.random()<.15)emit(f,'smoke',x,pool.y);}
    }
  }
  if(Math.random()<dt*12) {
    for(const x of [1840,2150]) if(visible(x)) {emit(f,'spark',x+83,130,2);emit(f,'smoke',x+40,78);}
    const bath=f.pools.find(pool=>visible(pool.x+pool.w/2));
    if(bath&&Math.random()<.25)emit(f,'molten',bath.x+bath.w/2,65);
  }
  for(let i=f.particles.length-1;i>=0;i--) {
    const a=f.particles[i];a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;
    if(a.type==='dust'||a.type==='spark'||a.type==='molten')a.vy+=45*dt;
    if(a.type==='smoke'||a.type==='steam')a.r+=dt*4;
    if(a.life<=0)f.particles.splice(i,1);
  }
}
export function resolveFoundryGround(gs,p,previousBottom) {
  const f=gs.foundry;if(!f)return;
  p.foundryGround=null;
  if(p.vy>=0) {
    for(const s of f.surfaces) {
      if(s.collapsed||p.x+p.w<=s.x||p.x>=s.x+s.w)continue;
      if(previousBottom<=s.y+Math.max(2,s.dy)&&p.y+p.h>=s.y) {
        p.y=s.y-p.h;p.vy=0;p.onGround=true;p.foundryGround=s.id;
        if(s.kind==='collapse'&&s.age===0){s.age=.001;f.events.push({type:'collapse-warning',x:s.x});}
        break;
      }
    }
    for(const r of f.ramps) {
      const foot=clamp(p.x+p.w/2-r.x,0,r.w);
      const top=r.y+r.h-r.h*foot/r.w;
      if(p.x+p.w>r.x&&p.x<r.x+r.w&&previousBottom<=top+4&&p.y+p.h>=top) {
        p.y=top-p.h;p.vy=0;p.onGround=true;
      }
    }
  }
}
export function foundryDamage(gs) {
  const f=gs.foundry,p=gs.p;if(!f||!p)return null;
  // Molten metal ignores respawn/steam immunity.
  if(f.pools.some(pool=>overlap(p,pool))||p.y>280)return 'death';
  if(p.inv>0)return null;
  for(const s of f.saws) {
    const nx=clamp(s.x,p.x,p.x+p.w),ny=clamp(s.y,p.y,p.y+p.h);
    if(Math.hypot(s.x-nx,s.y-ny)<s.r)return 'death';
  }
  for(const h of f.hazards) {
    const box=h.type==='press'||h.type==='debris'?{x:h.x+2,y:h.drawY,w:h.w-4,h:h.h}:h.type==='laser'?{x:h.x+8,y:h.y+5,w:h.w-16,h:h.h-10}:h;
    const dangerous=h.mode==='active'||h.mode==='slam'||h.mode==='hold'||h.mode==='fall'||(h.type==='press'&&h.mode==='opening');
    if(dangerous&&overlap(p,box)) {
      if(h.type==='steam'){p.vx=p.x<h.x?-2.8:2.8;p.vy=-3.6;p.inv=45;p.onGround=false;f.flash=.4;f.events.push({type:'steam-hit',x:p.x});return 'knockback';}
      return 'death';
    }
  }
  return null;
}
export function foundryInteractions(gs) {
  const f=gs.foundry,p=gs.p;if(!f||!p)return false;
  for(const c of f.checkpoints)if(!c.active&&overlap(p,{x:c.x-5,y:c.y-20,w:26,h:40})) {
    c.active=true;gs.spawnX=c.x;gs.spawnY=c.y;gs.checkpoint++;f.events.push({type:'checkpoint',x:c.x});emit(f,'spark',c.x,c.y,14);
  }
  for(const c of f.coins)if(!c.got&&overlap(p,{x:c.x,y:c.y,w:12,h:12})) {c.got=true;gs.coinCount++;gs.lives=Math.min(MAX_LIVES,gs.lives+1);f.events.push({type:'pickup',x:c.x});}
  return overlap(p,f.exit);
}
