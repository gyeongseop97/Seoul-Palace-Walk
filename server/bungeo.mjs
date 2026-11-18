import {FEED_MS,ITEMS,JUMP_MS} from "../public/activities.js";
import {SICK_DURATION_MS} from "../public/avatar-gestures.js";
import {BUNGEO_BURN_MS,BUNGEO_CUSTARD_ITEM,BUNGEO_CUSTOMER_NEXT_MS,BUNGEO_CUSTOMER_PATIENCE_MS,BUNGEO_CUSTOMER_WALK_MS,
  BUNGEO_EXPIRE_MS,BUNGEO_FILLINGS,BUNGEO_GIFT_REACH,BUNGEO_GOOD_MS,BUNGEO_ITEMS,BUNGEO_MOLD_COUNT,
  BUNGEO_STOCK_CAPACITY,BUNGEO_TOUCH_MS,HOTTEOK_ITEMS,HOTTEOK_PREPARATION,cookingStallById} from "../public/bungeo-data.js";
import {validItemSlot} from "../public/held-items.js";

const requestLifetime=4*60*60*1000;
const fillingColumn="filling TEXT DEFAULT 'redBean' CHECK (filling IN ('redBean','custard'))";
const hotteokColumn="hotteok_stage TEXT CHECK (hotteok_stage IN ('dough','sweetened','sealed','placed','pressed'))";
const schema=[
  `CREATE TABLE IF NOT EXISTS bungeo_molds (
    room TEXT PRIMARY KEY, batch TEXT NOT NULL, poured INTEGER NOT NULL, flipped INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS bungeo_cavities (
    room TEXT NOT NULL, cavity INTEGER NOT NULL CHECK (cavity BETWEEN 0 AND ${BUNGEO_MOLD_COUNT-1}),
    batch TEXT NOT NULL, poured INTEGER NOT NULL, flipped INTEGER, ${fillingColumn}, ${hotteokColumn}, PRIMARY KEY(room,cavity)
  )`,
  `CREATE TABLE IF NOT EXISTS bungeo_requests (
    room TEXT NOT NULL,player TEXT NOT NULL,request TEXT NOT NULL,at INTEGER NOT NULL,
    quality TEXT, slot TEXT, PRIMARY KEY(room,player,request)
  )`,
  `CREATE TABLE IF NOT EXISTS bungeo_orders (
    room TEXT PRIMARY KEY, id TEXT NOT NULL, customer INTEGER NOT NULL, quantity INTEGER NOT NULL,
    spawned INTEGER NOT NULL, accepted INTEGER, completed INTEGER,
    stock INTEGER NOT NULL DEFAULT 0, sold INTEGER NOT NULL DEFAULT 0
  )`,
  "CREATE TABLE IF NOT EXISTS bungeo_trays (room TEXT PRIMARY KEY, stock INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS bungeo_rack (room TEXT NOT NULL, batch TEXT NOT NULL, kind TEXT NOT NULL, PRIMARY KEY(room,batch))",
  "CREATE INDEX IF NOT EXISTS bungeo_requests_recent ON bungeo_requests(at)"
];
const readyDatabases=new WeakMap();

async function ensureCavityColumn(db,name,definition){
  const hasColumn=async()=>{
    const {results}=await db.prepare("PRAGMA table_info(bungeo_cavities)").bind().all();
    return results.some(column=>column.name===name);
  };
  if(await hasColumn())return;
  try{
    await db.prepare(`ALTER TABLE bungeo_cavities ADD COLUMN ${definition}`).bind().all();
  }catch(error){
    // Another runtime can complete the same migration between the check and ALTER.
    if(!await hasColumn())throw error;
  }
}

export function ensureBungeoTables(db){
  let ready=readyDatabases.get(db);
  if(!ready){
    // Move any in-flight pastry to the first cavity and retire the old rows in the same transaction.
    const migrate=db.prepare(`
      INSERT OR IGNORE INTO bungeo_cavities (room,cavity,batch,poured,flipped)
      SELECT room,0,batch,poured,flipped FROM bungeo_molds WHERE COALESCE(flipped,poured)>?
    `).bind(Date.now()-BUNGEO_EXPIRE_MS);
    // Older stands stored counts only. Expand them once, in the same transaction that clears the counts.
    const racks=[];
    for(const [table,kind] of [["bungeo_trays",HOTTEOK_ITEMS.good],["bungeo_orders",BUNGEO_ITEMS.good]]){
      racks.push(db.prepare(`WITH RECURSIVE slots(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM slots WHERE n<${BUNGEO_STOCK_CAPACITY})
        INSERT INTO bungeo_rack(room,batch,kind)
        SELECT room,'legacy-'||n,? FROM ${table} JOIN slots ON n<=stock`).bind(kind),
        db.prepare(`UPDATE ${table} SET stock=0 WHERE stock>0`).bind());
    }
    ready=db.batch([...schema.map(sql=>db.prepare(sql).bind()),...racks,migrate,db.prepare("DELETE FROM bungeo_molds").bind()])
      .then(()=>ensureCavityColumn(db,"filling",fillingColumn))
      .then(()=>ensureCavityColumn(db,"hotteok_stage",hotteokColumn))
      .catch(error=>{readyDatabases.delete(db);throw error;});
    readyDatabases.set(db,ready);
  }
  return ready;
}

const token=value=>typeof value==="string"&&/^[a-f0-9]{32}$/.test(value);
const validCavity=value=>value===undefined||Number.isInteger(value)&&value>=0&&value<BUNGEO_MOLD_COUNT;
export function validBungeo(command,player){
  const stall=cookingStallById(command?.stall);
  if(!token(command?.id)||!stall||!validCavity(command.cavity))return false;
  if(Object.hasOwn(HOTTEOK_PREPARATION,command.action))return stall.kind==="hotteok"&&token(command.batch);
  switch(command.action){
    case "pour":return (command.prepare===undefined||typeof command.prepare==="boolean")&&(stall.kind==="bungeo"||command.prepare!==true);
    case "fill":return stall.kind==="bungeo"&&token(command.batch)&&BUNGEO_FILLINGS.includes(command.filling);
    case "flip":return token(command.batch);
    case "take":return token(command.batch)&&validItemSlot(command.slot);
    case "gift":return token(command.to)&&command.to!==player&&validItemSlot(command.slot);
    case "putTray":return stall.kind==="hotteok"&&validItemSlot(command.slot);
    case "takeTray":return validItemSlot(command.slot);
    case "acceptOrder":
    case "serveOrder":return stall.customer&&token(command.order);
    case "plate":return token(command.batch)&&(command.order===undefined||token(command.order));
    default:return false;
  }
}

const position=(alias,axis)=>`json_extract(${alias}.avatar,'$.${axis}')`;
const squared=(x,y)=>`((${x})*(${x})+(${y})*(${y}))`;
const reach=(alias,stall,radius)=>`${squared(`${position(alias,"x")}-(${stall.x})`,`${position(alias,"y")}-(${stall.y})`)}<=${radius**2}`;
const playable=alias=>`json_extract(${alias}.avatar,'$.bus') IS NULL AND json_extract(${alias}.avatar,'$.seat') IS NULL
  AND json_extract(${alias}.avatar,'$.bikeRide') IS NULL
  AND (json_extract(${alias}.avatar,'$.bike') IS NULL OR json_type(${alias}.avatar,'$.bike.parked')='object')
  AND COALESCE(json_extract(${alias}.avatar,'$.jump'),0) +
    CASE WHEN json_extract(${alias}.avatar,'$.vaultBase') IS NULL THEN ${JUMP_MS} ELSE 1150 END<=?
  AND COALESCE(json_extract(${alias}.avatar,'$.feed.at'),0)<=?
  AND COALESCE(json_extract(${alias}.avatar,'$.sickAt'),0)<=?`;
const nearCook=stall=>`w.room=? AND w.id=? AND w.player_key=? AND w.updated>=? AND ${reach("w",stall,stall.radius)} AND ${playable("w")}`;
// Keep the original market's rows usable. Other stalls use a room-and-stall key for their cookware.
const stateRoom=({room,stall})=>stall.customer?room:`${room}:${stall.id}`;
const readyArgs=({room,id,key,now,online})=>[room,id,key,online,now,now-FEED_MS,now-SICK_DURATION_MS];
const unseen="NOT EXISTS (SELECT 1 FROM bungeo_requests WHERE room=? AND player=? AND request=?)";
const actionArgs=({room,id,bungeo})=>[room,id,bungeo.id];
const moldArgs=context=>[stateRoom(context),context.bungeo.cavity??0,context.bungeo.batch];
const cookedKinds=[...Object.values(BUNGEO_ITEMS),BUNGEO_CUSTARD_ITEM,...Object.values(HOTTEOK_ITEMS)].map(kind=>`'${kind}'`).join(",");
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
  const {now,bungeo,stall}=context;
  const hotteok=stall.kind==="hotteok";
  const write=db.prepare(`
    INSERT INTO bungeo_cavities (room,cavity,batch,poured,flipped,filling,hotteok_stage)
    SELECT ?,?,?,?,NULL,?,? FROM walkers w WHERE ${nearCook(stall)} AND ${unseen}
    ON CONFLICT(room,cavity) DO UPDATE SET batch=excluded.batch,poured=excluded.poured,flipped=NULL,
      filling=excluded.filling,hotteok_stage=excluded.hotteok_stage
    WHERE COALESCE(bungeo_cavities.flipped,bungeo_cavities.poured)<=?
  `).bind(stateRoom(context),bungeo.cavity??0,bungeo.id,now,hotteok||bungeo.prepare?null:"redBean",hotteok?"dough":null,
    ...readyArgs(context),...actionArgs(context),now-BUNGEO_EXPIRE_MS);
  return [write,receipt(db,context)];
}

function fill(db,context){
  const {now,bungeo}=context;
  const write=db.prepare(`
    UPDATE bungeo_cavities SET filling=?,poured=? WHERE room=? AND cavity=? AND batch=? AND filling IS NULL
      AND poured>? AND ${unseen}
    AND EXISTS (SELECT 1 FROM walkers w WHERE ${nearCook(context.stall)})
  `).bind(bungeo.filling,now,...moldArgs(context),now-BUNGEO_EXPIRE_MS,...actionArgs(context),...readyArgs(context));
  return [write,receipt(db,context)];
}

function prepareHotteok(db,context){
  const {from,to}=HOTTEOK_PREPARATION[context.bungeo.action],{now}=context;
  const write=db.prepare(`
    UPDATE bungeo_cavities SET hotteok_stage=?,poured=?
    WHERE room=? AND cavity=? AND batch=? AND flipped IS NULL AND hotteok_stage=? AND poured>? AND ${unseen}
      AND EXISTS (SELECT 1 FROM walkers w WHERE ${nearCook(context.stall)})
  `).bind(to,now,...moldArgs(context),from,now-BUNGEO_EXPIRE_MS,...actionArgs(context),...readyArgs(context));
  return [write,receipt(db,context)];
}

const cookable=stall=>stall.kind==="hotteok"?
  "(hotteok_stage='pressed' OR (hotteok_stage IS NULL AND filling IS NOT NULL))":"filling IS NOT NULL";
function flip(db,context){
  const {now}=context;
  const write=db.prepare(`
    UPDATE bungeo_cavities SET flipped=? WHERE room=? AND cavity=? AND batch=? AND flipped IS NULL AND ${cookable(context.stall)}
      AND poured<=? AND poured>? AND ${unseen}
    AND EXISTS (SELECT 1 FROM walkers w WHERE ${nearCook(context.stall)})
  `).bind(now,...moldArgs(context),now-BUNGEO_TOUCH_MS,now-BUNGEO_EXPIRE_MS,...actionArgs(context),...readyArgs(context));
  return [write,receipt(db,context)];
}

const bakedQuality=`CASE WHEN flipped-poured>${BUNGEO_BURN_MS} OR ?-flipped>${BUNGEO_BURN_MS} THEN 'burnt'
  WHEN flipped-poured<${BUNGEO_GOOD_MS} OR ?-flipped<${BUNGEO_GOOD_MS} THEN 'torn' ELSE 'good' END`;
const clearedMold=(db,context)=>db.prepare("DELETE FROM bungeo_cavities WHERE room=? AND cavity=? AND batch=? AND changes()=1")
  .bind(...moldArgs(context));
function bakedItem(stall){
  const items=stall.kind==="hotteok"?HOTTEOK_ITEMS:BUNGEO_ITEMS;
  const base=`CASE quality ${Object.entries(items).map(([quality,kind])=>`WHEN '${quality}' THEN '${kind}'`).join(" ")} END`;
  return stall.kind==="bungeo"?`CASE WHEN quality='good' AND filling='custard' THEN '${BUNGEO_CUSTARD_ITEM}' ELSE ${base} END`:base;
}
const rackSpace=`(SELECT COUNT(*) FROM bungeo_rack WHERE room=?)<${BUNGEO_STOCK_CAPACITY}`;
const sellable=`kind IN ('${BUNGEO_ITEMS.good}','${BUNGEO_CUSTARD_ITEM}')`;
function moldReceipt(db,context,slot=null){
  const {now}=context;
  return db.prepare(`
    INSERT INTO bungeo_requests (room,player,request,at,quality,slot)
    SELECT ?,?,?,?,${bakedQuality},? FROM bungeo_cavities WHERE room=? AND cavity=? AND batch=? AND changes()=1
    ON CONFLICT(room,player,request) DO NOTHING
  `).bind(...actionArgs(context),now,now,now,slot,...moldArgs(context));
}
function take(db,context){
  const {now,bungeo,stall}=context,path=itemPath(bungeo.slot);
  const items=stall.kind==="hotteok"?HOTTEOK_ITEMS:BUNGEO_ITEMS,pickup=bakedItem(stall);
  const grant=db.prepare(`
    WITH bake AS MATERIALIZED (
      SELECT ${bakedQuality} AS quality,filling FROM bungeo_cavities
      WHERE room=? AND cavity=? AND batch=? AND flipped<=? AND flipped>? AND ${cookable(stall)}
    )
    UPDATE walkers AS w SET avatar=json_set(w.avatar,'${path}',json_object(
      'kind',(SELECT ${pickup} FROM bake),
      'remaining',${ITEMS[items.good].uses},'started',0),'$.bungeoClaim',?)
    WHERE ${nearCook(stall)} AND ${freeSlot("w",path)} AND ${noMeal("w")} AND ${unseen} AND EXISTS (SELECT 1 FROM bake)
  `).bind(now,now,...moldArgs(context),now-BUNGEO_TOUCH_MS,now-BUNGEO_EXPIRE_MS,bungeo.id,...readyArgs(context),now,...actionArgs(context));
  return [grant,moldReceipt(db,context,bungeo.slot),clearedMold(db,context)];
}

function putHotteokOnTray(db,context){
  const {now,bungeo,stall}=context,path=itemPath(bungeo.slot),cookingRoom=stateRoom(context);
  const hold=`${nearCook(stall)} AND ${itemKind("w",path)}='${HOTTEOK_ITEMS.good}'
    AND ${itemRemaining("w",path)}=${ITEMS.hotteok.uses} AND ${availableAt("w",path)}<=?`;
  const add=db.prepare(`
    INSERT INTO bungeo_rack(room,batch,kind)
    SELECT ?,?,? FROM walkers w WHERE ${hold} AND ${unseen} AND ${rackSpace}
  `).bind(cookingRoom,bungeo.id,HOTTEOK_ITEMS.good,...readyArgs(context),now,...actionArgs(context),cookingRoom);
  const release=db.prepare(`
    UPDATE walkers AS w SET avatar=json_set(json_remove(w.avatar,'${path}'),'$.bungeoClaim',?)
    WHERE changes()=1 AND ${hold}
  `).bind(bungeo.id,...readyArgs(context),now);
  return [add,release,receipt(db,context,{slot:bungeo.slot})];
}

function takeFromTray(db,context){
  const {now,bungeo,stall}=context,path=itemPath(bungeo.slot),cookingRoom=stateRoom(context);
  const first="SELECT rowid FROM bungeo_rack WHERE room=? ORDER BY rowid LIMIT 1";
  const pickup=db.prepare(`
    UPDATE walkers AS w SET avatar=json_set(w.avatar,'${path}',json_object(
      'kind',(SELECT kind FROM bungeo_rack WHERE rowid=(${first})),'remaining',${ITEMS[stall.kind==="hotteok"?HOTTEOK_ITEMS.good:BUNGEO_ITEMS.good].uses},'started',0),'$.bungeoClaim',?)
    WHERE ${nearCook(stall)} AND ${freeSlot("w",path)} AND ${noMeal("w")} AND ${unseen}
      AND EXISTS (SELECT 1 FROM bungeo_rack WHERE room=?)
  `).bind(cookingRoom,bungeo.id,...readyArgs(context),now,...actionArgs(context),cookingRoom);
  const remove=db.prepare(`DELETE FROM bungeo_rack WHERE rowid=(${first}) AND changes()=1`).bind(cookingRoom);
  const items=stall.kind==="hotteok"?HOTTEOK_ITEMS:BUNGEO_ITEMS;
  const remember=db.prepare(`
    INSERT INTO bungeo_requests(room,player,request,at,quality,slot)
    SELECT ?,?,?,?,CASE kind WHEN ? THEN 'burnt' WHEN ? THEN 'torn' ELSE 'good' END,?
    FROM bungeo_rack WHERE rowid=(${first}) AND changes()=1
    ON CONFLICT(room,player,request) DO NOTHING
  `).bind(...actionArgs(context),now,items.burnt,items.torn,bungeo.slot,cookingRoom);
  return [pickup,remember,remove];
}

function gift(db,context){
  const {room,id,now,online,bungeo,stall}=context,path=itemPath(bungeo.slot);
  const transfer=db.prepare(`
    WITH transfer AS MATERIALIZED (
      SELECT w.id AS sender,r.id AS recipient,json_extract(w.avatar,'${path}') AS held,
        CASE WHEN ${freeSlot("r","$.item")} THEN '$.item' ELSE '$.secondItem' END AS destination
      FROM walkers w JOIN walkers r ON r.room=w.room AND r.id=?
      WHERE ${nearCook(stall)} AND r.id<>w.id AND r.player_key IS NOT NULL AND r.updated>=?
        AND json_extract(r.avatar,'$.bungeoReady')=1
        AND ${reach("r",stall,stall.radius)} AND ${playable("r")} AND ${noMeal("r")}
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

function acceptOrder(db,context){
  const {room,now,bungeo}=context;
  const accept=db.prepare(`
    UPDATE bungeo_orders SET accepted=? WHERE room=? AND id=? AND accepted IS NULL AND completed IS NULL
      AND spawned<=? AND spawned>? AND ${unseen}
      AND EXISTS (SELECT 1 FROM walkers w WHERE ${nearCook(context.stall)})
  `).bind(now,room,bungeo.order,now-BUNGEO_CUSTOMER_WALK_MS,now-BUNGEO_CUSTOMER_PATIENCE_MS,
    ...actionArgs(context),...readyArgs(context));
  return [accept,receipt(db,context)];
}

const acceptedOrder="room=? AND id=? AND accepted>? AND completed IS NULL";
function plate(db,context){
  const {now,stall}=context,cookingRoom=stateRoom(context);
  const add=db.prepare(`
    INSERT INTO bungeo_rack(room,batch,kind)
    SELECT ?,batch,${bakedItem(stall)} FROM
      (SELECT batch,filling,${bakedQuality} AS quality FROM bungeo_cavities
       WHERE room=? AND cavity=? AND batch=? AND flipped<=? AND flipped>? AND ${cookable(stall)})
    WHERE ${rackSpace} AND ${unseen} AND EXISTS (SELECT 1 FROM walkers w WHERE ${nearCook(stall)})
  `).bind(cookingRoom,now,now,...moldArgs(context),now-BUNGEO_TOUCH_MS,now-BUNGEO_EXPIRE_MS,
    cookingRoom,...actionArgs(context),...readyArgs(context));
  return [add,moldReceipt(db,context),clearedMold(db,context)];
}

function serveOrder(db,context){
  const {room,now,bungeo}=context;
  const serve=db.prepare(`
    UPDATE bungeo_orders SET completed=?,sold=sold+quantity
    WHERE ${acceptedOrder} AND (SELECT COUNT(*) FROM bungeo_rack WHERE room=? AND ${sellable})>=quantity AND ${unseen}
      AND EXISTS (SELECT 1 FROM walkers w WHERE ${nearCook(context.stall)})
  `).bind(now,room,bungeo.order,now-BUNGEO_CUSTOMER_PATIENCE_MS,room,...actionArgs(context),...readyArgs(context));
  const remove=db.prepare(`DELETE FROM bungeo_rack WHERE changes()=1 AND rowid IN (
    SELECT rowid FROM bungeo_rack WHERE room=? AND ${sellable} ORDER BY rowid
    LIMIT (SELECT quantity FROM bungeo_orders WHERE room=?))`).bind(room,room);
  return [serve,receipt(db,context),remove];
}

export function bungeoStatements(db,context){
  if(Object.hasOwn(HOTTEOK_PREPARATION,context.bungeo.action))return prepareHotteok(db,context);
  switch(context.bungeo.action){
    case "pour":return pour(db,context);
    case "fill":return fill(db,context);
    case "flip":return flip(db,context);
    case "take":return take(db,context);
    case "putTray":return putHotteokOnTray(db,context);
    case "takeTray":return takeFromTray(db,context);
    case "gift":return gift(db,context);
    case "acceptOrder":return acceptOrder(db,context);
    case "plate":return plate(db,context);
    case "serveOrder":return serveOrder(db,context);
  }
}

export function selectBungeo(db,context){
  const {room,id,key,now,online,bungeo,stall}=context,cookingRoom=stateRoom(context);
  return db.prepare(`
    SELECT (SELECT json_group_array(json_object('cavity',m.cavity,'id',m.batch,
      'stage',CASE WHEN m.flipped IS NOT NULL THEN 'second' WHEN m.hotteok_stage='pressed' THEN 'first'
        WHEN m.hotteok_stage IS NOT NULL THEN m.hotteok_stage WHEN m.filling IS NULL THEN 'filling' ELSE 'first' END,
      'pouredAt',m.poured,'flippedAt',m.flipped,'filling',m.filling))
      FROM bungeo_cavities m JOIN walkers w ON w.room=? AND w.id=? AND w.player_key=? AND w.updated>=?
      WHERE m.room=? AND COALESCE(m.flipped,m.poured)>? AND ${reach("w",stall,stall.watchRadius)}) AS molds,
      (SELECT json_object('id',o.id,'customer',o.customer,'quantity',o.quantity,'stock',(SELECT COUNT(*) FROM bungeo_rack WHERE room=o.room AND ${sellable}),
        'spawnedAt',o.spawned,'arrivesAt',o.spawned+${BUNGEO_CUSTOMER_WALK_MS},'acceptedAt',o.accepted,
        'completedAt',o.completed,'nextAt',o.completed+${BUNGEO_CUSTOMER_NEXT_MS},
        'expiresAt',COALESCE(o.accepted,o.spawned)+${BUNGEO_CUSTOMER_PATIENCE_MS},'totalSold',o.sold)
      FROM bungeo_orders o JOIN walkers w ON w.room=o.room AND w.id=? AND w.player_key=? AND w.updated>=?
      WHERE o.room=? AND ${reach("w",stall,stall.watchRadius)}) AS customerOrder,
      (SELECT COUNT(*) FROM bungeo_rack t JOIN walkers w ON w.room=? AND w.id=? AND w.player_key=? AND w.updated>=?
      WHERE t.room=? AND ${reach("w",stall,stall.watchRadius)}) AS trayStock,
      (SELECT json_object('quality',quality,'slot',slot) FROM bungeo_requests WHERE room=? AND player=? AND request=?) AS receipt
  `).bind(room,id,key,online,cookingRoom,now-BUNGEO_EXPIRE_MS,id,key,online,cookingRoom,
    room,id,key,online,cookingRoom,room,id,bungeo?.id??null);
}

function activeOrder(order,now){
  if(!order||now>=(order.nextAt??order.expiresAt))return null;
  const complete=order.completedAt!==null;
  const phase=complete?"complete":order.acceptedAt!==null?"accepted":now<order.arrivesAt?"approaching":"waiting";
  return {...order,phase,served:complete?order.quantity:0};
}

export async function advanceBungeoOrder(db,context,avatar,row){
  const {now,room,stall}=context;
  // Normal watch requests only read. Generate the next customer when someone's actually at the counter.
  if(!stall.customer||activeOrder(JSON.parse(row?.customerOrder??"null"),now)||
    Math.hypot(avatar.x-stall.x,avatar.y-stall.y)>stall.radius||
    avatar.seat!=null||avatar.bus||avatar.bikeRide||avatar.bike&&!avatar.bike.parked||
    now-(avatar.jump??0)<(avatar.vaultBase==null?JUMP_MS:1150)||
    now-(avatar.feed?.at??0)<FEED_MS||now-(avatar.sickAt??0)<SICK_DURATION_MS)return row;
  const advance=db.prepare(`
    INSERT INTO bungeo_orders (room,id,customer,quantity,spawned)
    SELECT ?,lower(hex(randomblob(16))),abs(random()%6),1+abs(random()%3),?
    FROM walkers w WHERE ${nearCook(stall)}
    ON CONFLICT(room) DO UPDATE SET id=excluded.id,customer=excluded.customer,quantity=excluded.quantity,
      spawned=excluded.spawned,accepted=NULL,completed=NULL
    WHERE COALESCE(bungeo_orders.completed+${BUNGEO_CUSTOMER_NEXT_MS},
      COALESCE(bungeo_orders.accepted,bungeo_orders.spawned)+${BUNGEO_CUSTOMER_PATIENCE_MS})<=?
  `).bind(room,now,...readyArgs(context),now);
  const [,selection]=await db.batch([advance,selectBungeo(db,context)]);
  return selection.results[0];
}

export function bungeoPayload(row,{bungeo,now,stall}){
  const bungeoMolds=Array(BUNGEO_MOLD_COUNT).fill(null);
  for(const {cavity,filling,...mold} of JSON.parse(row?.molds??"[]")){
    bungeoMolds[cavity]=filling==="custard"?{...mold,filling}:mold;
  }
  const order=JSON.parse(row?.customerOrder??"null");
  const bungeoOrder=activeOrder(order,now);
  const state={bungeoStall:stall.id,bungeo:bungeoMolds[0]?.stage==="filling"?null:bungeoMolds[0],bungeoMolds,bungeoOrder,
    bungeoStock:row?.trayStock??0};
  if(!bungeo)return state;
  const result=row?.receipt?JSON.parse(row.receipt):null;
  return {...state,bungeoResult:{id:bungeo.id,accepted:Boolean(result),
    quality:result?.quality??undefined,slot:result?.slot??undefined}};
}

export function cleanupBungeo(db,now){
  return [db.prepare("DELETE FROM bungeo_cavities WHERE COALESCE(flipped,poured)<=?").bind(now-BUNGEO_EXPIRE_MS),
    db.prepare("DELETE FROM bungeo_requests WHERE at<?").bind(now-requestLifetime)];
}
