import {jeongdongChurchEntry,seoulCathedralEntry} from "./seoul-worship-entries.js";

function chapel(id,entry,x,width,depth,rows){
  const y=515,point=(dx,dz)=>({x:x+dx,y:y+dz});
  const pews=rows.flatMap(z=>[-1,1].map(side=>({
    x:side*width*.235,z,w:width*.30,d:.84
  })));
  const columns=id==="seoul-cathedral"?rows.flatMap(z=>[-1,1].map(side=>({x:side*width*.415,z}))):[];
  const prayerPoint={...point(0,-depth/2+5),heading:0};
  return {...entry,id,area:"jeongdong",center:{x,y},width,depth,pews,columns,prayerPoint,
    bounds:{minX:x-width/2,maxX:x+width/2,minY:y-depth/2,maxY:y+depth/2},
    insideDoor:{...point(0,depth/2-1.1),heading:180},
    insideSpawn:{...point(0,depth/2-3.8),heading:0},
    enterLabel:id==="seoul-cathedral"?"성당 들어가기":"예배당 들어가기",exitLabel:"나가기"};
}

export const chapels=[
  chapel("jeongdong-chapel",jeongdongChurchEntry,1300,13,20,[-2.8,-.6,1.6,3.8]),
  chapel("seoul-cathedral",seoulCathedralEntry,1350,17,27,[-5.4,-3.1,-.8,1.5,3.8,6.1])
];
export const chapelById=Object.fromEntries(chapels.map(v=>[v.id,v]));

export function registerChapelObstacles(add){
  for(const {center,width,depth,pews,columns} of chapels){
    const block=(x,z,w,d,h)=>add(center.x+x,center.y+z,w,d,0,h);
    for(const side of [-1,1]){
      block(side*width/2,0,.3,depth,Infinity);
      block(0,side*depth/2,width,.3,Infinity);
    }
    for(const {x,z,w,d} of pews)block(x,z,w,d,1.04);
    for(const {x,z} of columns)block(x,z,1,1,Infinity);
    block(0,-depth/2+1.55,3.6,1.1,1.24);
  }
}
