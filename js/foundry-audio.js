import { getAudioContext } from './audio.js';

// Native Web Audio keeps this project dependency-free; there are no audio files.
// Noise buffers are prepared once, and reused for hiss, impacts and factory loops.
export class SoundManager {
  constructor(){this.context=null;this.noise=null;this.master=null;this.loops=[];this.active=false;this.sfxVolume=.75;this.ambienceVolume=.3;}
  prepare(){
    const ac=getAudioContext();if(!ac)return false;
    if(this.context===ac)return true;
    this.context=ac;this.master=ac.createGain();this.master.gain.value=0;this.master.connect(ac.destination);
    this.noise=ac.createBuffer(1,Math.floor(ac.sampleRate*2),ac.sampleRate);
    const data=this.noise.getChannelData(0);let brown=0;
    for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.035)/1.02;data[i]=brown*4;}
    return true;
  }
  loop(kind,freq,volume){
    const ac=this.context,g=ac.createGain();g.gain.value=volume;
    let src;
    if(kind==='noise') {src=ac.createBufferSource();src.buffer=this.noise;src.loop=true;const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=freq;src.connect(filter);filter.connect(g);}
    else {src=ac.createOscillator();src.type='sawtooth';src.frequency.value=freq;src.connect(g);}
    g.connect(this.master);src.onended=()=>{g.disconnect();src.disconnect();};src.start();this.loops.push({src,g,kind});
  }
  setActive(active){
    if(!active&&!this.context)return;
    if(active&&!this.prepare())return;
    if(active===this.active)return;
    this.active=active;const ac=this.context,t=ac.currentTime;
    this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(active?this.ambienceVolume:0,t,.18);
    if(active&&this.loops.length===0){this.loop('noise',190,.14);this.loop('rumble',47,.025);this.loop('saw',112,.006);this.loop('noise',1200,.018);}
    if(!active){for(const {src} of this.loops)src.stop(t+.6);this.loops=[];}
  }
  cue(type,x,playerX=0){
    if(!this.prepare())return;
    const ac=this.context,t=ac.currentTime,distance=Math.abs(x-playerX);
    if(distance>600)return;
    const variation=.95+Math.random()*.1;
    const gain=ac.createGain(),pan=ac.createStereoPanner();pan.pan.value=Math.max(-.8,Math.min(.8,(x-playerX)/320));
    const warning=type.includes('warning')?.45:1;
    const volume=warning*this.sfxVolume*.13*Math.max(.03,1-distance/600)*(.9+Math.random()*.2);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.018);
    const hiss=/steam|fire/.test(type),impact=/slam|hold|collapse|fall|landing|death/.test(type);
    const duration=hiss?.45:impact?.2:.15;
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);gain.connect(pan);pan.connect(ac.destination);
    let src;
    if(hiss||impact){src=ac.createBufferSource();src.buffer=this.noise;src.playbackRate.value=variation;
      const filter=ac.createBiquadFilter();filter.type=hiss?'highpass':'lowpass';filter.frequency.value=hiss?900:250;src.connect(filter);filter.connect(gain);
    } else {src=ac.createOscillator();src.type='triangle';src.frequency.setValueAtTime((type==='checkpoint'||type==='pickup'?650:220)*variation,t);src.frequency.exponentialRampToValueAtTime(type==='checkpoint'||type==='pickup'?1050:100,t+duration);src.connect(gain);}
    src.onended=()=>{gain.disconnect();pan.disconnect();src.disconnect();};src.start(t);src.stop(t+duration+.03);
  }
  update(gs){
    this.setActive(gs.currentLevel===2&&gs.state==='playing');
    if(!this.active||!gs.foundry||!gs.p)return;
    const f=gs.foundry,p=gs.p;
    const nearest=Math.min(...f.saws.map(s=>Math.abs(s.x-p.x)));
    const saw=this.loops.find(l=>l.kind==='saw');
    if(saw)saw.g.gain.setTargetAtTime(.004+.045*Math.max(0,1-nearest/240),this.context.currentTime,.12);
    for(const e of f.events)if(!/-safe$|-open$|-opening$|-cooldown$/.test(e.type))this.cue(e.type,e.x,p.x);
  }
}
export const foundrySound=new SoundManager();
