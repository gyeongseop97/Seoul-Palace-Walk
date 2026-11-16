import {BUNGEO_STALL} from "./bungeo-data.js";
import {plazaAt} from "./plaza-layout.js";

const counter=plazaAt(-50.1,374.15);
const approach=[plazaAt(-49.15,379.12),plazaAt(-49.15,376.1),counter];
const departure=[counter,plazaAt(-47.6,372.25),plazaAt(-47.6,368.7)];
const thanksDuration=950;
const customers=[
  {coat:0x796452,character:"man",hair:"parted",skin:"warm",outfit:"coat"},
  {coat:0x995e56,character:"woman",hair:"braids",skin:"light",outfit:"puffer"},
  {coat:0x637992,character:"man",hair:"curly",skin:"brown",outfit:"hoodie"},
  {coat:0x977744,character:"woman",hair:"bob",skin:"tan",outfit:"coat"},
  {coat:0x576d60,character:"man",hair:"crop",skin:"fair",outfit:"puffer"},
  {coat:0x826a84,character:"woman",hair:"ponytail",skin:"deep",outfit:"hoodie"}
];
const heading=(from,to)=>Math.atan2(to.x-from.x,from.y-to.y)*180/Math.PI;

function makeRoute(points){
  let length=0;
  const segments=points.slice(1).map((to,index)=>{
    const from=points[index],dx=to.x-from.x,dy=to.y-from.y;
    const start=length,distance=Math.hypot(dx,dy);
    length+=distance;
    return {from,dx,dy,start,distance,heading:heading(from,to)};
  });
  return progress=>{
    const distance=length*Math.max(0,Math.min(1,progress));
    const segment=segments.find(leg=>distance<leg.start+leg.distance)??segments.at(-1);
    const along=(distance-segment.start)/segment.distance;
    return {x:segment.from.x+segment.dx*along,y:segment.from.y+segment.dy*along,
      heading:segment.heading,stepping:true};
  };
}

const walkIn=makeRoute(approach),walkOut=makeRoute(departure);
const atCounter={x:counter.x,y:counter.y,heading:heading(counter,BUNGEO_STALL.body),stepping:false};

export function bungeoCustomerPose(order,clock){
  if(!order||clock<order.spawnedAt)return null;
  if(clock<order.arrivesAt)return walkIn((clock-order.spawnedAt)/(order.arrivesAt-order.spawnedAt));
  if(order.completedAt){
    if(clock>=order.nextAt)return null;
    const walkAt=order.completedAt+thanksDuration;
    if(clock>=walkAt)return walkOut((clock-walkAt)/Math.max(1,order.nextAt-walkAt));
  }
  return atCounter;
}

export function makeBungeoCustomer(walkerModels,{floorHeight,labelSprite,chatTexture}){
  let model=null,lookIndex=-1;
  function update(order,viewer,now,clock,delta){
    const pose=viewer&&Math.hypot(viewer.x-counter.x,viewer.y-counter.y)<BUNGEO_STALL.watchRadius+3&&bungeoCustomerPose(order,clock);
    if(!pose){
      if(model?.group.visible){model.group.visible=false;walkerModels.clearChat(model);}
      return;
    }
    const index=Number.isInteger(order.customer)&&customers[order.customer]?order.customer:0;
    const {coat,character,hair,skin,outfit}=customers[index];
    if(index!==lookIndex){
      if(model)walkerModels.dispose(model);
      model=walkerModels.create(coat,"붕어빵 손님",labelSprite,"bungeo-customer-"+index);
      model.group.name="붕어빵 손님";
      lookIndex=index;
    }
    const {id,phase,quantity,arrivesAt,completedAt}=order;
    const chat=completedAt?{id:id+"-thanks",text:"잘 먹겠습니다!",at:completedAt}:
      phase==="waiting"||phase==="accepted"?{id:id+"-order",text:`붕어빵 ${quantity}개 주세요!`,at:arrivesAt}:null;
    const item=completedAt?{kind:"bungeoppang",remaining:1,started:0}:null;
    walkerModels.update(model,{...pose,character,look:{hair,skin,outfit,eyes:"soft"},
      running:false,wave:completedAt??0,vx:0,vy:0,chat,item},{now,clock,delta,floor:floorHeight(pose),
      chatTexture,turnEase:1-Math.exp(-delta*11)});
  }
  function placeChat(cameraUp){
    if(model?.group.visible&&model.chatSprite)walkerModels.placeChat(model,cameraUp);
  }
  return {update,placeChat};
}
