import {advanceCars,rideDefinitions} from "./amusement-session.js";

import {ridePhase} from "./gyeongju-world-audio.js";
import {localGyeongju} from "./region-coordinates.js";
const keys=new Map([["ArrowUp","forward"],["KeyW","forward"],["ArrowDown","back"],["KeyS","back"],
  ["ArrowLeft","left"],["KeyA","left"],["ArrowRight","right"],["KeyD","right"]]);
const boardingPoints=[...rideDefinitions.values()];
export function amusementRideNear({x,y}){
  return boardingPoints.find(({point})=>Math.hypot(x-point.x,y-point.y)<=5);
}

export function createAmusementRides(panel,{token,wake,onFinish,notify}){
  const title=panel.querySelector("strong"),clock=panel.querySelector("output"),roster=panel.querySelector("[data-riders]");
  const steering=panel.querySelector("[data-steering]"),exit=panel.querySelector("[data-stop-ride]");
  const input=new Map(),queue=[];
  const view=panel.querySelector("[data-ride-view]"),phase=panel.querySelector("[data-phase]"),spin=panel.querySelector("[data-spin]");
  let firstPerson=true,lastSpin=0;
  function showView(){view.textContent=firstPerson?"동행 시점으로":"탑승 시점으로";view.setAttribute("aria-pressed",String(!firstPerson));}
  view.onclick=()=>{firstPerson=!firstPerson;showView();};
  spin.onclick=()=>{
    if(current?.kind!=="cups"||spin.disabled)return;
    lastSpin=performance.now();spin.disabled=true;
    queue.push({action:"spin",kind:"cups",ticket:seat.ticket,id:token()});wake();
  };
  let rides=[],intent=null,current=null,seat=null,seq=0,lastDrive="",lastDriveTime=0;
  function close(){
    const visible=!panel.hidden;
    intent=current=seat=null;input.clear();lastDrive="";lastDriveTime=seq=0;panel.hidden=true;
    if(visible)onFinish();
  }
  function stop(){
    if(!intent)return;
    queue.push({action:"leave",kind:intent.kind,ticket:intent.ticket,id:token()});
    close();wake();
  }
  function control(key,value){
    if(value===input.get(key))return;
    if(value)input.set(key,value);else input.delete(key);
    if(current?.kind==="bumper")wake();
  }
  exit.addEventListener("click",stop);
  for(const button of steering.querySelectorAll("button")){
    button.addEventListener("pointerdown",event=>{
      if(event.button!==0)return;
      event.preventDefault();button.setPointerCapture(event.pointerId);
      control(event.pointerId,button.dataset.drive);
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"])
      button.addEventListener(type,event=>control(event.pointerId));
  }
  window.addEventListener("keydown",event=>{
    if(!intent||event.ctrlKey||event.altKey||event.metaKey)return;
    if(event.code==="Escape"){event.preventDefault();event.stopImmediatePropagation();stop();return;}
    if(!keys.has(event.code))return;
    event.preventDefault();event.stopImmediatePropagation();control(event.code,keys.get(event.code));
  },true);
  window.addEventListener("keyup",event=>control(event.code),true);
  window.addEventListener("blur",()=>{if(input.size){input.clear();wake();}});
  return {
    get active(){return Boolean(intent);},
    get driving(){return current?.kind==="bumper";},
    get pending(){return queue.length>0;},
    get rides(){return rides;},
    start(definition){
      if(intent)return;
      const id=token();
      intent={kind:definition.id,ticket:id};
      queue.push({action:"join",kind:definition.id,id});
      title.textContent=definition.name;clock.value="탑승 중";roster.textContent="";
      firstPerson=true;lastSpin=-Infinity;showView();phase.textContent="승차 중";spin.hidden=true;
      steering.hidden=true;panel.hidden=false;exit.focus({preventScroll:true});wake();
    },
    packet(now){
      if(queue.length)return queue[0];
      if(current?.kind!=="bumper"||!seat)return null;
      const values=new Set(input.values()),axis=(a,b)=>Number(values.has(a))-Number(values.has(b));
      const throttle=axis("forward","back"),steer=axis("left","right"),signature=throttle+","+steer;
      if(signature===lastDrive&&(!(throttle||steer)||now-lastDriveTime<700))return null;
      const command={action:"drive",id:token(),kind:"bumper",ticket:seat.ticket,seq:++seq,throttle,steer};
      lastDriveTime=now;lastDrive=signature;queue.push(command);return command;
    },
    receive(data,command,id){
      if(data.amusementResult==="busy")return;
      if(command&&queue[0]===command)queue.shift();
      if(!data.amusementRides){
        if(command?.action==="join"&&intent?.ticket===command.id){close();notify("지금은 놀이기구에 연결할 수 없어요.");}
        return;
      }
      rides=data.amusementRides;
      const shared=rides.find(ride=>ride.riders.some(person=>person.id===id));
      const own=shared?.riders.find(person=>person.id===id);
      if(own&&!queue.some(cmd=>cmd.action==="leave"&&cmd.ticket===own.ticket)&&(!intent||intent.ticket===own.ticket)){
        intent={kind:shared.kind,ticket:own.ticket};current=shared;seat=own;seq=Math.max(seq,own.seq??0);
        title.textContent=rideDefinitions.get(shared.kind).name;
        const unit=shared.kind==="bumper"?"호차":shared.kind==="beach-triple"?"번 레인":shared.kind==="beach-twist"?"번 튜브":"번 좌석";
        const names=shared.riders.filter(person=>person.id!==id).sort((a,b)=>a.seat-b.seat).map(person=>person.nickname);
        const label=(own.seat+1)+unit+(names.length?" · 동행 "+names.join(", "):"");
        if(roster.textContent!==label)roster.textContent=label;
        spin.hidden=shared.kind!=="cups";panel.hidden=false;steering.hidden=shared.kind!=="bumper";
      }else if(intent&&!queue.some(cmd=>cmd.action==="join"&&cmd.id===intent.ticket)){
        close();
        if(command?.action==="join")notify(data.amusementResult==="full"?"지금은 만석이에요. 다음 운행을 기다려 주세요.":"입구에서 다시 탑승해 주세요.");
      }
    },
    update(now,player,enabled){
      rides=rides.filter(ride=>ride.ends>now);
      for(const ride of rides)advanceCars(ride,now);
      if(!intent)return null;
      const {point}=rideDefinitions.get(intent.kind);
      if(!enabled||Math.hypot(player.x-point.x,player.y-point.y)>7){stop();return null;}
      if(!current)return null;
      if(current.ends<=now){close();return null;}
      const remaining=now<current.starts?"출발까지 "+Math.ceil((current.starts-now)/1000)+"초":Math.ceil((current.ends-now)/1000)+"초";
      if(clock.value!==remaining)clock.value=remaining;
      const label=ridePhase(current.kind,(now-current.starts)/1000,seat.seat);
      if(phase.textContent!==label)phase.textContent=label;
      if(!spin.hidden)spin.disabled=now<current.starts||now-(current.cupSpins?.[seat.seat>>1]??0)<3000||performance.now()-lastSpin<3000;
      return {id:current.kind,seat:seat.seat,firstPerson};
    },
    acoustics(clock,player,heading){
      const p=localGyeongju(player);
      let def=current&&rideDefinitions.get(current.kind),gain=1,pan=0;
      if(!def){
        let closest=68;
        for(const r of boardingPoints){
          const d=Math.hypot(r.x-p.x,r.z-p.z);
          if(d<closest){closest=d;def=r;}
        }
        if(!def)return null;
        gain=.46*(1-closest/68)**1.35;
        const azimuth=Math.atan2(def.x-p.x,p.z-def.z)-heading*Math.PI/180;
        pan=Math.sin(azimuth)*.8;
      }
      const session=rides.find(r=>r.kind===def.id),cars=session?.cars??[],own=current?.kind===def.id;
      const car=own?cars[seat.seat]:cars.reduce((a,b)=>(a?.bumpAt??0)>(b.bumpAt??0)?a:b,null);
      const t=session?(clock-session.starts)/1000:(clock/1000)%def.duration;
      return {id:def.id,t,gain,pan,clock,seat:own?seat.seat:0,onboard:own,speed:car?Math.hypot(car.vx,car.vz):2,bumpAt:car?.bumpAt,bumpForce:car?.bumpForce};
    },
    reset(){queue.length=0;rides=[];close();}
  };
}
