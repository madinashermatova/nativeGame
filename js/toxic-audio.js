import { SoundManager } from './foundry-audio.js';
import { clamp } from './utils.js';
// Level 4 reuses the prepared Web Audio architecture without altering Foundry.
export class ToxicSoundManager extends SoundManager{
  constructor(){super();this.ambienceVolume=.28;this.fanPan=null;}
  setActive(active){
    if(!active&&!this.context)return;if(active&&!this.prepare())return;if(this.active===active)return;
    this.active=active;const ac=this.context,t=ac.currentTime;
    this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(active?this.ambienceVolume:0,t,.2);
    if(active){
      this.loop('noise',380,.09);this.loop('drone',34,.017);this.loop('pump',63,.014);
      const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();
      source.buffer=this.noise;source.loop=true;filter.type='bandpass';filter.frequency.value=550;filter.Q.value=.7;
      gain.gain.value=.01;this.fanPan=ac.createStereoPanner();source.connect(filter);filter.connect(gain);gain.connect(this.fanPan);this.fanPan.connect(this.master);
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();this.loops.push({src:source,g:gain,kind:'vent'});
    }else{for(const {src} of this.loops)src.stop(t+.6);this.loops=[];}
  }
  cue(type,x,playerX=0){
    const mapped=type.replace('drip-warning','steam-warning').replace('spray-','steam-').replace('barrel-leak','steam-leak');
    super.cue(mapped,x,playerX);
  }
  update(gs){
    this.setActive(gs.currentLevel===3&&gs.state==='playing');if(!this.active||!gs.toxic||!gs.p)return;
    const f=gs.toxic,p=gs.p,ac=this.context;
    const nearest=f.fans.reduce((best,fan)=>Math.abs(fan.x-p.x)<Math.abs(best.x-p.x)?fan:best,f.fans[0]);
    const vent=this.loops.find(l=>l.kind==='vent');
    if(vent){vent.g.gain.setTargetAtTime((nearest.on?.07:.005)*Math.max(.02,1-Math.abs(nearest.x-p.x)/420),ac.currentTime,.12);this.fanPan.pan.setTargetAtTime(clamp((nearest.x-p.x)/320,-.8,.8),ac.currentTime,.15);}
    const pump=this.loops.find(l=>l.kind==='pump');if(pump)pump.g.gain.setTargetAtTime(.012+.003*Math.sin(f.time*1.8),ac.currentTime,.2);
    for(const e of f.events)if(!/-off$|-cooldown$|-safe$/.test(e.type))this.cue(e.type,e.x,p.x);
  }
}
export const toxicSound=new ToxicSoundManager();
