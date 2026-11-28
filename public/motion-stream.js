import {receiveArcade} from "./arcade-presence.js";

// World interactions use reliable room updates. Position and arcade samples can overtake one another.
export function createMotionStream(request){
  let owner=null,next=0,inflight=0,sequence=0,lastKey="",lastSend=-Infinity,healthyUntil=0,wasActive=false;
  return {
    healthy:now=>now<healthyUntil,
    tick({visit,people,me,now,clock,active,arcadePacket}){
      if(owner!==visit){owner=visit;next=0;inflight=0;sequence=Date.now()*1000;lastKey="";healthyUntil=0;lastSend=-Infinity;wasActive=false;}
      if(now<next||inflight>=2||!people.size)return;
      let nearby=false,remoteActive=false;
      for(const peer of people.values()){
        if(Math.hypot(peer.position.x-me.x,peer.position.y-me.y)>108)continue;
        nearby=true;
        remoteActive||=Boolean(peer.stepping||peer.arcade||currentArcade(peer,clock));
      }
      if(!nearby){next=now+500;return;}
      const {x,y,heading,vx,vy,running,blocked}=me,arcade=arcadePacket();
      const inMotion=Boolean(active||arcade||remoteActive);
      if(!inMotion&&!wasActive){next=now+150;return;}
      wasActive=inMotion;
      const key=JSON.stringify([x,y,heading,vx,vy,running,blocked,arcade]);
      const send=key!==lastKey||now-lastSend>=1000;
      next=now+(arcade?150:220);
      const motion={x,y};
      if(send){
        motion.frame={seq:++sequence,at:clock,heading,vx,vy,running:Boolean(running),blocked:Boolean(blocked),arcade};
        lastKey=key;lastSend=now;
      }
      inflight++;
      request("/api/room",{room:visit.room,id:visit.id,key:visit.key,motion}).then(async response=>{
        if(!response.ok)throw Error();
        const {frames}=await response.json();
        if(!Array.isArray(frames))throw Error();
        if(owner!==visit)return;
        healthyUntil=performance.now()+1600;
        for(const frame of frames){
          const peer=people.get(frame.id);
          if(!peer)continue;
          const live=peer.live??={frames:[],seq:0,arcade:null};
          if(frame.seq<=live.seq)continue;
          const previous=live.frames.at(-1);
          if(previous&&(frame.at<=previous.at||frame.at-previous.at>650||
             Math.hypot(frame.x-previous.x,frame.y-previous.y)>7))live.frames.length=0;
          live.seq=frame.seq;live.frames.push(frame);
          if(live.frames.length>8)live.frames.shift();
          live.arcade=receiveArcade(live.arcade,frame.arcade,frame.at);
        }
      }).catch(()=>{
        if(owner===visit){next=performance.now()+3000;healthyUntil=0;lastKey="";}
      }).finally(()=>{if(owner===visit)inflight--;});
    }
  };
}

export function currentArcade(peer,clock){
  const latest=peer.live?.frames.at(-1);
  return latest&&clock-latest.at<850?peer.live.arcade:peer.arcade;
}

export function drawLiveMotion(person,clock,seconds){
  const frames=person.live?.frames,last=frames?.at(-1);
  if(!last||clock-last.at>650)return false;
  const {avatar,position}=person;
  if(avatar.seat!=null||avatar.groundSit||avatar.bikeRide||avatar.bus)return false;
  // A newer full update may have moved this player across a portal.
  if(person.sample.at>last.at&&Math.hypot(avatar.x-last.x,avatar.y-last.y)>7)return false;
  const previous=frames.at(-2),interval=previous?last.at-previous.at:80;
  const renderAt=clock-Math.max(55,Math.min(140,interval*.88));
  let a=frames[0],b=a;
  for(const frame of frames){b=frame;if(frame.at>=renderAt)break;a=frame;}
  const t=b.at>a.at?Math.max(0,Math.min(1,(renderAt-a.at)/(b.at-a.at))):0;
  const lead=last===a&&!last.blocked?Math.min(.15,Math.max(0,renderAt-last.at)/1000):0;
  const x=a.x+(b.x-a.x)*t+last.vx*lead,y=a.y+(b.y-a.y)*t+last.vy*lead;
  const easing=Math.hypot(position.x-x,position.y-y)>7?1:1-Math.exp(-seconds*32);
  position.x+=(x-position.x)*easing;position.y+=(y-position.y)*easing;
  const turn=(from,to)=>(to-from+540)%360-180;
  position.heading=(position.heading+turn(position.heading,a.heading+turn(a.heading,b.heading)*t)*easing+360)%360;
  person.stepping=Boolean(clock-last.at<400&&(last.blocked||Math.hypot(last.vx,last.vy)>.04));
  person.running=person.stepping&&last.running;
  person.error.x=person.error.y=0;person.velocity.x=last.vx;person.velocity.y=last.vy;
  person.fresh=true;
  return true;
}
