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
const junction=[-4,8,7.3];
export const tracks=[
 smoothPath([[-27,18,0],[-23,19,.7],[-17,15,2.8],[-10,10,5.7],junction],76),
 smoothPath([junction,[-1,18,9],[10,25,11],[24,19,14],[28,4,16],[24,-13,18],[13,-24,18.7],[0,-26,16],[-8,-18,13],[-7,-6,9.3],[0,0,5]],233),
 smoothPath([junction,[-12,6,8.3],[-23,1,10],[-28,-10,12],[-22,-22,14],[-9,-24,17],[6,-15,20],[14,-1,22],[9,7,19],[3,5,12],[2,0,5]],245)
];
// The vertical loop is visible behind the barriers at both ends.
export const loop=Array.from({length:164},(_,i)=>{const u=i/163,a=u*Math.PI*2;return {x:hill.x+2*u+10*Math.sin(a),z:hill.z+1.6*Math.sin(a),h:centerY+5+10*(1-Math.cos(a))};});
function projected(p,a,b){
 const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
 return {d:Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t),h:a.h??0,t};
}
export function inPark(p){
 if(Math.abs(p.x-hill.x)<130&&Math.abs(p.z-hill.z)<80)return true;
 return parkRoad.some((q,i)=>i&&projected(p,parkRoad[i-1],q).d<8);
}
export function parkStep(p,previous){
 if(Math.abs(p.x-hill.x)>32||Math.abs(p.z-hill.z)>32)return null;
 const base=hillFloor(p),at=Number.isFinite(previous)?previous:base;
 let best=null,min=Infinity;
 for(const line of tracks)for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i];if(Math.abs(p.x-a.x)>2.5||Math.abs(p.z-a.z)>2.5)continue;
  const q=projected(p,a,b),h=a.h+(b.h-a.h)*q.t;
  if(q.d>.60||Math.abs(h-at)>.57)continue;
  const cost=q.d+Math.abs(h-at)*.45;if(cost<min){min=cost;best=h;}
 }
 return best;
}
export function parkFloor(p,track){
 if(!inPark(p))return null;
 return Number.isFinite(track)?track:hillFloor(p);
}
