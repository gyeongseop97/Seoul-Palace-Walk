export const MOLE_COLUMNS=5,MOLE_ROWS=3,MOLE_ROUND_BEATS=24;
export const MOLE_BOARD={width:2.13,depth:1.28,top:.852};
export const MOLE_HOLES=Array.from({length:MOLE_COLUMNS*MOLE_ROWS},(_,index)=>({
  x:(index%MOLE_COLUMNS-2)*.365,z:(Math.floor(index/MOLE_COLUMNS)-1)*.34+.05
}));
export const MOLE_HOLE_RADIUS=.112;
export const MOLE_WHACK_MS=330;
const beatMs=1040;

export function moleView(aspect){
  const fov=aspect<.80?78:54;
  const distance=Math.max(1.54,.94/(Math.tan(fov*Math.PI/360)*Math.max(.34,aspect))+.34);
  return {distance,fov,eye:1.62};
}

export function moleSwing(clock,swingAt){
  const t=(clock-swingAt)/MOLE_WHACK_MS;
  if(!swingAt||t<0||t>=1)return 0;
  if(t<.14)return -.18*Math.sin(Math.PI*t/.14);
  if(t<.31)return Math.sin((t-.14)/.17*Math.PI/2);
  if(t<.42)return 1;
  const release=(t-.42)/.58;
  return (1-release)**2-.14*Math.sin(Math.PI*release);
}

export function makeArcadeMoles(random=Math.random){
  let startAt=0,score=0,hitBeat=-1,hitAt=0,swingAt=0,swingHole=-1,hit=false,pattern=[];
  function start(now){
    startAt=now+850;score=0;hitBeat=-1;hitAt=0;swingAt=0;swingHole=-1;hit=false;pattern=[];
    while(pattern.length<MOLE_ROUND_BEATS){
      const holes=MOLE_HOLES.map((_,index)=>index);
      for(let i=holes.length-1;i>0;i--){
        const j=Math.floor(random()*(i+1));
        [holes[i],holes[j]]=[holes[j],holes[i]];
      }
      if(holes[0]===pattern.at(-1))holes.push(holes.shift());
      pattern.push(...holes.slice(0,MOLE_ROUND_BEATS-pattern.length));
    }
  }
  function state(now){
    const elapsed=now-startAt,beat=Math.floor(elapsed/beatMs),progress=elapsed/beatMs-beat;
    const finished=beat>=pattern.length;
    const target=beat<0||finished?-1:pattern[beat];
    const drop=beat===hitBeat?Math.min(1,Math.max(0,(now-hitAt-190)/135)):0;
    const height=target<0?0:Math.max(0,Math.min(1,progress*6,(.88-progress)*7))*(1-drop);
    return {kind:"mole",score,target,height,swingAt,swingHole,hit,finished,
      remaining:Math.max(0,Math.ceil((pattern.length*beatMs-Math.max(0,elapsed))/1000))};
  }
  function strike(now,index){
    if(!Number.isInteger(index)||!MOLE_HOLES[index]||now-swingAt<MOLE_WHACK_MS*.72)return null;
    const active=state(now);
    if(active.finished)return null;
    swingAt=Math.round(now);swingHole=index;
    const beat=Math.floor((now-startAt)/beatMs);
    hit=active.target===index&&active.height>=.28&&hitBeat!==beat;
    if(hit){hitBeat=beat;hitAt=now;score++;}
    return hit;
  }
  return {start,state,strike};
}
