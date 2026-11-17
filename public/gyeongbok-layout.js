import {addLandmarks,addZone,addLoft,spawn} from "./layout.js";
import {plazaSites,plazaAt} from "./plaza-layout.js";
import {uijeongbuEntry,uijeongbuGarden,uijeongbuBusBerth,isUijeongbuWalkable} from "./uijeongbu-layout.js";
import {gbEastOpenings,gbBoundaryGates,gbWestPaths,insideGbWall,onGbWestPath} from "./gyeongbok-perimeter.js";

// Positions are metres east of the palace's central axis and north of Gwanghwamun,
// which shares the same geographic projection as the square and Deoksugung.
export const gwanghwamun=plazaSites.gate;
export const at=(east,north,name="")=>({name,x:gwanghwamun.x+east,y:gwanghwamun.y-north});
export const gbBounds={minX:gwanghwamun.x-300,maxX:gwanghwamun.x+300,minY:gwanghwamun.y-900,maxY:gwanghwamun.y+170};
const inGbBounds=(x,y)=>x>=gbBounds.minX&&x<=gbBounds.maxX&&y>=gbBounds.minY&&y<=gbBounds.maxY;
const onFrontApron=(east,north)=>north>=-52&&north<1.2&&east>-92&&east<48;
export function inGyeongbok(x,y){
  if(!inGbBounds(x,y))return false;
  const east=x-gwanghwamun.x,north=gwanghwamun.y-y;
  return insideGbWall(x,y)||onGbWestPath(x,y)||onFrontApron(east,north)||isUijeongbuWalkable(x,y);
}

const eastGate=gbEastOpenings.find(opening=>opening.id==="geonchunmun");

// kind: gate (walk through the centre bay), hall, open (pillared pavilion), plain (side building)
const site=(id,name,sign,east,north,w,d,h,bays,extra={})=>({id,name,sign,...at(east,north,name),east,north,w,d,h,bays,angle:0,...extra});
export const gbSites=[
  site("gwanghwamun","광화문","光化門",0,0,23.6,8.6,4.3,3,{kind:"mainGate",stories:2}),
  site("heungnyemun","흥례문","興禮門",0,135,18.4,9.0,5.0,3,{kind:"gate",stories:2}),
  site("geunjeongmun","근정문","勤政門",0,232,17.4,8.6,4.8,3,{kind:"gate",stories:2}),
  site("geunjeongjeon","근정전","勤政殿",0,300,30.2,21.1,8.4,5,{kind:"throne",stories:2}),
  site("sajeongmun","사정문","思政門",0,350,11.2,5.2,3.4,3,{kind:"gate"}),
  site("sajeongjeon","사정전","思政殿",0,374,22.0,13.4,4.9,5,{kind:"hall"}),
  site("manchunjeon","만춘전","萬春殿",34,374,17.6,8.6,3.7,6,{kind:"hall"}),
  site("cheonchujeon","천추전","千秋殿",-34,374,17.6,8.6,3.7,6,{kind:"hall"}),
  site("gangnyeongjeon","강녕전","康寧殿",0,414,37.6,14.8,4.6,11,{kind:"hall"}),
  site("gyotaejeon","교태전","交泰殿",0,456,30.6,12.6,4.3,9,{kind:"hall"}),
  site("gyeonghoeru","경회루","慶會樓",-93,428,28.5,34.4,5.6,5,{kind:"lake",stories:2}),
  site("sujeongjeon","수정전","修政殿",-86,338,35.2,13.6,4.4,10,{kind:"hall"}),
  site("jaseondang","자선당","資善堂",96,322,19.6,10.4,3.8,7,{kind:"hall"}),
  site("bihyeongak","비현각","丕顯閣",126,322,14.2,9.2,3.6,5,{kind:"hall"}),
  site("jagyeongjeon","자경전","慈慶殿",108,472,31.4,12.2,4.2,10,{kind:"hall"}),
  site("hyangwonjeong","향원정","香遠亭",12,706,8.4,8.4,6.4,6,{kind:"hexagon"}),
  site("geoncheonggung","건청궁","乾淸宮",33,776,48,10,3.2,8,{kind:"compound"}),
  site("jibokjae","집옥재","集玉齋",-56,824,18.6,13.2,5.2,5,{kind:"inner",finish:"library"}),
  site("geonchunmun","건춘문","建春門",eastGate.x-gwanghwamun.x,gwanghwamun.y-eastGate.y,13.4,8.4,3.8,3,{kind:"sideGate",angle:eastGate.angle}),
  site("yeongchumun","영추문","迎秋門",gbBoundaryGates.yeongchumun.east,gbBoundaryGates.yeongchumun.north,15.8,8.4,3.8,3,{kind:"sideGate",angle:gbBoundaryGates.yeongchumun.angle}),
  site("sinmumun","신무문","神武門",gbBoundaryGates.sinmumun.east,gbBoundaryGates.sinmumun.north,15.8,8.4,3.8,3,{kind:"sideGate",angle:gbBoundaryGates.sinmumun.angle}),
  site("palace-museum","국립고궁박물관","國立古宮博物館",-164,64,96,44,11.5,12,{kind:"museum"}),
  site("folk-museum","국립민속박물관","",168,566,74,46,13,10,{kind:"folkMuseum"}),
  // Existing-map metres are fitted to the 2025 visitor map and geographic footprints.
  site("gyejodang","계조당","繼照堂",91,221,15.7,8.5,3.4,5,{kind:"inner",finish:"dancheong"}),
  site("sojubang","소주방","燒廚房",117,393,17.8,7.5,3.0,5,{kind:"inner",finish:"service"}),
  site("saenggwabang","생과방","生果房",143,416,17.2,7.4,3.1,5,{kind:"inner",finish:"service"}),
  site("heungbokjeon","흥복전","興福殿",14,547,25.4,11.8,3.6,7,{kind:"inner",finish:"restored"}),
  site("amisan","아미산 굴뚝","",7,489,38,13,2.7,4,{kind:"garden"}),
  site("heumgyeonggak","흠경각","欽敬閣",-41,466,13.7,8.2,3.5,3,{kind:"inner",finish:"dancheong"}),
  site("hamwonjeon","함원전","含元殿",-42,486,15.6,8.1,3.3,5,{kind:"inner",finish:"dancheong"}),
  site("jagyeong-chimney","자경전 십장생 굴뚝","",108,495,6.9,1.5,3.0,3,{kind:"garden"}),
  site("hamhwadang","함화당","咸和堂",12,627,17.4,8.4,3.4,5,{kind:"inner",finish:"natural"}),
  site("jipgyeongdang","집경당","集慶堂",44,627,18.5,8.6,3.5,5,{kind:"inner",finish:"natural"}),
  site("janggo","장고","",-83,614,27,19,1.5,3,{kind:"garden"}),
  site("taewonjeon","태원전","泰元殿",-199,750,20.7,9.9,3.9,5,{kind:"inner",finish:"dancheong",angle:.24}),
  site("yeongsajae","영사재","永思齋",-204,726,15.3,7.4,3.0,5,{kind:"inner",finish:"natural",angle:.24}),
  site("gyeongsahap","경사합","景思閤",-164,746,16.4,7.8,3.2,5,{kind:"inner",finish:"natural",angle:.24}),
  site("sungmundang","숭문당","崇文堂",-153,776,15.8,7.3,3.2,5,{kind:"inner",finish:"natural",angle:.24}),
  site("parujeong","팔우정","八隅亭",-73.4,824.3,7.6,7.6,5.1,3,{kind:"octagon",finish:"library"}),
  site("hyeopgildang","협길당","協吉堂",-37.5,824,13.4,9.2,3.4,5,{kind:"inner",finish:"library"}),
  site("jangandang","장안당","長安堂",21,798,19.4,8.4,3.5,5,{kind:"inner",finish:"natural"}),
  site("gonnyeonghap","곤녕합","坤寧閤",51,798,17.2,8.2,3.6,5,{kind:"inner",finish:"natural"}),
  site("okhoru","옥호루","玉壺樓",62,792,7.6,7.7,4.25,3,{kind:"inner",finish:"natural"})
];
export const gbSite=Object.fromEntries(gbSites.map(spec=>[spec.id,spec]));

// Each edge is given in metres as [east, north]; the named gaps line up with
// the neighbouring visitor paths and the open doorway models in the scene.
export const gbInnerCompounds=[
  {id:"gyejodang",bounds:[71,112,197,236],south:[87,95],west:[203,211],style:"low"},
  {id:"donggung",bounds:[76,148,281,346],south:[106,116],north:[106,116],west:[324,334],east:[300,309],style:"covered",split:[113,288,342,304,311]},
  {id:"sojubang",bounds:[96,163,358,432],south:[121,130],north:[127,135],west:[373,382],east:[397,405],style:"covered",split:[130,380,431,388,396]},
  {id:"jagyeongjeon",bounds:[85,135,447,495],south:[102,114],west:[456,464],east:[457,465],style:"covered"},
  {id:"heungbokjeon",bounds:[-15,49,519,568],south:[11,19],west:[536,544],east:[531,538],style:"covered"},
  {id:"hamhwadang",bounds:[-3,64,604,648],south:[25,33],north:[18,26],west:[613,620],east:[612,620],style:"covered",split:[29,624,646,627,633]},
  {id:"taewonjeon",bounds:[-236,-137,695,801],south:[-209,-199],east:[721,733],style:"covered",turn:.24,split:[-181,716,794,748,755]},
  {id:"geoncheonggung",bounds:[5,76,775,820],south:[31,41],west:[789,797],east:[787,796],style:"covered",split:[37,793,819,802,808]}
];

// Covered corridors (haenggak) that frame the two outer courts. Gaps are gateways.
const frame=(west,east,south,north)=>({west,east,south,north});
export const gbCourts={
  heungnye:frame(-53,53,135,232),
  geunjeong:frame(-50,50,232,350),
  sajeong:frame(-52,52,350,392)
};

// Gyeonghoeru stands on a stone island at the east side of its square pond, joined to
// the bank by three bridges. Hyangwonjeong is a hexagonal pavilion on a round island.
export const gbLake={west:-192,east:-64,south:368,north:482,
  island:{west:-116,east:-70,south:408,north:448},
  bridges:[416,428,440].map(north=>({west:-70,east:-64,north,width:3.4})),
  isles:[{east:-160,north:446,radius:9},{east:-166,north:404,radius:7}]};
export const gbPond={east:12,north:706,radius:39,island:9.5,
  bridge:{east:12,south:715,north:746,width:3.2}};

export const gbStation={
  name:"경복궁역 5번 출구",...at(-104,36,"경복궁역 5번 출구"),angle:Math.PI/2,
  door:at(-100.4,36),arrive:{...at(-96.5,36),heading:60}
};
// City Hall station exit 2 is on the avenue pavement outside the east wall, level with the
// palace pond and about ninety metres north of Daehanmun; the Deoksugung bus stops line the
// same pavement between exits 2 and 3.
export const cityHallStation={
  name:"시청역 2번 출구",x:472.0,y:233,angle:0,
  door:{x:472.0,y:236.6},arrive:{x:473.4,y:239.4,heading:180}
};
export const cityHallExit3={
  name:"시청역 3번 출구",x:472.0,y:183.4,angle:0,
  door:{x:472.0,y:187},arrive:{x:473.4,y:189.8,heading:180}
};
export const cityHallBusStop={
  name:"시청앞·덕수궁 정류장",x:476.4,y:205,angle:Math.PI/2,
  door:{x:474.6,y:205},arrive:{x:474.2,y:207.4,heading:180}
};
// Sajik-ro's southeast bus stop serves the historic park and Dongsipjagak.
export const gbBusStop={
  ...uijeongbuBusBerth,name:"경복궁 정류장",angle:Math.PI,
  door:plazaAt(169.26,565.65),arrive:{...plazaAt(169.85,563.6),heading:250}
};
export const subwayStops=[
  {...cityHallStation,id:"city-hall",mode:"subway",to:"gyeongbokgung",destination:"경복궁역",line:"시청역 → 경복궁역"},
  {...cityHallExit3,id:"city-hall-3",mode:"subway",to:"gyeongbokgung",destination:"경복궁역",line:"시청역 → 경복궁역"},
  {...gbStation,id:"gyeongbokgung",mode:"subway",to:"city-hall",destination:"시청역",line:"경복궁역 → 시청역"},
  {...cityHallBusStop,id:"bus-city-hall",mode:"bus",to:"bus-gyeongbokgung",destination:"경복궁 정류장",line:"시청앞·덕수궁 → 경복궁"},
  {...gbBusStop,id:"bus-gyeongbokgung",mode:"bus",to:"bus-city-hall",destination:"시청앞·덕수궁 정류장",line:"경복궁 → 시청앞·덕수궁"}
];

// Stone-paved royal road along the axis and the main visitor paths (for ground and map).
export const gbPaths=[
  {name:"광화문에서 근정전까지",width:8.2,surface:"stone",points:[at(0,-50),at(0,0),at(0,135),at(0,232),at(0,276)]},
  {name:"사정전에서 교태전까지",width:4.6,surface:"stone",points:[at(0,318),at(0,350),at(0,404),at(0,446)]},
  {name:"경복궁역에서 흥례문 앞까지",width:6.0,surface:"gravel",points:[at(-96,36),at(-70,60),at(-36,96),at(0,112)]},
  {name:"경회루 가는 길",width:4.8,surface:"gravel",points:[at(-56,246),at(-58,300),at(-56,356),at(-58,400),at(-60,428)]},
  {name:"계조당 앞길",width:4.2,surface:"gravel",points:[at(66,192),at(91,191),at(91,204)]},
  {name:"동궁 가는 길",width:4.4,surface:"gravel",points:[at(58,246),at(64,290),at(64,333),at(66,350),at(78,420),at(79,448),at(79,460)]},
  {name:"동궁과 소주방 사이",width:4.8,surface:"gravel",points:[at(66,350),at(111,352),at(155,349),at(174,373),at(176,429),at(151,457),at(143,497),at(122,529)]},
  {name:"동궁 남쪽 마당",width:4.0,surface:"gravel",points:[at(64,267),at(111,270),at(111,285)]},
  {name:"흥복전 앞에서 후원까지",width:5.4,surface:"gravel",points:[at(12,507),at(-20,510),at(-25,548),at(-24,579),at(-23,612),at(-30,650),at(-44,706),at(-30,756),at(12,762)]},
  {name:"흥복전 남쪽 출입길",width:3.8,surface:"gravel",points:[at(12,507),at(15,515),at(15,525)]},
  {name:"향원지 동쪽 길",width:4.0,surface:"gravel",points:[at(54,579),at(73,604),at(74,645),at(60,670),at(58,706),at(50,745),at(31,765),at(12,762)]},
  {name:"취향교 북쪽 진입로",width:3.5,surface:"gravel",points:[at(12,746),at(12,753),at(12,762)]},
  {name:"함화당·집경당 앞길",width:4.3,surface:"gravel",points:[at(-24,579),at(3,589),at(29,590),at(54,579),at(83,545),at(122,529)]},
  {name:"함화당·집경당 출입길",width:3.6,surface:"gravel",points:[at(29,590),at(29,606),at(28,613)]},
  {name:"건청궁에서 신무문까지",width:4.4,surface:"gravel",points:[at(12,762),at(-10,775),at(-14,797),at(-18,836),at(-49,839),at(-81,838),at(-109,836)]},
  {name:"건청궁 앞마당",width:4.4,surface:"gravel",points:[at(12,762),at(31,765),at(36,775),at(36,785)]},
  {name:"집옥재 앞마당",width:4.3,surface:"gravel",points:[at(-18,811),at(-42,806),at(-62,806),at(-91,811),at(-116,800),at(-125,753)]},
  {name:"장고와 태원전 숲길",width:5.1,surface:"gravel",points:[at(-56,470),at(-51,500),at(-61,529),at(-74,555),at(-100,593),at(-116,620),at(-146,649),at(-168,671),at(-194,689),at(-191,695)]},
  {name:"장고 앞길",width:3.5,surface:"gravel",points:[at(-100,593),at(-86,596),at(-75,604)]},
  {name:"경회루 서쪽 숲길",width:5.4,surface:"gravel",points:[at(-60,337),at(-111,340),at(-181,345),at(-207,380),at(-205,461),at(-195,500),at(-161,523),at(-118,550),at(-74,555)]},
  {name:"자경전 서쪽 연결길",width:4.5,surface:"gravel",points:[at(88,460),at(79,460),at(73,498),at(63,532),at(54,579)]},
  ...gbWestPaths
];

export const gbLawns=[
  {name:"고궁박물관 앞 숲",kind:"grove",west:-236,east:-116,south:100,north:210},
  {name:"수정전 남쪽 잔디",kind:"lawn",west:-150,east:-68,south:250,north:314},
  {name:"경회루 북쪽 숲",kind:"grove",west:-236,east:-70,south:496,north:660},
  {name:"서쪽 담장 숲",kind:"grove",west:-240,east:-200,south:230,north:480},
  {name:"동궁 남쪽 잔디",kind:"lawn",west:70,east:150,south:246,north:300},
  {name:"동쪽 숲",kind:"grove",west:150,east:238,south:120,north:300},
  {name:"자경전 북쪽 숲",kind:"grove",west:85,east:120,south:518,north:637},
  {name:"향원지 둘레 숲",kind:"grove",west:-110,east:110,south:660,north:756},
  {name:"태원전 남쪽 숲",kind:"grove",west:-233,east:-125,south:652,north:680},
  {name:"태원전 뒤편 숲",kind:"grove",west:-236,east:-110,south:811,north:860},
  {name:"동북쪽 숲",kind:"grove",west:70,east:236,south:660,north:860},
  {name:"함화당 뒤편 초지",kind:"lawn",west:-17,east:49,south:652,north:670}
];

function inLake(east,north){
  const {west,east:right,south,north:top,island,bridges,isles}=gbLake;
  if(east<=west||east>=right||north<=south||north>=top)return false;
  if(isles.some(isle=>Math.hypot(east-isle.east,north-isle.north)<isle.radius))return false;
  if(east>island.west&&east<island.east&&north>island.south&&north<island.north)return false;
  return !bridges.some(bridge=>east>=bridge.west-1&&east<=bridge.east+1&&Math.abs(north-bridge.north)<bridge.width/2);
}
function inPond(east,north){
  const gap=Math.hypot(east-gbPond.east,north-gbPond.north);
  if(gap>=gbPond.radius||gap<gbPond.island)return false;
  const {bridge}=gbPond;
  return !(Math.abs(east-bridge.east)<bridge.width/2&&north>=bridge.south-1&&north<=bridge.north+1);
}
// Cats wander along these lines. They are routes through open ground, not drawn paths;
// trails share end points so the whole palace forms one connected network.
const trail=points=>points.map(([east,north])=>at(east,north));
export const gbCatTrails=[
  [[0,0],[0,60],[0,112],[0,135],[0,160],[0,205],[0,232],[0,262]],
  [[-96,36],[-70,60],[-36,96],[0,112]],
  [[-70,60],[-110,110],[-180,120],[-210,140],[-220,180],[-170,220],[-120,240],[-56,246]],
  [[0,112],[40,116],[100,110],[150,150],[190,200],[160,260],[110,280],[62,300]],
  [[0,205],[-30,200],[-46,194],[-60,194],[-56,246]],
  [[0,205],[30,200],[46,194],[60,194],[58,246],[62,300],[66,350],[78,420],[88,452],[60,500],[30,492]],
  [[0,262],[-40,262],[-40,330],[-44,333.5],[-56,333.5],[-56,356]],
  [[0,262],[40,262],[40,330],[44,333.5],[56,333.5],[66,350]],
  [[-40,330],[0,340],[40,330]],
  [[0,340],[0,350],[0,358],[-16,360],[-16,386],[-11.5,392],[-11.5,398],[-26,400],[-26,430],[0,436],[26,430],[26,400],[11.5,398],[11.5,392],[16,386],[16,360],[0,358]],
  [[-56,246],[-56,356],[-58,362],[-58,430],[-26,430]],
  [[-58,430],[-58,488],[-128,488],[-198,488],[-198,430],[-198,362],[-128,362],[-58,362]],
  [[-58,362],[-86,352],[-120,350],[-150,300],[-120,240]],
  [[26,430],[40,470],[34,493],[12,507],[-20,510],[-25,548],[-24,579],[-23,612],[-30,650],[-50,706],[-30,756],[12,762],[46,752],[62,706],[74,645],[73,604],[54,579],[29,590],[-24,579]],
  [[12,762],[12,735]],
  [[12,762],[-10,775],[-14,797],[-18,836],[-49,839],[-81,838],[-109,836]],
  [[46,752],[110,760],[150,700],[140,640],[100,610],[74,645]],
  [[-50,706],[-112,695],[-121,753],[-123,817],[-105,838],[-18,836]],
  [[-58,488],[-60,560],[-120,640],[-120,700]]
].map(trail);
// The square outside the gate has its own few cats; the terrace steps keep them out of the palace.
export const gbPlazaCatTrails=[
  [[-60,-30],[-24,-30],[-24,-54],[0,-54],[24,-54],[24,-30],[60,-30],[60,-50],[24,-54]],
  [[-24,-54],[-60,-50],[-60,-30]]
].map(trail);
// Places where flocks of pigeons and magpies gather.
export const gbBirdGrounds=[
  [40,-30],[100,-122],[0,70],[-30,160],[30,206],[0,256],[-36,300],[36,300],[-58,446],[-120,300],[0,436],
  [100,280],[150,180],[-150,160],[0,540],[12,772],[-64,700],[84,700],[-90,56],[-150,236],[60,560],
  [-128,494],[-200,400],[120,470],[0,846],[-150,780],[150,790]
].map(([east,north])=>at(east,north));
// Woldae: the ceremonial stone terrace that runs south from Gwanghwamun.
export const gbWoldae={half:14.7,south:-50,north:-5.7,tier:.19};
export function onWoldaeApproach({x,y}){
  const {half,south,north}=gbWoldae,along=gwanghwamun.y-y;
  return along>=south-.95&&along<=north+.95&&Math.abs(x-gwanghwamun.x)<=half+.65;
}
export function nearWoldaeRailing({x,y}){
  const {half,south,north}=gbWoldae,along=gwanghwamun.y-y;
  return along>south&&along<north&&Math.abs(Math.abs(x-gwanghwamun.x)-(half-.2))<2;
}
export const gbHaetae=[-1,1].map(side=>({side,east:side*19.6,north:-48}));
// Standing here offers a souvenir photograph in front of the throne hall.
export const gbPhotoZone={...at(0,263,"근정전 포토존"),heading:180,reach:3.4,
  tripod:at(1.7,255.7),shot:{from:{...at(1.7,256.5),height:1.3},to:{...at(-.5,300),height:4.6},fov:52}};
// Night floodlights: the nearest three are lit while a walker is in the palace.
export const gbLightSpots=[
  [0,-12,5,620,60],[0,128,4.5,520,55],[0,226,4.5,520,55],[0,281,5.5,900,75],[0,360,4,420,50],[0,404,4,420,50],
  [0,446,4,420,50],[-64,428,5,900,80],[-86,330,4,420,50],[104,330,4,380,48],[108,464,4,420,50],
  [12,722,4.5,700,70],[36,784,4,420,50],[-56,816,4,380,48],
  [15,534,4,370,52],[30,613,4,340,52],[-195,737,4,420,56],[92,212,4,320,43],[120,383,4,320,50]
].map(([east,north,height,power,range])=>({...at(east,north),height,power,range}));
export const sparklerStall={...at(-50,402,"경회루 스파클 좌판")};
export const wishPond={...at(gbPond.east,gbPond.north,"향원정"),reach:gbPond.radius+12};
// Shortcut buttons while in Gyeongbokgung.
export const gbShortcuts=[
  {label:"경복궁역",aria:"경복궁역으로 순간이동",...at(-96.5,36,"경복궁역 5번 출구"),heading:60},
  {label:"근정전",aria:"근정전으로 순간이동",...at(0,258,"근정전 마당"),heading:0},
  {label:"향원정",aria:"향원정으로 순간이동",...at(12,752,"향원정"),heading:180},
  {label:"정류장",aria:"경복궁 정류장으로 순간이동",...gbBusStop.arrive,name:gbBusStop.name}
];

export function gyeongbokWalkable(x,y){
  const east=x-gwanghwamun.x,north=gwanghwamun.y-y;
  if(onFrontApron(east,north)||isUijeongbuWalkable(x,y)||onGbWestPath(x,y))return true;
  if(!insideGbWall(x,y))return false;
  return !inLake(east,north)&&!inPond(east,north);
}

// Gyeonghoeru: seven bays by five on 48 stone pillars, its long side facing the bridges.
// People walk among the pillars and climb either timber stair to the banquet floor.
export const gbRoyalPavilion=(()=>{
  const centre={east:-93,north:428},long=34.4,short=28.5,floor=5.5,base=.38;
  const norths=Array.from({length:8},(_,i)=>centre.north-long/2+i*long/7);
  const easts=Array.from({length:6},(_,i)=>centre.east-short/2+i*short/5);
  const stairs=[{south:412.05,north:414.45,foot:-87.3,head:-97.5},{south:441.55,north:443.95,foot:-98.7,head:-88.5}];
  // Columns of the upper floor that stand inside the walking area.
  const columns=norths.slice(1,7).flatMap((north,i)=>easts.slice(1,5).filter((east,j)=>i===0||i===5||j===0||j===3).map(east=>({east,north})));
  return {centre,long,short,floor,base,norths,easts,stairs,columns};
})();
addLoft({
  height:gbRoyalPavilion.floor,
  stair(x,y){
    const east=x-gwanghwamun.x,north=gwanghwamun.y-y,{stairs,floor,base}=gbRoyalPavilion;
    for(const {south,north:top,foot,head} of stairs){
      const along=(east-foot)/(head-foot);
      if(north>=south&&north<=top&&along>=0&&along<=1)return base+(floor-base)*along;
    }
    return null;
  },
  deck(x,y){
    const east=x-gwanghwamun.x,north=gwanghwamun.y-y,{centre,long,short,columns}=gbRoyalPavilion;
    if(Math.abs(north-centre.north)>long/2+.5||Math.abs(east-centre.east)>short/2+.5)return false;
    return !columns.some(column=>Math.hypot(east-column.east,north-column.north)<.5);
  }
});
// True over the pond at Gyeonghoeru and the one round Hyangwonjeong. Nobody walks into either.
export function gyeongbokWater(x,y){
  const east=x-gwanghwamun.x,north=gwanghwamun.y-y;
  return inLake(east,north)||inPond(east,north);
}
addZone({name:"경복궁",contains:inGbBounds,walkable:gyeongbokWalkable});
addLandmarks([
  ...gbSites,gbStation,cityHallStation,cityHallExit3,cityHallBusStop,gbBusStop,
  at(0,-28,"광화문 월대"),uijeongbuEntry,uijeongbuGarden,plazaAt(34,539,"광화문 동쪽 횡단보도"),at(-50,-36,"광화문 광장"),at(45,-36,"광화문 광장"),at(0,70,"흥례문 앞마당"),at(0,180,"영제교"),at(0,262,"근정전 마당"),
  at(-128,428,"경회루 연못"),at(12,706,"향원정"),at(0,480,"아미산"),
  ...gbPaths.flatMap(path=>path.points.slice(1,-1).map(point=>({...point,name:path.name})))
]);
