import * as T from "three";
import {roads,buildings,mounds,parks,walls,places,woljeongBridge} from "./gyeongju-layout.js";
import {drawWoljeong,woljeongFooting} from "./woljeong-model.js";
import {createRaftScene,drawRaftPiers} from "./gyeongju-raft-model.js";
import {RAFT_DECK_HEIGHT,raftHeave,raftPierHeight} from "./gyeongju-raft-layout.js";
import {isRaftBus} from "./bus-network.js";
import {gyeongjuPlantings} from "./gyeongju-planting-layout.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {buildPalacePond} from "./palace-pond-model.js";
import {pondWater,tickWater} from "./water-shader.js";
import {marketRooms,marketBenches,marketCameraBlocked} from "./gyeongju-market.js";
import {drawMarket,createMarketStaff} from "./gyeongju-market-model.js";
import {drawGyeongjuBikeDocks} from "./gyeongju-bike-model.js";
import {tower,insideObservatory,observatoryCameraBlocked} from "./gyeongju-observatory.js";
import {districtMeshes,randomSeed} from "./gyeongju-mesh.js";
import {drawBuilding,illuminatedRoofMaterial} from "./gyeongju-architecture.js";
import {observatory,magnolia,stationHall,busShelter,stoneGate} from "./gyeongju-landmarks.js";
import {buildCoastActionMarker} from "./coast-action-marker.js";
import {twinTombName,twinHeight,inCheonmaHall,cheonmaLocal} from "./daereungwon.js";
import {drawTwinTomb,drawCheonma,drawMichu} from "./daereungwon-model.js";

const stationSide=x=>x < -3000;
const footbridge=woljeongFooting(woljeongBridge);
const grass=0x96a966;
function roadIndex(lines){
 const cells=new Map(),unit=46,key=(i,j)=>i+":"+j;
 for(const road of lines){
  if(!["street","lane","sidewalk","path"].includes(road.kind))continue;
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,d=dx*dx+dz*dz;
   if(d<.01)continue;
   const seg={a,dx,dz,d,road};
   for(let u=Math.floor((Math.min(a.x,b.x)-30)/unit);u<=Math.floor((Math.max(a.x,b.x)+30)/unit);u++){
    for(let v=Math.floor((Math.min(a.z,b.z)-30)/unit);v<=Math.floor((Math.max(a.z,b.z)+30)/unit);v++){
     const id=key(u,v);let list=cells.get(id);if(!list)cells.set(id,list=[]);list.push(seg);
    }
   }
  }
 }
 return function nearest(x,z){
  let closest=null,best=Infinity;
  for(const s of cells.get(key(Math.floor(x/unit),Math.floor(z/unit)))??[]){
   const t=Math.max(0,Math.min(1,((x-s.a.x)*s.dx+(z-s.a.z)*s.dz)/s.d));
   const px=s.a.x+t*s.dx,pz=s.a.z+t*s.dz,gap=(x-px)**2+(z-pz)**2;
   if(gap<best){best=gap;closest={x:px,z:pz,gap:Math.sqrt(gap),width:s.road.width};}
  }
  return closest;
 };
}
function terrain(k,centerX,centerZ,w,d){
 k.polygon([{x:centerX-w,z:centerZ-d},{x:centerX+w,z:centerZ-d},{x:centerX+w,z:centerZ+d},{x:centerX-w,z:centerZ+d}],-.091,grass,"grass");
}
function hills(k,x,z,r,seed){
 const rng=randomSeed(seed),count=100;
 for(let band=0;band<2;band++){
  const phase=rng()*3,ring=[];
  for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2,radius=r*(1.05+.16*band+.04*Math.sin(5*a));
   const h=(.48+.21*Math.sin(a*5+phase)+.13*Math.cos(a*8+phase)+.07*Math.sin(17*a)+rng()*.03)*r*(band?.22:.145);
   ring.push([x+Math.cos(a)*radius,h,z+Math.sin(a)*radius]);
  }
  for(let i=0;i<count;i++){
   const a=ring[i],b=ring[(i+1)%count];
   k.face([[x+(a[0]-x)*.86,-2,z+(a[2]-z)*.86],a,b,[x+(b[0]-x)*.86,-2,z+(b[2]-z)*.86]],[0,1,2,0,2,3],band?0x89998a:0x76896c);
  }
 }
}
function drawRoad(k,r){
 const p=r.points,w=r.width;
 if(r.kind==="interior")return;
 if(r.kind==="crossing"){
  for(let i=1;i<p.length;i++){
   const a=p[i-1],b=p[i],dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz);
   for(let l=.45;l<n-.2;l+=1.13){
    k.piece(a.x+dx*l/n,.037,a.z+dz*l/n,Math.min(w,4),.018,.47,0xe5dfcb,Math.atan2(dx,dz));
   }
  }
  return;
 }
 const surface={street:[0x868783,.011],lane:[0xb6ada0,.017,"pavers"],path:[0xcbb796,.021,"dirt"],footbridge:[0xa99371,.11,"pavers"],
  sidewalk:[0xc0b8a9,.026,"pavers"],platform:[0xc4c0b6,.013,"pavers"]}[r.kind];
 if(!surface)return;
 k.strip(p,w,surface[1],surface[0],surface[2]);
 if(r.kind==="street"&&w>=10){
  for(let i=1;i<p.length;i++){
   const a=p[i-1],b=p[i],dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
   for(let l=2;l<n-1;l+=10)k.piece(a.x+l*dx/n,.025,a.z+l*dz/n,.12,.012,Math.min(3,n-l),0xdcb878,yaw);
  }
 }
}
function grassyMound(k,m,index){
 const vertices=[],ix=[],rings=12,sides=52,c=Math.cos(m.yaw),s=Math.sin(m.yaw);
 for(let j=0;j<=rings;j++){
  const a=(j/rings)*Math.PI/2,rad=Math.sin(a),h=m.height*Math.cos(a)**2;
  for(let i=0;i<=sides;i++){
   const theta=i/sides*Math.PI*2,dx=rad*m.rx*Math.cos(theta),dz=rad*m.rz*Math.sin(theta);
   vertices.push([m.x+c*dx+s*dz,h-.065,m.z-s*dx+c*dz]);
   if(i<sides&&j<rings){const t=j*(sides+1)+i;ix.push(t,t+1,t+sides+1,t+1,t+sides+2,t+sides+1);}
  }
 }
 k.face(vertices,ix,[0x8eac63,0x97ad69,0x9db272,0x9ab069][index%4],"grass");
}
function drawWall(k,wall){
 for(let i=1;i<wall.points.length;i++){
  const a=wall.points[i-1],b=wall.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
  if(len<.05)continue;
  const yaw=Math.atan2(-dz,dx),n=Math.ceil(len/3.7),fence=wall.kind==="fence";
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,x=a.x+t*dx,z=a.z+t*dz,width=len/n;
   if([places.northGate,places.mainGate].some(g=>Math.hypot(g.x-x,g.z-z)<4))continue;
   if(fence){
    k.piece(x,1.02,z,width+.04,.11,.10,0x775c47,yaw);
    k.piece(x,.57,z,width+.04,.10,.10,0x775c47,yaw);
    k.piece(x,.66,z,.13,1.32,.13,0x6d513e,yaw);
   }else{
    k.piece(x,.66,z,width+.02,1.32,.48,0xbcae98,yaw);
    k.piece(x,.47,z,width+.02,.025,.489,0x938b79,yaw);
    k.piece(x,.92,z,width+.02,.023,.489,0x938b79,yaw);
    k.piece(x,1.31,z,width+.046,.19,.65,0x666b65,yaw);
    k.piece(x,1.43,z,width+.03,.12,.31,0x74776d,yaw);
   }
  }
 }
}
function contains(p,polygon){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
}
function waterFeature(root,k,park,rng){
 const outline=park.points.map(({x,z})=>({x,y:z}));
 function plot(points,material,y){
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x,-p.y)));
  const mesh=new T.Mesh(new T.ShapeGeometry(shape),material);
  mesh.rotation.x=-Math.PI/2;mesh.position.y=y;root.add(mesh);return mesh;
 }
 if(park.name==="남천"){
  const water=pondWater(T);plot(outline,water,.018);return water;
 }
 const x=outline.reduce((n,p)=>n+p.x,0)/outline.length,y=outline.reduce((n,p)=>n+p.y,0)/outline.length;
 const placed=p=>({x:p.x,z:p.y});
 const line=(a,b)=>{
  const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);
  return {len,at:(t,o=0)=>({x:a.x+dx*t+dz/len*o,z:a.y+dz*t-dx/len*o})};
 };
 return buildPalacePond(T,{x,y,outline},{plot,placed,line,rand:rng,
  matte:color=>new T.MeshStandardMaterial({color,roughness:.86}),
  decorate:(color,x,y,z,w,h,d,yaw)=>k.crown(x,y,z,w,h,d,color,yaw)});
}
function busYaw(p,nearest){
 const r=nearest(p.x,p.z);return r?Math.atan2(r.x-p.x,r.z-p.z):Math.PI*.7;
}
function streetFurniture(k,p,nearest,isStation,glowMat,bulb){
 const lines=roads.filter(r=>r.kind==="street"&&r.points[0].x>-3000&&
  (r.name==="포석로"||r.name==="태종로"||r.name==="계림로"));
 const points=[];
 if(isStation){
  const yaw=2.53,s=Math.sin(yaw),c=Math.cos(yaw);
  for(const u of [-27,-9,9,27])points.push({x:p.x+u*c+18*s,z:p.z-u*s+18*c});
 }else{
  for(const r of lines){
   let next=16;
   for(let i=1;i<r.points.length;i++){
    const a=r.points[i-1],b=r.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    if(!len)continue;
    const width=r.width*.5+2.1;
    while(next<len){
     const x=a.x+dx*next/len+dz*width/len,z=a.z+dz*next/len-dx*width/len;
     points.push({x,z});next+=33;
    }
    next-=len;
   }
  }
 }
 for(const [i,{x,z}] of points.entries()){
  const h=isStation?5.9:4.1,b=isStation?.36:.24;
  k.column(x,.22,z,.28,.44,.28,0x696a61);
  k.column(x,h*.48,z,.105,h*.96,.105,0x525e59);
  k.column(x,h-.22,z,b*.87,.18,b*.87,0x505953);
  k.geo(bulb,x,h,z,b,.29,b,0xffe3af,0,glowMat);
  k.piece(x,h+.17,z,b+.12,.10,b+.12,0x55605b);
  if(isStation||i%4!==0)continue;
  const q=nearest(x,z),dx=q?x-q.x:1,dz=q?z-q.z:1,n=Math.hypot(dx,dz)||1;
  const cx=x+dx/n*.65,cz=z+dz/n*.65;
  k.column(cx,.22,cz,.66,.44,.66,0xa79479);
  k.crown(cx,.62,cz,.33,.27,.33,0x748857,i);
 }
}
function obstacleGrid(){
 const cells=new Map(),size=32,tag=(x,z)=>Math.floor(x/size)+":"+Math.floor(z/size);
 for(const b of buildings){
  if(b.kind==="cafe"||b.kind==="market"||b.kind==="gate"||b.kind==="observatory")continue;
  const xs=b.points.map(p=>p.x),zs=b.points.map(p=>p.z),bound={x0:Math.min(...xs),x1:Math.max(...xs),z0:Math.min(...zs),z1:Math.max(...zs)};
  for(let x=Math.floor(bound.x0/size);x<=Math.floor(bound.x1/size);x++)for(let z=Math.floor(bound.z0/size);z<=Math.floor(bound.z1/size);z++){
   const id=x+":"+z;let list=cells.get(id);if(!list)cells.set(id,list=[]);list.push(b);
  }
 }
 return p=>(cells.get(tag(p.x,p.z))??[]).some(b=>contains(p,b.points));
}
function buildDistrict(root,isStation,kit,glowMat,bulb,waterMaterials,bridgeRoof){
 const k=districtMeshes(root),relevant=x=>stationSide(x)===isStation;
 const lines=roads.filter(r=>relevant(r.points[0].x)),nearest=roadIndex(lines),rng=randomSeed(2155);
 if(isStation){
  terrain(k,-6530,4150,840,840);hills(k,-6530,4150,545,658);
  const at=places.stationExit;
  k.polygon([{x:at.x-80,z:at.z-90},{x:at.x+94,z:at.z-75},{x:at.x+93,z:at.z+35},{x:at.x-62,z:at.z+74}],-.034,0xb8b4a7,"pavers");
  stationHall(k,at);busShelter(k,places.stationBus,busYaw(places.stationBus,nearest),"경주역");
  for(const side of [-1,1])for(let i=0;i<6;i++){
   const u=side*(18+i*5.7),v=9+(i%2)*2,angle=2.53;
   const x=at.x+u*Math.cos(angle)+v*Math.sin(angle),z=at.z-u*Math.sin(angle)+v*Math.cos(angle);
   k.piece(x,.21,z,2.1,.40,1.55,0xb5b0a4,angle);
  }
 }else{
  terrain(k,240,150,1950,1800);hills(k,240,150,1620,821);
  for(const p of parks){
   if(!relevant(p.points[0].x))continue;
   if(p.kind==="water"){waterMaterials.push(waterFeature(root,k,p,rng));continue;}
   k.polygon(p.points,-.045,p.kind==="wood"?0x879858:0x9cb16d,"grass");
  }
  mounds.forEach((m,i)=>{
   if(m.name===twinTombName)drawTwinTomb(k,m);
   else if(m.name==="천마총")drawCheonma(k,glowMat);
   else grassyMound(k,m,i);
  });
  drawMichu(k);
  for(const wall of walls)drawWall(k,wall);
  for(const room of marketRooms)drawMarket(k,room);
  drawGyeongjuBikeDocks(k,kit);
  observatory(k,places.cheomseongdae);magnolia(k,places.magnolia);
  drawWoljeong(k,footbridge,glowMat,bridgeRoof);
  drawRaftPiers(k);
  stoneGate(k,places.northGate,-.25,false);stoneGate(k,places.mainGate,-.64,true);
  busShelter(k,places.townBus,busYaw(places.townBus,nearest),"천마총후문 · 황리단길");
  busShelter(k,places.townReturnBus,busYaw(places.townReturnBus,nearest),"경주역 방면");
 }
 lines.forEach(r=>drawRoad(k,r));
 const treeKit=makeTreeBuilder(T,null,{snapshotPart:k.treePart,rand:rng,clearance:{meshFits:()=>true,trim:()=>true}});
 for(const tree of gyeongjuPlantings(parks,roads,places.stationExit,mounds).trees)if(relevant(tree.x))treeKit.grow(tree.x,tree.z,tree);
 streetFurniture(k,places.stationExit,nearest,isStation,glowMat,bulb);
 buildings.forEach((b,i)=>{if(b.kind==="building"&&relevant(b.points[0].x))drawBuilding(k,b,i,nearest);});
 k.finish();
}
export function createGyeongjuScene(outdoors,origin,kit,walkerModels){
 const station=new T.Group(),town=new T.Group(),restaurant=marketRooms.find(r=>r.id==="restaurant");
 let staff;
 const lampMaterial=new T.MeshStandardMaterial({color:0xffe1b5,emissive:0xffcc79,emissiveIntensity:0,roughness:.5});
 const bridgeRoof=illuminatedRoofMaterial();
 const bulb=new T.CylinderGeometry(.5,.45,1,8),insideSolid=obstacleGrid();
 station.name="경주역 광장";town.name="경주 역사유적지구";outdoors.add(station,town);
 const marker=buildCoastActionMarker(outdoors,outdoors,()=>.01);
 const updateRaft=createRaftScene(town);
 let raftLift=0;
 const glow=new T.PointLight(0xffc576,0,28,1.3);glow.position.set(places.cheomseongdae.x+2,3.2,places.cheomseongdae.z+5);town.add(glow);
 const bridgeLight=new T.PointLight(0xffc48a,0,45,1.0);
 bridgeLight.position.set(places.woljeong.x,7,places.woljeong.z);town.add(bridgeLight);
 const displayLamp=new T.PointLight(0xffe7b7,12,10,1.45);
 displayLamp.position.set(-137.75,2.8,-273.6);displayLamp.visible=false;town.add(displayLamp);
 const built=new Set(),lastEye=new T.Vector3(Infinity,0,0),waterMaterials=[];
 function ensure(isStation){
  if(!built.has(isStation)){buildDistrict(isStation?station:town,isStation,kit,lampMaterial,bulb,waterMaterials,bridgeRoof);built.add(isStation);}
  station.visible=isStation;town.visible=!isStation;
 }
 return {benches:marketBenches,surface(world){
   if(isRaftBus(world.bus?.index))return RAFT_DECK_HEIGHT+raftLift;
   const p={x:world.x-origin.x,z:world.y-origin.y};
   return insideObservatory(p)?tower.landing:raftPierHeight(p)||footbridge.surface(p);
  },cameraBlocked(world,y){
   const local={x:world.x-origin.x,z:world.y-origin.y};
   if(inCheonmaHall(local))return y>3.05;
   if(observatoryCameraBlocked(local,y)||footbridge.cameraBlocked(local,y))return true;
   if(y<.04||y>7)return false;
   const p=local;
   if(marketCameraBlocked(p,y))return true;
   if(!stationSide(p.x)){
    for(const m of mounds){
     if(m.name===twinTombName){if(y<twinHeight(m,p))return true;continue;}
     if(m.name==="천마총"){
      const {a,b}=cheonmaLocal(p);
      if(Math.abs(a)<2.7&&b>25&&b<28.5&&y>2.46)return true;
     }
     const dx=p.x-m.x,dz=p.z-m.z,r=Math.max(m.rx,m.rz);
     if(Math.abs(dx)>r||Math.abs(dz)>r)continue;
     const c=Math.cos(m.yaw),s=Math.sin(m.yaw),v=((c*dx-s*dz)/m.rx)**2+((s*dx+c*dz)/m.rz)**2;
     if(v<1&&y<m.height*(1-v))return true;
    }
   }
   return y<4.2&&insideSolid(p);
  },update(state,night,camera){
   const isStation=stationSide(camera.position.x);ensure(isStation);
   displayLamp.visible=!isStation&&Math.hypot(camera.position.x-displayLamp.position.x,camera.position.z-displayLamp.position.z)<38;
   if(!isStation&&Math.hypot(camera.position.x-restaurant.x,camera.position.z-restaurant.z)<55){
    staff??=createMarketStaff(town,kit,walkerModels);
    staff.update(state.clock??Date.now(),state.diningService??[]);
   }
   if(!isStation){
    const clock=state.clock??Date.now();
    raftLift=raftHeave(clock);updateRaft(clock,camera.position);
    tickWater(waterMaterials,(clock/1000)%14400,night);
   }
   if(lastEye.distanceToSquared(camera.position)>64){
    lastEye.copy(camera.position);
    for(const mesh of (isStation?station:town).children){
     if(!Number.isFinite(mesh.userData.viewRange))continue;
     const s=mesh.boundingSphere??mesh.geometry.boundingSphere;
     mesh.visible=Math.hypot(s.center.x-camera.position.x,s.center.z-camera.position.z)<s.radius+mesh.userData.viewRange;
    }
   }
   lampMaterial.emissiveIntensity=night*1.25;
   bridgeRoof.emissiveIntensity=night*.16;
   glow.intensity=night*13;
   bridgeLight.intensity=night*22;
   marker(state.photoCapture?null:state.gyeongjuMarker,camera);
  }};
}
