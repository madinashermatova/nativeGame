import { overlap, clamp } from '../utils.js';
import {MAX_LIVES} from '../config.js';
export const TOXIC_PARTICLE_LIMIT=240;
export const TOXIC_SECTIONS=[
  {x:0,name:'01 / TOXIC ZONE ENTRY'},{x:800,name:'02 / TOXIC POOLS'},
  {x:1600,name:'03 / ACID DRIPS'},{x:2400,name:'04 / TOXIC GAS ROOM'},
  {x:3200,name:'05 / CORRODED PLATFORMS'},{x:4000,name:'06 / TOXIC BARRELS'},
  {x:4800,name:'07 / ACID SPRAY'},{x:5504,name:'08 / FINAL TOXIC ESCAPE'}
];
export const DRIP_PATTERN=[1.2,1.65,3.3,4.75];
export function createToxicLayout(){
  const rows=Array.from({length:17},()=>Array(400).fill('.'));
  rows.forEach(r=>{r[0]=r[399]='#';});rows[0].fill('#');rows[12][3]='P';
  return rows.map(r=>r.join(''));
}
export function sprayPhase(h,time){const t=(time+h.offset+1e-8)%h.period;return t<2?'off':t<2.7?'warning':t<3.75?'active':'cooldown';}
export function dripWarning(h,time){const t=(time+h.offset+1e-8)%h.period;return DRIP_PATTERN.some(v=>v-t>0&&v-t<=.35);}
export function fanOn(fan,time){return (time+fan.offset)%fan.period<fan.onDuration;}
export function createToxic(){
  let id=0;const s=(x,y,w,kind='static',extra={})=>({id:id++,x,y,w,h:8,baseX:x,baseY:y,kind,dx:0,dy:0,age:0,collapsed:false,...extra});
  const surfaces=[
    s(16,208,464),s(272,144,96),s(496,192,72),s(624,176,72,'moving',{ax:18,ay:0,speed:1.05}),s(752,192,128),
    s(928,176,72,'moving',{ax:22,ay:0,speed:1}),s(1056,160,80,'collapse'),s(1184,192,80),
    s(1312,176,72,'moving',{ax:0,ay:18,speed:1.2}),s(1440,160,96),s(1568,192,96),
    s(1664,208,240),s(1920,192,80),s(2048,208,352),s(2300,144,96),
    s(2400,208,784),s(2480,144,80),s(2592,112,80),s(2720,96,112),s(2880,128,96),s(3056,160,96),
    s(3200,192,96),s(3328,176,80,'collapse'),s(3456,160,72,'moving',{ax:16,ay:0,speed:1.15}),
    s(3584,192,80,'collapse'),s(3712,176,80,'collapse'),s(3840,192,176),
    s(4016,208,144),s(4208,192,112),s(4352,208,432),
    s(4800,192,192),s(5056,160,96),s(5216,192,160),s(5392,208,112),
    s(5520,192,80),s(5632,176,72,'moving',{ax:20,ay:12,speed:1.1}),s(5760,160,72,'collapse'),
    s(5888,144,80),s(6016,168,72,'moving',{ax:20,ay:-12,speed:1.1}),s(6144,144,96),s(6272,144,112)
  ];
  return {time:0,surfaces,ramps:[{x:192,y:144,w:80,h:64},{x:2220,y:144,w:80,h:64}],
    pools:[{x:480,y:242,w:320,h:28},{x:880,y:238,w:784,h:32},{x:1904,y:242,w:144,h:28},
      {x:3184,y:238,w:656,h:32},{x:4160,y:242,w:48,h:28},{x:4320,y:242,w:32,h:28},
      {x:4992,y:238,w:64,h:32},{x:5152,y:238,w:64,h:32},{x:5376,y:242,w:16,h:28}],
    drips:[{x:420,y:92,offset:0},{x:1712,y:72,offset:.4},{x:1812,y:80,offset:2.1},{x:2118,y:70,offset:1.4},{x:2330,y:45,offset:3.5}].map(h=>({...h,period:6,warning:false})),
    sprays:[{x:4900,y:166,w:84,h:15,offset:0,period:4.8,mode:'off'},
      {x:5270,y:165,w:84,h:15,offset:1.7,period:4.8,mode:'off'},
      {x:5824,y:128,w:76,h:15,offset:.8,period:4.8,mode:'off'}],
    barrels:[{x:4080,y:208,armed:false,age:0,mode:'normal'},{x:4550,y:208,armed:false,age:0,mode:'normal'}],
    fans:[{x:2608,y:116,offset:0,period:12,onDuration:7},{x:2984,y:142,offset:2.4,period:12,onDuration:7},{x:6076,y:75,offset:0,period:8,onDuration:5}],
    debris:[{x:6112,y:24,w:14,h:13,offset:0,period:6,mode:'safe',drawY:24}],
    gas:{x:2400,y:164,w:784,h:66,density:.65,exposure:0,lastHit:0,warning:false},
    checkpoints:[{x:2368,y:130,active:false},{x:3900,y:178,active:false},{x:5424,y:194,active:false}],
    pickups:[{x:1512,y:137,got:false},{x:2816,y:72,got:false},{x:3936,y:166,got:false},{x:5360,y:170,got:false}],
    chase:{startX:5504,active:false,elapsed:0,toxicY:254,ruptured:false},
    exit:{x:6320,y:80,w:64,h:64},particles:[],drops:[],events:[],shake:0,flash:0,section:0,
    emissionClock:0};
}
export function emitToxic(f,type,x,y,count=1){
  const colors={bubble:'#d1ff69',mist:'#91c447',drop:'#d5ff40',splash:'#bbff53',dust:'#9b9470',spark:'#fff3cb',smoke:'#455a39'};
  for(let i=0;i<count&&f.particles.length<TOXIC_PARTICLE_LIMIT;i++){
    const life=type==='mist'?2.6:type==='smoke'?2:.65+Math.random()*.65;
    f.particles.push({type,x,y,vx:(Math.random()-.5)*20,vy:type==='splash'?-18-Math.random()*28:type==='dust'?12:-8-Math.random()*16,
      life,max:life,r:type==='mist'?4:type==='smoke'?3:1+Math.random(),color:colors[type]||colors.dust});
  }
}
export function resetToxic(f){
  for(const s of f.surfaces){s.age=0;s.collapsed=false;}
  for(const h of [...f.drips,...f.sprays]){h.offset=(h.period-f.time%h.period+.05)%h.period;h.mode='off';h.warning=false;}
  for(const b of f.barrels){b.armed=false;b.age=0;b.mode='normal';}
  f.drops.length=0;f.particles.length=0;f.gas.exposure=0;f.gas.lastHit=0;f.gas.warning=false;
  f.chase.active=false;f.chase.ruptured=false;f.chase.elapsed=0;f.chase.toxicY=254;f.shake=0;f.flash=0;
}
export function stepToxic(gs,dt,viewWidth=480){
  const f=gs.toxic;if(!f)return;const before=f.time;f.time+=dt;f.events.length=0;
  f.shake=Math.max(0,f.shake-dt*6);f.flash=Math.max(0,f.flash-dt*2);
  const p=gs.p,visible=x=>x>=gs.camX-64&&x<=gs.camX+viewWidth+64;
  f.section=TOXIC_SECTIONS.reduce((best,s,i)=>p&&p.x>=s.x?i:best,0);
  for(const s of f.surfaces){
    const ox=s.x,oy=s.y;if(s.kind==='moving'){s.x=s.baseX+Math.sin(f.time*s.speed)*s.ax;s.y=s.baseY+Math.sin(f.time*s.speed)*s.ay;}
    s.dx=s.x-ox;s.dy=s.y-oy;
    if(p&&p.onGround&&p.toxicGround===s.id&&!s.collapsed){p.x+=s.dx;p.y+=s.dy;}
    if(s.age>0){const age=s.age;s.age+=dt;
      if(s.age>.6&&!s.collapsed&&visible(s.x)&&Math.random()<dt*24)emitToxic(f,'dust',s.x+Math.random()*s.w,s.y+9);
      if(age<.8&&s.age>=.8){s.collapsed=true;if(visible(s.x)){f.shake=Math.max(f.shake,1.3);emitToxic(f,'dust',s.x+s.w/2,s.y,14);f.events.push({type:'collapse',x:s.x});}}
      if(s.age>4.5){s.age=0;s.collapsed=false;}
    }
  }
  for(const h of f.drips){
    const was=h.warning;h.warning=dripWarning(h,f.time);
    if(h.warning&&!was&&visible(h.x)){f.events.push({type:'drip-warning',x:h.x});emitToxic(f,'bubble',h.x,h.y,3);}
    for(let cycle=Math.floor((before+h.offset)/h.period);cycle<=Math.floor((f.time+h.offset)/h.period);cycle++)for(const dropAt of DRIP_PATTERN){
      const spawnTime=cycle*h.period+dropAt-h.offset;
      if(spawnTime>before&&spawnTime<=f.time&&f.drops.length<48){f.drops.push({x:h.x,y:h.y,vy:75,life:2.6,r:2.6});if(visible(h.x))f.events.push({type:'acid-drop',x:h.x});}
    }
  }
  for(let i=f.drops.length-1;i>=0;i--){const d=f.drops[i];d.y+=d.vy*dt;d.vy+=65*dt;d.life-=dt;if(d.life<=0||d.y>248){if(visible(d.x))emitToxic(f,'splash',d.x,Math.min(d.y,245),3);f.drops.splice(i,1);}}
  for(const h of f.sprays){const old=h.mode;h.mode=sprayPhase(h,f.time);if(old!==h.mode&&visible(h.x))f.events.push({type:'spray-'+h.mode,x:h.x});
    if(visible(h.x)&&(h.mode==='warning'||h.mode==='active')&&Math.random()<dt*24)emitToxic(f,h.mode==='warning'?'bubble':'splash',h.x,h.y+7);
  }
  for(const fan of f.fans){const on=fanOn(fan,f.time);if(fan.on!==undefined&&fan.on!==on&&visible(fan.x))f.events.push({type:'fan-switch',x:fan.x});fan.on=on;}
  const ventilated=f.fans.slice(0,2).some(fan=>fan.on);
  f.gas.density+=( (ventilated?.12:.85)-f.gas.density)*(1-Math.exp(-dt*.8));
  for(const b of f.barrels){
    if(!b.armed&&p&&Math.abs(p.x-b.x)<72){b.armed=true;b.age=0;f.events.push({type:'barrel-warning',x:b.x});}
    if(b.armed){b.age+=dt;const old=b.mode;b.mode=b.age<1?'warning':b.age<4.5?'leak':'spent';if(b.mode==='leak'&&old!==b.mode){emitToxic(f,'splash',b.x,b.y-4,12);f.events.push({type:'barrel-leak',x:b.x});}}
  }
  for(const d of f.debris){const t=(f.time+d.offset)%d.period,old=d.mode;d.mode=t<2?'safe':t<2.9?'warning':t<3.7?'fall':'cooldown';
    d.drawY=d.mode==='fall'?24+((t-2.9)/.8)**2*160:24;if(old!==d.mode&&visible(d.x))f.events.push({type:'debris-'+d.mode,x:d.x});
    if(d.mode==='warning'&&visible(d.x)&&Math.random()<dt*14)emitToxic(f,'dust',d.x,26);
  }
  if(p&&p.x>=f.chase.startX&&!f.chase.active){f.chase.active=true;f.chase.ruptured=true;f.chase.elapsed=0;f.shake=2;f.events.push({type:'tank-rupture',x:p.x});emitToxic(f,'splash',p.x+60,116,20);}
  if(f.chase.active){
    const old=f.chase.elapsed;f.chase.elapsed+=dt;const elapsed=Math.max(0,f.chase.elapsed-2),oldElapsed=Math.max(0,old-2);
    const riseAt=t=>Math.min(t,8)*1.1+Math.max(0,Math.min(t-8,10))*1.8+Math.max(0,t-18)*3;
    const ventilation=f.fans[2].on?.7:1;
    f.chase.toxicY=Math.max(148,f.chase.toxicY-(riseAt(elapsed)-riseAt(oldElapsed))*ventilation);
  }
  f.emissionClock+=dt;
  if(f.emissionClock>.085){f.emissionClock=0;
    for(const pool of [...f.pools,...(f.chase.active?[{x:5504,y:f.chase.toxicY,w:896}]:[])]){
      const l=Math.max(pool.x,gs.camX),r=Math.min(pool.x+pool.w,gs.camX+viewWidth);
      if(r>l){const x=l+Math.random()*(r-l);emitToxic(f,'bubble',x,pool.y+3);if(Math.random()<.4)emitToxic(f,'mist',x,pool.y);}
    }
    if(p&&p.x>2400&&p.x<3184)emitToxic(f,'mist',gs.camX+Math.random()*viewWidth,210,2);
  }
  for(let i=f.particles.length-1;i>=0;i--){const a=f.particles[i];a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;
    if(a.type==='splash'||a.type==='dust')a.vy+=65*dt;if(a.type==='mist'||a.type==='smoke')a.r+=dt*5;if(a.life<=0)f.particles.splice(i,1);
  }
}
export function resolveToxicGround(gs,p,previousBottom){
  const f=gs.toxic;if(!f)return;p.toxicGround=null;
  if(p.vy>=0){for(const s of f.surfaces){if(s.collapsed||p.x+p.w<=s.x||p.x>=s.x+s.w)continue;
    if(previousBottom<=s.y+Math.max(2,s.dy)&&p.y+p.h>=s.y){p.y=s.y-p.h;p.vy=0;p.onGround=true;p.toxicGround=s.id;
      if(s.kind==='collapse'&&s.age===0){s.age=.001;f.events.push({type:'corrosion-warning',x:s.x});}break;}}
    for(const r of f.ramps){const foot=clamp(p.x+p.w/2-r.x,0,r.w),top=r.y+r.h-r.h*foot/r.w;
      if(p.x+p.w>r.x&&p.x<r.x+r.w&&previousBottom<=top+4&&p.y+p.h>=top){p.y=top-p.h;p.vy=0;p.onGround=true;}}
  }
}
export function circleTouchesPlayer(d,p){const x=clamp(d.x,p.x,p.x+p.w),y=clamp(d.y,p.y,p.y+p.h);return Math.hypot(d.x-x,d.y-y)<d.r;}
export function toxicDamage(gs,dt){
  const f=gs.toxic,p=gs.p;if(!f||!p)return null;
  const chasePool={x:5504,y:f.chase.toxicY,w:896,h:270-f.chase.toxicY};
  if(f.pools.some(pool=>overlap(p,pool))||(f.chase.active&&overlap(p,chasePool))||p.y>280)return 'death';
  const g=f.gas,inGas=overlap(p,g)&&p.y+p.h/2>=g.y&&g.density>.3;
  if(inGas)g.exposure+=dt;else g.exposure=Math.max(0,g.exposure-dt*2);
  g.warning=g.exposure>=1;if(g.exposure<.5)g.lastHit=0;
  if(p.inv>0)return null;
  if(f.drops.some(d=>circleTouchesPlayer(d,p)))return 'death';
  if(f.sprays.some(h=>h.mode==='active'&&overlap(p,h)))return 'death';
  if(f.barrels.some(b=>b.mode==='leak'&&overlap(p,{x:b.x-10,y:b.y-12,w:40,h:12})))return 'death';
  if(f.debris.some(d=>d.mode==='fall'&&overlap(p,{x:d.x,y:d.drawY,w:d.w,h:d.h})))return 'death';
  if(g.exposure>=2.5&&(g.lastHit===0||g.exposure-g.lastHit>=1)){g.lastHit=g.exposure;return 'hurt';}
  return null;
}
export function hurtToxic(gs){
  if(gs.lives<=1)return 'death';gs.lives--;gs.p.inv=45;gs.toxic.flash=.3;gs.toxic.events.push({type:'hurt',x:gs.p.x});return 'hurt';
}
export function toxicInteractions(gs){
  const f=gs.toxic,p=gs.p;if(!f||!p)return false;
  for(const c of f.checkpoints)if(!c.active&&overlap(p,{x:c.x-5,y:c.y-20,w:26,h:40})){
    c.active=true;gs.spawnX=c.x;gs.spawnY=c.y;gs.checkpoint++;f.events.push({type:'checkpoint',x:c.x});emitToxic(f,'spark',c.x,c.y,12);
  }
  for(const c of f.pickups)if(!c.got&&overlap(p,{x:c.x,y:c.y,w:12,h:12})){
    c.got=true;gs.coinCount++;gs.lives=Math.min(MAX_LIVES,gs.lives+1);f.events.push({type:'pickup',x:c.x});
  }
  return overlap(p,f.exit);
}
