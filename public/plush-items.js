export const prizeTypes=[
  ["bear","곰 인형"],["rabbit","토끼 인형"],["cat","고양이 인형"],["duck","오리 인형"],
  ["panda","판다 인형"],["star","별 인형"],["frog","개구리 인형"],["penguin","펭귄 인형"]
];
export const plushItems=Object.fromEntries(prizeTypes.flatMap(([type,name])=>[0,1,2].map(variant=>
  ["plush-"+type+"-"+variant,{type,variant,name,plush:true,verb:"가방 열기",uses:1,duration:0}])));
