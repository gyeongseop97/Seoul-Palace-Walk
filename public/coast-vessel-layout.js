import {clamp,mooring,wave} from "./pohang-layout.js";

export const bridge={aft:2.75,front:8.65,half:2.55,door:.83,floor:7.85};
export const cruiseScale=1.35,mainFloor=2.46;
export const boardingSpot={x:-4.48,z:0};
export const helmStation={x:-.46,z:6.15};
export const serviceSpot={x:-1.56,z:-8.24};
export const nearHelm=p=>p&&(p.h==null||p.h>7.7)&&Math.hypot(p.x-helmStation.x,p.z-helmStation.z)<1.15;
function lowerDeck(p){
 const x=Math.abs(p.x);
 if(p.z< -16.55||p.z>16.3)return null;
 if(p.z< -8.05)return x<(p.z< -14?3.64:4.60)?mainFloor:null;
 if(p.z< -7.58&&x<4.13&&x>.72)return null;
 if(p.z<=10.02){
  if(x>=3.69&&x<4.03)return null;
  if(x>4.54-.085*Math.max(0,p.z-3.6))return null;
  if(x<3.71&&p.z>9.65)return null;
  if(x>2.2&&x<3.48&&p.z> -5.45&&p.z<6.45)return null;
  return mainFloor;
 }
 if(p.z<10.4&&x<3.55)return null;
 return x<3.40-.30*(p.z-10.02)?mainFloor:null;
}
export function deckHeight(p,previous=p?.h){
 if(!p)return null;
 // Two decks overlap at the stern. The stair surface connects them without
 // switching to the roof when someone walks through the salon underneath it.
 if(Math.abs(p.x+2.55)<.73&&p.z>=-15.70&&p.z<=-11.84){
  const stair=mainFloor+clamp((p.z+15.70)/3.86,0,1)*3;
  if(previous==null||Math.abs(previous-stair)<.58)return stair;
 }
 if(previous!=null&&previous<4.95)return lowerDeck(p);
 if(Math.abs(p.x-1.7)<.69&&p.z>=-9.65&&p.z< -5.55)return 5.46+clamp((p.z+9.65)/4,0,1)*2.39;
 if(p.z>=-12.65&&p.z<=-6.15&&Math.abs(p.x)<=3.35){
  if(Math.abs(p.x+1.65)<1.36&&Math.abs(p.z+7.02)<.51)return null;
  return 5.46;
 }
 if(p.z< -5.58||p.z>bridge.front-.27||Math.abs(p.x)>2.75)return previous==null?lowerDeck(p):null;
 if(p.z>=bridge.aft-.23&&p.z<=bridge.aft+.23&&Math.abs(p.x)>bridge.door-.21)return null;
 if(p.z>bridge.aft&&Math.abs(p.x)>bridge.half-.25)return null;
 if(p.z>6.81&&p.z<7.98&&Math.abs(p.x)<1.81)return null;
 return bridge.floor;
}

// Sample along the waterline on both axes. The protected berth has very little swell.
export function hullAttitude(ship,at){
 const s=Math.sin(ship.yaw),c=Math.cos(ship.yaw),t=at/1000%14400;
 const w=(x,z)=>wave(ship.x+x*c+z*s,ship.z-x*s+z*c,t);
 const fore=w(0,10),aft=w(0,-10),star=w(3.5,0),port=w(-3.5,0);
 const exposure=.075+.925*clamp((Math.hypot(ship.x-mooring.x,ship.z-mooring.z)-5)/58,0,1);
 return {heave:(fore+aft+port+star)*.085*exposure,
  pitch:clamp((aft-fore)/20,-.038,.038)*exposure,roll:clamp((star-port)/7,-.052,.052)*exposure};
}
// THREE's YXZ hull rotation. Reverse the x/z projection for the deck's known
// height, so walking and drawing use the same tilted plane.
export function deckToSea(ship,p,at,height=deckHeight(p)??5.46){
 const {pitch,roll,heave}=hullAttitude(ship,at),c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 const cr=Math.cos(roll),sr=Math.sin(roll),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const x=p.x*cruiseScale*cr-height*sr,y=p.x*cruiseScale*sr+height*cr,z=y*sp+p.z*cruiseScale*cp;
 return {x:ship.x+x*c+z*s,z:ship.z-x*s+z*c,h:heave+y*cp-p.z*cruiseScale*sp};
}
export function seaToDeck(ship,p,at,previous){
 const {pitch,roll}=hullAttitude(ship,at),c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 const dx=p.x-ship.x,dz=p.z-ship.z,flatX=dx*c-dz*s,flatZ=dx*s+dz*c;
 const cr=Math.cos(roll),sr=Math.sin(roll),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const local={x:flatX/cruiseScale,z:flatZ/cruiseScale};
 for(let i=0;i<2;i++){
  const h=deckHeight(local,previous)??previous??(local.z> -5.55?7.85:5.46);
  local.x=(flatX+h*sr)/(cr*cruiseScale);local.z=(flatZ-(local.x*cruiseScale*sr+h*cr)*sp)/(cp*cruiseScale);
 }
 return local;
}
