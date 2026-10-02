import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createFoundry, stepFoundry, hazardPhase, foundryDamage, resolveFoundryGround, foundryInteractions, resetFoundryBodies, emit, PARTICLE_LIMIT } from '../js/foundry.js';
import { loadLevel, levels } from '../js/level.js';
import { gameState } from '../js/state.js';
import { spawnPlayer, updatePlayer, die } from '../js/player.js';
import { keys } from '../js/input.js';
const fixture=()=>({foundry:createFoundry(),camX:0,p:{x:48,y:194,w:12,h:14,vx:0,vy:0,onGround:false,inv:0},checkpoint:0,lives:10,coinCount:0});

test('Level 3 isolates its runtime and retains rectangular earlier maps',()=>{
  const before=levels.slice(0,2).map(r=>JSON.stringify(r));
  loadLevel(2);assert(gameState.foundry);assert.equal(levels[2][0].length,192);
  loadLevel(1);assert.equal(gameState.foundry,null);
  loadLevel(0);assert.equal(gameState.foundry,null);
  assert.deepEqual(levels.slice(0,2).map(r=>JSON.stringify(r)),before);
});
test('molten metal instantly kills even during spawn or steam immunity',()=>{
  const gs=fixture(),pool=gs.foundry.pools[0];gs.p.x=pool.x+8;gs.p.y=pool.y-2;gs.p.inv=60;assert.equal(foundryDamage(gs),'death');
});
test('steam warns harmlessly then knocks back; fire and laser warn before damage',()=>{
  for(const type of ['steam','fire','laser']) {
    const gs=fixture(),h=gs.foundry.hazards.find(h=>h.type===type);Object.assign(gs.p,{x:h.x+9,y:h.y+10});
    h.mode=hazardPhase({...h,offset:0},1.9);assert.equal(h.mode,'warning');assert.equal(foundryDamage(gs),null);
    h.mode=hazardPhase({...h,offset:0},2.5);assert.equal(h.mode,'active');assert.equal(foundryDamage(gs),type==='steam'?'knockback':'death');
    if(type==='steam'){assert.equal(gs.p.inv,45);assert(gs.p.vy<0);assert.equal(foundryDamage(gs),null);}
  }
});
test('press and debris have deterministic warnings and physical impact colliders',()=>{
  for(const type of ['press','debris']) {
    const gs=fixture(),h=gs.foundry.hazards.find(h=>h.type===type);h.offset=0;
    stepFoundry(gs,2.2);assert.equal(h.mode,'warning');
    gs.p.x=h.x+3;gs.p.y=h.floor-14;assert.equal(foundryDamage(gs),null);
    stepFoundry(gs,type==='press'?.8:1.38);assert(['hold','fall'].includes(h.mode));
    if(type==='debris')gs.p.y=h.drawY;
    assert.equal(foundryDamage(gs),'death');
  }
});
test('moving platform transfers horizontal and vertical movement to standing player',()=>{
  for(const axis of ['ax','ay']) {
    const gs=fixture(),s=gs.foundry.surfaces.find(s=>s.kind==='moving'&&s[axis]);
    Object.assign(gs.p,{x:s.x+5,y:s.y-14,onGround:true,foundryGround:s.id});const before={x:gs.p.x,y:gs.p.y};
    stepFoundry(gs,1/60);assert.equal(gs.p.x-before.x,s.dx);assert.equal(gs.p.y-before.y,s.dy);
  }
});
test('one-way landing cannot attach to platforms from underneath',()=>{
  const gs=fixture(),s=gs.foundry.surfaces[1];Object.assign(gs.p,{x:s.x+5,y:s.y-12,vy:2});resolveFoundryGround(gs,gs.p,s.y-2);assert.equal(gs.p.y,s.y-14);assert.equal(gs.p.foundryGround,s.id);
  Object.assign(gs.p,{y:s.y+2,vy:-3,onGround:false});resolveFoundryGround(gs,gs.p,s.y+16);assert.equal(gs.p.y,s.y+2);assert.equal(gs.p.onGround,false);
});
test('collapse gives nearly one second of warning, falls, then recovers',()=>{
  const gs=fixture(),s=gs.foundry.surfaces.find(s=>s.kind==='collapse');gs.p.x=s.x;gs.p.y=s.y-12;gs.p.vy=2;resolveFoundryGround(gs,gs.p,s.y-2);assert(s.age>0);stepFoundry(gs,.6);assert.equal(s.collapsed,false);stepFoundry(gs,.4);assert.equal(s.collapsed,true);stepFoundry(gs,4);assert.equal(s.collapsed,false);
});
test('checkpoint updates respawn and temporary hazards reset safely',()=>{
  const gs=fixture(),c=gs.foundry.checkpoints[0];gs.p.x=c.x;gs.p.y=c.y;foundryInteractions(gs);assert(c.active);assert.equal(gs.spawnX,c.x);assert.equal(gs.checkpoint,1);
  gs.foundry.time=19;resetFoundryBodies(gs.foundry);for(const h of gs.foundry.hazards)assert(['safe','open'].includes(hazardPhase(h,19)));
  loadLevel(2);const saved=gameState.foundry.checkpoints[0];gameState.p=spawnPlayer();gameState.p.x=saved.x;gameState.p.y=saved.y;gameState.lives=10;foundryInteractions(gameState);die({});assert.equal(gameState.p.x,saved.x);assert.equal(gameState.p.y,saved.y);
});
test('heal pickup is collected once and the freight gate is a separate exit trigger',()=>{
  const gs=fixture(),c=gs.foundry.coins[0];gs.lives=7;gs.p.x=c.x;gs.p.y=c.y;foundryInteractions(gs);foundryInteractions(gs);assert.equal(gs.lives,8);assert.equal(gs.coinCount,1);
  gs.p.x=gs.foundry.exit.x+14;gs.p.y=194;assert.equal(foundryInteractions(gs),true);
});
test('moving machinery is independent of dt partition; particles stay bounded',()=>{
  const a=fixture(),b=fixture();for(let i=0;i<60;i++)stepFoundry(a,1/60);for(let i=0;i<30;i++)stepFoundry(b,1/30);
  for(let i=0;i<a.foundry.surfaces.length;i++){assert(Math.abs(a.foundry.surfaces[i].x-b.foundry.surfaces[i].x)<1e-9);assert(Math.abs(a.foundry.surfaces[i].y-b.foundry.surfaces[i].y)<1e-9);}
  emit(a.foundry,'spark',0,0,1000);assert.equal(a.foundry.particles.length,PARTICLE_LIMIT);stepFoundry(a,5);assert(a.foundry.particles.length<PARTICLE_LIMIT);
});
test('all Level 3 PNG crops render without aspect-ratio distortion or primitive geometry',async()=>{
  globalThis.Image=class {set src(path){this.path=path;if(fs.existsSync(path)){const b=fs.readFileSync(path);this.width=this.naturalWidth=b.readUInt32BE(16);this.height=b.readUInt32BE(20);this.complete=true;}}};
  const {sprite,FOUNDRY_SPRITES,drawFoundryBackground,drawFoundryWorld}=await import('../js/foundry-renderer.js');
  const calls=[];const ctx=new Proxy({drawImage(...a){calls.push(a);if(a.length===9){assert(Math.abs(a[7]/a[8]-a[3]/a[4])<1e-9);assert(a[1]>=0&&a[2]>=0&&a[1]+a[3]<=a[0].width&&a[2]+a[4]<=a[0].height);}},createRadialGradient(){return{addColorStop(){}};},createLinearGradient(){return{addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:()=>{}});
  for(const key of Object.keys(FOUNDRY_SPRITES))sprite(ctx,key,0,0,56);
  const gs=fixture();for(const t of [1,2.1,2.8,3.1,4]){stepFoundry(gs,t);drawFoundryBackground(ctx,480,0,gs);drawFoundryWorld(ctx,480,0,gs,{drawBoy(){},drawGirl(){}});}
  const used=new Set(calls.map(c=>c[0].path));for(const n of fs.readdirSync('assets/images').filter(n=>n.startsWith('l3')))assert(used.has('assets/images/'+n));
  const spriteCalls=calls.filter(c=>c.length===9);assert(spriteCalls.length>0);
});


test('complete route is playable with the real player physics, warnings and both checkpoints',()=>{
  loadLevel(2);const gs=gameState;gs.p=spawnPlayer();gs.lives=10;gs.deaths=0;gs.state='playing';let won=false,index=0;
  const route=[{x:340,y:208},{id:1},{id:2},{id:3},{id:4},{x:896,y:208},{x:1024,y:208},{id:8},{id:9},{id:10},{id:11},{id:12},{id:13},{id:14},{id:15},{x:2080,y:176},{x:2230,y:176},{id:17},{id:18},{id:19},{id:20},{id:21},{id:22},{x:3008,y:208}];
  for(let frame=0;frame<14000&&!won;frame++) {
    const f=gs.foundry,p=gs.p,w=route[index],s=w.id!==undefined?f.surfaces[w.id]:null;
    const tx=s?s.x+s.w/2-6:w.x;let ty=s?s.y:w.y;
    const ramp=f.ramps.find(r=>tx+6>=r.x&&tx+6<=r.x+r.w);
    if(ramp)ty=Math.min(ty,ramp.y+ramp.h-ramp.h*(tx+6-ramp.x)/ramp.w);
    keys.right=p.x<tx-3;keys.left=p.x>tx+3;
    if(Math.abs(p.x-tx)<12&&p.onGround&&Math.abs(p.y+p.h-ty)<8){index++;if(index>=route.length)break;}
    const press=f.hazards.find(h=>h.type==='press'&&h.x>p.x&&h.x-p.x<65&&h.x<tx);
    const laser=f.hazards.find(h=>h.type==='laser'&&h.x>p.x&&h.x-p.x<120&&h.x<tx);
    const lt=laser?(f.time+laser.offset)%laser.period:0;
    const waiting=(press&&((f.time+press.offset)%press.period>1.3))||(laser&&lt>1.2&&lt<3.35);
    if(waiting){keys.left=keys.right=keys.jump=false;}
    else if((p.onGround&&Math.abs(p.x-tx)>18)||(!p.onGround&&p.vy>=0&&p.y+p.h>ty+10)){p.jumpBuf=8;keys.jump=true;}
    else if(p.vy>=0)keys.jump=false;
    gs.anim++;stepFoundry(gs,1/60);updatePlayer({getVH:()=>270});
    if(foundryDamage(gs)==='death'){die({});index=gs.checkpoint>=2?17:gs.checkpoint>=1?7:0;if(gs.state==='over')break;}
    else if(foundryInteractions(gs))won=true;
  }
  keys.left=keys.right=keys.jump=false;
  assert(won,'The route must reach the freight exit using the real physics');assert.equal(gs.checkpoint,2);assert(gs.lives>0);
  console.log('Foundry route: '+gs.deaths+' deaths; both checkpoints; freight exit reached.');
});
