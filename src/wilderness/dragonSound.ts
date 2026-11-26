export function dragonSound(){
  let context:AudioContext|undefined, grit:AudioBuffer|undefined;

  return {
    unlock(){
      if(typeof AudioContext==='undefined') return;
      try{
        context??=new AudioContext();
        if(context.state==='suspended') void context.resume().catch(()=>{});
      }catch{
        context=undefined;
      }
    },
    cue(kind:'step'|'roar'|'impact',strength:number){
      if(!context||context.state!=='running'||strength<=0) return;
      const start=context.currentTime, roar=kind==='roar', duration=roar?1.12:kind==='impact'?.49:.25;
      const output=context.createGain();
      output.gain.setValueAtTime(.0001,start);
      output.gain.exponentialRampToValueAtTime((roar?.092:.059)*strength,start+(roar?.15:.012));
      output.gain.exponentialRampToValueAtTime(.0001,start+duration);
      output.connect(context.destination);
      const tone=context.createOscillator();
      tone.type=roar?'sawtooth':'sine';
      tone.frequency.setValueAtTime(roar?65:91,start);
      tone.frequency.exponentialRampToValueAtTime(roar?43:33,start+duration);
      const filter=context.createBiquadFilter();
      filter.type='lowpass';filter.frequency.setValueAtTime(roar?320:210,start);
      filter.frequency.exponentialRampToValueAtTime(roar?108:80,start+duration);
      tone.connect(filter);filter.connect(output);
      if(!grit){
        grit=context.createBuffer(1,Math.ceil(context.sampleRate*1.2),context.sampleRate);
        const samples=grit.getChannelData(0);
        let slow=0;
        for(let i=0;i<samples.length;i++){
          slow=(slow+(Math.random()*2-1)*.038)/1.037;
          samples[i]=slow*3.5;
        }
      }
      const noise=context.createBufferSource();
      noise.buffer=grit;noise.connect(filter);noise.start(start,0,duration);
      tone.start(start);tone.stop(start+duration);
      tone.onended=()=>{output.disconnect();filter.disconnect();};
    },
    dispose(){if(context) void context.close().catch(()=>{});},
  };
}
