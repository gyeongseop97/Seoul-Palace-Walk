import geo from "./pohang-geography.js";

// Naver operator listing 642298, 107 Haean-ro. The business pin falls in this narrow
// block. Recessing the open terrace keeps its 16 seats on the land side of the road.
export const tavernBlockIndex=274,tavernEdge=2,tavernName="영일만 회·조개구이";
const ring=geo.blocks[tavernBlockIndex][1],[a,b]=[ring[3],ring[2]];
const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
const nx=(b[1]-a[1])/length,nz=(a[0]-b[0])/length;
export const tavernYaw=Math.atan2(nx,nz),front={x:(a[0]+b[0])/2,z:(a[1]+b[1])/2};
export const tavernPoint=(u,v)=>({x:front.x+nz*u+nx*v,z:front.z-nx*u+nz*v});
export function tavernAxes(p){return {u:(p.x-front.x)*nz-(p.z-front.z)*nx,v:(p.x-front.x)*nx+(p.z-front.z)*nz};}
export const tavernDoor=tavernPoint(0,-3.7);
export const tavernArrival={...tavernPoint(0,3.85),heading:(360-tavernYaw*180/Math.PI)%360};
export const tavernStoolTop=1.97+.46+.095/2;
export const tavernTables=[[-1.8,1.94],[1.8,1.94],[-1.8,-1.43],[1.8,-1.43]].map(([u,v],i)=>{
 const center=tavernPoint(u,v);
 const seats=Array.from({length:4},(_,s)=>{
  const p=tavernPoint(u+(s<2?-1:1)*.67,v+(s%2?1:-1)*.35);
  return {...p,heading:(Math.atan2(center.x-p.x,p.z-center.z)*180/Math.PI+360)%360};
 });
 return {...center,index:i,u,v,name:tavernName+" "+(i+1)+"번",seats,server:tavernPoint(u-Math.sign(u)*.87,v),kitchen:tavernPoint(Math.sign(u)*(i<2?1.75:.9),-6.05)};
});
export const tavernSeatSpot=(table,seat)=>tavernTables[table]?.seats[seat];
export function tavernPlateOffset(seat){return {u:(seat<2?-1:1)*.33,v:(seat%2?1:-1)*.34};}
export function tavernDiningPlate(seat){
 const table=tavernTables[Math.floor(seat/4)];
 if(!table||!Number.isInteger(seat))return null;
 const {u,v}=tavernPlateOffset(seat%4);
 return {...tavernPoint(table.u+u,table.v+v),h:1.97+.873,tableX:table.x,tableZ:table.z};
}
export const tavernSeatReach=1.65;
export function nearestTavernSeat(p,occupied){
 let best=null,reach=tavernSeatReach;
 for(const table of tavernTables)for(const [seat,spot] of table.seats.entries()){
  const id=table.index*4+seat,gap=Math.hypot(p.x-spot.x,p.z-spot.z);
  if(!occupied.has(id)&&gap<reach){best={table:table.index,seat,id,spot};reach=gap;}
 }
 return best;
}
export const tavernSeatHeading=(table,seat)=>tavernSeatSpot(table,seat)?.heading;
export function tavernTerrace(p){
 if(Math.abs(p.x-front.x)>17||Math.abs(p.z-front.z)>18)return false;
 const {u,v}=tavernAxes(p);
 return Math.abs(u)<3.7&&v>=-3.60&&v<4.28;
}
export function tavernObstacle(p,height){
 if(height>2.82||!tavernTerrace(p))return false;
 const {u,v}=tavernAxes(p);
 return tavernTables.some(t=>Math.abs(t.u-u)<.50&&Math.abs(t.v-v)<.89);
}
