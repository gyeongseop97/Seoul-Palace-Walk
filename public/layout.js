import {interiorAt,interiorBounds} from "./interior-layout.js";

const origin = {lat:37.56780,lng:126.97150};
export const eastMetres=88263, northMetres=111000;
export const project = (name,lat,lng) => ({
  name,lat,lng,x:(lng-origin.lng)*eastMetres,y:(origin.lat-lat)*northMetres
});
const p=project;
// The visitor-map grid is fitted to the gate, hall and pavilion coordinates below.
// Both project() and mapPoint() return metres east and south from the same origin.
const mapPoint=([u,v],name="")=>{
  const x=151.4+.377*u,y=32.1+.379*v;
  return {name,x,y,lat:origin.lat-y/northMetres,lng:origin.lng+x/eastMetres};
};
const outline=(points)=>points.map(point=>mapPoint(point));
export const gate=p("대한문",37.56503,126.97655);
export const ticket={...p("덕수궁 매표소",gate.lat+10.3/northMetres,gate.lng+17.4/eastMetres),w:7.9,d:3.16,angle:Math.PI/2};
export const ticketApproach=p("매표소 앞",ticket.lat,ticket.lng+4.3/eastMetres);
export const ticketGuide={x:ticket.x+2.5,y:ticket.y-5,approach:{x:ticket.x+3.9,y:ticket.y-5}};
export const spawn=p("대한문 앞 매표 광장",37.56515,126.97679);
export const bridge=p("금천교",37.56503,126.97641);
export const middle=p("중화문",37.56523,126.97467);
export const hall=p("중화전",37.56581,126.97482);
export const stoneHall=p("석조전",37.56641,126.97425);
export const stoneFountain=mapPoint([245,488],"석조전 분수 정원");
export const court=p("중화전 마당",37.56553,126.97475);
export const courtAngle=-.19;
export const fountain=p("정동 분수",37.56524,126.97336);
export const garden=p("정동길 쉼터",37.56480,126.97453);

export const route = [
  p("대한문 돌담길 입구",37.56494,126.97660),
  p("덕수궁 돌담길",37.56480,126.97645),
  p("덕수궁 돌담길",37.56483,126.97598),
  p("덕수궁 돌담길",37.56483,126.97545),
  p("덕수궁 돌담길",37.56478,126.97481),
  p("덕수궁 돌담길",37.56473,126.97422),
  p("정동 분수 방향",37.56476,126.97394),
  p("정동 분수 방향",37.56491,126.97369),
  p("정동 분수 방향",37.56510,126.97352),
  fountain,
  p("정동제일교회 앞",37.56534,126.97310),
  p("정동길",37.56555,126.97265),
  p("정동길",37.56567,126.97233)
];
export const entranceWalk = [spawn,{x:spawn.x+2,y:route[0].y-6},route[0]];
// Pavement along the avenue north of the gate plaza, outside the palace's east wall: City Hall
// station exit 2 stands beside the pond and the bus stop a little further toward exit 3.
export const stationWalk=[{x:473.75,y:289},{x:473.75,y:177}];
export const palace = [
  spawn,p("매표 광장",37.56503,126.97671),gate,bridge,
  mapPoint([711,706],"덕수궁 종합안내도"),
  mapPoint([689,660],"덕수궁 안길"),mapPoint([614,646],"광명문 앞"),
  mapPoint([570,632],"덕수궁 안길"),mapPoint([510,687],"중화문 가는 길"),
  mapPoint([390,725],"중화문 앞"),{...middle,y:middle.y+10},middle,court,
  mapPoint([335,586],"중화전 서쪽"),mapPoint([300,583],"중화전 서쪽"),
  mapPoint([300,548],"석조전 가는 길"),mapPoint([306,501],"석조전 가는 길"),
  mapPoint([317,440],"석조전 가는 길"),
  mapPoint([270,421],"석조전 분수 정원"),mapPoint([247,397],"석조전 앞")
];

// The visitor route, small garden circuits and courts follow the current
// Royal Palaces and Tombs Center plan. Ground finishes follow on-site photos.
const path=(name,width,surface,points,edge=false)=>({name,width,surface,points,edge});
const roundel=(radius)=>Array.from({length:24},(_,i)=>{
  const angle=i*Math.PI/12;
  return [244+radius*Math.cos(angle),607+radius*Math.sin(angle)];
});
const gardenRoundel=outline(roundel(13));
export const palacePaths = [
  path("대한문과 금천교",7.1,"stone",palace.slice(0,4)),
  path("금천교 안쪽 관람로",7.1,"gravel",palace.slice(3,5)),
  path("매표소에서 대한문 앞까지",5.0,"stone",[ticketApproach,palace[1]]),
  path("금천교에서 중화문까지",7.6,"gravel",outline([[711,706],[683,709],[640,710],[581,713],[529,718],[457,724],[390,725]])),
  path("광명문 갈림길",4.4,"gravel",palace.slice(4,10)),
  path("중화문과 중화전",4.1,"stone",palace.slice(9,13)),
  path("중화전 서쪽에서 석조전까지",5.4,"gravel",palace.slice(12)),
  path("중화전 마당 서쪽 둘레",4.5,"gravel",outline([[390,725],[349,706],[315,682],[314,642],[319,610],[335,586]])),
  path("대한문 안길",4.2,"gravel",outline([[711,706],[720,655],[723,611],[727,560],[723,520],[695,496]])),
  path("연못 동쪽 산책길",3.2,"gravel",outline([[723,611],[752,624],[807,629],[824,606],[827,574],[829,532],[823,495],[816,475],[792,461],[756,454],[729,452],[715,441]]),true),
  path("연못 서쪽 산책길",3.4,"gravel",outline([[689,660],[691,601],[703,558],[715,521],[722,481],[729,451],[734,411],[731,381]]),true),
  path("정관헌 동쪽 산책길",3.7,"gravel",outline([[823,495],[814,466],[801,432],[787,404],[771,390],[751,384],[724,381],[697,376],[663,367],[631,354],[587,344],[540,335],[497,322]])),
  path("정관헌 북쪽 산책길",3.1,"gravel",outline([[724,381],[723,350],[723,322],[710,308],[702,327],[700,357],[695,376]])),
  path("정관헌에서 함녕전까지",3.8,"gravel",outline([[587,344],[580,380],[574,410],[576,445],[576,493],[574,532],[585,576],[600,623],[584,677],[581,714]])),
  path("광명문 둘레길",3.0,"gravel",outline([[600,623],[588,619],[592,601],[612,598],[631,606],[631,628],[614,646]])),
  path("융안문 앞길",4.4,"gravel",outline([[614,646],[622,623],[649,589],[663,570],[623,556],[579,544],[534,531],[494,516],[466,502]])),
  path("함녕전 뒤뜰",3.4,"gravel",outline([[574,532],[548,508],[540,485],[513,471],[502,439],[504,406],[509,378],[511,349],[497,322]])),
  path("즉조당에서 중화전까지",4.1,"gravel",outline([[502,439],[474,440],[435,430],[408,415],[388,397],[368,396],[356,421],[317,440]])),
  path("중화전 동쪽",5.3,"gravel",outline([[466,502],[451,541],[439,580],[416,623],[393,650],[369,689],[390,725]])),
  path("남쪽 정원길",4.8,"gravel",outline([[390,725],[339,716],[284,705],[224,692],[173,682],[155,662],[143,641]])),
  path("서쪽 산책길",3.8,"gravel",outline([[143,641],[148,611],[154,581],[155,544],[155,496],[158,451],[153,415],[153,374],[155,348],[163,340]])),
  path("석조전 서관과 정원",4.3,"stone",outline([[153,415],[169,425],[185,451],[188,483],[188,529],[182,567],[167,594],[148,611]])),
  path("석조전 정원 외곽",3.7,"gravel",outline([[170,424],[195,413],[234,413],[268,413],[299,416],[309,444],[309,481],[305,521],[300,552],[290,561],[246,558],[203,558],[183,571]]),true),
  path("석조전 정원 중앙길 북쪽",3.3,"gravel",outline([[244,395],[245,431],[245,462]])),
  path("석조전 정원 중앙길 남쪽",3.3,"gravel",outline([[245,521],[244,559],[244,594]])),
  path("석조전 정원 원형 화단",2.1,"gravel",[...gardenRoundel,gardenRoundel[0]],true),
  path("석조전 원형 화단에서 남쪽 정원까지",3.2,"gravel",outline([[244,620],[244,672],[224,692]])),
  path("석조전 북쪽에서 정관헌까지",4.8,"gravel",outline([[163,340],[132,344],[99,342],[98,321],[106,296],[128,270],[157,246],[204,245],[251,244],[303,250],[337,260],[360,277],[391,290],[425,297],[459,308],[497,322]])),
  path("궁 북쪽 둘레길",3.3,"gravel",outline([[391,290],[410,301],[430,313],[452,332],[477,339],[497,322],[486,302],[489,282],[495,272],[480,271],[469,282],[459,308]])),
  path("돈덕전에서 평성문까지",3.8,"gravel",outline([[251,244],[274,223],[256,204],[239,183],[231,156],[226,127],[210,118],[182,128],[173,151],[163,180],[145,206],[124,219],[103,224],[93,230]])),
  path("돈덕전 입구",4.0,"gravel",outline([[145,206],[140,183],[125,170],[108,165]])),
  path("평성문에서 석조전으로",3.8,"gravel",outline([[93,230],[98,250],[110,270],[128,270],[157,246]]))
];

const area=(name,kind,points)=>({name,kind,outline:outline(points)});
export const palaceCourts = [
  area("금천교 앞마당","stone",[[677,692],[733,693],[757,707],[751,732],[710,735],[684,724]]),
  area("중화전 마당","stone",[[346,497],[449,519],[417,683],[318,662]]),
  area("석조전 테라스","gravel",[[165,361],[311,363],[310,411],[165,408]]),
  area("석조전 서관 앞","gravel",[[144,358],[163,369],[172,429],[168,491],[155,563],[135,570]]),
  area("즉조당 앞마당","gravel",[[321,356],[419,377],[410,440],[335,427],[313,397]]),
  area("덕홍전 앞마당","gravel",[[510,475],[558,483],[572,515],[511,510]]),
  area("함녕전 앞마당","gravel",[[580,479],[668,491],[657,540],[566,519]]),
  area("정관헌 앞마당","gravel",[[520,319],[611,325],[608,349],[522,334]]),
  area("돈덕전 앞마당","gravel",[[63,144],[109,143],[139,164],[137,205],[109,217],[90,204],[81,184]])
];

export const palaceGardens = [
  area("돈덕전 숲","grove",[[34,18],[174,14],[215,57],[241,104],[214,111],[175,118],[160,148],[141,169],[124,181],[103,205],[65,217],[47,154]]),
  area("돈덕전 동쪽 숲","grove",[[182,134],[221,124],[230,170],[248,200],[269,218],[246,239],[158,240],[158,212],[170,184]]),
  area("궁 북쪽 숲","grove",[[263,192],[333,206],[358,228],[382,249],[451,267],[506,262],[489,275],[468,281],[454,302],[400,286],[364,275],[336,251],[303,244],[255,239],[283,220]]),
  area("정관헌 서쪽 숲","grove",[[471,343],[499,330],[494,359],[488,398],[469,385],[455,361]]),
  area("정관헌 화단","lawn",[[530,342],[582,352],[567,410],[542,404],[523,395]]),
  area("함녕전 뒤뜰 잔디","lawn",[[593,355],[631,363],[650,374],[682,382],[680,402],[649,392],[635,420],[579,407]]),
  area("정관헌 동쪽 숲","grove",[[631,293],[666,290],[714,290],[726,299],[725,371],[709,368],[713,314],[700,309],[697,365],[626,350]]),
  area("궁 동쪽 숲","grove",[[746,285],[837,280],[837,465],[814,457],[789,407],[770,387],[737,379]]),
  area("연못 북쪽 잔디","lawn",[[729,389],[756,390],[779,401],[798,431],[804,452],[766,445],[720,442]]),
  area("연못 서쪽 잔디","lawn",[[722,452],[759,454],[793,463],[816,478],[814,501],[796,495],[775,486],[753,491],[741,510],[718,498]]),
  area("연못 아래 잔디","lawn",[[746,607],[778,619],[809,620],[837,598],[837,673],[792,697],[745,686]]),
  area("융안문 동쪽 잔디","lawn",[[707,511],[724,519],[731,550],[731,578],[698,571]]),
  area("광명문 동쪽 화단","lawn",[[699,592],[727,600],[735,616],[733,682],[715,689],[702,656]]),
  area("광명문 위쪽 정원","lawn",[[533,554],[597,573],[588,611],[533,599],[522,585]]),
  area("광명문 옆 정원","lawn",[[618,577],[676,589],[678,632],[613,616]]),
  area("광명문 남서쪽 정원","lawn",[[528,626],[583,640],[573,706],[462,714],[473,665]]),
  area("광명문 남동쪽 정원","lawn",[[600,643],[654,654],[687,664],[697,705],[633,699],[588,704]]),
  area("중화전 동쪽 숲","grove",[[471,532],[493,535],[516,549],[517,568],[509,588],[507,610],[486,632],[448,647],[423,645],[420,632],[434,587],[442,560],[455,539]]),
  area("석조전 분수 서북 잔디","parterre",[[197,435],[235,435],[235,457],[219,470],[219,482],[197,482]]),
  area("석조전 분수 동북 잔디","parterre",[[255,435],[293,435],[293,482],[271,482],[271,470],[255,457]]),
  area("석조전 분수 서남 잔디","parterre",[[198,501],[216,501],[224,513],[236,519],[236,545],[198,545]]),
  area("석조전 분수 동남 잔디","parterre",[[274,501],[292,501],[292,545],[254,545],[254,519],[266,513]]),
  area("석조전 정원 서쪽 화단","parterre",[[193,571],[233,571],[233,593],[220,606],[204,600],[193,586]]),
  area("석조전 정원 동쪽 화단","parterre",[[255,571],[287,572],[287,587],[274,606],[255,594]]),
  area("석조전 정원 원형 화단","parterre",roundel(11)),
  area("석조전 아래 정원","parterre",[[194,622],[215,615],[228,621],[230,657],[235,672],[213,668],[198,650]]),
  area("석조전 아래 동쪽 정원","parterre",[[258,622],[275,615],[281,633],[273,652],[256,671],[251,661]]),
  area("석조전 남쪽 잔디","grove",[[84,565],[101,570],[123,591],[139,623],[129,649],[109,629],[91,616]]),
  area("남쪽 담장 숲","grove",[[108,664],[137,679],[186,695],[234,707],[290,721],[347,734],[405,740],[488,739],[559,735],[628,727],[690,729],[743,747],[770,766],[692,758],[632,749],[553,755],[472,765],[386,777],[306,788],[217,794],[189,785],[159,757],[142,725]])
];

export const palacePond = {
  ...mapPoint([781,543],"덕수궁 연못"),
  island:{...mapPoint([780,547]),radiusX:1.88,radiusY:1.38},
  outline:outline([[756,490],[769,490],[788,499],[806,514],[816,532],[819,545],[816,562],[809,584],[800,591],[786,589],[767,580],[753,573],[747,559],[747,540],[748,515]])
};

// Landmark specimens are visual anchors based on the photographed silhouettes.
// Positions are approximate within each court or garden, in map metres.
export const palacePlantings=[
  {point:mapPoint([173,392]),kind:"pine",height:4.4,spread:4.9,phase:.36},
  {point:mapPoint([307,392]),kind:"pine",height:4.7,spread:5.4,phase:1.65},
  {point:mapPoint([168,533]),kind:"pine",height:4.3,spread:4.7,phase:3.03},
  {point:mapPoint([333,477]),kind:"ginkgo",height:11.6,spread:7.2,phase:.66},
  {point:mapPoint([321,555]),kind:"ginkgo",height:11.2,spread:7.0,phase:2.36},
  {point:mapPoint([468,565]),kind:"zelkova",height:12.6,spread:10.3,phase:2.43},
  {point:mapPoint([462,625]),kind:"maple",height:8.1,spread:7.2,phase:4.8},
  {point:mapPoint([742,504]),kind:"zelkova",height:10.8,spread:8.4,phase:.98},
  {point:mapPoint([776,427]),kind:"maple",height:7.6,spread:7.3,phase:3.26},
  {point:mapPoint([665,321]),kind:"pine",height:6.2,spread:6.4,phase:1.14},
  {point:mapPoint([450,281]),kind:"maple",height:8.5,spread:7.9,phase:1.94},
  {point:mapPoint([358,239]),kind:"zelkova",height:11.3,spread:9.7,phase:5.48},
  {point:mapPoint([167,199]),kind:"ginkgo",height:10.6,spread:6.7,phase:4.2}
];

// OpenStreetMap confirms major centres. Detailed roof plans and landscape geometry
// are approximations from the visitor map. Dimensions and heights are metres.
export const pavilions = [
  { ...p("광명문",37.56540,126.97583),w:13.7,d:8.0,h:3.2,bays:3,angle:-.21,gate:true,sign:"光明門" },
  { ...p("함녕전",37.56597,126.97594),w:29.5,d:17.6,h:3.7,bays:9,angle:-.21,sign:"咸寧殿",interior:"living",
    fit:{w:25.5,d:8.0,z:-.2,floor:1.9,porch:2.3,gap:2.6,height:3.3},
    outline:outline([[598,415],[630,423],[625,440],[677,451],[667,489],[586,472]]) },
  { ...p("덕홍전",37.56596,126.97555),w:16.9,d:15.0,h:3.8,bays:3,angle:-.24,sign:"德弘殿",interior:"reception" },
  { ...p("석어당",37.56613,126.97517),w:23.4,d:12.4,h:6.1,bays:8,angle:-.20,stories:2,sign:"昔御堂",interior:"plain",plain:true,
    fit:{w:20.5,d:6.4,z:0,floor:1.09,porch:1.2,gap:2.4,height:2.9} },
  { ...p("즉조당",37.56630,126.97498),w:19.6,d:9.4,h:3.6,bays:5,angle:-.20,sign:"卽阼堂",interior:"living" },
  { ...mapPoint([354,346],"준명당"),w:21.0,d:10.7,h:3.6,bays:6,angle:-.20,sign:"浚明堂",interior:"living" },
  { ...mapPoint([380,351],"준명당 연결 행각"),w:6.8,d:4.2,h:2.7,bays:2,angle:-.20 },
  { ...p("정관헌",37.56645,126.97565),w:20.2,d:13.5,h:4.4,bays:7,angle:-.04,open:true,sign:"靜觀軒" },
  { ...p("돈덕전",37.56716,126.97367),w:28.8,d:38.5,h:13.4,angle:.17,brick:true,kind:"redBrick" },
  { ...mapPoint([119,480],"국립현대미술관 덕수궁관"),w:83,d:17.8,h:13.7,angle:Math.PI/2-.014,kind:"western" },
  { ...mapPoint([143,323],"석조전 서관 연결부"),w:27.4,d:5.6,h:5.2,angle:.02,kind:"westernAnnex" },
  { ...mapPoint([511,297],"정관헌 서쪽 부속채"),w:7.4,d:10.4,h:2.9,bays:2,angle:-.15 },
  { ...mapPoint([521,516],"융안문"),w:7.1,d:5.4,h:2.9,bays:3,angle:-.24,gate:true,sign:"隆安門" },
  { ...mapPoint([78,228],"평성문"),w:7.2,d:4.5,h:3.0,bays:3,angle:Math.PI/2,sign:"平成門" },
  { ...mapPoint([119,646],"월곡문"),w:11.8,d:5.0,h:3.0,bays:3,angle:Math.PI*.76,sign:"月谷門" },
  { ...mapPoint([791,605],"덕수궁 기념품점"),w:13.5,d:8.3,h:3.3,bays:4,angle:-.20 },
  { ...mapPoint([414,689],"중화문 옆 안내소"),w:10.3,d:13.7,h:3.1,bays:3,angle:-.16,kind:"utility" },
  { ...mapPoint([198,707],"서쪽 정원 부속채"),w:14.3,d:11.8,h:3.1,bays:3,angle:-.20,kind:"utility" }
];

const perimeter = [[33,18],[171,13],[193,32],[217,69],[234,108],[242,154],[250,175],[278,185],
  [351,206],[370,226],[412,244],[443,254],[474,251],[500,258],[542,271],[587,284],
  [668,286],[749,281],[845,278],[843,541],[842,670],[816,690],[791,698],[776,716],
  [770,765],[702,756],[637,751],[560,757],[474,767],[383,778],[302,790],[226,797],
  [186,790],[160,767],[144,727],[114,689],[91,648],[85,608],[85,369],[87,284],[75,226],
  [62,169],[46,113],[34,69]];
export const estateOutline=outline(perimeter);
const southWall=estateOutline.slice(24,37);
// The public verge follows the outer wall from the road to the Jeongdong turn.
export const stonewallVerge=[...southWall,...route.slice(1,10).reverse()];
const wallLine=(kind,height,points,tiles=false)=>points.slice(1).map((b,index)=>({a:points[index],b,kind,height,tiles}));
export const palaceWalls = [
  ...wallLine("outer",2.85,estateOutline.slice(0,23)),
  ...wallLine("outer",2.85,[estateOutline[22],{x:gate.x-1,y:gate.y-7}]),
  ...wallLine("outer",3.18,[{x:gate.x-1,y:gate.y+7},...southWall],true),
  ...wallLine("outer",2.72,[...estateOutline.slice(36),estateOutline[0]]),
  ...wallLine("corridor",2.8,outline([[624,433],[646,395],[702,409],[687,486],[672,548],[574,529],[543,522]])),
  ...wallLine("corridor",2.8,outline([[505,514],[496,510],[500,486]])),
  ...wallLine("court",1.42,outline([[383,676],[406,680],[414,647]])),
  ...wallLine("court",1.38,outline([[489,391],[498,364],[505,347]])),
  ...wallLine("court",1.3,outline([[310,360],[309,373],[319,375]]))
];

export const city = [
  {...p("서울광장",37.56572,126.97791), w:62,d:47,h:0},
  {...p("서울시청 서소문청사",37.56447,126.97497),w:47,d:24,h:31},
  {...p("서울시의회 별관",37.56454,126.97400),w:39,d:23,h:16},
  {...p("정동제일교회",37.56522,126.97298),w:21,d:26,h:11,brick:true,church:true},
  {...p("서울시립미술관",37.56410,126.97365),w:41,d:24,h:16,brick:true},
  {...p("서울도서관",37.566283,126.977873),w:55,d:22.4,h:19},
  {...p("정동극장",37.56563,126.97308),w:27,d:21,h:14}
];
export const landmarks=[spawn,ticket,gate,bridge,middle,court,hall,stoneHall,stoneFountain,palacePond,...palace,...route,...pavilions];
export function addLandmarks(points){landmarks.push(...points);}
// Neighbouring zones share the same coordinate system and may overlap at their edges.
const zones=[],waterZones=[];
export function addZone(zone){
  zones.push(zone);
  if(zone.water)waterZones.push(zone);
}
export function zoneAt(x,y){
  for(const zone of zones)if(zone.contains(x,y))return zone;
  return null;
}
export const distance=(point,x,y)=>Math.hypot(point.x-x,point.y-y);
export function nearest(x,y){
  let best=landmarks[0],shortest=(best.x-x)**2+(best.y-y)**2;
  for(let index=1;index<landmarks.length;index++){
    const point=landmarks[index],gap=(point.x-x)**2+(point.y-y)**2;
    if(gap<shortest){best=point;shortest=gap;}
  }
  return best;
}

function inPolygon(x,y,points){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if ((a.y>y)!==(b.y>y) && x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) inside=!inside;
  }
  return inside;
}
function boundsOf(points,padding=0){
  const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
  return {minX:Math.min(...xs)-padding,maxX:Math.max(...xs)+padding,minY:Math.min(...ys)-padding,maxY:Math.max(...ys)+padding};
}
const inBounds=(bounds,x,y)=>x>=bounds.minX&&x<=bounds.maxX&&y>=bounds.minY&&y<=bounds.maxY;
function polygonContains(points){
  const bounds=boundsOf(points);
  return (x,y)=>inBounds(bounds,x,y)&&inPolygon(x,y,points);
}
function pathContains(points,radius){
  const radiusSquared=radius*radius;
  const segments=points.slice(1).map((b,index)=>{
    const a=points[index],dx=b.x-a.x,dy=b.y-a.y;
    return {a,dx,dy,lengthSquared:dx*dx+dy*dy,bounds:boundsOf([a,b],radius)};
  });
  return (x,y)=>{
    for(const {a,dx,dy,lengthSquared,bounds} of segments){
      if(!inBounds(bounds,x,y))continue;
      const ox=x-a.x,oy=y-a.y;
      const t=lengthSquared?Math.max(0,Math.min(1,(ox*dx+oy*dy)/lengthSquared)):0;
      if((ox-dx*t)**2+(oy-dy*t)**2<radiusSquared)return true;
    }
    return false;
  };
}
const inEstate=polygonContains(estateOutline),inVerge=polygonContains(stonewallVerge),inPond=polygonContains(palacePond.outline);
const onEntrance=pathContains(entranceWalk,7.4),onStationWalk=pathContains(stationWalk,3.6);
const onStonewall=pathContains(route,5.4),onPalace=pathContains(palace,4.1);

const obstacleBuckets = new Map();
let activeObstacles=obstacleBuckets;
let obstacleRecorder=null;
// A detached district builds against its own obstacles. The world keeps its baked
// collision data throughout the build, including between generator steps.
export function withObstacleScope(buckets,build,record=null){
  const previous=activeObstacles,previousRecorder=obstacleRecorder;
  activeObstacles=buckets;obstacleRecorder=record;
  try{return build();}finally{activeObstacles=previous;obstacleRecorder=previousRecorder;}
}
const stride=10;
function bucketKey(x,y){return Math.floor(x/stride)+Math.floor(y/stride)*1000;}
export function addObstacle(x,y,width,depth,angle=0,top=Infinity){
  obstacleRecorder?.(x,y,width,depth,angle,top);
  const c=Math.cos(angle),s=Math.sin(angle);
  const halfWidth=width/2+.29,halfDepth=depth/2+.29;
  const box={x,y,c,s,halfWidth,halfDepth,top};
  const spanX=Math.abs(c)*halfWidth+Math.abs(s)*halfDepth,spanY=Math.abs(s)*halfWidth+Math.abs(c)*halfDepth;
  for(let px=Math.floor((x-spanX)/stride);px<=Math.floor((x+spanX)/stride);px++){
    for(let py=Math.floor((y-spanY)/stride);py<=Math.floor((y+spanY)/stride);py++){
      const key=px+py*1000;
      if(!activeObstacles.has(key))activeObstacles.set(key,[]);
      activeObstacles.get(key).push(box);
    }
  }
}
export function solidAt(x,y,height=0){
  const boxes=activeObstacles.get(bucketKey(x,y));
  if(!boxes)return false;
  for(const box of boxes){
    if(height>box.top)continue;
    const dx=x-box.x,dy=y-box.y;
    if(Math.abs(dx*box.c-dy*box.s)<box.halfWidth && Math.abs(dx*box.s+dy*box.c)<box.halfDepth)return true;
  }
  return false;
}
// A walker whose feet are at least this close to the top of a box may pass over or stand on it.
const stepReach=.03;
const feetLevel=feet=>feet>0?feet+stepReach:0;
// Height of the tallest finite box under a point. With soft=true the edge eases down to the
// ground across the collision margin so a walker does not hover beside the object.
export function platformAt(x,y,soft=false){
  const boxes=activeObstacles.get(bucketKey(x,y));
  if(!boxes)return 0;
  let top=0;
  for(const box of boxes){
    if(box.top===Infinity)continue;
    const dx=x-box.x,dy=y-box.y;
    const inX=box.halfWidth-Math.abs(dx*box.c-dy*box.s),inY=box.halfDepth-Math.abs(dx*box.s+dy*box.c);
    if(inX<=0||inY<=0)continue;
    const height=soft?box.top*Math.min(1,Math.min(inX,inY)/.26):box.top;
    if(height>top)top=height;
  }
  return top;
}
function crossesBox(x,y,dx,dy,box){
  const ox=x-box.x,oy=y-box.y;
  const fromX=ox*box.c-oy*box.s,fromY=ox*box.s+oy*box.c;
  const deltaX=dx*box.c-dy*box.s,deltaY=dx*box.s+dy*box.c;
  let enter=0,leave=1;
  if(deltaX){
    const a=(-box.halfWidth-fromX)/deltaX,b=(box.halfWidth-fromX)/deltaX;
    enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
    if(enter>=leave)return false;
  }else if(Math.abs(fromX)>=box.halfWidth)return false;
  if(!deltaY)return Math.abs(fromY)<box.halfDepth;
  const a=(-box.halfDepth-fromY)/deltaY,b=(box.halfDepth-fromY)/deltaY;
  return Math.max(enter,Math.min(a,b))<Math.min(leave,Math.max(a,b));
}
function crossesObstacle(from,to,level=0){
  const dx=to.x-from.x,dy=to.y-from.y,stepX=Math.sign(dx),stepY=Math.sign(dy);
  let col=Math.floor(from.x/stride),row=Math.floor(from.y/stride);
  const endCol=Math.floor(to.x/stride),endRow=Math.floor(to.y/stride);
  const cellX=stepX?stride/Math.abs(dx):Infinity,cellY=stepY?stride/Math.abs(dy):Infinity;
  let nextX=stepX?((col+Number(stepX>0))*stride-from.x)/dx:Infinity;
  let nextY=stepY?((row+Number(stepY>0))*stride-from.y)/dy:Infinity;
  // Traverse only grid buckets touched by the segment; test each box in local space.
  while(true){
    const boxes=activeObstacles.get(col+row*1000);
    if(boxes)for(const box of boxes){
      if(level<=box.top&&crossesBox(from.x,from.y,dx,dy,box))return true;
    }
    if(col===endCol&&row===endRow)return false;
    if(col!==endCol&&(row===endRow||nextX<=nextY)){col+=stepX;nextX+=cellX;}
    else{row+=stepY;nextY+=cellY;}
  }
}
// feet is the absolute height of a jumping or perched walker; 0 keeps every obstacle solid.
// Upper storeys. A loft has stairs, whose height depends only on position, and a deck that
// carries only walkers who came up those stairs (avatar.up); everyone else passes beneath.
const lofts=[];
export function addLoft(loft){lofts.push(loft);}
export function loftStair(x,y){
  for(const loft of lofts){
    const height=loft.stair(x,y);
    if(height!=null)return height;
  }
  return null;
}
export function loftHeight(position){
  const stair=loftStair(position.x,position.y);
  if(stair!=null)return stair;
  if(position.up)for(const loft of lofts)if(loft.deck(position.x,position.y))return loft.height;
  return 0;
}
// One step from a walker's place to (x,y): {up} when it stays on or joins a loft surface,
// null when the loft blocks it, undefined when ordinary ground rules decide.
export function loftStep(from,x,y){
  if(!lofts.length)return undefined;
  const stair=loftStair(x,y),onStair=loftStair(from.x,from.y);
  if(stair==null&&onStair==null&&!from.up)return undefined;
  const here=onStair??(from.up?loftHeight(from):platformAt(from.x,from.y));
  if(stair!=null)return Math.abs(stair-here)<=.36?{up:false}:null;
  const loft=lofts.find(item=>item.deck(x,y));
  if(loft&&Math.abs(loft.height-here)<=.36)return {up:true};
  if(from.up)return null;
  // Stepping off the foot of the stairs back onto the ground.
  return Math.abs(platformAt(x,y)-here)<=.36?undefined:null;
}
// Shallow water (a palace pond) can be waded by people. Animals and planned routes keep to
// dry ground, so the plain checks below never count water as walkable.
export function waterDepth(x,y){
  for(const zone of waterZones){
    if(!zone.contains(x,y))continue;
    const depth=zone.water(x,y);
    if(depth)return depth;
  }
  return 0;
}
export function wadeable(x,y,feet=0){
  return walkable(x,y,feet)||waterDepth(x,y)>0&&!solidAt(x,y,feetLevel(feet));
}
export function wadeSegment(from,to,step=.36,feet=0){
  const dx=to.x-from.x,dy=to.y-from.y;
  const count=Math.ceil(Math.hypot(dx,dy)/step);
  for(let i=1;i<=count;i++){
    if(!wadeable(from.x+dx*i/count,from.y+dy*i/count,feet))return false;
  }
  return !count||!crossesObstacle(from,to,feetLevel(feet));
}
const deoksugungNorthEdge=30;
export function walkable(x,y,feet=0){
  const interior=interiorAt(x,y);
  if(interior)return !solidAt(x,y,feetLevel(feet));
  const inDeoksugung=x>=45&&x<=560&&y>=deoksugungNorthEdge&&y<=420;
  if(solidAt(x,y,feetLevel(feet))||(inDeoksugung&&inPond(x,y)))return false;
  let open=false;
  for(const zone of zones){
    if(!zone.contains(x,y))continue;
    if(zone.water?.(x,y))return false;
    if(!open)open=zone.walkable(x,y);
  }
  if(open)return true;
  if(!inDeoksugung)return false;
  return inEstate(x,y)||distance(spawn,x,y)<23||distance(fountain,x,y)<15||inVerge(x,y)||distance(garden,x,y)<9||
    onEntrance(x,y)||onStationWalk(x,y)||onStonewall(x,y)||onPalace(x,y);
}
export function clearSegment(from,to,step=.36,feet=0){
  const dx=to.x-from.x,dy=to.y-from.y;
  const count=Math.ceil(Math.hypot(dx,dy)/step);
  for(let i=1;i<=count;i++){
    if(!walkable(from.x+dx*i/count,from.y+dy*i/count,feet))return false;
  }
  return !count||!crossesObstacle(from,to,feetLevel(feet));
}
const spacing=2;
const around=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
const gridPoint=(i,{ox,oy,cols})=>({x:ox+i%cols*spacing,y:oy+Math.floor(i/cols)*spacing});
const walkingBounds={minX:0,maxX:1160,minY:-1890,maxY:Math.max(450,...Object.values(interiorBounds).map(bounds=>bounds.maxY))};
const gateLink=[gate,...entranceWalk,...stationWalk];
const gridDown=value=>Math.floor(value/spacing)*spacing,gridUp=value=>Math.ceil(value/spacing)*spacing;
const gateClearance=6*spacing;
const gateLinkBounds={
  left:gridDown(Math.min(...gateLink.map(point=>point.x)))-gateClearance,
  right:gridUp(Math.max(...gateLink.map(point=>point.x)))+gateClearance,
  bottom:gridUp(Math.max(...gateLink.map(point=>point.y)))+gateClearance
};
const onDeoksugungSide=({x,y})=>x<=gate.x&&y>=deoksugungNorthEdge;
function walkingField(from,target){
  const padding=Math.round(Math.min(168,68+distance(from,target.x,target.y)*.24)/spacing)*spacing;
  const {minX,maxX,minY,maxY}=walkingBounds;
  let left=gridDown(Math.min(from.x,target.x))-padding;
  let right=gridUp(Math.max(from.x,target.x))+padding;
  let bottom=gridUp(Math.max(from.y,target.y))+padding;
  // The palace meets the avenue through Daehanmun. An endpoint near its northern wall still
  // needs the southern turn around the wall, even when both destinations are far west.
  const viaGate=onDeoksugungSide(from)!==onDeoksugungSide(target)&&
    (left>gateLinkBounds.left||right<gateLinkBounds.right||bottom<gateLinkBounds.bottom);
  if(viaGate){
    left=Math.min(left,gateLinkBounds.left);
    right=Math.max(right,gateLinkBounds.right);
    bottom=Math.max(bottom,gateLinkBounds.bottom);
  }
  const ox=Math.max(minX,left),oy=Math.max(minY,gridDown(Math.min(from.y,target.y))-padding);
  right=Math.min(maxX,right);
  bottom=Math.min(maxY,bottom);
  return {ox,oy,cols:(right-ox)/spacing+1,rows:(bottom-oy)/spacing+1,viaGate};
}
function inWalkingBounds(point){
  const {minX,maxX,minY,maxY}=walkingBounds;
  return point.x>=minX&&point.x<=maxX&&point.y>=minY&&point.y<=maxY;
}
function snap(point,radius,direct,feet,field,open=walkable,clear=clearSegment){
  let best=-1,gap=Infinity;
  const {ox,oy,cols,rows}=field;
  const cx=Math.round((point.x-ox)/spacing),cy=Math.round((point.y-oy)/spacing);
  for(let y=Math.max(0,cy-radius);y<=Math.min(rows-1,cy+radius);y++){
    for(let x=Math.max(0,cx-radius);x<=Math.min(cols-1,cx+radius);x++){
      const next={x:ox+x*spacing,y:oy+y*spacing},d=distance(point,next.x,next.y);
      if(d>=gap||!open(next.x,next.y)||(direct&&!clear(point,next,.36,feet)))continue;
      best=y*cols+x;gap=d;
    }
  }
  return best;
}
// feet lets a walker standing on a bench or ledge plan the first step down from it.
// A straight line walked the way a person walks it: every short stride may climb a ledge one
// step high, so routes can run up stone steps and across terraces and floors.
function strideSegment(from,to,wade,feet){
  const dx=to.x-from.x,dy=to.y-from.y,count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.3)),clear=wade?wadeSegment:clearSegment;
  let previous=from,level=feet||platformAt(from.x,from.y)+.19;
  for(let i=1;i<=count;i++){
    const next={x:from.x+dx*i/count,y:from.y+dy*i/count};
    if(!clear(previous,next,.36,level))return false;
    level=platformAt(next.x,next.y)+.19;previous=next;
  }
  return true;
}
const comesBefore=(a,b)=>a.score<b.score||(a.score===b.score&&a.remaining<b.remaining);
function pushCandidate(heap,entry){
  let index=heap.length;
  while(index>0){
    const parent=(index-1)>>1;
    if(!comesBefore(entry,heap[parent]))break;
    heap[index]=heap[parent];index=parent;
  }
  heap[index]=entry;
}
function takeCandidate(heap){
  const first=heap[0],last=heap.pop();
  if(!heap.length)return first;
  let index=0;
  while(index*2+1<heap.length){
    let child=index*2+1;
    if(child+1<heap.length&&comesBefore(heap[child+1],heap[child]))child++;
    if(!comesBefore(heap[child],last))break;
    heap[index]=heap[child];index=child;
  }
  heap[index]=last;
  return first;
}
// wade plans a route that may cross shallow water.
export function planWalk(from,target,feet=0,wade=false){
  if(!inWalkingBounds(from)||!inWalkingBounds(target))return [];
  const fromInterior=interiorAt(from.x,from.y),targetInterior=interiorAt(target.x,target.y);
  if(fromInterior!==targetInterior)return [];
  const ground=wade?wadeable:walkable;
  const open=(x,y)=>ground(x,y,platformAt(x,y)+.19),clear=(a,b,step,level)=>strideSegment(a,b,wade,level);
  const exact=open(target.x,target.y);
  if(exact&&clear(from,target,.36,feet))return [target];
  const field=walkingField(from,target),{ox,oy,cols,rows}=field;
  // Two smaller searches around the known gate avoid scanning the length of the palace wall.
  if(field.viaGate&&distance(spawn,from.x,from.y)>0&&distance(spawn,target.x,target.y)>0){
    const approach=planWalk(from,spawn,feet,wade);
    const end=approach.at(-1);
    if(end?.x===spawn.x&&end.y===spawn.y){
      const onward=planWalk(spawn,target,0,wade),destination=onward.at(-1);
      if(destination&&(!exact||destination.x===target.x&&destination.y===target.y))return [...approach,...onward];
    }
  }
  const start=snap(from,3,true,feet,field,open,clear);
  let goal=snap(target,7,exact,0,field,open,clear);
  if(start<0||goal<0)return [];
  const previous=new Int32Array(cols*rows).fill(-1),cost=new Int32Array(cols*rows).fill(0x7fffffff),queue=[];
  const goalCol=goal%cols,goalRow=Math.floor(goal/cols);
  const estimate=(col,row)=>{
    const x=Math.abs(col-goalCol),y=Math.abs(row-goalRow);
    return 10*Math.max(x,y)+4*Math.min(x,y);
  };
  const firstEstimate=estimate(start%cols,Math.floor(start/cols));
  previous[start]=start;cost[start]=0;
  pushCandidate(queue,{index:start,cost:0,score:firstEstimate,remaining:firstEstimate});
  let best=-1,bestGap=16;
  while(queue.length){
    const item=takeCandidate(queue),current=item.index;
    if(item.cost!==cost[current])continue;
    const point=gridPoint(current,field),col=current%cols,row=Math.floor(current/cols);
    const gap=distance(target,point.x,point.y);
    if(gap<bestGap){bestGap=gap;best=current;}
    if(current===goal){best=goal;break;}
    for(const [dx,dy] of around){
      const x=col+dx,y=row+dy,next=y*cols+x;
      const nextCost=item.cost+(dx&&dy?14:10);
      if(x<0||x>=cols||y<0||y>=rows||cost[next]<=nextCost||
        !clear(point,{x:ox+x*spacing,y:oy+y*spacing}))continue;
      const remaining=estimate(x,y);
      previous[next]=current;cost[next]=nextCost;
      pushCandidate(queue,{index:next,cost:nextCost,score:nextCost+remaining,remaining});
    }
  }
  if(best<0)return [];
  goal=best;
  // Keep grid turns before smoothing to avoid rechecking a long straight walk cell by cell.
  const points=[];
  let heading=null;
  for(let i=goal;i!==start;i=previous[i]){
    const direction=i-previous[i];
    if(heading!==direction){points.push(gridPoint(i,field));heading=direction;}
  }
  points.push(gridPoint(start,field));points.reverse();
  if(exact&&clear(points.at(-1),target))points.push(target);
  const simplified=[];
  let cursor=from;
  for(let i=0;i<points.length;){
    let last=i;
    for(let j=i+1;j<points.length&&clear(cursor,points[j],.36,i?0:feet);j++)last=j;
    cursor=points[last];simplified.push(cursor);i=last+1;
  }
  return simplified;
}
