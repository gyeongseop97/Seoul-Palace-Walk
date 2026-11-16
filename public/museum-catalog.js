import {earlyExhibits} from "./museum-more-early.js";
import {lateExhibits} from "./museum-more-late.js";

export const museumArtUrl=file=>new URL("./art/"+(file.endsWith(".jpg")?file:`${file}.webp`),import.meta.url).href;

export const museumExhibits={
  "silla-cup":{
    title:"뚜껑 있는 손잡이 달린 굽다리 접시",credit:"신라 · 토기 · 높이 13.7cm",
    description:"굽을 단 접시에 손잡이와 뚜껑을 더한 신라 토기입니다.",
    object:"silla-cup",sourceLabel:"국립중앙박물관 · 공공누리 제1유형",
    source:"https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=219415&schM=view"
  },
  "silla-buddha":{
    gallery:"silla",title:"금동불입상",credit:"통일신라 · 금동 · 높이 16.2cm",
    description:"청동으로 만든 뒤 표면에 금을 입힌 불상입니다. 서 있는 부처의 옷 주름과 손 모양을 살펴볼 수 있어요.",
    object:"silla-buddha",sourceLabel:"메트로폴리탄 미술관 소장품 기록",
    source:"https://www.metmuseum.org/art/collection/search/57374"
  },
  "silla-pensive":{
    gallery:"silla",title:"금동미륵보살 반가사유상",credit:"삼국시대 · 금동 · 높이 90.8cm",
    description:"국립중앙박물관 사유의 방에 전시된 덕수3312입니다. 낮은 삼산관을 쓰고 한쪽 다리를 무릎 위에 올렸으며, 손가락을 볼에 가볍게 댄 자세를 볼 수 있어요.",
    object:"silla-pensive",sourceLabel:"국립중앙박물관 소장품 기록",
    source:"https://www.museum.go.kr/MUSEUM/contents/M0505000000.do?relicId=1256&schM=view&searchId=search"
  },
  "silla-gold-crown":{
    gallery:"silla",title:"황남대총 북분 금관",credit:"신라 · 5세기 · 높이 27.3cm",
    description:"머리띠 위에 나뭇가지 모양 세 줄과 사슴뿔 모양 두 줄이 솟아 있어요. 얇은 금판에 달린 작은 금 장식과 비취색 곡옥을 가까이에서 살펴보세요.",
    object:"silla-gold-crown",sourceLabel:"국립경주박물관 소장품 기록",
    source:"https://gyeongju.museum.go.kr/kor/html/sub02/0202.html?d_mng_no=64&mng_no=47&mode=V"
  },
  "silla-baekje-burner":{
    gallery:"silla",title:"백제금동대향로",credit:"백제 · 금동 · 높이 61.8cm",
    description:"봉황이 산 모양 뚜껑 위에 앉고, 용이 연꽃 모양 몸체를 받쳐요. 산봉우리 사이의 인물과 동물은 뚜껑을 한 바퀴 돌아보며 찾을 수 있어요.",
    object:"silla-baekje-burner",sourceLabel:"국립부여박물관 소장품 기록",
    source:"https://buyeo.museum.go.kr/rprsPsn/view.do?key=2302150017&rprsPsnCmdtyMngSn=2001010001"
  },
  "goryeo-celadon":{
    title:"청자 상감 구름 학무늬 매병",credit:"고려 · 12세기 후반~13세기 · 높이 30cm",
    description:"청자 표면을 파내고 다른 색 흙을 채워 구름과 학 무늬를 표현했습니다.",
    object:"goryeo-celadon",sourceLabel:"국립중앙박물관 · 공공누리 제1유형",
    source:"https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=1126&schM=view"
  },
  "goryeo-avalokiteshvara":{
    title:"수월관음도",credit:"고려 · 14세기 전반 · 불화",
    description:"바다 위 바위에 앉은 관음보살과 그를 찾아온 선재동자를 그린 고려 불화입니다.",
    file:"goryeo-avalokiteshvara",sourceLabel:"메트로폴리탄 미술관 · 퍼블릭 도메인",
    source:"https://www.metmuseum.org/art/collection/search/36029"
  },
  "joseon-moon":{
    title:"백자 달항아리",credit:"조선 · 18세기 전반 · 높이 41cm",
    description:"위아래를 따로 빚어 붙인 백자입니다. 둥근 몸체에 남은 미세한 비대칭을 볼 수 있어요.",
    object:"joseon-moon",sourceLabel:"국립중앙박물관 · 공공누리 제1유형",
    source:"https://www.museum.go.kr/MUSEUM/contents/M0504000000.do?relicId=941&schM=view"
  },
  "joseon-buncheong":{
    title:"분청사기 철화 연꽃 물고기무늬 병",credit:"조선 · 분청사기 · 높이 29.4cm",
    description:"백토를 바른 병에 철 성분이 든 안료로 연꽃과 물고기를 그렸습니다.",
    object:"joseon-buncheong",sourceLabel:"국립중앙박물관 · 공공누리 제1유형",
    source:"https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=6267&schM=view"
  },
  inwang:{
    title:"인왕제색도",credit:"정선 · 1751년",
    description:"비가 갠 뒤 인왕산 바위와 골짜기에 걸린 안개를 먹의 농담으로 표현한 산수화입니다.",
    file:"inwang",sourceLabel:"위키미디어 공용 · 퍼블릭 도메인",
    source:"https://commons.wikimedia.org/wiki/File:After_Rain_at_Mt._Inwang.jpg"
  },
  ssireum:{
    title:"씨름",credit:"김홍도 · 조선 후기",
    description:"씨름하는 두 사람을 둘러싸고 구경꾼들이 각기 다른 자세와 표정으로 경기를 보고 있어요.",
    file:"ssireum",sourceLabel:"위키미디어 공용 · 퍼블릭 도메인",
    source:"https://commons.wikimedia.org/wiki/File:Danwon-Ssireum.jpg"
  },
  irwol:{
    title:"일월오봉도",credit:"작자 미상 · 조선",
    description:"해와 달, 다섯 봉우리, 소나무와 물결을 그린 궁중 그림입니다.",
    file:"irwol",sourceLabel:"위키미디어 공용 · 퍼블릭 도메인",
    source:"https://commons.wikimedia.org/wiki/File:Irworobongdo.jpg"
  },
  chochung:{
    title:"초충도 · 가지와 방아개비",credit:"전 신사임당 · 조선",
    description:"가지와 풀벌레처럼 가까이에서 볼 수 있는 자연을 그린 그림입니다.",
    file:"chochung",sourceLabel:"위키미디어 공용 · 퍼블릭 도메인",
    source:"https://commons.wikimedia.org/wiki/File:Shin.Saimdang-Chochungdo-01.jpg"
  },
  "imperial-banquet":{
    title:"임인진연도병 중 가인전목단",credit:"작자 미상 · 대한제국 · 1902년",
    description:"경운궁에서 열린 고종의 연회에서 무용수들이 모란 화분을 둘러싸고 춤추는 장면입니다.",
    file:"imperial-banquet",sourceLabel:"위키미디어 공용 · 퍼블릭 도메인",
    source:"https://commons.wikimedia.org/wiki/File:Korea-Gojong_Imin_Jinyeondobyeong-01.jpg"
  },
  baegak:{
    title:"백악춘효",credit:"안중식 · 1915년 · 여름본",
    description:"새벽 안개에 싸인 경복궁과 그 뒤로 보이는 북악산을 그렸습니다.",
    file:"baegak",sourceLabel:"위키미디어 공용 · 퍼블릭 도메인",
    source:"https://commons.wikimedia.org/wiki/File:An_Jung-sik_Baek-agchunhyo_(Summer).jpg"
  },
  ...earlyExhibits,
  ...lateExhibits
};
