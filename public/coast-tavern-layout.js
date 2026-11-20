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
  const p=tavernPoint(u+(s<2?-1:1)*.99,v+(s%2?1:-1)*.46);
  return {...p,heading:(Math.atan2(center.x-p.x,p.z-center.z)*180/Math.PI+360)%360};
 });
 return {...center,index:i,u,v,name:tavernName+" "+(i+1)+"번",seats,server:tavernPoint(u-Math.sign(u)*.87,v),kitchen:tavernPoint(Math.sign(u)*(i<2?1.75:.9),-6.05)};
});
export const tavernSeatSpot=(table,seat)=>tavernTables[table]?.seats[seat];
export const tavernSeatHeading=(table,seat)=>tavernSeatSpot(table,seat)?.heading;
export function tavernTerrace(p){
 if(Math.abs(p.x-front.x)>17||Math.abs(p.z-front.z)>18)return false;
 const {u,v}=tavernAxes(p);
 return Math.abs(u)<3.7&&v>=-3.60&&v<4.28;
}
export function tavernObstacle(p,height){
 if(height>2.82||!tavernTerrace(p))return false;
 const {u,v}=tavernAxes(p);
 return tavernTables.some(t=>Math.abs(t.u-u)<.71&&Math.abs(t.v-v)<.98);
}
