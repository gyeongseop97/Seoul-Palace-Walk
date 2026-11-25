const townMap="https://www.gyeongju.go.kr/hwangridan/images/gj_map_kor.pdf";
const historicDistrict="https://www.gyeongju.go.kr/tour/page.do?mnu_uid=4727";
const nightWalk="https://www.gyeongju.go.kr/tour/page.do?mnu_uid=4724";
const villageMap="https://www.gyeongju.go.kr/design/tour2019/file/tourMap/tourMap2_250821.pdf";
const observatory="https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700310000&ccgbGbtype=IND&ccgbGbtypeNo=2&pageNo=1_5_0_0";
const train="https://www.gyeongju.go.kr/webzine/GJstory/vol152/html/sub3-1.html";

const guide=(description,directions,source,sourceLabel="경주시 문화관광")=>({description,directions,source,sourceLabel});
const tombGuide="https://gyeongju.go.kr/design/tour2019/file/tourMap/01/tourMap1_front.pdf";
export const gyeongjuGuides={
 geomchong:guide("미추왕릉 서쪽의 신라 고분이에요. 황남동 제100호분으로도 불립니다.","산책로에서 남쪽으로 봉분을 바라보세요. 동쪽으로 돌아가면 미추왕릉 참배길과 이어집니다.","https://portal.nrich.go.kr/kor/archeologyUsrView.do?idx=2708&menuIdx=567","국립문화유산연구원"),
 naemul:guide("계림 서쪽에 자리한 신라 내물왕의 능으로 전해지는 봉분입니다.","봉분 남쪽 관람길에서 북쪽을 바라보세요. 동쪽으로 걸으면 계림 숲길로 이어집니다.",villageMap,"경주시 교촌마을 안내도"),
 cheonmaDoor:guide("천마가 그려진 말다래가 발견되어 천마총이라는 이름이 붙었어요.","봉분 남쪽 돌문을 그대로 걸어 들어가세요. 짧은 통로 끝이 전시실입니다.",tombGuide),
 cheonmaGallery:guide("천마총에서 나온 신라 금관은 나뭇가지와 사슴뿔을 닮은 장식으로 알려져 있어요. 게임 전시대에는 금관을 본뜬 모형이 놓여 있습니다.","전시대 둘레를 걸어서 살펴본 뒤, 들어온 통로를 따라 연못 산책길로 돌아가세요.",tombGuide),
 twinTomb:guide("황남대총은 남분과 북분이 이어진 신라의 큰 쌍무덤이에요. 연못 너머로 보면 두 봉우리 사이에 낮아지는 능선이 보입니다.","연못 서쪽 산책길에서 물 건너 동쪽을 바라보세요. 연못 남쪽을 돌아가면 목련 포토존이 나와요.",tombGuide),
 michu:guide("신라 제13대 왕인 미추왕의 능으로 전해지는 곳이에요. 둥근 봉분 앞에는 제물을 올리던 돌상인 상석이 놓여 있어요.","남쪽 참배길을 따라 돌상 앞까지 걸어가세요. 정문으로 가려면 돌아서 남동쪽 산책로로 나오세요.",tombGuide),
 stationExit:guide("건천읍에 자리한 경주의 철도 관문입니다.","역 출입구에서 열차를 타면 서울역이나 포항역을 선택할 수 있어요. 황리단길로 가려면 광장 건너 정류장으로 가세요.",train,"경주시 철도 안내"),
 stationBus:guide("경주역 광장에서 시내로 출발하는 버스 정류장입니다.","승차 지점에서 황리단길행 버스를 타면 대릉원 후문 근처에 바로 도착해요.",townMap,"경주시 관광 안내도"),
 townBus:guide("대릉원 북쪽, 태종로의 천마총후문·황리단길 하차 지점입니다.","돌담을 따라 서쪽 큰길로 가면 황리단길 입구예요. 경주역행은 별도로 표시된 정류장에서 타세요.",townMap,"경주시 관광 안내도"),
 townReturnBus:guide("황리단길에서 경주역으로 돌아가는 승차 지점입니다.","하차했던 정류장의 북동쪽에 있어요. 지도에 표시된 횡단보도를 건너 경주역행 버스를 타세요.",townMap,"경주시 관광 안내도"),
 hwangnidan:guide("대릉원 돌담 서쪽의 포석로를 따라 낮은 한옥과 가게들이 이어지는 거리입니다.","북쪽 사거리에서 포석로를 따라 남쪽으로 걸으세요. 상점 쪽 골목에서는 한옥 카페를 찾을 수 있어요.",historicDistrict),
 cafe:guide("황리단길 골목에서 커피를 주문하고 쉬어 갈 수 있는 게임 속 한옥 카페예요.","간판 아래 열린 문으로 들어가 카운터에서 주문하거나 탁자 앞에서 빈 의자에 앉으세요.",townMap,"황리단길 안내도"),
 northGate:guide("황리단길과 가까운 대릉원 후문입니다. 돌담 안에는 신라 시대의 큰 무덤들이 모여 있어요.","태종로 쪽 문으로 들어가 봉분 사이 산책길을 따라가면 목련 포토존에 닿아요.",townMap,"경주시 관광 안내도"),
 photo:guide("봉분의 둥근 능선 사이로 목련이 서 있는 대릉원 촬영 지점입니다.","산책로의 표시 지점에서 나무 쪽을 바라보세요. 남동쪽 정문을 나가면 첨성대 방향으로 걸을 수 있어요.",townMap,"경주시 관광 안내도"),
 mainGate:guide("대릉원에서 첨성대와 계림으로 이어지는 정문입니다.","정문 밖에서 동쪽 관람길을 따라 첨성대로 가세요. 반대로 들어가면 봉분 사이 산책로가 이어져요.",townMap,"경주시 관광 안내도"),
 stars:guide("첨성대는 선덕여왕 때 세운 것으로 추정되는 천문 관측 시설입니다. 굽은 몸체는 다듬은 돌을 27단으로 쌓았어요.","밤에는 이곳에서 별을 고를 수 있어요. 남동쪽 산책길은 계림 북쪽 입구로 이어져요.",observatory,"국가유산청 첨성대 해설"),
 observatoryEntrance:guide("첨성대 중간에는 네모난 창이 있고 그 위쪽은 속이 비어 있어요. 이 창으로 들어갔을 것으로 여겨집니다.","게임에서는 남쪽 창 아래에서 ‘들어가기’를 선택하세요. 안에서 ‘나가기’를 누르면 관람길로 돌아옵니다.",observatory,"국가유산청 첨성대 해설"),
 gyerimEntry:guide("첨성대에서 계림으로 들어서는 북쪽 길목입니다. 월성과 대릉원 사이에 오래된 숲이 남아 있어요.","첨성대를 등지고 숲길로 들어가세요. 계림 안쪽을 거쳐 남쪽으로 내려가면 월정교에 닿아요.",villageMap,"경주시 교촌마을 안내도"),
 gyerim:guide("나뭇가지에 금궤가 걸려 있고 그 아래에서 흰 닭이 울었다고 해요. 궤 속의 아이가 경주 김씨의 시조 김알지였다는 설화가 전해집니다.","나무 사이 흙길을 따라 남쪽으로 걸으세요. 숲을 벗어나 남천 북쪽 둑에 닿으면 월정교 북문으로 이어져요.",nightWalk),
 woljeongNorth:guide("교촌마을 쪽에서 남천을 건너는 월정교 북문입니다. 신라 경덕왕 때 이곳에 다리를 놓았다는 기록이 남아 있어요.","북쪽 광장에서 문루 아래 통로로 들어가세요. 기둥 사이로 남쪽 문루까지 걸어갈 수 있어요.",nightWalk),
 woljeong:guide("월정교는 남천 위에 지붕을 얹은 목조 다리입니다. 발굴과 복원을 거쳐 2018년에 양쪽 문루까지 완성했습니다.","가운데서 난간 너머로 강물을 바라보세요. 북쪽은 계림과 교촌마을 쪽, 남쪽은 강 건너 광장이에요.",nightWalk),
 woljeongSouth:guide("남천 남쪽에서 월정교의 문루와 지붕이 이어지는 모습을 볼 수 있는 입구입니다.","북쪽을 보고 문루 아래로 들어가 다리를 건너세요. 북안에서 계림 숲길을 따라 첨성대로 돌아갈 수 있어요.",villageMap,"경주시 교촌마을 안내도")
};
