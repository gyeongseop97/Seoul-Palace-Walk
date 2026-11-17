export const BOWLING_LANE_X=6.55;
export const BOWLING_ROLL_MS=4000;
export const BOWLING_BALL_RADIUS=.156;
export const BOWLING_START=4.02;
export const BOWLING_OFFSET_LIMIT=1.05;
export const BOWLING_FRAME_COUNT=10;
const allPins=0b1111111111;
const step=.01,frameSteps=3;
const maxAim=16*Math.PI/180;
const pinRadius=.146,pinSpacing=.52,rowSpacing=.458;
const ballPinRestitution=.42,pinPinRestitution=.26,pinDrag=.963,toppleImpulse=.54;
const rack=[];
for(let row=0;row<4;row++){
  for(let col=0;col<=row;col++)rack.push({x:(col-row/2)*pinSpacing,z:-3.829-row*rowSpacing});
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
// The throwing gauge sweeps from end to end. A ball let go at the middle of it is at its
// strongest and runs true; either side of that it loses pace and pulls off line toward the
// side it was missed on, and at the ends of the gauge it is a dud that barely leaves the hand.
export const BOWLING_SWEET_SPOT=.5;
const maxDrift=8*Math.PI/180;
export function bowlingRelease(gauge){
  const miss=clamp((gauge-BOWLING_SWEET_SPOT)*2,-1,1),wide=Math.pow(Math.abs(miss),1.5);
  return {power:clamp(1-wide,0,1),drift:Math.sign(miss)*wide*maxDrift};
}
const simulateCache=new Map();
const idle={roll:null,rolling:false,ball:null,pins:pinRack(allPins),knocked:0,result:null,standing:allPins};

function bodiesHit(one,two){
  const x=two.x-one.x,z=two.z-one.z,reach=one.radius+two.radius;
  const gap=Math.hypot(x,z);
  if(gap>=reach||gap<1e-5)return;
  const dx=x/gap,dz=z/gap,combined=one.inverseMass+two.inverseMass;
  const push=(reach-gap)/combined;
  one.x-=dx*push*one.inverseMass;one.z-=dz*push*one.inverseMass;
  two.x+=dx*push*two.inverseMass;two.z+=dz*push*two.inverseMass;
  const speed=(one.vx-two.vx)*dx+(one.vz-two.vz)*dz;
  if(speed<=0)return;
  // A fast ball can carry through the rack, but each pin-to-pin impact loses energy.
  // Light glancing contacts can move a pin without knocking it over.
  const restitution=one.kind==="pin"?pinPinRestitution:ballPinRestitution;
  const strength=speed*(1+restitution)/combined;
  one.vx-=strength*dx*one.inverseMass;one.vz-=strength*dz*one.inverseMass;
  two.vx+=strength*dx*two.inverseMass;two.vz+=strength*dz*two.inverseMass;
  if(strength>toppleImpulse){
    tipPin(one,-dx,-dz,strength);
    tipPin(two,dx,dz,strength);
  }
}

function tipPin(body,dx,dz,strength){
  if(body.kind!=="pin"||body.fall>0)return;
  body.fall=.001;
  body.angle=Math.atan2(dx,-dz);
  body.fallRate=clamp(strength*2,2.6,8.0);
}

function pinRack(mask){
  return rack.map(({x,z},index)=>({x,z,vx:0,vz:0,radius:pinRadius,inverseMass:1.25,kind:"pin",
    visible:Boolean(mask&1<<index),fall:0,fallRate:0,angle:0}));
}

function simulateRoll(roll){
  const {angle,power,mask,offset}=roll;
  const speed=1.16+power*7.84;
  const ball={x:offset,z:BOWLING_START,vx:Math.sin(angle)*speed,vz:-Math.cos(angle)*speed,
    radius:BOWLING_BALL_RADIUS,inverseMass:.23,visible:true,spin:0,angle,drop:0,gutter:false};
  const pins=pinRack(mask),active=pins.filter(pin=>pin.visible),contacts=[ball,...active];
  const samples=[];
  function snapshot(){
    samples.push({ball:{x:ball.x,z:ball.z,spin:ball.spin,angle:ball.angle,drop:ball.drop,visible:ball.visible},
      pins:pins.map(pin=>({x:pin.x,z:pin.z,angle:pin.angle,fall:pin.fall,visible:pin.visible}))});
  }
  snapshot();
  for(let tick=1;tick<=Math.ceil(BOWLING_ROLL_MS/1000/step/frameSteps)*frameSteps;tick++){
    if(ball.visible){
      const velocity=Math.hypot(ball.vx,ball.vz);
      if(velocity>0){
        const friction=(ball.gutter?2.35:1.36)*step;
        const scale=Math.max(0,1-friction/velocity);
        ball.vx*=scale;ball.vz*=scale;
        ball.x+=ball.vx*step;ball.z+=ball.vz*step;
        ball.spin+=velocity*step/BOWLING_BALL_RADIUS;
        ball.angle=Math.atan2(ball.vx,-ball.vz);
      }
      if(Math.abs(ball.x)>1.71){
        ball.gutter=true;ball.x=Math.sign(ball.x)*1.71;ball.vx=0;ball.drop=.091;
      }
      if(ball.z< -5.22)ball.drop+=step*1.2;
      if(ball.z< -5.68||ball.drop>.43)ball.visible=false;
    }
    for(const pin of active){
      pin.vx*=pinDrag;pin.vz*=pinDrag;
      pin.x+=pin.vx*step;pin.z+=pin.vz*step;
      if(pin.fall)pin.fall=Math.min(Math.PI/2,pin.fall+pin.fallRate*step);
      if(Math.abs(pin.x)>1.59){pin.x=Math.sign(pin.x)*1.59;pin.vx*= -.27;}
      if(pin.z< -5.26){pin.z=-5.26;pin.vz*= -.18;}
    }
    for(let i=0;i<contacts.length;i++){
      const body=contacts[i];
      if(!body.visible||body.gutter)continue;
      for(let j=i+1;j<contacts.length;j++)bodiesHit(body,contacts[j]);
    }
    if(tick%frameSteps===0)snapshot();
  }
  return samples;
}

export function bowlingFrame(roll,now){
  if(!roll||![roll.at,roll.angle,roll.power,now].every(Number.isFinite)||
    !Number.isInteger(roll.mask)||roll.mask<1||roll.mask>allPins||![1,2,3].includes(roll.attempt))return idle;
  const offset=bowlingOffset(roll.offset);
  const key=[roll.at,roll.angle,roll.power,roll.mask,roll.attempt,offset].join("/");
  if(!simulateCache.has(key)){
    if(simulateCache.size>=10)simulateCache.delete(simulateCache.keys().next().value);
    simulateCache.set(key,simulateRoll({...roll,offset}));
  }
  const samples=simulateCache.get(key),age=Math.max(0,now-roll.at);
  const stepIndex=Math.min(samples.length-1,age/(1000*step*frameSteps));
  const first=samples[Math.floor(stepIndex)],next=samples[Math.ceil(stepIndex)];
  const t=stepIndex%1,lerp=(a,b)=>a+(b-a)*t;
  const rolling=age<BOWLING_ROLL_MS;
  const ball={...first.ball,x:lerp(first.ball.x,next.ball.x),z:lerp(first.ball.z,next.ball.z),
    spin:lerp(first.ball.spin,next.ball.spin),drop:lerp(first.ball.drop,next.ball.drop),visible:first.ball.visible&&rolling};
  const pins=first.pins.map((pin,index)=>{
    const after=next.pins[index];
    return {...pin,x:lerp(pin.x,after.x),z:lerp(pin.z,after.z),fall:lerp(pin.fall,after.fall),
      angle:pin.fall===0&&t>0?after.angle:pin.angle};
  });
  const standing=pins.reduce((mask,pin,index)=>mask|(pin.visible&&pin.fall===0?1<<index:0),0);
  const knocked=countPins(roll.mask)-countPins(standing);
  const result=rolling?null:standing===0?(roll.attempt===1?"strike":"spare"):knocked>0?"hit":"miss";
  return {roll,rolling,ball,pins,knocked,result,standing};
}

export function readyBowlingFrame(mask){
  return Number.isInteger(mask)&&mask>=0&&mask<allPins?
    {...idle,pins:pinRack(mask),standing:mask}:idle;
}

export function bowlingAimAngle(pan){
  const turn=((pan-270+540)%360)-180;
  return clamp(turn*Math.PI/180,-maxAim,maxAim);
}

export function bowlingOffset(offset){
  return Number.isFinite(offset)?clamp(offset,-BOWLING_OFFSET_LIMIT,BOWLING_OFFSET_LIMIT):0;
}

function frameComplete(frame,index){
  const [first,second]=frame;
  if(index<BOWLING_FRAME_COUNT-1)return first===10||frame.length>=2;
  return frame.length===3||frame.length===2&&first!==10&&first+second<10;
}

function playerFrame(player){
  const {frames}=player;
  const last=frames.at(-1);
  if(last&&!frameComplete(last,frames.length-1))return {index:frames.length-1,throws:last};
  return {index:frames.length,throws:[]};
}

function keepsRack(frame,index){
  const [first,second]=frame;
  if(frame.length===1)return first<10;
  return index===BOWLING_FRAME_COUNT-1&&first===10&&second<10;
}

function countPins(mask){
  let count=0;
  for(let pins=mask;pins;pins&=pins-1)count++;
  return count;
}

export function makeBowlingMatch(players){
  const roster=players.map(({id,nickname})=>({id,nickname,frames:[]}));
  return {players:roster,turn:roster[0]?.id??null,phase:roster.length?"playing":"finished",
    roll:null,rollPlayer:null,standing:allPins};
}

export function bowlingTurn(match){
  if(match?.phase!=="playing")return null;
  const player=match.players.find(entry=>entry.id===match.turn&&entry.active!==false);
  if(!player)return null;
  const {index,throws}=playerFrame(player);
  if(index>=BOWLING_FRAME_COUNT)return null;
  return {player,frame:index+1,attempt:throws.length+1,mask:match.standing??allPins};
}

export function bowlingMatchRoll(match,pan,power,now,offset=0){
  const turn=bowlingTurn(match);
  if(!turn||match.roll||![pan,power,now].every(Number.isFinite))return null;
  const release=bowlingRelease(clamp(power,0,1));
  return {at:now,angle:bowlingAimAngle(pan)+release.drift,power:release.power,mask:turn.mask,attempt:turn.attempt,offset:bowlingOffset(offset)};
}

export function advanceBowlingMatch(match,knocked,standingMask){
  const turn=bowlingTurn(match);
  if(!turn||!Number.isInteger(knocked)||knocked<0||!Number.isInteger(standingMask)||standingMask<0||
    (standingMask&turn.mask)!==standingMask||knocked+countPins(standingMask)!==countPins(turn.mask))return match;
  const index=turn.frame-1,frame=[...(turn.player.frames[index]??[]),knocked];
  const players=match.players.map(entry=>{
    if(entry.id!==match.turn)return entry;
    const frames=entry.frames.slice();
    frames[index]=frame;
    return {...entry,frames};
  });
  const settled={...match,players,roll:null,rollPlayer:null};
  if(!frameComplete(frame,index)){
    return {...settled,standing:keepsRack(frame,index)?standingMask:allPins};
  }
  const start=players.findIndex(entry=>entry.id===match.turn);
  for(let offset=1;offset<=players.length;offset++){
    const player=players[(start+offset)%players.length];
    if(player.active!==false&&playerFrame(player).index<BOWLING_FRAME_COUNT){
      return {...settled,turn:player.id,standing:allPins};
    }
  }
  return {...settled,turn:null,phase:"finished",standing:allPins};
}

export function bowlingScore(frames){
  let total=0;
  const scores=frames.map((frame,index)=>{
    if(!frameComplete(frame,index))return null;
    const [first,second]=frame;
    if(index===BOWLING_FRAME_COUNT-1){
      total+=frame.reduce((sum,pins)=>sum+pins,0);
      return total;
    }
    const bonus=first===10?2:first+second===10?1:0;
    const next=bonus?frames.slice(index+1).flat().slice(0,bonus):[];
    if(next.length<bonus)return null;
    total+=(first===10?10:first+second)+next.reduce((sum,pins)=>sum+pins,0);
    return total;
  });
  return {total,scores};
}

export function makeBowling(){
  let roll=null;
  return {
    throw(pan,power,now,offset=0){
      if(![pan,power,now].every(Number.isFinite))return null;
      const previous=bowlingFrame(roll,now);
      if(previous.rolling)return null;
      const second=Boolean(roll?.attempt===1&&previous.standing);
      const release=bowlingRelease(clamp(power,0,1));
      roll={at:now,angle:bowlingAimAngle(pan)+release.drift,power:release.power,mask:second?previous.standing:allPins,
        attempt:second?2:1,offset:bowlingOffset(offset)};
      return roll;
    },
    state(now){return bowlingFrame(roll,now);},
    reset(){roll=null;}
  };
}
