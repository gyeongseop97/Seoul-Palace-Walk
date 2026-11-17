import {mmcaAt} from "./mmca-layout.js";

export const mmcaVenue={
  id:"mmca",name:"국립현대미술관 서울",
  bounds:{minX:310,maxX:392,minY:438,maxY:546},
  outsideDoor:{...mmcaAt(-18.3,106),heading:260,tilt:0},
  insideDoor:{x:351,y:543,heading:180},insideSpawn:{x:351,y:539,heading:0},
  guestbookPoint:{x:339,y:536},
};

const works=[
  {id:"home",title:"바람이 머문 집",shortName:"바람의 집",credit:"서도호 · 2013 서울관 개관전",
    original:"‹집 속의 집 속의 집 속의 집 속의 집›",source:"201311010002927",color:"#708e95",
    description:"서도호는 살던 집의 형태와 치수를 재어 천으로 옮겼어요. 게임에서는 한옥 처마와 격자 문살, 여러 겹의 반투명한 방을 만들었어요. 열린 문 사이로 들어가 천의 솔기와 겹쳐 보이는 지붕을 살펴보세요.",
    obstacles:[[-2.88,0,.12,5.46],[2.88,0,.12,5.46],[-1.98,-2.72,1.76,.12],[1.98,-2.72,1.76,.12],
      [-1.98,2.72,1.76,.12],[1.98,2.72,1.76,.12],[-1.71,.62,.10,2.65],[1.71,.62,.10,2.65]]},
  {id:"colors",title:"빛을 모으는 손",shortName:"빛의 방",credit:"김수자 · 2016 《마음의 기하학》",
    original:"‹마음의 기하학›과 ‹호흡›",source:"201606240000455",color:"#927da4",
    description:"2016년 전시에는 손으로 빚는 흙덩이와 유리를 통과하며 여러 색으로 나뉘는 빛이 함께 등장했어요. 이 방에서는 빛 바꾸기 버튼으로 세 가지 조명 아래 구슬과 프리즘의 색을 살펴볼 수 있어요."},
  {id:"objects",title:"찬장의 정원",shortName:"사물 정원",credit:"최정화 · 2018 《꽃, 숲》",
    original:"‹민들레›와 일상용품 설치 연작",source:"201801150000995",color:"#ad784f",
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
  return {id:work.id,name:work.id==="home"?"서도호 관":work.title,shortName:work.id==="home"?"서도호":work.shortName,mapColor:work.color,
    minX:west?mmcaVenue.bounds.minX:356,maxX:west?346:mmcaVenue.bounds.maxX,
    minY:[470,494,515][row],maxY:[494,515,533][row],doorY:[483,504,524][row],doorX:west?346:356};
});
mmcaGalleryRooms.unshift(
  {id:"hirst",name:"데이미언 허스트 관",shortName:"허스트",mapColor:"#455770",exhibitId:"shark",
    minX:310,maxX:346,minY:438,maxY:470,doorX:346,doorY:452},
  {id:"mueck",name:"론 뮤익 관",shortName:"론 뮤익",mapColor:"#796a67",exhibitId:"mueck",
    minX:356,maxX:392,minY:438,maxY:470,doorX:356,doorY:452},
);

const hirstExhibition="202601060002023";
const newWorks=[
  {id:"home-passage",gallery:"home",title:"기억이 건너는 복도",credit:"서도호 · 2026 서울관 개인전",
    original:"‹완벽한 집: 런던, 호셤, 뉴욕, 베를린, 프로비던스, 서울›",source:"202601200002041",
    x:338,y:486,radius:5.8,obstacles:[[-1.89,0,.12,6.24],[1.89,0,.12,6.24]],
    description:"서도호는 여러 도시의 집에서 가져온 복도와 문을 천으로 이어 하나의 공간을 만들었어요. 게임에서도 색이 다른 세 개의 천 복도를 이어 걸을 수 있게 했어요. 문고리와 스위치, 콘센트처럼 매일 보던 물건까지 가까이에서 살펴보세요."},
  {id:"skull",gallery:"hirst",title:"차가운 별의 두개골",credit:"데이미언 허스트 · 2026 서울관 개인전",
    original:"‹신의 사랑을 위하여› (For the Love of God, 2007)",source:hirstExhibition,
    x:326,y:459,radius:5.2,obstacles:[[0,0,3.4,2.5]],
    description:"허스트는 두개골 형태를 백금으로 주조하고 다이아몬드로 덮었어요. 게임에서는 각이 다른 보석을 별자리처럼 배치하고, 보는 방향에 따라 빛이 달라지는 두개골을 만들었어요."},
  {id:"shark",gallery:"hirst",title:"푸른 정지",credit:"데이미언 허스트 · 2026 서울관 개인전",
    original:"‹살아있는 자의 마음 속 죽음의 물리적 불가능성› (1991)",source:hirstExhibition,
    x:328,y:445,radius:7.2,obstacles:[[0,0,9.25,4.8]],
    description:"원작에서 허스트는 포름알데히드 용액에 보존한 상어를 유리 수조에 전시했어요. 여기서는 상어를 직접 3D로 만들고 푸른 유리 수조에 배치했어요. 수조를 돌아보면 아가미와 지느러미, 꼬리의 윤곽이 다르게 보여요."},
  {id:"mueck",gallery:"mueck",title:"하루의 가장자리",credit:"론 뮤익 · 2025 서울관 개인전",
    original:"‹침대에서› (In Bed, 2005)",source:"202501060001881",
    x:374,y:453,radius:7.4,
    description:"론 뮤익은 사람의 표정과 피부를 세밀하게 만들고, 크기를 크게 바꿔 관람객이 평범한 몸짓을 새로 보게 해요. 게임에서는 벤치에 앉아 볼을 괴고 잠시 쉬는 인물로 그 느낌을 표현했어요."},
];

const extras={
  home:[
    ["home-pockets","기억의 서랍",318,476,"반투명한 서랍과 문고리 안쪽까지 들여다볼 수 있게 만들었어요.","서울관 설치의 건축 디테일"],
    ["home-thread","실로 이어 붙인 방",318,488,"가느다란 실로 엮은 벽 사이에 창을 냈어요. 정면과 옆에서 서로 다르게 보이는 방을 살펴보세요.","서도호의 공간 드로잉과 천 작업"],
  ],
  colors:[
    ["color-spectra","겹빛의 기둥","휘어진 여러 겹의 색유리를 비껴 보세요. 겹쳐지는 색과 빛의 띠가 달라져요."],
    ["color-clay","손바닥의 별자리","손으로 빚은 듯 굴곡이 있는 작은 구슬을 색과 크기별로 모았어요."],
    ["color-rays","새벽의 창","창틀을 지난 빛이 여러 방향으로 흩어지는 모습을 입체로 표현했어요."],
  ],
  objects:[
    ["objects-wire","찬장 밖의 궤도","국자와 체를 매달아 회전하는 모빌로 만들었어요."],
    ["objects-flower","철제 꽃밭","주방의 금속 그릇과 도구에서 따온 형태가 꽃처럼 펼쳐져요."],
    ["objects-lattice","그릇의 단면","서로 다른 컵과 그릇을 격자에 넣었어요. 그릇 사이에 남는 빈칸도 살펴보세요."],
  ],
  weave:[
    ["weave-screen","숨 쉬는 격자","실로 짠 발의 간격을 달리해 서 있는 위치에 따라 겹무늬가 달라져요."],
    ["weave-bell","구름의 방울","여러 높이에서 흔들리는 실 타래와 종 모양을 바라보세요."],
    ["weave-vessel","서리를 담는 항아리","가닥을 비틀어 짠 항아리예요. 열린 윗부분으로 안쪽의 짜임이 보여요."],
  ],
  tide:[
    ["tide-sail","바람의 기관","여러 장의 작은 돛이 차례로 방향을 틀어요."],
    ["tide-beam","수평을 찾는 저울","길이가 다른 균형추가 움직일 때 기울기를 살펴보세요."],
    ["tide-step","느린 물결의 기어","톱니가 돌고 판이 차례로 올라오면서 작은 물결을 만들어요."],
  ],
  wind:[
    ["wind-returns","되돌아오는 물결","먹빛과 옅은 물빛으로 파도가 되돌아오는 장면을 두 폭에 그렸어요."],
    ["wind-tree","바람이 지나간 자리","나뭇가지와 천을 함께 놓아 바닥에도 바람 자국처럼 그림자가 생겨요."],
    ["wind-trace","눌러 남긴 흔적","비어 있는 자리를 둘러보면 눌린 표면과 작은 흔적이 남아 있어요."],
  ],
  hirst:[
    ["hirst-spin","색이 도는 자리",316,445,"원에서 바깥으로 뻗는 색이 회전할 때마다 다른 무늬를 만들어요.","‹스핀 페인팅› 연작"],
    ["hirst-cabinet","유리병 선반",316,459,"병과 상자를 종류별로 모은 진열장입니다. 정렬된 물건과 비어 있는 칸을 살펴보세요.","‹희생 제물›과 약장 연작"],
  ],
  mueck:[
    ["mueck-mask","눈을 감은 오후",365,444,"커다랗게 만든 얼굴에 감긴 눈꺼풀과 볼의 굴곡을 넣었어요.","‹마스크 II›"],
    ["mueck-hand","빈 손의 온도",383,445,"손을 크게 확대했어요. 손가락 마디와 힘을 뺀 손바닥을 여러 각도에서 볼 수 있어요.","‹나뭇가지를 든 여인›의 손짓"],
    ["mueck-scale","모퉁이의 사람",383,463,"작게 조형한 인물을 가까이서 보면 옷자락과 신발에 남은 몸짓이 보여요.","‹어두운 장소›의 인물 크기"],
  ],
};

const firstWorks=works.map((work,index)=>({
  ...work,gallery:work.id,x:index%2===0?326:376,y:[work.id==="home"?480:477,499.5,520][Math.floor(index/2)],radius:7.4,
}));
const referenceByRoom=new Map([...firstWorks,...newWorks].filter(work=>!["home-passage","skull"].includes(work.id))
  .map(work=>[work.gallery,work]));
const addedWorks=Object.entries(extras).flatMap(([gallery,entries])=>{
  const reference=referenceByRoom.get(gallery),sameColumn=reference.x,secondColumn=sameColumn<351?338:364;
  const lowerRow={colors:488,objects:509.5,weave:509.5,tide:528.4,wind:528.4}[gallery];
  const positions=[[secondColumn,reference.y],[sameColumn,lowerRow],[secondColumn,lowerRow]];
  return entries.map(([id,title,x,y,description,original],index)=>{
    if(typeof x==="string"){
      description=x;[x,y]=positions[index];
    }
    return {id,gallery,title,x,y,radius:6.2,description,original:original??reference.original,
      credit:reference.credit,source:reference.source,link:reference.link,extra:true};
  });
});

const sculptureSeries={
  home:[
    ["home-doorframes","겹겹의 문턱",319.4,482.4,"크기가 다른 네 문틀이 한 자리에 겹쳐 있어요. 옆으로 걸으면 각 문틀의 색 사이에 틈이 생겨요."],
    ["home-roofs","손바닥 위 처마",333.5,474.2,"얇은 처마 네 장을 서로 다른 높이에 걸었어요. 낮게 보면 처마 끝이 지붕 하나처럼 이어져요."],
    ["home-stairs","어디로도 닿지 않는 계단",340,476.7,"양쪽에서 올라오는 계단이 비어 있는 문 앞에서 만나요. 바닥에 드리운 그림자도 계단을 닮았어요."],
    ["home-windows","밤을 켜 둔 창",330.5,490,"반투명 천과 나무 창살을 겹친 작은 방이에요. 불이 켜진 두 창 사이로 안쪽 방을 볼 수 있어요."],
  ],
  colors:[
    ["colors-crystals","보랏빛이 고인 자리",385.6,477,"각이 다른 수정들이 서로 닿을 듯 서 있어요. 시선을 옮겨 표면의 옅은 빛과 짙은 빛을 살펴보세요."],
    ["colors-arch","흐린 무지개의 문",385.6,488,"색판을 기울여 무지개 모양으로 세웠어요. 투명한 끝부분을 통해 뒤의 색이 비쳐요."],
    ["colors-orbits","빛 둘레의 궤도",370,482.8,"중심의 구슬과 주위를 맴도는 고리가 같은 색을 서로 다른 각도로 반사해요."],
    ["colors-fold","빛의 부채",379.6,482.9,"주름을 펼친 색판들이 한쪽으로 빛을 모았다가 반대쪽으로 퍼뜨려요."],
  ],
  objects:[
    ["objects-cups","한 그릇씩 쌓인 하루",316,499.4,"손잡이와 굽이 조금씩 다른 그릇을 한 방향씩 돌려 쌓았어요."],
    ["objects-pitchers","물 주전자의 숲",316,509.5,"높이와 색이 다른 주전자들이 줄기처럼 올라와요. 그 사이로 비어 있는 손잡이 모양이 겹쳐 보여요."],
    ["objects-spoons","기울어진 식탁",331.5,504.5,"길이가 다른 숟가락을 부채꼴로 세웠어요. 익숙한 도구도 멀리서 보면 커다란 잎처럼 보여요."],
    ["objects-crocks","네 개의 빈 찬장",321.4,505.1,"그릇 네 개를 비스듬히 세웠어요. 높이와 방향을 달리한 입구로 각 그릇의 안쪽 색이 보여요."],
  ],
  weave:[
    ["weave-loom","푸른 실이 머무는 틀",385.6,499.4,"폭이 다른 실 세 겹을 낮은 베틀에 걸었어요. 틀을 비껴 보면 선이 교차하는 간격이 달라져요."],
    ["weave-shell","갈대를 말아 만든 귀",385.6,509.5,"갈대 색 가닥을 원통에서 끝이 가는 소용돌이로 엮었어요. 가운데 비어 있는 부분은 옆에서도 보여요."],
    ["weave-nests","겹보금자리",370,504.5,"다른 방향으로 엮은 두 개의 고리를 맞물렸어요. 안과 밖에서 섬유의 짜임이 번갈아 보이도록 했어요."],
    ["weave-wave","결을 접는 바람",379.7,504.7,"굽이치는 세 개의 살 위로 짧은 실이 물결을 따라 이어져요."],
  ],
  tide:[
    ["tide-wheel","달을 미는 손잡이",316,520,"손잡이가 달린 금속 원판이 천천히 회전해요. 안쪽과 바깥쪽에서 반사되는 빛이 달라요."],
    ["tide-pendulums","하루의 다른 박자",316,528.15,"세 개의 추가 길이와 속도를 달리해 움직여요. 잠시 지켜보면 같은 방향으로 흔들리는 순간이 있어요."],
    ["tide-spokes","파도를 세우는 날개",332,524.25,"브래스 살에 붙은 판들이 하나의 축 주위를 돌아요. 옆에서 보면 서로 다른 길이의 판이 겹쳐져요."],
    ["tide-beacons","잔물결의 등대",320.7,524.3,"세운 등대 안에서 고리가 돌고 바깥의 추는 천천히 기울어요."],
  ],
  wind:[
    ["wind-ribbons","강물이 접힌 자리",385.6,520,"넓은 물결 세 장을 서로 다른 높이에서 접었어요. 가까이서 가장자리의 물빛을 살펴보세요."],
    ["wind-stones","움직이지 않는 물결",385.6,528.25,"물에 닳은 돌과 아치형 얇은 띠를 겹쳐 놓았어요. 서로 다른 재료가 하나의 흐름을 이뤄요."],
    ["wind-reeds","흰 새가 난 다음",370,524.2,"물을 스친 깃을 떠올리며 가느다란 깃대와 폭이 다른 천 조각을 세웠어요."],
    ["wind-rings","한 호흡의 원",381,524.15,"완전히 닫히지 않은 먹빛 원들이 서로를 통과해요. 원이 어긋난 자리에 옅은 물빛이 드러나요."],
  ],
  hirst:[
    ["hirst-wings","접힌 날개의 기록",320.5,451.8,"유리장에 펼친 네 쌍의 날개는 색과 벌어진 각도가 서로 달라요. 빛을 받는 가장자리에는 얇은 테를 댔어요."],
    ["hirst-amber","호박빛 표본실",339,444.8,"서로 다른 색의 앰풀과 병을 세웠어요. 빈 병과 빛을 머금은 병이 교대로 놓여 있어요."],
    ["hirst-rings","잘라 본 시간",340,461.5,"얇고 넓은 단면을 차례로 세웠어요. 여러 겹의 테를 따라가면 푸른색과 구릿빛이 번갈아 나와요."],
    ["hirst-shards","하얀 조각의 분류",329,465.8,"유리장에 표면이 다른 흰 조각을 공중에 떠 있는 듯 배열했어요. 면마다 그림자가 다르게 져요."],
  ],
  mueck:[
    ["mueck-foot","걸음을 멈춘 발",360.6,447.2,"발등과 발가락의 굴곡을 실제보다 크게 만들었어요. 바닥에 닿는 자국으로 무게를 느껴 보세요."],
    ["mueck-shoulder","돌아보는 어깨",365.9,461.8,"한쪽 어깨를 든 인물의 등과 목을 조형했어요. 옷깃은 고개가 돌아가는 방향을 따라요."],
    ["mueck-knee","몸을 웅크린 사람",372.5,443.75,"두 무릎과 굽힌 팔이 한곳에 모여 있어요. 뒷면에서는 늘어진 옷자락을 볼 수 있어요."],
    ["mueck-sleeves","기다리는 두 사람",387.4,453.5,"서로를 기다리는 두 사람의 높이와 자세를 다르게 만들었어요. 내려다보는 얼굴과 옆을 보는 얼굴을 비교해 보세요."],
  ],
};
const roomSculptures=Object.entries(sculptureSeries).flatMap(([gallery,items])=>items.map(([id,title,x,y,description],series)=>({
  id,gallery,title,x,y,description,series,credit:"서울 궁 한바퀴 · 게임 창작 조형",
  source:referenceByRoom.get(gallery).source,sourceLabel:"국립현대미술관 테마 참고 자료",
  radius:4.2,obstacles:[[0,0,3.38,2.88,3.95]],
})));

export const mmcaExhibits=[...firstWorks,...newWorks,...addedWorks,...roomSculptures].map(work=>({
  ...work,source:work.link??`https://www.mmca.go.kr/exhibitions/exhibitionsDetail.do?exhFlag=2&exhId=${work.source}`,
  sourceLabel:work.sourceLabel??"국립현대미술관 전시 기록",
}));

export function mmcaGalleryAt(x,y){
  return mmcaGalleryRooms.find(room=>x>room.minX&&x<room.maxX&&y>room.minY&&y<room.maxY);
}

export const mmcaWalls=mmcaGalleryRooms.flatMap(room=>{
  const halfDoor=3;
  return [
    [room.doorX,room.minY,room.doorX,room.doorY-halfDoor],
    [room.doorX,room.doorY+halfDoor,room.doorX,room.maxY],
    [room.minX,room.maxY,room.maxX,room.maxY],
  ];
});
