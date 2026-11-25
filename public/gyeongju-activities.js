import {places,cafeLayout} from "./gyeongju-layout.js";
import {cafeFittings} from "./gyeongju-cafe.js";
import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";

export const gyeongjuActionIds=["gjCoffee","gjStars"];
const cafe=cafeFittings(cafeLayout),counter=gyeongjuPoint(cafe.order),stars=gyeongjuPoint(places.stars);
const orderWords=/커피|아메리카노|라테|라떼/;
const cupCounts={한:1,하나:1,두:2,둘:2,세:3,네:4};
const dipper=[[16,36],[27,27],[39,35],[50,52],[68,65],[83,45],[64,36]];

function starChart(say,notice){
 const chart=document.createElement("dialog");
 chart.id="gyeongju-star-chart";chart.setAttribute("aria-labelledby","gj-chart-title");
 chart.innerHTML='<div class="dialog-top"><h2 id="gj-chart-title">첨성대의 밤하늘</h2><form method="dialog"><button class="quiet close" aria-label="닫기">×</button></form></div><p>북두칠성에서 친구에게 보여줄 별을 골라 보세요.</p><div class="gj-night-sky"></div><button class="primary" type="button" disabled>별 가리키기</button>';
 const sky=chart.querySelector(".gj-night-sky"),share=chart.querySelector(".primary");
 let selected=null;
 for(const [i,[x,y]] of dipper.entries()){
  const button=document.createElement("button");
  button.type="button";button.textContent="✦";button.style.left=x+"%";button.style.top=y+"%";
  button.setAttribute("aria-label","북두칠성의 "+(i+1)+"번째 별");button.setAttribute("aria-pressed","false");
  button.onclick=()=>{
   selected?.setAttribute("aria-pressed","false");selected=button;
   button.setAttribute("aria-pressed","true");share.disabled=false;
   share.onclick=()=>{if(say("저기 봐요! 북두칠성 손잡이 끝에서 "+(i+1)+"번째 별이에요."))chart.close();else notice("작성 중인 채팅을 먼저 보내 주세요.");};
  };
  sky.append(button);
 }
 chart.addEventListener("close",()=>chart.remove(),{once:true});
 document.body.append(chart);chart.showModal();
}

export function createGyeongjuActivities({me,takeItem,environment,notice,say}){
 const distance=p=>Math.hypot(me.x-p.x,me.y-p.y);
 const insideCafe=()=>{
  const p=cafe.local(localGyeongju(me));
  return Math.abs(p.x)<cafeLayout.width/2&&Math.abs(p.z)<cafeLayout.depth/2;
 };
 function order(quantity){
  let served=0;
  while(served<Math.min(2,quantity)&&takeItem("coffee"))served++;
  if(served)notice("카페 직원 · 커피 "+served+"잔 나왔습니다!"+(served<quantity?" 나머지는 손을 비우고 주문해 주세요.":""));
 }
 function chat(text){
  if(!insideCafe())return false;
  if(orderWords.test(text)&&!/없|싫|안\s*(마|먹)|마셨어/.test(text)){
   const count=text.match(/(\d+|하나|둘|한|두|세|네)\s*잔/);
   order(count?Number(cupCounts[count[1]]??count[1]):1);return true;
  }
  if(/^(?:사장님|이모|여기요|저기요)[\s!?.~]*$/.test(text)){notice("카페 직원 · 네, 어떤 커피 드릴까요?");return true;}
  return false;
 }
 function menu(){
  const actions=new Map();
  if(insideCafe()&&distance(counter)<3.2)actions.set("gjCoffee",{label:"커피 주문하기",marker:counter,run:()=>order(1)});
  if(distance(stars)<14&&environment().night>.55)actions.set("gjStars",{label:"별자리 보기",marker:stars,run:()=>starChart(say,notice)});
  return actions;
 }
 return {menu,chat};
}
