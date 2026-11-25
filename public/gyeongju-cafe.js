// All fittings use the building's own axes; +z points out through the street door.
export function cafeFittings(room){
 const c=Math.cos(room.yaw),s=Math.sin(room.yaw),w=room.width,d=room.depth;
 const point=(x,z)=>({x:room.x+c*x+s*z,z:room.z-s*x+c*z});
 const local=p=>{
  const x=p.x-room.x,z=p.z-room.z;
  return {x:c*x-s*z,z:s*x+c*z};
 };
 const counter={x:0,z:-d/2+1.35,width:Math.min(w*.62,5.4),depth:.8};
 const tables=(room.id==="store"?[]:[-1,1]).map(side=>{
  const x=side*w*.29,z=.48;
  return {x,z,seats:[-1,1].map(sign=>({x,z:z+sign*.97,yaw:sign===1?Math.PI:0,
   approach:point(x-side*.94,z+sign*.97)}))};
 });
 function blocked(p){
  const q=local(p);
  if(Math.abs(q.x)>w*.5+.24||Math.abs(q.z)>d*.5+.24)return false;
  if(Math.abs(Math.abs(q.x)-w*.5)<.22||Math.abs(q.z+d*.5)<.22||
     Math.abs(q.z-d*.5)<.22&&Math.abs(q.x)>1.09)return true;
  if(Math.abs(q.x-counter.x)<counter.width*.5+.16&&Math.abs(q.z-counter.z)<.56)return true;
  if(room.id==="store"&&Math.abs(q.x)>w/2-1.12&&Math.abs(q.z-.4)<2.50)return true;
  return tables.some(t=>Math.hypot(q.x-t.x,q.z-t.z)<.68||
   t.seats.some(a=>Math.abs(q.x-a.x)<.39&&Math.abs(q.z-a.z)<.36));
 }
 return {point,local,tables,counter,door:point(0,d*.5),order:point(counter.x,counter.z+1.1),blocked};
}
