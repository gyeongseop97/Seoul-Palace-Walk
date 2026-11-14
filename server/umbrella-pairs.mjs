import {museumBounds} from "../public/visit-layout.js";

const schema=`CREATE TABLE IF NOT EXISTS umbrella_handholds (
  room TEXT NOT NULL, id TEXT NOT NULL,
  PRIMARY KEY (room,id)
)`;
const readyDatabases=new WeakMap();

export function ensureUmbrellaPairs(db){
  let ready=readyDatabases.get(db);
  if(!ready){
    ready=db.prepare(schema).bind().all().catch(error=>{
      readyDatabases.delete(db);
      throw error;
    });
    readyDatabases.set(db,ready);
  }
  return ready;
}

export const umbrellaWeather=weather=>weather?.weather==="rain"||weather?.weather==="snow";

const field=(alias,key)=>`json_extract(${alias}.avatar,'$.${key}')`;
const x=alias=>field(alias,"x"),y=alias=>field(alias,"y");
const squared=value=>`(${value})*(${value})`;
const outside=alias=>`NOT (${x(alias)}>${museumBounds.minX} AND ${x(alias)}<${museumBounds.maxX}
  AND ${y(alias)}>${museumBounds.minY} AND ${y(alias)}<${museumBounds.maxY})`;
const onFoot=alias=>`${field(alias,"umbrellaReady")}=1
  AND ${field(alias,"seat")} IS NULL AND ${field(alias,"bus")} IS NULL
  AND ${field(alias,"bikeRide")} IS NULL
  AND (${field(alias,"bike")} IS NULL OR json_type(${alias}.avatar,'$.bike.parked') IS 'object')
  AND ${outside(alias)}`;
const activeGap=8;
export const umbrellaActorsReady=`${onFoot("a")} AND ${onFoot("b")} AND ${field("a","umbrella")}=1
  AND COALESCE(${field("a","up")},0)=COALESCE(${field("b","up")},0)
  AND ${squared(`${x("a")}-${x("b")}`)}+${squared(`${y("a")}-${y("b")}`)}<=${activeGap**2}`;

export const umbrellaPairMarked=`EXISTS (
  SELECT 1 FROM umbrella_handholds u WHERE u.room=handholds.room AND u.id=handholds.id
)`;
export const umbrellaPairJoin="LEFT JOIN umbrella_handholds u ON u.room=h.room AND u.id=h.id";
export const visibleUmbrellaPairs=`(u.id IS NULL OR (?=1 AND ${umbrellaActorsReady}))`;

// Run immediately after the handhold insert inside its room batch. Only a newly
// accepted insert gets marked, even when an old client retries the same request ID.
export function markUmbrellaPair(db,room,id){
  return db.prepare(`
    INSERT INTO umbrella_handholds (room,id)
    SELECT room,id FROM handholds WHERE changes()=1 AND room=? AND id=?
    ON CONFLICT(room,id) DO NOTHING
  `).bind(room,id);
}

export function clearUmbrellaMarkers(db,room){
  return db.prepare(`
    DELETE FROM umbrella_handholds WHERE room=? AND NOT EXISTS (
      SELECT 1 FROM handholds h WHERE h.room=umbrella_handholds.room AND h.id=umbrella_handholds.id
    )
  `).bind(room);
}

export function purgeUmbrellaPairs(db,{room,now,online,wet}){
  return [
    db.prepare(`
      DELETE FROM handholds WHERE room=? AND ${umbrellaPairMarked} AND (
        ?=0 OR (accepted IS NULL AND created<?) OR NOT EXISTS (
          SELECT 1 FROM walkers a JOIN walkers b ON b.room=a.room
          WHERE a.room=handholds.room AND a.id=handholds.leader AND b.id=handholds.follower
            AND a.updated>=? AND b.updated>=? AND ${umbrellaActorsReady}
        )
      )
    `).bind(room,Number(wet),now-15000,online,online),
    clearUmbrellaMarkers(db,room)
  ];
}
