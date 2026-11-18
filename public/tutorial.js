const STEPS=[
  {title:"산책 시작",text:"왼쪽 조이스틱을 밀거나 방향키·WASD로 걸어요. 바닥을 터치해도 그쪽으로 갈 수 있어요.",target:"#joystick,.game-pad button"},
  {title:"시점 바꾸기",text:"화면을 드래그해 주변을 둘러보세요. 왼쪽 위 장소명 아래의 카메라를 누르면 1인칭과 3인칭을 오갈 수 있어요.",target:"#perspective"},
  {title:"지도 열기",text:"미니맵을 누르면 큰 지도가 열려요. 마우스 휠이나 두 손가락으로 확대하고, 지도에서 목적지를 눌러 보세요.",target:"#map-toggle,#overview-map"},
  {title:"버스 타기",text:"정류장에 가면 다음 버스 시간을 볼 수 있어요. 버스가 오면 좌석을 고르고 원하는 정류장에서 내리세요.",target:"#plaza-bus-target,#map-toggle"},
  {title:"따릉이 빌리기",text:"지도에서 초록 점이 대여소예요. 대여소 가까이에서 따릉이를 빌리고 다른 대여소에 반납할 수 있어요.",target:"#map-toggle,#overview-map"}
];
const duration=6000,seenKey="jeongdong-walk-tutorial";

export function bindTutorial(card){
  const doc=card.ownerDocument;
  const title=doc.getElementById("tutorial-title"),description=doc.getElementById("tutorial-description");
  const next=doc.getElementById("tutorial-next"),skip=doc.getElementById("tutorial-skip");
  let seen=localStorage.getItem(seenKey)==="done",index=0,remaining=duration,last=0,highlight=null;
  function clearHighlight(){highlight?.classList.remove("tutorial-highlight");highlight=null;}
  function draw(){
    clearHighlight();
    const step=STEPS[index];
    title.textContent=step.title;description.textContent=step.text;
    next.textContent=index===STEPS.length-1?"마치기":"다음";
    highlight=[...doc.querySelectorAll(step.target)].find(element=>element.getClientRects().length)??null;
    highlight?.classList.add("tutorial-highlight");
  }
  function close(remember=false){
    card.hidden=true;clearHighlight();last=0;
    if(remember){seen=true;localStorage.setItem(seenKey,"done");}
  }
  function start(replay=false){
    if(!replay&&(seen||!card.hidden))return;
    index=0;remaining=duration;last=0;card.hidden=false;draw();
  }
  function advance(){
    if(index+1===STEPS.length){close(true);return;}
    index++;remaining=duration;draw();
  }
  function update(now,paused=false){
    if(card.hidden)return;
    if(!paused&&last)remaining-=Math.min(250,Math.max(0,now-last));
    last=now;
    if(remaining<=0)advance();
  }
  next.addEventListener("click",advance);
  skip.addEventListener("click",()=>close(true));
  return {start,update,close,get needsStart(){return !seen&&card.hidden;}};
}
