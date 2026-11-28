// Continuous ride machinery and one-shot cues follow the same clock as the seats.
const clamp=x=>Math.max(0,Math.min(1,x));
const modes={
  wheel:[48,290,.009],viking:[56,490,.024],bumper:[83,650,.022],coaster:[56,940,.042],
  krake:[66,760,.037],cups:[88,390,.012],splash:[51,1050,.05],carousel:[74,270,.009],phaethon:[71,1150,.049]
};
const organ={
  carousel:[72,76,79,83,81,79,76,74,71,74,77,81,79,77,74,71],
  cups:[79,0,76,81,84,0,83,79,77,81,0,79,76,74,0,77]
};
export function ridePhase(id,t){
  if(t<0)return "안전바 확인";
  switch(id){
    case "coaster":return t<12?"체인 리프트":t<14.6?"정상 대기":t<18?"수직 낙하":t<35?"고속 주행":"브레이크 구간";
    case "splash":return t<10?"수로 출항":t<30?"리프트 상승":t<34?"정상 선회":t<36.6?"급강하":t<40?"착수":"선착장 복귀";
    case "phaethon":return t<5.6?"역사 출발":t<14.05?"리프트 상승":t<18.1?"첫 급강하":t<40?"역전 구간":t<41.1?"저공 선회":"브레이크 구간";
    case "krake":return t<12?"스윙 가속":t<35?"대회전":"감속 운행";
    case "viking":return t<8?"스윙 가속":t<28?"최고점 왕복":"감속 운행";
    case "wheel":return t<18?"보문호 쪽 상승":t<45?"공원 전경":"광장 쪽 하강";
    case "bumper":return "자유 운전";
    case "cups":return "손잡이로 컵 회전";
    default:return "회전목마 운행";
  }
}
export function makeRideAudio(output){
  let active;
  function stop(){
    if(!active)return;
    const {ctx,mix,motor,wind,filter,panner,machinery,air}=active;
    const end=ctx.currentTime+.14;
    mix.gain.setTargetAtTime(.00001,ctx.currentTime,.023);
    motor.stop(end);wind.stop(end);
    motor.onended=()=>[motor,wind,filter,machinery,air,mix,panner].forEach(n=>n.disconnect());
    active=null;
  }
  function start(out,id){
    const {ctx,master,noise}=out;
    const mix=ctx.createGain(),motor=ctx.createOscillator(),wind=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
    const machinery=ctx.createGain(),air=ctx.createGain(),panner=ctx.createStereoPanner?.()??ctx.createGain();
    motor.type="triangle";wind.buffer=noise;wind.loop=true;
    filter.type="bandpass";filter.Q.value=.68;
    mix.gain.value=.0001;machinery.gain.value=air.gain.value=0;
    motor.connect(machinery).connect(mix);wind.connect(filter).connect(air).connect(mix);
    mix.connect(panner).connect(master);motor.start();wind.start();
    return {id,ctx,mix,motor,wind,filter,machinery,air,panner,beat:null,phase:null,hit:0,last:-Infinity,stamp:0};
  }
  function note(voice,hz,endHz,gain,decay,wave="sine",delay=0){
    const {ctx,mix}=voice,t=ctx.currentTime+delay,osc=ctx.createOscillator(),env=ctx.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(hz,t);osc.frequency.exponentialRampToValueAtTime(endHz,t+decay);
    env.gain.setValueAtTime(.00001,t);env.gain.exponentialRampToValueAtTime(gain,t+.006);
    env.gain.exponentialRampToValueAtTime(.00001,t+decay+.008);
    osc.connect(env).connect(mix);osc.start(t);osc.stop(t+decay+.02);
    osc.onended=()=>{osc.disconnect();env.disconnect();};
  }
  function update(packet){
    const out=packet&&output();
    if(!out){stop();return;}
    const {id,t,gain,pan,speed=0,bumpAt=0,bumpForce=0}=packet;
    if(!active||active.id!==id){stop();active=start(out,id);}
    const a=active,ctx=a.ctx;
    if(ctx.currentTime-a.last<.043&&t>=a.stamp)return;
    a.last=ctx.currentTime;
    const phase=ridePhase(id,t),[rpm,cutoff,rumble]=modes[id];
    const swing=id==="viking"||id==="krake",rail=id==="coaster"||id==="phaethon",wet=id==="splash";
    const lift=phase.includes("리프트"),brake=phase.includes("브레이크")||phase.includes("역사");
    const moving=t<0?.015:swing?.15+.85*Math.abs(Math.cos(t*(id==="viking"?1.02:.64)))*clamp(t/7):
      rail?lift?.23:brake?.3:phase==="정상 대기"?.04:.89+.1*Math.sin(t):
      wet?t>=36.4&&t<39.5?1.7:lift?.34:t>=34&&t<36.4?1:.17:id==="bumper"?.18+.82*clamp(speed/6):.48;
    const set=(param,value,time=.07)=>param.setTargetAtTime(value,ctx.currentTime,time);
    set(a.mix.gain,gain);if(a.panner.pan)set(a.panner.pan,pan);
    set(a.motor.frequency,rpm*(.55+moving*1.25));set(a.machinery.gain,.008+moving*rumble);
    set(a.filter.frequency,cutoff*(.6+moving*2.4));set(a.air.gain,(wet?.16:rail?.13:.048)*moving);
    const beat=Math.floor(Math.max(0,t)/(lift?.21:rail?.30:organ[id]?id==="cups"?.31:.41:swing?1.53:1.35));
    if(a.phase!==phase){
      if((a.phase==="안전바 확인"||a.phase===null&&t<0)&&packet.onboard){
        note(a,740,737,.10,.32);note(a,990,982,.065,.44,"sine",.18);
      }
      if(wet&&phase==="착수")note(a,115,38,.19,.65,"triangle");
      if(brake&&a.phase)note(a,1200,360,.028,.6,"triangle");
      a.phase=phase;
    }
    if(t>=0&&a.beat!==beat){
      if(organ[id]){
        const midi=organ[id][beat%16],hz=440*2**((midi-69)/12);
        if(midi){note(a,hz,hz,.062,.26,"triangle");note(a,hz*2,hz*2,.017,.2);}
        if(beat%4===0)note(a,id==="cups"?196:130.81,id==="cups"?196:130.81,.033,.37,"triangle");
      }else if(lift||rail&&!brake&&moving>.3){
        note(a,lift?830:270,lift?320:90,lift?.078:.046,lift?.065:.13,"triangle");
        if(lift)note(a,1430,650,.024,.044,"triangle",.045);
      }else if(swing){note(a,190+moving*50,156,.047,.31,"triangle");}
      else if(id==="wheel")note(a,348,270,.022,.1,"triangle");
    }
    if(bumpAt&&bumpAt>a.hit&&packet.clock-bumpAt<400){
      note(a,132,43,.07+Math.min(.19,bumpForce*.027),.19,"triangle");
      note(a,640,210,.045,.084,"triangle");
    }
    a.hit=Math.max(a.hit,bumpAt);a.beat=beat;a.stamp=t;
  }
  return update;
}
