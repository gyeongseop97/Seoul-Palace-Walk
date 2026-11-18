import {
  route,palacePaths,palaceCourts,palaceGardens,palacePond,palaceWalls,fountain,ticket,ticketApproach,ticketGuide,gate,bridge,court,spawn,
  middle,hall,stoneHall,stoneFountain,city,pavilions,estateOutline,nearest,distance as near,walkable,solidAt,clearSegment,loftStep,loftHeight,loftStair,planWalk,platformAt
} from "./layout.js";
import {normalize,angleDelta,hexCoat,moving,receivePeople,smoothPeople,handPosition,handSide,pairFits} from "./people.js";
import {ITEMS,PET_MS,FEED_MS,diningTray,jumpDuration,jumpLift} from "./activities.js";
import {makeWishDrawing} from "./wish-drawing.js";
import {WISH_FLIGHT_MS} from "./wish-art.js";
import {isInsideMuseum,museumBounds,museumGalleries,museumGalleryAt,museumHall,museumInteriorOffsetY} from "./visit-layout.js";
import {museumArtUrl,museumExhibits} from "./museum-catalog.js";
import {nearbyPalaceGuide} from "./palace-guide.js";
import {bindSceneTouch} from "./scene-touch.js";
import {bindNearbyControls} from "./nearby-controls.js";
import {bindMapGestures} from "./map-gestures.js";
import {bindMapLabels} from "./map-labels.js";
import {makeSound} from "./sound.js";
import {ceremonyAt} from "./palace-people.js";
import {cityHallStation,gbSites,gbBounds,gbLake,gbPond,gbPaths,gbCourts,gbLawns,gbShortcuts,wishPond,inGyeongbok,gbWoldae,onWoldaeApproach,nearWoldaeRailing,at as palaceAt,gyeongbokWater} from "./gyeongbok-layout.js";
import {inGwanghwamunPlaza,plazaAt,plazaBounds,plazaSites,plazaOutline,plazaPaths,plazaShortcuts,plazaBeds,plazaAvenueOutline,plazaEastSidewalks,plazaSideForecourts,plazaUijeongbuApproach,plazaSideJunction,plazaCrossingLandings,eastCurb,plazaEastWalkSpine,eastRoadWidth,sajikRoad,sejongParkOutline} from "./plaza-layout.js";
import {corridorBounds,corridorLandmarks,corridorSidewalks,corridorBranches,corridorCrossings,corridorWalkSpine,corridorEastWalkSpine,corridorMainRoad,corridorAvenueJoin,inSejongCorridor,seoulPlazaApproach} from "./sejong-corridor-layout.js";
import {plazaWestPavement} from "./gwanghwamun-plaza.js";
import {streetSegmentParts} from "./crosswalk-markings.js";
import {crosswalkPaintBands} from "./bukchon-surfaces.js";
import {transitRoutes,transitStops} from "./transit-routes.js";
import {subwayAccessPaths} from "./subway-expansion.js";
import {jeongdongExtensionLandmarks,jeongdongExtensionPaths,jeongdongParkCourt,extensionRibbon} from "./jeongdong-extension-layout.js";
import {worldExtent} from "./world-extent.js";
import {westSurfaces,westBuildings,westSites,westRegion,westWalkable} from "./west-district-layout.js";

import {bukchonAlleyShortcut,bukchonBounds,bukchonPaths,bukchonLandmarks,bukchonWalkable,bukchonLawns} from "./bukchon-layout.js";
import {hwangudanBounds,hwangudanGround,hwangudanPaths,hwangudanLandmarks,hwangudanBuildings,hwangudanWalkable,
  seoulPlazaOutline,seoulPlazaLawn} from "./seoul-hwangudan-layout.js";
import {cheonggyeBounds,cheonggyeDeckExits,cheonggyeDeckStep,cheonggyeLandmarks,cheonggyeLevel,cheonggyeRoadLeads,cheonggyeStations,cheonggyeSurfaces,cheonggyeWalkable,inCheonggye,riverAt,bankAt,streamTerraces,terraceWidth,springBed,cheonggyeCascade} from "./cheonggye-layout.js";
import {FOOT_BATH_PERIOD,footKickAge} from "./walker-model.js";
import {inSonghyeon,songhyeonBounds,songhyeonOutline,songhyeonPaths,songhyeonLawns,songhyeonLandmarks} from "./songhyeon-layout.js";
import {uijeongbuOutline,uijeongbuEntry,uijeongbuGarden,uijeongbuWalks,uijeongbuConnections,uijeongbuSideRoad,uijeongbuBusPavement,uijeongbuRemains,sajikEastRoad,uijeongbuPavedConnections,uijeongbuCrossings,gardenSidewalk,gardenVerge} from "./uijeongbu-layout.js";
import {BUS_COUNT,BUS_SEATS,bukchonBusRoads,busAt,busSeatPose,busStopById,busStops,busStopTimes,nearBus,setBusYields} from "./sejong-bus.js";
import {approachingTraffic,clearingLane,sidewalkRefuge} from "./crossing-traffic.js";
import {bikeDocks,bikeMountReach,bikeParkDuration,bikePassengerBoardSpeed,bikePassengerOffset,bikePassengerPose,
  isBikeDriver,isBikePassenger,isCycling,nearBikeDock} from "./sejong-bike.js";
import {canRideBikeSegment} from "./bike-movement.js";
import {gbWallOutline,clipGbGround} from "./gyeongbok-perimeter.js";
import {outsideGroundOffset} from "./gyeongbok-terrain.js";
import {mmcaCourtyards,mmcaBuildings,mmcaLawns} from "./mmca-layout.js";
import {semaVenue,semaExhibits} from "./sema-layout.js";
import {mmcaVenue,mmcaGalleryAt,mmcaGalleryRooms,mmcaExhibits} from "./mmca-gallery-layout.js";
import {diningTables} from "./dining-layout.js";
import {diningVenues} from "./dining-data.js";
import {interiorAt,interiorBounds} from "./interior-layout.js";
import {bindDiningMenu} from "./dining-menu.js";
import {bindGuestbook} from "./guestbook.js";
import {plazaShowSpot,PLAZA_SHOW_REACH,PLAZA_SHOW_HEARING_METRES} from "./plaza-show.js";
import {createMotionStream,currentArcade} from "./motion-stream.js";
import {canKiss,isKiss,canClink,clinkItemSlot,CLINK_REACH,CLINK_LEAD_MS} from "./social-events.js";
import {gameApiUrl,isGitHubPages} from "./hosting.js";
import {resolveSeoulEnvironment} from "./seoul-environment.js";
import {HEADWEAR,KEEPSAKES} from "./wearable-options.js";
import {LOOK_DEFAULTS,LOOK_OPTIONS} from "./look-options.js";
import {hanbokRental,passportStamps} from "./passport-data.js";
import {bindPassport} from "./passport.js";
import {makeMinigames} from "./minigames-client.js";
import {MINIGAME_PICKUP_REACH,minigamePickup,traditionalGames} from "./traditional-games.js";
import {buskingSpot,buskingBeat,BUSKING_HEARING_METRES} from "./street-people.js";
import {bindPhotoMode,PHOTO_REACH} from "./photo-mode.js";
import {bindPhotoAlbum,downloadPhoto,importPhotos,listPhotos,makePhotoCard} from "./photo-album.js";
import {bindTutorial} from "./tutorial.js";
import {makePicnic} from "./picnic-client.js";
import {isPicnicItem} from "./picnic-data.js";
import {BUNGEO_CUSTARD_ITEM,BUNGEO_GIFT_REACH,BUNGEO_ITEMS,BUNGEO_MOLD_COUNT,BUNGEO_STOCK_CAPACITY,
  COOKING_STALLS,HOTTEOK_ITEMS,bungeoStep,cookingStallById,nearbyCookingStall} from "./bungeo-data.js";
import {ARCADE_BOWLING,ARCADE_GAMES,ARCADE_MOLE,ARCADE_PUMP,ARCADE_SITE,ARCADE_STAIRS,ARCADE_THIRD_SITE,ARCADE_UPPER_SITE,
  arcadeFloorAt,arcadeStairToward,hockeyFarEnd} from "./arcade-layout.js";
import {BOWLING_OFFSET_LIMIT} from "./arcade-bowling.js";
import {moleView} from "./arcade-mole.js";
import {BASEBALL_BATTER_OFFSET,baseballBatterSide} from "./arcade-baseball.js";
import {arcadeTitles,bindArcade} from "./arcade-client.js";
import {isClassic} from "./arcade-classics.js";
import {arcadeSnapshot,visibleArcade} from "./arcade-presence.js";
import {ITEM_SLOTS,handLabel,itemAnimating,freeItemSlot,handsFree} from "./held-items.js";
import {BAG_SIZE,belongings,validPacked} from "./walk-inventory.js";
import {bindWalkBag} from "./walk-bag-client.js";
import {BIKE_FALL_DURATION_MS,GESTURE_DURATIONS,SICK_DURATION_MS,bikeFallChance,finishAlcoholSip} from "./avatar-gestures.js";

const $=id=>document.getElementById(id);
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,"0")).join("");
const entranceHeading=285;
const initialView=()=>({pan:entranceHeading,tilt:0,zoom:0,night:false});
const lookChoices={...LOOK_OPTIONS,headwear:HEADWEAR,keepsake:KEEPSAKES};
const timeChoices=["auto","day","sunset","night"],storedTime=localStorage.getItem("jeongdong-time");
const environment={time:timeChoices.includes(storedTime)?storedTime:"auto",weather:"live",season:"live",liveWeather:null};
const weatherNames={clear:"맑음",cloudy:"흐림",rain:"비",snow:"눈",fog:"안개"};
let currentEnvironment=resolveSeoulEnvironment(environment),umbrellaFolded=false;
const defaultHair=character=>character==="woman"?"long":"short";
function initialAvatar(){
  const character=localStorage.getItem("jeongdong-character")==="woman"?"woman":"man";
  const look={hair:defaultHair(character),eyes:"round",...LOOK_DEFAULTS,outfit:"coat",headwear:"none",keepsake:"none"};
  try{
    const saved=JSON.parse(localStorage.getItem("jeongdong-look"));
    for(const [feature,choices] of Object.entries(lookChoices)){
      if(choices.includes(saved?.[feature]))look[feature]=saved[feature];
    }
  }catch{}
  return {x:ticketApproach.x+1,y:ticketApproach.y-2.4,heading:entranceHeading,vx:0,vy:0,wish:0,wishOrigin:null,wishHeading:0,wishArt:null,wave:0,kick:0,jump:0,vaultBase:null,emote:null,chat:null,
    groundSit:false,kissReady:true,seat:null,seatSide:null,bus:null,bike:null,bikeRide:null,item:null,secondItem:null,itemUse:null,picnicClaim:null,bungeoReady:true,bungeoClaim:null,umbrella:false,umbrellaReady:false,
    blushUntil:0,blushLevel:0,alcoholGlasses:0,sickAt:0,bikeFallAt:0,gesture:null,pet:null,feed:null,
    running:false,blocked:false,up:false,character,look};
}
const me=initialAvatar(),people=new Map(),markers=new Map(),formations=new Map();
let bagCommand=null,lastBagSave="";
function bagSaveKey(name){return "palace-walk-bag/"+name;}
function readBag(name){
  let data={};
  try{data=JSON.parse(localStorage.getItem(bagSaveKey(name)))??{};}catch{}
  return {...belongings(data),...Object.fromEntries(ITEM_SLOTS.map(s=>[s,validPacked(data[s])?{...data[s],started:0}:null])),bagClaim:null};
}
function saveBag(){
  if(!session||bagCommand)return;
  const data=JSON.stringify({...belongings(me),...Object.fromEntries(ITEM_SLOTS.map(s=>[s,validPacked(me[s])?me[s]:null]))});
  if(data!==lastBagSave)try{localStorage.setItem(bagSaveKey(session.nickname),data);lastBagSave=data;}catch{}
}
function bagLocked(){
  return !!(bagCommand||picnicInventoryBusy()||bungeoInventoryPending()||feedingLocked(gameTime())||
    clinkLocked(gameTime())||queuedDining||ITEM_SLOTS.some(s=>itemAnimating(me[s],gameTime())));
}
function bagRequest(cmd){
  if(arcade.kind==="claw"&&cmd.action!=="prize"){toast("인형뽑기를 마친 뒤 가방을 정리해 주세요.");return;}
  if(!session||bagLocked()&&cmd.action!=="prize"||bagCommand)return;
  bagCommand={...cmd,id:token()};dirty=true;wakeSync();walkBag.render();
}
const walkBag=bindWalkBag({avatar:me,busy:bagLocked,command:bagRequest,
  openGame:()=>{resetInput();closeActionMenus();mobileSettings.open=false;},
  peers:giftPeers});
function giftPeers(){
  return [...people].filter(([,p])=>near(p.position,me.x,me.y)<=3.6&&!!me.up===!!p.avatar.up&&
    !p.avatar.bus&&!isCycling(p.avatar)&&interiorAt(p.position.x,p.position.y)===interiorAt(me.x,me.y))
    .map(([id,p])=>[id,p.nickname]);
}
$("give-held").onclick=()=>walkBag.open(ITEM_SLOTS.find(s=>validPacked(me[s])));
let ownView=initialView(),trackedPersonId=null,world,worldLoading,worldFailed=false;
let firstPerson=localStorage.getItem("jeongdong-first-person")==="true";
let session=null,active=true,joining=false,lastPost=0,lastWishSynced=0,lastArcadePost="",dirty=true;
let pageVersion=0,walkPositionAt=0,lastWalkPosition=null;
const motionStream=createMotionStream(request);
let syncTimer,syncDue=Infinity,syncInFlight=null,syncStarted=-Infinity,syncFailures=0;
let links=[],queuedHand=null,queuedFeed=null,queuedChat=null,toastTimer;
let queuedBus=null,queuedBike=null,lastBusHeading=null,lastBikeHeading=null;
let tandemOffer=null;
let queuedDining=null,diningService=null;
let alcoholSip=null,bikeFallHintSeen=false;
let fountainShow=null,clinks=[],queuedShow=null,queuedClink=null;
let queuedMinigame=null,queuedPhoto=null,roomPhoto=null,minigameKiteCuts=[];
let queuedPicnic=null;
const bungeoQueue=[];
const bowlingQueue=[];
let bowlingMatch=null,lastBowlingPlace=null;
let bungeoMolds,bungeoOrder=null,bungeoStock=0,bungeoMode=null,bungeoWatchedStall=null;
const heardClinks=new Set();
let parkedBikes=[];
let lastChatAt=0;
let course=[],pendingSeat=null,seatClaim=null,thumb=[0,0],thumbId,manualInputAt=-Infinity;
let backgroundTrip=null;
let exitPress=null;
let mapRoute=null;
let clockOffset=null,roundTrip=65;
let runToggled=false,shiftHeld=false,sentHeading=0,jumpBase=0;
const keys=new Set();
const vectors={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
const fragments=new URLSearchParams(location.hash.slice(1));
const suppliedCode=(fragments.get("code")||"").toUpperCase();
const entryFlow=$("entry-flow"),profileStep=$("profile-step"),serverStep=$("server-step"),gameShell=$("game-shell");
const nearbyControls=bindNearbyControls($("nearby-controls"),focusGame);
const peerControls=bindNearbyControls($("peer-controls"),focusGame,"peer");
function closeActionMenus(){
  nearbyControls.close();peerControls.close();setEmotes(false);setGestures(false);
}
const sceneWrap=$("game").closest(".scene-wrap"),mobileSettings=$("mobile-settings");
const nickname=$("nickname"),joinCode=$("join-code");
const chatInput=$("chat-input"),chatSend=$("chat-send");
const profileChoices=[...document.querySelectorAll("[name='entry-character']")];
const serverButtons=["open-server","create-room","join-room","server-back","invite-toggle"].map($);
nickname.value=localStorage.getItem("jeongdong-nickname")||"";
joinCode.value=suppliedCode;
profileChoices.find(option=>option.value===me.character).checked=true;
const photoAlbum=bindPhotoAlbum($("photo-album")),tutorial=bindTutorial($("tutorial-card"));
const diningById=Object.fromEntries(diningVenues.map(venue=>[venue.id,venue]));
const diningRegion={west:"경희궁",jeongdong:"덕수궁",gwanghwamun:"광화문광장",bukchon:"북촌"};
const venueById={ [semaVenue.id]:semaVenue,[mmcaVenue.id]:mmcaVenue,[ARCADE_SITE.id]:ARCADE_SITE,[ARCADE_UPPER_SITE.id]:ARCADE_UPPER_SITE,
  [ARCADE_THIRD_SITE.id]:ARCADE_THIRD_SITE,...diningById };
const guestbook=bindGuestbook({getSession:()=>session,onClose:focusGame,request});
const diningMenu=bindDiningMenu({onSelectDish:takeMeal});
const galleryLogKey="seoul-palace-walk:mmca-exhibits";
const galleryLog=new Set();
try{
  const saved=JSON.parse(localStorage.getItem(galleryLogKey));
  if(Array.isArray(saved))for(const work of mmcaExhibits)if(saved.includes(work.id))galleryLog.add(work.id);
}catch{}
let galleryLight=0;
const passport=bindPassport({
  getLook:()=>me.look,applyLook:applyLookPatch,focusGame,onNotice:toast,
  getProfile:()=>({nickname:nickname.value.trim(),character:me.character,look:{...me.look}}),applyProfile,
  listPhotos,importPhotos,onShowStamp:showMapRoute
});
const picnic=makePicnic({
  send(command){
    if(!canPicnic(gameTime())||queuedPicnic||bungeoInventoryPending())return false;
    queuedPicnic=command;wakeSync();return true;
  },
  self:()=>session?.id,getAvatar:()=>session?me:null,now:()=>gameTime(),
  getPeople:()=>[...people.values()].filter(({avatar})=>!avatar.bus&&!isCycling(avatar))
    .map(({id,nickname,position})=>({id,nickname,x:position.x,y:position.y})),
  focusGame:()=>{if(session)focusGame();},
  onOffer:item=>toast(item.nickname+" 님이 "+ITEMS[item.kind].name+" 한 몫을 건넸어요. 돗자리에서 받을 수 있어요.")
});
const minigames=makeMinigames({
  mount:sceneWrap,
  send:command=>{
    if(!session)return false;
    if(["hit","throw","kick"].includes(command.action)){
      me.heading=normalize(command.angle??0);
      dirty=true;
    }
    queuedMinigame=command;wakeSync();
  },
  now:()=>gameTime(),self:()=>session?.id,getAvatar:()=>me,getView:()=>ownView,focusGame
});
const photoMode=bindPhotoMode($("photo-controls"),{
  getAvatar:()=>me,getView:()=>ownView,getClock:gameTime,getRoster:nearbyPhotoPeople,canMove:canMovePhoto,
  onOpen(){
    if(bungeoMode)setBungeoCooking(false);
    arcade.stop();
    resetInput();closeActionMenus();setMap(false);mobileSettings.open=false;
    sceneWrap.classList.add("photo-active");focusGame();
  },
  onClose(){sceneWrap.classList.remove("photo-active");if(session){resetInput();focusGame();}},
  onCapture:takePhoto,onShare(camera){queuedPhoto={id:token(),camera};wakeSync();},notice:toast
});
$("passport-open").addEventListener("click",()=>{mobileSettings.open=false;resetInput();passport.open();});
$("profile-transfer-open").addEventListener("click",()=>passport.openTransfer());
$("hanbok-rental").addEventListener("click",()=>{
  if(!passport.nearRental(me))return;
  resetInput();passport.openRental();
});
$("minigame").addEventListener("click",()=>{resetInput();minigames.open(me);});
$("passport-mount").addEventListener("click",event=>{
  if(event.target.closest("[data-open-photo-album],#passport-album"))photoAlbum.open();
});
$("photo-album-open").addEventListener("click",()=>{clearManualInput();photoAlbum.open();});
$("photo-mode-open").addEventListener("click",()=>{if(world&&session&&!riding)photoMode.open();});
$("photo-join").addEventListener("click",()=>{if(joinablePhoto(gameTime()))photoMode.join(roomPhoto);});
$("tutorial-replay").addEventListener("click",()=>{
  $("visitor-guide-dialog").close();tutorial.start(true);focusGame();
});

let catTipTimer;
let catTipDismissed=localStorage.getItem("jeongdong-cat-run-tip-hidden")==="true";
function hideCatRunTip(){
  clearTimeout(catTipTimer);
  $("cat-run-tip").hidden=true;
}
function onCatFlee(runnerId){
  if(!session||runnerId!==session.id||catTipDismissed||!$("cat-run-tip").hidden||!bikeFallTip.hidden)return;
  $("cat-run-tip").hidden=false;
  catTipTimer=setTimeout(hideCatRunTip,6200);
}
$("cat-run-tip-dismiss").addEventListener("click",()=>{
  catTipDismissed=true;
  localStorage.setItem("jeongdong-cat-run-tip-hidden","true");
  hideCatRunTip();focusGame();
});
const bikeFallTip=$("bike-fall-tip");
let bikeFallTipTimer;
function hideBikeFallTip(){
  clearTimeout(bikeFallTipTimer);
  bikeFallTip.hidden=true;
}
function showBikeFallTip(){
  if(bikeFallHintSeen||localStorage.getItem("jeongdong-bike-fall-tip-hidden")==="true")return;
  bikeFallHintSeen=true;
  hideCatRunTip();
  bikeFallTip.hidden=false;
  bikeFallTipTimer=setTimeout(hideBikeFallTip,8500);
}
$("bike-fall-tip-dismiss").addEventListener("click",()=>{
  localStorage.setItem("jeongdong-bike-fall-tip-hidden","true");
  hideBikeFallTip();focusGame();
});

const mobileHeader=matchMedia("(max-width:810px), (pointer:coarse)");
const fullscreenToggle=$("fullscreen-toggle");
const graphicsSelect=$("graphics-quality");
const savedQuality=localStorage.getItem("palace-graphics-quality");
graphicsSelect.value=["high","medium","low"].includes(savedQuality)?savedQuality:"high";
graphicsSelect.addEventListener("change",()=>{
  localStorage.setItem("palace-graphics-quality",graphicsSelect.value);
  world?.setQuality(graphicsSelect.value);
});
let fullscreenFallback=false;
function placeViewControls(){
  const menu=$("mobile-settings-actions"),filter=$("map-filter"),mapLinks=$("map-links"),mapKey=$("map-key");
  mobileSettings.open=false;
  if(mobileHeader.matches){
    $("mobile-room-controls").append($("passport-open"));
    menu.append($("sound"),$("night"),$("character"),$("photo-mode-open"),$("invite"),$("settings-leave"));
    $("map-toolbar").insertBefore($("presence"),$("close-map"));
    $("map-panel").querySelector(".panel-head").after(filter);
    $("map-footer").append(mapKey,mapLinks);
  }else{
    $("desktop-presence-controls").append($("presence"));
    menu.append($("sound"),$("night"),$("character"),$("photo-mode-open"),$("passport-open"),$("invite"),$("desktop-map-settings"));
    // The teleport buttons stay under the map; only the legend moves into the settings menu.
    $("map-footer").append(mapLinks);
    $("desktop-map-settings").append(mapKey);
    $("desktop-room-controls").append($("settings-leave"));
    $("map-toolbar").prepend(filter);
  }
}
function refreshFullscreen(){
  const active=fullscreenFallback||document.fullscreenElement===document.documentElement;
  gameShell.classList.toggle("game-fullscreen",active);
  fullscreenToggle.setAttribute("aria-pressed",String(active));
  const label=active?"전체화면 나가기":"전체화면";
  fullscreenToggle.querySelector("span").textContent=label;
  fullscreenToggle.title=label;fullscreenToggle.setAttribute("aria-label",label);
  if(!active&&!mobileHeader.matches&&$("map-panel").classList.contains("expanded"))setMap(false);
}
async function leaveFullscreen(){
  fullscreenFallback=false;
  if(document.fullscreenElement===document.documentElement)await document.exitFullscreen().catch(()=>{});
  refreshFullscreen();
}
fullscreenToggle.addEventListener("click",async()=>{
  closeActionMenus();
  if(gameShell.classList.contains("game-fullscreen"))await leaveFullscreen();
  else{
    if(document.fullscreenEnabled&&document.documentElement.requestFullscreen){
      try{await document.documentElement.requestFullscreen({navigationUI:"hide"});}catch{fullscreenFallback=true;}
    }else fullscreenFallback=true;
    refreshFullscreen();
    if(fullscreenFallback&&mobileHeader.matches&&!navigator.standalone&&
      !matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches){
      const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1;
      toast(ios?"주소창 없이 즐기려면 Safari의 공유 → 홈 화면에 추가 → 웹 앱으로 열기를 선택하세요.":"주소창이 남으면 브라우저 메뉴에서 게임을 홈 화면에 추가해 여세요.");
    }
  }
  if(session)focusGame();
});
document.addEventListener("fullscreenchange",refreshFullscreen);
mobileHeader.addEventListener("change",()=>{
  placeViewControls();
  setMap(false);
});
placeViewControls();
gameShell.addEventListener("pointerdown",event=>{
  const target=event.target;
  if(!target.closest("#nearby-controls,#joystick"))nearbyControls.close();
  if(!target.closest("#peer-controls,#joystick"))peerControls.close();
  if(!target.closest("#gesture-menu,#gesture-open,#joystick"))setGestures(false);
  if(!target.closest("#emote-menu,#emote-open,#joystick"))setEmotes(false);
  if(mobileSettings.open&&!mobileSettings.contains(event.target))mobileSettings.open=false;
});
mobileSettings.addEventListener("toggle",()=>{
  if(mobileSettings.open)closeActionMenus();
});
mobileSettings.addEventListener("keydown",event=>{
  if(event.key!=="Escape"||!mobileSettings.open||mobileHeader.matches)return;
  event.preventDefault();event.stopPropagation();
  mobileSettings.open=false;mobileSettings.querySelector("summary").focus();
});
for(const [id,other] of [["nearby-toggle",peerControls],["peer-toggle",nearbyControls]]){
  $(id).addEventListener("click",()=>{other.close();setEmotes(false);setGestures(false);});
}

let composingChat=false;
function chatText(){return chatInput.value.normalize("NFC").replace(/\s+/gu," ").replace(/[\p{Cc}\p{Bidi_Control}]/gu,"").trim();}
function updateChatSend(){
  const text=chatText();
  chatInput.setCustomValidity([...text].length>80?"채팅은 80자까지 입력할 수 있어요.":"");
  chatSend.disabled=!session||!text||Boolean(queuedChat);
  chatSend.textContent=queuedChat?"전송 중":"전송";
}
chatInput.addEventListener("input",updateChatSend);
chatInput.addEventListener("compositionstart",()=>{composingChat=true;});
chatInput.addEventListener("compositionend",()=>{composingChat=false;updateChatSend();});
chatInput.addEventListener("keydown",event=>{
  const composing=event.isComposing||event.keyCode===229||composingChat;
  if(event.key==="Enter"&&composing)event.preventDefault();
  if(event.key==="Escape"&&!composing){
    event.preventDefault();
    event.stopPropagation();
    focusGame();
  }
});
chatSend.addEventListener("pointerdown",event=>{
  // Sending by touch or mouse should not blur the active editor or hide its keyboard.
  if(event.button===0&&document.activeElement===chatInput)event.preventDefault();
});
$("chat-form").addEventListener("submit",event=>{
  event.preventDefault();
  const text=chatText();
  if(!session||!text||[...text].length>80||composingChat||queuedChat)return;
  lastChatAt=Math.max(gameTime(),lastChatAt+1);
  me.chat=queuedChat={id:token(),text,at:lastChatAt};
  dirty=true;wakeSync();
  chatInput.value="";
  chatInput.focus({preventScroll:true});
  updateChatSend();
});

function toast(message){
  $("toast").textContent=message;$("toast").hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{$("toast").hidden=true;},3200);
}
function setPresence(text,count=0){
  $("presence").lastElementChild.textContent=text;
  $("presence").classList.toggle("live",count>1);
  $("game-presence").textContent=count>0?count+"명 접속":text;
  $("game-presence").classList.toggle("live",count>1);
  for(const id of ["presence","game-presence"])attr($(id),"aria-label",text+" · 접속자 목록 열기");
}
const seoulTime=new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
function updateEnvironment(time){
  currentEnvironment=resolveSeoulEnvironment(environment,time);
  ownView.night=currentEnvironment.night>.55;
  if($("environment-dialog").open){
    const source=currentEnvironment.source==="live"?"서울 날씨":"임시 날씨";
    setText($("environment-status"),`서울 ${seoulTime.format(time)} · ${weatherNames[currentEnvironment.weather]} · ${source}`);
  }
  const wet=["rain","snow"].includes(currentEnvironment.weather)&&!interiorAt(me.x,me.y);
  if(!wet)umbrellaFolded=false;
  const available=wet&&!me.bus&&!riding&&!isCycling(me);
  const ready=available&&me.seat==null;
  const link=myLink(),sharing=isUmbrellaLink(link);
  const guest=sharing&&link.active&&link.follower===session.id;
  const umbrella=available&&!umbrellaFolded&&!guest;
  if(me.umbrella!==umbrella||me.umbrellaReady!==ready){
    Object.assign(me,{umbrella,umbrellaReady:ready});dirty=true;wakeSync();
  }
  if(sharing&&(!ready||link.leader===session.id&&!umbrella)&&!queuedHand)releasePair(link);
  setActivity("umbrella",available&&!guest?umbrella?"우산 접기":"우산 쓰기":null);
}
$("umbrella").addEventListener("click",()=>{umbrellaFolded=me.umbrella;updateEnvironment(gameTime());focusGame();});
function myLink(){return session&&links.find(link=>link.leader===session.id||link.follower===session.id);}
const isUmbrellaLink=link=>link?.kind==="umbrella";
function sharingUmbrella(){const link=myLink();return Boolean(isUmbrellaLink(link)&&link.active);}
function amFollowingHands(){const link=myLink();return Boolean(link?.active&&link.follower===session.id);}
function labelPerspective(){
  const button=$("perspective"),label=bungeoMode?"굽기 끝내기":firstPerson?"3인칭":"1인칭";
  button.title=bungeoMode?label:label+"으로 전환";
  button.setAttribute("aria-label",button.title);
  button.toggleAttribute("data-active",firstPerson||Boolean(bungeoMode));
}
labelPerspective();
const sound=makeSound();
let arcadeReturnView=null;
function commandBowling(command){
  if(!session||(command.action!=="leave"&&bowlingQueue.some(item=>item.action!=="leave")))return false;
  if(command.action==="leave"&&bowlingQueue.at(-1)?.action==="leave")return false;
  if(command.action==="join"&&arcade.kind==="bowling"&&near(ARCADE_BOWLING,me.x,me.y)>1.7){
    Object.assign(me,{x:ARCADE_BOWLING.x+.77,y:ARCADE_BOWLING.y,heading:270});
    lastBowlingPlace=null;dirty=true;
  }
  bowlingQueue.push({id:token(),...command});wakeSync();return true;
}
function positionBowler(){
  if(arcade.kind!=="bowling"||!bowlingMatch)return;
  if(!bowlingMatch.players.some(player=>player.id===session.id))return;
  const throwing=bowlingMatch.turn===session.id||bowlingMatch.rollPlayer===session.id;
  const waiters=bowlingMatch.players.filter(player=>player.id!==bowlingMatch.turn);
  const waiting=waiters.findIndex(player=>player.id===session.id);
  const row=Math.floor(Math.max(0,waiting)/6)%2;
  const side=waiting%6,offset=side<3?1.56+side*.74:-1.49-(side-3)*.62;
  const point=throwing?ARCADE_BOWLING:{x:ARCADE_BOWLING.x+.61+row*.66,y:ARCADE_BOWLING.y+offset};
  const placement=throwing?"line":`${row}/${side}`;
  if(placement===lastBowlingPlace||!walkable(point.x,point.y,platformAt(point.x,point.y)+.19))return;
  lastBowlingPlace=placement;
  resetInput();
  Object.assign(me,{x:point.x,y:point.y,heading:270,vx:0,vy:0,blocked:false,running:false});
  if(throwing)ownView={...ownView,pan:270,tilt:9};
  dirty=true;wakeSync();
}
function adjustArcadeAim(pan,tilt){
  const claw=arcade.kind==="claw",panLimit=claw?88:arcade.kind==="bowling"?16:24;
  ownView={...ownView,pan:Math.max(270-panLimit,Math.min(270+panLimit,ownView.pan+pan)),
    tilt:Math.max(claw?-26:-22,Math.min(claw?43:28,ownView.tilt+tilt))};
}
function moveBowler(direction,elapsed){
  const y=Math.max(ARCADE_BOWLING.y-BOWLING_OFFSET_LIMIT,
    Math.min(ARCADE_BOWLING.y+BOWLING_OFFSET_LIMIT,me.y-direction*elapsed*1.43));
  const moved=Boolean(direction&&elapsed>0&&y!==me.y);
  const vy=moved?(y-me.y)/elapsed:0,heading=moved?(vy>0?180:0):270;
  if(moved||me.vy){
    Object.assign(me,{y:moved?y:me.y,vy,heading,vx:0,blocked:false});
    dirty=true;wakeSync();
  }
  return moved;
}
const arcade=bindArcade({root:sceneWrap,getAvatar:()=>me,getAim:()=>ownView,getClock:now=>gameTime(now),
  onPrize:p=>bagRequest({action:"prize",kind:"plush-"+p.type+"-"+p.variant}),
  canDropClaw:()=>{
    if(!bagLocked()&&(me.bag?.length??0)<BAG_SIZE)return true;
    toast(bagLocked()?"물건을 옮긴 뒤 다시 시도해 주세요.":"인형을 담을 가방 한 칸을 비워 주세요.");return false;
  },
  getBowling:()=>bowlingMatch,getPlayerId:()=>session?.id,bowlingPending:()=>bowlingQueue.some(item=>item.action!=="leave"),
  getHockeyPeers:now=>{
    const peers=[];
    for(const p of people.values()){
      const track=currentArcade(p,now);
      if(track?.next.kind!=="airHockey"||now-track.next.at>4000)continue;
      const view=visibleArcade(track,now);
      const state=view&&{...view,hockey:track.next.hockey};
      if(state?.kind==="airHockey"&&state.hockey)peers.push({id:p.id,name:p.nickname,joined:state.hockey.joined,state});
    }
    return peers;
  },
  onHockeySeat(side){
    const target=side===1?hockeyFarEnd:ARCADE_GAMES.airHockey;
    Object.assign(me,{x:target.x,y:target.y,heading:side===1?90:270});dirty=true;wakeSync();
  },
  onTableFull:()=>toast("친구 두 명이 경기 중이에요. 옆에서 관전할 수 있어요."),
  commandBowling,onBowlMove:moveBowler,
  onBaseballStance(hand){
    const side=baseballBatterSide(hand),point=ARCADE_GAMES.baseball;
    Object.assign(me,{x:point.x,y:point.y-side*BASEBALL_BATTER_OFFSET,heading:side<0?322:218});
    dirty=true;wakeSync();
  },
  onAim:adjustArcadeAim,playMoleImpact:hit=>sound.moleImpact(hit),playBeat:(lane,strong)=>sound.arcadeBeat(lane,strong),
  playBasketImpact:(kind,strength)=>sound.basketImpact(kind,strength),
  onStart(kind,point){
    if(!canStartArcade(point))return false;
    const view=ownView;
    if(kind==="bowling"){
      resetInput();stand();
      ownView={...ownView,pan:270,tilt:9};lastBowlingPlace=null;
      Object.assign(me,{vx:0,vy:0,blocked:false,running:false});dirty=true;
    }else if(kind==="mole"){
      const game=$("game"),{distance}=moleView(game.clientWidth/Math.max(1,game.clientHeight));
      movePlayerTo({...point,x:point.machine.x+distance,heading:270,tilt:20},venueById[point.floor].name);
    }else movePlayerTo({...point,heading:270,tilt:kind==="pump"?26:0},venueById[point.floor].name);
    arcadeReturnView=view;closeActionMenus();sound.wake();focusGame();return true;
  },
  onStop(){
    if(arcadeReturnView)ownView=arcadeReturnView;
    arcadeReturnView=null;lastBowlingPlace=null;resetInput();focusGame();dirty=true;wakeSync();
  }
});
let strideLeft=1.2,nextStep=0,nextBird=0,nextCat=0,nextCricket=0,nextBusSound=0,nextDrum=0,ceremonyAnnounced=-1;
let nextShowAudio=0;
let lastBuskingBeat=-1;
$("sound").setAttribute("aria-pressed",String(sound.enabled));
$("sound").addEventListener("click",()=>{
  $("sound").setAttribute("aria-pressed",String(sound.toggle()));
  if(!mobileSettings.open)focusGame();
});
window.addEventListener("pointerdown",event=>{if(event.pointerType==="mouse")sound.wake();},{passive:true});
window.addEventListener("pointerup",event=>{if(event.pointerType!=="mouse")sound.wake();},{passive:true});
window.addEventListener("keydown",()=>sound.wake(),{passive:true});
function updateBusSound(time,indoors){
  if(indoors){sound.bus(null);return;}
  const bus=me.bus&&busAt(me.bus.index,time);
  let source=bus,distance=bus?0:43;
  if(!bus)for(let index=0;index<BUS_COUNT;index++){
    const other=busAt(index,time),gap=near(other,me.x,me.y);
    if(gap<distance){source=other;distance=gap;}
  }
  if(!source){sound.bus(null);return;}
  const ahead=source.traveling&&busAt(source.index,time+150);
  const speed=ahead?near(ahead,source.x,source.y)/.15:0;
  sound.bus({distance,moving:source.traveling,inside:Boolean(bus),speed});
}
// How close the walker is to the Cheonggyecheon water (0 to 1) and to the waterfall at its head.
const streamFalls={x:625,y:-151};
function streamNearness({x,y}){
  if(!inCheonggye(x,y))return null;
  const falls=Math.max(0,1-near(streamFalls,x,y)/46);
  if(x<cheonggyeStations[0]-2)return {flow:0,falls};
  const [centre,north,south]=riverAt(Math.min(x,cheonggyeStations.at(-1)));
  const off=y<centre?centre-north+3.3-y:y-centre-south+3.1;
  return {flow:Math.max(0,1-Math.max(0,off)/15),falls};
}
let lastPaddle=-1;
const bathing=()=>me.seat!=null&&Boolean(world?.benches[me.seat]?.footBath);
function soundscape(time,travelled,running=false){
  if(!session||!world||riding)return;
  // Feet kicking in the stream splash each time one of them breaks the surface.
  const kickAge=bathing()?footKickAge(me,time):null;
  if(kickAge!=null){
    const beat=Math.floor(kickAge/(FOOT_BATH_PERIOD/2));
    if(beat!==lastPaddle){sound.splash();lastPaddle=beat;}
  }else lastPaddle=-1;
  const indoors=Boolean(interiorAt(me.x,me.y));
  if(!indoors&&!document.hidden){
    const distance=near(buskingSpot,me.x,me.y),cue=buskingBeat(time);
    if(distance<BUSKING_HEARING_METRES&&cue.beat!==lastBuskingBeat){
      lastBuskingBeat=cue.beat;sound.busking(cue.note,1-distance/BUSKING_HEARING_METRES);
    }
  }
  if(time>=nextShowAudio){
    nextShowAudio=time+100;
    const distance=near(plazaShowSpot,me.x,me.y);
    const show=!indoors&&!document.hidden&&distance<=PLAZA_SHOW_HEARING_METRES&&fountainShow?.endsAt>time;
    sound.plazaShow(show?{startAt:fountainShow.startedAt,clock:time,distance}:null);
  }
  if(time-me.jump<jumpDuration(me))strideLeft=Math.max(.9,strideLeft);
  else if(travelled>0&&sound.enabled){
    strideLeft-=travelled;
    if(strideLeft<=0&&time>=nextStep){
      strideLeft=running?3.25:1.55;
      nextStep=time+440;
      sound.step(me.up||loftStair(me.x,me.y)!=null?"wood":"stone");
    }
  }
  if(sound.enabled&&!document.hidden){
    if(time>=nextBusSound){
      nextBusSound=time+125;updateBusSound(time,indoors);
      const rain=indoors||me.bus?0:currentEnvironment.rain;
      sound.rain(rain,rain>0&&(me.umbrella||sharingUmbrella()||world.underDoldamAwning(me)));
      // The stream is heard from the banks, and the waterfall at its head from further off.
      const water=indoors||me.bus?null:streamNearness(me);
      sound.stream(water?.flow??0,water?.falls??0);
    }
    if(!indoors&&!me.bus){
      if(time>=nextBird){
        const bird=world.birds.soundSource(me,22);
        nextBird=time+(bird?4800+Math.random()*4300:900);
        if(bird)sound.chirp((1-bird.distance/24)*(ownView.night?.55:.95));
      }
      if(time>=nextCat){
        const cat=world.parkLife.soundSource(me,10);
        nextCat=time+(cat?8800+Math.random()*6000:1100);
        if(cat)sound.meow((1-cat.distance/11)*.7);
      }
      if(ownView.night&&time>=nextCricket){
        nextCricket=time+13500+Math.random()*10000;sound.cricket();
      }
    }
  }
  // Changing of the guard at Gwanghwamun: announce it once and beat the drum while it lasts.
  const gate=palaceAt(0,-10),ceremony=ceremonyAt(time);
  if(ceremony.active&&inGyeongbok(me.x,me.y)&&near(gate,me.x,me.y)<130){
    const round=Math.floor(time/600000);
    if(round!==ceremonyAnnounced&&ceremony.phase<20){ceremonyAnnounced=round;toast("광화문에서 수문장 교대식이 시작됐어요.");}
    if(time>=nextDrum&&near(gate,me.x,me.y)<90){nextDrum=time+1500;sound.drum();}
  }
}
$("perspective").addEventListener("click",()=>{
  if(bungeoMode){setBungeoCooking(false);return;}
  if(photoMode.camera)photoMode.close();
  firstPerson=!firstPerson;
  labelPerspective();
  localStorage.setItem("jeongdong-first-person",String(firstPerson));
  focusGame();
});
$("night").addEventListener("click",()=>{
  resetInput();$("environment-dialog").showModal();updateEnvironment(gameTime());
});
for(const button of document.querySelectorAll("[data-time]")){
  button.setAttribute("aria-pressed",String(button.dataset.time===environment.time));
  button.addEventListener("click",()=>{
    environment.time=button.dataset.time;localStorage.setItem("jeongdong-time",environment.time);
    for(const choice of document.querySelectorAll("[data-time]"))attr(choice,"aria-pressed",choice===button);
    updateEnvironment(gameTime());dirty=true;
  });
}
const zoomLimit=3,zoomStep=.75;
function adjustZoom(change){
  if(!session)return;
  if(photoMode.camera){photoMode.zoom(change);return;}
  const zoom=Math.max(-zoomLimit,Math.min(zoomLimit,ownView.zoom+change));
  if(zoom===ownView.zoom)return;
  ownView={...ownView,zoom};dirty=true;
}
$("game").addEventListener("wheel",event=>{
  if(!session||!event.deltaY||event.target.closest("button"))return;
  event.preventDefault();adjustZoom(-Math.sign(event.deltaY)*zoomStep);
},{passive:false});

const characterOptions=[...document.querySelectorAll("[data-character]")];
const appearanceOptions=[...document.querySelectorAll("[data-feature]")];
// One group of choices is shown at a time so the preview stays in view while choosing.
const lookTabs=[...document.querySelectorAll("[data-look-tab]")],lookGroups=[...document.querySelectorAll("[data-look-group]")];
function showLookGroup(name){
  for(const tab of lookTabs)tab.setAttribute("aria-pressed",String(tab.dataset.lookTab===name));
  for(const group of lookGroups)group.hidden=group.dataset.lookGroup!==name;
}
for(const tab of lookTabs)tab.addEventListener("click",()=>showLookGroup(tab.dataset.lookTab));
showLookGroup("hair");
function refreshCharacterPreview(){
  for(const option of characterOptions)attr(option,"aria-pressed",option.dataset.character===me.character);
  for(const option of appearanceOptions){
    attr(option,"aria-pressed",me.look[option.dataset.feature]===option.dataset.option);
  }
  world?.previewWalker($("character-preview"),me);
}
function saveAppearance(){
  localStorage.setItem("jeongdong-character",me.character);
  localStorage.setItem("jeongdong-look",JSON.stringify(me.look));
  dirty=true;refreshCharacterPreview();
}
function applyLookPatch(patch){
  const next={...me.look};
  for(const [feature,choices] of Object.entries(lookChoices)){
    if(choices.includes(patch?.[feature]))next[feature]=patch[feature];
  }
  me.look=next;saveAppearance();wakeSync();
}
function applyProfile(profile){
  nickname.value=profile.nickname;
  localStorage.setItem("jeongdong-nickname",profile.nickname);
  chooseCharacter(profile.character);applyLookPatch({...LOOK_DEFAULTS,...profile.look});
  profileChoices.find(option=>option.value===me.character).checked=true;
  if(session)toast("옷차림을 적용했어요. 이어서 입장하면 저장한 닉네임이 표시돼요.");
}
$("character").addEventListener("click",()=>{
  resetInput();
  $("character-dialog").showModal();
  refreshCharacterPreview();
  characterOptions.find(option=>option.dataset.character===me.character).focus();
});
function chooseCharacter(character){
  if(me.look.hair===defaultHair(me.character))me.look={...me.look,hair:defaultHair(character)};
  me.character=character;saveAppearance();
}
characterOptions.forEach(option=>option.addEventListener("click",()=>chooseCharacter(option.dataset.character)));
appearanceOptions.forEach(option=>option.addEventListener("click",()=>{
  const {feature,option:choice}=option.dataset;
  if(me.look[feature]===choice)return;
  applyLookPatch({[feature]:choice});
}));
function setEmotes(open){
  if(open){nearbyControls.close();peerControls.close();setGestures(false);}
  $("emote-menu").hidden=!open;$("emote-open").setAttribute("aria-expanded",String(open));
}
$("emote-open").addEventListener("click",()=>setEmotes($("emote-menu").hidden));
function setGestures(open){
  if(open){nearbyControls.close();peerControls.close();setEmotes(false);}
  $("gesture-menu").hidden=!open;
  attr($("gesture-open"),"aria-expanded",String(open));
}
const gestureButtons=[...document.querySelectorAll("[data-gesture]")];
function gestureReady(time,kind){
  if(!session||riding||me.bus||isCycling(me)||queuedBus||queuedBike||myLink()?.active||
    photoMode.camera||minigames.active()||feedingLocked(time)||clinkLocked(time)||sickLocked(time)||carryingDiningTray(time)||mealBiteLocked(time)||
    time-me.jump<jumpDuration(me)||ITEM_SLOTS.some(slot=>itemAnimating(me[slot],time)))return false;
  if(!kind)return true;
  const held=ITEM_SLOTS.filter(slot=>me[slot]?.remaining).length;
  if(["clap","heart"].includes(kind)&&held)return false;
  return kind==="dance"||held<2;
}
$("gesture-open").addEventListener("click",event=>{
  const open=$("gesture-menu").hidden;
  setGestures(open);
  if(open&&event.detail===0)gestureButtons.find(button=>!button.disabled)?.focus();
});
$("ground-sit").addEventListener("click",()=>{
  if(!gestureReady(gameTime())||arcade.kind||bungeoMode||me.seat!=null||seatClaim)return;
  resetInput();pendingSeat=null;
  Object.assign(me,{groundSit:!me.groundSit,vx:0,vy:0,running:false,blocked:false});
  dirty=true;wakeSync();setGestures(false);focusGame();
});
for(const button of gestureButtons)button.addEventListener("click",()=>{
  const time=gameTime(),kind=button.dataset.gesture;
  if(!Object.hasOwn(GESTURE_DURATIONS,kind)||!gestureReady(time,kind)||time-(me.gesture?.at??0)<450)return;
  me.gesture={kind,at:time};
  me.wave=kind==="wave"?time:0;
  dirty=true;wakeSync();setGestures(false);focusGame();
});
document.querySelectorAll("[data-emoji]").forEach(button=>button.addEventListener("click",()=>{
  me.emote={emoji:button.dataset.emoji,at:gameTime()};dirty=true;
  wakeSync();
  setEmotes(false);$("game").focus({preventScroll:true});
}));

const directions=["앞","오른쪽 앞","오른쪽","오른쪽 뒤","뒤","왼쪽 뒤","왼쪽","왼쪽 앞"];
const rosterDialog=$("roster-dialog");
const trackPins=[$("track-pin"),$("mini-track-pin")];
function setText(node,value){if(node.textContent!==value)node.textContent=value;}
function outdoorMap(position){
  const {x,y}=position;
  const indoors=venueById[interiorAt(x,y)];
  if(indoors)return indoors===mmcaVenue?"북촌":diningRegion[indoors.area]??"북촌";
  if(westWalkable(x,y)){const region=westRegion(x,y);return region==="서울시립미술관"?"덕수궁":region;}
  if(inSonghyeon(x,y))return "열린송현녹지광장";
  if(cheonggyeWalkable(x,y)||position.up&&cheonggyeLevel(position)!=null)return "청계천";
  if(bukchonWalkable(x,y))return "북촌";
  if(x>610&&hwangudanWalkable(x,y))return "환구단";
  if(inGyeongbok(x,y)||x<385&&y< -845&&y> -975)return "경복궁";
  if(inGwanghwamunPlaza(x,y)||x>=285&&x<439&&y< -406&&y> -470)return "광화문광장";
  return y<179&&inSejongCorridor(x,y)?"세종대로":"덕수궁";
}
function shownPlace(point){
  const place=placeName(point);
  return isInsideMuseum(point.x,point.y)&&place!=="덕수궁 전시관"?"미술관 · "+place:place;
}
function updatePeopleList(list){
  const entries=[...people.values()].sort((a,b)=>a.nickname.localeCompare(b.nickname,"ko")||a.id.localeCompare(b.id));
  entries.unshift({id:session.id,nickname:session.nickname,coat:session.coat,position:me});
  const previous=new Map(Array.from(list.children,item=>[item.dataset.personId,item]));
  for(const [index,person] of entries.entries()){
    const self=person.id===session.id;
    let item=previous.get(person.id);
    previous.delete(person.id);
    if(!item){
      item=document.createElement("li");item.dataset.personId=person.id;
      const row=document.createElement(self?"div":"button");
      row.className=self?"roster-row roster-self":"roster-row";
      if(!self){row.type="button";row.dataset.personId=person.id;}
      const coat=document.createElement("i"),copy=document.createElement("span"),indicator=document.createElement("span");
      coat.className="roster-coat";coat.setAttribute("aria-hidden","true");
      coat.style.setProperty("--player-color",hexCoat(person.coat??0x397e70));
      copy.className="roster-person";copy.append(document.createElement("strong"),document.createElement("small"));
      indicator.className="roster-indicator";indicator.textContent=self?"나":"위치 보기";
      row.append(coat,copy,indicator);item.append(row);
    }
    setText(item.querySelector("strong"),person.nickname);
    setText(item.querySelector("small"),shownPlace(person.position));
    if(list.children[index]!==item)list.insertBefore(item,list.children[index]??null);
  }
  for(const item of previous.values())item.remove();
}
function refreshPeopleDialogs(){
  if(rosterDialog.open){
    setText($("roster-count"),syncFailures?"다시 연결 중 · 마지막으로 확인한 위치":(people.size+1)+"명 접속 중");
    updatePeopleList($("roster-list"));
  }
}
for(const id of ["presence","game-presence"]){
  $(id).addEventListener("click",()=>{
    if(!session||rosterDialog.open)return;
    resetInput();rosterDialog.showModal();refreshPeopleDialogs();
  });
}
$("roster-list").addEventListener("click",event=>{
  const id=event.target.closest("button[data-person-id]")?.dataset.personId;
  if(!people.has(id))return;
  trackedPersonId=id;rosterDialog.close();focusGame();
  updateLocationGuides();
});
$("clear-tracking").addEventListener("click",()=>{
  trackedPersonId=null;updateLocationGuides();focusGame();
});
function guideLocation(point,inside){
  const otherInside=interiorAt(point.x,point.y);
  if(otherInside===inside){
    const area=outdoorMap(point);
    return {point,prefix:!inside&&area!==outdoorMap(me)?area:""};
  }
  const stairs=arcadeStairToward(inside,otherInside);
  if(stairs)return {point:stairs,prefix:"계단까지"};
  const venue=venueAt(inside??otherInside);
  return inside?{point:venue?.insideDoor,prefix:"출구까지"}:
    {point:venue?.outsideDoor,prefix:(venue?.name??"전시관")+" 입구까지"};
}
function positionGuidePins(pins,point,indoors){
  for(const [index,pin] of pins.entries()){
    attr(pin,"visibility",point?"visible":"hidden");
    if(!point)continue;
    const radius=indoors?(index?2.25:2.6):(index?7.2:11);
    attr(pin,"transform",`translate(${point.x} ${point.y})`);
    attr(pin.firstElementChild,"r",radius);attr(pin.lastElementChild,"r",radius*.32);
  }
}
function showGuide(kind,title,location){
  const {point,prefix}=location,arrow=$(kind+"-arrow");
  setText($(kind+"-title"),title);
  let label=prefix;
  if(point){
    const dx=point.x-me.x,dy=point.y-me.y,metres=Math.hypot(dx,dy);
    const angle=normalize(Math.atan2(dx,-dy)*180/Math.PI-ownView.pan);
    label=[prefix,metres<1.5?"바로 옆":directions[Math.round(angle/45)%8]+" · "+Math.round(metres)+"m"].filter(Boolean).join(" · ");
    setText(arrow,metres<1.5?"•":"↑");
    arrow.style.transform=metres<1.5?"none":`rotate(${angle}deg)`;
  }
  arrow.hidden=!point;setText($(kind+"-distance"),label);
}
function updateLocationGuides(){
  const inside=interiorAt(me.x,me.y);
  const tracked=people.get(trackedPersonId);
  if(!tracked)trackedPersonId=null;
  $("tracked-direction").hidden=!tracked;
  const target=tracked&&guideLocation(tracked.position,inside);
  positionGuidePins(trackPins,target?.point,Boolean(inside));
  if(tracked)showGuide("track",tracked.nickname+" · "+shownPlace(tracked.position),target);
}
function resetLocationGuides(){
  trackedPersonId=null;
  updateLocationGuides();
}

function handCandidates(kind){
  const time=gameTime();
  if(!world||!session||riding||me.seat!=null||me.bus||isCycling(me)||myLink()||feedingLocked(time)||sickLocked(time)||carryingDiningTray(time))return [];
  const umbrella=kind==="umbrella";
  if(umbrella&&(!me.umbrella||!me.umbrellaReady||queuedBus||queuedBike))return [];
  const busy=new Set(links.flatMap(link=>[link.leader,link.follower]));
  const serving=diningService?.tickets??[];
  return [...people.values()].filter(person=>person.available&&(!umbrella||person.avatar.umbrellaReady)&&!busy.has(person.id)&&!diningTray(person.avatar,time)&&
    !serving.some(ticket=>ticket.player===person.id&&ticket.phase==="carrying")&&
    near(me,person.position.x,person.position.y)<=2.4&&handSide(me,{...person.avatar,...person.position})!==0)
    .sort((a,b)=>near(me,a.position.x,a.position.y)-near(me,b.position.x,b.position.y));
}
function updateHandControls(){
  const link=myLink(),umbrella=isUmbrellaLink(link),incoming=link&&!link.active&&link.follower===session.id;
  const other=link&&people.get(link.leader===session.id?link.follower:link.leader);
  const status=$("hand-status"),request=$("hand-offer");
  setActivity("hand",link&&!umbrella&&!incoming?(link.active?"손 놓기":"요청 취소"):
    handCandidates().length?"손잡기":null,Boolean(queuedHand));
  setActivity("share-umbrella",link&&umbrella&&!incoming?(link.active?"같이 쓰기 끝내기":"우산 요청 취소"):
    handCandidates("umbrella").length?"우산 같이 쓰기":null,Boolean(queuedHand));
  request.hidden=!incoming;
  $("hand-accept").disabled=$("hand-decline").disabled=Boolean(queuedHand);
  if(incoming){
    attr(request,"aria-label",umbrella?"우산 같이 쓰기 요청":"손잡기 요청");
    setText($("hand-message"),(other?.nickname||"친구")+(umbrella?" 님이 우산을 같이 쓰자고 했어요.":" 님이 손을 내밀었어요."));
  }
  status.hidden=!link||Boolean(incoming);
  if(link&&!incoming){
    const active=link.leader===session.id?(umbrella?"우산 같이 쓰는 중 · 내가 앞장서요":"손잡고 함께 걷는 중 · 내가 앞장서요"):
      (other?.nickname||"친구")+" 님의 걸음에 맞추는 중";
    setText(status,link.active?active:umbrella?"우산 같이 쓰기 요청을 보냈어요.":"손잡기 요청을 보냈어요.");
  }
  const follower=amFollowingHands();
  sceneWrap.classList.toggle("hand-following",follower);
  $("run").disabled=!world||riding||follower||Boolean(umbrella&&link.active||me.bus||isCycling(me)||queuedBus||queuedBike);
}
function releasePair(link){
  queuedHand={action:"release",id:link.id,...(isUmbrellaLink(link)?{kind:"umbrella"}:{})};
  wakeSync();
}
function openPairOffer(kind){
  if(queuedHand)return;
  const link=myLink();
  if(link){releasePair(link);return;}
  const candidates=handCandidates(kind);
  if(candidates.length===1){offerHand(candidates[0],kind);return;}
  if(!candidates.length)return;
  setText($("hand-title"),kind==="umbrella"?"누구와 우산을 같이 쓸까요?":"누구와 손잡을까요?");
  $("hand-list").replaceChildren(...candidates.map(person=>{
    const button=document.createElement("button");
    button.type="button";button.className="quiet";button.textContent=person.nickname;
    button.style.setProperty("--player-color",hexCoat(person.coat));
    button.addEventListener("click",()=>{
      $("hand-people").close();
      offerHand(handCandidates(kind).find(candidate=>candidate.id===person.id),kind);
    });
    return button;
  }));
  $("hand-people").showModal();
}
$("hand").addEventListener("click",()=>openPairOffer("hand"));
$("share-umbrella").addEventListener("click",()=>openPairOffer("umbrella"));
function offerHand(person,kind){
  if(!person){toast("친구에게 조금 더 가까이 가 주세요.");return;}
  queuedHand={action:"offer",id:token(),peer:person.id,side:handSide(me,{...person.avatar,...person.position}),
    ...(kind==="umbrella"?{kind}:{})};
  wakeSync();
}
$("hand-decline").addEventListener("click",()=>{
  const link=myLink();if(link)releasePair(link);
});
$("hand-accept").addEventListener("click",()=>{
  const link=myLink(),leader=link&&people.get(link.leader);
  const time=gameTime();
  if(!leader||link.active||link.follower!==session.id||queuedHand||feedingLocked(time)||sickLocked(time))return;
  const side=handSide(leader.avatar,me);
  const umbrella=isUmbrellaLink(link);
  if(!side||umbrella&&!me.umbrellaReady){toast(umbrella?"우산을 든 친구에게 조금 더 가까이 가 주세요.":"서로 가까운, 걸을 수 있는 곳에서 손을 잡아 주세요.");return;}
  queuedHand={action:"accept",id:link.id,side,...(umbrella?{kind:"umbrella"}:{})};
  wakeSync();
});

function changeLinks(next){
  const before=myLink(),priorIds=new Set(links.filter(link=>link.active).map(link=>link.id));
  links=queuedHand?.action==="release"?next.filter(link=>link.id!==queuedHand.id):next;
  const current=myLink();
  if(current?.active&&!priorIds.has(current.id)){
    resetInput();stand();
  }
  if(before?.active&&!current?.active)resetInput();
  const activeIds=new Set(links.filter(link=>link.active).map(link=>link.id));
  for(const key of formations.keys())if(!activeIds.has(key))formations.delete(key);
}
function pairedPose(link,leader,follower,now){
  if(!formations.has(link.id))formations.set(link.id,{x:follower.x,y:follower.y,started:now});
  const origin=formations.get(link.id),target=handPosition(leader,link.side);
  const age=Math.min(1,(now-origin.started)/410),blend=age*age*(3-2*age);
  const next={x:origin.x+(target.x-origin.x)*blend,y:origin.y+(target.y-origin.y)*blend,heading:target.heading};
  if(clearSegment(follower,next))return next;
  return {...follower,heading:target.heading};
}

function request(url,body){
  const contentType=isGitHubPages()?"text/plain;charset=UTF-8":"application/json";
  return fetch(gameApiUrl(url),{method:"POST",credentials:"same-origin",headers:{"Content-Type":contentType},body:JSON.stringify(body),signal:AbortSignal.timeout(4500)});
}
function gameTime(now=performance.now()){
  return clockOffset==null?Date.now():Math.round(now+clockOffset);
}
function placeName(point){
  const inside=interiorAt(point.x,point.y);
  if(inside==="museum")return museumGalleryAt(point.x,point.y)?.name??"덕수궁 전시관";
  if(inside===mmcaVenue.id)return mmcaGalleryAt(point.x,point.y)?.name??mmcaVenue.name;
  if(venueById[inside])return venueById[inside].name;
  if(westWalkable(point.x,point.y)&&westRegion(point.x,point.y)==="서울시립미술관")return "서울시립미술관";
  return nearest(point.x,point.y).name;
}
function updateClock(serverTime,sent,received){
  if(!Number.isFinite(serverTime))return;
  const offset=serverTime-(sent+received)/2;
  clockOffset=clockOffset==null?offset:clockOffset+Math.max(-40,Math.min(40,offset-clockOffset))*.14;
  roundTrip+=(received-sent-roundTrip)*.14;
}
function clearSyncTimer(){
  clearTimeout(syncTimer);syncTimer=undefined;syncDue=Infinity;
}
function scheduleSync(delay){
  if(!active||!session||syncInFlight===session)return;
  const due=performance.now()+delay;
  if(syncDue<=due)return;
  clearSyncTimer();syncDue=due;
  syncTimer=setTimeout(()=>{clearSyncTimer();sync();},delay);
}
function movingCadence(){
  if(motionStream.healthy(performance.now()))return 300;
  // Keep busy public rooms from multiplying database traffic as people join.
  // Other walkers predict my motion between reports, so ten updates a second is plenty.
  return session.mode==="open"?110+Math.min(60,Math.max(0,people.size-5)*6):
    90+Math.min(40,Math.max(0,people.size-8)*3);
}
function wakeSync(){
  if(!session||document.hidden||syncFailures)return;
  const command=queuedHand||queuedClink||queuedBus||queuedBike||queuedDining||queuedMinigame||queuedChat||bungeoQueue.length||bowlingQueue.length;
  scheduleSync(Math.max(0,syncStarted+(command?45:movingCadence())-performance.now()));
}
function syncCadence(){
  if(motionStream.healthy(performance.now()))return movingCadence();
  const fast=dirty||myLink()||queuedHand||queuedFeed||queuedChat||queuedBus||queuedBike||seatClaim||moving(me)||me.blocked||
    queuedShow||queuedClink||queuedPhoto||queuedMinigame||queuedPicnic||queuedDining||bungeoQueue.length||arcade.kind||bowlingQueue.length;
  if(fast)return movingCadence();
  for(const {avatar} of people.values())if(moving(avatar)||avatar.blocked)return movingCadence();
  return session.mode==="open"?(people.size?195+Math.min(55,Math.max(0,people.size-5)*5):330):
    (people.size?120:250);
}
async function sync(){
  const visit=session;
  if(!active||!visit||syncInFlight===visit)return;
  advanceBackgroundTrip();
  if(document.hidden)keepCrossingClear(gameTime());
  syncInFlight=visit;
  const sent=performance.now(),hand=queuedHand,claim=seatClaim,feed=queuedFeed,chat=queuedChat;
  const bus=queuedBus,bike=queuedBike;
  const dining=queuedDining,serviceVenue=dining?.venue??currentDining()?.id??(diningService?.self?diningService.venue:undefined);
  const show=queuedShow,clink=queuedClink,photo=queuedPhoto,minigame=queuedMinigame,picnicCommand=queuedPicnic;
  const bungeo=bungeoQueue[0],bungeoWatch=bungeo?.stall??nearbyCookingStall(me)?.id;
  const bowling=bowlingQueue[0],bowlingWatch=Boolean(bowling||interiorAt(me.x,me.y)===ARCADE_SITE.id);
  syncStarted=sent;
  const sincePost=Date.now()-lastPost;
  const arcadePacket=arcade.kind&&arcade.kind!=="bowling"?arcadeSnapshot(arcade.state(sent)):null;
  const arcadeKey=arcadePacket?JSON.stringify(arcadePacket):"";
  const inventory=bagCommand;
  const post=inventory||dirty||hand||claim||feed||chat||bus||bike||show||clink||photo||minigame||picnicCommand||dining||bungeo||bowling||
    sincePost>=3800||sincePost>=125&&arcadeKey!==lastArcadePost;
  const base={room:visit.room,id:visit.id,key:visit.key,
    bikeOffers:isBikeDriver(me)||Boolean(tandemOffer),diningVenue:serviceVenue,...(bungeoWatch?{bungeoWatch}:null),
    ...(bowlingWatch?{bowlingWatch}:null)};
  const avatar=post?{...me,catFriends:passport.friendlyCatIds()}:null;
  if(avatar){delete avatar.bag;delete avatar.plushHead;delete avatar.plushBack;}
  if(avatar&&arcadePacket)avatar.arcade=arcadePacket;
  if(avatar&&claim)Object.assign(avatar,{seat:claim.bench,seatSide:claim.side});
  if(avatar){if(chat)avatar.chat=chat;else delete avatar.chat;}
  if(avatar&&(avatar.wish===lastWishSynced||gameTime(sent)-avatar.wish>=WISH_FLIGHT_MS))delete avatar.wishArt;
  const body=post?{...base,avatar,view:{...ownView},hand,feed,bus,bike,show,clink,photo,minigame,picnic:picnicCommand,dining,inventory,
    ...(bungeo?{bungeo}:null),...(bowling?{bowling}:null)}:base;
  if(post)dirty=false;
  try{
    const response=await request("/api/room",body),data=await response.json();
    if(!active||session!==visit)return;
    if(response.status===409){returnToLobby(data.error);return;}
    if(!response.ok)throw Error(data.error);
    const received=performance.now();
    updateClock(data.serverTime,sent,received);
    setBusYields(data.busYields);
    if(data.weather)environment.liveWeather=data.weather;
    syncFailures=0;
    if(post){lastPost=Date.now();lastWishSynced=avatar.wish;lastArcadePost=arcadeKey;}
    if(queuedHand===hand)queuedHand=null;
    bowlingMatch=bowlingWatch?data.bowling??null:null;
    if(bowling&&bowlingQueue[0]===bowling){
      bowlingQueue.shift();
      if(bowling.action!=="leave"&&(data.bowlingResult?.id!==bowling.id||!data.bowlingResult.accepted)){
        const reason=data.bowlingResult?.reason;
        if(arcade.kind==="bowling")toast(reason==="too-far"?"볼링 레인 가까이에서 다시 시도해 주세요.":
          reason==="not-your-turn"||reason==="rolling"?"공이 멈추고 내 차례가 오면 굴려 주세요.":"볼링에 연결하지 못했어요. 다시 시도해 주세요.");
      }
    }
    const confirmed=data.walkers.find(row=>row.id===visit.id)?.avatar;
    confirmTransport(confirmed,data.transport,bus,bike);
    positionBowler();
    if(tandemOffer?.requester===visit.id&&!data.bikeOffer&&!me.bikeRide&&bike?.action!=="cancelRide"){
      toast("자전거 동승 요청이 끝났어요.");
    }
    tandemOffer=data.bikeOffer??null;
    parkedBikes=data.parkedBikes??[];
    if(chat&&queuedChat===chat){
      queuedChat=null;
      if(confirmed?.chat?.id===chat.id)me.chat=confirmed.chat;
      else{me.chat=null;toast("채팅을 보내지 못했어요. 다시 시도해 주세요.");}
      updateChatSend();
    }
    if(confirmed?.feed&&confirmed.feed.claim!==me.feed?.claim){
      me.feed=confirmed.feed;me.itemUse=confirmed.feed.slot??"item";
      for(const slot of ITEM_SLOTS)me[slot]=confirmed[slot]??null;
      me.gesture=null;me.wave=0;dirty=true;
    }
    if(confirmed?.picnicClaim&&confirmed.picnicClaim!==me.picnicClaim){
      me.picnicClaim=confirmed.picnicClaim;
      for(const slot of ITEM_SLOTS)me[slot]=confirmed[slot]??null;
    }
    receiveBungeo(data,confirmed,bungeo,bungeoWatch);
    if(confirmed?.bagClaim&&confirmed.bagClaim!==me.bagClaim){
      Object.assign(me,belongings(confirmed),{bagClaim:confirmed.bagClaim});
      for(const s of ITEM_SLOTS)me[s]=confirmed[s]??null;
      if(confirmed.bagClaim!==inventory?.id)toast("친구가 손에 선물을 건넸어요.");
      dirty=true;
    }
    if(inventory&&bagCommand===inventory&&data.bagResult?.id===inventory.id&&!data.bagResult.retry){
      bagCommand=null;
      if(data.bagResult.error)toast(data.bagResult.error);
      else if(inventory.action==="prize")toast(ITEMS[inventory.kind].name+"을 가방에 담았어요.");
      else if(inventory.action==="give")toast("친구에게 건넸어요.");
      else if(inventory.action==="collect")toast(ITEMS[inventory.kind].name+"을 가방에 담았어요.");
    }
    walkBag.render();saveBag();
    if(feed&&queuedFeed===feed){
      queuedFeed=null;
      if(confirmed?.feed?.claim!==feed.claim)toast("고양이에게 가까이 다가가 다시 간식을 주세요.");
      else{
        const previous=passport.friendlyCatIds();
        passport.feedCat(confirmed.feed.id,feed.name,confirmed.feed.claim);
        if(passport.friendlyCatIds()!==previous)dirty=true;
      }
    }
    receivePeople(people,data.walkers,visit.id,data.serverTime);
    if(queuedPicnic===picnicCommand)queuedPicnic=null;
    picnic.receive(data.picnics??[],picnicCommand,data.picnicResult);
    if(claim)confirmSeat(claim,confirmed);
    confirmDining(data.dining,dining,serviceVenue);
    const previousLink=myLink();
    changeLinks([...(data.handholds||[]),...(data.umbrellas||[])]);
    if(isUmbrellaLink(previousLink)&&!myLink()&&!hand&&!queuedHand)releasePair(previousLink);
    confirmSocial(data,show,clink);
    confirmRoomPhoto(data.photoSession,photo);
    if(queuedMinigame===minigame)queuedMinigame=null;
    minigames.receive(data.minigames??[],minigame,data.minigameResult,data.minigameFree??[]);
    minigameKiteCuts=data.minigameKiteCuts??[];
    const link=myLink();
    if(hand?.action==="offer"&&!link)toast(hand.kind==="umbrella"?"가까이 있는 친구에게 우산을 같이 쓰자고 다시 요청해 주세요.":"가까이 있는 친구에게 다시 손을 내밀어 주세요.");
    if(hand?.action==="accept"&&!link?.active)toast(hand.kind==="umbrella"?"우산 같이 쓰기 요청이 끝났어요.":"손잡기 요청이 끝났어요. 가까이에서 다시 요청해 주세요.");
    refreshPeopleDialogs();
    setPresence(data.walkers.length+"명 접속 중",data.walkers.length);
  }catch{
    if(!active||session!==visit)return;
    dirty=true;syncFailures++;
    setPresence("다시 연결 중");
    refreshPeopleDialogs();
  }finally{
    if(syncInFlight===visit)syncInFlight=null;
    if(active&&session===visit){
      const delay=document.hidden?1150:syncFailures?Math.min(1500,200*2**Math.min(3,syncFailures-1)):
        Math.max(5,syncCadence()-(performance.now()-sent));
      scheduleSync(delay);
    }
  }
}

function walkPositionKey(name,code){
  const normalized=name.normalize("NFC").trim().replace(/\s+/g," ");
  return "jeongdong-walk-position:v1:"+JSON.stringify([normalized,code||"open"]);
}
function readWalkPosition(name,code){
  try{
    const pose=JSON.parse(localStorage.getItem(walkPositionKey(name,code)));
    if(pose&&[pose.x,pose.y,pose.heading,pose.height].every(Number.isFinite)&&
      pose.heading>=0&&pose.heading<=360&&typeof pose.up==="boolean"){
      // Older saved gallery positions were in the original outdoor coordinate range.
      const galleryY=pose.y+museumInteriorOffsetY;
      return !pose.layout&&isInsideMuseum(pose.x,galleryY)?{...pose,y:galleryY}:pose;
    }
  }catch{}
  return null;
}
function walkPositionHeight(point){
  const loft=loftHeight(point);
  if(point.up&&loft<=0)return null;
  const height=Math.max(platformAt(point.x,point.y),loft);
  return walkable(point.x,point.y,height)?height:null;
}
function rememberWalkPosition(){
  if(!session||!world||riding||me.bus||isCycling(me)||me.seat!=null||
    (me.jump&&gameTime()-me.jump<jumpDuration(me)))return;
  const {x,y,heading}=me,up=Boolean(me.up),height=walkPositionHeight(me);
  if(height===null)return;
  const record=JSON.stringify({x,y,heading,up,height,layout:2});
  if(record===lastWalkPosition)return;
  try{
    localStorage.setItem(walkPositionKey(session.nickname,session.code),record);
    lastWalkPosition=record;
  }catch{}
}
function leaveBeacon(visit=session){
  if(!visit)return;
  const body=JSON.stringify({room:visit.room,id:visit.id,key:visit.key,leave:true});
  if(isGitHubPages()){
    fetch(gameApiUrl("/api/room"),{method:"POST",keepalive:true,credentials:"omit",body}).catch(()=>{});
  }else navigator.sendBeacon("/api/room",body);
}
function toggleInviteForm(open){
  $("invite-form").hidden=!open;
  attr($("invite-toggle"),"aria-expanded",open);
  if(open)joinCode.focus();
}
function showServers(showCode=false){
  entryFlow.hidden=false;gameShell.hidden=true;
  profileStep.hidden=true;serverStep.hidden=false;
  const summary=$("server-profile");
  summary.textContent=nickname.value.trim()+" · "+(me.character==="woman"?"여자":"남자");
  summary.hidden=false;
  $("server-title").focus({preventScroll:true});
  toggleInviteForm(showCode);
}
function showProfile(){
  serverStep.hidden=true;profileStep.hidden=false;
  profileChoices.find(option=>option.value===me.character).checked=true;
  nickname.focus({preventScroll:true});
}
function returnToLobby(message=""){
  saveBag();bagCommand=null;walkBag.close();
  const old=session;
  rememberWalkPosition();
  leaveBeacon();session=null;clearSyncTimer();resetInput();
  queuedHand=queuedFeed=queuedChat=null;people.clear();changeLinks([]);resetLocationGuides();
  queuedBus=queuedBike=lastBusHeading=lastBikeHeading=selectedBus=null;
  tandemOffer=null;$("bike-offer").hidden=true;
  alcoholSip=null;bikeFallHintSeen=false;hideBikeFallTip();
  fountainShow=queuedShow=queuedClink=null;clinks=[];heardClinks.clear();nextShowAudio=0;
  queuedPhoto=roomPhoto=queuedMinigame=queuedPicnic=null;minigames.reset();picnic.reset();photoMode.close();tutorial.close();
  if(bungeoMode)setBungeoCooking(false);
  arcade.stop();
  bowlingQueue.length=0;bowlingMatch=lastBowlingPlace=null;
  bungeoQueue.length=0;clearBungeoState();
  $("bungeo-status").hidden=$("bungeo-order-status").hidden=$("bungeo-hint").hidden=true;
  guestbook.close();diningMenu.close();galleryLight=0;
  queuedDining=diningService=null;$("dining-status").hidden=true;
  minigameKiteCuts=[];
  lastBuskingBeat=-1;umbrellaFolded=false;environment.liveWeather=null;
  parkedBikes=[];
  sound.bus(null);sound.plazaShow(null);sound.rain(0);sound.stream(0);
  busStatus.hidden=true;
  chatInput.value="";composingChat=false;lastChatAt=0;updateChatSend();
  $("invite").disabled=true;
  world?.clearChat();
  clearTransit();
  closeActionMenus();mobileSettings.open=false;clearMapRoute();setMap(false);
  if(gameShell.classList.contains("game-fullscreen"))void leaveFullscreen();
  $("lobby-status").textContent=message;
  sessionStorage.removeItem("jeongdong-room-mode");
  sessionStorage.removeItem("jeongdong-room-code");
  if(old)joinCode.value=old.code??"";
  history.replaceState(null,"",location.pathname+location.search);
  document.querySelectorAll("dialog[open]").forEach(dialog=>dialog.close());
  hideCatRunTip();showServers();
  setPresence("방을 선택해 주세요");
}
async function enterRoom(action,code){
  if(joining)return;
  const name=nickname.value.trim();
  if(!name||[...name].length>16){
    showProfile();$("profile-status").textContent="닉네임은 1~16자로 입력해 주세요.";return;
  }
  joining=true;serverButtons.forEach(button=>{button.disabled=true;});
  $("lobby-status").textContent="산책방에 들어가는 중이에요.";
  const id=token(),key=token(),avatar=initialAvatar(),view=initialView();
  Object.assign(avatar,readBag(name));lastBagSave="";
  const angle=parseInt(id.slice(0,8),16)/0x100000000*Math.PI*2;
  const offset=.38+parseInt(id.slice(8,12),16)/0x10000*.67;
  avatar.x+=Math.cos(angle)*offset;avatar.y+=Math.sin(angle)*offset;
  const navigation=pageVersion;
  const saved=action==="create"?null:readWalkPosition(name,code);
  try{
    // Complete collision registration before announcing a restored position to the room.
    if(saved&&!world)await loadWorld();
    if(!active||navigation!==pageVersion)return;
    const height=saved&&world?walkPositionHeight(saved):null;
    const resumed=height!==null&&Math.abs(height-saved.height)<.05;
    if(resumed){
      const {x,y,heading,up}=saved;
      Object.assign(avatar,{x,y,heading,up});
      view.pan=heading;
    }
    const sent=performance.now();
    const response=await request("/api/rooms",{action,code,nickname:name,id,key,avatar,view}),data=await response.json();
    if(!active||navigation!==pageVersion){
      if(response.ok)leaveBeacon({room:data.room,id,key});
      return;
    }
    if(!response.ok)throw Error(data.error);
    clockOffset=null;roundTrip=65;
    setBusYields(data.busYields);
    updateClock(data.serverTime,sent,performance.now());
    session={room:data.room,code:data.code,mode:data.mode??"private",id,key,...data.profile};
    world?.setVisitorRoom(session.room);
    environment.liveWeather=data.weather??null;passport.setRoom(session.room);
    Object.assign(me,avatar,{nickname:session.nickname,coat:session.coat});
    ownView=view;dirty=true;lastWishSynced=0;lastArcadePost="";lastPost=Date.now();
    lastWalkPosition=null;walkPositionAt=0;
    updateChatSend();
    syncStarted=-Infinity;syncFailures=0;
    people.clear();links=[];formations.clear();resetLocationGuides();resetInput();
    $("location").textContent=resumed?placeName(me):ticketApproach.name;
    localStorage.setItem("jeongdong-nickname",session.nickname);
    sessionStorage.setItem("jeongdong-room-mode",session.mode);
    if(session.code)sessionStorage.setItem("jeongdong-room-code",session.code);
    else sessionStorage.removeItem("jeongdong-room-code");
    history.replaceState(null,"",location.pathname+location.search+(session.code?"#code="+session.code:""));
    $("invite").disabled=false;
    $("invite").hidden=session.mode==="open";
    $("lobby-status").textContent="";entryFlow.hidden=true;gameShell.hidden=false;
    world?.parkLife.setSeed(session.room);
    world?.parkLife.resetInteractions();
    world?.birds.setSeed(session.room);
    if(!saved)loadWorld();
    focusGame();
    if(resumed)toast("마지막으로 걷던 곳에서 이어 걸어요.");
    if(action==="create")openInvite();
    scheduleSync(0);
  }catch(error){
    $("lobby-status").textContent=error.message==="Failed to fetch"?"연결을 확인한 뒤 다시 시도해 주세요.":error.message;
  }finally{
    joining=false;serverButtons.forEach(button=>{button.disabled=false;});
  }
}
$("profile-form").addEventListener("submit",event=>{
  event.preventDefault();
  const name=nickname.value.trim();
  if(!name||[...name].length>16){
    $("profile-status").textContent="닉네임은 1~16자로 입력해 주세요.";nickname.focus();return;
  }
  const character=profileChoices.find(option=>option.checked)?.value;
  if(!character){$("profile-status").textContent="캐릭터를 골라 주세요.";return;}
  $("profile-status").textContent="";localStorage.setItem("jeongdong-nickname",name);
  chooseCharacter(character);
  showServers(Boolean(joinCode.value));
});
$("open-server").addEventListener("click",()=>enterRoom("open"));
$("create-room").addEventListener("click",()=>enterRoom("create"));
$("server-back").addEventListener("click",showProfile);
$("invite-toggle").addEventListener("click",()=>toggleInviteForm($("invite-form").hidden));
$("invite-form").addEventListener("submit",event=>{
  event.preventDefault();enterRoom("join",joinCode.value.trim().toUpperCase());
});
joinCode.addEventListener("input",()=>{joinCode.value=joinCode.value.toUpperCase();});
function openInvite(){
  if(!session?.code)return;
  mobileSettings.open=false;
  $("invite-code").value=session.code;$("invite-dialog").showModal();
}
$("invite").addEventListener("click",openInvite);
const leaveDialog=$("leave-save-dialog"),leaveStatus=$("leave-save-status");
const leaveActions=["leave-save-confirm","leave-without-save","leave-save-cancel"].map($);
let savingLeave=null;
function setLeaveBusy(busy){
  for(const button of leaveActions)button.disabled=busy;
}
function requestLeave(){
  if(!session||leaveDialog.open)return;
  resetInput();mobileSettings.open=false;
  setLeaveBusy(false);setText(leaveStatus,"");
  leaveDialog.showModal();
  $("leave-save-cancel").focus({preventScroll:true});
}
for(const id of ["settings-leave","leave-room"])$(id).addEventListener("click",requestLeave);
$("leave-save-cancel").addEventListener("click",()=>leaveDialog.close());
leaveDialog.addEventListener("cancel",event=>{if(savingLeave&&savingLeave===session)event.preventDefault();});
$("leave-without-save").addEventListener("click",()=>{if(session&&savingLeave!==session)returnToLobby();});
$("leave-save-confirm").addEventListener("click",async()=>{
  const visit=session;
  if(!visit||!leaveDialog.open||savingLeave===visit)return;
  savingLeave=visit;
  setLeaveBusy(true);setText(leaveStatus,"산책 기록을 저장하고 있어요.");
  try{
    await Promise.allSettled(photoWrites);
    if(session!==visit||!leaveDialog.open)return;
    const code=await passport.saveRecord((done,total)=>{
      if(total&&session===visit&&leaveDialog.open)setText(leaveStatus,`사진 저장 중 · ${done} / ${total}`);
    });
    if(session!==visit||!leaveDialog.open)return;
    returnToLobby("산책 기록을 저장했어요.");
    passport.showSavedCode(code);
  }catch(error){
    if(session===visit&&leaveDialog.open){
      const message=error instanceof TypeError||error.name==="TimeoutError"?
        "연결을 확인한 뒤 다시 저장해 주세요.":error.message||"산책 기록을 저장하지 못했어요.";
      setText(leaveStatus,message);
    }
  }finally{
    if(savingLeave===visit){savingLeave=null;setLeaveBusy(false);}
  }
});
async function copyInvite(link){
  if(!session?.code)return;
  const value=link?location.origin+location.pathname+"#code="+session.code:session.code;
  try{
    await navigator.clipboard.writeText(value);toast(link?"초대 링크를 복사했어요.":"초대코드를 복사했어요.");
  }catch{
    $("invite-code").select();toast("선택한 초대코드를 복사해 주세요.");
  }
}
$("copy").addEventListener("click",()=>copyInvite(false));
$("copy-link").addEventListener("click",()=>copyInvite(true));
document.querySelectorAll("dialog .close").forEach(button=>button.addEventListener("click",()=>button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(dialog=>dialog.addEventListener("close",()=>{
  if(session&&document.activeElement===document.body)focusGame();
}));
$("model-credits").addEventListener("click",()=>$("credits-dialog").showModal());
window.addEventListener("pagehide",()=>{
  saveBag();
  rememberWalkPosition();
  active=false;pageVersion++;clearSyncTimer();sound.bus(null);sound.plazaShow(null);sound.rain(0);sound.stream(0);leaveBeacon();
});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){beginBackgroundTrip();rememberWalkPosition();clearManualInput();exitPress=null;sound.bus(null);sound.plazaShow(null);sound.rain(0);sound.stream(0);}
  else finishBackgroundTrip();
  clearSyncTimer();scheduleSync(document.hidden?1150:0);
});
window.addEventListener("online",()=>{if(!document.hidden)scheduleSync(0);});
window.addEventListener("pageshow",event=>{
  if(!event.persisted)return;
  active=true;
  if(session){const {code,mode}=session;returnToLobby();enterRoom(mode==="open"?"open":"join",code);}
});

function markPace(){
  $("run").setAttribute("aria-pressed",String(runToggled));$("run").firstChild.textContent=runToggled?"걷기 ":"달리기 ";
}
$("run").addEventListener("click",()=>{
  if(amFollowingHands()||sharingUmbrella()||me.bus||isCycling(me))return;
  runToggled=!runToggled;markPace();$("game").focus({preventScroll:true});
});
function jump(){
  const time=gameTime();
  if(!session||!world||bungeoMode||arcade.kind||riding||me.bus||isCycling(me)||queuedBus||queuedBike||sharingUmbrella()||feedingLocked(time)||clinkLocked(time)||sickLocked(time)||carryingDiningTray(time)||mealBiteLocked(time)||time-me.jump<jumpDuration(me))return;
  if(pendingSeat)course=[];
  pendingSeat=seatClaim=null;stand();
  rememberWalkPosition();
  jumpBase=standingHeight();
  me.vaultBase=jumpBase<.65&&nearWoldaeRailing(me)?jumpBase:null;
  me.jump=time;dirty=true;wakeSync();focusGame();
}
$("jump").addEventListener("click",jump);
function stand(){if(me.seat!=null||me.groundSit){me.groundSit=false;me.seat=me.seatSide=null;dirty=true;}}
function benchNearby(){
  let choice=null,nearby=false,gap=3.8;
  world?.benches.forEach((bench,index)=>{
    if(near(bench,me.x,me.y)>5)return;
    if(bench.footBath&&(cheonggyeLevel(me)??0)>-3.28)return;
    bench.slots.forEach((slot,side)=>{
      const distance=near(slot.approach,me.x,me.y);
      if(distance>=3.8||!walkable(slot.approach.x,slot.approach.y))return;
      nearby=true;
      if(distance>=gap)return;
      for(const {avatar} of people.values()){
        if(avatar.seat===index&&(avatar.seatSide??0)===side)return;
      }
      choice={bench:index,side,approach:slot.approach,footBath:slot.footBath};gap=distance;
    });
  });
  return {choice,nearby};
}
function confirmSeat(claim,avatar){
  if(seatClaim!==claim){dirty=true;return;}
  seatClaim=null;
  const slot=avatar?.seat===claim.bench&&world.benches[claim.bench]?.slots[avatar.seatSide??0];
  if(!slot||!walkable(slot.approach.x,slot.approach.y)){
    dirty=true;toast(claim.footBath?"물가에 빈자리가 없어요.":"벤치에 빈자리가 없어요.");return;
  }
  rememberWalkPosition();
  Object.assign(me,slot.approach,{seat:claim.bench,seatSide:avatar.seatSide??0,heading:slot.heading});
  dirty=true;
}
function interactBench(){
  if(me.bus||isCycling(me)||queuedBus||queuedBike||myLink()?.active||pendingSeat||seatClaim||mealBiteLocked(gameTime()))return;
  if(me.seat!=null){stand();return;}
  const {choice}=benchNearby();
  if(choice)walkTo(choice.approach,choice);
}
$("sit").addEventListener("click",interactBench);
// A burst of kicking for feet that are resting in the stream.
$("foot-kick").addEventListener("click",()=>{
  const time=gameTime();
  if(!session||!bathing()||footKickAge(me,time)!=null)return;
  me.kick=time;dirty=true;wakeSync();focusGame();
});
function setMap(open){
  const overlay=mobileHeader.matches||gameShell.classList.contains("game-fullscreen");
  const restoreFocus=!open&&overlay&&$("map-panel").contains(document.activeElement);
  if(open){mobileSettings.open=false;closeActionMenus();}
  $("map-panel").classList.toggle("expanded",open);
  $("map-toggle").setAttribute("aria-expanded",String(open));
  if(!open){clearMapGestures();if(!mapRoute)setOverview(false);}
  else if(mapRoute&&!mapRoute.walking&&near(mapRoute.start,me.x,me.y)>5)refreshMapRoute();
  if(open&&overlay)$("world").focus({preventScroll:true});
  if(restoreFocus)$("map-toggle").focus({preventScroll:true});
}
$("map-toggle").addEventListener("click",()=>setMap($("map-toggle").getAttribute("aria-expanded")!=="true"));
$("close-map").addEventListener("click",()=>setMap(false));
function walkingSteps(target){
  const feet=feetHeight(gameTime());
  const deckExits=cheonggyeDeckExits(me);
  if(deckExits){
    if(cheonggyeDeckStep(me,target.x,target.y)?.up&&cheonggyeDeckExits({...target,up:true})?.[0].x===deckExits[0].x)return [target];
    for(const exit of deckExits.sort((a,b)=>near(a,me.x,me.y)+near(a,target.x,target.y)-near(b,me.x,me.y)-near(b,target.x,target.y))){
      const steps=planWalk(exit,target,feet);
      if(steps.length)return [exit,...steps];
    }
    return [];
  }
  // Upstairs there is no route grid: head straight for the spot and let each step be checked.
  const aloft=me.up||loftStair(me.x,me.y)!=null;
  return aloft?[target]:planWalk(me,target,feet);
}
// The palace ponds are not entered. A walker whose saved place is out in one of them is set
// back on the nearest bank.
function leaveWater(){
  if(!session||riding||me.bus||isCycling(me)||!gyeongbokWater(me.x,me.y))return;
  for(let radius=1;radius<90;radius++)for(let i=0;i<24;i++){
    const angle=i*Math.PI/12,x=me.x+Math.cos(angle)*radius,y=me.y+Math.sin(angle)*radius;
    if(!walkable(x,y))continue;
    Object.assign(me,{x,y,vx:0,vy:0});dirty=true;return;
  }
}
function canWalkTo(){
  const time=gameTime();
  return Boolean(session&&!bungeoMode&&!arcade.frozen&&!riding&&!me.bus&&!isBikePassenger(me)&&!queuedBus&&!queuedBike&&!amFollowingHands()&&
    !clinkLocked(time)&&!sickLocked(time)&&(world||worldFailed));
}
function walkTo(target,seat=null){
  if(!target||!canWalkTo())return;
  stand();
  const steps=walkingSteps(target);
  if(!steps.length){toast("걸을 수 있는 길을 터치해 주세요.");return;}
  course=steps;seatClaim=null;pendingSeat=seat;
}
function busShortcut(id,label){
  const stop=busStopById(id);
  return {label,aria:`${stop.name}으로 순간이동`,...stop.board,name:stop.name};
}
const jeongdongFountainApproach={x:fountain.x+4.8,y:fountain.y+5.3};
const mapDestinations=[
  {...westSites[0],...semaVenue.outsideDoor,label:"시립미술관",aria:"서울시립미술관 입구로 순간이동"},

  {label:"중화전",aria:"중화전으로 순간이동",...court,heading:normalize(Math.atan2(hall.x-court.x,court.y-hall.y)*180/Math.PI)},
  {label:"교통편",aria:"시청역 2번 출구로 순간이동",...cityHallStation.arrive,name:cityHallStation.name},
  busShortcut("deoksugung","정류장")
];
const plazaDestinations=[
  {label:"광화문역",aria:"광화문역으로 순간이동",...plazaShortcuts.station},
  {label:"이순신",aria:"이순신장군 동상으로 순간이동",...plazaShortcuts.yi},
  {label:"세종대왕",aria:"세종대왕 동상으로 순간이동",...plazaShortcuts.sejong},
  {label:"광화문 앞",aria:"광화문 앞으로 순간이동",...plazaShortcuts.north},
  busShortcut("plaza-south","정류장"),
  {...plazaSites.sejongPark,label:"세종로공원",heading:315}
];
const gyeongbokDestinations=[...gbShortcuts.slice(0,3),busShortcut("gyeongbokgung","정류장"),
  {...uijeongbuEntry,label:"의정부지",heading:30}];
const hwangudanDestinations=[
  ...hwangudanLandmarks.slice(0,2).map(point=>({...point,label:point.name,aria:point.name+"로 순간이동"})),
  busShortcut("seoul-plaza","정류장")
];
const angukExit=transitStops.find(stop=>stop.id==="anguk-exit-1");
const cheonggyeDestinations=[{...cheonggyeLandmarks[0],label:"청계광장",heading:90},
  {...cheonggyeLandmarks.at(-1),label:"광교",heading:270},busShortcut("cheonggye-north","정류장")];
const songhyeonDestinations=[{...songhyeonLandmarks[0],label:"송현광장"},
  {...songhyeonLandmarks[1],label:"율곡로 입구"},{...songhyeonLandmarks[2],label:"감고당길 입구"},
  busShortcut("songhyeon-north","정류장")];
const localDestinations={"덕수궁":mapDestinations,"광화문광장":plazaDestinations,"경복궁":gyeongbokDestinations,
  "북촌":[bukchonAlleyShortcut,busShortcut("bukchon-terminal","돌계단길 정류장"),
    {...angukExit.arrive,label:"안국역",name:angukExit.name,aria:"안국역 1번 출구로 순간이동"},
    {...mmcaVenue.outsideDoor,label:"국현미",name:mmcaVenue.name,aria:"국립현대미술관 입구로 순간이동"}],"환구단":hwangudanDestinations,
  "청계천":cheonggyeDestinations,"열린송현녹지광장":songhyeonDestinations,
  "정동길":[...westSites.slice(1,3),busShortcut("history-west","박물관 정류장")],"경희궁":[...westSites.slice(2),busShortcut("heunghwa-west","흥화문 정류장")]};
const shortcutRegion=document.createElement("select");
shortcutRegion.id="shortcut-region";
shortcutRegion.className="quiet";
shortcutRegion.setAttribute("aria-label","순간이동 구역");
shortcutRegion.add(new Option("현재 구역",""));
for(const region of Object.keys(localDestinations))shortcutRegion.add(new Option(region==="열린송현녹지광장"?"열린송현":region,region));
$("model-credits").after(shortcutRegion);
const shortcutButtons=Array.from(document.querySelectorAll('#map-links [data-shortcut]'));
const extraShortcut=document.createElement("button");
extraShortcut.type="button";
extraShortcut.className="quiet";
extraShortcut.hidden=true;
$("map-links").append(extraShortcut);
shortcutButtons.push(extraShortcut);
const shortcutsHere=()=>localDestinations[shortcutRegion.value||outdoorMap(me)]??mapDestinations;
let shownShortcuts=null;
function refreshShortcuts(){
  const shortcuts=shortcutsHere();
  if(shortcuts===shownShortcuts)return;
  shownShortcuts=shortcuts;
  // A map may offer fewer shortcuts than there are buttons; the spare ones stay hidden.
  shortcutButtons.forEach((button,index)=>{
    const shortcut=shortcuts[index];
    button.hidden=!shortcut;
    if(!shortcut)return;
    button.textContent=shortcut.label;
    button.setAttribute("aria-label",shortcut.aria??shortcut.name+"으로 순간이동");
  });
}
shortcutRegion.addEventListener("change",refreshShortcuts);
shortcutButtons.forEach((button,index)=>button.addEventListener("click",()=>{
  const destination=shortcutsHere()[index];
  if(!session||riding||clinkLocked(gameTime())||!destination)return;
  const feet=platformAt(destination.x,destination.y)+stepUp;
  if(!walkable(destination.x,destination.y,feet))return;
  if(me.bus||isCycling(me)||queuedBus||queuedBike){
    toast(isCycling(me)?"따릉이에서 내린 뒤 순간이동할 수 있어요.":"버스에서 내린 뒤 순간이동할 수 있어요.");return;
  }
  const linkId=myLink()?.id??(queuedHand?.action==="offer"?queuedHand.id:null);
  if(linkId){queuedHand={action:"release",id:linkId};changeLinks(links);}
  movePlayerTo(destination,destination.name);
  shortcutRegion.value="";
  refreshShortcuts();
  setMap(false);focusGame();
}));

const joystick=$("joystick");
function beginManualMove(){
  manualInputAt=performance.now();
  course=[];pendingSeat=seatClaim=null;
}
function moveThumb(event){
  const rect=joystick.getBoundingClientRect();
  const radius=Math.min(rect.width,rect.height)*.30;
  const dx=(event.clientX-rect.left-rect.width/2)/radius;
  const dy=(event.clientY-rect.top-rect.height/2)/radius;
  const magnitude=Math.hypot(dx,dy),limit=Math.max(1,magnitude);
  const pace=Math.max(0,(Math.min(1,magnitude)-.12)/.88);
  thumb=magnitude?[dx/magnitude*pace,dy/magnitude*pace]:[0,0];
  joystick.style.setProperty("--jx",dx/limit*radius+"px");joystick.style.setProperty("--jy",dy/limit*radius+"px");
}
joystick.addEventListener("pointerdown",event=>{
  event.stopPropagation();
  if(event.button!==0||amFollowingHands()||isBikePassenger(me)&&!photoMode.camera)return;
  // A fresh primary press can replace a touch whose release was lost outside the page.
  if(thumbId!==undefined){
    if(!event.isPrimary)return;
    releaseThumb();
  }
  event.preventDefault();
  thumbId=event.pointerId;beginManualMove();
  $("game").focus({preventScroll:true});
  try{joystick.setPointerCapture(thumbId);}catch{/* Window listeners also handle uncaptured touches. */}
  moveThumb(event);
});
window.addEventListener("pointermove",event=>{
  if(event.pointerId!==thumbId)return;
  if(event.pointerType==="mouse"&&!(event.buttons&1))releaseThumb();
  else moveThumb(event);
},{capture:true,passive:true});
function releaseThumb(){
  const id=thumbId;
  thumbId=undefined;thumb=[0,0];
  joystick.style.setProperty("--jx","0px");joystick.style.setProperty("--jy","0px");
  if(id!==undefined&&joystick.hasPointerCapture(id))joystick.releasePointerCapture(id);
}
const finishThumb=event=>{if(event.pointerId===thumbId)releaseThumb();};
for(const type of ["pointerup","pointercancel"])window.addEventListener(type,finishThumb,true);
joystick.addEventListener("lostpointercapture",finishThumb);
function clearManualInput(){keys.clear();shiftHeld=false;releaseThumb();clearSceneTouch();}
function resetInput(){backgroundTrip=null;clearManualInput();course=[];pendingSeat=seatClaim=null;}
function beginBackgroundTrip(){
  if(backgroundTrip||!session||!world||riding||photoMode.camera||me.bus||me.seat!=null||isBikePassenger(me)||amFollowingHands()||
    arcade.frozen||bungeoMode||(!keys.size&&thumbId===undefined&&!course.length))return;
  let [x,y]=Array.from(keys,key=>vectors[key]).reduce(([x,y],[vx,vy])=>[x+vx,y+vy],thumb);
  if(x||y){
    const angle=document.activeElement===$("world")&&thumbId===undefined?0:ownView.pan*Math.PI/180;
    [x,y]=[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
  }
  backgroundTrip={x,y,run:shiftHeld||runToggled,at:Date.now()};
}
function advanceBackgroundTrip(){
  const trip=backgroundTrip;
  if(!trip)return false;
  const now=Date.now(),seconds=Math.max(0,(now-trip.at)/1000);trip.at=now;
  const clock=gameTime(),link=myLink();
  if(!session||!active||me.bus||me.seat!=null||isBikePassenger(me)||riding||queuedBike||queuedBus||
    amFollowingHands()||feedingLocked(clock)||clinkLocked(clock)||sickLocked(clock)||mealBiteLocked(clock)){
    backgroundTrip=null;return false;
  }
  const speed=isBikeDriver(me)?9.4:trip.run&&!isUmbrellaLink(link)?6.675:2.58;
  // A straight walk must hit the edge of this world within its diagonal.
  // A tapped route has a finite list of destinations, even after a long suspension.
  let remaining=Math.min(seconds*speed,course.length?Infinity:3000),moved=false;
  while(remaining>.0001){
    const step=Math.min(.42,remaining),x=me.x,y=me.y;
    if(trip.x||trip.y)moveWithInput(trip.x,trip.y,step,link,false);
    else if(course.length)walkCourse(step);
    else{backgroundTrip=null;break;}
    const distance=near(me,x,y);
    if(distance<.00001){
      if(!(trip.x||trip.y)&&course.length){remaining-=step;continue;}
      backgroundTrip=null;break;
    }
    moved=true;remaining-=distance;
    if(isBikeDriver(me)&&me.blushUntil>clock&&Math.random()<bikeFallChance(me,clock,distance)){
      queuedBike={action:"fall"};resetInput();break;
    }
  }
  if(moved||!backgroundTrip){
    const movingNow=Boolean(backgroundTrip&&(trip.x||trip.y||course.length)),angle=me.heading*Math.PI/180;
    Object.assign(me,{vx:movingNow?speed*Math.sin(angle):0,vy:movingNow?-speed*Math.cos(angle):0,running:movingNow&&trip.run&&!isBikeDriver(me)});
    dirty=true;
  }
  return moved;
}
function finishBackgroundTrip(){
  if(backgroundTrip){advanceBackgroundTrip();backgroundTrip=null;dirty=true;wakeSync();}
}
window.addEventListener("blur",()=>{beginBackgroundTrip();clearManualInput();});
window.addEventListener("focus",finishBackgroundTrip);
window.addEventListener("blur",arcade.clear);
window.addEventListener("keydown",event=>{
  if(event.target.closest("dialog"))return;
  if(arcade.keyDown(event))return;
  if(event.key==="Escape"){
    if(bungeoMode){setBungeoCooking(false);return;}
    if(photoMode.camera){photoMode.close();return;}
    if(mobileSettings.open){
      mobileSettings.open=false;mobileSettings.querySelector("summary").focus();return;
    }
    if(!$("gesture-menu").hidden){setGestures(false);$("gesture-open").focus();return;}
    if(nearbyControls.close(true)||peerControls.close(true))return;
    if($("map-panel").classList.contains("expanded")){setMap(false);return;}
    if(fullscreenFallback){void leaveFullscreen();return;}
    setMap(false);setEmotes(false);
  }
  if(!session||riding||nearbyControls.ownsFocus()||peerControls.ownsFocus()||event.target.closest("input,select,#mobile-settings"))return;
  if(photoMode.camera&&event.key==="Enter"&&event.target===$("game")){
    event.preventDefault();
    if(!event.repeat){
      photoMode.toggleTools();
      if(!$("photo-controls").hidden)$("photo-exit").focus({preventScroll:true});
    }
    return;
  }
  if(bungeoMode){
    if(!event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&useCookingShortcut(event.code))event.preventDefault();
    return;
  }
  if(event.code==="Space"&&!photoMode.camera&&!event.target.closest("button,a")&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
    event.preventDefault();if(!event.repeat)jump();return;
  }
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(event.key==="Shift")shiftHeld=true;
  if(!photoMode.camera&&key==="f"&&!event.repeat&&!$("sit").hidden){interactBench();return;}
  if(!photoMode.camera&&key==="e"&&!event.repeat&&!$("wish").disabled){openWish();return;}
  if(!vectors[key]||event.ctrlKey||event.metaKey||event.altKey)return;
  event.preventDefault();
  if(!photoMode.camera&&(amFollowingHands()||isBikePassenger(me)))return;
  beginManualMove();keys.add(key);
});
window.addEventListener("keyup",event=>{
  arcade.keyUp(event);
  if(event.key==="Shift")shiftHeld=false;
  keys.delete(event.key.length===1?event.key.toLowerCase():event.key);
});
function walkFromMap(event,source=event.target){
  const site=mapPlaces[Number(source.closest("[data-map-place]")?.dataset.mapPlace)];
  if(site){showMapRoute(site,{fit:false});return;}
  const stamp=stampById.get(source.closest("[data-stamp-id]")?.dataset.stampId);
  if(stamp){showMapRoute(stamp);return;}
  const target=source.closest("[data-walk-x]"),matrix=$("world").getScreenCTM();
  if(!matrix)return;
  const point=target?{x:Number(target.dataset.walkX),y:Number(target.dataset.walkY)}:
    new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
  walkTo(point);setMap(false);
}
$("world").addEventListener("click",walkFromMap);
$("world").addEventListener("keydown",event=>{
  if(!["Enter"," "].includes(event.key)||!event.target.matches("[data-map-place],[data-stamp-id]"))return;
  event.preventDefault();event.stopPropagation();walkFromMap(event);
});
const clearSceneTouch=bindSceneTouch($("game"),gameShell,{
  allowHeldTap:()=>Boolean(photoMode.camera),
  canTap:started=>Boolean(session&&(photoMode.camera||thumbId===undefined&&!keys.size&&started>manualInputAt)),
  onBegin:()=>{setEmotes(false);focusGame();},
  onTap:(x,y)=>{
    if(photoMode.camera){photoMode.toggleTools();return;}
    if(arcade.kind==="mole"){arcade.strikeMole(world?.pickMole(x,y));return;}
    if(bungeoMode){
      useCookingTarget(world?.pickBungeo(x,y,bungeoMode.stall));
      return;
    }
    if(arcade.kind==="baseball"){arcade.aimBaseball(world?.pickBaseballAim(x,y));return;}
    if(isClassic(arcade.kind)){arcade.tapClassic(world?.pickClassicTap(x,y,arcade.kind));return;}
    if(arcade.frozen)return;
    const target=world?.pick(x,y);
    if(target?.guide&&nearVisitorGuide())openVisitorGuide();
    else walkTo(target);
  },
  onDrag:(dx,dy,x,y)=>{
    if(bungeoMode||arcade.kind==="pump"||arcade.kind==="mole")return;
    if(photoMode.camera){photoMode.drag(dx,dy);return;}
    if(arcade.kind==="baseball"){arcade.aimBaseball(world?.pickBaseballAim(x,y));return;}
    if(isClassic(arcade.kind)){arcade.tapClassic(world?.pickClassicTap(x,y,arcade.kind),true);return;}
    if(arcade.frozen){adjustArcadeAim(dx*.34,dy*.26);return;}
    ownView={...ownView,pan:normalize(ownView.pan+dx*.34),
      tilt:Math.max(-87,Math.min(firstPerson?65:48,ownView.tilt+dy*.26))};
    dirty=true;
  },
  onPinch:delta=>{if(!bungeoMode&&(!arcade.frozen||arcade.kind==="claw"))adjustZoom(delta);},
  onTwoFingerPan:(dx,dy)=>{
    if(photoMode.camera)photoMode.move(-dx,-dy,Math.hypot(dx,dy)*.005);
  }
});

// Absolute height of my feet while airborne or perched on a low structure. On plain ground it
// stays 0 so kerbs, benches and railings block as usual until I jump.
const stepUp=.19;
function standingHeight(){
  const terrain=interiorAt(me.x,me.y)?0:outsideGroundOffset(me);
  return Math.max((world?.groundHeight(me)??terrain)-terrain,platformAt(me.x,me.y));
}
function feetHeight(time){
  const lift=jumpLift(me,time),platform=Math.max(platformAt(me.x,me.y),loftHeight(me));
  // A jump rises from where it started; landing on something lower or level ends it there.
  // On foot a walker still climbs anything a step high, which is what makes stone stairs work.
  return lift?Math.max(jumpBase+lift,platform):platform+stepUp;
}
let lastCrossingNotice=-Infinity,trafficCheck=0;
function crossingNotice(now,message){
  if(now-lastCrossingNotice>4500){toast(message);lastCrossingNotice=now;}
}
function trafficAtPlayer(p,time){
  if(!world||me.up||me.bus||me.seat!=null||isBikePassenger(me)||interiorAt(p.x,p.y))return null;
  const hit=approachingTraffic(p,time);
  return hit&&Math.abs(world.groundHeight(p)-world.groundHeight(hit.bus))<1.8?hit:null;
}
function keepCrossingClear(time){
  if(time<trafficCheck||!world||amFollowingHands())return;
  trafficCheck=time+100;
  const hit=trafficAtPlayer(me,time);
  if(!hit)return;
  if(clearingLane(hit,me.vx||0,me.vy||0))return;
  if(!hit.imminent){crossingNotice(time,"버스가 다가와요. 건너던 방향으로 계속 이동해 주세요.");return;}
  const safe=sidewalkRefuge(me,hit.bus,q=>walkable(q.x,q.y)&&clearSegment(me,q,.32,.19)&&!approachingTraffic(q,time));
  if(!safe)return;
  resetInput();Object.assign(me,safe,{vx:0,vy:0,blocked:false,running:false});dirty=true;wakeSync();
  toast("버스 통과를 위해 차로 밖으로 이동했어요.");
}
function move(x,y){
  if(!session||me.bus||isBikePassenger(me)||queuedBus||queuedBike||(x===me.x&&y===me.y))return false;
  const time=gameTime(),traffic=trafficAtPlayer({x,y},time);
  if(traffic&&!trafficAtPlayer(me,time)){
    crossingNotice(time,"버스가 지나간 뒤 건너 주세요.");return false;
  }
  // Stairs and upper floors follow their own rules; everywhere else the ground decides.
  const bridge=cheonggyeDeckStep(me,x,y);
  const loft=bridge===undefined?loftStep(me,x,y):bridge;
  if(isBikeDriver(me)){
    if(loft!==undefined||!canRideBikeSegment(me,{x,y}))return false;
  }else if(loft===null||loft===undefined&&!clearSegment(me,{x,y},.36,feetHeight(gameTime())))return false;
  const aim=normalize(Math.atan2(x-me.x,me.y-y)*180/Math.PI);
  const link=myLink();
  const heading=link?.active?normalize(me.heading+angleDelta(me.heading,aim)*.26):aim;
  if(link?.active&&!loft&&!pairFits(me,{x,y,heading},link.side))return false;
  stand();Object.assign(me,{x,y,heading,up:Boolean(loft?.up)});
  dirty=true;return true;
}
function nearWishFountain(){
  // Lanterns rise from the Jeongdong fountain and from the pond around Hyangwonjeong.
  return Boolean(world&&session&&me.seat==null&&!me.bus&&!isCycling(me)&&
    (near(fountain,me.x,me.y)<13||near(wishPond,me.x,me.y)<wishPond.reach));
}
const wishDrawing=makeWishDrawing(art=>{
  const time=gameTime();
  const message=!nearWishFountain()?"정동 분수나 향원정 연못 가까이에서 소원등을 날릴 수 있어요.":
    time-me.wish<2800?"잠시 뒤에 다시 날려 주세요.":"";
  const status=$("wish-status");
  status.textContent=message;status.hidden=!message;
  if(message)return false;
  me.wish=time;me.wishOrigin={x:me.x,y:me.y};
  me.wishHeading=normalize(ownView.pan);
  me.wishArt=art?.some(Boolean)?art:null;
  dirty=true;toast("소원등을 띄웠어요.");
});
let lastScene=null;
const photoWrites=new Set();
function canMovePhoto(point){
  const inside=interiorAt(me.x,me.y);
  return interiorAt(point.x,point.y)===inside&&(!inside||point.height<=4.4)&&
    near(me,point.x,point.y)<=PHOTO_REACH&&
    !solidAt(point.x,point.y,(world?.floorHeight(point)??0)-(inside?0:outsideGroundOffset(point))+point.height);
}
function nearbyPhotoPeople(){
  const inside=interiorAt(me.x,me.y);
  return [...people.values()].map(person=>person.position)
    .filter(point=>near(me,point.x,point.y)<=PHOTO_REACH&&interiorAt(point.x,point.y)===inside);
}
function joinablePhoto(time){
  if(!session||!roomPhoto||roomPhoto.host===session.id||roomPhoto.shootAt<=time||photoMode.camera)return false;
  const host=people.get(roomPhoto.host)?.position;
  return Boolean(host&&near(me,host.x,host.y)<=PHOTO_REACH&&
    interiorAt(me.x,me.y)===interiorAt(host.x,host.y));
}
function confirmRoomPhoto(event,sent){
  roomPhoto=event??null;
  if(!sent||queuedPhoto!==sent)return;
  queuedPhoto=null;
  if(!photoMode.camera)return;
  if(event?.id!==sent.id||!photoMode.join(event))photoMode.shareFailed();
}
function savePhoto(picture,options){
  const write=writePhoto(picture,options);
  photoWrites.add(write);
  const done=()=>photoWrites.delete(write);
  write.then(done,done);
  return write;
}
async function writePhoto(picture,{date=gameTime(),place=shownPlace(me),mode="solo"}={}){
  let record;
  try{
    record=await makePhotoCard(picture,{date,place,mode,nickname:session?.nickname??nickname.value});
    await importPhotos([record]);
    toast("산책 사진 앨범에 저장했어요.");
    if(photoMode.camera)photoMode.status("앨범에 저장했어요.");
  }catch(error){
    if(record)downloadPhoto(record);
    const message=record?"앨범에 저장할 수 없어 사진 파일로 저장했어요.":error.message||"사진을 찍지 못했어요.";
    toast(message);
    if(photoMode.camera)photoMode.status(message);
  }
}
function takePhoto(shot){
  if(!world||!session||!lastScene||!photoMode.camera)return;
  const picture=world.capturePhoto({...lastScene,clock:shot.shootAt,photoCamera:photoMode.camera});
  void savePhoto(picture,{date:shot.shootAt,place:shownPlace(shot.camera??me),mode:shot.mode});
}
function openWish(){
  if(!nearWishFountain())return;
  resetInput();$("wish-status").hidden=true;wishDrawing.open();
}
$("wish").addEventListener("click",openWish);

function nearbyStation(){
  let best=null,range=2.55;
  for(const station of world?.stations??[]){
    const distance=near(station,me.x,me.y);
    if(distance<range&&clearSegment(me,station)){best=station;range=distance;}
  }
  return best;
}
function sickLocked(time){
  return Boolean(me.sickAt&&time<me.sickAt+SICK_DURATION_MS||
    me.bikeFallAt&&time<me.bikeFallAt+BIKE_FALL_DURATION_MS);
}
function canUseItem(time,slot){
  const item=me[slot];
  return Boolean(!me.bus&&!riding&&!isCycling(me)&&!queuedBus&&!queuedBike&&!picnicInventoryBusy()&&!bungeoInventoryPending()&&
    !alcoholSip&&!clinkLocked(time)&&!sickLocked(time)&&!feedingLocked(time)&&item?.remaining&&
    (!ITEMS[item.kind].meal||atDiningTable())&&
    !ITEM_SLOTS.some(slot=>itemAnimating(me[slot],time)));
}
function atDiningTable(){
  const bench=world?.benches[me.seat];
  return Boolean(bench?.table&&bench.venueId===interiorAt(me.x,me.y));
}
function currentDining(){return diningById[interiorAt(me.x,me.y)];}
function diningTicket(){return diningService&&diningService.venue===currentDining()?.id?diningService.self:null;}
function carryingDiningTray(time){return diningTicket()?.phase==="carrying"||Boolean(diningTray(me,time)&&!atDiningTable());}
function atTicketTable(ticket){
  const bench=world?.benches[me.seat];
  return Boolean(ticket?.table&&atDiningTable()&&bench.tableIndex===ticket.table.index&&(me.seatSide??0)*2-1===ticket.table.side);
}
function mealBiteLocked(time){
  const ticket=diningTicket();
  if(ticket?.phase==="served"&&atTicketTable(ticket)){
    return queuedDining?.action==="bite"||Boolean(ticket.ateAt&&time<ticket.ateAt+ITEMS[ticket.kind].duration);
  }
  const tray=diningTray(me,time);
  return Boolean(tray&&tray.itemAge<tray.spec.duration&&atDiningTable());
}
function feedingLocked(time){
  return Boolean(queuedFeed&&time-queuedFeed.at<FEED_MS||me.feed&&time-me.feed.at<FEED_MS);
}
function feedCatNearby(){
  if(!session||me.seat!=null||myLink()?.active||me.running||!ITEM_SLOTS.some(slot=>me[slot]?.kind==="churu"&&me[slot].remaining))return null;
  return world?.parkLife.nearestFeedCat(me.x,me.y,session.id);
}
const venueAt=id=>id==="museum"?world?.museum:venueById[id];
function atIndoorStation(point,reach=2.8){return near(point,me.x,me.y)<reach&&clearSegment(me,point);}
function portalNearby(){
  if(!world||me.bus||isCycling(me)||queuedBus||queuedBike)return null;
  const inside=interiorAt(me.x,me.y);
  const venues=inside?[venueAt(inside)]:[world.museum,mmcaVenue,semaVenue,ARCADE_SITE,...diningVenues];
  for(const venue of venues){
    const door=inside?venue?.insideDoor:venue?.outsideDoor;
    if(door&&atIndoorStation(door,2.5))return {inside:Boolean(inside),venue};
  }
  return null;
}
const busDialog=$("bus-seat-dialog"),travelStatus=$("travel-status"),busStatus=$("bus-status");
const busArrival=$("bus-status-arrival"),busDeparture=$("bus-status-departure");
const BUS_STOP_INFO_REACH=20;
let selectedBus=null;
const seatButtons=Array.from({length:BUS_SEATS},(_,seat)=>{
  const button=document.createElement("button");
  button.type="button";button.className="quiet";
  button.addEventListener("click",()=>{
    const context=boardableBus(gameTime());
    if(!context||context.bus.index!==selectedBus?.index||context.stop.id!==selectedBus.stop.id||seatTaken(context.bus.index,seat))return;
    queuedBus={action:"board",index:context.bus.index,seat};
    busDialog.close();setMap(false);resetInput();wakeSync();focusGame();
  });
  $("bus-seats").append(button);return button;
});
function seatTaken(index,seat){
  return [...people.values()].some(({avatar})=>avatar.bus?.index===index&&avatar.bus.seat===seat);
}
function transportReady(time){
  return Boolean(session&&world&&!riding&&!me.bus&&!queuedBus&&!queuedBike&&!myLink()&&!queuedHand&&
    me.seat==null&&!me.up&&time-me.jump>=jumpDuration(me)&&!feedingLocked(time)&&time-(me.pet?.at??0)>=PET_MS&&
    !sickLocked(time)&&!ITEM_SLOTS.some(slot=>itemAnimating(me[slot],time)));
}
function travelTime(ms){
  const seconds=Math.max(0,Math.ceil(ms/1000)),minutes=Math.floor(seconds/60);
  return minutes?`${minutes}분 ${seconds%60}초`:`${seconds}초`;
}
function refreshBusSeats(time){
  if(!busDialog.open||!selectedBus)return;
  const {index,stop}=selectedBus,bus=busAt(index,time),here=bus?.stopId===stop.id;
  const {arrivalMs,departureMs}=busStopTimes(stop.id,time);
  const status=here?`${stop.direction} · ${travelTime(bus.remaining)} 뒤 출발`:
    departureMs===null?"선택한 버스가 출발했어요.":"다른 버스가 정차했어요. 창을 닫고 좌석을 다시 골라 주세요.";
  setText($("bus-seat-time"),`${status} · 다음 버스 ${travelTime(arrivalMs)} 뒤 도착`);
  seatButtons.forEach((button,seat)=>{
    const occupied=here&&seatTaken(index,seat);
    button.disabled=!here||occupied;
    setText(button,`${seat+1}번${occupied?" · 이용 중":""}`);
  });
}
function nearbyBikeDock(){
  return nearBikeDock(me,target=>clearSegment(me,target,.32,.18));
}
function nearbyParkedBike(){
  const bike=me.bike?.parked;
  return Boolean(bike&&near(bike,me.x,me.y)<=bikeMountReach&&canRideBikeSegment(me,bike));
}
function nearbyBikeDriver(){
  if(me.bike||isBikePassenger(me)||photoMode.camera||minigames.active()||interiorAt(me.x,me.y))return null;
  let nearest=null,range=bikeMountReach;
  for(const person of people.values()){
    const {avatar,position}=person;
    if(!isBikeDriver(avatar)||avatar.bike.passenger||Math.hypot(avatar.vx||0,avatar.vy||0)>bikePassengerBoardSpeed)continue;
    const distance=near(position,me.x,me.y);
    if(distance>range||!canRideBikeSegment(me,position))continue;
    nearest=person;range=distance;
  }
  return nearest;
}
function incomingBikeOffer(){
  return tandemOffer?.driver===session?.id&&isBikeDriver(me)&&!me.bike.passenger?tandemOffer:null;
}
function acceptBikeOffer(offer,time){
  const requester=people.get(offer.requester);
  return Boolean(transportReady(time)&&requester&&
    Math.hypot(me.vx||0,me.vy||0)<=bikePassengerBoardSpeed&&
    near(requester.position,me.x,me.y)<=bikeMountReach&&canRideBikeSegment(requester.position,me));
}
function nearbyBusStop(){
  let closest=null,range=BUS_STOP_INFO_REACH;
  for(const stop of busStops){
    const distance=near(stop.board,me.x,me.y);
    if(distance<=range){closest=stop;range=distance;}
  }
  return closest;
}
function boardableBus(time,ready=transportReady(time)){
  if(!ready||isCycling(me))return null;
  const context=nearBus(me,time);
  return context&&clearSegment(me,context.stop.board,.32,.22)?context:null;
}
function showCountdown(row,ms){
  row.hidden=ms==null;
  if(ms!=null)setText(row.lastElementChild,travelTime(ms));
}
function updateBusStatus(bus,stop,time){
  const next=bus?.traveling?busStopById(bus.nextStopId):null;
  const shown=stop??next;
  busStatus.hidden=!shown;
  if(!shown)return;
  const schedule=bus?null:busStopTimes(shown.id,time);
  setText($("bus-status-stop"),shown.name);
  setText($("bus-status-direction"),bus?"세종대로 순환버스 · 탑승 중":shown.direction);
  setText($("bus-status-arrival-label"),bus?"다음 정류장 도착":"다음 버스 도착");
  showCountdown(busArrival,next?bus.eta:schedule?.arrivalMs);
  showCountdown(busDeparture,bus?.stopId?bus.remaining:schedule?.departureMs);
}
function updateTransport(time){
  const bus=me.bus&&busAt(me.bus.index,time),ready=transportReady(time);
  const stop=bus?busStopById(bus.stopId):world&&!riding?nearbyBusStop():null;
  const passenger=isBikePassenger(me),driver=isBikeDriver(me),dock=ready&&!passenger&&nearbyBikeDock();
  const boarding=boardableBus(time,ready);
  const parked=me.bike?.parked,canRemount=nearbyParkedBike();
  setActivity("bike-action",queuedBike?"따릉이 확인 중":dock&&(!me.bike||driver)?driver?"따릉이 반납하기":"따릉이 빌리기":null,Boolean(queuedBike));
  setActivity("bike-park",passenger?"뒷자리에서 내리기":ready?
    driver?"따릉이에서 내리기":canRemount?"따릉이 다시 타기":null:null,Boolean(queuedBike));
  const asking=tandemOffer?.requester===session.id,offeredRide=ready&&!asking&&nearbyBikeDriver();
  setActivity("bike-tandem",asking?"동승 요청 취소":offeredRide?"자전거 동승 요청":null,Boolean(queuedBike));
  const rideButton=$("bike-tandem");
  if(offeredRide)attr(rideButton,"aria-label",offeredRide.nickname+" 님에게 자전거 동승 요청");
  else rideButton.removeAttribute("aria-label");
  const incoming=incomingBikeOffer();
  $("bike-offer").hidden=!incoming;
  if(incoming)setText($("bike-offer-message"),(people.get(incoming.requester)?.nickname??"친구")+" 님이 자전거에 같이 타고 싶어 해요.");
  $("bike-accept").disabled=!incoming||!acceptBikeOffer(incoming,time);
  $("bike-decline").disabled=Boolean(queuedBike);
  const button=$("bus-action");
  setActivity("bus-action",queuedBus?"버스 확인 중":bus&&stop?"버스 내리기":boarding?"버스 타기":null,Boolean(queuedBus));
  if(boarding)attr(button,"aria-haspopup","dialog");else button.removeAttribute("aria-haspopup");
  const label=passenger?(people.get(me.bikeRide.driver)?.nickname??"친구")+" 님과 따릉이 동승 중":driver?
    me.bike.passenger?"따릉이 · 둘이 타는 중":"따릉이 이용 중 · 지정 대여소에서 반납":parked&&(dock||canRemount)?
    `세워둔 따릉이 · ${travelTime(parked.at+bikeParkDuration-time)} 뒤 회수`:asking?"자전거 동승 수락을 기다리는 중":"";
  travelStatus.hidden=!label;setText(travelStatus,label);
  updateBusStatus(bus,stop,time);
  refreshBusSeats(time);
}
$("bus-action").addEventListener("click",()=>{
  if(queuedBus)return;
  const time=gameTime();
  if(me.bus){
    if(!busAt(me.bus.index,time)?.stopId)return;
    queuedBus={action:"exit",index:me.bus.index};wakeSync();focusGame();return;
  }
  const context=boardableBus(time);
  if(!context)return;
  selectedBus={index:context.bus.index,stop:context.stop};
  resetInput();busDialog.showModal();refreshBusSeats(time);
});
$("bike-action").addEventListener("click",()=>{
  if(isBikePassenger(me))return;
  const dock=transportReady(gameTime())&&nearbyBikeDock();
  if(!dock||me.bike?.parked)return;
  queuedBike={action:isBikeDriver(me)?"return":"take",dock:dock.id};resetInput();wakeSync();focusGame();
});
$("bike-park").addEventListener("click",()=>{
  if(queuedBike)return;
  if(isBikePassenger(me))queuedBike={action:"dismount"};
  else{
    if(!transportReady(gameTime()))return;
    if(isBikeDriver(me))queuedBike={action:"park"};
    else if(nearbyParkedBike())queuedBike={action:"mount"};
    else return;
  }
  resetInput();wakeSync();focusGame();
});
$("bike-tandem").addEventListener("click",()=>{
  if(!session||queuedBike)return;
  if(tandemOffer?.requester===session.id)queuedBike={action:"cancelRide",id:tandemOffer.id};
  else{
    const driver=transportReady(gameTime())&&nearbyBikeDriver();
    if(!driver)return;
    queuedBike={action:"requestRide",id:token(),driver:driver.id};
  }
  resetInput();wakeSync();focusGame();
});
for(const action of ["accept","decline"])$("bike-"+action).addEventListener("click",()=>{
  const offer=incomingBikeOffer();
  if(!offer||queuedBike||action==="accept"&&!acceptBikeOffer(offer,gameTime()))return;
  queuedBike={action:action+"Ride",id:offer.id};
  resetInput();wakeSync();focusGame();
});
function bikeLanding(avatar){
  const {x,y,heading}=avatar,angle=heading*Math.PI/180;
  const center={x:x+Math.sin(angle)*bikePassengerOffset,y:y-Math.cos(angle)*bikePassengerOffset};
  const onPath=point=>walkable(point.x,point.y,onWoldaeApproach(point)?gbWoldae.tier*2:.18);
  const centerOnPath=onPath(center);
  const reachable=point=>onPath(point)&&(!centerOnPath||canRideBikeSegment(center,point));
  if(reachable(avatar))return avatar;
  // A stopped bicycle can have its rear seat over a curb or through a wall.
  // Look beside it on the same connected pavement before resuming foot controls.
  for(const radius of [.35,.70,1.05,1.40]){
    for(let sector=0;sector<8;sector++){
      const direction=angle+sector*Math.PI/4,point={x:x+Math.sin(direction)*radius,y:y-Math.cos(direction)*radius,heading};
      if(reachable(point))return point;
    }
  }
  return centerOnPath?{...center,heading}:avatar;
}
function confirmTransport(avatar,result,bus,bike){
  if(!avatar)return;
  const ridingBus=me.bus;
  const previousBikeDriver=me.bikeRide?.driver;
  if((avatar.bus&&!ridingBus)||(isCycling(avatar)&&!isCycling(me))){stand();rememberWalkPosition();}
  me.bus=avatar.bus??null;me.bike=avatar.bike??null;me.bikeRide=avatar.bikeRide??null;
  me.bikeFallAt=avatar.bikeFallAt??0;
  if(ridingBus?.index!==me.bus?.index||ridingBus?.seat!==me.bus?.seat){
    resetInput();
    Object.assign(me,{x:avatar.x,y:avatar.y,heading:avatar.heading,vx:0,vy:0,jump:0,vaultBase:null,blocked:false,running:false,up:false});
    lastBusHeading=me.bus?avatar.heading:null;
    ownView={...ownView,pan:avatar.heading,tilt:0};
    setText($("location"),me.bus?"세종대로 순환버스":placeName(me));
  }
  if(previousBikeDriver!==me.bikeRide?.driver){
    resetInput();
    const {x,y,heading}=me.bikeRide?avatar:bikeLanding(avatar);
    Object.assign(me,{x,y,heading,vx:0,vy:0,jump:0,vaultBase:null,blocked:false,running:false,up:false});
    if(x!==avatar.x||y!==avatar.y){dirty=true;wakeSync();}
    lastBikeHeading=me.bikeRide?avatar.heading:null;
    if(me.bikeRide){
      ownView={...ownView,pan:avatar.heading};
      toast("따릉이 뒷자리에 탔어요. 운전하는 친구와 함께 이동해요.");
    }
    else if(previousBikeDriver&&bike?.action!=="dismount")toast("따릉이 뒷자리에서 내렸어요.");
    setText($("location"),placeName(me));
  }
  if(bus&&queuedBus===bus){
    queuedBus=null;
    if(result?.bus==="occupied")toast("이미 앉은 사람이 있어요. 다른 좌석을 골라 주세요.");
    else if(result?.bus==="unavailable")toast(bus.action==="board"?"버스가 정차한 곳에서 다시 타 주세요.":"다음 정류장에 도착한 뒤 내릴 수 있어요.");
  }
  if(bike&&queuedBike===bike){
    queuedBike=null;
    const outcome=result?.bike;
    if(outcome==="parked"||outcome==="mounted"||outcome==="fell"){
      resetInput();Object.assign(me,{x:avatar.x,y:avatar.y,heading:avatar.heading,vx:0,vy:0,blocked:false,running:false});
      setText($("location"),placeName(me));
    }
    if(outcome==="taken")toast("따릉이를 빌렸어요. 평소처럼 움직이면 자전거가 달려요.");
    else if(outcome==="returned")toast("따릉이를 반납했어요.");
    else if(outcome==="parked")toast("따릉이를 세웠어요. 10분 안에 돌아와 다시 탈 수 있어요.");
    else if(outcome==="fell")showBikeFallTip();
    else if(outcome==="requested")toast("자전거 동승 요청을 보냈어요.");
    else if(outcome==="accepted")toast("친구가 따릉이 뒷자리에 탔어요.");
    else if(outcome==="dismounted")toast("따릉이 뒷자리에서 내렸어요.");
    else if(outcome==="unavailable")toast(bike.action==="mount"?"세워둔 따릉이 가까이에서 다시 타 주세요.":
      bike.action==="requestRide"||bike.action==="acceptRide"?"서로 가까이에서 멈춘 뒤 다시 동승을 요청해 주세요.":"지금은 따릉이를 이용할 수 없어요.");
  }
}
const transitDialog=$("transit-dialog"),transitOptions=$("transit-options");
let riding=false,rideArrival,rideEnd;
function nearbyTransit(){
  if(!world||!session||me.seat!=null||me.bus||isCycling(me)||queuedBus||queuedBike)return null;
  let closest=null,distance=4.5;
  for(const stop of transitStops){
    if(stop.mode!=="subway")continue;
    const gap=near(stop.door,me.x,me.y);
    if(gap<distance&&clearSegment(me,stop.door)){closest=stop;distance=gap;}
  }
  return closest;
}
const subwayScene=`<svg viewBox="0 0 320 120" role="img" aria-label="지하철"><rect width="320" height="120" fill="#10181c"/>
    <g class="ride-tunnel"><path d="M-40 26H400" stroke="#f4d98a" stroke-width="3" stroke-dasharray="14 46"/><path d="M-40 14H400" stroke="#2b3a41" stroke-width="6"/></g>
    <rect y="92" width="320" height="28" fill="#2a343a"/><rect y="92" width="320" height="3" fill="#f0c94a"/>
    <g class="ride-train"><rect x="20" y="40" width="280" height="54" rx="10" fill="#d7dde0"/><rect x="20" y="70" width="280" height="8" fill="#ef7c1c"/>
      <rect x="20" y="82" width="280" height="12" rx="4" fill="#8f999e"/>
      <g fill="#1e2b33"><rect x="34" y="48" width="38" height="18" rx="3"/><rect x="140" y="48" width="40" height="18" rx="3"/><rect x="248" y="48" width="38" height="18" rx="3"/></g>
      <g class="ride-doors"><rect class="ride-door-left" x="84" y="46" width="22" height="42" fill="#b9c2c6" stroke="#6d777c"/><rect class="ride-door-right" x="106" y="46" width="22" height="42" fill="#b9c2c6" stroke="#6d777c"/>
        <rect class="ride-door-left" x="192" y="46" width="22" height="42" fill="#b9c2c6" stroke="#6d777c"/><rect class="ride-door-right" x="214" y="46" width="22" height="42" fill="#b9c2c6" stroke="#6d777c"/></g>
      <circle cx="292" cy="62" r="4" fill="#fff3c2"/></g></svg>`;
function clearTransit(){
  clearTimeout(rideArrival);clearTimeout(rideEnd);
  $("transit").hidden=true;riding=false;$("transit-scene").replaceChildren();
}
function rideTransit(stop,{target,area,line}){
  if(riding||myLink()?.active||feedingLocked(gameTime())||nearbyTransit()!==stop||!walkable(target.arrive.x,target.arrive.y))return;
  rememberWalkPosition();
  const linkId=myLink()?.id??(queuedHand?.action==="offer"?queuedHand.id:null);
  if(linkId){queuedHand={action:"release",id:linkId};changeLinks(links);}
  transitDialog.close();setMap(false);riding=true;resetInput();sound.bus(null);sound.plazaShow(null);sound.rain(0);sound.stream(0);
  Object.assign(me,{vx:0,vy:0,blocked:false,running:false});dirty=true;wakeSync();
  $("transit-title").textContent=area;
  $("transit-line").textContent=line;
  $("transit").dataset.mode=stop.mode;sound.chime(stop.mode);
  $("transit-scene").innerHTML=subwayScene;
  $("transit").hidden=false;
  const visit=session;
  rideArrival=setTimeout(()=>{if(session===visit)movePlayerTo(target.arrive,target.name);},2300);
  rideEnd=setTimeout(()=>{
    if(session!==visit)return;
    clearTransit();toast(target.name+"에 도착했어요.");focusGame();
  },4600);
}
$("subway").addEventListener("click",()=>{
  const stop=nearbyTransit();
  if(!stop||riding||myLink()?.active||feedingLocked(gameTime()))return;
  resetInput();
  $("transit-from").textContent=stop.name;
  transitOptions.replaceChildren();
  const groups=new Map(),origin=stop.station??stop.name.split(" ")[0];
  for(const route of transitRoutes(stop)){
    if(!groups.has(route.station)){
      const group=document.createElement("details"),label=document.createElement("summary"),list=document.createElement("div");
      label.textContent=route.station;
      group.open=route.station===origin;
      group.append(label,list);transitOptions.append(group);groups.set(route.station,list);
    }
    const button=document.createElement("button");
    button.type="button";button.className="quiet";
    button.textContent=route.target.name.slice(route.station.length+1);
    button.setAttribute("aria-label",route.target.name);
    button.addEventListener("click",()=>rideTransit(stop,route));
    groups.get(route.station).append(button);
  }
  transitDialog.showModal();
});
function nearbyExhibit(){
  const inside=interiorAt(me.x,me.y);
  if(inside===semaVenue.id)return semaExhibits.find(exhibit=>near(exhibit,me.x,me.y)<exhibit.radius)??null;
  const modern=inside===mmcaVenue.id;
  const gallery=modern?mmcaGalleryAt(me.x,me.y):museumGalleryAt(me.x,me.y);
  if(!gallery||!world)return null;
  let closest=null,gap=Infinity;
  for(const exhibit of modern?mmcaExhibits:world.museum.exhibits){
    if(exhibit.gallery!==gallery.id)continue;
    const distance=near(exhibit,me.x,me.y);
    if(distance<exhibit.radius&&distance<gap){closest=exhibit;gap=distance;}
  }
  return closest;
}
function focusGame(){$("game").focus({preventScroll:true});}
function nearVisitorGuide(){
  const point=ticketGuide.approach;
  return Boolean(world&&session&&near(point,me.x,me.y)<3&&clearSegment(me,point));
}
function openVisitorGuide(){
  if(!nearVisitorGuide())return;
  resetInput();
  $("visitor-guide-dialog").showModal();
}
$("visitor-guide").addEventListener("click",openVisitorGuide);
$("landmark-guide").addEventListener("click",()=>{
  const guide=session&&world&&nearbyPalaceGuide(me);
  if(!guide)return;
  resetInput();
  $("landmark-guide-title").textContent=guide.title;
  $("landmark-guide-description").textContent=guide.description;
  $("landmark-guide-source").href=guide.source;
  $("landmark-guide-dialog").showModal();
});
$("pet-cat").addEventListener("click",()=>{
  if(!session||myLink()?.active||me.seat!=null)return;
  const time=gameTime(),cat=world?.parkLife.nearestCat(me.x,me.y);
  if(!cat||time-(me.pet?.at??0)<PET_MS||feedingLocked(time)||!freeItemSlot(me,time))return;
  resetInput();
  me.heading=normalize(Math.atan2(cat.x-me.x,me.y-cat.y)*180/Math.PI);
  me.pet={id:cat.id,at:time};passport.petCat(cat.id,cat.name,time);
  dirty=true;nextCat=time+9000;sound.meow();focusGame();
});
$("take-item").addEventListener("click",()=>{
  if(!session||riding||me.seat!=null||picnicInventoryBusy()||bungeoInventoryPending())return;
  const station=nearbyStation(),time=gameTime();
  const slot=freeItemSlot(me,time);
  if(!station||feedingLocked(time)||clinkLocked(time)||sickLocked(time))return;
  if(!slot){
    if(!carryingDiningTray(time)&&(me.bag?.length??0)<BAG_SIZE)bagRequest({action:"collect",kind:station.kind});
    return;
  }
  const spec=ITEMS[station.kind];
  me[slot]={kind:station.kind,remaining:spec.uses,started:0};dirty=true;wakeSync();
  toast(station.kind==="churu"?"츄르를 샀어요. 고양이 가까이에서 잠시 기다려 보세요.":spec.name+" 받았어요.");
  focusGame();
});
const useItemButtons=["use-item","use-second-item"];
function disableHeldActions(){
  for(const id of useItemButtons)$(id).disabled=true;
}
function useHeldItem(slot){
  if(!session)return;
  if(ITEMS[me[slot]?.kind]?.plush){walkBag.open(slot);return;}
  const time=gameTime();
  if(ITEMS[me[slot]?.kind]?.meal&&!atDiningTable()){toast("식탁에 앉아야 먹을 수 있어요.");return;}
  if(!canUseItem(time,slot))return;
  const item=me[slot],spec=ITEMS[item.kind];
  if(item.kind==="churu"){
    const cat=feedCatNearby();
    if(!cat||queuedFeed||feedingLocked(time)||time-(me.pet?.at??0)<PET_MS)return;
    resetInput();
    me.heading=normalize(Math.atan2(cat.x-me.x,me.y-cat.y)*180/Math.PI);
    queuedFeed={id:cat.id,name:cat.name,claim:token(),at:time,slot};
    disableHeldActions();
    Object.assign(me,{vx:0,vy:0,running:false,blocked:false});dirty=true;wakeSync();focusGame();
    return;
  }
  me[slot]={...item,remaining:item.remaining-1,started:time};
  disableHeldActions();
  if(spec.meal){resetInput();$("sit").disabled=true;}
  me.itemUse=slot;me.gesture=null;me.wave=0;
  if(spec.alcohol)alcoholSip={at:time+spec.duration,empty:item.remaining===1};
  dirty=true;wakeSync();focusGame();
}
ITEM_SLOTS.forEach((slot,index)=>$(useItemButtons[index]).addEventListener("click",()=>useHeldItem(slot)));
function movePlayerTo(destination,place){
  if(bungeoMode)setBungeoCooking(false);
  arcade.stop();
  const before=interiorAt(me.x,me.y);
  if(diningById[before]&&before!==interiorAt(destination.x,destination.y)){
    for(const slot of ITEM_SLOTS)if(ITEMS[me[slot]?.kind]?.meal)me[slot]=null;
    queuedDining=null;diningMenu.close();
  }
  resetInput();stand();
  const heading=destination.heading??me.heading;
  Object.assign(me,{x:destination.x,y:destination.y,heading,vx:0,vy:0,blocked:false,running:false,jump:0,vaultBase:null,up:false});
  ownView={...ownView,pan:heading,tilt:destination.tilt??0};
  $("location").textContent=place;dirty=true;wakeSync();
}
const venueDoorButton=$("museum-door");
function nearbyArcadeStairs(){
  if(arcade.kind)return null;
  return ARCADE_STAIRS[arcadeFloorAt(me.x,me.y)]?.find(stairs=>atIndoorStation(stairs,2.0))??null;
}
$("arcade-stairs").addEventListener("click",()=>{
  const stairs=session&&nearbyArcadeStairs();
  if(stairs){movePlayerTo(stairs.to,stairs.place);focusGame();}
});
function stopAtPressedExit(event){
  if(event.button!==0||venueDoorButton.hidden||venueDoorButton.disabled||!portalNearby()?.inside)return;
  exitPress={pointerId:event.pointerId};
  resetInput();
}
venueDoorButton.addEventListener("pointerdown",stopAtPressedExit);
$("nearby-primary").addEventListener("pointerdown",event=>{
  if(nearbyControls.isPrimary(venueDoorButton))stopAtPressedExit(event);
});
window.addEventListener("pointerup",event=>{
  const pressed=exitPress;
  if(pressed?.pointerId!==event.pointerId)return;
  setTimeout(()=>{if(exitPress===pressed)exitPress=null;},0);
},true);
for(const type of ["pointercancel","lostpointercapture"])window.addEventListener(type,event=>{
  if(exitPress?.pointerId===event.pointerId)exitPress=null;
},true);
window.addEventListener("pointermove",event=>{
  if(exitPress?.pointerId===event.pointerId&&event.pointerType==="mouse"&&!(event.buttons&1))exitPress=null;
},true);
window.addEventListener("blur",()=>{exitPress=null;});
venueDoorButton.addEventListener("click",()=>{
  exitPress=null;
  const portal=portalNearby();
  if(!session||!portal||feedingLocked(gameTime()))return;
  const {inside,venue}=portal,destination=inside?venue.outsideDoor:venue.insideSpawn;
  const link=myLink()??(queuedHand?.action==="offer"?queuedHand:null);
  if(!inside&&link?.active)return;
  if(inside&&link){releasePair(link);changeLinks(links);}
  movePlayerTo(destination,inside?venue.outsideName??venue.name+" 앞":venue.name);focusGame();
});
function guestbookVenue(){
  const venue=venueById[interiorAt(me.x,me.y)];
  return venue?.guestbookPoint&&atIndoorStation(venue.guestbookPoint)?venue:null;
}
$("venue-guestbook").addEventListener("click",()=>{
  const venue=guestbookVenue();
  if(!session||!world||!venue)return;
  resetInput();guestbook.open(venue.id);
});
function diningOrderAction(venue){
  if(!venue)return null;
  const ticket=diningTicket();
  if(ticket)return ticket.phase==="ordering"&&atTicketTable(ticket)?"order":null;
  if(me.seat!=null)return null;
  if(venue.service==="robot")return atIndoorStation(venue.kioskPoint,2.2)?"kiosk":null;
  return atIndoorStation(venue.menuPoint)?"counter":null;
}
function queueDining(action,venue,kind){
  if(!session||!world||!venue||queuedDining)return false;
  resetInput();
  queuedDining={action,venue:venue.id,kind,request:token()};
  if(action==="bite"){$("dining-eat").disabled=true;$("sit").disabled=true;}
  wakeSync();focusGame();return true;
}
function takeMeal(kind){
  const venue=currentDining(),action=diningOrderAction(venue);
  if(!action||!venue.dishes.some(dish=>dish.kind===kind))return "주문할 수 있는 자리에서 다시 시도해 주세요.";
  if(action==="counter"&&(!handsFree(me,gameTime())||myLink()||queuedHand))return "두 손을 비운 뒤 트레이를 받아 주세요.";
  return queueDining(action,venue,kind);
}
function confirmDining(data,command,venue){
  diningService=data&&venue?{...data,venue}:null;
  if(!command||queuedDining!==command)return;
  queuedDining=null;
  if(data?.result==="unavailable"||!data){
    toast(command.action==="bite"?"식탁에 앉아야 먹을 수 있어요.":"지금은 주문할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
  }else if(data.result==="pickedUp")toast("트레이를 받았어요. 빈 식탁에 앉아 주세요.");
}
$("dining-order").addEventListener("click",()=>{
  const venue=currentDining(),action=diningOrderAction(venue);
  if(!session||!world||!action||queuedDining)return;
  resetInput();diningMenu.open(venue,action);
});
$("dining-call").addEventListener("click",()=>{
  const venue=currentDining();
  if(venue?.service==="staff"&&!diningTicket()&&atDiningTable()&&queueDining("bell",venue))sound.diningBell();
});
$("dining-eat").addEventListener("click",()=>{
  const ticket=diningTicket(),venue=currentDining();
  if(!session||!ticket||!ticket.remaining)return;
  if(ticket.phase==="carrying"||!atTicketTable(ticket)){toast("식탁에 앉아야 먹을 수 있어요.");return;}
  if(ticket.phase==="served"&&!mealBiteLocked(gameTime()))queueDining("bite",venue);
});
$("mmca-light").addEventListener("click",()=>{
  if(!session||nearbyExhibit()?.id!=="colors")return;
  galleryLight=(galleryLight+1)%3;
  toast(["은은한 백색광","분홍빛 조명","푸른빛 조명"][galleryLight]);focusGame();
});
$("museum-exhibit").addEventListener("click",()=>{
  const exhibit=session&&nearbyExhibit();
  if(!exhibit)return;
  resetInput();
  $("exhibit-gallery").textContent=placeName(me);
  $("exhibit-title").textContent=exhibit.title;
  $("exhibit-period").textContent=exhibit.credit+(exhibit.original?" · 게임 오마주":exhibit.object?" · 확대 재현":"");
  $("exhibit-description").textContent=exhibit.description;
  const original=$("exhibit-original"),progress=$("exhibit-progress");
  original.hidden=!exhibit.original;
  progress.hidden=!exhibit.original&&exhibit.series===undefined;
  if(exhibit.original)original.textContent="참고 작품 · "+exhibit.original;
  if(!progress.hidden){
    galleryLog.add(exhibit.id);
    try{localStorage.setItem(galleryLogKey,JSON.stringify([...galleryLog]));}catch{}
    progress.textContent=galleryLog.size===mmcaExhibits.length?"서울관 작품 설명을 모두 읽었어요.":`서울관 관람 기록 ${galleryLog.size} / ${mmcaExhibits.length}`;
  }
  $("exhibit-source").href=exhibit.source;
  $("exhibit-source").textContent=exhibit.sourceLabel+" ↗";
  const image=$("exhibit-image");
  image.hidden=!exhibit.file;
  image.alt=exhibit.file?exhibit.title:"";
  if(exhibit.file)image.src=museumArtUrl(exhibit.file);
  else image.removeAttribute("src");
  $("exhibit-dialog").showModal();
});

function setActivity(id,label,disabled=false){
  const button=$(id);
  if(button.hidden===Boolean(label))button.hidden=!label;
  if(button.disabled!==disabled)button.disabled=disabled;
  if(label&&button.textContent!==label)button.textContent=label;
}
const arcadeLabels={...arcadeTitles,pump:"펌프 시작"};
function canStartArcade(point){
  const approach=point===ARCADE_GAMES.airHockey&&near(hockeyFarEnd,me.x,me.y)<near(point,me.x,me.y)?hockeyFarEnd:point;
  return Boolean(session&&world&&interiorAt(me.x,me.y)===point.floor&&!arcade.kind&&!photoMode.camera&&!bungeoMode&&!me.bus&&!isCycling(me)&&!queuedBus&&!queuedBike&&
    !riding&&!myLink()?.active&&!feedingLocked(gameTime())&&!sickLocked(gameTime())&&near(approach,me.x,me.y)<=point.reach&&
    clearSegment(me,approach));
}
const hotteokWorktop=new Set(["pour","sugar","seal"]);
const hotteokTools={pour:"batter",sugar:"sugar",press:"press"};
const hotteokInstructions={
  pour:"반죽을 집고 번호가 적힌 작업판을 누르세요.",
  sugar:"설탕소 그릇을 집고 반죽을 누르세요.",
  seal:"설탕소를 넣은 반죽을 눌러 오므리세요.",
  place:"오므린 반죽과 같은 번호의 철판을 누르세요.",
  press:"누르개를 집고 철판의 반죽을 눌러 납작하게 만드세요.",
  flip:"아랫면이 노릇해지면 철판의 호떡을 눌러 뒤집으세요.",
  plate:"호떡을 눌러 매대에 올리세요."
};
const bungeoInstructions={
  pour:"반죽통을 집고 빈 틀을 누르세요.",
  fill:"팥이나 슈크림 그릇을 집고 반죽을 부은 틀을 누르세요.",
  flip:"아랫면이 노릇해지면 틀을 눌러 뒤집으세요.",
  plate:"틀을 눌러 붕어빵을 매대에 올리세요."
};
const bungeoKinds=new Set([...Object.values(BUNGEO_ITEMS),BUNGEO_CUSTARD_ITEM,...Object.values(HOTTEOK_ITEMS)]);
function bungeoInventoryPending(){
  return bungeoQueue.some(command=>["take","gift","putTray","takeTray"].includes(command.action));
}
function clearBungeoState(){
  bungeoWatchedStall=null;bungeoMolds=undefined;bungeoOrder=null;bungeoStock=0;
}
function bungeoActions(time){
  const stall=nearbyCookingStall(me,{watch:false});
  if(!stall||bungeoMode&&bungeoMode.stall!==stall.id||!session||!world||riding||me.bus||isCycling(me)||queuedBus||queuedBike||
    me.seat!=null||myLink()?.active||photoMode.camera||minigames.active()||!clearSegment(me,stall))return null;
  const loaded=bungeoWatchedStall===stall.id&&Array.isArray(bungeoMolds);
  const busy=Boolean(picnicInventoryBusy()||feedingLocked(time)||clinkLocked(time)||sickLocked(time)||time-me.jump<jumpDuration(me));
  const slot=freeItemSlot(me,time);
  const order=stall.customer&&loaded?bungeoOrder:null,accepted=order?.phase==="accepted",outstanding=accepted?order.quantity-order.served:0;
  const acceptOrder=order?.phase==="waiting",serveOrder=accepted&&outstanding>0&&order.stock>=outstanding;
  const queuedPlates=bungeoQueue.filter(command=>command.action==="plate").length;
  const canPlate=bungeoStock+queuedPlates<BUNGEO_STOCK_CAPACITY;
  const molds=Array.from({length:BUNGEO_MOLD_COUNT},(_,cavity)=>{
    const mold=loaded?bungeoMolds[cavity]:null,step=bungeoStep(mold,time);
    const pending=bungeoQueue.some(command=>command.cavity===cavity);
    const action=step.action==="take"?"plate":step.action;
    const available=loaded&&!busy&&!pending&&step.ready;
    const ready=available&&(action!=="plate"||canPlate);
    return {mold,step,action,pending,ready};
  });
  const giftSlot=ITEM_SLOTS.find(hand=>bungeoKinds.has(me[hand]?.kind)&&me[hand].remaining>0&&!itemAnimating(me[hand],time));
  let target=null,closest=BUNGEO_GIFT_REACH;
  if(giftSlot)for(const person of people.values()){
    const avatar=person.avatar,position=person.position;
    if(!avatar.bungeoReady||near(stall,position.x,position.y)>stall.radius||avatar.seat!=null||avatar.bus||isCycling(avatar)||
      time-avatar.jump<jumpDuration(avatar)||!freeItemSlot(avatar,time))continue;
    const distance=near(position,me.x,me.y);
    if(distance<=closest){closest=distance;target=person;}
  }
  return {stall,loaded,busy:busy||bungeoQueue.length>0,molds,slot,canPlate,giftSlot,target,order,accepted,acceptOrder,serveOrder};
}
function receiveBungeo(data,confirmed,command,watching){
  const current=nearbyCookingStall(me)?.id;
  if(bungeoWatchedStall!==current)clearBungeoState();
  if(watching&&watching===current&&data.bungeoStall===current&&Array.isArray(data.bungeoMolds)){
    bungeoWatchedStall=current;
    bungeoMolds=data.bungeoMolds;bungeoOrder=data.bungeoOrder??null;bungeoStock=data.bungeoStock??bungeoOrder?.stock??0;
  }
  const result=data.bungeoResult;
  if(confirmed?.bungeoClaim&&confirmed.bungeoClaim!==me.bungeoClaim){
    me.bungeoClaim=confirmed.bungeoClaim;
    for(const slot of ITEM_SLOTS)me[slot]=confirmed[slot]??null;
    dirty=true;
    if(confirmed.bungeoClaim!==command?.id)toast("친구가 구운 간식을 건넸어요.");
  }
  if(!command||bungeoQueue[0]!==command)return;
  bungeoQueue.shift();
  if(result?.id!==command.id||!result.accepted){
    const message=command.action==="plate"?"매대의 빈자리와 굽는 상태를 확인해 주세요.":
      command.action.endsWith("Tray")?"매대의 간식과 빈손을 확인해 주세요.":
      command.order?"주문과 판매대 상태를 확인해 주세요.":"굽는 상태와 빈손을 확인한 뒤 다시 해 주세요.";
    if(bungeoMode)feedbackCooking(message);
    else toast(message);
    return;
  }
  const kind=confirmed?.[command.slot]?.kind,item=ITEMS[kind];
  if((command.action==="take"||command.action==="takeTray")&&item){
    const message=item.name+"을 손에 들었어요.";
    if(bungeoMode)feedbackCooking(message);
    else toast(message);
  }
  if(command.action==="plate"&&bungeoMode)feedbackCooking("매대에 올렸어요. 매대를 누르면 하나 집을 수 있어요.");
  if(command.action==="gift")toast("친구에게 간식을 건넸어요.");
}
function bungeoOrderMessage(order){
  switch(order?.phase){
    case "approaching":return "손님이 오고 있어요.";
    case "waiting":return `“붕어빵 ${order.quantity}개 주세요!”`;
    case "accepted":return order.stock>=order.quantity?`주문 ${order.quantity}개 · 건넬 수 있어요`:`주문 ${order.quantity}개 · ${order.quantity-order.stock}개 더 필요해요`;
    case "complete":return `${order.quantity}개 판매 완료 · 이 방에서 총 ${order.totalSold}개`;
    default:return "";
  }
}
function cookingPrompt(actions,hotteok){
  if(!actions?.loaded)return "작업대 상태를 불러오는 중이에요.";
  if(bungeoMode.feedbackUntil>performance.now())return bungeoMode.feedback;
  const cell=actions.molds[bungeoMode.cavity]??actions.molds.find(mold=>mold.action!=="pour")??actions.molds[0];
  if(cell.pending)return "굽기 상태를 확인하고 있어요.";
  if(cell.action==="plate"&&!actions.canPlate)return "매대가 가득 찼어요. 매대에서 하나 집어 주세요.";
  if(cell.step.quality==="burnt")return "탔어요. 구운 자리를 눌러 꺼내세요.";
  if(cell.step.waitMs>0)return `굽는 중 · ${Math.ceil(cell.step.waitMs/1000)}초`;
  return (hotteok?hotteokInstructions:bungeoInstructions)[cell.action]??"작업대의 도구나 자리를 누르세요.";
}
function updateBungeoControls(time){
  const actions=bungeoActions(time),status=$("bungeo-status"),gift=$("bungeo-gift");
  const hotteok=actions?.stall.kind==="hotteok",food=hotteok?"호떡":"붕어빵",customer=Boolean(actions?.stall.customer);
  const giftName=ITEMS[me[actions?.giftSlot]?.kind]?.name??"간식";
  const orderStatus=$("bungeo-order-status"),orderMessage=bungeoOrderMessage(actions?.order);
  orderStatus.hidden=!orderMessage;setText(orderStatus,orderMessage);
  const stockLabel=`${customer?"판매대":"매대"} ${bungeoStock}/${BUNGEO_STOCK_CAPACITY}개`;
  const prompt=actions&&bungeoStock?stockLabel:"";
  status.hidden=!prompt;setText(status,prompt);
  if(bungeoMode){
    const step=cookingPrompt(actions,hotteok);
    setText($("bungeo-instruction"),`${step} · ${stockLabel}`);
  }
  setActivity("bungeo-accept",actions?.acceptOrder?"주문 받기":null,Boolean(actions?.busy));
  setActivity("bungeo-open",actions&&!bungeoMode?food+" 굽기":null,Boolean(actions?.busy||!actions?.loaded));
  setActivity("bungeo-serve",actions?.accepted?"손님에게 건네기":null,!actions?.serveOrder||actions.busy);
  setActivity("bungeo-gift",actions?.target?giftName+" 건네기":null,Boolean(!actions||actions.busy));
  if(actions?.target)attr(gift,"aria-label",actions.target.nickname+" 님에게 "+giftName+" 건네기");
}
function chooseBungeoTool(tool){
  if(!bungeoMode)return;
  bungeoMode.tool=bungeoMode.tool===tool?null:tool;
  bungeoMode.feedbackUntil=0;
}
function feedbackCooking(message){
  if(!bungeoMode)return;
  bungeoMode.feedback=message;bungeoMode.feedbackUntil=performance.now()+2200;
}
function setBungeoCooking(active){
  const actions=active?bungeoActions(gameTime()):null;
  if(active&&(!actions?.loaded||actions.busy))return;
  bungeoMode=active?{tool:null,stall:actions.stall.id,feedbackUntil:0}:null;
  resetInput();closeActionMenus();
  if(active){Object.assign(me,{vx:0,vy:0,running:false,blocked:false});dirty=true;wakeSync();}
  const hotteok=actions?.stall.kind==="hotteok";
  sceneWrap.classList.toggle("bungeo-active",active);
  $("bungeo-hint").hidden=!active;
  if(active){
    setText($("bungeo-keyboard"),hotteok?"Q 반죽 · W 설탕소 · E 누르개 · 1–3 자리 · R 매대 · Esc 끝내기":
      `Q 반죽통 · W 팥 · E 슈크림 · 1–3 틀 · R 매대 · Esc 끝내기`);
    attr($("game"),"aria-describedby","bungeo-instruction bungeo-keyboard");
    updateBungeoControls(gameTime());
  }else $("game").removeAttribute("aria-describedby");
  labelPerspective();focusGame();
}
$("bungeo-open").addEventListener("click",()=>setBungeoCooking(true));
function queueBungeo(stall,command){
  bungeoQueue.push({id:token(),stall:stall.id,...command});wakeSync();focusGame();
}
function useBungeoMold(cavity,surface){
  if(!bungeoMode)return;
  bungeoMode.cavity=cavity;
  bungeoMode.feedbackUntil=0;
  const actions=bungeoActions(gameTime()),cell=actions?.molds[cavity];
  if(cell?.action==="plate"&&!actions.canPlate){feedbackCooking("매대가 가득 찼어요. 자리를 비운 뒤 꺼내세요.");return;}
  if(!cell?.ready)return;
  const {action}=cell;
  const tool=bungeoMode.tool;
  if(actions.stall.kind==="hotteok"){
    const onWorktop=hotteokWorktop.has(action);
    if((surface&&surface!==(onWorktop?"prep":"griddle"))||(hotteokTools[action]&&tool!==hotteokTools[action])){
      feedbackCooking(hotteokInstructions[action]);return;
    }
  }else if((action==="pour"&&tool!=="batter")||(action==="fill"&&tool!=="redBean"&&tool!=="custard")){
    feedbackCooking(bungeoInstructions[action]);return;
  }
  queueBungeo(actions.stall,{action,cavity,...(action==="pour"?{prepare:actions.stall.kind==="bungeo"}:{batch:cell.mold.id}),
    ...(action==="fill"?{filling:tool}:null)});
}
function useCookingTray(){
  const actions=bungeoActions(gameTime());
  if(!actions?.loaded||!bungeoMode)return;
  if(actions.busy)return;
  if(!bungeoStock){feedbackCooking("구운 간식을 꺼내면 이 매대에 놓여요.");return;}
  if(!actions.slot){feedbackCooking("간식을 집으려면 한 손을 비워 주세요.");return;}
  queueBungeo(actions.stall,{action:"takeTray",slot:actions.slot});
}
function useCookingTarget(target){
  if(target?.tool)chooseBungeoTool(target.tool);
  else if(target?.tray)useCookingTray();
  else if(target?.cavity!==undefined)useBungeoMold(target.cavity,target.surface);
}
function useCookingShortcut(code){
  if(/^(Digit|Numpad)[1-3]$/.test(code)){
    useBungeoMold(Number(code.at(-1))-1);return true;
  }
  const stall=cookingStallById(bungeoMode.stall);
  if(code==="KeyR"){useCookingTray();return true;}
  const tools=stall?.kind==="hotteok"?{KeyQ:"batter",KeyW:"sugar",KeyE:"press"}:{KeyQ:"batter",KeyW:"redBean",KeyE:"custard"};
  if(!Object.hasOwn(tools,code))return false;
  chooseBungeoTool(tools[code]);return true;
}
$("bungeo-gift").addEventListener("click",()=>{
  const actions=bungeoActions(gameTime());
  if(!actions?.target||actions.busy)return;
  queueBungeo(actions.stall,{action:"gift",slot:actions.giftSlot,to:actions.target.id});
});
const bungeoOrderButtons={"bungeo-accept":"acceptOrder","bungeo-serve":"serveOrder"};
for(const [id,action] of Object.entries(bungeoOrderButtons))$(id).addEventListener("click",()=>{
  const actions=bungeoActions(gameTime());
  if(!actions?.[action]||actions.busy)return;
  queueBungeo(actions.stall,{action,order:actions.order.id});
});
function atShowControls(){
  return near(plazaShowSpot,me.x,me.y)<=PLAZA_SHOW_REACH&&!me.bus&&!isCycling(me);
}
function myClink(){
  return session&&clinks.find(clink=>clink.from===session.id||clink.to===session.id);
}
function clinkLocked(time){
  const clink=myClink();
  return Boolean(clink?.startedAt&&clink.endsAt>time);
}
function clinkCandidate(time,kind="clink"){
  const ready=kind==="kiss"?canKiss:canClink;
  if(!ready(me,time)||myLink()||queuedHand||picnicInventoryBusy()||feedingLocked(time)||sickLocked(time)||riding||jumpLift(me,time)>0)return null;
  let best=null,closest=CLINK_REACH;
  const inside=interiorAt(me.x,me.y);
  for(const person of people.values()){
    if(!ready(person.avatar,time)||links.some(link=>link.leader===person.id||link.follower===person.id))continue;
    if(interiorAt(person.position.x,person.position.y)!==inside||Boolean(person.avatar.up)!==Boolean(me.up))continue;
    const distance=near(person.position,me.x,me.y);
    if(distance<=closest&&(kind!=="kiss"||clearSegment(me,person.position))){best=person;closest=distance;}
  }
  return best;
}
function confirmSocial(data,show,clink){
  const previous=myClink();
  if("fountainShow" in data)fountainShow=data.fountainShow;
  clinks=data.clinks??[];
  for(const id of heardClinks)if(!clinks.some(event=>event.id===id))heardClinks.delete(id);
  const current=myClink();
  if(current?.startedAt&&(current.id!==previous?.id||!previous?.startedAt)){
    resetInput();
    const peer=people.get(current.from===session.id?current.to:current.from)?.position;
    if(peer){
      me.heading=normalize(Math.atan2(peer.x-me.x,me.y-peer.y)*180/Math.PI);
      dirty=true;
    }
  }
  if(show&&queuedShow===show){
    queuedShow=null;nextShowAudio=0;
    if(data.social?.show==="unavailable")toast("명량분수 안내 표식 가까이에서 다시 눌러 주세요.");
    else if(!data.social?.show)toast("분수쇼를 시작할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
  }
  if(clink&&queuedClink===clink){
    queuedClink=null;
    if(data.social?.clink==="unavailable")toast(isKiss(clink.id)?"서로 가까이 서서 다시 요청해 주세요.":"서로 음료를 들고 가까이에서 다시 건배를 요청해 주세요.");
    else if(!data.social?.clink)toast("요청을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  }
}
function updateSocial(time,eligible){
  const byShow=eligible&&!riding&&atShowControls();
  const show=fountainShow?.endsAt>time&&fountainShow;
  const seconds=show?Math.ceil((show.endsAt-Math.max(time,show.startedAt))/1000):0;
  const showLabel=queuedShow?"분수쇼 확인 중":show?(time<show.startedAt?"분수쇼 시작 준비":"분수쇼 진행 중 · "+seconds+"초"):"분수쇼 시작";
  setActivity("fountain-show",byShow?showLabel:null,Boolean(show||queuedShow));
  const clink=myClink(),clinking=clink?.startedAt&&clink.endsAt>time;
  const waiting=clink&&!clink.startedAt;
  const incoming=waiting&&clink.to===session.id;
  const kiss=isKiss(clink?.id);
  for(const [kind,label] of [["clink","건배"],["kiss","뽀뽀"]]){
    const candidate=eligible&&!clink?clinkCandidate(time,kind):null;
    const mine=clink&&kiss===(kind==="kiss");
    setActivity(kind,mine&&clinking?label+" 중":candidate?label+"하기 · "+candidate.nickname:
      mine&&waiting&&!incoming?label+" 요청 취소":null,Boolean(clinking||queuedClink));
  }
  $("clink-offer").hidden=!incoming;
  $("clink-accept").disabled=$("clink-decline").disabled=Boolean(queuedClink);
  if(incoming){
    const label=kiss?"뽀뽀":"건배";
    attr($("clink-offer"),"aria-label",label+" 요청");
    setText($("clink-accept"),label+"하기");
    setText($("clink-message"),(people.get(clink.from)?.nickname??"친구")+" 님이 "+label+"를 제안했어요.");
  }
  for(const event of clinks){
    if(isKiss(event.id)||!event.startedAt||heardClinks.has(event.id)||time<event.startedAt+790||time>event.startedAt+1100)continue;
    const actor=event.from===session.id||event.to===session.id?me:people.get(event.from)?.position;
    if(!actor||near(actor,me.x,me.y)>7)continue;
    heardClinks.add(event.id);sound.clink();
  }
}
$("fountain-show").addEventListener("click",()=>{
  if(!session||!world||!atShowControls()||queuedShow||fountainShow?.endsAt>gameTime())return;
  sound.wake();queuedShow={id:token(),fountain:"myeongnyang"};wakeSync();focusGame();
});
for(const kind of ["clink","kiss"])$(kind).addEventListener("click",()=>{
  if(!session||queuedClink)return;
  const clink=myClink();
  if(clink?.startedAt)return;
  if(clink?.from===session.id)queuedClink={action:"cancel",id:clink.id};
  else if(!clink){
    const peer=clinkCandidate(gameTime(),kind);
    if(peer)queuedClink={action:"invite",id:(kind==="kiss"?"kiss-":"")+token(),target:peer.id};
  }
  if(queuedClink){wakeSync();focusGame();}
});
for(const action of ["accept","decline"])$("clink-"+action).addEventListener("click",()=>{
  const clink=myClink();
  if(!clink||clink.to!==session.id||clink.startedAt||queuedClink)return;
  queuedClink={action,id:clink.id};wakeSync();focusGame();
});
function picnicInventoryBusy(){
  return !!bagCommand||queuedPicnic?.action==="place"||queuedPicnic?.action==="take";
}
function canPicnic(time){
  return Boolean(session&&world&&!riding&&!me.bus&&!isCycling(me)&&!queuedBus&&!queuedBike&&
    me.seat==null&&!myLink()?.active&&!feedingLocked(time)&&!clinkLocked(time)&&!sickLocked(time)&&time-me.jump>=jumpDuration(me));
}
function updateDiningControls(eligible,busy,time){
  const venue=eligible?currentDining():null,ticket=venue&&diningTicket();
  const order=diningOrderAction(venue),staff=venue?.service==="robot"?"로봇":"직원";
  const handsBusy=order==="counter"&&(!handsFree(me,time)||myLink()||queuedHand);
  setActivity("dining-order",order==="kiosk"?"키오스크 주문":order==="order"?"주문하기":
    order==="counter"?(handsBusy?"두 손을 비워 주세요":"카운터 주문"):null,busy||Boolean(queuedDining||handsBusy));
  setActivity("dining-call",venue?.service==="staff"&&!ticket&&atDiningTable()?"벨 누르기":null,busy||Boolean(queuedDining));
  const eating=mealBiteLocked(time);
  const eat=ticket&&(ticket.phase==="carrying"||ticket.phase==="served"&&(ticket.remaining>0||eating));
  setActivity("dining-eat",eat?"먹기":null,busy||Boolean(queuedDining)||eating);
  const messages={
    queued:venue?.service==="robot"&&!atDiningTable()?"빈 식탁에 앉아 주세요.":`${staff}이 주문을 확인하는 중이에요.`,
    summoned:"직원이 식탁으로 오는 중이에요.",ordering:"직원이 주문을 기다려요.",cooking:"음식을 준비하고 있어요.",
    serving:`${staff}이 음식을 가져오는 중이에요.`,carrying:"트레이를 들고 있어요.",
    served:ticket?.remaining===0&&!eating?"식사를 마쳤어요.":"식탁에 음식이 놓였어요.",
  };
  const message=ticket&&messages[ticket.phase];
  const status=$("dining-status");status.hidden=!message;setText(status,message||"");
}
$("picnic").addEventListener("click",()=>{
  if(!canPicnic(gameTime()))return;
  resetInput();picnic.open(me);
});
function updateActivities(time,guideNearby){
  for(const slot of ITEM_SLOTS)if(me[slot]?.remaining===0&&!itemAnimating(me[slot],time)){
    me[slot]=null;dirty=true;
  }
  $("gesture-open").disabled=!gestureReady(time);
  $("ground-sit").disabled=$("gesture-open").disabled||Boolean(arcade.kind||bungeoMode||me.seat!=null||seatClaim);
  setText($("ground-sit"),me.groundSit?"일어나기":"제자리에 앉기");
  if(!$("gesture-menu").hidden)for(const button of gestureButtons)button.disabled=!gestureReady(time,button.dataset.gesture);
  const eligible=world&&session&&!me.bus&&!isCycling(me)&&!queuedBus&&!queuedBike;
  updateSocial(time,eligible);
  updateBungeoControls(time);
  for(const [kind,point] of Object.entries(ARCADE_GAMES))setActivity("arcade-"+kind,canStartArcade(point)?arcadeLabels[kind]:null);
  const stairs=eligible&&nearbyArcadeStairs();
  setActivity("arcade-stairs",stairs?stairs.name:null);
  setActivity("picnic",canPicnic(time)?picnic.label(me):null,Boolean(queuedPicnic));
  const available=eligible&&!riding&&me.seat==null&&!myLink()?.active;
  const venue=available&&!minigames.active()&&minigames.nearby(me);
  const arrows=venue?.id==="tuho"&&near(minigamePickup(venue),me.x,me.y)<=MINIGAME_PICKUP_REACH&&!minigames.arrows();
  setActivity("minigame",arrows?"투호 화살 받기":venue?.id==="kite"?venue.action:venue?venue.name:null);
  setActivity("hanbok-rental",available&&passport.nearRental(me)?"한복 대여소":null);
  setActivity("photo-join",world&&joinablePhoto(time)?"단체 사진 함께 찍기 · "+Math.ceil((roomPhoto.shootAt-time)/1000)+"초":null);
  const feeding=feedingLocked(time);
  setActivity("visitor-guide",guideNearby?"관람 안내 읽기":null);
  const landmark=eligible&&nearbyPalaceGuide(me);
  setActivity("landmark-guide",landmark?"설명 읽기":null);
  if(landmark)attr($("landmark-guide"),"aria-label",landmark.title+" 설명 읽기");
  $("jump").disabled=!eligible||riding||feeding||sharingUmbrella()||clinkLocked(time)||sickLocked(time)||carryingDiningTray(time)||mealBiteLocked(time)||time-me.jump<jumpDuration(me);
  const atFountain=nearWishFountain();
  if($("wish").hidden===Boolean(atFountain))$("wish").hidden=$("wish").disabled=!atFountain;
  const cat=eligible&&me.seat==null&&!myLink()?.active&&world.parkLife.nearestCat(me.x,me.y);
  setActivity("pet-cat",cat?"쓰다듬기":null,feeding||!freeItemSlot(me,time)||time-(me.pet?.at??0)<PET_MS);
  if(cat)attr($("pet-cat"),"title",cat.name+" 쓰다듬기");
  const station=eligible&&me.seat==null&&nearbyStation();
  const busy=Boolean(riding||picnicInventoryBusy()||bungeoInventoryPending()||feeding||clinkLocked(time)||sickLocked(time));
  const free=!carryingDiningTray(time)&&freeItemSlot(me,time);
  const packAtCounter=!carryingDiningTray(time)&&(me.bag?.length??0)<BAG_SIZE;
  const pickup=station&&(free?(station.kind==="churu"?"츄르 사기":ITEMS[station.kind].name+" 받기"):
    packAtCounter?ITEMS[station.kind].name+" 가방에 담기":"손이나 가방을 비워 주세요");
  setActivity("take-item",pickup,busy||!free&&!packAtCounter);
  const feedSlot=queuedFeed?.slot??me.feed?.slot??"item";
  const nearbyFeedCat=eligible&&feedCatNearby();
  ITEM_SLOTS.forEach((slot,index)=>{
    const item=eligible&&me[slot],spec=item&&ITEMS[item.kind],churu=item?.kind==="churu";
    const feedingHere=feeding&&slot===feedSlot;
    const button=$(useItemButtons[index]),hand=spec?.meal?"식사 트레이":handLabel(slot);
    const action=feedingHere?(queuedFeed?"주는 중":"먹는 중"):
      churu&&!nearbyFeedCat?"고양이 찾기":spec?.verb;
    button.hidden=!spec;
    const carrying=spec?.meal&&item?.remaining&&!atDiningTable();
    button.disabled=(!carrying&&!canUseItem(time,slot))||churu&&(!nearbyFeedCat||time-(me.pet?.at??0)<PET_MS);
    if(spec){
      const itemLabel=spec.name+(item.remaining&&!feedingHere&&!spec.plush?` · ${item.remaining}회`:"");
      setText(button.firstElementChild,itemLabel);
      setText(button.lastElementChild,action);
      attr(button,"aria-label",`${hand} · ${itemLabel} · ${action}`);
    }
  });
  const stop=eligible&&nearbyTransit();
  setActivity("subway",stop?"지하철 타기":null,riding||feeding||Boolean(myLink()?.active));
  const portal=eligible&&portalNearby();
  const entrance=portal?.venue===ARCADE_SITE?"오락실 입장":[mmcaVenue,semaVenue].includes(portal?.venue)?"미술관 입장":diningById[portal?.venue?.id]?"식당 입장":"입장하기";
  setActivity("museum-door",portal?(portal.inside?"나가기":entrance):null,feeding||(!portal?.inside&&Boolean(myLink()?.active)));
  setActivity("venue-guestbook",eligible&&guestbookVenue()?"방명록":null);
  updateDiningControls(eligible,busy,time);
  const exhibit=eligible&&nearbyExhibit();
  setActivity("museum-exhibit",exhibit?"작품 설명":null);
  if(exhibit)attr($("museum-exhibit"),"aria-label",exhibit.title+" 작품 설명");
  setActivity("mmca-light",exhibit?.id==="colors"?"빛 바꾸기":null);
}
function moveWithInput(dx,dy,speed,link,cameraRelative){
  if(me.bus||isBikePassenger(me)||queuedBus||queuedBike)return false;
  if(cameraRelative){
    const angle=ownView.pan*Math.PI/180;
    [dx,dy]=[dx*Math.cos(angle)-dy*Math.sin(angle),dx*Math.sin(angle)+dy*Math.cos(angle)];
  }
  if(!speed||(!dx&&!dy))return false;
  stand();
  const scale=speed/Math.max(1,Math.hypot(dx,dy));
  if(move(me.x+dx*scale,me.y+dy*scale))return false;
  const heading=normalize(Math.atan2(dx,-dy)*180/Math.PI);
  if(me.heading!==heading&&(!link?.active||pairFits(me,{...me,heading},link.side))){
    me.heading=heading;dirty=true;
  }
  return true;
}
function walkCourse(speed){
  const goal=course[0];
  if(!goal)return;
  const remaining=near(goal,me.x,me.y),arriving=remaining<=speed;
  const advanced=remaining<1e-6||(arriving?move(goal.x,goal.y):
    move(me.x+(goal.x-me.x)*speed/remaining,me.y+(goal.y-me.y)*speed/remaining));
  if(!advanced){course=[];pendingSeat=null;}
  else if(arriving)course.shift();
  if(!course.length&&pendingSeat!=null){
    if(near(pendingSeat.approach,me.x,me.y)<.4){seatClaim=pendingSeat;dirty=true;wakeSync();}
    pendingSeat=null;
  }
}
function motion(now,elapsed){
  if(bungeoMode||arcade.frozen||riding||mealBiteLocked(gameTime(now)))return false;
  if(me.bus){
    const bus=busAt(me.bus.index,gameTime(now)),seat=busSeatPose(bus,me.bus.seat);
    if(!seat)return false;
    Object.assign(me,seat,{vx:0,vy:0,blocked:false,running:false});
    if(lastBusHeading!=null)ownView.pan=normalize(ownView.pan+angleDelta(lastBusHeading,bus.heading));
    lastBusHeading=bus.heading;
    setText($("location"),busStopById(bus.stopId)?.name??"세종대로 순환버스");
    soundscape(gameTime(now),0,false);return false;
  }
  if(isBikePassenger(me)){
    const driver=people.get(me.bikeRide.driver);
    if(isBikeDriver(driver?.avatar)){
      const pose=bikePassengerPose(driver.position);
      const moved=pose.x!==me.x||pose.y!==me.y;
      Object.assign(me,pose,{vx:0,vy:0,blocked:false,running:false});
      if(lastBikeHeading!=null)ownView.pan=normalize(ownView.pan+angleDelta(lastBikeHeading,pose.heading));
      lastBikeHeading=pose.heading;
      if(moved)setText($("location"),placeName(me));
    }
    soundscape(gameTime(now),0,false);return false;
  }
  if(photoMode.camera){
    if(moving(me)||me.blocked){Object.assign(me,{vx:0,vy:0,running:false,blocked:false});dirty=true;wakeSync();}
    soundscape(gameTime(now),0,false);return false;
  }
  const oldX=me.x,oldY=me.y,link=myLink(),follower=amFollowingHands();
  const wasMoving=moving(me)||me.blocked,wasBlocked=me.blocked,wasRunning=me.running;
  const leader=follower&&!exitPress&&people.get(link.leader);
  // Wading through a pond is slow going, and there is no running in the water.
  const pace=!arcade.kind&&(runToggled||shiftHeld)&&!(isUmbrellaLink(link)&&link.active);
  const speed=elapsed*(isBikeDriver(me)?9.4:pace?6.675:2.58);
  let blocked=false;
  if(leader){
    const next=pairedPose(link,leader.position,me,now);
    if(me.heading!==next.heading){me.heading=next.heading;dirty=true;}
    if(next.x!==me.x||next.y!==me.y){me.x=next.x;me.y=next.y;dirty=true;}
    blocked=Boolean(leader.avatar.blocked);
  }else if(!exitPress&&session&&elapsed>0&&!queuedBus&&!queuedBike&&!feedingLocked(gameTime(now))&&!clinkLocked(gameTime(now))&&!sickLocked(gameTime(now))){
    if(keys.size||thumbId!==undefined){
      const [dx,dy]=Array.from(keys,key=>vectors[key]).reduce(([x,y],[vx,vy])=>[x+vx,y+vy],thumb);
      blocked=moveWithInput(dx,dy,speed,link,!worldFailed&&(thumbId!==undefined||document.activeElement!==$("world")));
    }else walkCourse(speed);
  }
  const moved=oldX!==me.x||oldY!==me.y;
  const distance=moved?Math.hypot(me.x-oldX,me.y-oldY):0;
  if(moved&&isBikeDriver(me)&&!queuedBike&&me.blushUntil>gameTime(now)&&
    Math.random()<bikeFallChance(me,gameTime(now),distance)){
    queuedBike={action:"fall"};resetInput();
    Object.assign(me,{vx:0,vy:0,running:false,blocked:false});
    dirty=true;wakeSync();return false;
  }
  soundscape(gameTime(now),moved&&!isCycling(me)&&me.seat==null?Math.min(1.2,Math.hypot(me.x-oldX,me.y-oldY)):0,pace);
  if(moved){
    const location=placeName(me);
    if($("location").textContent!==location)$("location").textContent=location;
  }
  const cap=isCycling(me)?12:8;
  const vx=moved&&elapsed?Math.max(-cap,Math.min(cap,(me.x-oldX)/elapsed)):0;
  const vy=moved&&elapsed?Math.max(-cap,Math.min(cap,(me.y-oldY)/elapsed)):0;
  const running=leader?Boolean(leader.avatar.running):!isCycling(me)&&(moved||blocked)&&pace;
  if(me.vx!==vx||me.vy!==vy||me.blocked!==blocked||me.running!==running){
    Object.assign(me,{vx,vy,blocked,running});dirty=true;
  }
  // Starts, stops and sharp turns are what prediction cannot guess, so send those at once.
  const turned=Math.abs(angleDelta(sentHeading,me.heading))>28;
  if(wasMoving!==(moving(me)||blocked)||wasBlocked!==blocked||wasRunning!==running||turned&&moved){
    sentHeading=me.heading;wakeSync();
  }
  return leader?leader.stepping||moved:moved||blocked;
}
function actors(now,stepping){
  const time=gameTime(now),inArcade=arcadeFloorAt(me.x,me.y);
  const self={...me,id:session?.id||"preview",stepping,catFriends:passport.friendlyCatIds()},others=new Map();
  for(const person of people.values()){
    others.set(person.id,{...person.avatar,...person.position,id:person.id,nickname:person.nickname,
      coat:person.coat,stepping:person.stepping,running:person.running,sharedUmbrella:0,umbrellaShelter:null,
      arcade:inArcade?visibleArcade(currentArcade(person,time),time):null});
  }
  function actor(id){return id===self.id?self:others.get(id);}
  function alignBikePassenger(passenger){
    if(!isBikePassenger(passenger))return;
    const driver=actor(passenger.bikeRide.driver);
    if(!isBikeDriver(driver))return;
    Object.assign(passenger,bikePassengerPose(driver),{stepping:false,running:false,bikeDriverPosition:{x:driver.x,y:driver.y}});
  }
  alignBikePassenger(self);
  for(const passenger of others.values())alignBikePassenger(passenger);
  for(const link of links){
    if(!link.active)continue;
    const leader=actor(link.leader),follower=actor(link.follower);
    if(!leader||!follower||leader.bus||follower.bus||isCycling(leader)||isCycling(follower))continue;
    if(follower!==self)Object.assign(follower,pairedPose(link,leader,follower,now));
    if(isUmbrellaLink(link)){
      if(!leader.umbrella||!leader.umbrellaReady||!follower.umbrellaReady||
        near(leader,follower.x,follower.y)>1.55||interiorAt(leader.x,leader.y)||interiorAt(follower.x,follower.y))continue;
      leader.sharedUmbrella=-link.side;follower.umbrella=false;
      leader.umbrellaShelter=follower.umbrellaShelter={x:(leader.x+follower.x)/2,y:(leader.y+follower.y)/2};
    }else{
      leader.hand=-link.side;follower.hand=link.side;
    }
    follower.stepping=leader.stepping;follower.running=leader.running;
  }
  for(const clink of clinks){
    if(!clink.startedAt||time<clink.startedAt||time>=clink.endsAt)continue;
    const first=actor(clink.from),second=actor(clink.to);
    if(!first||!second)continue;
    if(isKiss(clink.id)){
      const dx=second.x-first.x,dy=second.y-first.y,span=Math.hypot(dx,dy);
      const t=Math.max(0,Math.min(1,(time-clink.startedAt)/650,(clink.endsAt-time)/650));
      const weight=t*t*(3-2*t),heading=normalize(Math.atan2(dx,-dy)*180/Math.PI);
      for(const [person,sign] of [[first,1],[second,-1]]){
        const travel=(span-.50)*.5*weight*sign;
        if(span>.001){person.x+=dx/span*travel;person.y+=dy/span*travel;}
        Object.assign(person,{heading:normalize(heading+(sign<0?180:0)),kiss:weight,stepping:false,running:false});
      }
      continue;
    }
    for(const [person,peer] of [[first,second],[second,first]]){
      const heading=normalize(Math.atan2(peer.x-person.x,person.y-peer.y)*180/Math.PI);
      person.clink={startedAt:clink.startedAt,heading,slot:clinkItemSlot(person,clink.startedAt-CLINK_LEAD_MS)??"item"};
    }
  }
  return {self,others};
}
let lastFrame=performance.now(),interfaceAt=0,guideNearby=false;
function preferredNearbyAction(time){
  if(me.bus||queuedBus)return "bus-action";
  // With feet in the stream the kick comes first; walking away or the menu stands up.
  if(bathing()&&!$("foot-kick").hidden)return "foot-kick";
  if(!$("sit").hidden&&!$("sit").disabled&&$("sit").dataset.footBath==="true")return "sit";
  if(!$("arcade-stairs").hidden)return "arcade-stairs";
  if(!venueDoorButton.hidden&&!venueDoorButton.disabled&&interiorAt(me.x,me.y))return venueDoorButton.id;
  for(const id of ["bungeo-serve","bungeo-accept","bungeo-open","bungeo-gift"]){
    const action=$(id);
    if(!action.hidden&&!action.disabled)return id;
  }
  for(const kind of Object.keys(ARCADE_GAMES))if(!$("arcade-"+kind).hidden)return "arcade-"+kind;
  const bike=$("bike-action"),park=$("bike-park");
  const parkAvailable=!park.hidden&&!park.disabled;
  // Offer mounting (including the rear seat) ahead of unrelated actions. At a
  // dock, a mounted driver still sees the option to return the rental first.
  if(parkAvailable&&!isBikeDriver(me))return "bike-park";
  if(!bike.hidden&&!bike.disabled)return "bike-action";
  if(parkAvailable)return "bike-park";
  if(!$("dining-call").hidden&&!$("dining-call").disabled)return "dining-call";
  if(!$("dining-order").hidden&&!$("dining-order").disabled)return "dining-order";
  if(me.seat!=null)return "sit";
  if(!$("museum-door").hidden)return "museum-door";
  if(!$("dining-order").hidden)return "dining-order";
  if(!$("venue-guestbook").hidden)return "venue-guestbook";
  if(!$("picnic").hidden&&(picnic.nearby(me)||ITEM_SLOTS.some(slot=>me[slot]?.remaining&&isPicnicItem(me[slot].kind))))return "picnic";
  if(!$("minigame").hidden)return "minigame";
  if(fountainShow?.endsAt>time&&atShowControls())return "fountain-show";
}
function preferredPeerAction(time){
  const link=myLink();
  if(link?.active)return isUmbrellaLink(link)?"share-umbrella":"hand";
  if(joinablePhoto(time))return "photo-join";
  if(!$("bike-tandem").hidden)return "bike-tandem";
  if(!$("share-umbrella").hidden)return "share-umbrella";
  if(!$("clink").hidden&&!$("clink").disabled)return "clink";
}
function frame(now){
  const elapsed=Math.max(0,Math.min(56,now-lastFrame))/1000;lastFrame=now;
  requestAnimationFrame(frame);
  if(!session)return;
  const time=gameTime(now);
  if(alcoholSip&&time>=alcoholSip.at){
    Object.assign(me,finishAlcoholSip(me,alcoholSip.at,alcoholSip.empty));
    alcoholSip=null;
    if(me.sickAt&&time<me.sickAt+SICK_DURATION_MS){
      const link=myLink();
      if(link?.active)releasePair(link);
      resetInput();
    }
    dirty=true;wakeSync();
  }
  if(me.blushLevel&&time>=me.blushUntil){me.blushLevel=0;me.blushUntil=0;me.alcoholGlasses=0;me.sickAt=0;dirty=true;}
  smoothPeople(people,elapsed,time,roundTrip);
  const stepping=backgroundTrip?advanceBackgroundTrip():motion(now,elapsed);
  keepCrossingClear(time);
  if(arcade.kind==="pump"&&near(ARCADE_PUMP,me.x,me.y)>3.3)arcade.stop();
  if(arcade.kind==="mole"&&near(ARCADE_MOLE,me.x,me.y)>2.8)arcade.stop();
  const arcadeStepping=arcade.update(now,elapsed);
  if(!document.hidden)motionStream.tick({visit:session,people,me,now,clock:time,active:stepping||moving(me),
    arcadePacket:()=>arcade.kind&&arcade.kind!=="bowling"?arcadeSnapshot(arcade.state(now)):null});
  if(now>=walkPositionAt){
    walkPositionAt=now+1000;
    rememberWalkPosition();
  }
  if(photoMode.camera&&(keys.size||thumbId!==undefined)){
    const [dx,dy]=Array.from(keys,key=>vectors[key]).reduce(([x,y],[vx,vy])=>[x+vx,y+vy],thumb);
    photoMode.move(dx,dy,elapsed);
  }
  const {self,others}=actors(now,Boolean(stepping||arcadeStepping));
  // Buttons, the map and guides do not need every frame; updating them about ten times a
  // second leaves the rest of each frame for drawing.
  if(now>=interfaceAt){
    interfaceAt=now+95;
    guideNearby=!me.bus&&!isCycling(me)&&nearVisitorGuide();
    updateEnvironment(time);
    updateActivities(time,guideNearby);
    updateTransport(time);
    if(world)passport.visit(me);
    const tutorialPaused=Boolean(photoMode.camera||riding||minigames.active()||document.hidden||document.querySelector("dialog[open]"));
    if(tutorial.needsStart&&world&&!tutorialPaused)tutorial.start();
    tutorial.update(now,tutorialPaused);
    const seatEnabled=world&&session&&!me.bus&&!isCycling(me)&&!queuedBus&&!queuedBike&&!myLink()?.active&&!feedingLocked(time);
    const bench=seatEnabled&&me.seat==null&&!pendingSeat&&!seatClaim?benchNearby():null;
    const eating=mealBiteLocked(time);
    const seatLabel=me.seat!=null?(eating?"식사 중":"일어나기"):seatClaim?"자리 확인 중":pendingSeat?
      (pendingSeat.footBath?"물가로 이동 중":diningById[interiorAt(me.x,me.y)]?"식탁으로 이동 중":"벤치로 이동 중"):
      bench?.choice?(bench.choice.footBath?"발 담그고 앉기":"앉기"):bench?.nearby?"빈자리 없음":null;
    setActivity("sit",seatEnabled?seatLabel:null,eating||me.seat==null&&!bench?.choice);
    attr($("sit"),"data-foot-bath",Boolean(bench?.choice?.footBath));
    const kicking=footKickAge(me,time)!=null;
    setActivity("foot-kick",seatEnabled&&bathing()?(kicking?"발장구치는 중":"발장구치기"):null,kicking);
    attr($("sit"),"aria-pressed",me.seat!=null);
    setText($("game-place"),$("location").textContent);
    refreshShortcuts();
    updateHandControls();
    const heldGift=!me.bus&&!isCycling(me)&&ITEM_SLOTS.some(s=>validPacked(me[s]));
    setActivity("give-held",heldGift&&giftPeers().length?"물건 건네기":null,bagLocked());
    nearbyControls.refresh(preferredNearbyAction(time));peerControls.refresh(preferredPeerAction(time));
    leaveWater();
    updateLocationGuides();updateMaps(self,others);
  }
  lastScene={me:self,peers:[...others.values()],parkedBikes,view:ownView,
    firstPerson:Boolean(bungeoMode||arcade.kind==="mole"||firstPerson&&!arcade.kind)&&!photoMode.camera,
    photoCamera:photoMode.camera,photoCapture:Boolean(photoMode.camera),environment,guideNearby,destination:course.at(-1),clock:time,fountainShow,galleryLight,
    diningService:diningService?.venue===currentDining()?.id?diningService?.tickets??[]:[],
    minigames:minigames.states(),minigameAction:minigames.localAction(),picnics:picnic.states(),bungeoMolds,bungeoOrder,bungeoStock,bungeoMode,
    bungeoStall:bungeoWatchedStall,
    minigameFree:minigameKiteCuts.concat(minigames.freeStates()),arcade:arcade.state(now),bowling:bowlingMatch,
    minigameAimPreview:minigames.aimPreview()};
  world?.render(lastScene,now);
  photoMode.update(time);
}

const svgNS="http://www.w3.org/2000/svg";
function svg(parent,type,attributes,text){
  const element=document.createElementNS(svgNS,type);
  for(const [key,value] of Object.entries(attributes))element.setAttribute(key,value);
  if(text)element.textContent=text;
  parent.append(element);return element;
}
const outline=points=>points.map(p=>p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
const eastWalkRoute=outline([...corridorEastWalkSpine,...plazaEastWalkSpine.slice(1)]);
const indoorMaps=[];
const mapCoatKey=$("map-key").querySelector(".dot.mine");
const mapPlaces=[],mapCategory=$("map-category"),mapLabels=bindMapLabels($("world"),$("map-labels"));
function setMarkerFilter(mark){
  mark.toggleAttribute("hidden",mapCategory.value!=="all"&&mapCategory.value!==mark.dataset.mapCategory);
}
mapCategory.addEventListener("change",()=>{
  for(const mark of gameShell.querySelectorAll("[data-map-category]"))setMarkerFilter(mark);
  for(const key of $("map-key").querySelectorAll("[data-map-legend]")){
    key.hidden=mapCategory.value!=="all"&&mapCategory.value!==key.dataset.mapLegend;
  }
  mapLabels.request();
});
function drawMapPoint(layer,point,category,mini=false,indoors=false){
  if(!point||!point.name)return;
  const attributes={class:"map-marker","data-map-category":category};
  if(!mini){
    attributes["data-map-place"]=mapPlaces.push(point)-1;
    attributes.role="button";
    attributes.tabindex="0";
    attributes["aria-label"]=point.name;
  }
  const pin=svg(layer,"g",attributes);
  if(!mini)svg(pin,"title",{},point.name);
  if(!mini)svg(pin,"circle",{cx:point.x,cy:point.y,r:"1.7%",class:"map-marker-hit"});
  svg(pin,"circle",{cx:point.x,cy:point.y,r:mini?1.55:".75%",class:"map-marker-dot"});
  if(!mini)mapLabels.add(pin,point,category,{indoors});
  setMarkerFilter(pin);
}
function drawIndoorMap(base,venue,galleries,mini){
  const layer=svg(base,"g",{visibility:"hidden"});
  indoorMaps.push({id:venue.id,layer});
  const {minX,maxX,minY,maxY}=venue.bounds;
  svg(layer,"rect",{x:minX,y:minY,width:maxX-minX,height:maxY-minY,fill:"#425050",stroke:"#c8d1c9","stroke-width":.55,rx:.9});
  for(const room of galleries){
    svg(layer,"rect",{x:room.minX,y:room.minY,width:room.maxX-room.minX,height:room.maxY-room.minY,
      fill:room.mapColor,stroke:"#bdc8c4","stroke-width":.5});
    svg(layer,"line",{x1:room.doorX,x2:room.doorX,y1:room.doorY-3,y2:room.doorY+3,stroke:"#425050","stroke-width":1.22});
    svg(layer,"text",{x:(room.minX+room.maxX)/2,y:(room.minY+room.maxY)/2+1.1,fill:"#fff8ec",
      "text-anchor":"middle","font-size":mini?4.15:3.25,"pointer-events":"none"},mini?room.shortName:room.name);
  }
  if(diningById[venue.id]){
    for(const table of diningTables)svg(layer,"rect",{x:venue.center.x+table.x-1.15,y:venue.center.y+table.z-.69,
      width:2.3,height:1.38,rx:.25,fill:"#d0ab79"});
  }
  const points=[[venue.insideDoor,"출구"]];
  if(venue===semaVenue)for(const work of semaExhibits)drawMapPoint(layer,{...work,name:work.title},"heritage",mini,true);
  if(venue.guestbookPoint)points.push([venue.guestbookPoint,"방명록"]);
  if(venue.menuPoint)points.push(venue.service==="robot"?[venue.kioskPoint,"키오스크"]:[venue.menuPoint,"카운터"]);
  if(ARCADE_STAIRS[venue.id]){
    for(const stairs of ARCADE_STAIRS[venue.id])points.push([stairs,stairs.name]);
    for(const [kind,point] of Object.entries(ARCADE_GAMES))if(point.floor===venue.id)points.push([point,arcadeLabels[kind]??point.name]);
  }
  for(const [point,name] of points)if(point)drawMapPoint(layer,{...point,name},"activity",mini,true);
}
let overviewOpen=false,overviewLayer;
let mapViewport=null;
const overviewButton=$("overview-map");
const mapSurface=$("world");
function setOverview(open){
  if(overviewOpen===open)return;
  overviewOpen=open;
  overviewButton.setAttribute("aria-pressed",String(overviewOpen));
  overviewButton.textContent=overviewOpen?"주변 지도":"전체 지도";
}
overviewButton.addEventListener("click",()=>setOverview(!overviewOpen));
function drawMap(base,mini=false){
  const patternId=mini?"mini-map-grid":"world-map-grid";
  const pattern=svg(svg(base,"defs",{}),"pattern",{id:patternId,width:28,height:28,patternUnits:"userSpaceOnUse"});
  svg(pattern,"rect",{width:28,height:28,fill:"var(--map-ground)"});
  svg(pattern,"path",{d:"M28 0H0V28",fill:"none",stroke:"var(--map-grid)","stroke-opacity":.10,"stroke-width":.7});
  // The backdrop covers the full panning range, including the letterbox on tall maps.
  svg(base,"rect",{x:-12000,y:-12000,width:24000,height:24000,fill:"url(#"+patternId+")","pointer-events":"none"});
  const landscape=base,outdoors=svg(landscape,"g",{class:"outdoor-map-ground"});
  base=outdoors;
  const westColors={grove:"#465a43",grass:"#607553",verge:"#77796b",crossing:"#ece4c9",stone:"#a39780",road:"#58605b",street:"#847e6f",path:"#b6a687"};
  for(const feature of [...westSurfaces,...westBuildings]){
    if(feature.kind==="backdrop")continue;
    const d=feature.rings.map(ring=>"M"+ring.map(p=>p.join(",")).join("L")+"Z").join("");
    svg(base,"path",{d,fill:westColors[feature.kind]??(feature.kind==="block"?"#706e61":"#675d50"),"fill-rule":"evenodd"});
  }
  svg(base,"polygon",{points:outline(estateOutline),fill:"#465248",stroke:"#7a8566","stroke-width":1.3});
  for(const garden of palaceGardens){
    const fill=garden.kind==="grove"?"#314938":garden.kind==="parterre"?"#607651":"#506649";
    svg(base,"polygon",{points:outline(garden.outline),fill});
  }
  for(const court of palaceCourts)svg(base,"polygon",{points:outline(court.outline),fill:court.kind==="stone"?"#766c5a":"#626452"});
  for(const [path,color,width] of [[route,"#ae9870",12],...palacePaths.map(p=>[p.points,p.surface==="stone"?"#c9b899":"#a29e7d",p.width])]){
    svg(base,"polyline",{points:outline(path),fill:"none",stroke:color,"stroke-opacity":.60,"stroke-width":width,"stroke-linecap":"round","stroke-linejoin":"round"});
    if(!mini&&path===route)svg(base,"polyline",{points:outline(path),fill:"none",stroke:color,"stroke-width":1.5,"stroke-dasharray":"2 5"});
  }
  svg(base,"polygon",{points:outline(palacePond.outline),fill:"#3b777d",stroke:"#739595","stroke-width":1});
  for(const {a,b,kind} of palaceWalls){
    svg(base,"line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:kind==="outer"?"#929283":"#a07d62","stroke-width":kind==="outer"?1.35:1.12});
  }
  for(const building of [...city.filter(site=>site.h>0&&!site.surveyReplaced),...pavilions,{...gate,w:14.2,d:8.1,angle:Math.PI/2},{...middle,w:10.9,d:6.9,angle:-.19},
      {...hall,w:24,d:23,angle:-.19},{...stoneHall,w:54.2,d:31}]){
    const style={fill:building.brick?"#82594c":"#827659",stroke:"#aa9774","stroke-width":.65};
    if(building.outline){
      svg(base,"polygon",{points:outline(building.outline),...style});
      continue;
    }
    svg(base,"rect",{x:building.x-building.w/2,y:building.y-building.d/2,width:building.w,height:building.d,
      ...style,
      transform:"rotate("+(-(building.angle||0)*180/Math.PI)+" "+building.x+" "+building.y+")",rx:2});
  }
  drawCorridor(base,mini);
  drawGyeongbok(base);
  drawPlaza(base);
  drawCheonggye(base);
  svg(base,"polygon",{points:outline(jeongdongParkCourt),fill:"#758568"});
  drawExtensionPaths(base,jeongdongExtensionPaths);
  for(const {outline:points,kind} of hwangudanGround){
    svg(base,"polygon",{points:outline(points),fill:points===seoulPlazaOutline?"#b0ad9d":
      kind==="garden"?"#56734f":kind==="road"?"#4e5351":"#8c8067"});
  }
  svg(base,"polygon",{points:outline(seoulPlazaLawn),fill:"#556b4c",stroke:"#c7c0a7","stroke-width":1});
  for(const building of hwangudanBuildings){
    svg(base,"polygon",{points:outline(building.outline),fill:"#716b5d",stroke:"#ac9c78","stroke-width":.9});
  }
  drawExtensionPaths(base,hwangudanPaths);
  drawExtensionPaths(base,subwayAccessPaths);
  for(const path of bukchonPaths.filter(path=>path.kind==="road"))svg(base,"polygon",{points:outline(path.outline),fill:"#4e5351"});
  for(const points of bukchonBusRoads)svg(base,"polygon",{points:outline(points),fill:"#4e5351"});
  for(const [surfaces,fill] of [[bukchonLawns,"#647e54"],[mmcaCourtyards,"#aa9c84"],[mmcaLawns,"#647e54"],[mmcaBuildings,"#82776a"]]){
    for(const {outline:points} of surfaces)svg(base,"polygon",{points:outline(points),fill,stroke:"#a99a7d","stroke-width":.65});
  }
  drawExtensionPaths(base,bukchonPaths.filter(path=>path.kind!=="road"));
  drawSonghyeon(base);
  for(const {a,b,width,street} of corridorCrossings){
    const roads=street==="avenue"?[corridorMainRoad,corridorAvenueJoin]:
      [(street==="stream-north"?cheonggyeRoadLeads[0]:street==="stream-south"?cheonggyeRoadLeads[1]:street).outline];
    mapCrossing(base,a,b,width,roads);
  }
  svg(base,"polyline",{points:eastWalkRoute,fill:"none",stroke:"#ded2a9","stroke-width":mini?1.45:2.6,
    "stroke-linejoin":"round","stroke-dasharray":"3 3","pointer-events":"none"});
  const {minX,maxX,minY,maxY}=museumBounds;
  base=landscape;
  const interior=svg(base,"g",{visibility:"hidden"});
  indoorMaps.push({id:"museum",layer:interior});
  svg(interior,"rect",{x:minX,y:minY,width:maxX-minX,height:maxY-minY,fill:"#625a46",stroke:"#d3b684","stroke-width":.7});
  for(const gallery of museumGalleries){
    svg(interior,"rect",{x:gallery.minX,y:gallery.minY,width:gallery.maxX-gallery.minX,
      height:gallery.maxY-gallery.minY,fill:gallery.mapColor,stroke:"#c0a782","stroke-width":.62});
    svg(interior,"line",{x1:gallery.doorX,x2:gallery.doorX,
      y1:gallery.doorY-museumHall.doorWidth/2,y2:gallery.doorY+museumHall.doorWidth/2,stroke:"#625a46","stroke-width":1.15});
    svg(interior,"text",{x:(gallery.minX+gallery.maxX)/2,y:(gallery.minY+gallery.maxY)/2+1.4,
      fill:"#fff1d9","font-size":mini?5.1:3.1,"text-anchor":"middle"},mini?gallery.shortName:gallery.name);
  }
  svg(interior,"line",{x1:78.4,x2:81.6,y1:maxY,y2:maxY,stroke:"#d4b985","stroke-width":1.6});
  drawIndoorMap(base,semaVenue,[],mini);
  drawIndoorMap(base,mmcaVenue,mmcaGalleryRooms,mini);
  drawIndoorMap(base,ARCADE_SITE,[],mini);
  drawIndoorMap(base,ARCADE_UPPER_SITE,[],mini);
  drawIndoorMap(base,ARCADE_THIRD_SITE,[],mini);
  for(const venue of diningVenues)drawIndoorMap(base,venue,[],mini);
  drawMapPoints(mini?outdoors:$("map-points"),mini);
}
function drawTransport(base,mini){
  for(const dock of bikeDocks)drawMapPoint(base,{...dock.access,name:dock.name},"bike",mini);
  for(const stop of busStops)drawMapPoint(base,{...stop.board,name:`${stop.name} · ${stop.direction}`},"bus",mini);
  for(const stop of transitStops)if(stop.mode==="subway")drawMapPoint(base,{...stop.arrive,name:stop.name},"subway",mini);
}
function drawMapPoints(base,mini){
  const plazaHeritage=["woldae","yi","sejong","ruins"];
  const heritage=[
    ...westSites,...pavilions,...gbSites,...corridorLandmarks,...jeongdongExtensionLandmarks,...hwangudanLandmarks,
    ...bukchonLandmarks.filter(point=>!point.name.includes("쉼터")),...plazaHeritage.map(key=>plazaSites[key]),
    ...cheonggyeLandmarks.slice(1),uijeongbuEntry,uijeongbuGarden,
    ...[[gate,"대한문"],[bridge,"금천교"],[middle,"중화문"],[hall,"중화전"],[stoneHall,"석조전"],
      [city[3],"정동제일교회"]].map(([point,name])=>({...point,name}))
  ];
  const parks=[
    ...Object.entries(plazaSites).filter(([key])=>key!=="gate"&&!plazaHeritage.includes(key)).map(([,point])=>point),
    ...bukchonLandmarks.filter(point=>point.name.includes("쉼터")),cheonggyeLandmarks[0],...songhyeonLandmarks,
    {...fountain,approach:jeongdongFountainApproach},
    ...[[stoneFountain,"분수 정원"],[palacePond,"연못"],[route[4],"덕수궁 돌담길"],
      [seoulPlazaApproach,"서울광장"]].map(([point,name])=>({...point,name}))
  ];
  const activities=[
    {...ticketApproach,name:"매표소"},{...buskingSpot,y:buskingSpot.y+2.5},{...hanbokRental,name:"한복 대여소"},
    ...traditionalGames.map(game=>({...game.point,id:game.id,name:game.name}))
  ];
  for(const [category,points] of [["heritage",heritage],["park",parks],["activity",activities]]){
    for(const point of points)drawMapPoint(base,point,category,mini);
  }
  drawTransport(base,mini);
}
function drawExtensionPaths(base,paths){
  for(const path of paths){
    const {points,width,kind,surface,edges}=path;
    if(kind==="crosswalk"&&path.left){
      mapBands(base,crosswalkPaintBands(path.left,path.right));
      continue;
    }
    const footprint=path.outline??(edges?[...edges[0],...edges[1].slice().reverse()]:extensionRibbon(points,width/2));
    svg(base,"polygon",{points:outline(footprint),fill:kind==="crossing"?"#4e5351":kind==="stairs"?"#c2b193":
      surface==="deck"?"#af805d":surface==="brick"?"#a48472":"#a69a80"});
    if(kind==="crossing")for(let i=1;i<points.length;i++)mapCrossing(base,points[i-1],points[i],width,[footprint]);
  }
}
function mapBands(base,bands){
  if(bands.length)svg(base,"path",{d:bands.map(points=>"M"+points.map(p=>p.x+","+p.y).join("L")+"Z").join(""),fill:"#e2ddc9"});
}
function mapCrossing(base,a,b,width,roads){
  for(const [start,end] of streetSegmentParts(a,b,roads)){
    const dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy);
    const offset=(p,side)=>({x:p.x-side*dy/len*width/2,y:p.y+side*dx/len*width/2});
    mapBands(base,crosswalkPaintBands([offset(start,1),offset(end,1)],[offset(start,-1),offset(end,-1)]));
  }
}
function drawCorridor(base,mini){
  for(const points of corridorSidewalks)svg(base,"polygon",{points:outline(points),fill:"#847c62"});
  for(const points of [corridorMainRoad,corridorAvenueJoin,...corridorBranches.map(branch=>branch.outline)])svg(base,"polygon",{points:outline(points),fill:"#4e5351"});
  svg(base,"polyline",{points:outline(corridorWalkSpine),fill:"none",stroke:"#d7c291","stroke-width":mini?1.15:2.6,
    "stroke-linejoin":"round","stroke-dasharray":"3 3"});
}
function drawOverview(base){
  const layer=svg(base,"g",{visibility:"hidden"});
  const path=[spawn,...corridorWalkSpine,...plazaPaths[0].points,palaceAt(0,-37),palaceAt(0,260)];
  svg(layer,"polyline",{points:outline(path),fill:"none",stroke:"#f1d18b","stroke-width":9,"stroke-linejoin":"round",
    "stroke-linecap":"round","stroke-dasharray":"14 9",opacity:.9});
  svg(layer,"polyline",{points:eastWalkRoute,fill:"none",stroke:"#ded2a9","stroke-width":7,"stroke-linejoin":"round",
    "stroke-linecap":"round","stroke-dasharray":"14 9",opacity:.9,"pointer-events":"none"});
  for(const [point,name] of [[spawn,"덕수궁"],[plazaAt(-12,240),"광화문광장"],[palaceAt(0,245),"경복궁"],
    [hwangudanLandmarks[0],"환구단"],[bukchonAlleyShortcut,"북촌"],[cheonggyeLandmarks[0],"청계천"],
    [songhyeonLandmarks[0],"열린송현"]]){
    const destination=svg(layer,"g",{"data-walk-x":point.x,"data-walk-y":point.y});
    svg(destination,"circle",{cx:point.x,cy:point.y,r:16,fill:"#f2d59b",stroke:"#40392c","stroke-width":5});
    mapLabels.add(destination,{...point,name},null,{area:true});
  }
  return layer;
}

// The detailed views crop the same continuous world around each district.
function drawGyeongbok(base){
  const box=(west,east,south,north)=>{
    const a=palaceAt(west,north),b=palaceAt(east,south);
    return {x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y};
  };
  svg(base,"rect",{...box(-92,48,-52,0),fill:"#766c5a"});
  svg(base,"polygon",{points:outline(gbWallOutline),fill:"#465248",stroke:"#929283","stroke-width":2.6});
  for(const {kind,west,east,south,north} of gbLawns){
    const grass=clipGbGround(west,east,south,north);
    if(grass.length>=3)svg(base,"polygon",{points:outline(grass),fill:kind==="grove"?"#314938":"#607651"});
  }
  for(const court of Object.values(gbCourts)){
    svg(base,"rect",{...box(court.west,court.east,court.south,court.north),fill:"#766c5a",stroke:"#a07d62","stroke-width":1.6});
  }
  for(const {points,width,surface} of gbPaths){
    svg(base,"polyline",{points:outline(points),fill:"none",stroke:surface==="stone"?"#c9b899":"#a29e7d","stroke-opacity":.6,
      "stroke-width":width,"stroke-linecap":"round","stroke-linejoin":"round"});
  }
  svg(base,"rect",{...box(gbLake.west,gbLake.east,gbLake.south,gbLake.north),fill:"#3b777d",stroke:"#739595","stroke-width":1.4});
  svg(base,"rect",{...box(gbLake.island.west,gbLake.island.east,gbLake.island.south,gbLake.island.north),fill:"#766c5a"});
  const pond=palaceAt(gbPond.east,gbPond.north);
  svg(base,"circle",{cx:pond.x,cy:pond.y,r:gbPond.radius,fill:"#3b777d",stroke:"#739595","stroke-width":1.4});
  svg(base,"circle",{cx:pond.x,cy:pond.y,r:gbPond.island,fill:"#607651"});
  for(const building of gbSites){
    svg(base,"rect",{x:building.x-building.w/2,y:building.y-building.d/2,width:building.w,height:building.d,
      fill:building.kind==="museum"?"#6f7468":"#827659",stroke:"#aa9774","stroke-width":1,rx:2,
      transform:"rotate("+(-(building.angle||0)*180/Math.PI)+" "+building.x+" "+building.y+")"});
  }
}
function drawCheonggye(base){
  const colors={road:"#4e5351",plaza:"#a49d88",paving:"#9a9584",crossing:"#c7c0aa",lower:"#af9979",water:"#477986",wood:"#c4a16a",
    stones:"#a5a597",ramp:"#bca886",steps:"#d4c5a8",bridge:"#9a9481"};
  const surfaces=[...cheonggyeRoadLeads,...cheonggyeSurfaces];
  const roads=surfaces.filter(({kind="road"})=>kind==="road"||kind==="bridge").map(s=>s.outline);
  for(const {kind="road",outline:points,stones,points:axis,width} of surfaces){
    if(stones){
      for(const {x,y,width,length} of stones)svg(base,"rect",{x:x-width/2,y:y-length/2,width,height:length,fill:colors.stones});
    }else if(kind==="crossing"){
      mapCrossing(base,axis[0],axis.at(-1),width,roads);
    }else svg(base,"polygon",{points:outline(points),fill:colors[kind],opacity:kind==="bridge"?.75:1});
  }
  for(const terrace of streamTerraces){
    const {side,from,to}=terrace;
    for(const tier of [1,2,3]){
      const line=Array.from({length:to-from+1},(_,i)=>bankAt(from+i,side,-terraceWidth(terrace,from+i)*tier/3));
      svg(base,"polyline",{points:outline(line),fill:"none",stroke:"#746e61","stroke-width":.25});
    }
  }
  const {west,north,south}=cheonggyeCascade;
  svg(base,"rect",{x:west,y:north,width:cheonggyeStations[0]-west,height:south-north,fill:colors.water});
  svg(base,"rect",{x:springBed.x-springBed.width/2,y:springBed.y-springBed.depth/2,width:springBed.width,height:springBed.depth,fill:"#74905e"});
}
function drawSonghyeon(base){
  svg(base,"polygon",{points:outline(songhyeonOutline),fill:"#658056",stroke:"#9b9c84","stroke-width":1.1});
  for(const {outline:points} of songhyeonLawns)svg(base,"polygon",{points:outline(points),fill:"#7f985f"});
  for(const {outline:points,kind} of songhyeonPaths){
    svg(base,"polygon",{points:outline(points),fill:kind==="walk"?"#b5a684":"#ad9c7e"});
  }
}
function drawPlaza(base){
  const northRoad=plazaAt(-310,sajikRoad.north);
  svg(base,"rect",{x:northRoad.x,y:northRoad.y,width:330,height:sajikRoad.north-sajikRoad.south,fill:"#3a4240"});
  svg(base,"polygon",{points:outline(plazaAvenueOutline),fill:"#4e5351"});
  for(const points of [...plazaWestPavement(),...plazaEastSidewalks,...plazaSideForecourts,plazaUijeongbuApproach])svg(base,"polygon",{points:outline(points),fill:"#a69a80"});
  svg(base,"polygon",{points:outline(plazaOutline),fill:"#6a6c56",stroke:"#9f977b","stroke-width":1.5});
  svg(base,"polygon",{points:outline(sejongParkOutline),fill:"#59754f",stroke:"#929283","stroke-width":1});
  for(const bed of plazaBeds)svg(base,"polygon",{points:outline(bed.outline),fill:bed.kind==="lawn"?"#849465":"#4d684f"});
  for(const {points,width,surface} of plazaPaths){
    svg(base,"polyline",{points:outline(points),fill:"none",stroke:surface==="stone"?"#b9ad90":"#9f9679",
      "stroke-width":width,"stroke-linecap":"round","stroke-linejoin":"round"});
  }
  for(const points of [sajikEastRoad,plazaSideJunction,uijeongbuSideRoad])svg(base,"polygon",{points:outline(points),fill:"#4e5351"});
  svg(base,"polygon",{points:outline(uijeongbuOutline),fill:"#6c7856",stroke:"#9c9a85","stroke-width":1.2});
  svg(base,"polygon",{points:outline(gardenVerge),fill:"#718457"});
  for(const points of [gardenSidewalk,uijeongbuBusPavement,...uijeongbuPavedConnections.map(i=>uijeongbuConnections[i])])
    svg(base,"polygon",{points:outline(points),fill:"#a69a80"});
  for(const {left,right} of uijeongbuCrossings)mapBands(base,crosswalkPaintBands(left,right));
  for(const {north,west,east} of plazaCrossingLandings){
    for(const points of [west,east])svg(base,"polygon",{points:outline(points),fill:"#a69a80"});
    const curb=eastCurb(north);
    mapCrossing(base,plazaAt(curb-2,north),plazaAt(curb+eastRoadWidth+2,north),7.05,[plazaAvenueOutline]);
  }
  const westSajik=[northRoad,plazaAt(20,sajikRoad.north),plazaAt(20,sajikRoad.south),plazaAt(-310,sajikRoad.south)];
  mapCrossing(base,plazaAt(sajikRoad.crossX,sajikRoad.south-2),plazaAt(sajikRoad.crossX,sajikRoad.north+2),sajikRoad.crossWidth,[westSajik]);
  for(const {points,width} of uijeongbuWalks)svg(base,"polyline",{points:outline(points),fill:"none",stroke:"#bba88a",
    "stroke-width":width,"stroke-linecap":"round","stroke-linejoin":"round"});
  for(const {east,north,width,length} of uijeongbuRemains){
    const point=plazaAt(east,north);
    svg(base,"rect",{x:point.x-width/2,y:point.y-length/2,width,height:length,fill:"#788861",stroke:"#b6b796",
      "stroke-width":1,transform:`rotate(-10.3 ${point.x} ${point.y})`});
  }
}
const gyeongbokViewBox=[42,gbBounds.minY-24,gbBounds.maxX-20,1098].join(" ");
const plazaViewBox=[285,plazaBounds.minY,plazaBounds.maxX-268,plazaBounds.maxY-plazaBounds.minY].join(" ");
const southViewBox="0 4 590 462",southApproachBox="0 -60 590 485";
const bukchonViewBox=[bukchonBounds.minX+12,bukchonBounds.minY-14,606,1076].join(" ");
const hwangudanViewBox=[hwangudanBounds.minX-55,hwangudanBounds.minY-35,433,303].join(" ");
const cheonggyeViewBox=[cheonggyeBounds.minX-55,cheonggyeBounds.minY-65,
  cheonggyeBounds.maxX-cheonggyeBounds.minX+76,231].join(" ");
const songhyeonViewBox=[songhyeonBounds.minX-24,songhyeonBounds.minY-18,
  songhyeonBounds.maxX-songhyeonBounds.minX+48,songhyeonBounds.maxY-songhyeonBounds.minY+46].join(" ");
const plazaApproachBox=[plazaBounds.minX-18,plazaBounds.minY+210,Math.max(plazaBounds.maxX,corridorBounds.maxX)-plazaBounds.minX+36,
  -58-(plazaBounds.minY+210)].join(" ");
const fieldViewBox=[worldExtent.minX,bukchonBounds.minY-26,bukchonBounds.maxX-worldExtent.minX+25,510-bukchonBounds.minY].join(" ");
const miniMapWidth=126,miniMapHeight=126;
function attr(node,key,value){if(node.getAttribute(key)!==String(value))node.setAttribute(key,value);}
function setMapView(view){
  const {base}=mapViewport;
  const x=Math.min(base.x+base.w*.96,Math.max(base.x-base.w*.66,view.x));
  const y=Math.min(base.y+base.h*.96,Math.max(base.y-base.h*.66,view.y));
  mapViewport.view={...view,x,y};
  attr(mapSurface,"viewBox",[x,y,view.w,view.h].join(" "));
  mapLabels.setView(base,mapViewport.view,overviewOpen);
}
const clearMapGestures=bindMapGestures(mapSurface,{getView:()=>mapViewport,setView:setMapView,onTap:walkFromMap});
// On a desktop the big map is always in view. Left alone for a few seconds, it drifts back
// to keep the walker in the middle, as far as the edges of the district allow.
const MAP_FOLLOW_AFTER_MS=3000;
let mapTouched=-Infinity,mapFollowed=0,mapBrowseOrigin=null;
function markMapActivity(){
  mapTouched=performance.now();
  mapBrowseOrigin={x:me.x,y:me.y};
}
for(const type of ["wheel","pointerdown","pointerup"])mapSurface.addEventListener(type,markMapActivity,{passive:true});
mapSurface.addEventListener("pointermove",event=>{if(event.buttons)markMapActivity();},{passive:true});
function followOnMap(self){
  const now=performance.now(),elapsed=Math.min(.5,(now-mapFollowed)/1000);
  mapFollowed=now;
  if(mobileHeader.matches||!mapViewport||overviewOpen||mapRoute&&!mapRoute.walking||now-mapTouched<MAP_FOLLOW_AFTER_MS)return;
  if(mapBrowseOrigin&&near(mapBrowseOrigin,self.x,self.y)<2)return;
  mapBrowseOrigin=null;
  const {base,view}=mapViewport;
  const fit=(low,size,span,at)=>span>=size?low+(size-span)/2:Math.min(low+size-span,Math.max(low,at-span/2));
  const dx=fit(base.x,base.w,view.w,self.x)-view.x,dy=fit(base.y,base.h,view.h,self.y)-view.y;
  if(Math.abs(dx)<view.w*.002&&Math.abs(dy)<view.h*.002)return;
  const ease=1-Math.exp(-elapsed*5);
  setMapView({...view,x:view.x+dx*ease,y:view.y+dy*ease});
}
function fitMapRegion(box){
  const [x,y,w,h]=box.split(" ").map(Number),width=mapSurface.clientWidth,height=mapSurface.clientHeight;
  if(mobileHeader.matches||!width||!height)return {x,y,w,h};
  const fittedWidth=Math.max(w,h*width/height),fittedHeight=Math.max(h,w*height/width);
  return {x:x-(fittedWidth-w)*.5,y:y-(fittedHeight-h)*.5,w:fittedWidth,h:fittedHeight};
}
function showMapRegion(box){
  if(mapViewport?.key===box)return;
  clearMapGestures();
  const base=fitMapRegion(box);
  mapViewport={key:box,base,view:base};setMapView(base);
}
function centerMapOnPlayer(){
  setOverview(false);
  const box=mapRegionAt(me,interiorAt(me.x,me.y),false);
  showMapRegion(box);
  const {view}=mapViewport;
  setMapView({...view,x:me.x-view.w/2,y:me.y-view.h/2});
  markMapActivity();
}
$("map-center").addEventListener("click",centerMapOnPlayer);
mapSurface.addEventListener("keydown",event=>{
  if(!mapViewport||event.altKey||event.ctrlKey||event.metaKey)return;
  const direction={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[event.key];
  if(!direction&&event.key!=="Home")return;
  event.preventDefault();event.stopPropagation();
  if(event.key==="Home"){centerMapOnPlayer();return;}
  const {view}=mapViewport;
  setMapView({...view,x:view.x+view.w*.13*direction[0],y:view.y+view.h*.13*direction[1]});
  markMapActivity();
});
if(typeof ResizeObserver!=="undefined")new ResizeObserver(()=>{
  if(!mapViewport)return;
  const {key,base,view}=mapViewport,fitted=fitMapRegion(key);
  if(base.w===fitted.w&&base.h===fitted.h)return;
  clearMapGestures();
  const zoom=view.w/base.w,w=fitted.w*zoom,h=fitted.h*zoom;
  mapViewport.base=fitted;
  setMapView({x:view.x+(view.w-w)*.5,y:view.y+(view.h-h)*.5,w,h});
}).observe(mapSurface);
function mapRegionAt(point,inside,overview){
  if(inside)return indoorViewBoxes[inside];
  if(overview)return fieldViewBox;
  const area=outdoorMap(point);
  if(area==="경희궁")return "-462 -550 450 430";
  if(area==="정동길")return "-265 -260 490 585";

  if(area==="북촌")return bukchonViewBox;
  if(area==="환구단")return hwangudanViewBox;
  if(area==="청계천")return cheonggyeViewBox;
  if(area==="열린송현녹지광장")return songhyeonViewBox;
  if(area==="경복궁")return gyeongbokViewBox;
  if(area==="광화문광장")return plazaViewBox;
  if(point.y<28&&area==="세종대로")return point.y<-58?plazaApproachBox:southApproachBox;
  return southViewBox;
}
const mapRoutePanel=$("map-route"),mapRoutePath=$("map-route-path"),mapRouteEnd=$("map-route-end");
const mapRouteWalk=$("map-route-walk");
function showMapRoute(site,{fit=true}={}){
  if(!session)return;
  resetInput();
  mapRoute={site,start:{x:me.x,y:me.y},steps:[]};
  refreshMapRoute(fit);
  setMap(true);
  $("world").focus({preventScroll:true});
  $("map-panel").scrollIntoView({block:"nearest"});
}
function mapRouteDestination(site){
  if(site.approach)return site.approach;
  if(walkable(site.x,site.y,platformAt(site.x,site.y)+.19))return site;
  const angle=site.angle??0,c=Math.cos(angle),s=Math.sin(angle);
  const width=(site.w??0)/2,depth=(site.d??0)/2;
  for(const padding of [2,5,10,18,30,48]){
    const candidates=[];
    for(let i=0;i<8;i++){
      const bearing=i*Math.PI/4;
      const along=Math.cos(bearing)*(width+padding),across=Math.sin(bearing)*(depth+padding);
      const point={x:site.x+c*along+s*across,y:site.y-s*along+c*across};
      if(walkable(point.x,point.y,platformAt(point.x,point.y)+.19))candidates.push(point);
    }
    if(candidates.length)return candidates.sort((a,b)=>near(me,a.x,a.y)-near(me,b.x,b.y))[0];
  }
  return site;
}
function refreshMapRoute(fit=false){
  const guide=mapRoute;
  guide.inside=interiorAt(me.x,me.y);
  guide.indoors=Boolean(guide.inside);
  const targetInterior=interiorAt(guide.site.x,guide.site.y);
  guide.leaving=guide.indoors&&targetInterior!==guide.inside;
  guide.stairs=guide.leaving?arcadeStairToward(guide.inside,targetInterior):null;
  guide.start={x:me.x,y:me.y};
  guide.loading=!world&&!worldFailed;
  guide.destination=guide.leaving?guide.stairs??venueAt(guide.inside)?.insideDoor:guide.loading?guide.site:mapRouteDestination(guide.site);
  guide.walking=false;
  guide.steps=guide.destination&&!guide.loading?walkingSteps(guide.destination):[];
  const end=guide.steps.at(-1);
  // The pathfinder may end at the nearest reachable cell when a path is obstructed.
  if(end&&near(guide.destination,end.x,end.y)>1.2)guide.steps=[];
  mapRoutePanel.hidden=false;
  setText($("map-route-name"),guide.site.name);
  if(fit){
    showMapRegion(mapRegionAt(me,guide.inside,false));
    const {base}=mapViewport,destination=guide.destination;
    const wide=!guide.indoors&&[guide.start,...guide.steps,destination].some(p=>
      p.x<base.x||p.x>base.x+base.w||p.y<base.y||p.y>base.y+base.h);
    setOverview(wide);
    if(wide)showMapRegion(fieldViewBox);
    if(destination)fitMapRoute([guide.start,...guide.steps,destination]);
  }
  drawMapRoute();
}
function fitMapRoute(points){
  const {base}=mapViewport,xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  const scale=Math.min(1.3,Math.max(.38,(right-left)/base.w+.16,(bottom-top)/base.h+.16));
  const w=base.w*scale,h=base.h*scale;
  setMapView({x:(left+right-w)/2,y:(top+bottom-h)/2,w,h});
}
function drawMapRoute(){
  const guide=mapRoute;
  if(!guide){attr(mapRoutePath,"visibility","hidden");return;}
  const {destination,steps,indoors,loading,walking}=guide;
  const points=[walking?me:guide.start,...steps];
  let length=0;
  for(let i=1;i<points.length;i++)length+=near(points[i-1],points[i].x,points[i].y);
  const distance=length>=1000?(length/1000).toFixed(1)+"km":Math.ceil(length)+"m";
  let text=(guide.stairs?"계단까지 ":guide.leaving?"출구까지 ":"도보 약 ")+distance;
  if(loading)text="도보 경로 찾는 중…";
  else if(length<.25&&near(destination??guide.site,me.x,me.y)<1.2)text=guide.stairs?.name??(guide.leaving?"출구":"도착");
  else if(!steps.length)text="이 위치에서 걸어가는 길을 찾지 못했어요";
  setText($("map-route-distance"),text);
  mapRouteWalk.disabled=!steps.length||length<.25||isCycling(me)||!canWalkTo();
  attr(mapRoutePath,"visibility",destination?"visible":"hidden");
  if(!destination)return;
  const path=steps.length?outline(points):"";
  attr(mapRoutePath.children[0],"points",path);
  attr(mapRoutePath.children[1],"points",path);
  attr(mapRouteEnd,"cx",destination.x);attr(mapRouteEnd,"cy",destination.y);
  attr(mapRouteEnd,"r",indoors?1.7:stampPins.get(guide.site.id)?.getAttribute("r")||mapViewport.view.h/105);
}
function clearMapRoute(){
  if(mapRoute?.walking&&course===mapRoute.steps)course=[];
  mapRoute=null;mapRoutePanel.hidden=true;drawMapRoute();
}
$("map-route-clear").addEventListener("click",()=>{
  clearMapRoute();
  $("world").focus({preventScroll:true});
});
mapRouteWalk.addEventListener("click",()=>{
  if(!mapRoute||!canWalkTo()||isCycling(me))return;
  if(near(mapRoute.start,me.x,me.y)>.4||mapRoute.walking)refreshMapRoute();
  const guide=mapRoute;
  if(!guide.steps.length)return;
  stand();guide.walking=true;course=guide.steps;pendingSeat=seatClaim=null;
  setMap(false);focusGame();
});
function drawDestinations(world){
  const shops=[...world.stations,...diningVenues.map(venue=>({...venue.outsideDoor,name:venue.name}))];
  const doors=[{...world.museum.outsideDoor,name:"덕수궁 전시관 입구"},{...mmcaVenue.outsideDoor,name:"국립현대미술관 입구"},{...semaVenue.outsideDoor,name:"서울시립미술관 입구"}];
  for(const [layer,mini] of [[$("map-points"),false],[$("mini-landscape").querySelector(".outdoor-map-ground"),true]]){
    for(const point of shops)drawMapPoint(layer,point,"shop",mini);
    for(const point of [...COOKING_STALLS,ARCADE_SITE])drawMapPoint(layer,point,"activity",mini);
    for(const point of doors)drawMapPoint(layer,point,"heritage",mini);
  }
}
function updateMaps(self,others){
  const area=outdoorMap(self);
  const inside=interiorAt(self.x,self.y),indoors=Boolean(inside),palace=area==="경복궁",plaza=area==="광화문광장";
  const corridor=area==="세종대로",overview=overviewOpen&&!indoors;
  const fullMap=$("map-panel").classList.contains("expanded")||!mobileHeader.matches&&!gameShell.classList.contains("game-fullscreen");
  const coat=hexCoat(self.coat??0xe5b672);
  if(fullMap){
    const mapArea=["북촌","환구단","청계천","열린송현녹지광장","경희궁","정동길"].includes(area)?area:
      palace?"경복궁":plaza||corridor&&self.y<-58?"광화문광장":"덕수궁";
    setText($("map-panel").querySelector("h2"),indoors?`${inside==="museum"?"전시관":venueById[inside].name} 지도`:overview?"전체 지도":mapArea+" 지도");
    $("world").classList.toggle("overview-map",overview);
    attr(overviewLayer,"visibility",overview?"visible":"hidden");
    overviewButton.hidden=indoors;
    attr($("my-avatar"),"transform","translate("+self.x+" "+self.y+")"+(indoors?" scale(.18)":overview?" scale(2.8)":palace?" scale(2.2)":plaza||corridor?" scale(1.55)":""));
    const parked=self.bike?.parked,parkedPin=$("parked-bike-pin");
    attr(parkedPin,"visibility",parked&&!indoors?"visible":"hidden");
    if(parked){
      attr(parkedPin,"cx",parked.x);attr(parkedPin,"cy",parked.y);
      attr(parkedPin,"data-walk-x",parked.x);attr(parkedPin,"data-walk-y",parked.y);
      attr(parkedPin,"r",overview?16:palace?10:6);
    }
    attr($("my-avatar").querySelector("circle"),"fill",coat);
    if(mapCoatKey.style.getPropertyValue("--coat")!==coat)mapCoatKey.style.setProperty("--coat",coat);
    $("world").classList.toggle("museum-map",indoors);
    attr($("stamp-pins"),"visibility",indoors?"hidden":"visible");
    attr($("map-points"),"visibility",indoors?"hidden":"visible");
  }
  attr($("mini-my"),"fill",coat);
  attr($("mini-my"),"transform","translate("+self.x+" "+self.y+") rotate("+self.heading+") scale("+(indoors?.47:1.5)+")");
  for(const {id,layer} of indoorMaps)attr(layer,"visibility",id===inside?"visible":"hidden");
  $("mini-world").classList.toggle("museum-map",indoors);
  showMapRegion(mapRegionAt(self,inside,overview));
  followOnMap(self);
  attr($("mini-world"),"viewBox",indoors?indoorViewBoxes[inside]:[
    (self.x-miniMapWidth/2).toFixed(1),(self.y-miniMapHeight/2).toFixed(1),miniMapWidth,miniMapHeight
  ].join(" "));
  if(fullMap&&!indoors){
    const radius=(overview?13:palace?8:plaza||corridor?6:4.8)*Math.sqrt(mapViewport.view.h/mapViewport.base.h);
    for(const [id,pin] of stampPins){
      const visited=passport.visited(id);
      pin.classList.toggle("collected",visited);
      pin.classList.toggle("selected",id===mapRoute?.site.id);
      const label=stampById.get(id).name+(visited?" · 도장 완료":" · 미방문");
      setText(pin.firstElementChild,label);attr(pin,"aria-label",label);attr(pin,"r",radius);
    }
  }
  if(mapRoute){
    if(mapRoute.inside!==inside||mapRoute.loading&&(world||worldFailed))refreshMapRoute(true);
    else if(mapRoute.walking&&course!==mapRoute.steps)refreshMapRoute();
    else if(fullMap)drawMapRoute();
  }
  for(const actor of others.values()){
    let mark=markers.get(actor.id);
    if(!mark){
      const fill=hexCoat(actor.coat);
      const big=svg($("map-people"),"circle",{r:8,fill,class:"room-dot"});
      const mini=svg($("mini-people"),"circle",{fill,class:"room-dot-mini"});
      svg(big,"title",{},actor.nickname);
      mark={big,mini};markers.set(actor.id,mark);
    }
    const visible=interiorAt(actor.x,actor.y)===inside?"visible":"hidden";
    attr(mark.mini,"cx",actor.x);attr(mark.mini,"cy",actor.y);
    attr(mark.mini,"r",indoors?1.1:3.75);attr(mark.mini,"visibility",visible);
    if(fullMap){
      attr(mark.big,"cx",actor.x);attr(mark.big,"cy",actor.y);
      attr(mark.big,"r",indoors?1.45:overview?20:palace?17:plaza||corridor?12:8);attr(mark.big,"visibility",visible);
    }
  }
  for(const [id,mark] of markers)if(!others.has(id)){mark.big.remove();mark.mini.remove();markers.delete(id);}
}

const indoorViewBoxes=Object.fromEntries(Object.entries(interiorBounds).map(([id,{minX,maxX,minY,maxY}])=>
  [id,[minX-4,minY-4,maxX-minX+8,maxY-minY+8].join(" ")]));
for(const exhibit of Object.values(museumExhibits)){
  const item=document.createElement("li"),link=document.createElement("a");
  link.href=exhibit.source;link.target="_blank";link.rel="noopener";
  link.textContent=exhibit.title+" · "+exhibit.sourceLabel;
  item.append(link);$("exhibit-credits").append(item);
}
drawMap($("map-landscape"));overviewLayer=drawOverview($("map-landscape"));
drawMap($("mini-landscape"),true);
const stampById=new Map(passportStamps.map(stamp=>[stamp.id,stamp]));
const stampPins=new Map(passportStamps.map(stamp=>{
  const mark=svg($("stamp-pins"),"g",{"data-stamp-id":stamp.id,"data-map-category":"stamp"});
  const pin=svg(mark,"circle",{cx:stamp.x,cy:stamp.y,role:"button",tabindex:"0","aria-label":stamp.name,
    "data-stamp-id":stamp.id});
  svg(pin,"title",{},stamp.name);
  mapLabels.add(mark,stamp,"stamp");setMarkerFilter(mark);
  return [stamp.id,pin];
}));
const savedCode=sessionStorage.getItem("jeongdong-room-code");
const savedOpen=sessionStorage.getItem("jeongdong-room-mode")==="open";
if(nickname.value&&(savedCode&&(!suppliedCode||suppliedCode===savedCode)||savedOpen&&!suppliedCode)){
  showServers();enterRoom(savedOpen&&!suppliedCode?"open":"join",savedCode);
}
function loadWorld(){
  if(world||worldLoading)return worldLoading;
  worldLoading=import("./world3d.js").then(({makeWorld})=>{
    world=makeWorld($("game"),{onCatFlee,catSeed:session?.room,graphics:graphicsSelect.value});worldFailed=false;
    drawDestinations(world);$("loading-game").hidden=true;
    if($("character-dialog").open)refreshCharacterPreview();
  }).catch(()=>{
    worldFailed=true;$("loading-game").textContent="이 브라우저에서 3D 산책을 열 수 없어요.";
  }).finally(()=>{worldLoading=null;});
  return worldLoading;
}
requestAnimationFrame(frame);
