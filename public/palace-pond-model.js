import {pondWater} from "./water-shader.js";
import {pondBankStones} from "./pond-stones.js";

// Deoksugung's garden pond, with its surveyed waterline, stone edge and planted islet.
export function buildPalacePond(T,{outline,x,y,island},{plot,matte,lawn,placed,decorate,rand}){
 const bank=outline.map(p=>{
  const dx=p.x-x,dy=p.y-y,scale=1+.42/(Math.hypot(dx,dy)||1);
  return {x:x+dx*scale,y:y+dy*scale};
 });
 plot(bank,matte(0x7e8070),.026);
 const water=pondWater(T),lake=plot(outline,water,.043);
 lake.userData.followTerrain=false;lake.userData.terrainAnchor={x,y};
 const shore=outline.map((p,i)=>placed({x:p.x+(bank[i].x-p.x)*.42,y:p.y+(bank[i].y-p.y)*.42}));
 const stones=pondBankStones(T,shore,placed({x,y}),rand);
 stones.userData.terrainAnchor=lake.userData.terrainAnchor;
 lake.parent.add(stones);
 if(island){
  function islandOutline(scale){
   return Array.from({length:20},(_,i)=>{
    const angle=i*Math.PI/10,r=scale*(1+.064*Math.sin(angle*3+.4));
    return {x:island.x+Math.cos(angle)*island.radiusX*r,y:island.y+Math.sin(angle)*island.radiusY*r};
   });
  }
  plot(islandOutline(1),matte(0x888873),.105);
  plot(islandOutline(.85),lawn,.134);
  const centre=placed(island);
  for(let i=0;i<4;i++){
   const angle=i*2.39996;
   decorate(i%2?0x718152:0x586945,centre.x+Math.cos(angle)*.72,.29+i*.03,centre.z+Math.sin(angle)*.55,.53,.34,.46,angle);
  }
 }
 return water;
}
