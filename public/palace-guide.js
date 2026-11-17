import {bridge,clearSegment,courtAngle,gate,hall,middle,palacePond,pavilions,stoneFountain,stoneHall,walkable} from "./layout.js";
import {fromBuilding} from "./museum.js";
import {isInsideMuseum} from "./visit-layout.js";
import {gbSite} from "./gyeongbok-layout.js";
import {bukchonLandmarks} from "./bukchon-layout.js";
import {hwangudanLandmarks} from "./seoul-hwangudan-layout.js";
import {cheonggyeLandmarks} from "./cheonggye-layout.js";
import {songhyeonLandmarks} from "./songhyeon-layout.js";
import {plazaSites} from "./plaza-layout.js";
import {uijeongbuEntry,uijeongbuGarden} from "./uijeongbu-layout.js";

const royalTour="https://royal.khs.go.kr/ROYAL/contents/R402000000.do?id=20240313092652267385&schM=view";
const royalBuildings="https://royal.khs.go.kr/ROYAL/contents/R402000000.do?id=20260331093323561530&schM=view";
const palaceRecord="https://digital.khs.go.kr/heri/heriDetail.do?ctptNo=1331101240000&ctptUid=13898859674581300745";
const modernMuseum="https://www.mmca.go.kr/upload/m/data/exhibition/2012/09/14/20120914091758.pdf";
const pavilionByName=Object.fromEntries(pavilions.map(site=>[site.name,site]));
const gyeongbokTour="https://royal.khs.go.kr/ROYAL/contents/R101020000.do?bdProgramCode=storyCtg3&menuId=03_01_02&pageType=story&schBdcode=gbg";
const hwangudanRecord="https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1331101570000&pageNo=1_1_2_0";
const bukchonTour="https://hanok.seoul.go.kr/home/data/bcg/walk/TOUR_1705032369675.pdf";
const guideDistance=3.8;

function footprint(site){
  const w=site.w/2,d=site.d/2;
  return site.outline??[[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,z])=>fromBuilding(site,x,z));
}

// Read from several sides of a building or pond. Use positions beyond the
// footprint so paths to the sign are checked against the actual collision map.
function perimeterPoints(outline){
  const next=outline.slice(1).concat(outline[0]);
  const direction=Math.sign(outline.reduce((sum,a,i)=>sum+a.x*next[i].y-next[i].x*a.y,0));
  return outline.flatMap((a,i)=>{
    const b=next[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    const count=Math.max(1,Math.ceil(length/3.4));
    const nx=direction*dy/length,ny=-direction*dx/length;
    return Array.from({length:count},(_,index)=>{
      const t=(index+.5)/count;
      return [1.1,2.3].map(offset=>({x:a.x+dx*t+nx*offset,y:a.y+dy*t+ny*offset}));
    }).flat();
  });
}

function localPoints(site,positions){
  return positions.map(([x,z])=>fromBuilding(site,x,z));
}

function guide(id,site,description,source,access=[],title=site.name){
  const outline=site.w?footprint(site):site.outline;
  const points=outline?[...perimeterPoints(outline),...access]:access;
  const radius=Math.max(...points.map(point=>Math.hypot(point.x-site.x,point.y-site.y)))+guideDistance;
  return {site,points,radiusSquared:radius*radius,entry:{id,title,description,source}};
}

const mainGate={...gate,w:14.2,d:8.1,angle:Math.PI/2};
const middleGate={...middle,w:10.9,d:6.9,angle:courtAngle};
const mainHall={...hall,w:18.6,d:17.6,angle:courtAngle};
const stoneBuilding={...stoneHall,w:54.2,d:31};
const fountainEdge=Array.from({length:16},(_,index)=>{
  const angle=index*Math.PI/8;
  return {x:stoneFountain.x+5.7*Math.cos(angle),y:stoneFountain.y+5.7*Math.sin(angle)};
});

const guides=[
  guide("daehanmun",mainGate,
    "덕수궁의 정문이에요. 동쪽에 있던 대안문을 1906년에 고쳐 대한문이라 이름 붙이고 정문으로 삼았습니다.",
    "https://royal.khs.go.kr/ROYAL/contents/R404000000.do?schGroupCode=dsg",localPoints(mainGate,[[0,-6],[0,0],[0,7],[0,12]])),
  guide("geumcheongyo",bridge,
    "대한문을 지나 처음 만나는 돌다리예요. 궁궐 안팎을 가르는 물길 위에 놓였으며, 아래에는 돌로 쌓은 두 개의 아치가 있습니다.",
    "https://heritage.go.kr/heri/gungDetail/gogungDetail.do?detail_code=2&gung_number=4&serial_number=111",
    localPoints(bridge,[[-4,0],[0,0],[4,0],[0,-2],[0,2]])),
  guide("junghwamun",middleGate,
    "중화전 마당으로 들어가는 문이에요. 1904년 화재 뒤 중화전과 함께 다시 지었고, 문 동쪽에는 마당을 둘러싸던 행각의 일부가 남아 있습니다.",
    "https://digital.khs.go.kr/heri/heriDetail.do?ctptUid=13898859671361200471",
    localPoints(middleGate,[[0,-5],[0,0],[0,5]])),
  guide("junghwajeon",mainHall,
    "덕수궁의 중심 전각인 정전이에요. 왕의 즉위식과 신하들의 하례, 외국 사신 접견 같은 공식 행사가 이곳에서 열렸습니다.",
    royalTour,localPoints(mainHall,[[0,28],[0,24],[0,18],[0,-17],[-22,1],[22,1]])),
  guide("gwangmyeongmun",pavilionByName["광명문"],
    "고종의 침전인 함녕전으로 들어가는 문이에요. 일제강점기에 옮겨졌다가 2019년 원래 자리에 돌아왔습니다.",
    "https://www.seouldanurim.net/video-tour/VOD/view/33658"),
  guide("hamnyeongjeon",pavilionByName["함녕전"],
    "고종이 생활하던 침전이에요. 고종이 1919년 세상을 떠난 곳이기도 합니다.",royalTour),
  guide("deokhongjeon",pavilionByName["덕홍전"],
    "명성황후의 신주를 모셨던 경효전 터에 세운 전각이에요. 1912년 건물을 고쳐 덕홍전이라는 이름을 붙였습니다.",modernMuseum),
  guide("seogeodang",pavilionByName["석어당"],
    "덕수궁에 남아 있는 유일한 2층 목조 전각이에요. 단청을 하지 않아 기둥과 처마에서 목재의 빛깔을 볼 수 있습니다.",
    "https://encykorea.aks.ac.kr/Article/E0015361"),
  guide("jeukjodang",pavilionByName["즉조당"],
    "대한제국 초기에 잠시 정전으로 쓰인 전각이에요. 이후에는 임금이 업무를 보던 편전으로 쓰였습니다.",royalTour),
  guide("junmyeongdang",pavilionByName["준명당"],
    "함녕전이 지어지기 전까지 고종의 침전으로 쓰인 전각이에요. 나중에는 고종의 딸 덕혜옹주의 유치원으로도 쓰였습니다.",royalBuildings),
  guide("jeonggwanheon",pavilionByName["정관헌"],
    "전통 지붕과 서양식 기둥이 함께 있는 전각이에요. 처마 아래의 기둥과 난간에서도 서로 다른 건축 양식이 어우러진 모습을 볼 수 있습니다.",
    "https://heritage.go.kr/heri/html/HtmlPage.do?pageNo=3_1_1_0&pg=%2Fpalaces%2FpalacesDeokInfo.jsp"),
  guide("seokjojeon",stoneBuilding,
    "대한제국기에 지은 서양식 석조 건물이에요. 정면의 높은 이오니아식 기둥과 삼각형 지붕 장식에 새긴 오얏꽃 문양이 눈에 띕니다.",
    "https://contents.history.go.kr/mobile/nh/view.do?levelId=nh_046_0040_0020_0030_0020_0010",
    localPoints(stoneBuilding,[[0,20],[0,16],[-10,19],[10,19]])),
  guide("seokjojeon-west",pavilionByName["국립현대미술관 덕수궁관"],
    "1938년 이왕가미술관으로 문을 연 건물이에요. 1998년부터 국립현대미술관 덕수궁관으로 쓰이고 있습니다.",
    "https://www.mmca.go.kr/pr/employmentDetail.do?bdCId=201805030006268&menuId=&searchBmCid=200903020000015",[],"석조전 서관"),
  guide("dondeokjeon",pavilionByName["돈덕전"],
    "고종 즉위 40주년을 계기로 지은 서양식 영빈관이에요. 대한제국의 외교 무대였으며, 복원 후 2023년에 다시 문을 열었습니다.",
    "https://royal.khs.go.kr/ROYAL/contents/R402000000.do?id=20230925142548033336&schM=view"),
  guide("yunganmun",pavilionByName["융안문"],
    "덕홍전 영역으로 들어가는 문이에요. 문과 이어지는 행각도 함께 복원했습니다.",
    "https://www.archives.go.kr/next/newsearch/showDetailPopup.do?rc_code=1310377&rc_rfile_no=201205359212&rc_ritem_no=&sitePage="),
  guide("pyeongseongmun",pavilionByName["평성문"],
    "돈덕전 가까이에서 정동길로 이어지는 덕수궁의 후문이에요. 문 바깥에는 주한 미국대사관저가 있습니다.",
    "https://royal.khs.go.kr/ROYAL/contents/R403000000.do?id=20241128163203827666&schBcid=notice01&schM=view"),
  guide("wolgokmun",pavilionByName["월곡문"],
    "정동 쪽 돌담길에서 볼 수 있는 덕수궁의 문이에요. 국가유산청 기록에는 2005년 문을 해체해 보수한 내역이 남아 있습니다.",palaceRecord),
  guide("palace-pond",palacePond,
    "대한문 안쪽에 있는 연못이에요. 연못 일대는 1960년대에 스케이트장으로 쓰인 적도 있습니다.",modernMuseum,[],"덕수궁 연못 · 연지"),
  guide("seokjojeon-fountain",stoneFountain,
    "석조전 앞에 펼쳐진 서양식 정원이에요. 네 잎 모양 분수를 중심으로 잔디와 화단이 대칭으로 놓여 있습니다.",
    "https://world.seoul.go.kr/deoksugung-palace-2/",fountainEdge),
  ...Object.entries({
    gwanghwamun:"경복궁의 정문이에요. 돌로 쌓은 육축에 세 개의 홍예문을 내고 그 위에 2층 문루를 올렸습니다. 여러 차례 훼손과 이전을 겪은 뒤 2010년 제자리에 나무 구조로 복원했습니다.",
    heungnyemun:"광화문과 근정문 사이에 있는 중문이에요. 일제강점기에 조선총독부 청사를 지으며 헐렸다가 2001년에 복원했습니다.",
    geunjeongmun:"정전인 근정전으로 들어가는 문이에요. 좌우 행각과 함께 근정전 마당을 둘러쌉니다.",
    geunjeongjeon:"경복궁의 정전으로 국보예요. 왕의 즉위식과 조회, 외국 사신 접견 같은 나라의 큰 의식을 치렀습니다. 2단 월대 위에 서 있고, 마당에는 박석을 깔고 품계석을 세웠습니다.",
    sajeongjeon:"왕이 평소에 신하들과 나랏일을 의논하던 편전이에요. 좌우의 만춘전과 천추전은 온돌을 갖춘 보조 편전입니다.",
    gangnyeongjeon:"왕의 침전이에요. 지붕에 용마루가 없는 것이 특징이며, 지금 건물은 1995년에 복원했습니다.",
    gyotaejeon:"왕비의 침전이에요. 뒤뜰에는 계단식 화단인 아미산이 있고, 그곳의 육각 굴뚝은 보물로 지정되어 있습니다.",
    gyeonghoeru:"나라의 경사나 사신 접대 때 연회를 베풀던 누각으로 국보예요. 네모난 연못 위 돌기둥 48개가 2층 누마루를 받치고 있으며, 지금 건물은 1867년에 다시 지었습니다.",
    sujeongjeon:"세종 때 집현전이 있던 자리에 고종 때 다시 지은 건물이에요. 갑오개혁 무렵에는 군국기무처와 내각 청사로 쓰였습니다.",
    jagyeongjeon:"고종의 양어머니인 신정왕후 조씨를 위해 지은 대비전이에요. 꽃담과 십장생을 새긴 굴뚝이 유명하며, 굴뚝은 보물입니다.",
    hyangwonjeong:"향원지 연못 한가운데 섬에 세운 육각 2층 정자로 보물이에요. 고종이 건청궁을 지으며 함께 만들었고, 북쪽에서 다리 취향교로 건너갑니다.",
    geoncheonggung:"고종이 1873년에 지은 궁 안의 궁이에요. 1887년 우리나라에서 처음으로 전등을 밝힌 곳이며, 1895년 명성황후가 시해된 을미사변의 현장이기도 합니다. 2007년에 복원했습니다.",
    jibokjae:"고종이 서재로 쓰며 외국 사신을 맞이하던 건물이에요. 벽돌을 쌓아 올린 중국풍 양식이 궁 안의 다른 전각과 다릅니다.",
    "palace-museum":"조선 왕실과 대한제국 황실의 유물을 전시하는 박물관이에요. 경복궁역 5번 출구와 바로 이어집니다."
  }).map(([id,description])=>guide("gb-"+id,gbSite[id],description,gyeongbokTour)),
  ...[
    ["gyejodang","세종이 왕세자였던 문종의 집무 공간으로 마련한 전각이에요. 동궁 권역에 있으며 2023년에 복원했습니다.",
      "https://royal.khs.go.kr/ROYAL/contents/R402000000.do?id=20240903132445164232&schM=view"],
    ["sojubang","궁중 음식을 준비하던 곳이에요. 내소주방에서는 왕과 왕비의 수라를, 외소주방에서는 잔치 음식을 마련했습니다.",
      "https://royal.khs.go.kr/ROYAL/contents/R701000000.do"],
    ["heungbokjeon","고종 때 외국 사신을 접견하던 전각이에요. 일제강점기에 철거됐다가 2020년에 복원했습니다.",
      "https://royal.khs.go.kr/ROYAL/contents/R603040000.do"],
    ["amisan","교태전 뒤뜰의 계단식 화단에 왕비의 온돌방과 연결된 육각 굴뚝 네 기가 서 있어요. 벽돌을 조합해 학, 봉황, 꽃과 나무를 새겼습니다.",
      "https://digital.khs.go.kr/heri/heriDetail.do?ctptNo=1121108110000&ctptUid=13898859671268200463"],
    ["hamhwadang","향원지 남쪽에 있는 전각이에요. 고종 때 집경당과 함께 경연과 외국 사신 접견 등에도 사용했습니다."],
    ["jipgyeongdang","함화당과 나란히 놓인 전각이에요. 두 건물 사이를 잇는 복도를 볼 수 있습니다."],
    ["taewonjeon","궁 서북쪽에 있는 전각이에요. 태조의 어진을 보관했고, 왕실의 장례 때 관을 모시는 빈전으로도 썼습니다."],
    ["janggo","궁중 음식에 쓸 장을 담고 보관하던 곳이에요. 낮은 단에 놓인 여러 크기의 장독을 둘러볼 수 있습니다.",
      "https://royal.khs.go.kr/ROYAL/contents/R201000000.do?act=view&ceIdx=202610200316"]
  ].map(([id,description,source])=>guide("gb-"+id,gbSite[id],description,source??gyeongbokTour)),
  ...hwangudanLandmarks.map((site,index)=>guide("hwangudan-"+index,site,site.description,hwangudanRecord,[site])),
  ...cheonggyeLandmarks.map((site,index)=>guide("cheonggye-"+index,site,site.description,
    "https://www.sisul.or.kr/open_content/cheonggye/enjoy/infomap.jsp",[site])),
  guide("songhyeon",songhyeonLandmarks[0],"서울공예박물관 옆 송현동에 열린 잔디광장입니다. 둘레길과 꽃밭 사이 길을 걸을 수 있고, 율곡로와 감고당길 쪽 출입구로 이어집니다.",
    "https://mediahub.seoul.go.kr/archives/2005988",songhyeonLandmarks),
  guide("sejongno-park",plazaSites.sejongPark,"세종문화회관과 정부서울청사 사이의 공원입니다. 한글글자마당과 원형무대, 나무 사이 산책로를 둘러보세요.",
    "https://access.visitkorea.or.kr/ms/detail.do?cotId=b2b3e368-293e-4fc4-a719-90b0f1514385",[plazaSites.sejongPark]),
  guide("uijeongbu",uijeongbuEntry,"조선 시대에 나라의 주요 정사를 논의하던 의정부가 있던 자리입니다. 정본당·협선당·석획당 터와 후원의 연지와 정자 터를 둘러볼 수 있습니다.",
    "https://mediahub.seoul.go.kr/archives/2011545",[uijeongbuEntry,uijeongbuGarden]),
  ...[
    [0,"경복궁 동남쪽 모퉁이에 있던 망루입니다. 궁 담장이 물러나면서 지금은 삼청로 교차로 가운데에 남아 있어요."],
    [5,"삼청로와 나란히 뻗은 팔판동 골목이에요. 낮은 한옥과 좁은 길을 따라 북촌 쪽으로 걸을 수 있어요."],
    [7,"삼청로 쪽에서 북촌 한옥 골목으로 오르는 돌계단입니다. 서울시 북촌 팔경 중 하나로, 계단 위에서 삼청동을 내려다볼 수 있어요."],
    [10,"안국동에서 정독도서관과 북촌 골목으로 이어지는 길이에요. 언덕을 따라 걷다 보면 기와지붕과 낮은 담이 이어집니다."]
  ].map(([index,description])=>{
    const site=bukchonLandmarks[index];
    const source=index===0?"https://mediahub.seoul.go.kr/archives/2005311":bukchonTour;
    return guide("bukchon-"+index,site,description,source,[site]);
  })
];

function squaredDistance(a,b){
  return (a.x-b.x)**2+(a.y-b.y)**2;
}

export function nearbyPalaceGuide(position){
  if(isInsideMuseum(position.x,position.y)||!walkable(position.x,position.y))return null;
  let result=null,bestDistance=guideDistance*guideDistance;
  for(const {site,points,radiusSquared,entry} of guides){
    if(squaredDistance(position,site)>radiusSquared)continue;
    for(const point of points){
      const distance=squaredDistance(position,point);
      if(distance<bestDistance&&walkable(point.x,point.y)&&clearSegment(position,point)){
        result=entry;
        bestDistance=distance;
      }
    }
  }
  return result;
}
