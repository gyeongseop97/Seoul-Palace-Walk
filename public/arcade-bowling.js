export const BOWLING_LANE_X=6.55;
export const BOWLING_ROLL_MS=4000;
export const BOWLING_BALL_RADIUS=.156;
export const BOWLING_START=4.02;
const allPins=0b1111111111;
const step=.01,frameSteps=3;
const maxAim=16*Math.PI/180;
const pinRadius=.176,pinSpacing=.414;
const rack=[];
for(let row=0;row<4;row++){
  for(let col=0;col<=row;col++)rack.push({x:(col-row/2)*pinSpacing,z:-3.89-row*.365});
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
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
  const strength=speed*1.53/combined;
  one.vx-=strength*dx*one.inverseMass;one.vz-=strength*dz*one.inverseMass;
  two.vx+=strength*dx*two.inverseMass;two.vz+=strength*dz*two.inverseMass;
  if(strength>.33){
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
  const {angle,power,mask}=roll;
  const speed=1.16+power*7.84;
  const ball={x:0,z:BOWLING_START,vx:Math.sin(angle)*speed,vz:-Math.cos(angle)*speed,
    radius:BOWLING_BALL_RADIUS,inverseMass:.23,visible:true,spin:0,angle,drop:0,gutter:false};
  const pins=pinRack(mask),active=pins.filter(pin=>pin.visible),contacts=[ball,...active];
  const samples=[];
  function snapshot(){
    samples.push({ball:{x:ball.x,z:ball.z,spin:ball.spin,angle:ball.angle,drop:ball.drop,visible:ball.visible},
      pins:pins.map(pin=>({x:pin.x,z:pin.z,angle:pin.angle,fall:pin.fall,visible:pin.visible})),
      knocked:active.filter(pin=>pin.fall>0).length});
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
      pin.vx*=.972;pin.vz*=.972;
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
    !Number.isInteger(roll.mask)||roll.mask<1||roll.mask>allPins||![1,2].includes(roll.attempt))return idle;
  const key=[roll.at,roll.angle,roll.power,roll.mask,roll.attempt].join("/");
  if(!simulateCache.has(key)){
    if(simulateCache.size>=10)simulateCache.delete(simulateCache.keys().next().value);
    simulateCache.set(key,simulateRoll(roll));
  }
  const samples=simulateCache.get(key),age=Math.max(0,now-roll.at);
  const stepIndex=Math.min(samples.length-1,age/(1000*step*frameSteps));
  const first=samples[Math.floor(stepIndex)],next=samples[Math.ceil(stepIndex)];
  const t=stepIndex%1,lerp=(a,b)=>a+(b-a)*t;
  const rolling=age<BOWLING_ROLL_MS;
  const ball={...first.ball,x:lerp(first.ball.x,next.ball.x),z:lerp(first.ball.z,next.ball.z),
    spin:lerp(first.ball.spin,next.ball.spin),drop:lerp(first.ball.drop,next.ball.drop),visible:first.ball.visible&&rolling};
  const pins=first.pins.map((pin,index)=>({
    ...pin,x:lerp(pin.x,next.pins[index].x),z:lerp(pin.z,next.pins[index].z),fall:lerp(pin.fall,next.pins[index].fall)
  }));
  const standing=pins.reduce((mask,pin,index)=>mask|(pin.visible&&pin.fall===0?1<<index:0),0);
  const result=rolling?null:standing===0?(roll.attempt===1?"strike":"spare"):first.knocked>0?"hit":"miss";
  return {roll,rolling,ball,pins,knocked:first.knocked,result,standing};
}

export function bowlingAimAngle(pan){
  const turn=((pan-270+540)%360)-180;
  return clamp(turn*Math.PI/180,-maxAim,maxAim);
}

export function makeBowling(){
  let roll=null;
  return {
    throw(pan,power,now){
      if(![pan,power,now].every(Number.isFinite))return null;
      const previous=bowlingFrame(roll,now);
      if(previous.rolling)return null;
      const second=Boolean(roll?.attempt===1&&previous.standing);
      roll={at:now,angle:bowlingAimAngle(pan),power:clamp(power,0,1),mask:second?previous.standing:allPins,attempt:second?2:1};
      return roll;
    },
    state(now){return bowlingFrame(roll,now);},
    reset(){roll=null;}
  };
}
