import {bankAt,cheonggyeBedLevel} from "./cheonggye-layout.js";

export const CHEONGGYE_WATER_LEVEL=cheonggyeBedLevel-.27;
export const cheonggyeSeats=[
  [649,1],[720,-1],[783,1],[807,-1],[879,1],[943,-1],[1037,-1]
].map(([x,side])=>{
  const p=bankAt(x,side,-2.99),heading=side===1?0:180;
  return {...p,side,footBath:true,slots:[-.61,.61].map(offset=>{
    const px=x+offset;
    return {...bankAt(px,side,-3.14),heading,base:cheonggyeBedLevel-.53,footBath:true,
      approach:bankAt(px,side,-1.54),waterPoint:bankAt(px,side,-3.50)};
  })};
});
