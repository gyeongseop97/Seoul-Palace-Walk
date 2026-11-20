import {sandEdge,cycleX} from "./pohang-beach-profile.js";
import {swimwearOptions} from "./beach-swimming.js";

const coastBearing=z=>Math.atan2(sandEdge(z+1)-sandEdge(z-1),2);
function station(id,kind,name,z){
 const yaw=coastBearing(z),edge=sandEdge(z),x=Math.min(edge-4.6,Math.max(cycleX(z)+4.5,edge-7));
 const nx=Math.cos(yaw),nz=-Math.sin(yaw);
 const front=kind==="changing"?1.96:1.30;
 return {id,kind,name,x,z,yaw,entry:{x:x+nx*front,z:z+nz*front}};
}
export const amenities=[
 station("north-change","changing","북측 탈의실",-483),
 station("north-rinse","rinse","북측 발 씻는 곳",-469),
 station("south-change","changing","해변 탈의실",107),
 station("south-rinse","rinse","해변 발 씻는 곳",120)
];
export const rinseDuration=5600;
export const nearbyAmenity=(p,kind)=>amenities.find(a=>a.kind===kind&&Math.hypot(p.x-a.entry.x,p.z-a.entry.z)<2.55);
export function amenityObstacle(p){
 for(const a of amenities){
  if(Math.abs(a.x-p.x)>4||Math.abs(a.z-p.z)>4)continue;
  const dx=p.x-a.x,dz=p.z-a.z,across=dx*Math.cos(a.yaw)-dz*Math.sin(a.yaw),along=dx*Math.sin(a.yaw)+dz*Math.cos(a.yaw);
  if(a.kind==="changing"){
   if(Math.abs(across+.98)<.22&&Math.abs(along)<2.4)return true;
   if(Math.abs(Math.abs(along)-2.18)<.18&&across>-1.05&&across<1.25)return true;
   if(across>-.97&&across<1.20&&Math.abs(along)<.18)return true;
  }else if(Math.abs(along)<.40&&Math.abs(across)<.35)return true;
 }
 return false;
}
export function changingRoom(current,choose){
 const dialog=document.getElementById("beach-changing"),list=document.getElementById("beach-swimwear");
 list.replaceChildren();
 for(const [id,label] of [[null,"원래 옷으로"],...Object.entries(swimwearOptions).map(([id,o])=>[id,o.name])]){
  const btn=document.createElement("button");btn.type="button";btn.textContent=label;
  btn.className="quiet";btn.setAttribute("aria-pressed",String((current??null)===id));
  btn.onclick=()=>{dialog.close();choose(id);};list.append(btn);
 }
 dialog.showModal();
}
