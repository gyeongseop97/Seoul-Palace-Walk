// People may wade through the palace ponds, so their movement checks allow shallow water.
import {wadeSegment as clearSegment,distance,platformAt,loftStair} from "./layout.js";
import {JUMP_HEIGHT,jumpDuration,jumpLift} from "./activities.js";
import {busAt,busSeatPose} from "./sejong-bus.js";
import {canRideBikeSegment} from "./bike-movement.js";
import {isBikeDriver,isCycling} from "./sejong-bike.js";

export const normalize = angle => ((angle % 360) + 360) % 360;
export const angleDelta = (from,to) => normalize(to-from+180)-180;
export const hexCoat = color => "#"+color.toString(16).padStart(6,"0");
export const moving = avatar => Math.hypot(avatar.vx||0,avatar.vy||0) > .04;

export function receivePeople(people,rows,self,serverTime){
  const present=new Set();
  for(const row of rows){
    if(row.id===self)continue;
    present.add(row.id);
    const {avatar}=row;
    const at=row.updated??serverTime;
    let person=people.get(row.id);
    if(!person){
      person={id:row.id,position:{x:avatar.x,y:avatar.y,heading:avatar.heading??252},
        view:{...row.view},sample:{at,avatar},interval:120,error:{x:0,y:0},velocity:{x:0,y:0},fresh:false};
      people.set(row.id,person);
    }
    const previous=person.sample;
    if(at<previous.at)continue;
    const rideChanged=avatar.bus?.index!==previous.avatar.bus?.index||avatar.bus?.seat!==previous.avatar.bus?.seat||
      avatar.bikeRide?.driver!==previous.avatar.bikeRide?.driver;
    if(at>previous.at||rideChanged){
      const interval=at-previous.at;
      // Track how often this walker's position really arrives. The render loop predicts
      // that far ahead, so a slow connection shows steady walking instead of stop-and-go.
      if(interval<=1200&&(moving(previous.avatar)||previous.avatar.blocked)){
        person.interval+=(Math.max(40,Math.min(700,interval))-person.interval)*.3;
      }
      person.sample={at,avatar};
      person.fresh=true;
    }
    if(rideChanged){
      Object.assign(person.position,{x:avatar.x,y:avatar.y,heading:avatar.heading??person.position.heading});
      person.error.x=person.error.y=person.velocity.x=person.velocity.y=0;
      person.fresh=false;
    }
    person.avatar=avatar;
    person.targetView=row.view;
    person.nickname=row.nickname;
    person.coat=row.coat;
    person.signal=row.signal;
    person.available=row.handholdAvailable&&!avatar.bus&&!isCycling(avatar);
  }
  for(const id of people.keys())if(!present.has(id))people.delete(id);
}

// Remote walkers are drawn where they are now, not where the last message left them.
// Each frame extends the newest report along its velocity (dead reckoning). When a
// fresh report disagrees with the prediction, the difference is blended away over a
// few frames, so the motion stays continuous without holding the walker back in time.
export function smoothPeople(people,seconds,serverTime,roundTrip=65){
  const lookEase=1-Math.exp(-seconds*19),turnEase=1-Math.exp(-seconds*13);
  const settle=Math.exp(-seconds/.24);
  // A report was already about half a round trip old when the server stamped it.
  const uplink=Math.min(.12,Math.max(0,roundTrip)*.0005);
  for(const person of people.values()){
    const {avatar,position,view,targetView,sample,error,velocity}=person;
    view.pan=normalize(view.pan+angleDelta(view.pan,targetView.pan)*lookEase);
    view.tilt+=(targetView.tilt-view.tilt)*lookEase;
    view.zoom+=(targetView.zoom-view.zoom)*lookEase;
    view.night=targetView.night;
    const ride=avatar.bus&&busSeatPose(busAt(avatar.bus.index,serverTime),avatar.bus.seat);
    if(ride){
      Object.assign(position,ride);
      error.x=error.y=velocity.x=velocity.y=0;
      person.fresh=person.stepping=person.running=false;
      continue;
    }
    const a=sample.avatar,seated=avatar.seat!=null;
    const age=Math.max(0,(serverTime-sample.at)/1000);
    const travelling=!seated&&!a.blocked&&moving(a);
    const airborne=serverTime-(avatar.jump||0)<jumpDuration(avatar)+250;
    let goal=seated?avatar:a,predicting=false;
    if(travelling){
      // Predict up to the expected arrival of the next report, then ease to a stop.
      const horizon=Math.min(.95,Math.max(.28,person.interval*.0017+.12));
      const elapsed=age+uplink;
      const lead=elapsed<=horizon?elapsed:horizon+.16*(1-Math.exp(-(elapsed-horizon)/.16));
      predicting=elapsed<horizon+.35;
      const platform=platformAt(a.x,a.y);
      const feet=airborne&&avatar.vaultBase!=null?
        Math.max(platform,avatar.vaultBase+jumpLift(avatar,serverTime)):platform+(airborne?JUMP_HEIGHT:.19);
      for(const share of [1,.6,.3]){
        const guess={x:a.x+(a.vx||0)*lead*share,y:a.y+(a.vy||0)*lead*share};
        const clear=isBikeDriver(a)?canRideBikeSegment(a,guess):clearSegment(a,guess,.36,feet);
        if(a.up||loftStair(a.x,a.y)!=null||clear){goal=guess;break;}
      }
    }
    const gap=distance(position,goal.x,goal.y);
    let nextX,nextY;
    if(gap>7||seconds<=0){
      nextX=goal.x;nextY=goal.y;error.x=error.y=0;velocity.x=velocity.y=0;
    }else{
      if(person.fresh){
        // Keep last frame's motion and absorb the correction gradually.
        error.x=position.x+velocity.x*seconds-goal.x;
        error.y=position.y+velocity.y*seconds-goal.y;
      }else{
        error.x*=settle;error.y*=settle;
      }
      nextX=goal.x+error.x;nextY=goal.y+error.y;
      velocity.x=(nextX-position.x)/seconds;velocity.y=(nextY-position.y)/seconds;
    }
    person.fresh=false;
    const moved=Math.hypot(nextX-position.x,nextY-position.y);
    position.x=nextX;position.y=nextY;
    const facing=(seated?avatar.heading:a.heading)??targetView.pan;
    const turn=angleDelta(position.heading,facing);
    position.heading=Math.abs(turn)<.04?facing:normalize(position.heading+turn*turnEase);
    const speed=seconds>0?moved/seconds:0;
    person.stepping=Boolean(!seated&&(predicting||a.blocked&&age<1.2||speed>.45));
    person.running=Boolean(person.stepping&&a.running);
  }
}

export function handPosition(leader,side){
  const angle=(leader.heading??252)*Math.PI/180;
  return {x:leader.x+Math.cos(angle)*side*.90,y:leader.y+Math.sin(angle)*side*.90,heading:leader.heading??252};
}

export function handSide(leader,follower){
  if(leader.seat!=null||follower.seat!=null||leader.bus||follower.bus||isCycling(leader)||isCycling(follower)||distance(leader,follower.x,follower.y)>2.4||
     !clearSegment(leader,follower))return 0;
  const options=[-1,1].map(side=>({side,point:handPosition(leader,side)}))
    .filter(({point})=>clearSegment(leader,point)&&clearSegment(follower,point))
    .sort((a,b)=>distance(follower,a.point.x,a.point.y)-distance(follower,b.point.x,b.point.y));
  return options[0]?.side||0;
}

export function pairFits(from,to,side){
  const previous=handPosition(from,side),next=handPosition(to,side);
  return clearSegment(to,next)&&clearSegment(previous,next);
}
