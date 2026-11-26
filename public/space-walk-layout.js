// Pohang City lists a 60 × 57 × 25 m steel sculpture and a 1.2 m stair and rail.
export const hill={x:1128,z:-1118};
const centerY=34;
export const parkRoad=[[376,-825],[432,-907],[574,-957],[704,-970],[822,-994],[947,-1031],[1031,-1053],[1083,-1085],[1100,-1101]].map(([x,z])=>({x,z}));
export const parkEntry={x:hill.x-27,z:hill.z+18};
export function hillFloor(p){
 const r=Math.hypot((p.x-hill.x)/160,(p.z-hill.z)/95),u=Math.max(0,Math.min(1,(1-r)/.61));
 return 1.85+(centerY-1.85)*u*u*(3-2*u);
}
function smoothPath(vertices,count){
 const out=[];
 for(let i=0;i<=count;i++){
  const f=i/count*(vertices.length-1),j=Math.min(vertices.length-2,Math.floor(f)),u=f-j;
  const a=vertices[Math.max(j-1,0)],b=vertices[j],c=vertices[j+1],d=vertices[Math.min(j+2,vertices.length-1)];
  const q=b.map((v,k)=>.5*((2*v)+(-a[k]+c[k])*u+(2*a[k]-5*v+4*c[k]-d[k])*u*u+(-a[k]+3*v-3*c[k]+d[k])*u*u*u));
  out.push({x:hill.x+q[0],z:hill.z+q[1],h:centerY+q[2]});
 }
 return out;
}
// Stair ends meet the edge of each level landing. These measurements also set
// the openings in its guardrails and its walkable footprint.
export const stairHalfWidth=.60;
export const landings=[
 {x:hill.x-4,z:hill.z+8,h:centerY+7.3,halfX:1.9,halfZ:1.8,ports:{west:"walk",east:"walk",north:"walk"}},
 {x:hill.x+.8,z:hill.z,h:centerY+5,halfX:2.1,halfZ:1.8,ports:{north:"walk",south:"walk",east:"loop",west:"loop"}}
];
function port(deck,direction){
 const x=deck.x-hill.x,z=deck.z-hill.z,h=deck.h-centerY;
 if(direction==="west")return [x-deck.halfX,z,h];
 if(direction==="east")return [x+deck.halfX,z,h];
 return [x,z+(direction==="south"?deck.halfZ:-deck.halfZ),h];
}
const [fork,turnaround]=landings;
export const tracks=[
 smoothPath([[-27,18,0],[-23,19,.7],[-17,15,2.8],[-11,9.8,5.7],[-7.6,8,7.24],port(fork,"west")],76),
 smoothPath([port(fork,"east"),[0,8,7.36],[2,15,8.7],[10,25,11],[24,19,14],[28,4,16],[24,-13,18],[13,-24,18.7],[0,-26,16],[-8,-18,13],[-7,-8,9],[.8,-3.8,5.12],port(turnaround,"north")],233),
 smoothPath([port(fork,"north"),[-4,4.4,7.38],[-12,2.5,8.7],[-23,1,10],[-28,-10,12],[-22,-22,14],[-9,-24,17],[6,-15,20],[14,-1,22],[12,9,18],[6,8.5,12],[1.3,6.1,7.1],[.8,3.8,5.2],port(turnaround,"south")],245)
];
// Only the ascending steel loop beyond the two side gates is ornamental.
export const loop=Array.from({length:164},(_,i)=>{const u=i/163,a=u*Math.PI*2;return {x:turnaround.x+turnaround.halfX*(1-2*u)+10*Math.sin(a),z:turnaround.z+1.6*Math.sin(a),h:turnaround.h+10*(1-Math.cos(a))};});
function projected(p,a,b){
 const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
 return {d:Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t),h:a.h??0,t};
}
export function inPark(p){
 if(Math.abs(p.x-hill.x)<130&&Math.abs(p.z-hill.z)<80)return true;
 return parkRoad.some((q,i)=>i&&projected(p,parkRoad[i-1],q).d<8);
}
export function parkStep(p,previous,airFeet){
 if(Math.abs(p.x-hill.x)>32||Math.abs(p.z-hill.z)>32)return null;
 const base=hillFloor(p),at=Number.isFinite(previous)?previous:base;
 const airborne=Number.isFinite(airFeet);
 let best=null,min=Infinity;
 for(const d of landings){
  if(Math.abs(p.x-d.x)>d.halfX+.001||Math.abs(p.z-d.z)>d.halfZ+.001)continue;
  if(!airborne&&Math.abs(at-d.h)<=.57)return d.h;
  if(airborne&&d.h<=airFeet+.03)best=Math.max(best??-Infinity,d.h);
 }
 for(const line of tracks)for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i];if(Math.abs(p.x-a.x)>2.5||Math.abs(p.z-a.z)>2.5)continue;
  const q=projected(p,a,b),h=a.h+(b.h-a.h)*q.t;
  if(q.d>stairHalfWidth)continue;
  if(airborne){if(h<=airFeet+.03)best=Math.max(best??-Infinity,h);continue;}
  if(Math.abs(h-at)>.57)continue;
  const cost=q.d+Math.abs(h-at)*.45;if(cost<min){min=cost;best=h;}
 }
 return best;
}
export function parkFloor(p,track){
 if(!inPark(p))return null;
 return Number.isFinite(track)?track:hillFloor(p);
}
