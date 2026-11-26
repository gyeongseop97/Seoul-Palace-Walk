// Corrections to the baked OpenStreetMap extract around Seoul Station. The mapped outline of
// the concourse follows its roof in oblique imagery, about 15 m off the walls. These rings
// are traced from the orthophoto instead and replace it for collision, map and rendering.
import {stationSurfaces as bakedSurfaces,stationBuildings as bakedBuildings,stationTrees,seoulloDeck} from "./station-data.js";
import {concourseArc,arcPoint,terminalPose,stationRise,stationApproaches,forecourtPlanters,eastPlazaOutline,exitDome} from "./station-approach-plan.js";
export {stationTrees,seoulloDeck};
const TERMINAL=331947843;
const round=p=>p.map(v=>Math.round(v*100)/100);
export function arcRing(radius,from,to,step=2.5){
  const count=Math.max(1,Math.ceil(Math.abs(to-from)/step)),points=[];
  for(let i=0;i<=count;i++)points.push(round(arcPoint(radius,from+(to-from)*i/count)));
  return points;
}
const {inner,outer,from,to}=concourseArc;
const glassAt=t=>{
  const a=terminalPose.angle,x=11.5-t;
  return round([terminalPose.x+x*Math.cos(a)+4*Math.sin(a),terminalPose.y-x*Math.sin(a)+4*Math.cos(a)]);
};
// Crescent hall above the tracks.
export const concourseRing=[...arcRing(inner,from,to),...arcRing(outer,to,from)];
// Outlet and car-park block inside the crescent, with the rotunda left open as a public passage.
export const outletRing=[[-133.8,1429.7],[-17.6,1429.7],[-10,1441.5],[-4.6,1446.5],[-4.6,1481.3],...arcRing(inner,51.5,to)];
// Low wing that wraps the south-east corner and tapers along the taxi road.
export const eastWingRing=[glassAt(24.1),[17.25,1496.5],[26.95,1489.4],[29.4,1485.5],[32.5,1489.5],[33.5,1501],[41,1503.5],
  [57.8,1502.7],[57.8,1506.8],[8.8,1540.7],[6,1536],...arcRing(outer,56,from,3)];
// Curved west concourse above the airport railroad entrance.
export const westWingRing=[round(arcPoint(outer,to)),[-164.49,1540.87],[-175.13,1552.68],[-178.21,1561.21],[-179.12,1571.38],
  [-178.01,1589.68],[-175.5,1597.31],[-163.73,1597.33],[-163.75,1606.27],[-153.02,1605.97],[-152.52,1554.51],round(arcPoint(outer,117))];
// Ground line of the 1925 station, clockwise from the north-west corner. The entrance block
// stands 7 m further into the square than the mapped roof outline.
export const oldStationRing=[[-4.75,1241.9],[7.2,1241.7],[7.4,1254.2],[10.95,1254.3],[10.95,1266.1],[9.2,1266.1],[9.2,1287.6],
  [18.4,1287.6],[18.4,1297.2],[15.3,1297.2],[15.3,1310.5],[30.5,1310.5],[30.5,1336.1],[15.3,1336.1],[15.3,1350.2],[18.4,1350.2],
  [18.4,1359.7],[10.5,1359.7],[10.5,1368],[18.2,1368],[18.2,1375],[10.5,1375],[10.5,1380.1],[-3.4,1380.1],[-4.75,1286.4]];
export const oldStationCentre={x:8.6,y:1323.3};
const part=(kind,part,height,rings)=>({id:TERMINAL,name:"서울역",kind,part,height,rings:[rings]});
export const stationBuildings=[
  ...bakedBuildings.filter(b=>b.id!==TERMINAL).map(b=>b.kind==="historic"?{...b,rings:[oldStationRing]}:b),
  part("terminal","concourse",24.5,concourseRing),part("stationWing","outlet",30,outletRing),
  part("stationWing","eastWing",12,eastWingRing),part("stationWing","westWing",17,westWingRing)
];
// Earlier pieces take precedence in the ground lookup and are drawn just above the bake.
export const forecourtSurfaces=[
  {kind:"stone",rings:[[[30.2,1428.6],[36.4,1428.6],[36.4,1468.2],[30.2,1468.2]]]},
  {kind:"stone",rings:[[[.4,1404.4],[30.2,1404.4],[30.2,1428.6],[12.4,1428.6],[6.9,1425.4],[3.4,1421.7]]]},
  {kind:"grass",rings:[[[34.6,1478.6],[44.8,1478.2],[46.2,1486.6],[39.6,1491.8],[33.4,1489.2]]]}
];
export const stationSurfaces=[...forecourtSurfaces,...bakedSurfaces];
export const clockTower={x:34.4,y:1449.6};
// Furniture of the square in front of the old station: statue, light mast and exit pylon.
export const plazaStatue={x:36,y:1302},plazaMast={x:37.5,y:1352},exitPylon={x:33.6,y:1404.6};
// Planted beds behind a low kerb along both wings of the old station.
export const stationBeds=[[18.9,1303.9,5.4,11.6],[18.9,1343.2,5.4,12.6]];
// Long seat walls on the terrace: centre x, y, width and depth.
export const terraceBenches=[[11.4,1457.2,.9,11],[10.4,1451.9,2.8,.9]];
// The terrace is a solid podium. Walls below deck level keep ground walkers out of it while
// people on the stairs and the deck pass over them.
export function registerForecourt(addObstacle){
  const top=stationRise-.35,flights=stationApproaches.filter(s=>s.kind!=="deck"&&s.h1===stationRise);
  // Leave the head of each stair and escalator open so a route can be planned at ground level.
  const atLanding=(x,y)=>flights.some(s=>{
    const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],len=Math.hypot(dx,dy),t=((x-s.a[0])*dx+(y-s.a[1])*dy)/len;
    return Math.abs(t-len)<1.3&&Math.abs((y-s.a[1])*dx-(x-s.a[0])*dy)/len<s.w/2+.45;
  });
  for(const [i,a] of eastPlazaOutline.entries()){
    const b=eastPlazaOutline[(i+1)%eastPlazaOutline.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    const count=Math.max(1,Math.round(len/.6));
    for(let k=0,start=null;k<=count;k++){
      const open=k===count||atLanding(a[0]+dx*(k+.5)/count,a[1]+dy*(k+.5)/count);
      if(!open&&start===null)start=k;
      if(open&&start!==null){
        const m=(start+k)/(2*count);
        addObstacle(a[0]+dx*m,a[1]+dy*m,len*(k-start)/count,.3,-Math.atan2(dy,dx),top);start=null;
      }
    }
  }
  const p=forecourtPlanters;
  const depth=(p.maxX-p.minX)/p.steps,span=p.maxY-p.minY;
  for(let i=0;i<p.steps;i++){
    const x=p.minX+(i+.5)*depth,bed=(stationRise+.07)*(1-(i+.35)/p.steps);
    addObstacle(x,(p.minY+p.maxY)/2,depth,span,0,bed+.1);
    for(const edge of [p.minY+.14,p.maxY-.14])addObstacle(x,edge,depth,.28,0,bed+.19);
    for(const row of [.2,.5,.8]){
      if((i+Math.round(row*10))%3===0)continue;
      addObstacle(x,p.minY+span*row+(i%2?1.2:-1.2),.32,.32);
    }
  }
  addObstacle(clockTower.x,clockTower.y,1.1,1.1);
  for(const [x,y,w,d] of terraceBenches)addObstacle(x,y,w,d,0,stationRise+.515);
  for(const [x,y,w,d] of stationBeds){
    addObstacle(x,y,w,d,0,.41);
    addObstacle(x,y+(d>12?3.4:-3.2),.32,.32);
  }
  addObstacle(plazaStatue.x,plazaStatue.y,2.4,2.4);addObstacle(plazaMast.x,plazaMast.y,.9,.9);addObstacle(exitPylon.x,exitPylon.y,.7,.5);
  // Ring posts of the glass rotunda over subway exit 1. The escalators pass between them.
  for(let i=0;i<16;i++){
    const angle=(i+.5)*Math.PI/8,x=exitDome.x+Math.cos(angle)*exitDome.radius,y=exitDome.y+Math.sin(angle)*exitDome.radius;
    if(domeOpening(angle))continue;
    addObstacle(x,y,.34,.34);
  }
}
// Openings face the plaza, the subway escalator and the bridge to the upper terrace.
export function domeOpening(angle){
  const turn=((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2)*180/Math.PI;
  return [[320,360],[0,20],[70,110],[140,172],[230,262]].some(([lo,hi])=>turn>=lo&&turn<=hi);
}
