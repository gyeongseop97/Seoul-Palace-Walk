// The drawn lawn, path overlays and walkers all use the same two triangles per cell.
export const templeOrigin={x:(129.3321-129.212)*90300,z:(35.836-35.7900)*111100};
export const templePoint=([x,z])=>({x:x+templeOrigin.x,z:z+templeOrigin.z});
const c=Math.cos(.15),s=Math.sin(.15);
export const templeAxis=(u,v)=>templePoint([u*c+v*s,-u*s+v*c]);
export function templeAxes(p){
 const x=p.x-templeOrigin.x,z=p.z-templeOrigin.z;
 return {u:x*c-z*s,v:x*s+z*c};
}
export const groundU=[-750,-245,-200,-90,-68,-56,-49.5,-44.1,-32,-24,-4.3,3,19,31,72,160,210,750];
export const groundV=[-650,-210,-155,-58,-34,20,20.99,21.02,40,105,245,460,850];
const clamp=n=>Math.max(0,Math.min(1,n));
function elevation(u,v){
 const terrace=(3.1+1.9*clamp((u+32)/8))*clamp((40-v)/20);
 const sideRamp=Math.max(clamp((-56-u)/12),clamp((u-19)/12));
 const level=terrace*(v<=21?1:sideRamp)+2.5*clamp((-v-34)/24);
 return level*clamp((u+245)/45)*clamp((210-u)/50)*clamp((v+210)/55);
}
const hillsideRadius=angle=>690*.86*(1.05+.04*Math.sin(5*angle))-1;
export const lawnEdge=Array.from({length:100},(_,i)=>{
 const a=i*Math.PI/50,r=hillsideRadius(a);
 return templePoint([Math.cos(a)*r,130+Math.sin(a)*r]);
});
export function insideTempleGround(p){
 const x=p.x-templeOrigin.x,z=p.z-templeOrigin.z-130,d=x*x+z*z;
 if(d<590*590)return true;
 if(d>650*650)return false;
 // The foot of the first visible hill ring is the edge of the playable lawn.
 const radius=hillsideRadius(Math.atan2(z,x));
 return d<=radius*radius;
}
function cell(grid,n){
 let i=0;
 while(i<grid.length-2&&n>grid[i+1])i++;
 return i;
}
const heights=groundU.map(u=>groundV.map(v=>elevation(u,v)));
export function groundHeightAt(u,v){
 const i=cell(groundU,u),j=cell(groundV,v);
 const l=groundU[i],r=groundU[i+1],t=groundV[j],b=groundV[j+1];
 const x=clamp((u-l)/(r-l)),z=clamp((v-t)/(b-t));
 const nw=heights[i][j],se=heights[i+1][j+1];
 return x>=z?nw*(1-x)+heights[i+1][j]*(x-z)+se*z:nw*(1-z)+heights[i][j+1]*(z-x)+se*x;
}
function cut(polygon,distance){
 if(!polygon.length)return [];
 const out=[];
 let a=polygon.at(-1),da=distance(a);
 for(const b of polygon){
  const db=distance(b);
  if((da<0)!==(db<0)){
   const f=da/(da-db);
   out.push({u:a.u+(b.u-a.u)*f,v:a.v+(b.v-a.v)*f});
  }
  if(db>=0)out.push(b);
  a=b;da=db;
 }
 return out;
}
// Cut each path at every change of slope, including the diagonal through a sloped cell.
// Merely sampling the path endpoints can draw a ramp several metres above a level lawn.
export function drapeGround(points,emit){
 const poly=points.map(templeAxes),us=poly.map(p=>p.u),vs=poly.map(p=>p.v);
 const minU=Math.min(...us),maxU=Math.max(...us),minV=Math.min(...vs),maxV=Math.max(...vs);
 for(let i=cell(groundU,minU);i<=cell(groundU,maxU);i++){
  const l=groundU[i],r=groundU[i+1];
  const column=cut(cut(poly,p=>p.u-l),p=>r-p.u);
  if(column.length<3)continue;
  for(let j=cell(groundV,minV);j<=cell(groundV,maxV);j++){
   const t=groundV[j],b=groundV[j+1];
   const row=cut(cut(column,p=>p.v-t),p=>b-p.v);
   if(row.length<3)continue;
   const diagonal=p=>(p.u-l)/(r-l)-(p.v-t)/(b-t);
   for(const side of [1,-1]){
    const part=cut(row,p=>side*diagonal(p));
    if(part.length<3)continue;
    const indices=[];
    for(let k=2;k<part.length;k++){
     const a=part[0],d=part[k-1],e=part[k];
     const area=(d.u-a.u)*(e.v-a.v)-(d.v-a.v)*(e.u-a.u);
     if(Math.abs(area)>1e-8)indices.push(0,k-1,k);
    }
    if(indices.length)emit(part,indices);
   }
  }
 }
}
export function drapePath(path,emit){
 const sides=path.points.map((p,i,line)=>{
  const a=line[Math.max(0,i-1)],b=line[Math.min(i+1,line.length-1)];
  const d=Math.hypot(b.x-a.x,b.z-a.z)||1;
  const dx=(b.z-a.z)/d*path.width/2,dz=(a.x-b.x)/d*path.width/2;
  return [{x:p.x+dx,z:p.z+dz},{x:p.x-dx,z:p.z-dz}];
 });
 for(let i=1;i<sides.length;i++)drapeGround([...sides[i-1],sides[i][1],sides[i][0]],emit);
}
