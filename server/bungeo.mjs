import {FEED_MS,ITEMS,JUMP_MS} from "../public/activities.js";
import {SICK_DURATION_MS} from "../public/avatar-gestures.js";
import {BUNGEO_BURN_MS,BUNGEO_EXPIRE_MS,BUNGEO_GIFT_REACH,BUNGEO_GOOD_MS,BUNGEO_ITEMS,BUNGEO_STALL,BUNGEO_TOUCH_MS} from "../public/bungeo-data.js";
import {validItemSlot} from "../public/held-items.js";

const requestLifetime=4*60*60*1000;
const schema=[
  `CREATE TABLE IF NOT EXISTS bungeo_molds (
    room TEXT PRIMARY KEY, batch TEXT NOT NULL, poured INTEGER NOT NULL, flipped INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS bungeo_requests (
    room TEXT NOT NULL,player TEXT NOT NULL,request TEXT NOT NULL,at INTEGER NOT NULL,
    quality TEXT, slot TEXT, PRIMARY KEY(room,player,request)
  )`,
  "CREATE INDEX IF NOT EXISTS bungeo_requests_recent ON bungeo_requests(at)"
];
const readyDatabases=new WeakMap();

export function ensureBungeoTables(db){
  let ready=readyDatabases.get(db);
  if(!ready){
    ready=db.batch(schema.map(sql=>db.prepare(sql).bind())).catch(error=>{readyDatabases.delete(db);throw error;});
    readyDatabases.set(db,ready);
  }
  return ready;
}

const token=value=>typeof value==="string"&&/^[a-f0-9]{32}$/.test(value);
export function validBungeo(command,player){
  if(!token(command?.id)||command.stall!==BUNGEO_STALL.id)return false;
  switch(command.action){
    case "pour":return true;
    case "flip":return token(command.batch);
    case "take":return token(command.batch)&&validItemSlot(command.slot);
    case "gift":return token(command.to)&&command.to!==player&&validItemSlot(command.slot);
    default:return false;
  }
}

const position=(alias,axis)=>`json_extract(${alias}.avatar,'$.${axis}')`;
const squared=(x,y)=>`((${x})*(${x})+(${y})*(${y}))`;
const reach=(alias,radius)=>`${squared(`${position(alias,"x")}-(${BUNGEO_STALL.x})`,`${position(alias,"y")}-(${BUNGEO_STALL.y})`)}<=${radius**2}`;
const playable=alias=>`json_extract(${alias}.avatar,'$.bus') IS NULL AND json_extract(${alias}.avatar,'$.seat') IS NULL
  AND json_extract(${alias}.avatar,'$.bikeRide') IS NULL
  AND (json_extract(${alias}.avatar,'$.bike') IS NULL OR json_type(${alias}.avatar,'$.bike.parked')='object')
  AND COALESCE(json_extract(${alias}.avatar,'$.jump'),0) +
    CASE WHEN json_extract(${alias}.avatar,'$.vaultBase') IS NULL THEN ${JUMP_MS} ELSE 1150 END<=?
  AND COALESCE(json_extract(${alias}.avatar,'$.feed.at'),0)<=?
  AND COALESCE(json_extract(${alias}.avatar,'$.sickAt'),0)<=?`;
const nearCook=`w.room=? AND w.id=? AND w.player_key=? AND w.updated>=? AND ${reach("w",BUNGEO_STALL.radius)} AND ${playable("w")}`;
const readyArgs=({room,id,key,now,online})=>[room,id,key,online,now,now-FEED_MS,now-SICK_DURATION_MS];
const unseen="NOT EXISTS (SELECT 1 FROM bungeo_requests WHERE room=? AND player=? AND request=?)";
const actionArgs=({room,id,bungeo})=>[room,id,bungeo.id];
const itemKinds=Object.entries(BUNGEO_ITEMS);
const cookedKinds=itemKinds.map(([,kind])=>`'${kind}'`).join(",");
const mealKinds=Object.entries(ITEMS).filter(([,item])=>item.meal).map(([kind])=>`'${kind}'`).join(",");
const durations=Object.entries(ITEMS).map(([kind,item])=>`WHEN '${kind}' THEN ${item.duration}`).join(" ");
const itemPath=slot=>slot==="secondItem"?"$.secondItem":"$.item";
const itemKind=(alias,path)=>`json_extract(${alias}.avatar,'${path}.kind')`;
const itemRemaining=(alias,path)=>`COALESCE(json_extract(${alias}.avatar,'${path}.remaining'),0)`;
const availableAt=(alias,path)=>`COALESCE(json_extract(${alias}.avatar,'${path}.started'),0)+
  CASE ${itemKind(alias,path)} ${durations} ELSE 0 END`;
const freeSlot=(alias,path)=>`${itemRemaining(alias,path)}<=0 AND ${availableAt(alias,path)}<=?`;
const noMeal=alias=>`COALESCE(${itemKind(alias,"$.item")},'') NOT IN (${mealKinds})
  AND COALESCE(${itemKind(alias,"$.secondItem")},'') NOT IN (${mealKinds})`;

function receipt(db,context,{quality=null,slot=null,changed=1}={}){
  return db.prepare(`INSERT INTO bungeo_requests (room,player,request,at,quality,slot)
    SELECT ?,?,?,?,?,? WHERE changes()=${changed} ON CONFLICT(room,player,request) DO NOTHING`)
    .bind(...actionArgs(context),context.now,quality,slot);
}

function pour(db,context){
  const {room,now,bungeo}=context;
  const write=db.prepare(`
    INSERT INTO bungeo_molds (room,batch,poured,flipped)
    SELECT ?,?,?,NULL FROM walkers w WHERE ${nearCook} AND ${unseen}
    ON CONFLICT(room) DO UPDATE SET batch=excluded.batch,poured=excluded.poured,flipped=NULL
    WHERE COALESCE(bungeo_molds.flipped,bungeo_molds.poured)<=?
  `).bind(room,bungeo.id,now,...readyArgs(context),...actionArgs(context),now-BUNGEO_EXPIRE_MS);
  return [write,receipt(db,context)];
}

function flip(db,context){
  const {room,now,bungeo}=context;
  const write=db.prepare(`
    UPDATE bungeo_molds SET flipped=? WHERE room=? AND batch=? AND flipped IS NULL
      AND poured<=? AND poured>? AND ${unseen}
      AND EXISTS (SELECT 1 FROM walkers w WHERE ${nearCook})
  `).bind(now,room,bungeo.batch,now-BUNGEO_TOUCH_MS,now-BUNGEO_EXPIRE_MS,...actionArgs(context),...readyArgs(context));
  return [write,receipt(db,context)];
}

const bakedQuality=`CASE WHEN flipped-poured>${BUNGEO_BURN_MS} OR ?-flipped>${BUNGEO_BURN_MS} THEN 'burnt'
  WHEN flipped-poured<${BUNGEO_GOOD_MS} OR ?-flipped<${BUNGEO_GOOD_MS} THEN 'torn' ELSE 'good' END`;
function take(db,context){
  const {room,now,bungeo}=context,path=itemPath(bungeo.slot);
  const grant=db.prepare(`
    WITH bake AS MATERIALIZED (
      SELECT ${bakedQuality} AS quality FROM bungeo_molds
      WHERE room=? AND batch=? AND flipped<=? AND flipped>?
    )
    UPDATE walkers AS w SET avatar=json_set(w.avatar,'${path}',json_object(
      'kind',(SELECT CASE quality ${itemKinds.map(([quality,kind])=>`WHEN '${quality}' THEN '${kind}'`).join(" ")} END FROM bake),
      'remaining',${ITEMS.bungeoppang.uses},'started',0),'$.bungeoClaim',?)
    WHERE ${nearCook} AND ${freeSlot("w",path)} AND ${noMeal("w")} AND ${unseen} AND EXISTS (SELECT 1 FROM bake)
  `).bind(now,now,room,bungeo.batch,now-BUNGEO_TOUCH_MS,now-BUNGEO_EXPIRE_MS,bungeo.id,...readyArgs(context),now,...actionArgs(context));
  const remember=db.prepare(`
    INSERT INTO bungeo_requests (room,player,request,at,quality,slot)
    SELECT ?,?,?,?,${bakedQuality},? FROM bungeo_molds WHERE room=? AND batch=? AND changes()=1
    ON CONFLICT(room,player,request) DO NOTHING
  `).bind(...actionArgs(context),now,now,now,bungeo.slot,room,bungeo.batch);
  const clear=db.prepare("DELETE FROM bungeo_molds WHERE room=? AND batch=? AND changes()=1")
    .bind(room,bungeo.batch);
  return [grant,remember,clear];
}

function gift(db,context){
  const {room,id,now,online,bungeo}=context,path=itemPath(bungeo.slot);
  const transfer=db.prepare(`
    WITH transfer AS MATERIALIZED (
      SELECT w.id AS sender,r.id AS recipient,json_extract(w.avatar,'${path}') AS held,
        CASE WHEN ${freeSlot("r","$.item")} THEN '$.item' ELSE '$.secondItem' END AS destination
      FROM walkers w JOIN walkers r ON r.room=w.room AND r.id=?
      WHERE ${nearCook} AND r.id<>w.id AND r.player_key IS NOT NULL AND r.updated>=?
        AND json_extract(r.avatar,'$.bungeoReady')=1
        AND ${reach("r",BUNGEO_STALL.radius)} AND ${playable("r")} AND ${noMeal("r")}
        AND ${squared(`${position("w","x")}-${position("r","x")}`,`${position("w","y")}-${position("r","y")}`)}<=${BUNGEO_GIFT_REACH**2}
        AND (${freeSlot("r","$.item")} OR ${freeSlot("r","$.secondItem")})
        AND ${itemKind("w",path)} IN (${cookedKinds}) AND ${itemRemaining("w",path)}>0 AND ${availableAt("w",path)}<=?
        AND ${noMeal("w")} AND ${unseen}
    )
    UPDATE walkers SET avatar=CASE WHEN walkers.id=? THEN json_set(json_remove(avatar,'${path}'),'$.bungeoClaim',?)
      ELSE json_set(avatar,(SELECT destination FROM transfer),json((SELECT held FROM transfer)),'$.bungeoClaim',?) END
    WHERE room=? AND id IN (SELECT sender FROM transfer UNION ALL SELECT recipient FROM transfer)
  `).bind(now,bungeo.to,...readyArgs(context),online,now,now-FEED_MS,now-SICK_DURATION_MS,now,now,now,
    ...actionArgs(context),id,bungeo.id,bungeo.id,room);
  return [transfer,receipt(db,context,{slot:bungeo.slot,changed:2})];
}

export function bungeoStatements(db,context){
  switch(context.bungeo.action){
    case "pour":return pour(db,context);
    case "flip":return flip(db,context);
    case "take":return take(db,context);
    case "gift":return gift(db,context);
  }
}

export function selectBungeo(db,{room,id,key,now,online,bungeo}){
  return db.prepare(`
    SELECT (SELECT json_object('id',m.batch,'stage',CASE WHEN m.flipped IS NULL THEN 'first' ELSE 'second' END,
      'pouredAt',m.poured,'flippedAt',m.flipped)
      FROM bungeo_molds m JOIN walkers w ON w.room=m.room AND w.id=? AND w.player_key=? AND w.updated>=?
      WHERE m.room=? AND COALESCE(m.flipped,m.poured)>? AND ${reach("w",BUNGEO_STALL.watchRadius)}) AS mold,
      (SELECT json_object('quality',quality,'slot',slot) FROM bungeo_requests WHERE room=? AND player=? AND request=?) AS receipt
  `).bind(id,key,online,room,now-BUNGEO_EXPIRE_MS,room,id,bungeo?.id??null);
}

export function bungeoPayload(row,command){
  const mold=row?.mold?JSON.parse(row.mold):null;
  if(!command)return {bungeo:mold};
  const result=row?.receipt?JSON.parse(row.receipt):null;
  return {bungeo:mold,bungeoResult:{id:command.id,accepted:Boolean(result),
    quality:result?.quality??undefined,slot:result?.slot??undefined}};
}

export function cleanupBungeo(db,now){
  return [db.prepare("DELETE FROM bungeo_molds WHERE COALESCE(flipped,poured)<=?").bind(now-BUNGEO_EXPIRE_MS),
    db.prepare("DELETE FROM bungeo_requests WHERE at<?").bind(now-requestLifetime)];
}
