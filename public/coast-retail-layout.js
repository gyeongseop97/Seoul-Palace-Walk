import map from "./pohang-geography.js";

// Each entry uses the face of the mapped building that opens onto its named street.
// The last coordinate pair is a point on the surveyed road centre line (metres east/south).
function storefront(block,edge,road,roadWidth,details){
 const ring=map.blocks[block][1],a=ring[edge],b=ring[(edge+1)%ring.length];
 const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,width=Math.hypot(b[0]-a[0],b[1]-a[1]);
 let nx=(b[1]-a[1])/width,nz=(a[0]-b[0])/width;
 if((road[0]-x)*nx+(road[1]-z)*nz<0){nx=-nx;nz=-nz;}
 const depth=(road[0]-x)*nx+(road[1]-z)*nz-roadWidth/2;
 const point=(u,v)=>({x:x+nz*u+nx*v,z:z-nx*u+nz*v});
 const doorX=details.upstairs?-3.7:-2.6;
 return {...details,block,x,z,nx,nz,yaw:Math.atan2(nx,nz),width:Math.min(width-.8,12.5),depth,point,doorX,entry:point(doorX,1.38)};
}
export const coastalRetail=[
 storefront(251,1,[16.27,-251.69],10,{id:"snow-cafe",name:"영일 눈꽃다방",actionLabel:"카페 메뉴 보기",kind:"bingsu",stock:["bingsu","coffee","cake"],upstairs:true}),
 storefront(282,2,[135.18,-507.23],10,{id:"shore-lounge",name:"파도 라운지",actionLabel:"라운지 메뉴 보기",kind:"highball",stock:["highball","wine","beer"],upstairs:true}),
 storefront(377,1,[70.98,-536.46],8,{id:"duho-grill",name:"두호 그릴펍",actionLabel:"그릴펍 메뉴 보기",kind:"beer",stock:["beer","stationBurger","highball"]})
];
export const coastalRetailBlocks=new Set(coastalRetail.map(s=>s.block));
// OSM way 1305750384 continues Samho-ro beyond the junction where the original survey stopped.
export const samhoRoad=[[41.7,-472.4],[85.3,-567.8],[93.9,-586.1],[101.1,-599.8],[107.7,-611.1],[114.4,-621.5],[122.3,-632.6],[128.1,-640],[133.2,-646.4],[144.5,-659.7],[156.9,-674.2],[206.2,-728],[238.5,-762]];
export function onRetailApron(p){
 return coastalRetail.some(s=>{
  const dx=p.x-s.x,dz=p.z-s.z;
  if(Math.abs(dx)>25||Math.abs(dz)>25)return false;
  const v=dx*s.nx+dz*s.nz;
  return v>=.05&&v<=s.depth+1.35&&Math.abs(dx*s.nz-dz*s.nx)<s.width*.5;
 });
}
