import {bankAt,cheonggyeBedLevel,cheonggyeBridges,stepStoneXs} from "./cheonggye-layout.js";

export const CHEONGGYE_WATER_LEVEL=cheonggyeBedLevel-.27;
// A place to sit on the edge of the lower path with both feet in the stream.
const place=(x,side)=>({...bankAt(x,side,-3.14),heading:side===1?0:180,base:cheonggyeBedLevel-.53,footBath:true,
  approach:bankAt(x,side,-1.54),waterPoint:bankAt(x,side,-3.50)});
const pair=(x,side,spread)=>[-spread,spread].map(offset=>place(x+offset,side));
// Stone ledges built into the edge. These come first so their seat numbers never change.
const ledges=[[649,1],[720,-1],[783,1],[807,-1],[879,1],[943,-1],[1037,-1]];
// Anywhere else along the water works too: a place every 1.25 m on both banks, clear of
// the ledges, the stepping stones and the bridge piers that stand at the water's edge.
const taken=(x,side)=>ledges.some(([at,bank])=>bank===side&&Math.abs(x-at)<2.4)||
  x>stepStoneXs[0]-2.6&&x<stepStoneXs.at(-1)+2.6||
  cheonggyeBridges.some(bridge=>Math.abs(x-bridge.x)<bridge.width/2+1.7+Math.abs(bridge.skew)/2);
const edges=[];
for(let x=634.5;x<1051;x+=2.5)for(const side of [-1,1])if(!taken(x,side))edges.push([x,side]);
export const cheonggyeSeats=[
  ...ledges.map(([x,side])=>({...bankAt(x,side,-2.99),side,footBath:true,ledge:true,slots:pair(x,side,.61)})),
  ...edges.map(([x,side])=>({...bankAt(x,side,-2.99),side,footBath:true,slots:pair(x,side,.625)}))
];
