import {bikeMountReach,bikePassengerBoardSpeed,bikePassengerOffset} from "../public/sejong-bike.js";
import {interiorBounds} from "../public/interior-layout.js";

const offerLifetime=15_000;
const readyDatabases=new WeakMap();

export function ensureBikeOffers(db){
  let ready=readyDatabases.get(db);
  if(!ready){
    ready=db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS bike_ride_offers (
        room TEXT NOT NULL, id TEXT NOT NULL, requester TEXT NOT NULL, driver TEXT NOT NULL,
        created INTEGER NOT NULL, closed TEXT, PRIMARY KEY (room,id)
      )`).bind(),
      db.prepare("CREATE INDEX IF NOT EXISTS bike_ride_offers_driver ON bike_ride_offers(room,driver,created)").bind(),
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS bike_ride_offers_pending ON bike_ride_offers(room,requester) WHERE closed IS NULL").bind()
    ]).catch(error=>{readyDatabases.delete(db);throw error;});
    readyDatabases.set(db,ready);
  }
  return ready;
}

const at=(field,key)=>`json_extract(${field},'$.${key}')`;
const square=value=>`(${value}) * (${value})`;
export const mountedBike=(field="avatar")=>`(json_type(${field},'$.bike') IS 'object' AND ${at(field,"bike.parked")} IS NULL)`;
export const bikePassenger=(field="avatar")=>`${at(field,"bikeRide.driver")} IS NOT NULL`;
export const ridingBike=(field="avatar")=>`(${mountedBike(field)} OR ${bikePassenger(field)})`;
const heading=field=>`COALESCE(${at(field,"heading")},0)`;
const outdoors=field=>Object.values(interiorBounds).map(bounds=>`NOT (
  ${at(field,"x")} BETWEEN ${bounds.minX} AND ${bounds.maxX}
  AND ${at(field,"y")} BETWEEN ${bounds.minY} AND ${bounds.maxY})`).join(" AND ");
const rearPose=field=>`'$.x',MAX(0,MIN(2100,${at(field,"x")}-SIN(RADIANS(${heading(field)}))*${bikePassengerOffset})),
  '$.y',MAX(-1900,MIN(1100,${at(field,"y")}+COS(RADIANS(${heading(field)}))*${bikePassengerOffset})),
  '$.heading',${heading(field)},'$.vx',0,'$.vy',0,'$.jump',0,'$.running',json('false'),'$.blocked',json('false'),'$.up',json('false')`;
const driverOf="d.room=walkers.room AND d.id=json_extract(walkers.avatar,'$.bikeRide.driver')";

const freeSeat=`NOT EXISTS(SELECT 1 FROM walkers occupied WHERE occupied.room=d.room
  AND occupied.updated>=? AND ${at("occupied.avatar","bikeRide.driver")}=d.id)`;
function safeBoarding(passenger){
  const distance=`${square(at(passenger,"x")+"-"+at("d.avatar","x"))} +
    ${square(at(passenger,"y")+"-"+at("d.avatar","y"))}`;
  return `
      d.player_key IS NOT NULL AND d.updated>=? AND ${mountedBike("d.avatar")} AND ${outdoors("d.avatar")}
      AND ${square(`COALESCE(${at("d.avatar","vx")},0)`)} + ${square(`COALESCE(${at("d.avatar","vy")},0)`)} <= ?
      AND ${distance} <= ? AND ${freeSeat} AND ${outdoors(passenger)}
      AND NOT ${bikePassenger(passenger)} AND ${at(passenger,"bus")} IS NULL AND ${at(passenger,"seat")} IS NULL
      AND (${at(passenger,"bike")} IS NULL OR ${at(passenger,"bike.parked.at")}<=?)
      AND COALESCE(${at(passenger,"feed.at")},0)<=? AND COALESCE(${at(passenger,"bikeFallAt")},0)<=?`;
}
const boardingArgs=({online,bikeCutoff,feedCutoff,fallCutoff})=>
  [online,bikePassengerBoardSpeed**2,bikeMountReach**2,online,bikeCutoff,feedCutoff,fallCutoff];

export function requestBikeRide(db,context){
  const {room,id,key,bike,now,online}=context;
  return [
    db.prepare("DELETE FROM bike_ride_offers WHERE room=? AND created<?").bind(room,now-offerLifetime),
    db.prepare(`
      INSERT INTO bike_ride_offers (room,id,requester,driver,created)
      SELECT p.room,?,p.id,d.id,? FROM walkers p JOIN walkers d ON d.room=p.room AND d.id=?
      WHERE p.room=? AND p.id=? AND p.player_key=? AND p.updated>=? AND ${safeBoarding("p.avatar")}
      ON CONFLICT DO NOTHING
    `).bind(bike.id,now,bike.driver,room,id,key,online,...boardingArgs(context))
  ];
}

export function acceptBikeRide(db,context){
  const {room,id,key,bike,now,online}=context;
  return db.prepare(`
    UPDATE walkers SET avatar=json_set(walkers.avatar,'$.bikeRide',json_object('driver',d.id),
      '$.seat',NULL,'$.seatSide',NULL,${rearPose("d.avatar")})
    FROM bike_ride_offers o JOIN walkers d ON d.room=o.room AND d.id=o.driver
    WHERE walkers.room=o.room AND walkers.id=o.requester AND walkers.player_key IS NOT NULL AND walkers.updated>=?
      AND o.room=? AND o.id=? AND o.driver=? AND o.created>=? AND o.closed IS NULL AND d.player_key=?
      AND ${safeBoarding("walkers.avatar")}
      AND NOT EXISTS (SELECT 1 FROM handholds h WHERE h.room=walkers.room AND h.accepted IS NOT NULL
        AND (h.leader=walkers.id OR h.follower=walkers.id))
  `).bind(online,room,bike.id,id,now-offerLifetime,key,...boardingArgs(context));
}

export function closeBikeOffer(db,{room,id,key,bike,online}){
  const requester=bike.action==="cancelRide";
  const accepting=bike.action==="acceptRide";
  // Capture the passenger update immediately preceding an acceptance in the same batch.
  const result=accepting?"CASE WHEN changes()=1 THEN 'accepted' ELSE 'unavailable' END":
    requester?"'cancelled'":"'declined'";
  return db.prepare(`
    UPDATE bike_ride_offers SET closed=COALESCE(closed,${result})
    WHERE room=? AND ${requester?"requester":"driver"}=? AND id=?
      AND EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=? AND updated>=?)
    RETURNING closed
  `).bind(room,id,bike.id,room,id,key,online);
}

export function selectBikeOffer(db,{room,id,key,now,online}){
  return db.prepare(`
    SELECT o.id,o.requester,o.driver
    FROM bike_ride_offers o JOIN walkers p ON p.room=o.room AND p.id=o.requester
    JOIN walkers d ON d.room=o.room AND d.id=o.driver
    WHERE o.room=? AND o.created>=? AND o.closed IS NULL AND (
      (o.requester=? AND p.player_key=?) OR (o.driver=? AND d.player_key=?))
      AND p.updated>=? AND d.updated>=? AND ${mountedBike("d.avatar")} AND ${freeSeat}
    ORDER BY o.created,o.id LIMIT 1
  `).bind(room,now-offerLifetime,id,key,id,key,online,online,online);
}

export function leaveBikeOffers(db,{room,id,key}){
  return db.prepare(`
    DELETE FROM bike_ride_offers WHERE room=? AND (requester=? OR driver=?)
    AND EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=?)
  `).bind(room,id,id,room,id,key);
}

function dismountPose({fall=false}={}){
  const fallField=fall?`, '$.bikeFallAt', ${at("d.avatar","bikeFallAt")}`:"";
  return `json_remove(COALESCE((SELECT json_set(walkers.avatar,${rearPose("d.avatar")}${fallField})
    FROM walkers d WHERE ${driverOf}),walkers.avatar),'$.bikeRide')`;
}

export function dismountBikePassenger(db,room,id,key,{online,expired=false}={}){
  return db.prepare(`
    UPDATE walkers SET avatar=${dismountPose()}
    WHERE room=? AND id=? AND player_key=? AND ${bikePassenger()}
    ${expired?`AND (updated<? OR NOT EXISTS(SELECT 1 FROM walkers d WHERE ${driverOf}
      AND d.updated>=? AND ${mountedBike("d.avatar")}))`:""}
  `).bind(room,id,key,...(expired?[online,online]:[]));
}

export function refreshBikePassenger(db,room,id,key,online){
  return db.prepare(`
    UPDATE walkers SET avatar=(SELECT json_set(walkers.avatar,${rearPose("d.avatar")})
      FROM walkers d WHERE ${driverOf})
    WHERE room=? AND id=? AND player_key=? AND ${bikePassenger()}
      AND EXISTS(SELECT 1 FROM walkers d WHERE ${driverOf} AND d.updated>=? AND ${mountedBike("d.avatar")})
  `).bind(room,id,key,online);
}

export function dropBikePassengers(db,{room,id,key,leaving=false,fallAt}){
  const driverCheck=leaving?"":`AND NOT ${mountedBike("d.avatar")}`;
  const fallCheck=fallAt===undefined?"":`AND ${at("d.avatar","bikeFallAt")}=?`;
  return db.prepare(`
    UPDATE walkers SET avatar=${dismountPose({fall:fallAt!==undefined})}
    WHERE room=? AND ${at("avatar","bikeRide.driver")}=?
      AND EXISTS(SELECT 1 FROM walkers d WHERE ${driverOf} AND d.player_key IS ? ${driverCheck} ${fallCheck})
  `).bind(room,id,key,...(fallAt===undefined?[]:[fallAt]));
}
