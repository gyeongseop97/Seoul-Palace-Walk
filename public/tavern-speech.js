import {tavernMenu,validTavernOrder} from "./tavern-menu.js";

const counters={
 soju:{병:4,잔:1},sashimi:{접시:3,점:1},grilledClam:{개:1,마리:1,바구니:3}
};
const names={소주:"soju",회:"sashimi",모둠회:"sashimi",모듬회:"sashimi",활어회:"sashimi",조개:"grilledClam",조개구이:"grilledClam"};
const numerals={한:1,하나:1,일:1,두:2,둘:2,이:2,세:3,셋:3,삼:3,네:4,넷:4,사:4,다섯:5,오:5,여섯:6,육:6,일곱:7,칠:7,여덟:8,팔:8,아홉:9,구:9};
function quantity(word){
 if(/^\d+$/u.test(word))return Number(word);
 if(Object.hasOwn(numerals,word))return numerals[word];
 const tens=/^(스물|스무|열|이십|십)(.*)$/u.exec(word);
 if(!tens)return NaN;
 const tail=tens[2]?numerals[tens[2]]:0;
 return (["열","십"].includes(tens[1])?10:20)+tail;
}
export const tavernOrderExample="메뉴와 수량을 다시 말씀해 주세요. 회 두 접시, 소주 세 병, 조개 세 개처럼요.";
const labels={soju:"소주",sashimi:"회",grilledClam:"조개"};
const defaults={soju:"병",sashimi:"접시",grilledClam:"개"};
const row=/^(모둠회|모듬회|활어회|조개구이|소주|조개|회)(?:를|을|는|은)?(\d+|[한하나두둘세셋네넷다섯여일곱덟아홉스물무열이십삼사오육칠팔구]+)(접시|바구니|병|잔|점|마리|개)?/u;
const requestEnd=/(?:좀|만)?(?:부탁(?:드려요|드립니다|해요|합니다)|주문(?:할게요|합니다|이요)?|(?:가져다|갖다|가져와)?주세요|주실래요|주실수있나요|주시겠어요|이요|요)$/u;
function makeOrder(lines){
 const portions={soju:0,sashimi:0,grilledClam:0};
 for(const {kind,n,unit} of lines){
  const perUnit=counters[kind][unit];
  if(!perUnit||!Number.isInteger(n)||n<=0)return null;
  portions[kind]+=n*perUnit;
  if(portions[kind]>9*tavernMenu.find(item=>item.kind===kind).servings)return null;
 }
 return {portions,summary:lines.map(({kind,n,unit})=>labels[kind]+" "+n+unit).join(", ")};
}
export function menuTicket(items){
 if(!validTavernOrder(items))return null;
 return makeOrder(tavernMenu.filter(item=>items[item.kind]>0).map(({kind,unit})=>({kind,n:items[kind],unit})));
}
export function readTavernSpeech(text){
 if(typeof text!=="string"||[...text].length>80)return null;
 let rest=text.normalize("NFC").replace(/\s+/gu,"").replace(/[!?~。！？.]+$/u,"");
 const greeting=/^(이모(?:님)?|사장님|저기요|여기요)(?:[,!~.，！]+)?/u.exec(rest);
 if(greeting)rest=rest.slice(greeting[0].length);
 if(greeting&&/^(?:여기요|저기요|잠시만요|와주세요|여기(?:주문이요|주문할게요))$/u.test(rest))return {call:true};
 if(!rest)return greeting?{call:true}:null;
 const original=rest;
 rest=rest.replace(requestEnd,"");
 const looksLikeOrder=/\d|(?:한|두|세|네|하나|둘|셋|넷|다섯|여섯|일곱|여덟|아홉|열|스무|일|이|삼|사|오|육|칠|팔|구|십)(?:병|잔|접시|점|바구니|개|마리)/u.test(original);
 const lines=[];
 while(rest){
  const match=row.exec(rest);
  if(!match)return looksLikeOrder&&(lines.length||greeting||/소주|조개|모둠회|모듬회|회/u.test(original))?{error:tavernOrderExample}:null;
  const kind=names[match[1]],n=quantity(match[2]),unit=match[3]??defaults[kind];
  lines.push({kind,n,unit});
  rest=rest.slice(match[0].length);
  if(!rest)break;
  rest=rest.replace(/^(?:(?:,|，|、|랑|이랑|하고|그리고|이요|요|와|과|에))+/u,"");
  if(!rest)return {error:tavernOrderExample};
 }
 if(!lines.length)return greeting?{call:true}:null;
 const order=makeOrder(lines);
 return order?{call:Boolean(greeting),order}:{error:"수량을 확인해 주세요. 한 번에 소주 9병, 회 9접시, 조개 27개까지 주문할 수 있어요."};
}
export function tavernReply(order,now){
 if(!order)return "";
 if(order.phase==="called")return "네, 지금 갈게요!";
 if(order.phase==="ordering")return "기다리셨죠? 뭐 드릴까요?";
 if(order.phase==="cooking"&&now<order.ordered+4200)return order.summary?(order.summary+" 맞으시죠? 준비해 드릴게요!"):"네, 주문하신 음식 준비해 드릴게요!";
 if(order.phase==="cooking"&&now>=order.ready)return "주문하신 음식 나갑니다!";
 if(order.phase==="served"&&now<order.served+4500)return "여기 주문하신 음식이요. 맛있게 드세요!";
 return "";
}
