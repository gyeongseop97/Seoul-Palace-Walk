import {ITEMS} from "./activities.js";

// The order in each list is the default when several controls share a location.
const categories={
  travel:{label:"이동·탈것",ids:[
    "coast-disembark","coast-exitBus","raft-moor","ktx-destination","raft-helm","bus-action","coast-embark",
    "coast-moor","coast-release","coast-helm","coast-return","coast-tour","gyeongju-train","coast-train","subway",
    "gyeongju-stationBus","gyeongju-townBus","coast-bus","coast-cityBus","bike-action","bike-park",
    "coast-parkScooter","coast-scooter","coast-surf","coast-board","station-lift"
  ]},
  food:{label:"음식·음료",ids:[
    "dining-eat","dining-order","dining-call","bungeo-serve","bungeo-accept","bungeo-open","bungeo-gift",
    "coast-order","coast-drink","coast-fish","coast-clam","coast-grill","coast-bell","coast-wine","coast-cheese","coast-cafeCoffee"
  ]},
  facility:{label:"시설·좌석",ids:[
    "museum-door","gyeongju-gjObservatory","arcade-stairs","coast-studioDoor","coast-studioClimb","coast-studioWater",
    "coast-studioConsole","coast-deckStand","coast-stand","sit","coast-deckSit","coast-table","coast-changing","coast-rinse","hanbok-rental"
  ]},
  activity:{label:"체험",ids:[
    "boat-catch","boat-fold","foot-kick","minigame","picnic","coast-festival","fountain-show","gyeongju-gjStars",
    "wish","pet-cat","mmca-light"
  ]},
  guide:{label:"관람·안내",ids:["landmark-guide","visitor-guide","museum-exhibit","venue-guestbook"]},
  item:{label:"소지품",ids:["take-item","use-item","use-second-item","umbrella"]}
};
const idOrder=new Map();
for(const [key,{ids}] of Object.entries(categories)){
  ids.forEach((id,order)=>idOrder.set(id,{key,order}));
}

function categoryOf(button){
  const id=button.id,target=button.dataset.actionTarget??"";
  if(id==="museum-door"&&target.startsWith("ktx-coach-"))return "travel";
  if(id==="take-item"||id==="use-item"||id==="use-second-item"){
    const item=ITEMS[target];
    return item&&!item.plush&&target!=="sparkler"&&target!=="churu"?"food":"item";
  }
  // Arcade machines are registered from the current catalogue at startup.
  return idOrder.get(id)?.key??"activity";
}

function contextPriority(button,key,preferredId){
  const id=button.id,target=button.dataset.actionTarget??"";
  if(key==="travel")return 0;
  if(id==="museum-door"&&target.endsWith("-exit")||id==="coast-deckStand")return 1;
  // Held items follow the place's own service, activity or guide even when the player can use them anywhere.
  if(id==="use-item"||id==="use-second-item"||id==="umbrella")return 6;
  if(key==="guide")return 5;
  if(id===preferredId&&id!=="coast-deckSit")return 2;
  if(key==="food"||id==="take-item")return 3;
  return 4;
}

export function groupContextActions(available,preferredId,pinnedButton){
  const groups=new Map();
  for(const button of available){
    const key=categoryOf(button);
    if(!groups.has(key))groups.set(key,{key,label:categories[key].label,entries:[]});
    groups.get(key).entries.push({button,priority:contextPriority(button,key,preferredId),order:idOrder.get(button.id)?.order??100});
  }
  const grouped=[...groups.values()];
  const byAvailability=(a,b)=>Number(a.button.disabled)-Number(b.button.disabled)||a.priority-b.priority;
  const byPreferred=(a,b)=>Number(b.button.id===preferredId)-Number(a.button.id===preferredId);
  for(const group of grouped){
    group.entries.sort((a,b)=>byAvailability(a,b)||byPreferred(a,b)||
      (group.key!=="travel"&&(Number(b.button===pinnedButton)-Number(a.button===pinnedButton)))||a.order-b.order);
  }
  const keys=Object.keys(categories);
  grouped.sort((a,b)=>byAvailability(a.entries[0],b.entries[0])||byPreferred(a.entries[0],b.entries[0])||keys.indexOf(a.key)-keys.indexOf(b.key));
  return grouped.map(({key,label,entries})=>({key,label,buttons:entries.map(entry=>entry.button)}));
}
