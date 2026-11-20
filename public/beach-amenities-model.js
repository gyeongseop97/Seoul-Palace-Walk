import * as T from "three";
import {amenities,rinseDuration} from "./beach-amenities.js";

export function buildBeachAmenities(root,{box,post,rod,sign}){
 const sprays=[],dropGeom=new T.SphereGeometry(1,6,4);
 const streamMat=new T.MeshBasicMaterial({color:0xa7dbdc,transparent:true,opacity:.74,depthWrite:false});
 const pink=0xc08770,teal=0x588a88,wood=0xc5ad88,frame=0x53655e,stone=0xaba79b;
 for(const a of amenities){
  const g=new T.Group();g.position.set(a.x,1.89,a.z);g.rotation.y=a.yaw;root.add(g);
  if(a.kind==="changing"){
   box(g,stone,0,.024,0,2.65,.048,4.8);
   box(g,wood,-1.08,1.03,0,.13,2.06,4.52);
   for(const z of [-2.18,0,2.18]){
    box(g,wood,.03,1.03,z,2.35,2.05,.11);
    for(const x of [-1.08,1.15])box(g,frame,x,1.15,z,.105,2.30,.105);
   }
   for(const z of [-1.10,1.10]){
    box(g,frame,-.84,.51,z,.37,.09,1.47);
    for(let j=0;j<8;j++){
     const y=.27+j*.212;
     box(g,j%2?0xa1b9ae:0x96aca2,1.1,y,z+.18, .082,.18,1.53);
    }
   }
   box(g,frame,0,2.29,0,2.85,.14,4.85);
   for(let i=0;i<11;i++)box(g,i%2?teal:0x709997,-.03,2.40,-2.27+i*.45,2.90,.085,.455);
   sign(g,"탈의실",1.28,2.03,0,2.09,.40,"#486963",Math.PI*.5);
  }else{
   box(g,stone,.48,.026,0,2.32,.052,3.45);
   box(g,0x5c6767,.75,.061,0,1.35,.045,2.78);
   for(let j=0;j<16;j++)box(g,0xa0acab,.75,.088,-1.27+j*.17,1.28,.021,.060);
   box(g,teal,-.01,.53,0,.37,1.06,.49);
   for(const z of [-.39,.39]){
    rod(g,[.06,.57,z*.28],[.49,.57,z],.044,0x929f9f);
    rod(g,[.49,.57,z],[.60,.48,z],.046,0xa5b1ad);
    post(g,pink,.08,1.088,z*.27,.044,.056,.044);
   }
   sign(g,"발 씻는 곳",-.18,1.45,0,1.40,.35,"#496b70",Math.PI*.5);
   const drops=new T.InstancedMesh(dropGeom,streamMat,38);drops.frustumCulled=false;drops.renderOrder=2;drops.visible=false;g.add(drops);
   sprays.push({a,drops});
  }
 }
 const obj=new T.Object3D();
 return function updateRinses(players,time){
  for(const {a,drops} of sprays){
   const newest=players.reduce((n,p)=>p.coast?.rinse?.site===a.id?Math.max(n,p.coast.rinse.at):n,0);
   const age=time-newest;drops.visible=newest>0&&age>=0&&age<rinseDuration;if(!drops.visible)continue;
   for(let i=0;i<drops.count;i++){
    const t=(age*.0018+i*.073)%1,side=i%2?-1:1;
    obj.position.set(.60+t*.64,.49-.405*t*t,side*(.39+.14*t)+.044*Math.sin(i*7.3+t*4)*t);
    obj.scale.set(.012+.009*t,.039-.022*t,.012+.009*t);obj.rotation.z=t*.9;obj.updateMatrix();drops.setMatrixAt(i,obj.matrix);
   }
   drops.instanceMatrix.needsUpdate=true;
  }
 };
}
