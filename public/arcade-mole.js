export const MOLE_OFFSETS=[-.98,0,.98];
const pattern=[1,0,1,2,1,2,0,1,0,2,1,0,1,2,0,2,1,0,2,1,2,0,1,2];
const beatMs=1040,whackMs=300,hitReach=.70;

export function makeArcadeMoles(station){
  let startAt=0,score=0,hitBeat=-1,swingAt=0;
  function start(now){
    startAt=now+850;score=0;hitBeat=-1;swingAt=0;
  }
  function state(now){
    const elapsed=now-startAt,beat=Math.floor(elapsed/beatMs),progress=elapsed/beatMs-beat;
    const finished=beat>=pattern.length;
    const target=beat<0||finished?-1:pattern[beat];
    const height=target<0||beat===hitBeat?0:Math.max(0,Math.min(1,progress*6,(.85-progress)*7));
    return {kind:"mole",score,target,height,swingAt,finished,
      remaining:Math.max(0,Math.ceil((pattern.length*beatMs-Math.max(0,elapsed))/1000))};
  }
  function strike(now,avatar){
    if(now-swingAt<whackMs)return false;
    const active=state(now);
    if(active.finished){start(now);return false;}
    swingAt=now;
    if(active.target<0||active.height<.53)return false;
    const x=station.x,y=station.y-MOLE_OFFSETS[active.target];
    if(Math.hypot(avatar.x-x,avatar.y-y)>hitReach)return false;
    hitBeat=Math.floor((now-startAt)/beatMs);score++;
    return true;
  }
  return {start,state,strike};
}
