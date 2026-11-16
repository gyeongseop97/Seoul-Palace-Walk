import {mmcaAt} from "./mmca-layout.js";

export const mmcaVenue={
  id:"mmca",name:"국립현대미술관 서울",
  bounds:{minX:310,maxX:392,minY:470,maxY:546},
  outsideDoor:{...mmcaAt(-18.3,106),heading:260,tilt:0},
  insideDoor:{x:351,y:543,heading:180},insideSpawn:{x:351,y:539,heading:0},
  guestbookPoint:{x:339,y:536},
};

const works=[
  {id:"home",title:"바람이 머문 집",shortName:"바람의 집",credit:"서도호 · 2013 서울관 개관전",
    original:"‹집 속의 집 속의 집 속의 집 속의 집›",source:"201311010002927",color:"#708e95",
    description:"서도호는 천으로 만든 집을 통해 이주한 뒤에도 지니고 다니는 공간의 기억을 보여줬어요. 게임에서는 바람길을 사이에 두고 비껴 선 반투명 문틀과 지붕을 걸으며 집에 대한 기억을 떠올릴 수 있어요."},
  {id:"colors",title:"빛을 모으는 손",shortName:"빛의 방",credit:"김수자 · 2016 《마음의 기하학》",
    original:"‹마음의 기하학›과 ‹호흡›",link:"https://www.mmca.go.kr/pr/employmentDetail.do?bdCId=201607270005387",color:"#927da4",
    description:"2016년 전시에는 손으로 빚는 흙덩이와 유리를 통과하며 여러 색으로 나뉘는 빛이 함께 등장했어요. 이 방에서는 빛 바꾸기 버튼으로 세 가지 조명 아래 구슬과 프리즘의 색을 살펴볼 수 있어요."},
  {id:"objects",title:"찬장의 정원",shortName:"사물 정원",credit:"최정화 · 2018 《꽃, 숲》",
    original:"‹민들레›와 일상용품 설치 연작",link:"https://www.mmca.go.kr/pr/employmentDetail.do?bdCId=201809040006455",color:"#ad784f",
    description:"최정화는 그릇과 바구니처럼 자주 쓰는 물건을 모아 커다란 설치 작품으로 바꿨어요. 이곳에선 한데 모인 그릇과 바구니가 낮은 정원을 이뤄요. 둘레를 돌며 익숙한 사물이 낯설게 보이는 각도를 찾아보세요."},
  {id:"weave",title:"계절을 엮는 고리",shortName:"엮는 고리",credit:"양혜규 · 2020 《O2 & H2O》",
    original:"‹중간 유형 – 구렁이 생명체›",source:"202001090001232",color:"#788b62",
    description:"양혜규는 짚을 닮은 재료를 엮어 신화와 공예를 연상시키는 설치를 선보였어요. 게임에서는 서로 다른 방향으로 엮은 고리 사이에 빈 공간을 두었어요. 자리를 옮기면 겹쳐 보이는 무늬도 달라져요."},
  {id:"tide",title:"조수의 나침반",shortName:"조수와 추",credit:"최우람 · 2022 《작은 방주》",
    original:"‹원탁›과 ‹작은 방주›",source:"202208090001545",color:"#8b7767",
    description:"최우람은 움직이는 조각으로 균형을 이루기 위해 서로 의지하는 모습을 보여줬어요. 여기서는 수평을 찾는 나침반과 주기가 다른 추를 볼 수 있어요. 잠시 서서 추의 속도가 우연히 맞아드는 순간을 기다려 보세요."},
  {id:"wind",title:"물 위를 지난 바람",shortName:"물 위 바람",credit:"이강소 · 2024 《풍래수면시》",
    original:"‹청명 – 21021›과 전시의 회화 연작",source:"202409040001828",color:"#648993",
    description:"이강소의 넓은 여백과 자유로운 붓질에서 출발했어요. 이 방의 세 그림은 각기 다른 시간에 물 위를 스친 바람을 그렸어요. 가운데에서 세 그림을 한 번에 본 뒤, 가까이 가서 붓 자국과 여백을 살펴보세요."},
];

export const mmcaGalleryRooms=works.map((work,index)=>{
  const west=index%2===0,row=Math.floor(index/2);
  return {id:work.id,name:work.title,shortName:work.shortName,mapColor:work.color,
    minX:west?mmcaVenue.bounds.minX:356,maxX:west?346:mmcaVenue.bounds.maxX,
    minY:[470,494,515][row],maxY:[494,515,533][row],doorY:[483,504,524][row],doorX:west?346:356};
});

export const mmcaExhibits=works.map((work,index)=>{
  const room=mmcaGalleryRooms[index];
  return {...work,gallery:room.id,x:index%2===0?326:376,y:[480,503,525][Math.floor(index/2)],radius:7.4,
    source:work.link??`https://www.mmca.go.kr/exhibitions/exhibitionsDetail.do?exhId=${work.source}`,sourceLabel:"국립현대미술관 전시 기록"};
});

export const mmcaWalls=mmcaGalleryRooms.flatMap(room=>{
  const halfDoor=3;
  return [
    [room.doorX,room.minY,room.doorX,room.doorY-halfDoor],
    [room.doorX,room.doorY+halfDoor,room.doorX,room.maxY],
    [room.minX,room.maxY,room.maxX,room.maxY],
  ];
});
