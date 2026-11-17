export const BASEBALL_LANE_X=6.4;
export const BASEBALL_PLATE_Z=3.20;
export const BASEBALL_MOUND_Z=-4.26;
export const BASEBALL_SCREEN_Z=-5.38;
export const BASEBALL_PITCH_COUNT=6;
export const BASEBALL_SWING_LEAD_MS=82;
export const BASEBALL_HIT_WINDOW_MS=104;
const ballRadius=.075,gravity=9.81;
const pointValues={miss:0,foul:0,single:1,double:2,home:4};
const pitches=[
  {flight:906,bend:0,height:1.15},
  {flight:1110,bend:-.31,height:1.01},
  {flight:815,bend:.06,height:1.25},
  {flight:1038,bend:.29,height:.99},
  {flight:925,bend:-.18,height:1.20},
  {flight:790,bend:.12,height:1.10}
];

function pitchPosition(pitch,now){
  const time=(now-pitch.at)/pitch.flight;
  const z=BASEBALL_MOUND_Z+(BASEBALL_PLATE_Z-BASEBALL_MOUND_Z)*time;
  const x=pitch.bend*(time*time-.16*time);
  const y=1.46*(1-time)+pitch.height*time+Math.sin(time*Math.PI)*.094;
  return {x,y,z};
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
  const ball=pitchPosition(pitch,now);
  return {ball:ball.z<5.34?{...ball,spin:(now-pitch.at)*.024,hit:false}:null};
}

export function makeArcadeBaseball(){
  const first={kind:"baseball",pitchNo:0,score:0,hits:0,pitch:null,swingAt:null,hit:null,result:null,finished:false};
  let state=first,nextAt=Infinity;

  function beginPitch(now){
    const index=state.pitchNo;
    const pitch={...pitches[index],at:now+800};
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
    start(now){
      if(!Number.isFinite(now))return state;
      state=first;
      beginPitch(now);
      return state;
    },
    swing(now){
      if(!Number.isFinite(now))return false;
      const {pitch,finished,swingAt,result}=update(now);
      if(!pitch||finished||swingAt!==null||result||now<pitch.at-125)return false;
      const contact=now+BASEBALL_SWING_LEAD_MS,delta=contact-(pitch.at+pitch.flight),distance=Math.abs(delta);
      const outcome=distance<=37?"home":distance<=70?"double":distance<=BASEBALL_HIT_WINDOW_MS?"single":distance<=140?"foul":"miss";
      let hit=null;
      if(outcome!=="miss"){
        const xyz=pitchPosition(pitch,contact);
        const accuracy=Math.max(0,1-distance/148);
        // Contact earlier or later in the swing changes its horizontal spray.
        const spray=(delta/140)*1.43;
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
