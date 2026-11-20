// Public approach centrelines © OpenStreetMap contributors, ODbL 1.0. Dimensions are in metres.
// The east forecourt (concourse front, terrace, stairs and escalators) is surveyed from the
// National Geographic Information Institute orthophoto shown in Kakao Map sky view (2025).
export const stationRise=5.85;
const deg=Math.PI/180;
// The concourse is a crescent over the tracks: an annular sector with radial glass ends.
export const concourseArc={x:-74.1,y:1398.2,inner:112.2,outer:156.1,from:50,to:122.5};
export const arcPoint=(radius,angle)=>[concourseArc.x+radius*Math.cos(angle*deg),concourseArc.y+radius*Math.sin(angle*deg)];
// Local +x follows the east glass wall toward the outlet; +z faces the terrace.
const eastInner=arcPoint(concourseArc.inner,concourseArc.from);
const along=[Math.cos(concourseArc.from*deg),Math.sin(concourseArc.from*deg)];
const angle=(180-concourseArc.from)*deg;
const glass=[eastInner[0]+along[0]*11.5,eastInner[1]+along[1]*11.5];
export const terminalPose={x:glass[0]-4*Math.sin(angle),y:glass[1]-4*Math.cos(angle),angle};
// Extent of the glass wall in the local frame. Only its northern 24 m meets the terrace.
export const terminalSpan=[-32.5,11.5];
export const terminalDoorOffsets=[-8.8,-4.4,0,4.4,8.8];
const local=(x,z)=>[terminalPose.x+x*Math.cos(angle)+z*Math.sin(angle),terminalPose.y-x*Math.sin(angle)+z*Math.cos(angle)];
const pin=p=>p.map(v=>Math.round(v*100)/100);
export const eastDoor={x:local(-14,2.5)[0],y:local(-14,2.5)[1]};
export const stationApproaches=[
  {a:[.8,1483.8],b:[14.0,1499.5],w:4.6,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[30.2,1439.8],b:[15.5,1439.8],w:14.2,h0:0,h1:stationRise,kind:"stairs"},
  {a:[14.6,1439.8],b:[9.0,1441.0],w:9,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[9.0,1441.0],b:[6.6,1442.3],w:8,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[6.6,1442.3],b:[-16.4,1418.9],w:8,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-16.4,1418.9],b:[-26.9,1413.9],w:7,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-26.9,1413.9],b:[-99,1414.8],w:7,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-62.7,1414.35],b:[-62.7,1408.3],w:4.6,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-99,1414.8],b:[-106.4,1415],w:7,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-106.4,1415],b:[-119.6,1403.1],w:7,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-119.6,1403.1],b:[-131.6,1390],w:7,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-154.9,1390.5],b:[-131.6,1390],w:7,h0:0,h1:stationRise,kind:"stairs"},
  {a:[-155,1390.5],b:[-162,1390.5],w:12,h0:0,h1:0,kind:"square"},
  {a:[17.7,1415.4],b:[3.1,1422],w:4.2,h0:0,h1:stationRise,kind:"escalator"},
  {a:[3.1,1422],b:[-9,1426],w:6,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[32.3,1408.8],b:[17.7,1415.4],w:4.2,h0:-4.8,h1:0,kind:"escalator"},
  {a:[34.7,1407.7],b:[32.3,1408.8],w:4.2,h0:-4.8,h1:-4.8,kind:"lowerLanding"},
  {a:[30.2,1430.6],b:[13.4,1430.6],w:3.5,h0:0,h1:stationRise,kind:"escalator",open:true},
  {a:[12.6,1430.6],b:[9.6,1438.6],w:4.2,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[39.3,1471.9],b:[26.1,1480.3],w:12,h0:0,h1:stationRise,kind:"stairs"},
  {a:[33.0,1464.8],b:[20.1,1470.1],w:3.5,h0:0,h1:stationRise,kind:"escalator",open:true},
  {a:[9.0,1441.0],b:[8.2,1462.0],w:11,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[8.2,1462.0],b:[3.2,1481.2],w:8,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[8.2,1462.0],b:[16.0,1474.0],w:8,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[16.0,1474.0],b:[24.6,1479.2],w:6,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[16.0,1474.0],b:[19.2,1470.6],w:4,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[16.0,1474.0],b:[20.6,1490.6],w:6,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-198.2,1528.8],b:[-169.6,1517.8],w:11,h0:0,h1:stationRise,kind:"stairs"},
  {a:[-169.6,1517.8],b:[-163.6,1515.5],w:11,h0:stationRise,h1:stationRise,kind:"deck"},
  {a:[-163.6,1515.5],b:[-151.0,1511.0],w:9,h0:stationRise,h1:stationRise,kind:"deck"}
];

// Upper terrace between the outlet rotunda, the two stairs and the concourse glass wall.
export const eastPlazaOutline=[
  [-23,1419],[-17,1415],[-9,1416],[3.1,1422],[6.5,1425.6],[12.0,1428.85],[15.5,1428.85],
  [15.5,1447.4],[15.9,1467.0],[20.0,1467.6],[21.6,1471.4],[22.9,1475.2],[29.3,1485.4],
  [26.9,1489.3],[17.2,1496.4],pin(local(-12.5,4.08)),pin(local(11.5,4.08)),
  [-4.2,1481.5],[-4.2,1446.0],[-9.5,1441.0],[-18.4,1427]
];
// Stepped planters with clipped junipers fill the slope between the two stairs.
export const forecourtPlanters={minX:15.9,maxX:30.2,minY:1447.4,maxY:1467.5,steps:5};
export const exitDome={x:16.2,y:1417.8,radius:12,height:9.2};
export const outletRotunda={x:-13.5,y:1431,radius:16.5};
export const plazaCafeFront={x:22.0,y:1492.9,angle:-2.51,w:11.5,d:5.5};
export const outletFront={x:-13.45,y:1439.2,angle:2.31,w:24,d:5};
export const gatePose={x:340.7,y:867.1,angle:-.733,opening:3.65,depth:13};
