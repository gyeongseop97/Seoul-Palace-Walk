const STEPS=[
  {title:"걷기와 달리기",text:"방향키·WASD로 이동해요. Shift를 한 번 누르면 달리고, 다시 누르면 걸어요. Space로 점프해요. 조작법은 ?에서 다시 볼 수 있어요.",touchText:"왼쪽 조이스틱을 살짝 밀면 천천히 걷고, 끝까지 밀면 달려요. 오른쪽 점프 버튼으로 뛰어올라요. 조작법은 ?에서 다시 볼 수 있어요.",target:"#controls-help-open",touchTarget:"#joystick"},
  {title:"시점 바꾸기",text:"화면을 드래그해 주변을 둘러보세요. 왼쪽 위 장소명 옆의 카메라를 누르면 1인칭과 3인칭을 오갈 수 있어요.",target:"#perspective"},
  {title:"지도 열기",text:"M으로 지도를 열고 닫아요. 마우스 휠로 확대하고, 가고 싶은 곳을 눌러 보세요. 가방은 I로 열어요.",touchText:"미니맵을 누르면 큰 지도가 열려요. 두 손가락으로 확대하고, 가고 싶은 곳을 눌러 보세요.",target:"#map-toggle,#overview-map"},
  {title:"버스 타기",text:"정류장에 가면 다음 버스 시간을 볼 수 있어요. 버스가 오면 좌석을 고르고 원하는 정류장에서 내리세요.",target:"#plaza-bus-target,#map-toggle"},
  {title:"따릉이 빌리기",text:"대여소에 다가가 ‘따릉이 빌리기’ 옆에 표시된 키를 누르세요. 가까이서 할 수 있는 행동은 E, F, G로 실행해요.",touchText:"지도에서 초록 점이 대여소예요. 대여소 가까이에서 따릉이를 빌리고 다른 대여소에 반납할 수 있어요.",target:"#map-toggle,#overview-map"}
];
const duration=6000,seenKey="jeongdong-walk-tutorial";

export function bindTutorial(card,mobile){
  const doc=card.ownerDocument;
  const title=doc.getElementById("tutorial-title"),description=doc.getElementById("tutorial-description");
  const next=doc.getElementById("tutorial-next"),skip=doc.getElementById("tutorial-skip");
  const saved=localStorage.getItem(seenKey);
  let seen=saved==="done"||saved==="done-pace",keyboardHintSeen=saved==="done-pace";
  let paceOnly=false,index=0,remaining=duration,last=0,highlight=null;
  function needsStart(){return card.hidden&&(!seen||(!mobile.matches&&!keyboardHintSeen));}
  function clearHighlight(){highlight?.classList.remove("tutorial-highlight");highlight=null;}
  function draw(){
    clearHighlight();
    const step=STEPS[index];
    const touch=mobile.matches;
    title.textContent=step.title;description.textContent=touch&&step.touchText?step.touchText:step.text;
    if(index===0&&!touch)keyboardHintSeen=true;
    next.textContent=paceOnly||index===STEPS.length-1?"마치기":"다음";
    skip.hidden=paceOnly;
    const target=touch&&step.touchTarget?step.touchTarget:step.target;
    highlight=[...doc.querySelectorAll(target)].find(element=>element.getClientRects().length)??null;
    highlight?.classList.add("tutorial-highlight");
  }
  function close(remember=false){
    card.hidden=true;clearHighlight();last=0;
    if(remember){seen=true;localStorage.setItem(seenKey,keyboardHintSeen?"done-pace":"done");}
  }
  function start(replay=false){
    if(!replay&&!needsStart())return;
    paceOnly=seen&&!replay;
    index=0;remaining=9000;last=0;card.hidden=false;draw();
  }
  function advance(){
    if(paceOnly||index+1===STEPS.length){close(true);return;}
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
  mobile.addEventListener("change",()=>{if(!card.hidden)draw();});
  return {start,update,close,get needsStart(){return needsStart();}};
}
