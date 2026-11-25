import {busCount as coastBusCount} from "./public/coast-fleet.js";
import {cruiseSeatById} from "./public/coast-vessel-seats.js";
import {mainDeckRail,gangwayHeight} from "./public/coast-vessel-layout.js";
import {validWishArt, WISH_FLIGHT_MS} from "./public/wish-art.js";
import {FEED_MS, ITEMS} from "./public/activities.js";
import {validItemSlot} from "./public/held-items.js";
import {BIKE_FALL_DURATION_MS,GESTURE_DURATIONS,MAX_ALCOHOL_DRINKS,MAX_ALCOHOL_LEVEL} from "./public/avatar-gestures.js";
import {interiorAt} from "./public/interior-layout.js";
import {arcadeFloorAt} from "./public/arcade-layout.js";
import {BUS_COUNT,BUS_SEATS,RAFT_INDEX,busAt,busBoardReach,busSeatCount,busStopById,busSeatPose} from "./public/bus-network.js";
import {raftPoseAt} from "./public/gyeongju-raft-navigation.js";
import {validRaftCommand,readRaft,currentRaft,settleRaft,dropRaftHelm,applyRaftCommand} from "./server/gyeongju-raft.mjs";
import {bikeDockReach,bikeDocks,bikeMountReach,bikeParkDuration,bikePassengerPose} from "./public/sejong-bike.js";
import {gyeongjuBikeDocks} from "./public/gyeongju-bike.js";
import {acceptBikeRide,bikePassenger,closeBikeOffer,dismountBikePassenger,dropBikePassengers,ensureBikeOffers,
  leaveBikeOffers,mountedBike,refreshBikePassenger,requestBikeRide,ridingBike,selectBikeOffer} from "./server/bike-passengers.mjs";
import {HEADWEAR,KEEPSAKES} from "./public/wearable-options.js";
import {LOOK_OPTIONS} from "./public/look-options.js";
import {GITHUB_PAGES_ORIGIN} from "./public/hosting.js";
import {inGameWorld} from "./public/world-extent.js";
import {gyeongjuBounds,inGyeongjuSpace} from "./public/region-coordinates.js";
import {exchangeMotion} from "./server/motion.mjs";
import {ensureLiftTables,readLifts,roomLifts,validLift} from "./server/station-lifts.mjs";
import {ensureSocialTables} from "./database/social-schema.mjs";
import {roomYields,selectYields,yieldEntries} from "./server/room-crossings.mjs";
import {belongings} from "./public/walk-inventory.js";
import {applyInventory,validInventory} from "./server/walk-inventory.mjs";
import {ensureRoomPhotos,roomPhotoPayload,selectRoomPhoto,validPhoto,writeRoomPhoto} from "./server/room-photo.mjs";
import {getRoomWeather} from "./server/room-weather.mjs";
import {arcadeSnapshotLifetime,cleanArcadeActivity} from "./server/room-arcade.mjs";
import {ensureRoomBowling,pruneRoomBowling,roomBowling,selectRoomBowling,validBowling} from "./server/room-bowling.mjs";
import {cleanupSocial,clinkStatement,leaveClinks,selectSocial,socialPayload,startFountainShow} from "./server/social.mjs";
import {ensureMinigameTables} from "./database/minigame-schema.mjs";
import {cleanupMinigames,leaveMinigames,minigamePayload,minigameStatements,selectMinigames,validMinigame} from "./server/minigames.mjs";
import {ensureUmbrellaPairs,umbrellaWeather,umbrellaActorsReady,umbrellaPairMarked,umbrellaPairJoin,
  visibleUmbrellaPairs,markUmbrellaPair,purgeUmbrellaPairs,clearUmbrellaMarkers} from "./server/umbrella-pairs.mjs";
import {ensurePicnicTables,validPicnic,picnicStatements,selectPicnics,picnicPayload,cleanupPicnics} from "./server/picnic.mjs";
import {advanceBungeoOrder,ensureBungeoTables,validBungeo,bungeoStatements,selectBungeo,bungeoPayload,cleanupBungeo} from "./server/bungeo.mjs";
import {BUNGEO_STALL,cookingStallById} from "./public/bungeo-data.js";
import {handleGuestbook} from "./server/guestbook.mjs";
import {diningService,ensureDiningService,isDiningVenue,pruneDiningService,selectDiningService,validDiningCommand} from "./server/dining-service.mjs";

const json = (data, status = 200) => Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const validId = (value) => typeof value==="string" && /^[a-f0-9]{32}$/.test(value);
const finite = (value,min,max) => typeof value==="number" && value>=min && value<=max;
// The shared map keeps Deoksugung's original origin. The route and palace extend north of it.
const validPoint = (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y) && inGameWorld(point);
const validTime = (value) => finite(value,0,9999999999999);
const reactions = new Set(["😊","😂","❤️","👍","😮","😢","😠","✨"]);
// Hair, eyes and outfit are required; choices added later are optional so older clients still pass.
const requiredLook = ["hair","eyes","outfit"];
const validLook = (look) => look==null ||
  Object.entries(LOOK_OPTIONS).every(([feature,choices]) =>
    look[feature]===undefined ? !requiredLook.includes(feature) : choices.includes(look[feature])) &&
  (look.headwear===undefined||HEADWEAR.includes(look.headwear)) &&
  (look.keepsake===undefined||KEEPSAKES.includes(look.keepsake));
const validItem=item=>item==null||typeof item.kind==="string"&&Object.hasOwn(ITEMS,item.kind)&&
  Number.isInteger(item.remaining)&&finite(item.remaining,0,ITEMS[item.kind].uses)&&validTime(item.started);
// Benches, dining chairs and the places along the Cheonggyecheon water's edge.
const lastBenchIndex=1023;
const coastModes=new Set(["scooter","walk","swim","surf","deck","bus","table"]);
function validCruiseFooting(s){
  if((s.floor==null||finite(s.floor,2.45,7.86))&&(s.deckX==null||finite(s.deckX,-5,5)))return true;
  if(s.mode!=="deck"||!Number.isFinite(s.deckX)||!Number.isFinite(s.deckZ))return false;
  const h=gangwayHeight({x:s.deckX,z:s.deckZ});
  return h!=null&&finite(s.floor,h-.02,h+.02);
}
const validCoast=s=>s==null||coastModes.has(s.mode)&&typeof s.board==="boolean"&&
  (s.beachJumpY==null||s.beachJumpY===1.85)&&
  (s.deckJumpY==null||finite(s.deckJumpY,2.45,7.86))&&
  (s.tableGlass==null||typeof s.tableGlass==="boolean")&&
  (s.surf==null||s.mode==="surf"&&s.board&&finite(s.surf.speed,0,11)&&finite(s.surf.rise,0,1)&&finite(s.surf.bank,-1,1))&&
  (s.swimwear==null||["navy","tide","coral"].includes(s.swimwear))&&
  (s.rinse==null||["north-rinse","south-rinse"].includes(s.rinse.site)&&validTime(s.rinse.at))&&
  (s.track==null||finite(s.track,0,62))&&validCruiseFooting(s)&&(s.deckZ==null||finite(s.deckZ,-18,mainDeckRail.front))&&
  (s.deckSeat==null||s.mode==="deck"&&cruiseSeatById.has(s.deckSeat))&&
  (s.cafeFloor==null||finite(s.cafeFloor,1.84,6.11))&&
  (s.mode!=="bus"||Number.isInteger(s.coach)&&finite(s.coach,0,coastBusCount-1)&&Number.isInteger(s.chair)&&finite(s.chair,0,7));
const validAvatar = (a) => validPoint(a) && validCoast(a.coast) && [a.groundSit,a.kissReady].every(v=>v===undefined||typeof v==="boolean") &&
  (a.bagClaim==null||validId(a.bagClaim)) &&
  (a.character===undefined || a.character==="man" || a.character==="woman") &&
  validLook(a.look) &&
  (a.wave===undefined || finite(a.wave,0,9999999999999)) &&
  (a.kick===undefined || validTime(a.kick)) &&
  (a.gesture==null || Object.hasOwn(GESTURE_DURATIONS,a.gesture.kind)&&validTime(a.gesture.at)) &&
  (a.jump===undefined || validTime(a.jump)) &&
  (a.vaultBase==null || a.jump>0 && finite(a.vaultBase,0,.65)) &&
  (a.emote==null || reactions.has(a.emote.emoji) && finite(a.emote.at,0,9999999999999)) &&
  (a.vx===undefined || finite(a.vx,-12,12)) && (a.vy===undefined || finite(a.vy,-12,12)) &&
  (a.blocked===undefined || typeof a.blocked==="boolean") &&
  (a.up===undefined || typeof a.up==="boolean") &&
  (a.heading===undefined || finite(a.heading,0,360)) &&
  (a.seat==null || Number.isInteger(a.seat) && finite(a.seat,0,lastBenchIndex)) &&
  (a.seatSide==null || (a.seatSide===0 || a.seatSide===1) && a.seat!=null) &&
  (a.running===undefined || typeof a.running==="boolean") &&
  (a.umbrella===undefined || typeof a.umbrella==="boolean") &&
  (a.umbrellaReady===undefined || typeof a.umbrellaReady==="boolean") &&
  (a.picnicClaim==null || validId(a.picnicClaim)) &&
  (a.bungeoClaim==null || validId(a.bungeoClaim)) &&
  (a.bungeoReady===undefined || typeof a.bungeoReady==="boolean") &&
  (a.catFriends===undefined || Array.isArray(a.catFriends) && a.catFriends.length<=64 &&
    new Set(a.catFriends).size===a.catFriends.length && a.catFriends.every(id=>typeof id==="string"&&/^[a-z0-9-]{1,32}$/.test(id))) &&
  (a.wish===undefined || validTime(a.wish)) &&
  (a.wishOrigin==null || validPoint(a.wishOrigin)) &&
  (a.wishHeading===undefined || finite(a.wishHeading,0,360)) &&
  (a.wishArt==null || a.wish>0 && validPoint(a.wishOrigin) && validWishArt(a.wishArt)) &&
  validItem(a.item) && validItem(a.secondItem) && (a.itemUse==null||validItemSlot(a.itemUse)) &&
  (a.blushUntil===undefined || validTime(a.blushUntil)) &&
  (a.blushLevel===undefined || Number.isInteger(a.blushLevel) && finite(a.blushLevel,0,MAX_ALCOHOL_LEVEL)) &&
  (a.alcoholGlasses===undefined || Number.isInteger(a.alcoholGlasses) && finite(a.alcoholGlasses,0,MAX_ALCOHOL_DRINKS)) &&
  (a.sickAt===undefined || validTime(a.sickAt)) &&
  (a.pet==null || typeof a.pet.id==="string" && /^[a-z0-9-]{1,32}$/.test(a.pet.id) && validTime(a.pet.at));
const validView = (v) => v && finite(v.pan,-720,720) && finite(v.tilt,-90,90) &&
  finite(v.zoom,-3,3) && (v.night===undefined || typeof v.night==="boolean");
const validHand = (h) => h && validId(h.id) && (h.kind===undefined||h.kind==="umbrella") && (h.action==="release" ||
  (h.side===-1 || h.side===1) && (h.action==="accept" || h.action==="offer" && validId(h.peer)));
const validShow=show=>validId(show?.id)&&show.fountain==="myeongnyang";
const validClink=(clink,id)=>validId(typeof clink?.id==="string"?clink.id.replace(/^kiss-/,""):null)&&(clink.action==="invite"?
  validId(clink.target)&&clink.target!==id:clink.action==="accept"||clink.action==="decline"||clink.action==="cancel");
const validFeed = (feed) => feed && validId(feed.claim) && validTime(feed.at) &&
  (feed.slot===undefined||validItemSlot(feed.slot)) &&
  typeof feed.id==="string" && /^[a-z0-9-]{1,32}$/.test(feed.id);
const busIndex = index => Number.isInteger(index)&&index>=0&&index<BUS_COUNT;
const busSeat = (index,seat) => Number.isInteger(seat)&&seat>=0&&seat<busSeatCount(index);
const validBus = bus => bus?.action==="board"?busIndex(bus.index)&&busSeat(bus.index,bus.seat):
  bus?.action==="exit"&&(bus.index==null||busIndex(bus.index));
const docksById=new Map([...bikeDocks,...gyeongjuBikeDocks].map(dock=>[dock.id,dock]));
const tandemActions=new Set(["requestRide","acceptRide","declineRide","cancelRide"]);
const validBike = (bike,id) => tandemActions.has(bike?.action)?validId(bike.id)&&
  (bike.action!=="requestRide"||validId(bike.driver)&&bike.driver!==id):
  bike?.action==="ride"?validId(bike.driver)&&bike.driver!==id:
  bike?.action==="park"||bike?.action==="mount"||bike?.action==="fall"||bike?.action==="dismount"||
  (bike?.action==="take"||bike?.action==="return")&&docksById.has(bike.dock);
const parkedBikeTime="json_extract(avatar,'$.bike.parked.at')";
const parkedBikePatch=`CASE WHEN ${parkedBikeTime}>?
  THEN json_object('bike',json_extract(avatar,'$.bike')) ELSE '{}' END`;

const codeAlphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const openRoomId="00000000000000000000000000000001";
const chatLifetime=6000,walkerLifetime=18_000;
const clothes=[
  0xb85545,0x308070,0x5f75bb,0xb77934,0xa2548c,0x6d8647,0x3084a2,0xb34762,
  0x9474bb,0x33716b,0xcc9250,0x5568a3,0x917249,0x8d4844,0x4f8858,0x8358a1,
  0xa15163,0x396c8e,0x70854a,0xb86c53,0x449b91,0x586d95,0xba734b,0xa25f8d,
  0x556f50,0x577bb4,0xa99646,0x8d5273,0x546fc4,0x478d74,0xb65b73,0x8c785f
];
const roomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),
  byte=>codeAlphabet[byte%codeAlphabet.length]).join("");
const newId=()=>crypto.randomUUID().replaceAll("-","");
const validCode=(value)=>typeof value==="string" && /^[A-HJ-NP-Z2-9]{8}$/.test(value);
function cleanName(value){
  if(typeof value!=="string")return "";
  const name=value.normalize("NFC").trim().replace(/\s+/g," ");
  return [...name].length<=16 && !/[\p{Cc}\p{Bidi_Control}]/u.test(name) ? name : "";
}
function cleanChat(chat){
  if(!validId(chat?.id)||!validTime(chat.at)||typeof chat.text!=="string")return null;
  const text=chat.text.normalize("NFC").trim().replace(/\s+/g," ");
  if(!text||[...text].length>80||/[\p{Cc}\p{Bidi_Control}]/u.test(text))return null;
  return {id:chat.id,text,sentAt:chat.at};
}
const expiredRidePatch=`CASE WHEN json_type(avatar,'$.bus.resume')='object'
  THEN json_patch(json_extract(avatar,'$.bus.resume'),json_object('vx',0,'vy',0,'jump',0,
    'running',json('false'),'blocked',json('false'),'up',json('false')))
  ELSE '{}' END`;
const invalidBusRide=`(json_type(avatar,'$.bus') IS 'object' AND (
  json_type(avatar,'$.bus.index') IS NOT 'integer' OR json_extract(avatar,'$.bus.index') NOT BETWEEN 0 AND ${BUS_COUNT-1}
  OR json_type(avatar,'$.bus.seat') IS NOT 'integer' OR json_extract(avatar,'$.bus.seat') NOT BETWEEN 0 AND ${BUS_SEATS-1}
  OR (json_extract(avatar,'$.bus.index')=${RAFT_INDEX} AND json_extract(avatar,'$.bus.seat')>=${busSeatCount(RAFT_INDEX)})
))`;
async function enterRoom(db,body){
  const {action,id,key,avatar,view}=body||{};
  const nickname=cleanName(body?.nickname);
  if(!nickname||!validId(id)||!validId(key)||!validAvatar(avatar)||!validView(view)){
    return json({error:"닉네임과 산책방 정보를 확인해 주세요."},400);
  }
  let target;
  const now=Date.now();
  const active=now-walkerLifetime;
  if(action==="open"){
    await db.prepare("INSERT OR IGNORE INTO rooms (id,code,created) VALUES (?,?,?) RETURNING id")
      .bind(openRoomId,"_open",now).all();
    target={id:openRoomId,code:null};
  }else if(action==="create"){
    for(let attempt=0;attempt<4&&!target;attempt++){
      const {results}=await db.prepare("INSERT OR IGNORE INTO rooms (id,code,created) VALUES (?,?,?) RETURNING id,code")
        .bind(newId(),roomCode(),now).all();
      target=results[0];
    }
    if(!target)return json({error:"초대코드를 다시 만들어 주세요."},503);
  }else if(action==="join"){
    const code=typeof body.code==="string"?body.code.trim().toUpperCase():"";
    if(!validCode(code))return json({error:"8자리 초대코드를 입력해 주세요."},400);
    const {results}=await db.prepare("SELECT id,code FROM rooms WHERE code = ?").bind(code).all();
    target=results[0];
    if(!target)return json({error:"이 초대코드에 해당하는 방을 찾을 수 없어요."},404);
  }else{
    return json({error:"서버에 들어가는 방법을 선택해 주세요."},400);
  }
  const fallback=0x445544+(crypto.getRandomValues(new Uint32Array(1))[0]%0x888888);
  const initialAvatar={...avatar,...belongings(avatar),seat:null,seatSide:null,feed:null,bagClaim:null};
  delete initialAvatar.chat;
  delete initialAvatar.bus;
  delete initialAvatar.bike;
  delete initialAvatar.bikeRide;
  delete initialAvatar.bikeFallAt;
  delete initialAvatar.picnicClaim;
  delete initialAvatar.bungeoClaim;
  delete initialAvatar.arcade;
  const {results}=await db.prepare(`
    INSERT INTO walkers (room,id,updated,avatar,view,player_key,nickname,coat)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((
      SELECT value FROM json_each(?) colors
      WHERE NOT EXISTS (SELECT 1 FROM walkers w WHERE w.room = ? AND w.updated >= ? AND w.coat = colors.value)
      ORDER BY MIN(10000, COALESCE((
        SELECT MIN(
          ((colors.value >> 16) - (w.coat >> 16)) * ((colors.value >> 16) - (w.coat >> 16)) +
          (((colors.value >> 8) & 255) - ((w.coat >> 8) & 255)) *
          (((colors.value >> 8) & 255) - ((w.coat >> 8) & 255)) +
          ((colors.value & 255) - (w.coat & 255)) * ((colors.value & 255) - (w.coat & 255))
        ) FROM walkers w WHERE w.room = ? AND w.updated >= ? AND w.coat IS NOT NULL
      ), 10000)) DESC, random() LIMIT 1
    ), ?))
    ON CONFLICT(room,id) DO UPDATE SET updated=MAX(walkers.updated,excluded.updated),
      avatar=json_remove(CASE WHEN walkers.updated<? THEN json_patch(
        json_patch(json_remove(walkers.avatar,'$.bus','$.bike','$.bikeRide'), ${expiredRidePatch}), ${parkedBikePatch})
        ELSE walkers.avatar END,'$.arcade')
      WHERE walkers.player_key IS excluded.player_key
    RETURNING nickname,coat
  `).bind(target.id,id,now,JSON.stringify(initialAvatar),JSON.stringify(view),key,nickname,
    JSON.stringify(clothes),target.id,active,target.id,active,fallback,active,now-bikeParkDuration).all();
  if(!results[0])return json({error:"산책방에 다시 입장해 주세요."},409);
  await ensureSocialTables(db);
  const entryYields=yieldEntries((await selectYields(db,target.id,now).all()).results);
  return json({room:target.id,code:target.code,mode:action==="open"?"open":"private",profile:results[0],busYields:entryYields,
    serverTime:now,weather:await getRoomWeather(db,now)});
}

function avatarUpdate(db,room,id,key,avatar,view,now,active,pendingFeed="",bikeAction,pendingPicnic,pendingBungeo,busAction){
  const {feed,chat,bus,bike,bikeRide,bikeFallAt,picnicClaim,bungeoClaim,arcade,bag,plushHead,plushBack,bagClaim,...snapshotData}=avatar;
  const activity=key&&cleanArcadeActivity(avatar);
  if(activity)snapshotData.arcade=activity;
  const snapshot=JSON.stringify(snapshotData);
  const inheritWish=avatar.wishArt===undefined&&avatar.wish>now-WISH_FLIGHT_MS?avatar.wish:null;
  const acknowledgedFeed=validId(feed?.claim)?feed.claim:null;
  const snapshotPatch=`json_patch(json_patch(json_patch(
    json_patch(
      CASE WHEN json_extract(avatar,'$.wish')=? AND json_type(avatar,'$.wishArt')='array'
        THEN json_object('wishArt',json_extract(avatar,'$.wishArt')) ELSE '{}' END,
      CASE WHEN json_type(avatar,'$.feed')='object'
        THEN json_object('feed',json_extract(avatar,'$.feed'))
        ELSE '{}' END),
    CASE WHEN json_type(avatar,'$.chat')='object' THEN json_object('chat',json(
      CASE WHEN json_extract(avatar,'$.chat.at')>? THEN json_extract(avatar,'$.chat')
        ELSE json_remove(json_extract(avatar,'$.chat'),'$.text') END))
      ELSE '{}' END),
    CASE WHEN json_type(avatar,'$.picnicClaim')='text'
      THEN json_object('picnicClaim',json_extract(avatar,'$.picnicClaim'))
      ELSE '{}' END),
    CASE WHEN json_type(avatar,'$.bungeoClaim')='text'
      THEN json_object('bungeoClaim',json_extract(avatar,'$.bungeoClaim'))
      ELSE '{}' END)`;
  const inventoryPatch=`CASE WHEN
      (json_type(avatar,'$.bagClaim')='text' AND json_extract(avatar,'$.bagClaim') IS NOT ?)
      OR
      (json_type(avatar,'$.feed')='object' AND json_extract(avatar,'$.feed.claim') IS NOT ?)
      OR (json_type(avatar,'$.picnicClaim')='text' AND json_extract(avatar,'$.picnicClaim') IS NOT ?)
      OR (json_type(avatar,'$.bungeoClaim')='text' AND json_extract(avatar,'$.bungeoClaim') IS NOT ?)
    THEN json_patch(json_object('item',json_extract(avatar,'$.item'),'secondItem',json_extract(avatar,'$.secondItem')),
      ${avatar.coast?`CASE WHEN json_type(avatar,'$.coast.board') IN ('true','false')
        THEN json_object('coast',json_object('board',json(json_type(avatar,'$.coast.board')))) ELSE '{}' END`:"'{}'"})
    ELSE '{}' END`;
  const applySnapshot=base=>`json_set(json_patch(json_patch(json_patch(${base},${snapshotPatch}),${inventoryPatch}),${transportPatch}),
    '$.bag',coalesce(json_extract(avatar,'$.bag'),json('[]')),'$.bagClaim',json_extract(avatar,'$.bagClaim'),
    '$.plushHead',json_extract(avatar,'$.plushHead'),'$.plushBack',json_extract(avatar,'$.plushBack'))`;
  // A regular avatar packet cannot reserve or release a vehicle. A lease that
  // expired while the player was disconnected must not reclaim its old seat.
  const vehiclePose=`'x',json_extract(avatar,'$.x'),'y',json_extract(avatar,'$.y'),
    'heading',json_extract(avatar,'$.heading'),'vx',0,'vy',0,'running',json('false'),
    'blocked',json('false'),'up',json('false'),'jump',0`;
  // The first mount changes the canonical pose. A retry still posts the old approach pose.
  const mountedPose=bikeAction==="mount"?`,${vehiclePose}`:"";
  // A delayed ride packet or repeated exit can still carry a position from the river.
  const stalePassenger=bikeRide?.driver||busIndex(bus?.index)||busAction==="exit";
  const transportPatch=`json_patch(json_patch(${parkedBikePatch},
    CASE WHEN json_extract(avatar,'$.bikeFallAt') IS NOT NULL
      THEN json_object('bikeFallAt',json_extract(avatar,'$.bikeFallAt')) ELSE '{}' END),
    CASE WHEN updated<? OR ${invalidBusRide} THEN ${expiredRidePatch}
    WHEN json_type(avatar,'$.bus')='object' THEN json_object(
      'bus',json_extract(avatar,'$.bus'),'seat',NULL,'seatSide',NULL,${vehiclePose})
    WHEN ${bikePassenger()} THEN json_object('bikeRide',json_extract(avatar,'$.bikeRide'),
      'seat',NULL,'seatSide',NULL,${vehiclePose})
    WHEN ${mountedBike()} THEN json_object(
      'bike',json_extract(avatar,'$.bike'),'seat',NULL,'seatSide',NULL${mountedPose})
    ELSE ${stalePassenger?`json_object('seat',NULL,'seatSide',NULL,${vehiclePose})`:"'{}'"} END)`;
  const bikeCutoff=now-bikeParkDuration;
  const picnicGuard=pendingPicnic?`AND NOT EXISTS (SELECT 1 FROM picnic_requests p
    WHERE p.room=walkers.room AND p.player=walkers.id AND p.request=?)`:"";
  const picnicArgs=pendingPicnic?[pendingPicnic]:[];
  const bungeoGuard=pendingBungeo?`AND NOT EXISTS (SELECT 1 FROM bungeo_requests r
    WHERE r.room=walkers.room AND r.player=walkers.id AND r.request=?)`:"";
  const bungeoArgs=pendingBungeo?[pendingBungeo]:[];
  if(avatar.seat==null){
    return db.prepare(`
      UPDATE walkers SET updated=MAX(updated,?), avatar=${applySnapshot("?")}, view=?
      WHERE room=? AND id=? AND player_key IS ?
        AND json_extract(avatar,'$.feed.claim') IS NOT ? ${picnicGuard} ${bungeoGuard}
    `).bind(now,snapshot,inheritWish,now-chatLifetime,bagClaim??null,acknowledgedFeed,picnicClaim??null,bungeoClaim??null,
      bikeCutoff,active,JSON.stringify(view),room,id,key,pendingFeed,...picnicArgs,...bungeoArgs);
  }
  const preferred=avatar.seatSide??0;
  const seatSnapshot=`COALESCE((
      SELECT json_set(?, '$.seatSide', slot) FROM (SELECT ? AS slot UNION ALL SELECT ?)
      WHERE NOT EXISTS (
        SELECT 1 FROM walkers peer
        WHERE peer.room=? AND peer.id<>? AND peer.updated>=?
        AND json_extract(peer.avatar,'$.seat')=?
        AND (json_type(peer.avatar,'$.coast.mode') IS NOT NULL)=?
        AND (json_extract(peer.avatar,'$.x') BETWEEN ${gyeongjuBounds.minX} AND ${gyeongjuBounds.maxX}
          AND json_extract(peer.avatar,'$.y') BETWEEN ${gyeongjuBounds.minY} AND ${gyeongjuBounds.maxY})=?
        AND COALESCE(json_extract(peer.avatar,'$.seatSide'),0)=slot
      ) ORDER BY slot=? DESC LIMIT 1
    ), json_set(?, '$.seat', NULL, '$.seatSide', NULL))`;
  return db.prepare(`
    UPDATE walkers SET updated=MAX(updated,?), avatar=${applySnapshot(seatSnapshot)},
    view=?
    WHERE room=? AND id=? AND player_key IS ?
      AND json_extract(avatar,'$.feed.claim') IS NOT ? ${picnicGuard} ${bungeoGuard}
  `).bind(now,snapshot,preferred,1-preferred,room,id,active,avatar.seat,Number(Boolean(avatar.coast)),Number(inGyeongjuSpace(avatar)),preferred,snapshot,inheritWish,now-chatLifetime,
    bagClaim??null,acknowledgedFeed,picnicClaim??null,bungeoClaim??null,bikeCutoff,active,JSON.stringify(view),room,id,key,pendingFeed,...picnicArgs,...bungeoArgs);
}

function chatUpdate(db,room,id,key,chat,now,active){
  return db.prepare(`
    UPDATE walkers SET avatar=json_set(avatar,'$.chat',json(?))
    WHERE room=? AND id=? AND player_key=? AND updated>=?
      AND json_extract(avatar,'$.chat.id') IS NOT ?
      AND COALESCE(json_extract(avatar,'$.chat.sentAt'),-1)<?
  `).bind(JSON.stringify({...chat,at:now}),room,id,key,active,chat.id,chat.sentAt);
}

function feedUpdate(db,room,id,key,feed,now){
  const slot=feed.slot??"item",path="$."+slot;
  const accepted=JSON.stringify({id:feed.id,claim:feed.claim,at:now,slot});
  const cutoff=now-FEED_MS;
  return db.prepare(`
    UPDATE walkers SET avatar=json_set(avatar,'$.feed',json(?),
      '${path}.remaining',json_extract(avatar,'${path}.remaining')-1,'${path}.started',?,'$.itemUse',?)
    WHERE room=? AND id=? AND player_key=?
      AND json_extract(avatar,'$.seat') IS NULL
      AND json_extract(avatar,'$.bus') IS NULL AND NOT ${ridingBike()}
      AND COALESCE(json_extract(avatar,'$.running'),0)=0
      AND json_extract(avatar,'${path}.kind')='churu'
      AND json_extract(avatar,'${path}.remaining')>0
      AND json_extract(avatar,'${path}.started')<=?
      AND json_extract(avatar,'$.feed.claim') IS NOT ?
      AND NOT EXISTS (
        SELECT 1 FROM walkers peer
        WHERE peer.room=? AND json_extract(peer.avatar,'$.feed.id')=?
          AND json_extract(peer.avatar,'$.feed.at')>?
      )
  `).bind(accepted,now,slot,room,id,key,cutoff,feed.claim,room,feed.id,cutoff);
}

const nearVehicleAccess=`
  (json_extract(avatar,'$.x')-?) * (json_extract(avatar,'$.x')-?) +
  (json_extract(avatar,'$.y')-?) * (json_extract(avatar,'$.y')-?) <= ?
`;
const accessArguments=(point,reach)=>[point.x,point.x,point.y,point.y,reach**2];
const availableRider=`json_extract(avatar,'$.bus') IS NULL AND NOT ${ridingBike()}
  AND json_extract(avatar,'$.seat') IS NULL AND COALESCE(json_extract(avatar,'$.feed.at'),0)<=?
  AND COALESCE(json_extract(avatar,'$.bikeFallAt'),0)<=?`;

const needsRaftPose=bus=>bus&&(bus.index===RAFT_INDEX||bus.action==="exit"&&bus.index==null);
function busStatements(db,room,id,key,action,now,active,raftRaw=null){
  const raftPose=needsRaftPose(action)?raftPoseAt(currentRaft(raftRaw,now),now):null;
  // Boarding and alighting use the same mooring as the transaction which claims the seat.
  // A neutral helm heartbeat changes the lease but leaves the same berth open.
  const raftGuard=`AND NOT EXISTS (SELECT 1 FROM gyeongju_rafts WHERE room=? AND state IS NOT ?
    AND NOT coalesce(json_extract(state,'$.mode')='manual' AND json_extract(state,'$.stopId')=?
      AND json_extract(state,'$.at')<=? AND json_extract(state,'$.leaseUntil')>?
      AND json_type(state,'$.waypoints') IS NULL,0))`;
  if(action.action==="board"){
    const bus=busAt(action.index,now,undefined,raftPose),stop=busStopById(bus?.stopId);
    if(!stop||bus.traveling)return [];
    const {x,y,heading}=busSeatPose(bus,action.seat);
    return [db.prepare(`
      UPDATE walkers SET avatar=json_set(avatar,'$.bus',json(?),'$.x',?,'$.y',?,'$.heading',?,
        '$.vx',0,'$.vy',0,'$.jump',0,'$.running',json('false'),'$.blocked',json('false'),'$.up',json('false'))
      WHERE room=? AND id=? AND player_key=? AND updated>=?
        AND ${availableRider} AND ${nearVehicleAccess}
        AND NOT EXISTS (
          SELECT 1 FROM walkers peer WHERE peer.room=walkers.room AND peer.id<>walkers.id AND peer.updated>=?
            AND json_extract(peer.avatar,'$.bus.index')=? AND json_extract(peer.avatar,'$.bus.seat')=?
        ) ${action.index===RAFT_INDEX?raftGuard:""}
    `).bind(JSON.stringify({index:action.index,seat:action.seat,resume:stop.exit}),x,y,heading,room,id,key,active,now-FEED_MS,now-BIKE_FALL_DURATION_MS,
      ...accessArguments(stop.board,busBoardReach(action.index)),active,action.index,action.seat,...(action.index===RAFT_INDEX?[room,raftRaw,stop.id,now,now]:[]))];
  }
  const buses=action.index==null?Array.from({length:BUS_COUNT},(_,index)=>index):[action.index];
  return buses.flatMap(index=>{
    const bus=busAt(index,now,undefined,raftPose),stop=busStopById(bus?.stopId);
    if(!stop||bus.traveling)return [];
    const {x,y,heading}=stop.exit;
    return [db.prepare(`
      UPDATE walkers SET avatar=json_remove(json_set(avatar,'$.x',?,'$.y',?,'$.heading',?,
        '$.vx',0,'$.vy',0,'$.jump',0,'$.running',json('false'),'$.blocked',json('false'),'$.up',json('false')), '$.bus')
      WHERE room=? AND id=? AND player_key=? AND updated>=? AND json_extract(avatar,'$.bus.index')=?
        ${index===RAFT_INDEX?raftGuard:""}
    `).bind(x,y,heading,room,id,key,active,index,...(index===RAFT_INDEX?[room,raftRaw,stop.id,now,now]:[]))];
  });
}

function bikeStatement(db,room,id,key,action,now,active){
  if(action.action==="park"||action.action==="fall"){
    const fall=action.action==="fall";
    return db.prepare(`
      UPDATE walkers SET avatar=json_set(avatar,'$.bike.parked',json_object(
        'x',json_extract(avatar,'$.x'),'y',json_extract(avatar,'$.y'),
        'heading',COALESCE(json_extract(avatar,'$.heading'),0),'at',?),
        '$.vx',0,'$.vy',0,'$.running',json('false'),'$.blocked',json('false')
        ${fall?",'$.bikeFallAt',?":""})
      WHERE room=? AND id=? AND player_key=? AND updated>=? AND ${mountedBike()}
        ${fall?"AND json_extract(avatar,'$.blushUntil')>?":""}
    `).bind(now,...(fall?[now]:[]),room,id,key,active,...(fall?[now]:[]));
  }
  if(action.action==="mount")return db.prepare(`
    UPDATE walkers SET avatar=json_remove(json_set(avatar,
      '$.x',json_extract(avatar,'$.bike.parked.x'),'$.y',json_extract(avatar,'$.bike.parked.y'),
      '$.heading',json_extract(avatar,'$.bike.parked.heading'),'$.vx',0,'$.vy',0,
      '$.running',json('false'),'$.blocked',json('false'),'$.up',json('false'),'$.jump',0), '$.bike.parked')
    WHERE room=? AND id=? AND player_key=? AND updated>=? AND ${availableRider}
      AND ${parkedBikeTime}>? AND (
        (json_extract(avatar,'$.x')-json_extract(avatar,'$.bike.parked.x')) *
        (json_extract(avatar,'$.x')-json_extract(avatar,'$.bike.parked.x')) +
        (json_extract(avatar,'$.y')-json_extract(avatar,'$.bike.parked.y')) *
        (json_extract(avatar,'$.y')-json_extract(avatar,'$.bike.parked.y'))
      ) <= ?
  `).bind(room,id,key,active,now-FEED_MS,now-BIKE_FALL_DURATION_MS,now-bikeParkDuration,bikeMountReach**2);
  const dock=docksById.get(action.dock);
  const nearDock=`(${nearVehicleAccess} OR ${nearVehicleAccess})`;
  const position=[...accessArguments(dock.access,bikeDockReach),...accessArguments(dock,bikeDockReach)];
  if(action.action==="take")return db.prepare(`
    UPDATE walkers SET avatar=json_set(avatar,'$.bike',json(?))
    WHERE room=? AND id=? AND player_key=? AND updated>=?
      AND ${availableRider} AND (json_extract(avatar,'$.bike') IS NULL OR ${parkedBikeTime}<=?)
      AND ${nearDock}
  `).bind(JSON.stringify({dock:action.dock}),room,id,key,active,now-FEED_MS,now-BIKE_FALL_DURATION_MS,now-bikeParkDuration,...position);
  return db.prepare(`
    UPDATE walkers SET avatar=json_remove(avatar,'$.bike')
    WHERE room=? AND id=? AND player_key=? AND updated>=?
      AND ${mountedBike()} AND ${nearDock}
  `).bind(room,id,key,active,...position);
}

function releaseTransportHands(db,room,id,key){
  return db.prepare(`
    DELETE FROM handholds WHERE room=? AND (leader=? OR follower=?) AND EXISTS (
      SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=?
        AND (json_extract(avatar,'$.bus') IS NOT NULL OR ${ridingBike()})
    )
  `).bind(room,id,id,room,id,key);
}

function transportAvatar(row,now,yields,raftPose){
  const avatar=JSON.parse(row.avatar);
  if(busIndex(avatar.bus?.index)&&busSeat(avatar.bus.index,avatar.bus.seat)){
    const {index,seat}=avatar.bus;
    avatar.bus={index,seat};
    Object.assign(avatar,busSeatPose(busAt(index,now,yields,raftPose),seat));
  }else{
    if(validPoint(avatar.bus?.resume))Object.assign(avatar,avatar.bus.resume);
    delete avatar.bus;
  }
  const parked=avatar.bike?.parked;
  if(!docksById.has(avatar.bike?.dock)||parked&&parked.at<=now-bikeParkDuration)delete avatar.bike;
  return avatar;
}

function transportResult(bus,bike,avatar,walkers,id,now,bikeOffer,bikeReply,raftPose){
  if(!bus&&!bike)return undefined;
  const result={};
  if(bus?.action==="board"){
    const matches=rider=>rider?.index===bus.index&&rider.seat===bus.seat;
    const stop=busStopById(busAt(bus.index,now,undefined,raftPose)?.stopId);
    const atBerth=stop&&Math.hypot(avatar.x-stop.board.x,avatar.y-stop.board.y)<=busBoardReach(bus.index);
    result.bus=matches(avatar.bus)?"boarded":atBerth&&walkers.some(peer=>peer.id!==id&&matches(peer.avatar.bus))?"occupied":"unavailable";
  }else if(bus)result.bus=avatar.bus?"unavailable":"exited";
  if(bike){
    const rental=avatar.bike,mounted=rental&&!rental.parked;
    if(bike.action==="ride")result.bike="consentRequired";
    else if(bike.action==="requestRide")result.bike=bikeOffer?.id===bike.id?"requested":"unavailable";
    else if(tandemActions.has(bike.action))result.bike=bikeReply?.closed??"unavailable";
    else if(bike.action==="dismount")result.bike=avatar.bikeRide?"unavailable":"dismounted";
    else if(bike.action==="take")result.bike=mounted&&rental.dock===bike.dock?"taken":"unavailable";
    else if(bike.action==="park")result.bike=rental?.parked?"parked":"unavailable";
    else if(bike.action==="fall")result.bike=rental?.parked&&rental.parked.at===avatar.bikeFallAt?"fell":"unavailable";
    else if(bike.action==="mount")result.bike=mounted?"mounted":"unavailable";
    else result.bike=rental?"unavailable":"returned";
  }
  return result;
}

const readyPair=`
  a.player_key IS NOT NULL AND b.player_key IS NOT NULL AND a.updated >= ? AND b.updated >= ?
  AND json_extract(a.avatar,'$.seat') IS NULL AND json_extract(b.avatar,'$.seat') IS NULL
  AND json_extract(a.avatar,'$.bus') IS NULL AND json_extract(b.avatar,'$.bus') IS NULL
  AND NOT ${ridingBike("a.avatar")} AND NOT ${ridingBike("b.avatar")}
  AND (json_extract(a.avatar,'$.x')-json_extract(b.avatar,'$.x')) *
      (json_extract(a.avatar,'$.x')-json_extract(b.avatar,'$.x')) +
      (json_extract(a.avatar,'$.y')-json_extract(b.avatar,'$.y')) *
      (json_extract(a.avatar,'$.y')-json_extract(b.avatar,'$.y')) <= 6.25
`;
function handStatements(db,room,id,key,hand,now,online,wet){
  if(hand.action==="release")return [db.prepare(`
    DELETE FROM handholds WHERE room=? AND id=? AND (leader=? OR follower=?)
    AND EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=?)
  `).bind(room,hand.id,id,id,room,id,key),clearUmbrellaMarkers(db,room)];
  const umbrella=hand.kind==="umbrella";
  if(umbrella&&!wet)return [];
  const eligiblePair=umbrella?`${readyPair} AND ${umbrellaActorsReady}`:readyPair;
  const matchingKind=umbrella?umbrellaPairMarked:`NOT ${umbrellaPairMarked}`;
  if(hand.action==="accept")return [db.prepare(`
    UPDATE handholds SET accepted=?, side=?
    WHERE room=? AND id=? AND follower=? AND accepted IS NULL AND created>=? AND ${matchingKind}
    AND EXISTS (
      SELECT 1 FROM walkers a JOIN walkers b ON b.room=a.room
      WHERE a.room=handholds.room AND a.id=handholds.leader AND b.id=handholds.follower
        AND b.player_key=? AND ${eligiblePair}
    )
  `).bind(now,hand.side,room,hand.id,id,now-15000,key,online,online)];
  return [
    db.prepare(`
      DELETE FROM handholds WHERE room=? AND (
        (accepted IS NULL AND created < ?) OR
        (SELECT COUNT(*) FROM walkers WHERE room=handholds.room AND updated>=?
          AND id IN (handholds.leader,handholds.follower)) < 2
      )
    `).bind(room,now-15000,online),
    db.prepare(`
      INSERT INTO handholds (room,id,leader,follower,side,created)
      SELECT ?, ?, ?, ?, ?, ? FROM walkers a JOIN walkers b ON b.room=a.room
      WHERE a.room=? AND a.id=? AND a.player_key=? AND b.id=? AND a.id<>b.id AND ${eligiblePair}
      AND NOT EXISTS (SELECT 1 FROM handholds h WHERE h.room=a.room
        AND (h.leader IN (a.id,b.id) OR h.follower IN (a.id,b.id)))
      ON CONFLICT(room,id) DO NOTHING
    `).bind(room,hand.id,id,hand.peer,hand.side,now,room,id,key,hand.peer,online,online),
    ...(umbrella?[markUmbrellaPair(db,room,hand.id)]:[])
  ];
}

export async function api(request,env){
  const url=new URL(request.url);
  if(url.pathname!=="/api/room"&&url.pathname!=="/api/rooms")return json({error:"없는 페이지예요."},404);
  if(request.method!=="POST")return json({error:"지원하지 않는 요청이에요."},405);
  const origin=request.headers.get("origin");
  if(origin&&origin!==url.origin&&origin!==GITHUB_PAGES_ORIGIN){
    return json({error:"이 사이트에서 다시 시도해 주세요."},403);
  }
  const raw=await request.text();
  if(raw.length>9800)return json({error:"요청이 너무 길어요."},413);
  let body;
  try{body=JSON.parse(raw);}catch{return json({error:"잘못된 요청이에요."},400);}
  const db=env.DB;
  if(url.pathname==="/api/rooms")return enterRoom(db,body);
  if(!validId(body?.room)||!validId(body.id)||(body.key!==undefined&&!validId(body.key))){
    return json({error:"잘못된 산책방 정보예요."},400);
  }
  const {room,id,key=null,avatar,view,hand,feed,bus,bike,show,clink,leave,raft}=body;
  if(body.coast!==undefined){
    const {coastRequest}=await import("./server/pohang.mjs");
    return coastRequest(db,body,Date.now());
  }
  if(body.paperBoat!==undefined){
    const {paperBoatRequest}=await import("./server/paper-boats.mjs");
    return paperBoatRequest(db,body,Date.now());
  }
  if(body.motion!==undefined){
    const reply=await exchangeMotion(db,body,Date.now());
    return reply?json(reply):json({error:"움직임을 읽을 수 없어요."},400);
  }
  const {minigame,picnic,dining,bungeo,bowling}=body;
  const inventory=body.inventory;
  if(inventory&&(!key||!validInventory(inventory,id)))return json({error:"가방 요청을 확인해 주세요."},400);
  const diningVenue=dining?.venue??body.diningVenue;
  if(body.guestbook!==undefined){
    const now=Date.now();
    return handleGuestbook(db,{room,id,key,guestbook:body.guestbook,now,active:now-walkerLifetime});
  }
  if(leave===true){
    await ensureSocialTables(db);
    await ensureMinigameTables(db);
    await ensureUmbrellaPairs(db);
    await ensureBikeOffers(db);
    await db.batch([
      leaveClinks(db,{room,id,key,now:Date.now()}),
      leaveMinigames(db,{room,id,key,now:Date.now()}),
      db.prepare(`
        DELETE FROM handholds WHERE room=? AND (leader=? OR follower=?)
        AND EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key IS ?)
      `).bind(room,id,id,room,id,key),
      clearUmbrellaMarkers(db,room),
      dropBikePassengers(db,{room,id,key,leaving:true}),
      leaveBikeOffers(db,{room,id,key}),
      dropRaftHelm(db,room,id,key,Date.now()),
      db.prepare("DELETE FROM walkers WHERE room=? AND id=? AND player_key IS ?").bind(room,id,key)
    ]);
    return json({ok:true});
  }
  if(body.lift!=null&&(!key||!validLift(body.lift)))return json({error:"승강기 요청을 확인해 주세요."},400);
  if(hand!=null&&(!key||!validHand(hand)))return json({error:"함께 걷기 요청을 읽을 수 없어요."},400);
  if(feed!=null&&(!key||avatar===undefined||!validFeed(feed)))return json({error:"간식 주기 요청을 읽을 수 없어요."},400);
  if(bus!=null&&(!key||avatar===undefined||!validBus(bus)))return json({error:"버스 요청을 읽을 수 없어요."},400);
  if(raft!=null&&(!key||!validRaftCommand(raft)))return json({error:"뗏목 조종 요청을 확인해 주세요."},400);
  if(bike!=null&&(!key||avatar===undefined||!validBike(bike,id)))return json({error:"자전거 요청을 읽을 수 없어요."},400);
  if(show!=null&&(!key||avatar===undefined||!validShow(show)))return json({error:"분수 공연 요청을 읽을 수 없어요."},400);
  if(clink!=null&&(!key||avatar===undefined||!validClink(clink,id)))return json({error:"건배 요청을 읽을 수 없어요."},400);
  const photo=body.photo;
  if(photo!=null&&(!key||avatar===undefined||!validPhoto(photo)))return json({error:"단체 사진 요청을 읽을 수 없어요."},400);
  if(minigame!=null&&(!key||avatar===undefined||!validMinigame(minigame)))return json({error:"민속놀이 요청을 읽을 수 없어요."},400);
  if(picnic!=null&&(!key||avatar===undefined||!validPicnic(picnic)))return json({error:"피크닉 요청을 읽을 수 없어요."},400);
  if(bungeo!=null&&(!key||avatar===undefined||!validBungeo(bungeo,id)))return json({error:"조리 좌판 요청을 읽을 수 없어요."},400);
  if(bowling!=null&&(!key||avatar===undefined||!validBowling(bowling)))return json({error:"볼링 요청을 읽을 수 없어요."},400);
  if(diningVenue!=null&&(!key||!isDiningVenue(diningVenue))||dining!=null&&(!key||avatar===undefined||!validDiningCommand(dining))){
    return json({error:"식당 요청을 읽을 수 없어요."},400);
  }
  if(avatar!==undefined&&(!validAvatar(avatar)||!validView(view)))return json({error:"산책 위치를 읽을 수 없어요."},400);
  const chat=avatar?.chat==null?null:cleanChat(avatar.chat);
  if(avatar?.chat!=null&&(!key||!chat))return json({error:"말풍선은 1~80자로 입력해 주세요."},400);
  await ensureRoomPhotos(db);
  await ensureSocialTables(db);
  await ensureMinigameTables(db);
  await ensureUmbrellaPairs(db);
  await ensurePicnicTables(db);
  const cookingStall=key&&(cookingStallById(bungeo?.stall??body.bungeoWatch)??(body.bungeoWatch===true?BUNGEO_STALL:null));
  const watchBungeo=Boolean(cookingStall);
  if(watchBungeo)await ensureBungeoTables(db);
  const watchBowling=Boolean(key&&(bowling||body.bowlingWatch===true));
  if(watchBowling)await ensureRoomBowling(db);
  const watchLifts=key&&(body.lift||body.liftWatch===true);
  if(watchLifts)await ensureLiftTables(db);
  const tandem=Boolean(key&&(body.bikeOffers===true||tandemActions.has(bike?.action)));
  if(tandem)await ensureBikeOffers(db);
  if(diningVenue)await ensureDiningService(db);
  const now=Date.now(),active=now-walkerLifetime,online=now-9000,bikeCutoff=now-bikeParkDuration;
  const weather=await getRoomWeather(db,now),wet=umbrellaWeather(weather);
  const currentFeed=feed&&feed.at>=now-FEED_MS&&feed.at<=now+1500;
  const operations=[];
  if(avatar!==undefined){
    if(key)operations.push(dismountBikePassenger(db,room,id,key,{online,expired:true}));
    const pendingPicnic=picnic?.action==="place"||picnic?.action==="take"?picnic.id:undefined;
    const pendingBungeo=["take","gift","putTray","takeTray"].includes(bungeo?.action)?bungeo.id:undefined;
    if(!feed||currentFeed)operations.push(avatarUpdate(db,room,id,key,avatar,view,now,active,feed?.claim,bike?.action,pendingPicnic,pendingBungeo,bus?.action));
    if(key&&avatar.bikeRide?.driver)operations.push(refreshBikePassenger(db,room,id,key,online));
    if(chat)operations.push(chatUpdate(db,room,id,key,chat,now,active));
    if(Math.random()<.004){
      operations.push(db.prepare("DELETE FROM walkers WHERE updated < ?").bind(now-86400000));
      operations.push(db.prepare("DELETE FROM bus_crossing_yields WHERE ends<?").bind(now));
      operations.push(db.prepare("DELETE FROM bag_receipts WHERE at<?").bind(now-86400000));
      operations.push(...cleanupSocial(db,room,now-86400000));
      operations.push(...cleanupMinigames(db,room,now-600000));
      operations.push(...cleanupPicnics(db,room,now));
      if(watchBungeo)operations.push(...cleanupBungeo(db,now));
      if(watchBowling)operations.push(pruneRoomBowling(db,now));
      if(diningVenue)operations.push(pruneDiningService(db,now));
      operations.push(db.prepare(`
        DELETE FROM handholds WHERE created < ? AND
          (SELECT COUNT(*) FROM walkers WHERE room=handholds.room AND updated>=?
            AND id IN (handholds.leader,handholds.follower)) < 2
      `).bind(now-86400000,active));
      operations.push(clearUmbrellaMarkers(db,room));
    }
  }
  if(currentFeed)operations.push(feedUpdate(db,room,id,key,feed,now));
  const bikeContext={room,id,key,bike,now,online,bikeCutoff,feedCutoff:now-FEED_MS,fallCutoff:now-BIKE_FALL_DURATION_MS};
  let bikeReplySelection=-1;
  if(bike?.action==="requestRide")operations.push(...requestBikeRide(db,bikeContext));
  else if(tandemActions.has(bike?.action)){
    if(bike.action==="acceptRide")operations.push(acceptBikeRide(db,bikeContext));
    bikeReplySelection=operations.push(closeBikeOffer(db,bikeContext))-1;
  }else if(bike?.action==="dismount")operations.push(dismountBikePassenger(db,room,id,key));
  else if(bike&&bike.action!=="ride"){
    operations.push(bikeStatement(db,room,id,key,bike,now,active));
    if(bike.action==="park"||bike.action==="return"||bike.action==="fall")
      operations.push(dropBikePassengers(db,{room,id,key,fallAt:bike.action==="fall"?now:undefined}));
  }
  const bikeOfferSelection=tandem?operations.push(selectBikeOffer(db,bikeContext))-1:-1;
  const raftBefore=needsRaftPose(bus)?await readRaft(db,room):null;
  if(bus)operations.push(...busStatements(db,room,id,key,bus,now,active,raftBefore));
  if(needsRaftPose(bus)&&bus.action==="exit")operations.push(dropRaftHelm(db,room,id,key,now,true));
  if(bus||bike)operations.push(releaseTransportHands(db,room,id,key),clearUmbrellaMarkers(db,room));
  if(hand){
    if(hand.action!=="release")operations.push(...purgeUmbrellaPairs(db,{room,now,online,wet}));
    operations.push(...handStatements(db,room,id,key,hand,now,online,wet));
  }
  if(photo)operations.push(writeRoomPhoto(db,{room,id,key,now,online,photo}));
  const liftSelection=watchLifts?operations.push(readLifts(db,room))-1:-1;
  const photoSelection=operations.push(selectRoomPhoto(db,room,now))-1;
  const minigameContext={room,id,key,now,online,minigame};
  if(minigame)operations.push(...minigameStatements(db,minigameContext));
  const minigameSelection=operations.push(selectMinigames(db,minigameContext))-1;
  const picnicContext={room,id,key,now,online,picnic};
  if(picnic)operations.push(...picnicStatements(db,picnicContext));
  const picnicSelection=operations.push(selectPicnics(db,picnicContext))-1;
  const bungeoContext={room,id,key,now,online,bungeo,stall:cookingStall};
  if(bungeo)operations.push(...bungeoStatements(db,bungeoContext));
  const bungeoSelection=watchBungeo?operations.push(selectBungeo(db,bungeoContext))-1:-1;
  const bowlingSelection=watchBowling?operations.push(selectRoomBowling(db,room))-1:-1;
  const diningSelection=diningVenue?operations.push(selectDiningService(db,room,diningVenue))-1:-1;
  const socialContext={room,id,key,now,online,show,clink};
  if(show)operations.push(startFountainShow(db,socialContext));
  if(clink)operations.push(clinkStatement(db,socialContext));
  const yieldsSelection=operations.push(selectYields(db,room,now))-1;
  operations.push(selectSocial(db,socialContext));
  operations.push(db.prepare(`
    SELECT id,updated,avatar,view,player_key,nickname,coat FROM walkers
    WHERE room=? AND (updated>=? OR (updated>=? AND ${parkedBikeTime}>?)) ORDER BY id
  `).bind(room,active,bikeCutoff-walkerLifetime,bikeCutoff));
  operations.push(db.prepare(`
    SELECT h.id,h.leader,h.follower,h.side,h.accepted,u.id IS NOT NULL AS umbrella
    FROM handholds h JOIN walkers a ON a.room=h.room AND a.id=h.leader
    JOIN walkers b ON b.room=h.room AND b.id=h.follower
    ${umbrellaPairJoin}
    WHERE h.room=? AND (h.accepted IS NOT NULL OR h.created>=?)
      AND a.updated>=? AND b.updated>=? AND ${visibleUmbrellaPairs}
  `.trimStart()).bind(room,now-15000,online,online,Number(wet)));
  const results=await db.batch(operations);
  const bikeOffer=results[bikeOfferSelection]?.results[0]??null;
  const rows=results.at(-2).results;
  const ownRow=rows.find(row=>row.id===id&&row.player_key===key&&row.updated>=active);
  if(!ownRow)return json({error:"산책방에 다시 입장해 주세요."},409);
  const bagResult=inventory?await applyInventory(db,{room,id,key,now,cmd:inventory,rows}):undefined;
  const busYields=await roomYields(db,room,now,results[yieldsSelection].results,
    rows.filter(row=>row.updated>=online).map(row=>JSON.parse(row.avatar)));
  const yields=new Map(busYields);
  const rawRaft=results.at(-3).results[0].raftState;
  const raftFeedback=raft?await applyRaftCommand(db,{room,id,key,now,active,cmd:raft,raw:rawRaft,
    seated:JSON.parse(ownRow.avatar).bus?.index===RAFT_INDEX,refresh:avatar===undefined}):null;
  const raftState=raftFeedback?raftFeedback.raft:await settleRaft(db,room,rawRaft,now);
  const raftPose=raftState?raftPoseAt(raftState,now):null;
  const avatars=new Map(rows.map(row=>[row.id,transportAvatar(row,now,yields,raftPose)]));
  const onlineRows=new Set(rows.filter(row=>row.updated>=online).map(row=>row.id));
  for(const [passenger,avatar] of avatars){
    const driverId=avatar.bikeRide?.driver;
    if(!driverId)continue;
    const driver=avatars.get(driverId),pose=driver&&bikePassengerPose(driver);
    if(validPoint(pose))Object.assign(avatar,pose);
    if(onlineRows.has(passenger)&&onlineRows.has(driverId)&&driver.bike&&!driver.bike.parked){
      driver.bike.passenger=passenger;
      avatar.vx=driver.vx??0;avatar.vy=driver.vy??0;
    }else delete avatar.bikeRide;
  }
  const receiver={id,avatar:avatars.get(id)};
  const bungeoState=watchBungeo?bungeoPayload(await advanceBungeoOrder(db,bungeoContext,receiver.avatar,
    results[bungeoSelection].results[0]),bungeoContext):{};
  const bowlingState=watchBowling?await roomBowling(db,{room,id,key,now,avatar:receiver.avatar,command:bowling,
    row:results[bowlingSelection].results[0],rows,avatars}):{};
  const tableService=diningVenue?await diningService(db,{room,id,key,venueId:diningVenue,command:dining,now,active,
    players:new Map(rows.filter(row=>row.updated>=active).map(row=>[row.id,avatars.get(row.id)])),
    state:results[diningSelection].results[0]}):undefined;
  const receiverInterior=interiorAt(receiver.avatar.x,receiver.avatar.y);
  const receiverIndoors=receiverInterior!==null;
  const walkers=[],parkedBikes=[];
  for(const row of rows){
    const avatar=avatars.get(row.id);
    if(row!==ownRow)delete avatar.bag;
    if(avatar.bike?.parked)parkedBikes.push({id:row.id,...avatar.bike.parked});
    if(row.updated<active)continue;
    if(avatar.catFriends&&(row===ownRow||receiverIndoors||
      Math.hypot(avatar.x-receiver.avatar.x,avatar.y-receiver.avatar.y)>62))delete avatar.catFriends;
    if(avatar.arcade!==undefined){
      const activity=arcadeFloorAt(receiver.avatar.x,receiver.avatar.y)&&
        interiorAt(avatar.x,avatar.y)===receiverInterior&&row.player_key&&row.updated>=now-arcadeSnapshotLifetime&&cleanArcadeActivity(avatar);
      if(activity)avatar.arcade=activity;
      else delete avatar.arcade;
    }
    if(row.id===id||now-avatar.wish>=WISH_FLIGHT_MS)delete avatar.wishArt;
    const chat=avatar.chat;
    if(chat?.text&&chat.at>now-chatLifetime)avatar.chat={id:chat.id,text:chat.text,at:chat.at};
    else delete avatar.chat;
    walkers.push({id:row.id,updated:row.updated,avatar,view:JSON.parse(row.view),
      nickname:row.nickname||"동행",coat:row.coat??0x397e70,handholdAvailable:Boolean(row.player_key)});
  }
  const handholds=[],umbrellas=[];
  for(const {id,leader,follower,side,accepted,umbrella} of results.at(-1).results){
    const link={id,leader,follower,side,active:accepted!==null};
    if(umbrella)umbrellas.push({...link,kind:"umbrella"});else handholds.push(link);
  }
  return json({
    serverTime:now,busYields,bagResult,
    raft:body.raftWatch===true||raft||needsRaftPose(bus)?raftState:undefined,raftResult:raftFeedback?.raftResult,
    ...(watchLifts?await roomLifts(db,room,receiver.avatar,body.lift,now,results[liftSelection].results):{}),
    weather,
    ...socialPayload(results.at(-3).results[0],{...socialContext,avatar:receiver.avatar}),
    photoSession:roomPhotoPayload(results[photoSelection],receiver.avatar),
    ...minigamePayload(results[minigameSelection].results[0],minigame),
    ...picnicPayload(results[picnicSelection].results[0],picnic),
    ...bungeoState,
    ...bowlingState,
    dining:tableService,
    handholds,umbrellas,
    bikeOffer:tandem?bikeOffer:undefined,
    transport:transportResult(bus,bike,receiver.avatar,walkers,id,now,bikeOffer,results[bikeReplySelection]?.results[0],raftPose),walkers,parkedBikes
  });
}
