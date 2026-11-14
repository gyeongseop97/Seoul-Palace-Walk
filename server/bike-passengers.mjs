import {bikeMountReach,bikePassengerBoardSpeed,bikePassengerOffset} from "../public/sejong-bike.js";
import {museumBounds} from "../public/visit-layout.js";

const at=(field,key)=>`json_extract(${field},'$.${key}')`;
const square=value=>`(${value}) * (${value})`;
export const mountedBike=(field="avatar")=>`(json_type(${field},'$.bike') IS 'object' AND ${at(field,"bike.parked")} IS NULL)`;
export const bikePassenger=(field="avatar")=>`${at(field,"bikeRide.driver")} IS NOT NULL`;
export const ridingBike=(field="avatar")=>`(${mountedBike(field)} OR ${bikePassenger(field)})`;
const heading=field=>`COALESCE(${at(field,"heading")},0)`;
const outdoors=field=>`NOT (${at(field,"x")} BETWEEN ${museumBounds.minX} AND ${museumBounds.maxX}
  AND ${at(field,"y")} BETWEEN ${museumBounds.minY} AND ${museumBounds.maxY})`;
const rearPose=field=>`'$.x',MAX(0,MIN(2100,${at(field,"x")}-SIN(RADIANS(${heading(field)}))*${bikePassengerOffset})),
  '$.y',MAX(-1900,MIN(1100,${at(field,"y")}+COS(RADIANS(${heading(field)}))*${bikePassengerOffset})),
  '$.heading',${heading(field)},'$.vx',0,'$.vy',0,'$.jump',0,'$.running',json('false'),'$.blocked',json('false'),'$.up',json('false')`;
const driverOf="d.room=walkers.room AND d.id=json_extract(walkers.avatar,'$.bikeRide.driver')";

export function boardBikePassenger(db,{room,id,key,driver,online,bikeCutoff,feedCutoff,fallCutoff}){
  const distance=`${square(at("walkers.avatar","x")+"-"+at("d.avatar","x"))} +
    ${square(at("walkers.avatar","y")+"-"+at("d.avatar","y"))}`;
  return db.prepare(`
    UPDATE walkers SET avatar=json_set(walkers.avatar,'$.bikeRide',json_object('driver',d.id),
      '$.seat',NULL,'$.seatSide',NULL,${rearPose("d.avatar")}) FROM walkers d
    WHERE d.room=walkers.room AND d.id=? AND d.player_key IS NOT NULL AND d.updated>=?
      AND ${mountedBike("d.avatar")} AND ${outdoors("d.avatar")}
      AND ${square(`COALESCE(${at("d.avatar","vx")},0)`)} + ${square(`COALESCE(${at("d.avatar","vy")},0)`)} <= ?
      AND ${distance} <= ? AND NOT EXISTS(
        SELECT 1 FROM walkers p WHERE p.room=d.room AND p.updated>=? AND ${at("p.avatar","bikeRide.driver")}=d.id)
      AND walkers.room=? AND walkers.id=? AND walkers.player_key=? AND walkers.updated>=? AND ${outdoors("walkers.avatar")}
      AND NOT ${bikePassenger("walkers.avatar")} AND ${at("walkers.avatar","bus")} IS NULL AND ${at("walkers.avatar","seat")} IS NULL
      AND (${at("walkers.avatar","bike")} IS NULL OR ${at("walkers.avatar","bike.parked.at")}<=?)
      AND COALESCE(${at("walkers.avatar","feed.at")},0)<=? AND COALESCE(${at("walkers.avatar","bikeFallAt")},0)<=?
  `)
    .bind(driver,online,bikePassengerBoardSpeed**2,bikeMountReach**2,online,room,id,key,online,bikeCutoff,feedCutoff,fallCutoff);
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
