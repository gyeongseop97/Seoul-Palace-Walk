import {ARCADE_PADS} from "./arcade-layout.js";

const lead=1650,beat=790,windowMs=285;
const chart=[0,3,1,2,0,1,3,2,1,0,2,3,0,2,1,3,2,1,0,3,1,3,2,0];
const laneAt=position=>ARCADE_PADS.findIndex(pad=>Math.hypot(position.x-pad.x,position.y-pad.y)<.34);

export function makeArcadeRhythm(playBeat){
  let round=null;
  function start(now,position){
    round={start:now+lead,index:0,played:0,score:0,combo:0,best:0,previous:laneAt(position),litLane:-1,litUntil:0,result:"",finished:false};
  }
  function update(now,position){
    if(!round||round.finished)return;
    const r=round;
    if(r.played<chart.length&&now>=r.start+r.played*beat){playBeat(chart[r.played],r.played%4===0);r.played++;}
    while(r.index<chart.length&&now>r.start+r.index*beat+windowMs){r.index++;r.combo=0;r.result="놓쳤어요";}
    const lane=laneAt(position),gap=Math.abs(now-(r.start+r.index*beat));
    if(lane!==r.previous&&lane>=0&&chart[r.index]===lane&&gap<=windowMs){
      const perfect=gap<=125;
      r.index++;r.combo++;r.best=Math.max(r.best,r.combo);r.score+=perfect?100:65;
      r.litLane=lane;r.litUntil=now+260;r.result=perfect?"정확해요!":"좋아요!";
    }
    r.previous=lane;
    r.finished=r.index===chart.length&&r.played===chart.length;
  }
  function state(now){
    if(!round)return null;
    const r=round,until=r.start+r.index*beat-now;
    return {active:!r.finished,finished:r.finished,score:r.score,combo:r.combo,best:r.best,result:r.result,
      dueLane:chart[r.index]??-1,litLane:now<r.litUntil?r.litLane:-1,pulse:Math.max(0,Math.min(1,1-until/beat))};
  }
  return {start,update,state,stop(){round=null;}};
}
