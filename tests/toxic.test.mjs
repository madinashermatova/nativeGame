import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createToxic,createToxicLayout,stepToxic,toxicDamage,hurtToxic,resolveToxicGround,toxicInteractions,resetToxic,emitToxic,sprayPhase,dripWarning,circleTouchesPlayer} from '../js/toxic.js';
import {loadLevel,levels} from '../js/level.js';
import {gameState as gs} from '../js/state.js';
import {spawnPlayer,updatePlayer,die} from '../js/player.js';
import {keys} from '../js/input.js';
const fixture=()=>({toxic:createToxic(),camX:0,p:{x:48,y:194,w:12,h:14,vx:0,vy:0,onGround:false,inv:0},checkpoint:0,lives:10,coinCount:0});
test('menu and dedicated Level 3 modules retain their original bytes',()=>{for(const [file,hash] of Object.entries(JSON.parse(fs.readFileSync('tests/toxic-scope.json'))))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);});
test('6400px world and runtime isolate Level 4',()=>{const old=JSON.stringify(levels.slice(0,3));assert.equal(createToxicLayout().length,17);assert.equal(createToxicLayout()[0].length,400);loadLevel(3);assert(gs.toxic);for(let i=0;i<3;i++){loadLevel(i);assert.equal(gs.toxic,null);}assert.equal(JSON.stringify(levels.slice(0,3)),old);});
test('toxic pool ignores respawn immunity',()=>{const g=fixture();Object.assign(g.p,{x:490,y:240,inv:60});assert.equal(toxicDamage(g,.01),'death');});
test('drips announce predictable timings and use small circle collisions',()=>{const g=fixture(),h=g.toxic.drips[0];assert(dripWarning(h,1));assert(!dripWarning(h,.5));stepToxic(g,1.21);assert(g.toxic.drops.some(d=>d.x===h.x));assert(circleTouchesPlayer({x:50,y:196,r:2},g.p));assert(!circleTouchesPlayer({x:70,y:196,r:2},g.p));});
test('spray warns before active collision',()=>{const g=fixture(),h=g.toxic.sprays[0];Object.assign(g.p,{x:h.x+8,y:h.y});h.mode=sprayPhase(h,2.2);assert.equal(h.mode,'warning');assert.equal(toxicDamage(g,.01),null);h.mode=sprayPhase(h,3);assert.equal(toxicDamage(g,.01),'death');assert.equal(sprayPhase(h,4),'cooldown');});
test('gas allows escape and causes timed damage instead of instant death',()=>{const g=fixture();Object.assign(g.p,{x:2460,y:180});g.toxic.gas.density=.85;assert.equal(toxicDamage(g,.9),null);assert(!g.toxic.gas.warning);assert.equal(toxicDamage(g,.2),null);assert(g.toxic.gas.warning);assert.equal(toxicDamage(g,1.4),'hurt');hurtToxic(g);assert.equal(g.lives,9);assert.equal(toxicDamage(g,.1),null);g.p.x=2200;toxicDamage(g,2);assert.equal(g.toxic.gas.exposure,0);});
test('fans clear gas with frame-independent decay',()=>{const a=fixture(),b=fixture();stepToxic(a,1);for(let i=0;i<60;i++)stepToxic(b,1/60);assert(Math.abs(a.toxic.gas.density-b.toxic.gas.density)<1e-10);assert(a.toxic.gas.density<.65);a.toxic.time=9;stepToxic(a,.1);assert(!a.toxic.fans[0].on&&!a.toxic.fans[1].on);});
test('moving platforms carry both horizontal and vertical velocity',()=>{for(const axis of ['ax','ay']){const g=fixture(),s=g.toxic.surfaces.find(s=>s.kind==='moving'&&s[axis]);Object.assign(g.p,{x:s.x+5,y:s.y-14,onGround:true,toxicGround:s.id});const x=g.p.x,y=g.p.y;stepToxic(g,1/60);assert.equal(g.p.x-x,s.dx);assert.equal(g.p.y-y,s.dy);}});
test('one-way collision and corrosion warning precede collapse and recovery',()=>{const g=fixture(),s=g.toxic.surfaces.find(s=>s.kind==='collapse');Object.assign(g.p,{x:s.x+5,y:s.y-12,vy:2});resolveToxicGround(g,g.p,s.y-2);assert.equal(g.p.y,s.y-14);stepToxic(g,.6);assert(!s.collapsed);stepToxic(g,.21);assert(s.collapsed);stepToxic(g,5);assert(!s.collapsed);Object.assign(g.p,{y:s.y+2,vy:-3,onGround:false});resolveToxicGround(g,g.p,s.y+16);assert(!g.p.onGround);});
test('checkpoints save spawn and chase resets with a grace period',()=>{const g=fixture(),c=g.toxic.checkpoints[2];Object.assign(g.p,{x:c.x,y:c.y});toxicInteractions(g);assert.equal(g.spawnX,c.x);g.p.x=5600;stepToxic(g,1);assert(g.toxic.chase.active);assert.equal(g.toxic.chase.toxicY,254);stepToxic(g,3);assert(g.toxic.chase.toxicY<254);resetToxic(g.toxic);assert(!g.toxic.chase.active);assert.equal(g.toxic.chase.toxicY,254);assert(c.active);});
test('particles have a hard budget',()=>{const g=fixture();emitToxic(g.toxic,'mist',50,50,1000);assert.equal(g.toxic.particles.length,240);});
test('full route wins using actual player physics, moving platforms and all checkpoints',()=>{
 loadLevel(3);gs.p=spawnPlayer();gs.state='playing';gs.lives=10;
 const route=[{x:448,y:208},...[2,3,4,5,6,7,8,9,10,11,12,13].map(id=>({id})),{x:2368,y:144},...[16,17,18,19,20,21,22,23,24,25].map(id=>({id})),{x:3900,y:192},...[27,28,29,30,31,32].map(id=>({id})),{x:5424,y:208},...[34,35,36,37,38,39].map(id=>({id})),{x:6340,y:144}];
 let index=0,deaths=0,won=false;
 const callbacks={getVH:()=>270,over:()=>{gs.state='over';}};
 for(let frame=0;frame<24000&&!won&&gs.state!=='over';frame++){
  const p=gs.p,target=route[Math.min(index,route.length-1)],s=target.id===undefined?null:gs.toxic.surfaces[target.id];
  const tx=s?s.x+s.w/2-6:target.x,ty=s?s.y:target.y;
  keys.right=p.x<tx-3;keys.left=p.x>tx+3;
  if(Math.abs(p.x-tx)<12&&p.onGround&&Math.abs(p.y+p.h-ty)<8)index++;
  const spray=gs.toxic.sprays.find(h=>h.x>p.x&&h.x<tx&&h.x-p.x<100),phase=spray?(gs.toxic.time+spray.offset)%spray.period:0;
  if(p.onGround&&spray&&phase>1.2&&phase<3.75){keys.right=keys.left=false;keys.jump=false;}
  else if((p.onGround&&Math.abs(p.x-tx)>18)||(!p.onGround&&p.vy>=0&&p.y+p.h>ty+10)){p.jumpBuf=8;keys.jump=true;}else if(p.vy>=0)keys.jump=false;
  gs.anim++;stepToxic(gs,1/60);updatePlayer(callbacks);const damage=toxicDamage(gs,1/60);
  if(damage==='hurt')hurtToxic(gs);
  if(damage==='death'){deaths++;die(callbacks);index=gs.checkpoint>=3?27:gs.checkpoint>=2?20:gs.checkpoint>=1?14:0;}else won=toxicInteractions(gs);
 }
 keys.right=keys.left=keys.jump=false;
 assert(won,'route must reach containment door');assert.equal(gs.checkpoint,3);assert(deaths<=2);assert(gs.lives>0);assert(gs.toxic.chase.active);
});

test('Level 4 is drawn entirely in code (no images)',async()=>{
  const {toxicSprite,TOXIC_SPRITES,drawToxicBackground,drawToxicWorld}=await import('../js/toxic-renderer.js');
  let images=0;const ctx=new Proxy({drawImage(){images++;},createRadialGradient(){return{addColorStop(){}};},createLinearGradient(){return{addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:()=>{}});
  for(const key of Object.keys(TOXIC_SPRITES))assert.equal(toxicSprite(ctx,key,0,0,56),56*TOXIC_SPRITES[key].ratio);
  const gs=fixture();for(const t of [1,2.1,2.8,3.1,4]){stepToxic(gs,t);drawToxicBackground(ctx,480,0,gs);drawToxicWorld(ctx,480,0,gs,{drawBoy(){},drawGirl(){}});}
  assert.equal(images,0);
});
