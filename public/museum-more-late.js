const met="메트로폴리탄 미술관 · 퍼블릭 도메인";
const nationalMuseum="국립중앙박물관 · 공공누리 제1유형";

export const lateExhibits={
  "joseon-books":{
    gallery:"joseon",title:"책가도",credit:"작자 미상 · 조선 · 19세기",
    description:"두 폭에 걸쳐 책장을 그린 병풍입니다. 책등에는 유교 경전과 소설의 제목이 적혀 있습니다.",
    file:"joseon-books",ratio:.75,sourceLabel:met,
    source:"https://www.metmuseum.org/art/collection/search/853896"
  },
  "joseon-hunt":{
    gallery:"joseon",title:"사냥도 병풍",credit:"작자 미상 · 조선 · 19세기",
    description:"말을 타고 호랑이와 사슴을 쫓는 인물들을 여덟 폭에 그렸습니다. 산과 구름 사이를 가로지르는 말들의 움직임을 볼 수 있습니다.",
    file:"joseon-hunt",ratio:2.37288,sourceLabel:met,
    source:"https://www.metmuseum.org/art/collection/search/853890"
  },
  "joseon-roosters":{
    gallery:"joseon",title:"화조도",credit:"작자 미상 · 조선 · 19세기",
    description:"오동나무에 앉은 수탉과 물가의 암탉을 그렸습니다. 해와 구름, 붉은 영지는 장수를 기원하는 소재입니다.",
    file:"joseon-roosters",ratio:.43095,sourceLabel:met,
    source:"https://www.metmuseum.org/art/collection/search/40073"
  },
  "joseon-plum":{
    gallery:"joseon",title:"매화도",credit:"이유원 · 조선 · 1888년",
    description:"굵게 꺾인 매화 가지와 가느다란 꽃가지를 대비시켰습니다. 옅은 먹으로 그린 뒤쪽 가지가 깊이감을 더합니다.",
    file:"joseon-plum",ratio:.64762,sourceLabel:met,
    source:"https://www.metmuseum.org/art/collection/search/40445"
  },
  "empire-gojong":{
    gallery:"modern",title:"황룡포를 입은 고종 어진",credit:"전 채용신 · 20세기 초",
    description:"황색 곤룡포를 입은 고종 황제의 초상입니다. 가는 붓질을 겹쳐 피부의 결을 살리고 얼굴에 명암을 넣었습니다.",
    file:"empire-gojong",ratio:.69286,sourceLabel:nationalMuseum,
    source:"https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=1830&schM=view"
  },
  "empire-gold-book":{
    gallery:"modern",title:"순종 황태자 책봉 금책",credit:"대한제국 · 1897년 · 동합금",
    description:"대한제국을 선포한 해에 고종이 순종을 황태자로 책봉하며 내린 금책입니다. 책봉문을 금속판에 새겼습니다.",
    object:"empire-gold-book",sourceLabel:nationalMuseum,
    source:"https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=7012&schM=view"
  },
  "empire-jade-seal":{
    gallery:"modern",title:"고종 가상존호 옥보",credit:"대한제국 · 1900년 · 옥",
    description:"고종 황제에게 올린 존호를 새긴 옥보입니다. 조선 왕의 어보에 주로 쓰였던 거북 손잡이 대신 황제를 상징하는 용을 올렸습니다.",
    object:"empire-jade-seal",sourceLabel:nationalMuseum,
    source:"https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=8292&schM=view"
  },
  "na-self-portrait":{
    gallery:"modern",title:"자화상",credit:"나혜석 · 1928년경 · 캔버스에 유채",
    description:"나혜석이 자신의 모습을 그린 유화입니다. 어두운 배경과 밝은 얼굴을 대비시키고 정면을 보는 눈에 시선이 모이도록 그렸습니다.",
    file:"na-self-portrait",ratio:.79048,sourceLabel:"수원시립미술관 소장 · 위키미디어 공용 · 퍼블릭 도메인",
    source:"https://commons.wikimedia.org/wiki/File:Self-Portrait_by_Na_Hye-sok,_c._1928.jpg"
  },
  "joseon-miindo":{
    gallery:"joseon",title:"미인도",credit:"혜원 신윤복 · 조선 후기 · 비단에 채색",
    description:"가체를 얹고 옷고름을 만지는 여인의 표정과 옷의 선을 그렸어요. 간송미술문화재단 소장 회화입니다.",
    file:"joseon-miindo.jpg",ratio:400/1050,sourceLabel:"위키미디어 공용 · 회화 이미지",
    source:"https://commons.wikimedia.org/wiki/File:Hyewon-Miindo.jpg"
  },
  "joseon-orchid":{
    gallery:"joseon",title:"불이선란도",credit:"추사 김정희 · 조선 후기 · 종이에 먹",
    description:"몇 줄기의 난초 옆에 글을 쓴 김정희의 묵란입니다. 잎을 가로지르는 먹선과 그 주변의 글씨를 함께 볼 수 있어요.",
    file:"joseon-orchid.jpg",ratio:2/3,sourceLabel:nationalMuseum,
    source:"https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=36549500&schM=view&searchId=search"
  },
  "joseon-sehando":{
    gallery:"joseon",title:"세한도",credit:"추사 김정희 · 1844년 · 종이에 먹",
    description:"제주 유배 중에 그린 문인화입니다. 마른 붓으로 그린 집과 소나무, 잣나무가 넓은 여백 속에 놓여 있어요.",
    file:"joseon-sehando.jpg",ratio:12424/3325,sourceLabel:"위키미디어 공용 · 퍼블릭 도메인",
    source:"https://commons.wikimedia.org/wiki/File:Sehando.jpg"
  }
};
