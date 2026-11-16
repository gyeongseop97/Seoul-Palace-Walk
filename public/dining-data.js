import {ITEMS} from "./activities.js";

const center={x:765,y:515};
export const diningPoint=(x,y)=>({x:center.x+x,y:center.y+y});

export const diningVenue={
  id:"bukchon-dining",name:"북촌 작은 식탁",center,
  bounds:{minX:753,maxX:777,minY:503,maxY:527},
  outsideDoor:{x:718.9,y:-1095,heading:270},
  insideDoor:{...diningPoint(0,10.6),heading:180},
  insideSpawn:{...diningPoint(0,8.3),heading:0},
  menuPoint:diningPoint(0,-7.4),
  guestbookPoint:diningPoint(5.6,9.1)
};

export const diningMenu=[
  ["bibimbap","당근, 시금치, 콩나물과 달걀을 올린 비빔밥"],
  ["mushroomSoup","표고버섯과 두부, 파를 곁들인 따뜻한 국밥"]
].map(([kind,description])=>({kind,name:ITEMS[kind].name,description}));
