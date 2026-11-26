# 서울 궁 한바퀴 자료 출처

시작 화면의 `public/seoul-palace-cover-dancheong.jpg`는 경복궁·덕수궁·광화문을 한 장면에 담은 생성 이미지에, 사용자가 제공한 단청 편액을 참고해 제목을 넣은 그림입니다. 게임 상단의 `public/seoul-palace-wordmark.png`는 사용자가 제공한 세 개의 둥근 윤곽을 바탕으로 생성했습니다. 관람 안내의 `public/seoul-palace-plaque.png`는 사용자가 선택한 편액 이미지입니다. [국가유산청 단청 안내](https://www.heritage.go.kr/heri/html/HtmlPage.do?pageNo=2_5_1_1&pg=%2Fcul%2FcultureEasySub01_13.jsp)

## 국가유산청 3D 자료

국가유산청이 공공데이터포털에 공개한 실측 자료를 웹용 GLB로 변환하고 경량화했습니다. 원본과 제공처의 이용 조건은 각 자료 페이지에서 확인할 수 있습니다.

| 파일 | 원본 자료 | 원본 이용 조건 |
| --- | --- | --- |
| `public/seokjojeon.glb` | [덕수궁 석조전](https://www.data.go.kr/data/15104816/fileData.do) | 이용허락범위 제한 없음 |
| `public/junghwamun.glb`, `public/junghwamun-lod.glb` (원거리용 경량 모델) | [덕수궁 중화문](https://www.data.go.kr/data/15104796/fileData.do) | [공공누리 제1유형 출처표시](https://www.kogl.or.kr/info/licenseType1.do) |
| `public/jeonggwanheon.glb` | [덕수궁 정관헌](https://www.data.go.kr/data/15104823/fileData.do) | 이용허락범위 제한 없음 |
| `public/junghwajeon.glb` | [덕수궁 중화전](https://www.data.go.kr/data/15104838/fileData.do) | 이용허락범위 제한 없음 |
| `public/hamnyeongjeon.glb` | [덕수궁 함녕전](https://www.data.go.kr/data/15104840/fileData.do) | 이용허락범위 제한 없음 |
| `public/seogeodang.glb` | [덕수궁 석어당](https://www.data.go.kr/data/15104853/fileData.do) | 이용허락범위 제한 없음 |

경내 길과 구조물은 사용자 제공 지도, [네이버 지도 거리뷰](https://map.naver.com/p?c=17.78,0,0,0,adh&isMini=true&p=yIv6E6e5eIrXaNhAuWpSiA,-89.7,4.57,80,Float)와 [궁능유적본부 관람 배치도](https://royal.khs.go.kr/ROYAL/contents/R701000000.do?schGroupCode=dsg)를 참고해 배치했습니다. 일부 시설의 치수는 지도와 공개 사진을 기준으로 추정했습니다.

## 경복궁 맵

경복궁의 전각과 마당, 관람로는 [궁능유적본부 관람 배치도](https://royal.khs.go.kr/ROYAL/contents/R701000000.do), [경복궁 이야기](https://royal.khs.go.kr/ROYAL/contents/R101020000.do?bdProgramCode=storyCtg3&menuId=03_01_02&pageType=story&schBdcode=gbg), 공개 지도 좌표를 참고해 배치했습니다. 마당과 지붕, 포장과 조경은 [네이버 흥복전 거리뷰](https://map.naver.com/p?c=15.00,0,0,0,adh&p=fo9fXEBDHz2AwLODi19oYg,151,10,80,Float), [태원전 건숙문 거리뷰](https://map.naver.com/p?c=17.00,0,0,0,adh&p=QPAdtv5fwjjHj2Hwj_1w9Q,-137.1,10,80,Float), [함화당·향원지 사이 거리뷰](https://map.naver.com/p?c=17.00,0,0,0,adh&p=5Cl3_VPzbBJzhTmGtLbozQ,-137.1,10,80,Float)를 참고했습니다. 건물과 조경은 직접 제작한 게임용 재현이며, 높이와 세부 치수는 추정했습니다.

경복궁 박물관 쪽 방문객 구역과 광화문광장 대로변의 상점은 게임을 위해 만든 가상의 공간입니다.

## 세종대로 연결 구간

대한문부터 광화문광장까지 보도, 횡단보도, 차로 경계와 건물 위치는 [서울시 세종대로 사람숲길](https://mediahub.seoul.go.kr/archives/2001581), [네이버 거리뷰 코리아나호텔 앞](https://map.naver.com/p?c=15.00,0,0,0,adh&p=_knneAIDkym9Hvd_AsATzw,-61.59,3.52,80,Float)과 [OpenStreetMap 지도](https://www.openstreetmap.org/#map=18/37.56831/126.97707)를 대조했습니다. 시설물의 세부 치수와 외관은 지도와 사진을 바탕으로 추정했습니다. [© OpenStreetMap 기여자](https://www.openstreetmap.org/copyright)

따릉이와 거치대는 [서울시 따릉이 소개 사진](https://love.seoul.go.kr/articles/7373)을 참고해 직접 모델링했습니다. 대여소 위치와 순환버스 노선·시간표는 게임에 맞춰 배치했습니다.

## 광화문광장 맵

시설 배치, 수경 시설, 도로와 보행로의 경계는 [서울시 광화문광장 시설 위치안내](https://gwanghwamun.seoul.go.kr/ghm/facility/list.do?codeId=CODE_08&mid=1011&siteGrpKey=ghm&siteId=ghm), [광장 공간 안내](https://gwanghwamun.seoul.go.kr/ghm/cardNews/ghm/space.do?mid=1039), [네이버 지도 거리뷰](https://map.naver.com/p?searchType=place&c=15.63,0,0,0,adh&isMini=true&p=Svj9PJ8SN08g-rqlkhonjw,-110,10,80,Float), [카카오맵 스카이뷰](https://map.kakao.com/?q=%EA%B4%91%ED%99%94%EB%AC%B8%EA%B4%91%EC%9E%A5), [구글어스](https://earth.google.com/web/search/%EA%B4%91%ED%99%94%EB%AC%B8%EA%B4%91%EC%9E%A5)를 참고해 재현했습니다.

동상 치수와 세부 형태는 서울미래유산의 [세종대왕 동상](https://futureheritage.seoul.go.kr/futureHeritageMeet/futureHeritage/view.do?htNo=393)과 [이순신장군 동상](https://futureheritage.seoul.go.kr/futureHeritageMeet/futureHeritage/view.do?htNo=391)을 참고했습니다. 감사의 정원은 [서울시 개장 안내](https://news.seoul.go.kr/culture/archives/532816), 역과 정류장은 [광화문광장 오시는 길](https://gwanghwamun.seoul.go.kr/ghm/contents/16.do?mid=1009)을 참고했습니다. 3D 구조물과 표면은 게임용으로 제작했으며, 지도에서 판독하기 어려운 치수와 건물 외관 세부는 추정했습니다.

## 돌담길·환구단·북촌 확장 구간

덕수궁 서·북편의 돌담길은 [서울시 돌담길 개방 안내](https://news.seoul.go.kr/safe/archives/500255)와 [네이버 지도 서편 거리뷰](https://map.naver.com/p?c=16.51,0,0,0,adh&p=eUZnZiygCmG06t7evOQ27w,-86.04,10,80,Float)를 참고했습니다. 미국대사관저 쪽 담장과 창살은 공개 보행로에서 보이는 외관을 재현했습니다.

환구단 정문, 황궁우, 석고, 삼문과 호텔 외관은 [국가유산청 환구단 자료](https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1331101570000&pageNo=1_1_2_0), [서울시 환구단 열린 정원](https://mediahub.seoul.go.kr/archives/2015806), [서울시 환구단 삼문 사진](https://mediahub.seoul.go.kr/archives/2004597)과 [네이버 지도 환구단 거리뷰](https://map.naver.com/p/search/%ED%99%98%EA%B5%AC%EB%8B%A8/place/2140928893)를 참고해 게임용으로 제작했습니다. 주변 건물 외관과 높이는 지도와 사진을 바탕으로 추정했습니다.

삼청로·팔판길·북촌의 보행로와 한옥은 [서울시 북촌 도보지도](https://hanok.seoul.go.kr/home/data/bcg/walk/TOUR_1705032369675.pdf), [네이버 지도 팔판길 거리뷰](https://map.naver.com/p/search/%EB%B6%81%EC%B4%8C%ED%95%9C%EC%98%A5%EB%A7%88%EC%9D%84/place/2034123296?c=15.00,0,0,0,adh&p=S0TofIlZkACDKYfYsC1Myw,-43.75,5.5,80,Float)와 [Google Earth 북촌 위성지도](https://earth.google.com/web/@37.582999,126.982281,70a,1000d,35y,0h,35t,0r)를 참고했습니다. 한옥 외관과 상점은 게임용으로 제작했습니다.

동십자각은 [서울시 동십자각 사진](https://mediahub.seoul.go.kr/archives/2005311)을 참고해 제작했습니다. 국가유산청 3D 원본은 이용 신청 후 제공됩니다. [동십자각 3D 자료](https://digital.khs.go.kr/heritage/catalogDetail.do?order=1&index=1&id=13984207334840064481&type=1) · [국가유산청 이용 안내](https://digital.khs.go.kr/service/instructionsForUse2.do)

지하철 출입구 위치는 [OpenStreetMap](https://www.openstreetmap.org/copyright)을 참고해 게임 보도 폭에 맞췄습니다. 역과 출구 사이 이동은 게임 안의 편의 기능입니다.

경복궁 담장과 외곽 길은 [네이버 위성지도와 거리뷰](https://map.naver.com/p/entry/place/11571707), [궁능유적본부 관람지도](https://royal.khs.go.kr/ROYAL/contents/R305000000.do?id=20250224155252790627&page=1&schBdcode=gbg&schGroupCode=gbg&schM=view&viewCount=10), [OpenStreetMap 담장 좌표](https://www.openstreetmap.org/relation/5501517)를 대조했습니다. 건춘문을 비롯한 게임 내 통행 범위는 실제 관람 동선과 차이가 있습니다.

국립현대미술관 서울 건물과 바깥 마당은 [미술관 공식 안내도](https://www.mmca.go.kr/visitingInfo/seoulInfo.do), [열린마당 사진](https://www.mmca.go.kr/artResearch/newsLetterInfo.do?nlId=202302150000886)과 [네이버 지도](https://map.naver.com/p/entry/place/19691123)를 참고했습니다.

덕수궁에서 북촌까지의 주요 경사는 공개 NASA SRTM 30m 표고 자료에서 도로와 지형의 큰 높이 차를 뽑아 평활화했습니다. 건물 기단과 연못, 보도 접속부는 게임에 맞게 보정했습니다. [NASA SRTM](https://www.earthdata.nasa.gov/data/instruments/srtm) · [Mapzen Terrain Tiles 및 제공처](https://registry.opendata.aws/terrain-tiles/) · [자료별 출처](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)

서울광장 잔디와 둘레 보도, 광화문광장 석재 포장, 건춘문 앞 담장과 보행로는 항공 화면과 거리뷰를 대조해 게임용으로 직접 만들었습니다. [서울시 S-Map](https://smap.seoul.go.kr/) · [서울시 서울광장 안내](https://plaza.seoul.go.kr/archives/247) · [광화문광장 네이버 거리뷰](https://map.naver.com/p?searchType=place&c=15.63,0,0,0,adh&isMini=true&p=Svj9PJ8SN08g-rqlkhonjw,-110,10,80,Float)

## 경복궁 전각과 문

국가유산청의 실측 모델을 게임용으로 경량화하고 원본 색상을 변환했습니다. 공공누리 제1유형으로 제공된 원본은 [경회루](https://www.data.go.kr/data/15115251/fileData.do) · [사정전](https://www.data.go.kr/data/15115294/fileData.do) · [강녕전](https://www.data.go.kr/data/15115247/fileData.do) · [태원전](https://www.data.go.kr/data/15115286/fileData.do) · [건춘문](https://www.data.go.kr/data/15115265/fileData.do) · [비현각](https://www.data.go.kr/data/15115249/fileData.do) · [만춘전](https://www.data.go.kr/data/15115248/fileData.do) · [천추전](https://www.data.go.kr/data/15115253/fileData.do) · [함원전](https://www.data.go.kr/data/15115291/fileData.do) · [자선당](https://www.data.go.kr/data/15115295/fileData.do) · [대전내소주방](https://www.data.go.kr/data/15115269/fileData.do)입니다. [사정문](https://www.data.go.kr/data/15092148/fileData.do)은 공공데이터포털에서 이용허락범위 제한 없음으로 제공합니다.

경회루·사정전·사정문의 원거리 모델(`gyeonghoeru-lod.glb`, `sajeongjeon-lod.glb`, `sajeongmun-lod.glb`)도 위의 각 실측 자료에서 원본 정점 색과 표면 방향을 보존해 경량화했습니다.

## 산책과 오락실 효과음

모두 사운드 이펙트(ALL SOUND EFFECT)가 영상 설명에 공개한 다운로드 파일에서 짧은 소리를 골라 길이와 음량을 조정했습니다. [새소리](https://www.youtube.com/watch?v=Ac9VroFOW3U) · [고양이](https://www.youtube.com/watch?v=_F-SpbZvMpM) · [타격음](https://www.youtube.com/watch?v=mMxLoNdvTEs).

## 서울시립미술관 서소문본관

2009년 르누아르전의 기록을 바탕으로 네 작품을 선정했습니다. [서울시립미술관 전시 기록](https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=151&glolangType=KOR)

그림 이미지는 WikiArt의 피에르 오귀스트 르누아르 작품 복제본을 게임에 맞게 축소했습니다. [그네](https://www.wikiart.org/en/pierre-auguste-renoir/the-swing-la-balançoire-1876) · [시골 무도회](https://www.wikiart.org/en/pierre-auguste-renoir/dance-in-the-country-1883-1) · [광대 복장을 한 코코](https://www.wikiart.org/en/pierre-auguste-renoir/the-clown-claude-ranoir-in-clown-costume-1909) · [햇살 속의 누드](https://www.wikiart.org/en/pierre-auguste-renoir/study-torso-sunlight-effect).

## 전시품과 렌더링

`public/art/`의 이미지와 확대 재현한 유물의 원본 URL 및 이용 조건은 [기본 전시 목록](public/museum-catalog.js), [삼국·고려 추가 목록](public/museum-more-early.js), [조선·근대 추가 목록](public/museum-more-late.js)에 있습니다. 이미지들은 게임에서 빠르게 열리도록 크기를 줄여 WebP로 변환했습니다.

렌더링은 CDN으로 [Three.js r180](https://github.com/mrdoob/three.js/tree/r180)을 불러옵니다. [Three.js MIT 라이선스](https://github.com/mrdoob/three.js/blob/r180/LICENSE)

## 포항 영일대

포항역, 해안로와 해수욕장, 영일교와 해상누각의 배치는 공개 지도와 현장 사진을 참고했습니다. 급행·시내 노선과 시간표, 역 안의 매장, 킥보드 대여소, 유람선과 공연은 게임용입니다. [© OpenStreetMap 기여자](https://www.openstreetmap.org/copyright) · [네이버 지도 영일대해수욕장 위성지도·거리뷰](https://map.naver.com/p/entry/place/13491276) · [국가철도공단 포항역](https://www.kr.or.kr/boardCnts/view.do?boardID=1100096&boardSeq=1106956) · [영일대 해상누각 설계·시공 사진](https://www.laeun.co.kr/41/?bmode=view&idx=741448)

### 영일대 상권

아래 점포의 업종과 위치를 참고해 게임용 상호, 간판과 메뉴를 만들었습니다. 위·경도는 WGS84이며 공개 지도에 표시된 영업장 또는 주소의 위치입니다. 게임의 주문 위치는 각 건물에서 도로를 바라보는 면에 배치했습니다.

| 게임 점포 | 참고한 영업장과 도로명주소 | 위도, 경도 | 위치 자료 |
| --- | --- | --- | --- |
| 영일 눈꽃다방 | 설빙 포항영일대점 · 포항시 북구 해안로 95, 2층 | 36.0573304, 129.3779542 | [매장 주소·층](https://www.diningcode.com/profile.php?rid=ohVf8BoZJ5TU) · [지도 핀](https://www.openstreetmap.org/node/13068221701) · [건물 윤곽](https://www.openstreetmap.org/way/872330358) |
| 파도 라운지 | XTC PUB · 포항시 북구 해안로 123, 2층 | 36.0596764, 129.3792181 | [매장 주소·층](https://www.diningcode.com/profile.php?rid=Lk6toLBcY8dq) · [도로명주소 좌표](https://findby.co.kr/details/37708-471133304045-st-652c0ffdf27008be2c61142f) · [건물 윤곽](https://www.openstreetmap.org/way/872330390) |
| 두호 그릴펍 | Tilt Bar N Grill · 포항시 북구 삼호로 243, 1층 | 36.0599322, 129.3785183 | [매장 주소·층](https://opengo.kr/5601fb3f0e887edf2ce33799) · [지도 핀](https://www.openstreetmap.org/node/2699055767) · [건물 윤곽](https://www.openstreetmap.org/way/874079368) · [삼호로 구간](https://www.openstreetmap.org/way/1305750384) |

영일대 오션뷰 카페는 해안로 191-1 오브레멘, 바다야장은 해안로 107 미남 대게 회 새우의 지도 위치를 기준으로 배치했습니다. 상호와 좌석, 야외 영업 공간, 메뉴는 게임에 맞게 구성했습니다. [한국관광공사 오브레멘](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=5c41872b-747e-4f80-9c83-d74ab662b296) · [네이버 미남 대게 회 새우](https://m.booking.naver.com/booking/6/bizes/642298)

## 경주

경주역과 황리단길에서 첨성대까지의 도로 중심선, 건물 윤곽, 봉분, 대릉원 담장, 산책로, 연못과 녹지는 OpenStreetMap의 공개 좌표를 경주 시내 기준의 미터 좌표로 변환했습니다. 변환한 지도 데이터는 ODbL 1.0으로 제공합니다. [© OpenStreetMap 기여자](https://www.openstreetmap.org/copyright) · [변환 지도 데이터](public/gyeongju-geography.js) · [황리단길 포석로](https://www.openstreetmap.org/way/1000945164) · [대릉원 경계](https://www.openstreetmap.org/way/42435919) · [첨성대](https://www.openstreetmap.org/way/382132601)

카카오맵에서 황리단길의 태종로 입구와 포석로 상점가, 팔우정 방면 정류장 01313을 확인했습니다. 네이버 지도에서 대릉원돌담길을 따라 휘는 계림로, 대릉원 안 산책로와 봉분 사진을 대조했습니다. Google 지도에서 첨성로 남쪽의 첨성대와 관람길, 건천읍 신경주역로 80의 현 KTX 경주역을 확인했습니다. [카카오맵 황리단길](https://map.kakao.com/?q=경주%20황리단길) · [네이버 지도 경주대릉원](https://map.naver.com/p/entry/place/13491270) · [Google 지도 첨성대](https://www.google.com/maps/search/?api=1&query=경주%20첨성대) · [Google 지도 경주역](https://www.google.com/maps/search/?api=1&query=경주역%20KTX)

경주역 광장 정류장과 천마총후문·황리단길의 시내행 및 경주역행 정류장은 개별 지도 핀을 사용했습니다. 두 지역 사이는 게임 안에서 버스로 즉시 이동합니다. 횡단보도 폭, 광장의 보행 동선과 목련 촬영 위치는 게임에 맞춰 조정했습니다. [경주시 황리단길 관광지도](https://www.gyeongju.go.kr/hwangridan/images/gj_map_kor.pdf) · [경주역 승차 지점](https://www.openstreetmap.org/node/5909942985) · [관광지 하차 지점](https://www.openstreetmap.org/node/12203446586) · [경주역 방면 승차 지점](https://www.openstreetmap.org/node/4401101890)

황남 한옥카페는 포석로1095번길의 실제 카페 자리에 게임용 상호, 실내 구조와 좌석을 구성했습니다. [카페 지도 핀](https://www.openstreetmap.org/node/10857201306) · [건물 윤곽](https://www.openstreetmap.org/way/1480372663)

첨성대 남쪽에서 계림 안쪽 갈림길과 교촌안길을 거쳐 월정교를 건너는 동선은 경주시 코스와 공개 지도에서 확인했습니다. 카카오맵에서 계림과 내물왕릉 사이 숲길, 네이버 지도에서 첨성대·계림과 월성 해자의 갈림길, 구글 지도에서 교촌안길·일정로와 두 문루 사이의 회랑을 대조했습니다. [경주시 왕경지구 코스](https://www.gyeongju.go.kr/tour/page.do?mnu_uid=4896) · [카카오맵 경주계림](https://map.kakao.com/?q=경주계림) · [네이버 지도 월정교](https://map.naver.com/p/search/경주%20월정교) · [Google 지도 월정교](https://www.google.com/maps/search/?api=1&query=경주%20월정교)

계림 숲의 경계와 산책로, 남천 양안, 월정교의 보행축 및 문루의 위치는 OpenStreetMap을 기준으로 배치했습니다. 다리 통행 폭과 경사도는 게임 속 보행에 맞췄습니다. [© OpenStreetMap contributors, ODbL](https://www.openstreetmap.org/copyright) · [계림](https://www.openstreetmap.org/way/382133881) · [남천 수면](https://www.openstreetmap.org/relation/18648119) · [월정교 보행로](https://www.openstreetmap.org/way/539995254) · [북쪽 문루](https://www.openstreetmap.org/way/712570839) · [남쪽 문루](https://www.openstreetmap.org/way/712570833) · [게임용 지리 데이터](public/gyeongju-southern-geography.js)

게임 안에서 읽는 계림 설화와 월정교 복원 이야기는 경주시 문화관광 자료를, 첨성대의 석축과 중간 창에 관한 설명은 국가유산청 안내를 참고했습니다. [경주시 신라 왕경 유적 안내](https://www.gyeongju.go.kr/tour/page.do?mnu_uid=4724) · [국가유산청 경주 첨성대](https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700310000&ccgbGbtype=IND&ccgbGbtypeNo=2&pageNo=1_5_0_0)

대릉원 황남대총의 남북 쌍분, 천마총 입구와 미추왕릉 상석은 경주시 안내 사진과 지도를 바탕으로 구현했습니다. 천마총 내부 전시 공간과 금관 모형은 게임용으로 구성했습니다. [경주시 대릉원 안내도](https://gyeongju.go.kr/design/tour2019/file/tourMap/01/tourMap1_front.pdf) · [국립문화유산연구원 검총](https://portal.nrich.go.kr/kor/archeologyUsrView.do?idx=2708&menuIdx=567)

황리단길과 교촌의 가게, 황남 순환버스, 타실라 거치대는 경주의 음식 문화와 교통을 담아 게임용으로 배치했습니다. [경주시 황리단길 안내도](https://www.gyeongju.go.kr/hwangridan/images/gj_map_kor.pdf) · [경주시 교촌마을 안내도](https://www.gyeongju.go.kr/design/tour2019/file/tourMap/tourMap2_250821.pdf) · [타실라 대여 안내](https://tasilla.gyeongju.go.kr/Guide/rental.do)
