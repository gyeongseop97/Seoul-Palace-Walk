import {addLandmarks,addObstacle} from "./layout.js";
import {diningPoint as point,diningTables,diningTrayPose,diningVenue,diningVenues} from "./dining-data.js";

export {diningMenu,diningTables,diningVenue} from "./dining-data.js";

export const diningPlot=diningVenue.plot;
export const diningWalls=[
  [-12,0,.24,24.1],[12,0,.24,24.1],[0,-12,24,.24],
  [-6.8,12,10.4,.24],[6.8,12,10.4,.24],[0,12,3.25,.24]
];

export const diningFurniture={
  counter:{x:0,z:-9.55,w:9.4,d:1.15},
  cupboard:{x:0,z:-11.2,w:8.2,d:.66},
  sideboard:{x:10.8,z:-5.5,w:.74,d:5.1},
  guestbook:{x:5.6,z:10.65,w:2.25,d:.68}
};

export const tableSize={w:2.30,d:1.38};
export const chairSize={w:.53,d:.66};

addLandmarks(diningVenues.map(venue=>({...venue.outsideDoor,name:venue.name})));

export function registerDiningNavigation(benches){
  for(const venue of diningVenues){
    const {x,y,w,d,angle}=venue.plot;
    addObstacle(x,y,w,d,angle);
    const add=(x,z,w,d,height=Infinity)=>addObstacle(venue.center.x+x,venue.center.y+z,w,d,0,height);
    for(const [x,z,w,d] of diningWalls)add(x,z,w,d);
    for(const {x,z,w,d} of Object.values(diningFurniture))add(x,z,w,d);
    if(venue.kioskPoint)add(2.7,9.95,.92,.52,2.0);
    for(const [tableIndex,{x,z,chairs}] of diningTables.entries()){
      // Keep the orbit camera above furniture while blocking a walk through the legs or seat.
      add(x,z,tableSize.w,tableSize.d,.84);
      for(const chair of chairs){
        add(chair.x,chair.z,chairSize.d,chairSize.w,.50);
        add(chair.x+chair.side*.263,chair.z,.075,chairSize.w,.88);
      }
      const table=point(x,z,venue);
      benches.push({...table,table:true,tableIndex,venueId:venue.id,slots:chairs.map(chair=>({
        ...point(chair.x,chair.z,venue),heading:chair.heading,approach:point(x+chair.side*2.56,z,venue),base:-.015,
        tray:diningTrayPose({...table,side:chair.side})
      }))});
    }
  }
}
