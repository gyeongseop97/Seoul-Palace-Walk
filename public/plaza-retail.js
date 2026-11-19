// Street-facing limits in metres east/north of the plaza origin.
export const retailBlocks=[
  {front:-55.4,side:-1,start:17.5,end:29,depth:13,height:12},
  {front:-55.4,side:-1,start:106,end:123,depth:16,height:16},
  {front:-55.4,side:-1,start:260,end:279,depth:15,height:12},
  {front:48.5,side:1,start:93,end:144.2,depth:18,height:20},
  {front:48.5,side:1,start:222.5,end:246.1,depth:18,height:15},
  {front:48.5,side:1,start:336,end:344.4,depth:14,height:12}
];
export function retailBlockAt(north,side){
  return retailBlocks.find(block=>block.side===side&&north>=block.start&&north<=block.end);
}
