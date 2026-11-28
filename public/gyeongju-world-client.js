import {parkRides} from "./gyeongju-world-layout.js";
import {gyeongjuPoint} from "./region-coordinates.js";

const boardingPoints=parkRides.map(ride=>({...ride,point:gyeongjuPoint(ride.gate)}));
const keys=new Map([["ArrowUp","forward"],["KeyW","forward"],["ArrowDown","back"],["KeyS","back"],
  ["ArrowLeft","left"],["KeyA","left"],["ArrowRight","right"],["KeyD","right"]]);

export function amusementRideNear({x,y}){
  return boardingPoints.find(({point})=>Math.hypot(x-point.x,y-point.y)<=5);
}

export function createAmusementRides(panel,onFinish){
  const title=panel.querySelector("strong"),clock=panel.querySelector("output"),steering=panel.querySelector("[data-steering]");
  const input=new Map();
  let ride=null,lastTime=0;
  function stop(){
    if(!ride)return;
    ride=null;input.clear();panel.hidden=true;
    onFinish();
  }
  panel.querySelector("[data-stop-ride]").addEventListener("click",stop);
  for(const button of steering.querySelectorAll("button")){
    button.addEventListener("pointerdown",event=>{
      if(event.button!==0)return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      input.set(event.pointerId,button.dataset.drive);
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"]){
      button.addEventListener(type,event=>input.delete(event.pointerId));
    }
  }
  window.addEventListener("keydown",event=>{
    if(!ride||event.ctrlKey||event.altKey||event.metaKey)return;
    if(event.code==="Escape"){event.preventDefault();event.stopImmediatePropagation();stop();return;}
    if(!keys.has(event.code))return;
    event.preventDefault();event.stopImmediatePropagation();
    input.set(event.code,keys.get(event.code));
  },true);
  window.addEventListener("keyup",event=>input.delete(event.code),true);
  window.addEventListener("blur",()=>input.clear());
  return {
    get active(){return Boolean(ride);},
    start(definition,now){
      if(ride)return;
      ride={...definition,elapsed:0,x:0,z:0,yaw:0,speed:0,opponents:[]};
      lastTime=now;
      title.textContent=ride.name;
      clock.value=ride.duration+"초";
      steering.hidden=ride.id!=="bumper";
      panel.hidden=false;
      panel.querySelector("[data-stop-ride]").focus({preventScroll:true});
    },
    update(now,player,enabled){
      if(!ride)return null;
      if(!enabled||Math.hypot(player.x-ride.point.x,player.y-ride.point.y)>7){stop();return null;}
      const dt=Math.min(.08,Math.max(0,(now-lastTime)/1000));
      lastTime=now;
      ride.elapsed+=dt;
      if(ride.elapsed>=ride.duration){stop();return null;}
      const remaining=Math.ceil(ride.duration-ride.elapsed)+"초";
      if(clock.value!==remaining)clock.value=remaining;
      if(ride.id==="bumper"){
        const controls=new Set(input.values());
        const acceleration=Number(controls.has("forward"))-Number(controls.has("back"));
        const turn=Number(controls.has("left"))-Number(controls.has("right"));
        ride.speed=Math.max(-3.8,Math.min(6.8,ride.speed*Math.exp(-dt*1.35)+11*dt*acceleration));
        ride.yaw+=2.35*turn*dt;
        const nextX=ride.x-Math.sin(ride.yaw)*ride.speed*dt,nextZ=ride.z-Math.cos(ride.yaw)*ride.speed*dt;
        const blocked=Math.hypot(nextX,nextZ)>9.5||ride.opponents.some(car=>Math.hypot(nextX-car.x,nextZ-car.z)<1.65);
        if(blocked)ride.speed*=-.55;
        else{ride.x=nextX;ride.z=nextZ;}
      }
      return ride;
    },
    stop
  };
}
