# 서울 궁 한바퀴 · Seoul Palace Walk

덕수궁과 정동, 광화문광장, 경복궁을 친구와 함께 걷는 3D 게임입니다. 첫 화면에서 닉네임과 캐릭터를 고른 뒤 **오픈서버**, **방 만들기**, **초대코드 입력** 중에서 선택할 수 있습니다. 돌담 편의점에서 츄르를 사면 근처 고양이가 다가옵니다. **간식 주기** 한 번에 약 5초 동안 먹고, 츄르 한 개로 세 번 줄 수 있습니다.

Vercel이 게임 화면과 방 API를 제공하고, Turso의 **libSQL** 데이터베이스가 초대코드, 참가자 상태, 좌석과 손잡기 상태를 저장합니다. 공식 GitHub Pages 주소는 운영 Vercel의 방 API에 연결되므로 두 주소에서 같은 초대코드를 쓸 수 있습니다.

기존 Vercel 프로젝트를 업데이트하려면 이 폴더의 파일을 연결된 GitHub 저장소에 반영하고 운영 브랜치의 새 배포가 완료되면 테스트하세요. 오픈서버는 첫 입장 시 자동으로 준비되므로 기존 Turso 데이터베이스에 추가로 실행할 초기화 명령은 없습니다.

## 1. GitHub에 올리기

1. ZIP을 풀고 `package.json`과 `vercel.json`이 있는 폴더를 엽니다.
2. GitHub에서 새 저장소를 만들고 빈 저장소의 **Quick setup → uploading an existing file**을 누릅니다. 파일이 이미 있는 저장소에서는 **Add file → Upload files**를 사용합니다.
3. 압축을 푼 폴더 **안의 파일과 폴더**를 업로드하고 **Commit changes**를 누릅니다. `package.json`, `package-lock.json`, `vercel.json`, `room.mjs`, `api/`, `public/`, `database/`, `server/`, `scripts/`가 저장소의 첫 화면에 있어야 합니다. `.gitignore`와 `.env.example`도 함께 올립니다.

토큰을 입력하는 `.env.local`은 내 컴퓨터에만 둡니다. 웹 업로드는 `.gitignore`를 적용하지 않으므로 업로드 목록을 확인해 주세요. [GitHub 파일 업로드 안내](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

## 2. Turso 데이터베이스 연결

1. [Turso 대시보드](https://app.turso.tech/)에서 프로젝트 전용 데이터베이스를 만듭니다. 엔진을 선택하는 화면에서는 **libSQL**을 고릅니다.
2. 데이터베이스의 연결 화면에서 주소를 복사하고, 이 데이터베이스에 쓰기 권한이 있는 데이터베이스 토큰을 발급합니다. Turso CLI를 이미 사용한다면 `turso db create deoksugung-hanbakwi`, `turso db show --url deoksugung-hanbakwi`, `turso db tokens create deoksugung-hanbakwi`로 같은 작업을 할 수 있습니다. [Turso 시작 안내](https://docs.turso.tech/quickstart), [libSQL 연결 안내](https://docs.turso.tech/sdk/ts/quickstart#remote-libsql-database-libsql-client)
3. Node.js 22.13 이상이 설치된 컴퓨터에서 압축을 푼 폴더를 터미널로 열고, Windows PowerShell에서 아래 명령을 실행합니다.

   ```powershell
   Copy-Item .env.example .env.local
   notepad .env.local
   ```

4. 메모장의 `TURSO_DATABASE_URL`과 `TURSO_AUTH_TOKEN`에 2단계의 값을 붙여 넣고 저장합니다.

   | 이름 | 넣을 값 |
   | --- | --- |
   | `TURSO_DATABASE_URL` | Turso에 표시된 `libsql://`로 시작하는 주소 |
   | `TURSO_AUTH_TOKEN` | 해당 데이터베이스에 쓰기 가능한 토큰 |

5. 같은 폴더에서 실행합니다. `서울 궁 한바퀴 데이터베이스가 준비됐습니다.`가 표시되면 방을 만들 준비가 된 상태입니다. 초기화는 필요한 테이블을 생성하며, 다시 실행해도 기존 행을 지우지 않습니다.

   ```powershell
   npm ci
   npm run db:init
   ```

## 3. Vercel에 배포하기

1. [Vercel](https://vercel.com/)에서 **Add New → Project**를 눌러 위 GitHub 저장소를 **Import**합니다.
2. **Root Directory**는 `package.json`이 있는 폴더를 선택합니다. 제공된 `vercel.json`이 **Other**, 빈 **Build Command**, 출력 폴더 `public`을 지정합니다. **Install Command**는 기본값으로 둡니다. [Vercel 빌드 설정](https://vercel.com/docs/builds/configure-a-build)
3. **Environment Variables**에 위의 두 이름과 값을 넣습니다. 먼저 운영 배포에 연결하려면 **Production**에 적용합니다. 변수는 프로젝트의 서버 설정에 넣습니다.
4. **Deploy**를 누릅니다. 배포 이후에 변수를 등록하거나 바꿨다면 **Deployments → Redeploy**를 실행합니다. [Vercel GitHub 연결](https://vercel.com/docs/git/vercel-for-github), [Vercel 환경 변수](https://vercel.com/docs/environment-variables)
5. Vercel이 준 운영 주소를 두 브라우저나 휴대폰 두 대에서 엽니다. 둘 다 **오픈서버**를 선택해 서로 보이는지 확인합니다. 친구끼리만 산책하려면 한쪽에서 **방 만들기**, 다른 쪽에서 **초대코드 입력**을 선택합니다.

## 4. GitHub Pages 주소도 사용하기

1. `gyeongseop97/Seoul-Palace-Walk` 저장소의 **Settings → Pages**에서 **Deploy from a branch**, `main`, `/(root)`를 사용합니다. `main`에 변경을 반영하면 GitHub가 정적 게임 화면을 다시 게시합니다. [GitHub Pages 게시 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
2. [GitHub Pages 게임 주소](https://gyeongseop97.github.io/Seoul-Palace-Walk/)를 열면 같은 사이트의 `public/`으로 이동합니다. 여기서 만든 초대코드로 [Vercel 운영 주소](https://deoksu-walk.vercel.app/)에서도 입장할 수 있습니다. 두 주소가 Vercel의 같은 방 API와 Turso를 사용하며, 환경 변수는 Vercel에서 관리합니다.

## 컴퓨터에서 먼저 실행

프로젝트 폴더에서 `npm ci` 후 `npm start`를 실행하고 브라우저에서 `http://127.0.0.1:4178`을 엽니다. 이 미리보기는 실행 중인 컴퓨터의 메모리에 방을 저장하므로 Turso 계정 없이 작동하며, 종료하면 테스트 방은 사라집니다. 3D를 보려면 WebGL과 Three.js를 불러올 인터넷 연결이 필요합니다.

## 연결 문제

| 상황 | 확인할 것 |
| --- | --- |
| `TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN을 설정해 주세요` | Vercel에 두 변수를 추가하고 해당 환경에 다시 배포합니다. |
| 화면은 열리는데 방 만들기가 실패함 | `npm run db:init`이 성공했는지 확인합니다. Vercel과 `.env.local`에 같은 DB 주소를 쓰고, 토큰에 쓰기 권한이 있는지 확인합니다. |
| 친구가 주소에 접속하지 못함 | Vercel의 **운영 주소**를 보냈는지 확인하고, 접속에 Vercel 로그인을 요구한다면 프로젝트의 **Deployment Protection** 설정을 확인합니다. |
| 친구가 방을 찾을 수 없음 | 같은 사이트 주소에서 만든 8자리 코드인지 확인하고 새 방을 만들어 다시 초대합니다. |

`/api/rooms`는 방 만들기와 입장, `/api/room`은 위치와 상호작용 동기화를 담당합니다. 접속 중에는 상태를 짧은 간격으로 주고받아 접속 시간과 인원에 따라 Vercel 함수와 Turso 사용량이 늘어납니다.

게임의 자동 시간은 한국 표준시를 사용합니다. 서울 날씨는 Open-Meteo의 현재 조건을 10분 단위로 조회해 같은 방 참가자에게 공유합니다. 조회가 어려운 시간에는 계절에 맞춘 게임 날씨를 함께 적용합니다. [Open-Meteo 자료](https://open-meteo.com/en/docs), [비상업용 서비스 및 CC BY 4.0 이용 조건](https://open-meteo.com/en/terms)

동기화 지연을 줄이려면 Vercel의 **Settings → Functions → Function Regions**에서 Turso 데이터베이스와 가까운 지역을 선택한 뒤 다시 배포합니다. [Vercel 함수 지역 설정](https://vercel.com/docs/functions/configuring-functions/region)

## 덕수궁에서 경복궁까지 걷기

덕수궁 대한문에서 세종대로 서쪽 인도를 따라 북쪽으로 걷습니다. 세종대로 사거리에서 광화문광장으로 건너고, 육조마당 북쪽에서 사직로 횡단보도와 광화문 월대를 지나 경복궁으로 들어갑니다. 산책 지도의 **전체 지도**에서 연결 경로를 보거나 장소 이름을 눌러 걸어갈 수 있습니다. 경복궁은 광화문부터 신무문까지 약 500m × 880m 규모입니다.

지도는 현재 구역의 지도를 먼저 보여줍니다. **전체 지도**를 누르면 세 구역의 연결 경로를 볼 수 있습니다. 휴대폰에서는 손가락 두 개로 확대·축소하고, 한 손가락으로 지도를 옮깁니다.

따릉이는 지도에 초록색 점으로 표시된 지정 대여소 11곳에서 빌리고 반납합니다. 한 사람당 한 대를 빌릴 수 있습니다. **따릉이에서 내리기**로 세워 둔 뒤 가까이에서 **따릉이 다시 타기**를 누를 수 있습니다. 세워둔 따릉이는 주차 후 10분이 지나거나 게임을 나가면 회수됩니다.

세종대로·북촌 순환버스 10대가 약 1분 간격으로 운행하고 각 정류장에 10초 정차합니다. 정류장 가까이에서 도착과 출발까지 남은 시간을 볼 수 있습니다. 정차 중 8석 중 빈 좌석을 골라 타거나 **버스 내리기**를 누를 수 있습니다. 1인칭으로 창밖을 보고 3인칭으로 버스 전체를 볼 수 있습니다. 시청역·광화문역·경복궁역·을지로입구역·안국역 출구를 이용해도 같은 산책방이 유지됩니다.

덕수궁에서 출발하면 서울광장과 광화문광장, 경복궁을 거쳐 약 4분 11초 뒤 삼청로·북촌 정류장에, 약 5분 19초 뒤 북쪽의 삼청동 돌계단길 정류장에 도착합니다. 경복궁 정류장에서 삼청동 돌계단길까지는 약 2분 36초입니다. 북쪽 종점에서 출발한 버스는 삼청로 끝에서 방향을 돌려 광화문광장과 덕수궁으로 향합니다.

경복궁 전각은 직접 모델링한 것입니다. 국가유산청 실측 모델을 넣으려면 웹용 GLB로 변환한 파일을 `public/<건물 id>.glb` 이름으로 두고([건물 id 목록](public/gyeongbok-layout.js)), [`public/gyeongbok.js`](public/gyeongbok.js)의 `gbSurveyModels` 목록에 그 id를 추가하세요. 파일이 열리면 해당 전각만 실측 모델로 바뀝니다. 예: `geunjeongjeon.glb`, `gyeonghoeru.glb`, `gwanghwamun.glb`.

경복궁에서는 화면 제목과 순간이동 버튼(경복궁역·근정전·향원정)이 경복궁용으로 바뀝니다. 광화문 월대와 해태상, 수문장과 순라 행렬, 한복 차림 관람객이 있고, 근정전 마당 **포토존**에서 **사진 찍기**를 누르면 근정전을 배경으로 한 기념사진이 저장됩니다. 경회루 옆에는 스파클 좌판이 있고 향원정 연못가에서는 소원등을 띄울 수 있습니다. 밤에는 청사초롱과 창호 불빛, 전각 조명이 켜집니다.

느린 기기에서는 화질 조절기가 해상도, 그림자, 동물·관람객 수, 그리는 거리 순으로 자동으로 낮추고, 여유가 생기면 다시 올립니다.

경회루와 향원정의 연못은 걸어 들어갈 수 있습니다. 물속에서는 허리까지 잠기고 걸음이 느려집니다. 경회루는 돌기둥 48개 사이로 1층을 지나다닐 수 있고, 양쪽 나무 계단으로 2층 연회 마루에 오릅니다. 근정전·사정전·강녕전·교태전·집옥재 등 경복궁 전각과 덕수궁 중화전·함녕전·덕홍전·석어당·즉조당·준명당은 가운데 문이 열려 있어 안으로 들어갈 수 있으며, 어좌와 일월오봉도, 병풍과 보료, 서가, 샹들리에 등 쓰임새에 맞춘 실내가 꾸며져 있습니다(실내는 사진 자료를 참고한 재현이며 실측은 아닙니다).

시청역 2번·3번 출구와 **시청앞·덕수궁 정류장**은 대한문 북쪽, 궁 동쪽 담장 밖 대로변 인도에 있습니다. 동십자각 쪽 **경복궁 정류장**에서 내리면 횡단보도와 **의정부지 역사유적광장**(협선당·정본당·석획당 터, 내행랑 터, 우물, 연지와 정자 터)을 지나 광화문 앞 횡단보도와 월대로 들어갑니다. 광화문에서는 10분마다 2분 30초 동안 수문장 교대식이 열립니다.

소리는 파일 없이 브라우저에서 합성합니다(발소리, 물소리, 새와 풀벌레, 고양이, 안내음, 교대식 북). 화면 위 **소리** 버튼으로 끌 수 있습니다. 기단·월대·전각 실내처럼 한 단 올라선 곳도 화면을 눌러 이동할 수 있고, 2층 마루 위에서는 누른 곳으로 곧장 걸어갑니다.

## 광화문광장 맵

광화문역 7번 출구부터 명량분수, 두 동상, 해치마당, 사계정원, 감사의 정원, 육조마당을 지나 광화문 월대까지 약 600m를 걸을 수 있습니다.

명량분수 서쪽 관람 공간에서 **분수쇼 시작**을 누르면 같은 방의 관람객이 32초 동안 물줄기와 조명이 음악에 맞춰 바뀌는 공연을 함께 볼 수 있습니다. 음악은 분수 주변에서 들리고 **소리** 설정을 따릅니다.

세종대로는 `public/sejong-corridor-layout.js`, 광화문광장은 `public/plaza-layout.js`, 경복궁은 `public/gyeongbok-layout.js`에 배치되어 있습니다. 세 구역은 덕수궁에서 사용하던 위도·경도 기준점으로부터 미터 단위로 위치를 계산합니다. 보행 경로는 도로 경계와 횡단보도에 맞춰 연결되어 있습니다.

## 화면 품질과 성능

기기 성능에 맞춰 해상도와 그림자가 자동으로 조절됩니다. 프레임이 떨어지면 해상도를 먼저 낮추고, 여유가 생기면 다시 올립니다. 항상 최고 품질로 보려면 주소 끝에 `?quality=max`를 붙여 주세요.

광화문광장·경복궁은 다가갈 때 3D 장면을 여러 프레임에 나눠 준비합니다. 멀어진 구역은 화면 렌더링에서 빼고 돌아오면 다시 사용합니다. 전체 지도와 길찾기는 처음부터 사용할 수 있습니다. 경복궁의 충돌 배치를 바꾼 뒤에는 게임과 같은 버전의 Three.js 모듈 경로를 넣어 `node scripts/bake-gyeongbok-obstacles.mjs <Three.js 모듈 경로>`로 경로 데이터를 갱신합니다.

`vercel.json`은 함수 실행 지역을 서울(`icn1`)로 지정합니다. Turso 데이터베이스도 도쿄 등 가까운 지역에 두면 위치 동기화 지연이 가장 작습니다.

## 자료 출처

국가유산청 모델과 전시 자료의 이용 조건은 [자료 출처](ASSET-CREDITS.md)에 정리했습니다. 개별 작품의 원본 링크는 게임의 **작품 설명**에서도 볼 수 있습니다.
