import {pondWater} from "./water-shader.js";

// Deoksugung's garden pond, with its surveyed waterline, stone edge and planted islet.
export function buildPalacePond(T,{outline,x,y,island},{plot,matte,lawn,placed,line,decorate,rand}){
 const bank=outline.map(p=>{
  const dx=p.x-x,dy=p.y-y,scale=1+.72/(Math.hypot(dx,dy)||1);
  return {x:x+dx*scale,y:y+dy*scale};
 });
 plot(bank,matte(0x7e8070),.026);
 const water=pondWater(T),lake=plot(outline,water,.043);
 lake.userData.followTerrain=false;lake.userData.terrainAnchor={x,y};
 const stone=[0x939188,0xa19e92,0x807f76,0xb7b0a4,0x9e9b90];
 for(let i=0;i<bank.length;i++){
  const edge=line(bank[i],bank[(i+1)%bank.length]),count=Math.ceil(edge.len/.76);
  for(let j=0;j<count;j++){
   const point=edge.at((j+.5)/count,(rand()-.5)*.18);
   decorate(stone[j%stone.length],point.x,.084,point.z,.38+rand()*.17,.115+rand()*.10,.27+rand()*.13,rand()*6.28);
  }
 }
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
