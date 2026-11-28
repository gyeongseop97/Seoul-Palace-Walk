import {parkRides} from "./gyeongju-world-layout.js";
import {gyeongjuPoint} from "./region-coordinates.js";

export const rideDefinitions=new Map(parkRides.map(ride=>[ride.id,{...ride,point:gyeongjuPoint(ride.gate)}]));
export const rideCapacity=Object.fromEntries(parkRides.map(r=>[r.id,r.capacity]));
export const boardingDelay=4000;
const stepMs=40,arenaRadius=9.45,carDiameter=1.74;

export function newRide(kind,now){
  const starts=now+boardingDelay;
  const session={kind,starts,ends:starts+1000*rideDefinitions.get(kind).duration,riders:[]};
  if(kind==="cups")session.cupSpins=Array(6).fill(0);
  if(kind==="bumper"){
    session.tick=starts;
    session.cars=[0,1,.5,1.34,1.67].map(turn=>{
      const angle=turn*Math.PI;
      return {x:Math.sin(angle)*5,z:Math.cos(angle)*5,yaw:angle,vx:0,vz:0,throttle:0,steer:0,until:0};
    });
  }
  return session;
}

function drive(car,throttle,steer){
  const dt=stepMs/1000;
  car.yaw+=steer*2.35*dt;
  const force=throttle*10.5*dt;
  car.vx=car.vx*.944-Math.sin(car.yaw)*force;
  car.vz=car.vz*.944-Math.cos(car.yaw)*force;
  car.x+=car.vx*dt;car.z+=car.vz*dt;
}
function contain(car,time){
  const length=Math.hypot(car.x,car.z);
  if(length<=arenaRadius)return;
  const nx=car.x/length,nz=car.z/length,speed=Math.max(0,car.vx*nx+car.vz*nz);
  if(speed>.9){car.bumpAt=time;car.bumpForce=speed;}
  car.x=nx*arenaRadius;car.z=nz*arenaRadius;
  car.vx-=1.65*speed*nx;car.vz-=1.65*speed*nz;
}
function bump(a,b,time){
  const dx=b.x-a.x,dz=b.z-a.z,distance=Math.hypot(dx,dz);
  if(distance>=carDiameter)return;
  const nx=distance?dx/distance:1,nz=distance?dz/distance:0;
  const correction=(carDiameter-distance)*.5;
  a.x-=nx*correction;a.z-=nz*correction;b.x+=nx*correction;b.z+=nz*correction;
  const impulse=.86*Math.max(0,(a.vx-b.vx)*nx+(a.vz-b.vz)*nz);
  if(impulse>.7){a.bumpAt=b.bumpAt=time;a.bumpForce=b.bumpForce=impulse;}
  a.vx-=nx*impulse;a.vz-=nz*impulse;b.vx+=nx*impulse;b.vz+=nz*impulse;
}

// The server and viewers replay identical fixed steps from the last accepted controls.
export function advanceCars(session,clock){
  if(!session.cars||session.tick+stepMs>clock)return;
  const occupied=new Set(session.riders.map(person=>person.seat));
  const end=Math.min(clock,session.ends);
  while(session.tick+stepMs<=end){
    session.tick+=stepMs;
    for(const [seat,car] of session.cars.entries()){
      if(occupied.has(seat)){
        const live=session.tick<=car.until;
        drive(car,live?car.throttle:0,live?car.steer:0);
      }else{
        const towardCenter=Math.atan2(car.x,car.z);
        const turn=Math.sin(towardCenter-car.yaw);
        drive(car,.52,Math.hypot(car.x,car.z)>6.2?Math.sign(turn||1):.22*Math.sin(session.tick/2100+seat));
      }
    }
    for(let i=0;i<session.cars.length;i++){
      for(let j=i+1;j<session.cars.length;j++)bump(session.cars[i],session.cars[j],session.tick);
    }
    session.cars.forEach(car=>contain(car,session.tick));
  }
}
