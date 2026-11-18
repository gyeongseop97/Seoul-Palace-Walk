export const semaVenue={
  id:"sema",area:"jeongdong",name:"서울시립미술관 서소문본관",
  bounds:{minX:428,maxX:452,minY:502,maxY:520},
  outsideDoor:{x:201,y:378,heading:177},insideDoor:{x:440,y:518.8,heading:180},
  insideSpawn:{x:440,y:512.8,heading:0}
};

const exhibition="https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=151&glolangType=KOR";
export const semaExhibits=[
  ["swing","그네",1876,"오르세 미술관",433.5,502.35,0,447/600,"그네에 선 여인의 흰옷과 자갈길을 번갈아 보세요. 나뭇잎 사이로 들어온 빛이 두 곳에 같은 얼룩을 남깁니다."],
  ["dance","시골 무도회",1883,"오르세 미술관",445.5,502.35,0,286/600,"춤추는 두 사람의 발끝에서 시선을 위로 옮겨 보세요. 화면 밖 관객과 눈을 맞추는 여인의 시선이 회전하는 몸짓을 붙잡습니다."],
  ["coco","광대 복장을 한 코코",1909,"오랑주리 미술관",428.35,510,Math.PI/2,346/600,"붉은 광대옷을 입은 소년은 르누아르의 아들 클로드입니다. 반짝이는 옷감과 가만히 선 아이의 표정을 살펴보세요."],
  ["sunlight","햇살 속의 누드","1875–1876","오르세 미술관",451.65,510,-Math.PI/2,453/600,"햇살을 받은 어깨와 그늘진 팔에서 따뜻한 색과 차가운 색이 이웃합니다. 정원과 인물의 경계를 빛이 이어 줍니다."]
].map(([id,title,year,museum,x,y,angle,ratio,description])=>({
  id:"sema-"+id,gallery:"sema",title,credit:`피에르 오귀스트 르누아르 · ${year} · ${museum} 소장`,
  file:"sema-"+id,x,y,angle,ratio,radius:3.75,description,source:exhibition,sourceLabel:"서울시립미술관 전시 기록"
}));
