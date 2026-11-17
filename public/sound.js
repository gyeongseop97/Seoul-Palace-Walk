import {PLAZA_SHOW_BEAT_MS,PLAZA_SHOW_BEATS,PLAZA_SHOW_DURATION_MS,PLAZA_SHOW_HEARING_METRES,plazaShowNotes} from "./plaza-show.js";

// A small synthesized soundscape: footsteps, birdsong, crickets, a cat's meow, the
// transit chimes, passing buses and the guard drum. Everything is generated with Web Audio, so there are no
// audio files to load. Sound starts on the first tap or key press, as browsers require.
export function makeSound(){
  let context=null,master=null,noise=null,engine=null,engineStop=null,show=null,rainfall=null,rainStop=null,brook=null,brookStop=null;
  let enabled=localStorage.getItem("jeongdong-sound")!=="off";
  const fraction=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
  function ready(){
    if(!enabled)return null;
    if(!context){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return null;
      try{context=new Audio();}catch{return null;}
      master=context.createGain();master.gain.value=.55;master.connect(context.destination);
      const length=Math.floor(context.sampleRate*.5);
      noise=context.createBuffer(1,length,context.sampleRate);
      const data=noise.getChannelData(0);
      for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
    }
    if(context.state==="suspended"||context.state==="interrupted")context.resume().catch(()=>{});
    return context;
  }
  const playing=()=>enabled&&context?.state==="running"?context:null;

  function startEngine(ctx){
    const motor=ctx.createOscillator(),rattle=ctx.createOscillator(),tires=ctx.createBufferSource();
    const rattleLevel=ctx.createGain(),tireLevel=ctx.createGain(),tireBand=ctx.createBiquadFilter();
    const muffler=ctx.createBiquadFilter(),volume=ctx.createGain();
    motor.type=rattle.type="triangle";
    motor.frequency.value=43;rattle.frequency.value=89;rattleLevel.gain.value=.13;
    tires.buffer=noise;tires.loop=true;
    tireBand.type="bandpass";tireBand.frequency.value=135;tireBand.Q.value=.78;tireLevel.gain.value=.10;
    muffler.type="lowpass";muffler.frequency.value=260;muffler.Q.value=.56;volume.gain.value=0;
    motor.connect(muffler);rattle.connect(rattleLevel);rattleLevel.connect(muffler);
    tires.connect(tireBand);tireBand.connect(tireLevel);tireLevel.connect(muffler);
    muffler.connect(volume);volume.connect(master);
    const sources=[motor,rattle,tires];
    for(const source of sources)source.start();
    engine={motor,rattle,tireLevel,tireBand,muffler,volume,sources,
      nodes:[...sources,rattleLevel,tireLevel,tireBand,muffler,volume],at:-Infinity};
  }
  function stopEngine(){
    clearTimeout(engineStop);engineStop=null;
    if(!engine)return;
    for(const source of engine.sources)source.stop();
    for(const node of engine.nodes)node.disconnect();
    engine=null;
  }
  function fadeEngine(){
    if(!engine||engineStop!==null)return;
    engine.volume.gain.setTargetAtTime(0,context.currentTime,.065);
    engineStop=setTimeout(stopEngine,320);
  }
  function bus(source){
    const ctx=playing(),inside=Boolean(source?.inside),distance=source?.distance;
    const proximity=inside?1:fraction(1-distance/62)**1.75;
    if(!source||!ctx||proximity<.004){fadeEngine();return;}
    if(!engine)startEngine(ctx);
    if(engineStop!==null){clearTimeout(engineStop);engineStop=null;engine.at=-Infinity;}
    const now=ctx.currentTime;
    if(now-engine.at<.05)return;
    engine.at=now;
    const speed=source.moving?fraction((source.speed??8)/13):0;
    const motorPitch=43+speed*43;
    engine.motor.frequency.setTargetAtTime(motorPitch,now,.12);
    engine.rattle.frequency.setTargetAtTime(motorPitch*2.07,now,.12);
    engine.tireBand.frequency.setTargetAtTime(135+speed*450,now,.18);
    engine.tireLevel.gain.setTargetAtTime(.075+speed*.24,now,.16);
    engine.muffler.frequency.setTargetAtTime(inside?155+speed*115:265+speed*350,now,.19);
    engine.volume.gain.setTargetAtTime(proximity*(inside?.085:.115)*(.68+speed*.32),now,.11);
  }
  function stopRain(){
    clearTimeout(rainStop);rainStop=null;
    if(!rainfall)return;
    const {source,filter,volume}=rainfall;
    source.stop();source.disconnect();filter.disconnect();volume.disconnect();rainfall=null;
  }
  function rain(strength,covered=false){
    const ctx=playing(),amount=fraction(strength);
    if(!ctx||amount<.02){
      if(rainfall&&rainStop===null){
        rainfall.volume.gain.setTargetAtTime(0,context.currentTime,.09);
        rainStop=setTimeout(stopRain,440);
      }
      return;
    }
    if(!rainfall){
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),volume=ctx.createGain();
      source.buffer=noise;source.loop=true;filter.type="lowpass";filter.Q.value=.32;
      volume.gain.value=0;source.connect(filter);filter.connect(volume);volume.connect(master);source.start();
      rainfall={source,filter,volume};
    }
    clearTimeout(rainStop);rainStop=null;
    rainfall.filter.frequency.setTargetAtTime(covered?760:3600,ctx.currentTime,.18);
    rainfall.volume.gain.setTargetAtTime(amount*(covered?.036:.095),ctx.currentTime,.15);
  }
  function stopStream(){
    clearTimeout(brookStop);brookStop=null;
    if(!brook)return;
    const {source,parts}=brook;
    source.stop();source.disconnect();
    for(const part of parts)part.disconnect();
    brook=null;
  }
  // Running water: a bright babble beside the stream and a deeper rush by the waterfall.
  function stream(nearness,falls=0){
    const ctx=playing(),flow=fraction(nearness),rush=fraction(falls);
    if(!ctx||flow<.02&&rush<.02){
      if(brook&&brookStop===null){
        brook.babble.gain.setTargetAtTime(0,context.currentTime,.12);
        brook.roar.gain.setTargetAtTime(0,context.currentTime,.12);
        brookStop=setTimeout(stopStream,600);
      }
      return;
    }
    if(!brook){
      const source=ctx.createBufferSource(),bright=ctx.createBiquadFilter(),babble=ctx.createGain();
      const deep=ctx.createBiquadFilter(),roar=ctx.createGain(),ripple=ctx.createOscillator(),depth=ctx.createGain();
      source.buffer=noise;source.loop=true;source.playbackRate.value=.83;
      bright.type="bandpass";bright.frequency.value=1750;bright.Q.value=.55;
      deep.type="lowpass";deep.frequency.value=620;deep.Q.value=.4;
      babble.gain.value=0;roar.gain.value=0;
      // A slow wobble keeps the babble from sounding like steady hiss.
      ripple.frequency.value=.37;depth.gain.value=420;ripple.connect(depth);depth.connect(bright.frequency);
      source.connect(bright);bright.connect(babble);babble.connect(master);
      source.connect(deep);deep.connect(roar);roar.connect(master);
      source.start();ripple.start();
      brook={source,babble,roar,parts:[bright,babble,deep,roar,ripple,depth]};
    }
    clearTimeout(brookStop);brookStop=null;
    brook.babble.gain.setTargetAtTime(flow**1.4*.05+rush*.05,ctx.currentTime,.25);
    brook.roar.gain.setTargetAtTime(rush**1.3*.17+flow*.012,ctx.currentTime,.25);
  }
  // A short burst of filtered noise: the body of a footstep, a splash or a drum.
  function burst({type="lowpass",frequency=900,q=1,gain=.2,attack=.004,decay=.09,rate=1}){
    const ctx=playing();
    if(!ctx)return;
    const start=ctx.currentTime,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
    source.buffer=noise;source.playbackRate.value=rate;
    filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;
    amp.gain.setValueAtTime(.0001,start);amp.gain.linearRampToValueAtTime(gain,start+attack);
    amp.gain.exponentialRampToValueAtTime(.0001,start+attack+decay);
    source.connect(filter);filter.connect(amp);amp.connect(master);
    source.start(start);source.stop(start+attack+decay+.05);
  }
  function tone(from,to,{gain=.12,attack=.01,decay=.25,type="sine",delay=0}={}){
    const ctx=playing();
    if(!ctx)return;
    const start=ctx.currentTime+delay,voice=ctx.createOscillator(),amp=ctx.createGain();
    voice.type=type;voice.frequency.setValueAtTime(from,start);voice.frequency.exponentialRampToValueAtTime(to,start+attack+decay);
    amp.gain.setValueAtTime(.0001,start);amp.gain.linearRampToValueAtTime(gain,start+attack);
    amp.gain.exponentialRampToValueAtTime(.0001,start+attack+decay);
    voice.connect(amp);amp.connect(master);
    voice.start(start);voice.stop(start+attack+decay+.05);
  }

  function stopShow(){
    if(!show)return;
    const {output,voices}=show;
    show=null;output.disconnect();
    for(const voice of voices)voice.stop();
  }
  function showTone(state,start,pitch,length,volume,type,attack){
    const voice=context.createOscillator(),amp=context.createGain(),end=start+length;
    voice.type=type;voice.frequency.value=pitch;
    amp.gain.setValueAtTime(.0001,start);
    amp.gain.linearRampToValueAtTime(volume,start+attack);
    amp.gain.exponentialRampToValueAtTime(.0001,end);
    voice.connect(amp);amp.connect(state.output);
    state.voices.add(voice);
    voice.onended=()=>{state.voices.delete(voice);voice.disconnect();amp.disconnect();};
    voice.start(start);voice.stop(end+.014);
  }
  function plazaShow(state){
    const ctx=playing();
    if(!ctx||!state){stopShow();return;}
    const {startAt,clock,distance}=state,elapsed=clock-startAt;
    if(!Number.isFinite(elapsed)||!Number.isFinite(distance)||startAt<=0||elapsed>=PLAZA_SHOW_DURATION_MS||
      elapsed<-3_000||distance>=PLAZA_SHOW_HEARING_METRES){stopShow();return;}
    if(show?.startAt!==startAt){
      stopShow();
      const output=ctx.createGain();output.gain.value=0;output.connect(master);
      show={startAt,output,voices:new Set(),nextBeat:Math.max(0,Math.floor(elapsed/PLAZA_SHOW_BEAT_MS)),volumeAt:-Infinity};
    }
    const now=ctx.currentTime;
    if(now-show.volumeAt>=.045){
      const proximity=fraction(1-distance/PLAZA_SHOW_HEARING_METRES)**1.52;
      show.output.gain.setTargetAtTime(.79*proximity,now,.11);show.volumeAt=now;
    }
    // Schedule ahead in audio time from the current server-clock estimate. Joining
    // halfway through the show continues on the same beat as everyone already there.
    show.nextBeat=Math.max(show.nextBeat,Math.floor(elapsed/PLAZA_SHOW_BEAT_MS));
    while(show.nextBeat<PLAZA_SHOW_BEATS&&show.nextBeat*PLAZA_SHOW_BEAT_MS<elapsed+155){
      const beat=show.nextBeat++,beatOffset=beat*PLAZA_SHOW_BEAT_MS;
      for(const {voice,note,length,offset,gain} of plazaShowNotes(beat)){
        const delay=(beatOffset-elapsed)/1_000+offset;
        if(delay<-.075)continue;
        const at=now+Math.max(.008,delay),pitch=440*2**((note-69)/12);
        const limited=Math.min(length,Math.max(.03,(PLAZA_SHOW_DURATION_MS-beatOffset)/1_000-offset));
        showTone(show,at,pitch,limited,gain,voice==="bass"?"triangle":"sine",voice==="pad"?.16:.018);
        if(voice==="bell")showTone(show,at,pitch*2.011,limited*.50,gain*.26,"sine",.012);
      }
    }
  }
  return {
    get enabled(){return enabled;},
    wake:ready,
    toggle(){
      enabled=!enabled;localStorage.setItem("jeongdong-sound",enabled?"on":"off");
      if(enabled)ready();
      else{stopEngine();stopShow();stopRain();stopStream();context?.suspend().catch(()=>{});}
      return enabled;
    },
    bus,plazaShow,rain,stream,
    // A foot flicking the surface of the stream.
    splash(){
      burst({type:"bandpass",frequency:1500+Math.random()*500,q:.8,gain:.085,attack:.006,decay:.15,rate:.9});
      burst({type:"lowpass",frequency:420,gain:.05,decay:.11,rate:.5});
    },
    busking(note,proximity){
      const gain=.072*fraction(proximity)**1.8;
      if(note==null||gain<.001)return;
      const pitch=440*2**((note-69)/12);
      tone(pitch,pitch,{gain,attack:.008,decay:.43,type:"triangle"});
      tone(pitch*2,pitch*2,{gain:gain*.21,attack:.005,decay:.16});
      if(note===67||note===64)tone(pitch/2,pitch/2,{gain:gain*.42,attack:.013,decay:.48,type:"triangle"});
    },
    clink(){
      tone(1530,1516,{gain:.043,attack:.004,decay:.16});
      tone(2294,2284,{gain:.019,attack:.005,decay:.095,delay:.003});
      tone(3181,3164,{gain:.009,attack:.005,decay:.058,delay:.004});
    },
    diningBell(){
      tone(2060,2052,{gain:.065,attack:.004,decay:.24});
      tone(3090,3080,{gain:.022,attack:.003,decay:.15});
    },
    arcadeBeat(lane,strong){
      const pitch=[262,330,392,440][lane];
      tone(pitch,pitch,{gain:.075,attack:.006,decay:.21,type:"triangle"});
      tone(strong?139:95,53,{gain:strong?.16:.085,attack:.003,decay:.20});
    },
    basketImpact(kind,strength){
      const gain=fraction(strength);
      if(kind==="score"){
        burst({type:"bandpass",frequency:1320,q:.8,gain:.078,decay:.15});
        tone(523,530,{gain:.035,attack:.008,decay:.16});
      }else if(kind==="rim"){
        tone(610,598,{gain:.075*gain,attack:.003,decay:.17,type:"triangle"});
        tone(967,952,{gain:.020*gain,attack:.002,decay:.10});
      }else{
        const board=kind==="backboard";
        tone(board?196:103,board?129:59,{gain:.17*gain,attack:.003,decay:board?.115:.083});
        burst({type:"bandpass",frequency:board?710:420,q:.72,gain:.10*gain,decay:.066});
      }
    },
    step(surface){
      if(surface==="wood")burst({frequency:380,gain:.17,decay:.07});
      else burst({type:"bandpass",frequency:1500,q:.9,gain:.075,decay:.05});
    },
    chirp(relativeGain=1){
      const gain=.03*fraction(relativeGain);
      if(!gain)return;
      const base=2400+Math.random()*1400,notes=2+Math.floor(Math.random()*3);
      for(let i=0;i<notes;i++)tone(base,base*(1.2+Math.random()*.3),{gain,attack:.008,decay:.07,delay:i*.11});
    },
    cricket(){for(let i=0;i<4;i++)tone(4300,4250,{gain:.016,attack:.004,decay:.03,delay:i*.055,type:"triangle"});},
    meow(relativeGain=1){
      const gain=.07*fraction(relativeGain);
      if(!gain)return;
      tone(620,880,{gain,attack:.05,decay:.12,type:"triangle"});
      tone(880,520,{gain,attack:.02,decay:.32,type:"triangle",delay:.16});
    },
    chime(mode){
      const notes=mode==="bus"?[784,988]:[659,523,659,784];
      notes.forEach((pitch,i)=>tone(pitch,pitch,{gain:.1,decay:.5,delay:i*.26}));
    },
    drum(){burst({frequency:150,gain:.5,decay:.36,rate:.35});}
  };
}
