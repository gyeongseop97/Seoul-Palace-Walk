import {beachStop,boardRack,dock,tables,pavilion,train,distance} from "./pohang-layout.js";
const places=[
 {name:"포항역 · 서울행 KTX",at:train},{name:"영일대 정류장",at:beachStop},
 {name:"서핑보드",at:boardRack},{name:"크루즈 승선장",at:dock},{name:"해변 야장",at:tables[0]},{name:"영일대 누각",at:pavilion}
];
export function coastGuide(chart,me){
 const list=document.createElement("div");list.className="map-places";chart.querySelector("p").before(list);
 const label=document.createElement("output");label.className="wayfinding";document.querySelector("#hint").after(label);label.hidden=true;
 let target=null;
 for(const entry of places){const b=document.createElement("button");b.textContent=entry.name;b.onclick=()=>{target=entry;chart.close();};list.append(b);}
 label.onclick=()=>{target=null;label.hidden=true;};label.title="길안내 닫기";
 return {update(pan){
  if(!target)return;const d=distance(me,target.at);label.hidden=d<4;
  if(d<4){target=null;return;}
  const a=Math.atan2(target.at.x-me.x,target.at.z-me.z)-pan,arrow=["↑","↖","←","↙","↓","↘","→","↗"][(Math.round(a/(Math.PI/4))+16)%8];
  label.textContent=arrow+" "+target.name+" · "+(d>999?(d/1000).toFixed(1)+" km":Math.round(d)+" m");
 },marks(context,X,Z){
  context.fillStyle="#906047";for(const p of places.slice(2,5)){context.beginPath();context.arc(X(p.at.x),Z(p.at.z),3,0,Math.PI*2);context.fill();}
 }};
}
