import {validWishArt, WISH_FLIGHT_MS} from "./public/wish-art.js";
import {FEED_MS, ITEMS} from "./public/activities.js";
import {validItemSlot} from "./public/held-items.js";
import {BIKE_FALL_DURATION_MS,GESTURE_DURATIONS,MAX_ALCOHOL_DRINKS,MAX_ALCOHOL_LEVEL} from "./public/avatar-gestures.js";
import {isInsideMuseum} from "./public/visit-layout.js";
import {BUS_COUNT,BUS_SEATS,BUS_BOARD_REACH,busAt,busStopById,busSeatPose} from "./public/sejong-bus.js";
import {bikeDockReach,bikeDocks,bikeMountReach,bikeParkDuration,bikePassengerPose} from "./public/sejong-bike.js";
import {bikePassenger,boardBikePassenger,dismountBikePassenger,dropBikePassengers,mountedBike,refreshBikePassenger,ridingBike} from "./server/bike-passengers.mjs";
import {HEADWEAR,KEEPSAKES} from "./public/wearable-options.js";
import {GITHUB_PAGES_ORIGIN} from "./public/hosting.js";
import {ensureSocialTables} from "./database/social-schema.mjs";
import {ensureRoomPhotos,roomPhotoPayload,selectRoomPhoto,validPhoto,writeRoomPhoto} from "./server/room-photo.mjs";
import {getRoomWeather} from "./server/room-weather.mjs";
import {cleanupSocial,clinkStatement,leaveClinks,selectSocial,socialPayload,startFountainShow} from "./server/social.mjs";
import {ensureMinigameTables} from "./database/minigame-schema.mjs";
import {cleanupMinigames,leaveMinigames,minigamePayload,minigameStatements,selectMinigames,validMinigame} from "./server/minigames.mjs";
import {ensureUmbrellaPairs,umbrellaWeather,umbrellaActorsReady,umbrellaPairMarked,umbrellaPairJoin,
  visibleUmbrellaPairs,markUmbrellaPair,purgeUmbrellaPairs,clearUmbrellaMarkers} from "./server/umbrella-pairs.mjs";
import {ensurePicnicTables,validPicnic,picnicStatements,selectPicnics,picnicPayload,cleanupPicnics} from "./server/picnic.mjs";

const json = (data, status = 200) => Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const validId = (value) => typeof value==="string" && /^[a-f0-9]{32}$/.test(value);
const finite = (value,min,max) => typeof value==="number" && value>=min && value<=max;
// The shared map keeps Deoksugung's original origin. The route and palace extend north of it.
const validPoint = (point) => point && finite(point.x,0,2100) && finite(point.y,-1900,1100);
const validTime = (value) => finite(value,0,9999999999999);
const reactions = new Set(["😊","😂","❤️","👍","😮","😢","😠","✨"]);
const hairStyles = new Set(["short","bob","long","bun"]);
const eyeStyles = new Set(["round","soft","bright"]);
const outfitStyles = new Set(["coat","hoodie","puffer","tee","hanbok"]);
const validLook = (look) => look==null ||
  hairStyles.has(look.hair) && eyeStyles.has(look.eyes) && outfitStyles.has(look.outfit) &&
  (look.headwear===undefined||HEADWEAR.includes(look.headwear)) &&
  (look.keepsake===undefined||KEEPSAKES.includes(look.keepsake));
const validItem=item=>item==null||typeof item.kind==="string"&&Object.hasOwn(ITEMS,item.kind)&&
  Number.isInteger(item.remaining)&&finite(item.remaining,0,ITEMS[item.kind].uses)&&validTime(item.started);
const validAvatar = (a) => validPoint(a) &&
  (a.character===undefined || a.character==="man" || a.character==="woman") &&
  validLook(a.look) &&
  (a.wave===undefined || finite(a.wave,0,9999999999999)) &&
  (a.gesture==null || Object.hasOwn(GESTURE_DURATIONS,a.gesture.kind)&&validTime(a.gesture.at)) &&
  (a.jump===undefined || validTime(a.jump)) &&
  (a.vaultBase==null || a.jump>0 && finite(a.vaultBase,0,.65)) &&
  (a.emote==null || reactions.has(a.emote.emoji) && finite(a.emote.at,0,9999999999999)) &&
  (a.vx===undefined || finite(a.vx,-12,12)) && (a.vy===undefined || finite(a.vy,-12,12)) &&
  (a.blocked===undefined || typeof a.blocked==="boolean") &&
  (a.up===undefined || typeof a.up==="boolean") &&
  (a.heading===undefined || finite(a.heading,0,360)) &&
  (a.seat==null || Number.isInteger(a.seat) && finite(a.seat,0,80)) &&
  (a.seatSide==null || (a.seatSide===0 || a.seatSide===1) && a.seat!=null) &&
  (a.running===undefined || typeof a.running==="boolean") &&
  (a.umbrella===undefined || typeof a.umbrella==="boolean") &&
  (a.umbrellaReady===undefined || typeof a.umbrellaReady==="boolean") &&
  (a.picnicClaim==null || validId(a.picnicClaim)) &&
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
const validSignal = (signal,self) => validId(signal?.id) && (signal.audience===undefined?
  validView(signal.view)&&(signal.point===undefined||validPoint(signal.point)):
  validPoint(signal.point)&&(signal.audience==="nearby"||signal.audience==="room"||
    signal.audience==="person"&&validId(signal.target)&&signal.target!==self));
const validHand = (h) => h && validId(h.id) && (h.kind===undefined||h.kind==="umbrella") && (h.action==="release" ||
  (h.side===-1 || h.side===1) && (h.action==="accept" || h.action==="offer" && validId(h.peer)));
const validShow=show=>validId(show?.id)&&show.fountain==="myeongnyang";
const validClink=(clink,id)=>validId(clink?.id)&&(clink.action==="invite"?
  validId(clink.target)&&clink.target!==id:clink.action==="accept"||clink.action==="decline"||clink.action==="cancel");
const validFeed = (feed) => feed && validId(feed.claim) && validTime(feed.at) &&
  (feed.slot===undefined||validItemSlot(feed.slot)) &&
  typeof feed.id==="string" && /^[a-z0-9-]{1,32}$/.test(feed.id);
const busIndex = index => Number.isInteger(index)&&index>=0&&index<BUS_COUNT;
const busSeat = seat => Number.isInteger(seat)&&seat>=0&&seat<BUS_SEATS;
const validBus = bus => bus?.action==="board"?busIndex(bus.index)&&busSeat(bus.seat):
  bus?.action==="exit"&&(bus.index==null||busIndex(bus.index));
const docksById=new Map(bikeDocks.map(dock=>[dock.id,dock]));
const validBike = (bike,id) => bike?.action==="ride"?validId(bike.driver)&&bike.driver!==id:
  bike?.action==="park"||bike?.action==="mount"||bike?.action==="fall"||bike?.action==="dismount"||
  (bike?.action==="take"||bike?.action==="return")&&docksById.has(bike.dock);
const parkedBikeTime="json_extract(avatar,'$.bike.parked.at')";
const parkedBikePatch=`CASE WHEN ${parkedBikeTime}>?
  THEN json_object('bike',json_extract(avatar,'$.bike')) ELSE '{}' END`;

const codeAlphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const openRoomId="00000000000000000000000000000001";
const lookPingLifetime=5000,lookPingDistance=40;
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
  const initialAvatar={...avatar,seat:null,seatSide:null,feed:null};
  delete initialAvatar.chat;
  delete initialAvatar.bus;
  delete initialAvatar.bike;
  delete initialAvatar.bikeRide;
  delete initialAvatar.bikeFallAt;
  delete initialAvatar.picnicClaim;
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
      avatar=CASE WHEN walkers.updated<? THEN json_patch(
        json_patch(json_remove(walkers.avatar,'$.bus','$.bike','$.bikeRide'), ${expiredRidePatch}), ${parkedBikePatch})
        ELSE walkers.avatar END
      WHERE walkers.player_key IS excluded.player_key
    RETURNING nickname,coat
  `).bind(target.id,id,now,JSON.stringify(initialAvatar),JSON.stringify(view),key,nickname,
    JSON.stringify(clothes),target.id,active,target.id,active,fallback,active,now-bikeParkDuration).all();
  if(!results[0])return json({error:"산책방에 다시 입장해 주세요."},409);
  return json({room:target.id,code:target.code,mode:action==="open"?"open":"private",profile:results[0],
    serverTime:now,weather:await getRoomWeather(db,now)});
}

function avatarUpdate(db,room,id,key,avatar,view,now,active,pendingFeed="",bikeAction,pendingPicnic){
  const {feed,chat,bus,bike,bikeRide,bikeFallAt,picnicClaim,...snapshotData}=avatar;
  const snapshot=JSON.stringify(snapshotData);
  const inheritWish=avatar.wishArt===undefined&&avatar.wish>now-WISH_FLIGHT_MS?avatar.wish:null;
  const acknowledgedFeed=validId(feed?.claim)?feed.claim:null;
  const snapshotPatch=`json_patch(json_patch(
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
      ELSE '{}' END)`;
  const inventoryPatch=`CASE WHEN
      (json_type(avatar,'$.feed')='object' AND json_extract(avatar,'$.feed.claim') IS NOT ?)
      OR (json_type(avatar,'$.picnicClaim')='text' AND json_extract(avatar,'$.picnicClaim') IS NOT ?)
    THEN json_object('item',json_extract(avatar,'$.item'),'secondItem',json_extract(avatar,'$.secondItem'))
    ELSE '{}' END`;
  const applySnapshot=base=>`json_patch(json_patch(json_patch(${base},${snapshotPatch}),${inventoryPatch}),${transportPatch})`;
  // A regular avatar packet cannot reserve or release a vehicle. A lease that
  // expired while the player was disconnected must not reclaim its old seat.
  const vehiclePose=`'x',json_extract(avatar,'$.x'),'y',json_extract(avatar,'$.y'),
    'heading',json_extract(avatar,'$.heading'),'vx',0,'vy',0,'running',json('false'),
    'blocked',json('false'),'up',json('false'),'jump',0`;
  // The first mount changes the canonical pose. A retry still posts the old approach pose.
  const mountedPose=bikeAction==="mount"?`,${vehiclePose}`:"";
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
    ELSE ${bikeRide?.driver?`json_object('seat',NULL,'seatSide',NULL,${vehiclePose})`:"'{}'"} END)`;
  const bikeCutoff=now-bikeParkDuration;
  const picnicGuard=pendingPicnic?`AND NOT EXISTS (SELECT 1 FROM picnic_requests p
    WHERE p.room=walkers.room AND p.player=walkers.id AND p.request=?)`:"";
  const picnicArgs=pendingPicnic?[pendingPicnic]:[];
  if(avatar.seat==null){
    return db.prepare(`
      UPDATE walkers SET updated=MAX(updated,?), avatar=${applySnapshot("?")}, view=?
      WHERE room=? AND id=? AND player_key IS ?
        AND json_extract(avatar,'$.feed.claim') IS NOT ? ${picnicGuard}
    `).bind(now,snapshot,inheritWish,now-chatLifetime,acknowledgedFeed,picnicClaim??null,
      bikeCutoff,active,JSON.stringify(view),room,id,key,pendingFeed,...picnicArgs);
  }
  const preferred=avatar.seatSide??0;
  const seatSnapshot=`COALESCE((
      SELECT json_set(?, '$.seatSide', slot) FROM (SELECT ? AS slot UNION ALL SELECT ?)
      WHERE NOT EXISTS (
        SELECT 1 FROM walkers peer
        WHERE peer.room=? AND peer.id<>? AND peer.updated>=?
        AND json_extract(peer.avatar,'$.seat')=?
        AND COALESCE(json_extract(peer.avatar,'$.seatSide'),0)=slot
      ) ORDER BY slot=? DESC LIMIT 1
    ), json_set(?, '$.seat', NULL, '$.seatSide', NULL))`;
  return db.prepare(`
    UPDATE walkers SET updated=MAX(updated,?), avatar=${applySnapshot(seatSnapshot)},
    view=?
    WHERE room=? AND id=? AND player_key IS ?
      AND json_extract(avatar,'$.feed.claim') IS NOT ? ${picnicGuard}
  `).bind(now,snapshot,preferred,1-preferred,room,id,active,avatar.seat,preferred,snapshot,inheritWish,now-chatLifetime,
    acknowledgedFeed,picnicClaim??null,bikeCutoff,active,JSON.stringify(view),room,id,key,pendingFeed,...picnicArgs);
}

function chatUpdate(db,room,id,key,chat,now,active){
  return db.prepare(`
    UPDATE walkers SET avatar=json_set(avatar,'$.chat',json(?))
    WHERE room=? AND id=? AND player_key=? AND updated>=?
      AND json_extract(avatar,'$.chat.id') IS NOT ?
      AND COALESCE(json_extract(avatar,'$.chat.sentAt'),-1)<?
  `).bind(JSON.stringify({...chat,at:now}),room,id,key,active,chat.id,chat.sentAt);
}

function signalUpdate(db,room,id,key,signal,avatar,now,active){
  const location={x:avatar.x,y:avatar.y};
  const point=signal.point?{x:signal.point.x,y:signal.point.y}:location;
  const sameArea=isInsideMuseum(point.x,point.y)===isInsideMuseum(location.x,location.y);
  const payload={id:signal.id,point:sameArea&&Math.hypot(point.x-location.x,point.y-location.y)<=5?point:location,
    receivedAt:now};
  if(signal.audience===undefined)payload.view=signal.view;
  else{
    payload.audience=signal.audience;
    if(signal.audience==="person")payload.target=signal.target;
  }
  return db.prepare(`
    UPDATE walkers SET signal=? WHERE room=? AND id=? AND player_key IS ? AND updated>=?
      AND json_extract(signal,'$.id') IS NOT ?
  `).bind(JSON.stringify(payload),room,id,key,active,signal.id);
}

function visibleSignal(row,avatar,receiver,lookPings,room,now){
  if(!row.signal||row.id===receiver.id)return null;
  const signal=JSON.parse(row.signal);
  if(!signal?.receivedAt||now-signal.receivedAt>=lookPingLifetime)return null;
  // A cached client still changes camera for old broadcasts. Map pings are opt-in.
  if(!lookPings)return signal.audience===undefined?signal:null;
  const point=signal.point??{x:avatar.x,y:avatar.y};
  const audience=signal.audience??(room===openRoomId?"nearby":"room");
  if(audience==="person"&&signal.target!==receiver.id)return null;
  if(audience==="nearby"&&(
    isInsideMuseum(point.x,point.y)!==isInsideMuseum(receiver.avatar.x,receiver.avatar.y)||
    Math.hypot(point.x-receiver.avatar.x,point.y-receiver.avatar.y)>lookPingDistance))return null;
  return {id:signal.id,point,receivedAt:signal.receivedAt};
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

function busStatements(db,room,id,key,action,now,active){
  if(action.action==="board"){
    const bus=busAt(action.index,now),stop=busStopById(bus?.stopId);
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
        )
    `).bind(JSON.stringify({index:action.index,seat:action.seat,resume:stop.exit}),x,y,heading,room,id,key,active,now-FEED_MS,now-BIKE_FALL_DURATION_MS,
      ...accessArguments(stop.board,BUS_BOARD_REACH),active,action.index,action.seat)];
  }
  const buses=action.index==null?Array.from({length:BUS_COUNT},(_,index)=>index):[action.index];
  return buses.flatMap(index=>{
    const bus=busAt(index,now),stop=busStopById(bus?.stopId);
    if(!stop||bus.traveling)return [];
    const {x,y,heading}=stop.exit;
    return [db.prepare(`
      UPDATE walkers SET avatar=json_remove(json_set(avatar,'$.x',?,'$.y',?,'$.heading',?,
        '$.vx',0,'$.vy',0,'$.jump',0,'$.running',json('false'),'$.blocked',json('false'),'$.up',json('false')), '$.bus')
      WHERE room=? AND id=? AND player_key=? AND updated>=? AND json_extract(avatar,'$.bus.index')=?
    `).bind(x,y,heading,room,id,key,active,index)];
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

function transportAvatar(row,now){
  const avatar=JSON.parse(row.avatar);
  if(busIndex(avatar.bus?.index)&&busSeat(avatar.bus.seat)){
    const {index,seat}=avatar.bus;
    avatar.bus={index,seat};
    Object.assign(avatar,busSeatPose(busAt(index,now),seat));
  }else{
    if(validPoint(avatar.bus?.resume))Object.assign(avatar,avatar.bus.resume);
    delete avatar.bus;
  }
  const parked=avatar.bike?.parked;
  if(!docksById.has(avatar.bike?.dock)||parked&&parked.at<=now-bikeParkDuration)delete avatar.bike;
  return avatar;
}

function transportResult(bus,bike,avatar,walkers,id,now){
  if(!bus&&!bike)return undefined;
  const result={};
  if(bus?.action==="board"){
    const matches=rider=>rider?.index===bus.index&&rider.seat===bus.seat;
    const stop=busStopById(busAt(bus.index,now)?.stopId);
    const atBerth=stop&&Math.hypot(avatar.x-stop.board.x,avatar.y-stop.board.y)<=BUS_BOARD_REACH;
    result.bus=matches(avatar.bus)?"boarded":atBerth&&walkers.some(peer=>peer.id!==id&&matches(peer.avatar.bus))?"occupied":"unavailable";
  }else if(bus)result.bus=avatar.bus?"unavailable":"exited";
  if(bike){
    const rental=avatar.bike,mounted=rental&&!rental.parked;
    if(bike.action==="ride")result.bike=avatar.bikeRide?.driver===bike.driver?"riding":"unavailable";
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
  const {room,id,key=null,avatar,view,signal,hand,feed,bus,bike,show,clink,leave,lookPings}=body;
  const {minigame,picnic}=body;
  if(leave===true){
    await ensureSocialTables(db);
    await ensureMinigameTables(db);
    await ensureUmbrellaPairs(db);
    await db.batch([
      leaveClinks(db,{room,id,key,now:Date.now()}),
      leaveMinigames(db,{room,id,key,now:Date.now()}),
      db.prepare(`
        DELETE FROM handholds WHERE room=? AND (leader=? OR follower=?)
        AND EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key IS ?)
      `).bind(room,id,id,room,id,key),
      clearUmbrellaMarkers(db,room),
      dropBikePassengers(db,{room,id,key,leaving:true}),
      db.prepare("DELETE FROM walkers WHERE room=? AND id=? AND player_key IS ?").bind(room,id,key)
    ]);
    return json({ok:true});
  }
  if(hand!=null&&(!key||!validHand(hand)))return json({error:"함께 걷기 요청을 읽을 수 없어요."},400);
  if(feed!=null&&(!key||avatar===undefined||!validFeed(feed)))return json({error:"간식 주기 요청을 읽을 수 없어요."},400);
  if(bus!=null&&(!key||avatar===undefined||!validBus(bus)))return json({error:"버스 요청을 읽을 수 없어요."},400);
  if(bike!=null&&(!key||avatar===undefined||!validBike(bike,id)))return json({error:"자전거 요청을 읽을 수 없어요."},400);
  if(show!=null&&(!key||avatar===undefined||!validShow(show)))return json({error:"분수 공연 요청을 읽을 수 없어요."},400);
  if(clink!=null&&(!key||avatar===undefined||!validClink(clink,id)))return json({error:"건배 요청을 읽을 수 없어요."},400);
  const photo=body.photo;
  if(photo!=null&&(!key||avatar===undefined||!validPhoto(photo)))return json({error:"단체 사진 요청을 읽을 수 없어요."},400);
  if(minigame!=null&&(!key||avatar===undefined||!validMinigame(minigame)))return json({error:"민속놀이 요청을 읽을 수 없어요."},400);
  if(picnic!=null&&(!key||avatar===undefined||!validPicnic(picnic)))return json({error:"피크닉 요청을 읽을 수 없어요."},400);
  if(signal!=null&&(avatar===undefined||!validSignal(signal,id)))return json({error:"‘여기 봐’ 위치를 읽을 수 없어요."},400);
  if(avatar!==undefined&&(!validAvatar(avatar)||!validView(view)))return json({error:"산책 위치를 읽을 수 없어요."},400);
  const chat=avatar?.chat==null?null:cleanChat(avatar.chat);
  if(avatar?.chat!=null&&(!key||!chat))return json({error:"말풍선은 1~80자로 입력해 주세요."},400);
  await ensureRoomPhotos(db);
  await ensureSocialTables(db);
  await ensureMinigameTables(db);
  await ensureUmbrellaPairs(db);
  await ensurePicnicTables(db);
  const now=Date.now(),active=now-walkerLifetime,online=now-9000,bikeCutoff=now-bikeParkDuration;
  const weather=await getRoomWeather(db,now),wet=umbrellaWeather(weather);
  const currentFeed=feed&&feed.at>=now-FEED_MS&&feed.at<=now+1500;
  const operations=[];
  if(avatar!==undefined){
    if(key)operations.push(dismountBikePassenger(db,room,id,key,{online,expired:true}));
    const pendingPicnic=picnic?.action==="place"||picnic?.action==="take"?picnic.id:undefined;
    if(!feed||currentFeed)operations.push(avatarUpdate(db,room,id,key,avatar,view,now,active,feed?.claim,bike?.action,pendingPicnic));
    if(key&&avatar.bikeRide?.driver)operations.push(refreshBikePassenger(db,room,id,key,online));
    if(chat)operations.push(chatUpdate(db,room,id,key,chat,now,active));
    if(signal)operations.push(signalUpdate(db,room,id,key,signal,avatar,now,active));
    if(Math.random()<.004){
      operations.push(db.prepare("DELETE FROM walkers WHERE updated < ?").bind(now-86400000));
      operations.push(...cleanupSocial(db,room,now-86400000));
      operations.push(...cleanupMinigames(db,room,now-600000));
      operations.push(...cleanupPicnics(db,room,now));
      operations.push(db.prepare(`
        DELETE FROM handholds WHERE created < ? AND
          (SELECT COUNT(*) FROM walkers WHERE room=handholds.room AND updated>=?
            AND id IN (handholds.leader,handholds.follower)) < 2
      `).bind(now-86400000,active));
      operations.push(clearUmbrellaMarkers(db,room));
    }
  }
  if(currentFeed)operations.push(feedUpdate(db,room,id,key,feed,now));
  if(bike?.action==="ride")operations.push(boardBikePassenger(db,{room,id,key,driver:bike.driver,online,bikeCutoff,
    feedCutoff:now-FEED_MS,fallCutoff:now-BIKE_FALL_DURATION_MS}));
  else if(bike?.action==="dismount")operations.push(dismountBikePassenger(db,room,id,key));
  else if(bike){
    operations.push(bikeStatement(db,room,id,key,bike,now,active));
    if(bike.action==="park"||bike.action==="return"||bike.action==="fall")
      operations.push(dropBikePassengers(db,{room,id,key,fallAt:bike.action==="fall"?now:undefined}));
  }
  if(bus)operations.push(...busStatements(db,room,id,key,bus,now,active));
  if(bus||bike)operations.push(releaseTransportHands(db,room,id,key),clearUmbrellaMarkers(db,room));
  if(hand){
    if(hand.action!=="release")operations.push(...purgeUmbrellaPairs(db,{room,now,online,wet}));
    operations.push(...handStatements(db,room,id,key,hand,now,online,wet));
  }
  if(photo)operations.push(writeRoomPhoto(db,{room,id,key,now,online,photo}));
  const photoSelection=operations.push(selectRoomPhoto(db,room,now))-1;
  const minigameContext={room,id,key,now,online,minigame};
  if(minigame)operations.push(...minigameStatements(db,minigameContext));
  const minigameSelection=operations.push(selectMinigames(db,minigameContext))-1;
  const picnicContext={room,id,key,now,online,picnic};
  if(picnic)operations.push(...picnicStatements(db,picnicContext));
  const picnicSelection=operations.push(selectPicnics(db,picnicContext))-1;
  const socialContext={room,id,key,now,online,show,clink};
  if(show)operations.push(startFountainShow(db,socialContext));
  if(clink)operations.push(clinkStatement(db,socialContext));
  operations.push(selectSocial(db,socialContext));
  operations.push(db.prepare(`
    SELECT id,updated,avatar,view,signal,player_key,nickname,coat FROM walkers
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
  const rows=results.at(-2).results;
  const ownRow=rows.find(row=>row.id===id&&row.player_key===key&&row.updated>=active);
  if(!ownRow)return json({error:"산책방에 다시 입장해 주세요."},409);
  const avatars=new Map(rows.map(row=>[row.id,transportAvatar(row,now)]));
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
  const receiverIndoors=isInsideMuseum(receiver.avatar.x,receiver.avatar.y);
  const walkers=[],parkedBikes=[];
  for(const row of rows){
    const avatar=avatars.get(row.id);
    if(avatar.bike?.parked)parkedBikes.push({id:row.id,...avatar.bike.parked});
    if(row.updated<active)continue;
    if(avatar.catFriends&&(row===ownRow||receiverIndoors||
      Math.hypot(avatar.x-receiver.avatar.x,avatar.y-receiver.avatar.y)>62))delete avatar.catFriends;
    if(row.id===id||now-avatar.wish>=WISH_FLIGHT_MS)delete avatar.wishArt;
    const chat=avatar.chat;
    if(chat?.text&&chat.at>now-chatLifetime)avatar.chat={id:chat.id,text:chat.text,at:chat.at};
    else delete avatar.chat;
    walkers.push({id:row.id,updated:row.updated,avatar,view:JSON.parse(row.view),
      signal:visibleSignal(row,avatar,receiver,lookPings===true,room,now),
      nickname:row.nickname||"동행",coat:row.coat??0x397e70,handholdAvailable:Boolean(row.player_key)});
  }
  const handholds=[],umbrellas=[];
  for(const {id,leader,follower,side,accepted,umbrella} of results.at(-1).results){
    const link={id,leader,follower,side,active:accepted!==null};
    if(umbrella)umbrellas.push({...link,kind:"umbrella"});else handholds.push(link);
  }
  return json({
    serverTime:now,
    weather,
    ...socialPayload(results.at(-3).results[0],{...socialContext,avatar:receiver.avatar}),
    photoSession:roomPhotoPayload(results[photoSelection],receiver.avatar),
    ...minigamePayload(results[minigameSelection].results[0],minigame),
    ...picnicPayload(results[picnicSelection].results[0],picnic),
    handholds,umbrellas,
    transport:transportResult(bus,bike,receiver.avatar,walkers,id,now),walkers,parkedBikes
  });
}
