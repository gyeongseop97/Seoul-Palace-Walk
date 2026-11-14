import {ITEMS,JUMP_MS} from "../public/activities.js";
import {validItemSlot} from "../public/held-items.js";
import {isPicnicItem,picnicBlanketFits,picnicKinds,PICNIC_DEPTH,PICNIC_OFFER_MS,PICNIC_REACH,PICNIC_SLOTS,PICNIC_WIDTH} from "../public/picnic-data.js";

const matLifetime=45*60*1000,requestLifetime=4*60*60*1000;
const validId=value=>typeof value==="string"&&/^[a-f0-9]{32}$/.test(value);
const schema=[
  `CREATE TABLE IF NOT EXISTS picnic_mats (
    room TEXT NOT NULL,id TEXT NOT NULL,owner TEXT NOT NULL,nickname TEXT NOT NULL,
    x REAL NOT NULL,y REAL NOT NULL,touched INTEGER NOT NULL,PRIMARY KEY(room,id)
  )`,
  "CREATE INDEX IF NOT EXISTS picnic_mats_recent ON picnic_mats(room,touched)",
  `CREATE TABLE IF NOT EXISTS picnic_food (
    room TEXT NOT NULL,mat TEXT NOT NULL,id TEXT NOT NULL,owner TEXT NOT NULL,nickname TEXT NOT NULL,
    kind TEXT NOT NULL,slot INTEGER NOT NULL,target TEXT,offered INTEGER,
    PRIMARY KEY(room,mat,id),UNIQUE(room,mat,slot)
  )`,
  `CREATE TABLE IF NOT EXISTS picnic_requests (
    room TEXT NOT NULL,player TEXT NOT NULL,request TEXT NOT NULL,at INTEGER NOT NULL,
    PRIMARY KEY(room,player,request)
  )`,
  "CREATE INDEX IF NOT EXISTS picnic_requests_recent ON picnic_requests(room,at)"
];
const readyDatabases=new WeakMap();

export function ensurePicnicTables(db){
  let ready=readyDatabases.get(db);
  if(!ready){
    ready=db.batch(schema.map(sql=>db.prepare(sql).bind())).catch(error=>{readyDatabases.delete(db);throw error;});
    readyDatabases.set(db,ready);
  }
  return ready;
}

export function validPicnic(command){
  if(!validId(command?.id))return false;
  if(command.action==="open")return picnicBlanketFits(command);
  if(!validId(command.mat))return false;
  if(command.action==="close")return true;
  const validHand=command.slot===undefined||validItemSlot(command.slot);
  if(command.action==="place")return validHand&&isPicnicItem(command.kind);
  if(!validId(command.item))return false;
  return command.action==="take"?validHand:command.action==="offer"&&validId(command.target);
}

const avatarX="json_extract(w.avatar,'$.x')",avatarY="json_extract(w.avatar,'$.y')";
const squared=(x,y)=>`((${x})*(${x})+(${y})*(${y}))`;
const readyWalker=`w.room=? AND w.id=? AND w.player_key=? AND w.updated>=?
  AND json_extract(w.avatar,'$.bus') IS NULL AND json_extract(w.avatar,'$.seat') IS NULL
  AND json_extract(w.avatar,'$.bikeRide') IS NULL
  AND (json_extract(w.avatar,'$.bike') IS NULL OR json_type(w.avatar,'$.bike.parked')='object')
  AND COALESCE(json_extract(w.avatar,'$.jump'),0)<=?`;
const readyArgs=({room,id,key,now,online})=>[room,id,key,online,now-JUMP_MS];
const inReach=`${squared(avatarX+"-m.x",avatarY+"-m.y")}<=${PICNIC_REACH**2}`;
const unseen="NOT EXISTS (SELECT 1 FROM picnic_requests WHERE room=? AND player=? AND request=?)";
const slots=PICNIC_SLOTS.map((_,index)=>`(${index})`).join(",");
const durations=Object.entries(ITEMS).map(([kind,item])=>`WHEN '${kind}' THEN ${item.duration}`).join(" ");

function inventoryPath(slot){
  const path=slot==="secondItem"?"$.secondItem":"$.item";
  const heldKind=`json_extract(w.avatar,'${path}.kind')`;
  return {
    path,heldKind,remaining:`COALESCE(json_extract(w.avatar,'${path}.remaining'),0)`,
    started:`COALESCE(json_extract(w.avatar,'${path}.started'),0)`,
    duration:`CASE ${heldKind} ${durations} ELSE 0 END`
  };
}

function openMat(db,context,request){
  const {room,id,now,picnic}=context;
  return db.prepare(`
    INSERT INTO picnic_mats (room,id,owner,nickname,x,y,touched)
    SELECT w.room,?,w.id,w.nickname,?,?,? FROM walkers w
    WHERE ${readyWalker} AND ${squared(avatarX+"-?",avatarY+"-?")}<=.85*.85
      AND NOT EXISTS (SELECT 1 FROM picnic_mats m WHERE m.room=? AND m.touched>=? AND (
        m.owner=? OR (ABS(m.x-?)<? AND ABS(m.y-?)<?)))
      AND ${unseen}
    ON CONFLICT(room,id) DO NOTHING
  `).bind(picnic.id,picnic.x,picnic.y,now,...readyArgs(context),picnic.x,picnic.x,picnic.y,picnic.y,
    room,now-matLifetime,id,picnic.x,PICNIC_WIDTH+.22,picnic.y,PICNIC_DEPTH+.22,...request);
}

function placeFood(db,context,request){
  const {room,id,key,now,picnic}=context;
  const {path,heldKind,remaining,started}=inventoryPath(picnic.slot);
  const place=db.prepare(`
    WITH slots(slot) AS (VALUES ${slots})
    INSERT INTO picnic_food (room,mat,id,owner,nickname,kind,slot)
    SELECT m.room,m.id,?,w.id,w.nickname,?,s.slot FROM picnic_mats m
    JOIN walkers w ON w.room=m.room CROSS JOIN slots s
    WHERE m.room=? AND m.id=? AND m.touched>=? AND ${readyWalker} AND ${inReach}
      AND ${heldKind}=? AND ${remaining}>0 AND ${started}<=?
      AND NOT EXISTS (SELECT 1 FROM picnic_food p WHERE p.room=m.room AND p.mat=m.id AND p.slot=s.slot)
      AND ${unseen}
    ORDER BY s.slot LIMIT 1
    ON CONFLICT(room,mat,id) DO NOTHING
  `).bind(picnic.id,picnic.kind,room,picnic.mat,now-matLifetime,...readyArgs(context),
    picnic.kind,now-ITEMS[picnic.kind].duration,...request);
  const spend=db.prepare(`
    UPDATE walkers SET avatar=json_set(CASE WHEN json_extract(avatar,'${path}.remaining')=1
      THEN json_remove(avatar,'${path}')
      ELSE json_set(avatar,'${path}.remaining',json_extract(avatar,'${path}.remaining')-1) END,'$.picnicClaim',?)
    WHERE room=? AND id=? AND player_key=? AND changes()=1
  `).bind(picnic.id,room,id,key);
  return [place,spend];
}

function offerFood(db,context,request){
  const {room,id,now,online,picnic}=context;
  const peerX="json_extract(peer.avatar,'$.x')",peerY="json_extract(peer.avatar,'$.y')";
  return db.prepare(`
    UPDATE picnic_food SET target=?,offered=?
    WHERE room=? AND mat=? AND id=? AND owner=? AND ${unseen}
      AND EXISTS (
        SELECT 1 FROM picnic_mats m JOIN walkers w ON w.room=m.room JOIN walkers peer ON peer.room=m.room
        WHERE m.room=picnic_food.room AND m.id=picnic_food.mat AND m.touched>=?
          AND ${readyWalker} AND ${inReach} AND peer.id=? AND peer.id<>w.id AND peer.updated>=?
          AND ${squared(peerX+"-m.x",peerY+"-m.y")}<=${PICNIC_REACH**2}
          AND ${squared(peerX+"-"+avatarX,peerY+"-"+avatarY)}<=${PICNIC_REACH**2}
          AND json_extract(peer.avatar,'$.bus') IS NULL
          AND json_extract(peer.avatar,'$.bikeRide') IS NULL
          AND (json_extract(peer.avatar,'$.bike') IS NULL OR json_type(peer.avatar,'$.bike.parked')='object')
      )
  `).bind(picnic.target,now,room,picnic.mat,picnic.item,id,...request,now-matLifetime,...readyArgs(context),picnic.target,online);
}

function takeFood(db,context,request){
  const {room,id,now,picnic}=context;
  const {path,remaining,started,duration}=inventoryPath(picnic.slot);
  const take=db.prepare(`
    UPDATE walkers AS w SET avatar=json_set(w.avatar,'${path}',json_object(
      'kind',(SELECT kind FROM picnic_food WHERE room=? AND mat=? AND id=?),'remaining',1,'started',0),'$.picnicClaim',?)
    WHERE ${readyWalker} AND ${remaining}<=0 AND ${started}+${duration}<=?
      AND ${unseen} AND EXISTS (
        SELECT 1 FROM picnic_mats m JOIN picnic_food p ON p.room=m.room AND p.mat=m.id
        WHERE m.room=w.room AND m.id=? AND p.id=? AND m.touched>=? AND ${inReach}
          AND (p.target IS NULL OR p.target=w.id OR p.owner=w.id OR p.offered<=?)
          AND p.kind IN (${picnicKinds.map(kind=>`'${kind}'`).join(",")})
      )
  `).bind(room,picnic.mat,picnic.item,picnic.id,...readyArgs(context),now,...request,
    picnic.mat,picnic.item,now-matLifetime,now-PICNIC_OFFER_MS);
  const remove=db.prepare("DELETE FROM picnic_food WHERE room=? AND mat=? AND id=? AND changes()=1")
    .bind(room,picnic.mat,picnic.item);
  return [take,remove];
}

function closeMat(db,context,request){
  const {room,id,now,picnic}=context;
  return db.prepare(`
    DELETE FROM picnic_mats AS m WHERE m.room=? AND m.id=? AND m.owner=? AND m.touched>=? AND ${unseen}
      AND NOT EXISTS (SELECT 1 FROM picnic_food p WHERE p.room=m.room AND p.mat=m.id)
      AND EXISTS (SELECT 1 FROM walkers w WHERE ${readyWalker} AND ${inReach})
  `).bind(room,picnic.mat,id,now-matLifetime,...request,...readyArgs(context));
}

export function picnicStatements(db,context){
  const {room,id,now,picnic}=context,request=[room,id,picnic.id];
  let operations;
  switch(picnic.action){
    case "open": operations=[openMat(db,context,request)];break;
    case "place": operations=placeFood(db,context,request);break;
    case "offer": operations=[offerFood(db,context,request)];break;
    case "take": operations=takeFood(db,context,request);break;
    case "close": operations=[closeMat(db,context,request)];break;
  }
  operations.push(db.prepare(`
    INSERT INTO picnic_requests (room,player,request,at)
    SELECT ?,?,?,? WHERE changes()=1 ON CONFLICT(room,player,request) DO NOTHING
  `).bind(...request,now));
  if(picnic.mat&&picnic.action!=="close")operations.push(db.prepare(
    "UPDATE picnic_mats SET touched=? WHERE room=? AND id=? AND changes()=1"
  ).bind(now,room,picnic.mat));
  return operations;
}

export function selectPicnics(db,{room,id,now,picnic}){
  return db.prepare(`
    SELECT (SELECT json_group_array(json_object('id',m.id,'owner',m.owner,'nickname',m.nickname,'x',m.x,'y',m.y,
      'items',json((SELECT json_group_array(json_object('id',p.id,'owner',p.owner,'nickname',p.nickname,
        'kind',p.kind,'slot',p.slot,'target',CASE WHEN p.offered>? THEN p.target ELSE NULL END,
        'offered',p.offered)) FROM picnic_food p WHERE p.room=m.room AND p.mat=m.id))))
      FROM picnic_mats m JOIN walkers w ON w.room=m.room AND w.id=?
      WHERE m.room=? AND m.touched>=? AND ${squared(avatarX+"-m.x",avatarY+"-m.y")}<=10000) AS mats,
      EXISTS(SELECT 1 FROM picnic_requests WHERE room=? AND player=? AND request=?) AS recognized
  `).bind(now-PICNIC_OFFER_MS,id,room,now-matLifetime,room,id,picnic?.id??null);
}

export function picnicPayload(row,command){
  return {picnics:JSON.parse(row.mats),...(command?{picnicResult:row.recognized?"accepted":"unavailable"}:{})};
}

export function cleanupPicnics(db,room,now){
  return [
    db.prepare("DELETE FROM picnic_food WHERE room=? AND mat IN (SELECT id FROM picnic_mats WHERE room=? AND touched<?)")
      .bind(room,room,now-matLifetime),
    db.prepare("DELETE FROM picnic_mats WHERE room=? AND touched<?").bind(room,now-matLifetime),
    db.prepare("DELETE FROM picnic_requests WHERE room=? AND at<?").bind(room,now-requestLifetime)
  ];
}
