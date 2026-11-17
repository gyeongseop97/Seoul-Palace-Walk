export const BASEBALL_LANE_X=6.4;
export const BASEBALL_PLATE_Z=3.20;
export const BASEBALL_MOUND_Z=-4.26;
export const BASEBALL_SCREEN_Z=-5.38;
export const BASEBALL_PITCH_COUNT=6;
export const BASEBALL_SWING_LEAD_MS=82;
export const BASEBALL_HIT_WINDOW_MS=104;
export const BASEBALL_ZONE={left:-.47,right:.47,bottom:.70,top:1.61};
export const BASEBALL_CENTER={x:0,y:(BASEBALL_ZONE.bottom+BASEBALL_ZONE.top)/2};
export const BASEBALL_BATTER_OFFSET=.86;
export const BASEBALL_CONTACT_RADIUS=.23;
export const baseballBatterSide=hand=>hand==="left"?1:-1;
const ballRadius=.075,gravity=9.81;
const pointValues={miss:0,foul:0,single:1,double:2,home:4};
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function clampBaseballAim(x,y){
  return {x:clamp(x,BASEBALL_ZONE.left,BASEBALL_ZONE.right),y:clamp(y,BASEBALL_ZONE.bottom,BASEBALL_ZONE.top)};
}

export function baseballPitchPosition(pitch,now){
  const time=(now-pitch.at)/pitch.flight;
  const z=BASEBALL_MOUND_Z+(BASEBALL_PLATE_Z-BASEBALL_MOUND_Z)*time;
  const x=pitch.targetX==null?pitch.bend*(time*time-.16*time):
    pitch.targetX*time+pitch.bend*time*(1-time);
  const y=1.46*(1-time)+pitch.height*time+Math.sin(time*Math.PI)*.094;
  return {x,y,z};
}

function shuffledZones(random){
  const zones=[[-1,-1],[0,-1],[1,-1],[-1,1],[0,1],[1,1]];
  for(let i=zones.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [zones[i],zones[j]]=[zones[j],zones[i]];
  }
  return zones;
}

export function baseballFrame(state,now){
  const {pitch,hit}=state??{};
  if(!pitch||now<pitch.at)return {ball:null};
  if(hit&&now>=hit.at){
    const time=(now-hit.at)/1000;
    const x=hit.x+hit.vx*time,z=hit.z+hit.vz*time;
    const y=Math.max(ballRadius,hit.y+hit.vy*time-gravity*time*time/2);
    const visible=z>BASEBALL_SCREEN_Z+.045&&Math.abs(x)<2.25&&y<3.28&&time<1.4;
    return {ball:visible?{x,y,z,spin:time*38,hit:true}:null};
  }
  const ball=baseballPitchPosition(pitch,now);
  return {ball:ball.z<5.34?{...ball,spin:(now-pitch.at)*.024,hit:false}:null};
}

export function makeArcadeBaseball(random=Math.random){
  const first={kind:"baseball",hand:null,aim:BASEBALL_CENTER,pitchNo:0,score:0,hits:0,pitch:null,swingAt:null,hit:null,result:null,finished:false};
  let state=first,nextAt=Infinity,zones=[];

  function beginPitch(now){
    const index=state.pitchNo;
    const [column,row]=zones[index];
    const pitch={at:now+890,flight:Math.round(825+random()*276),targetX:column*.30+(random()-.5)*.15,
      height:BASEBALL_CENTER.y+row*.27+(random()-.5)*.21,bend:(random()-.5)*.48};
    state={...state,pitchNo:index+1,pitch,swingAt:null,hit:null,result:null};
    nextAt=pitch.at+pitch.flight+1070;
  }

  function update(now){
    if(state.pitch&&!state.result&&now>state.pitch.at+state.pitch.flight+160){
      state={...state,result:"miss"};
    }
    if(now>=nextAt){
      if(state.pitchNo>=BASEBALL_PITCH_COUNT){
        state={...state,finished:true,pitch:null,hit:null};
        nextAt=Infinity;
      }else beginPitch(now);
    }
    return state;
  }

  return {
    prepare(hand=null){
      state={...first,hand};
      nextAt=Infinity;
      return state;
    },
    choose(hand){
      if(state.pitchNo>0||hand!=="left"&&hand!=="right")return false;
      state={...state,hand};
      return true;
    },
    aim(x,y){
      if(!Number.isFinite(x)||!Number.isFinite(y)||!state.hand||state.finished)return false;
      state={...state,aim:clampBaseballAim(x,y)};
      return true;
    },
    start(now){
      if(!Number.isFinite(now)||!state.hand||state.pitchNo>0)return state;
      zones=shuffledZones(random);
      beginPitch(now);
      return state;
    },
    swing(now){
      if(!Number.isFinite(now))return false;
      const {pitch,finished,swingAt,result}=update(now);
      if(!pitch||finished||swingAt!==null||result||now<pitch.at)return false;
      const contact=now+BASEBALL_SWING_LEAD_MS,delta=contact-(pitch.at+pitch.flight);
      const xyz=baseballPitchPosition(pitch,contact);
      const error=Math.hypot(state.aim.x-xyz.x,state.aim.y-xyz.y)/BASEBALL_CONTACT_RADIUS;
      const timing=Math.abs(delta)/BASEBALL_HIT_WINDOW_MS;
      const outcome=error<=.39&&timing<=.38?"home":
        error<=.69&&timing<=.70?"double":
        error<=1&&timing<=1?"single":
        error<=1.18&&timing<=1.30?"foul":"miss";
      let hit=null;
      if(outcome!=="miss"){
        const accuracy=Math.max(0,1-(timing+error)*.46);
        const spray=delta/145*1.09+(xyz.x-state.aim.x)*1.25;
        hit={...xyz,at:contact,vx:Math.sin(spray)*(9.8+accuracy*7.4),
          vy:outcome==="home"?6.2:outcome==="double"?3.4:outcome==="single"?-1.4:3.1,
          vz:-Math.cos(spray)*(12.6+accuracy*8.9)};
      }
      const value=pointValues[outcome];
      state={...state,swingAt:now,hit,result:outcome,score:state.score+value,hits:state.hits+Number(value>0)};
      return true;
    },
    state:now=>update(now)
  };
}
