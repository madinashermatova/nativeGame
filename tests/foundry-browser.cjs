const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require(path.join(process.env.TEMP,'foundry-verify','node_modules','playwright'));
(async()=>{
 const root=path.resolve(__dirname,'..');const server=http.createServer((req,res)=>{
   const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
   if(!fs.existsSync(target)){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.png')?'image/png':target.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(target));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
   const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.click('#start');
   await page.evaluate(async()=>{
     const [{loadLevel},{gameState:gs},{spawnPlayer},{initAudio},{stepFoundry}]=await Promise.all([import('./js/level.js'),import('./js/state.js'),import('./js/player.js'),import('./js/audio.js'),import('./js/foundry.js')]);
     loadLevel(2);gs.p=spawnPlayer();gs.state='menu';gs.anim=120;initAudio();stepFoundry(gs,2.1);document.getElementById('menu').style.display='none';
     await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
     await Promise.all(Object.values((await import('./js/assets.js')).IMG).filter(i=>i.src.includes('l3')).map(i=>i.decode()));
   });
   fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
   for(const [name,x] of [['entry',0],['press',820],['ascent',1120],['machine',1750],['escape',2400]]){
     await page.evaluate(async x=>{const {gameState:gs}=await import('./js/state.js');gs.camX=x;gs.p.x=x+70;gs.p.y=x===1120?146:194;gs.foundry.section=Math.min(5,[0,384,832,1072,1552,2256].filter(v=>x+70>=v).length-1);},x);
     await page.waitForTimeout(100);await page.screenshot({path:path.join(root,'artifacts','foundry-'+name+'.png')});
   }
   // Runtime smoke test includes the actual game loop, Web Audio and camera.
   await page.evaluate(async()=>{const {gameState:gs}=await import('./js/state.js');gs.camX=0;gs.p.x=48;gs.p.y=194;gs.state='playing';});
   await page.keyboard.down('KeyD');await page.waitForTimeout(1200);await page.keyboard.up('KeyD');
   const state=await page.evaluate(async()=>{const {gameState:gs}=await import('./js/state.js');return {x:gs.p.x,particles:gs.foundry.particles.length,checkpoint:gs.checkpoint,state:gs.state};});
   const timing=await page.evaluate(async()=>{const frames=[];let last=performance.now();await new Promise(resolve=>{function tick(now){frames.push(now-last);last=now;if(frames.length<60)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});frames.sort((a,b)=>a-b);return {medianFrameMs:frames[30]};});
   const audio=await page.evaluate(async()=>{const {getAudioContext}=await import('./js/audio.js');return getAudioContext()?.state;});
   await page.evaluate(async()=>{const {gameState:gs}=await import('./js/state.js');gs.p.x=gs.foundry.exit.x+14;gs.p.y=176;gs.p.vx=gs.p.vy=0;});
   await page.waitForTimeout(80);
   const completion=await page.evaluate(async()=>{const {gameState:gs}=await import('./js/state.js');return gs.state;});
   if(completion!=='levelComplete')throw Error('Exit did not show Level Complete');
   await page.screenshot({path:path.join(root,'artifacts','foundry-complete.png')});
   await page.waitForTimeout(1850);
   const next=await page.evaluate(async()=>{const {gameState:gs}=await import('./js/state.js');return {level:gs.currentLevel+1,state:gs.state,foundry:gs.foundry};});
   if(next.level!==4||next.state!=='playing'||next.foundry!==null)throw Error('Next-level handoff failed');
   if(errors.length)throw Error(errors.join('\n'));if(state.particles>220)throw Error('Particle budget exceeded');
   console.log(JSON.stringify({runtime:state,audio,timing,completion,nextLevel:next.level,browserErrors:errors,screenshots:6}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
