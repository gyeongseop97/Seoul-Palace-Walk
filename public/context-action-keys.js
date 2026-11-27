const boarding=new Set([
  "sport-ride","bike-action","bike-park","bike-tandem","bus-action","subway",
  "gyeongju-boardBus","gyeongju-train","coast-bus","coast-cityBus","coast-exitBus","coast-train",
  "coast-embark","coast-disembark","coast-scooter","coast-parkScooter","coast-board","coast-surf"
]);
const receiving=new Set(["take-item","coast-wine","coast-cheese","coast-cafeCoffee","bungeo-accept"]);

// The source buttons already enforce range, availability and multiplayer permissions.
// Keep occupied hands on every page, even while using an item temporarily disables its button.
export function contextKeyPages(buttons){
  const hands={},rides=[],pickups=[],other=[];
  for(const button of buttons){
    if(button.hidden)continue;
    if(button.id==="use-item"){hands.Q=button;continue;}
    if(button.id==="use-second-item"){hands.E=button;continue;}
    if(button.disabled)continue;
    if(boarding.has(button.id)||button.id==="museum-door"&&button.dataset.actionTarget?.startsWith("ktx-coach-")){
      rides.push(button);
    }else if(receiving.has(button.id))pickups.push(button);
    else other.push(button);
  }
  const actions=[...pickups,...other],pages=[];
  let action=0;
  do{
    const page={};
    if(hands.Q&&!hands.Q.disabled)page.Q=hands.Q;
    if(hands.E&&!hands.E.disabled)page.E=hands.E;
    if(rides.length)page.F=rides[pages.length%rides.length];
    else if(action<actions.length)page.F=actions[action++];
    if(action<actions.length)page.R=actions[action++];
    if(!hands.Q&&action<actions.length)page.Q=actions[action++];
    if(!hands.E&&action<actions.length)page.E=actions[action++];
    if(Object.keys(page).length)pages.push(page);
  }while(pages.length<rides.length||action<actions.length);
  return pages;
}
