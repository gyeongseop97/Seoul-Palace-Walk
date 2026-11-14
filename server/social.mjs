import {isCycling} from "../public/sejong-bike.js";
import {JUMP_MS} from "../public/activities.js";
import {ITEM_SLOTS} from "../public/held-items.js";
import {museumBounds} from "../public/visit-layout.js";
import {CLINK_DRINKS,CLINK_DURATION_MS,CLINK_INVITE_MS,CLINK_LEAD_MS,CLINK_REACH} from "../public/social-events.js";
import {plazaShowSpot,PLAZA_SHOW_DURATION_MS,PLAZA_SHOW_LEAD_MS,PLAZA_SHOW_REACH} from "../public/plaza-show.js";

const onFoot=field=>`json_extract(${field},'$.bus') IS NULL AND json_extract(${field},'$.bikeRide') IS NULL AND (
  json_extract(${field},'$.bike') IS NULL OR json_type(${field},'$.bike.parked') IS 'object')`;
const squared=term=>`(${term})*(${term})`;
const coordinate=(field,axis)=>`json_extract(${field},'$.${axis}')`;
const nearFountain=`${squared(`${coordinate("avatar","x")}-?`)} + ${squared(`${coordinate("avatar","y")}-?`)} <= ?`;

export function startFountainShow(db,{room,id,key,now,online,show}){
  const started=now+PLAZA_SHOW_LEAD_MS,ends=started+PLAZA_SHOW_DURATION_MS;
  const {x,y}=plazaShowSpot;
  return db.prepare(`
    INSERT INTO fountain_shows (room,id,fountain,host,started,ends)
    SELECT ?,?,?,?,?,? FROM walkers
    WHERE room=? AND id=? AND player_key=? AND updated>=? AND ${onFoot("avatar")} AND ${nearFountain}
      AND NOT EXISTS (SELECT 1 FROM fountain_shows WHERE room=? AND ends>?)
    ON CONFLICT(room,id) DO NOTHING
  `).bind(room,show.id,show.fountain,id,started,ends,room,id,key,online,x,x,y,y,PLAZA_SHOW_REACH**2,room,now);
}

const drinkDurations=JSON.stringify(CLINK_DRINKS);
const drinkSlot=(field,slot)=>`(json_extract(${field},'$.${slot}.remaining')>0
  AND json_extract(${field},'$.${slot}.started')<=? - json_extract(?, '$.' || json_extract(${field},'$.${slot}.kind')))`;
const readyDrink=field=>`(${ITEM_SLOTS.map(slot=>drinkSlot(field,slot)).join(" OR ")})
  AND json_extract(${field},'$.seat') IS NULL
  AND COALESCE(json_extract(${field},'$.jump'),0)<=? - ${JUMP_MS}
  AND ${onFoot(field)}`;
const inMuseum=field=>`(${coordinate(field,"x")}>${museumBounds.minX} AND ${coordinate(field,"x")}<${museumBounds.maxX}
  AND ${coordinate(field,"y")}>${museumBounds.minY} AND ${coordinate(field,"y")}<${museumBounds.maxY})`;
const readyClinkPair=`
  a.player_key IS NOT NULL AND b.player_key IS NOT NULL AND a.updated>=? AND b.updated>=?
  AND ${readyDrink("a.avatar")} AND ${readyDrink("b.avatar")}
  AND ${squared(`${coordinate("a.avatar","x")}-${coordinate("b.avatar","x")}`)} +
      ${squared(`${coordinate("a.avatar","y")}-${coordinate("b.avatar","y")}`)} <= ${CLINK_REACH**2}
  AND ${inMuseum("a.avatar")}=${inMuseum("b.avatar")}
  AND COALESCE(json_extract(a.avatar,'$.up'),0)=COALESCE(json_extract(b.avatar,'$.up'),0)
  AND NOT EXISTS (
    SELECT 1 FROM handholds h JOIN walkers leader ON leader.room=h.room AND leader.id=h.leader
    JOIN walkers follower ON follower.room=h.room AND follower.id=h.follower
    WHERE h.room=a.room AND h.accepted IS NOT NULL AND leader.updated>=? AND follower.updated>=?
      AND (h.leader IN (a.id,b.id) OR h.follower IN (a.id,b.id))
  )`;

export function clinkStatement(db,{room,id,key,now,online,clink}){
  const drinkArguments=[...ITEM_SLOTS.flatMap(()=>[now,drinkDurations]),now];
  const pairArguments=[online,online,...drinkArguments,...drinkArguments,online,online];
  if(clink.action==="invite")return db.prepare(`
    INSERT INTO clink_requests (room,id,sender,recipient,state,created,expires)
    SELECT ?,?,?,?,'pending',?,? FROM walkers a JOIN walkers b ON b.room=a.room
    WHERE a.room=? AND a.id=? AND a.player_key=? AND b.id=? AND a.id<>b.id AND ${readyClinkPair}
      AND NOT EXISTS (
        SELECT 1 FROM clink_requests c WHERE c.room=a.room AND c.expires>?
          AND c.state IN ('pending','active') AND (c.sender IN (a.id,b.id) OR c.recipient IN (a.id,b.id))
      )
    ON CONFLICT(room,id) DO NOTHING
  `).bind(room,clink.id,id,clink.target,now,now+CLINK_INVITE_MS,room,id,key,clink.target,...pairArguments,now);
  if(clink.action==="accept"){
    const started=now+CLINK_LEAD_MS;
    return db.prepare(`
      UPDATE clink_requests SET state='active',started=?,expires=?
      WHERE room=? AND id=? AND recipient=? AND state='pending' AND expires>?
        AND EXISTS (
          SELECT 1 FROM walkers a JOIN walkers b ON b.room=a.room
          WHERE a.room=clink_requests.room AND a.id=clink_requests.sender AND b.id=clink_requests.recipient
            AND b.player_key=? AND ${readyClinkPair}
        )
    `).bind(started,started+CLINK_DURATION_MS,room,clink.id,id,now,key,...pairArguments);
  }
  const decline=clink.action==="decline";
  return db.prepare(`
    UPDATE clink_requests SET state=?,expires=? WHERE room=? AND id=? AND ${decline?"recipient":"sender"}=?
      AND state='pending' AND expires>? AND EXISTS (
        SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=?
      )
  `).bind(decline?"declined":"cancelled",now,room,clink.id,id,now,room,id,key);
}

export function leaveClinks(db,{room,id,key,now}){
  return db.prepare(`
    UPDATE clink_requests SET state='cancelled',expires=?
    WHERE room=? AND (sender=? OR recipient=?) AND state='pending' AND expires>?
      AND EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key IS ?)
  `).bind(now,room,id,id,now,room,id,key);
}

export function cleanupSocial(db,room,before){
  return [
    db.prepare("DELETE FROM fountain_shows WHERE room=? AND ends<?").bind(room,before),
    db.prepare("DELETE FROM clink_requests WHERE room=? AND expires<?").bind(room,before)
  ];
}

export function selectSocial(db,{room,id,now,online,show,clink}){
  return db.prepare(`
    SELECT (
      SELECT json_object('id',id,'fountain',fountain,'startedAt',started,'endsAt',ends)
      FROM fountain_shows WHERE room=? AND ends>? ORDER BY ends DESC LIMIT 1
    ) AS fountainShow,
    EXISTS (SELECT 1 FROM fountain_shows WHERE room=? AND id=? AND host=?) AS showRecognized,
    (
      SELECT json_group_array(json_object('id',c.id,'from',c.sender,'to',c.recipient,'createdAt',c.created,
        'startedAt',c.started,'endsAt',CASE WHEN c.state='active' THEN c.expires END))
      FROM clink_requests c WHERE c.room=? AND c.expires>? AND (
        c.state='active' OR c.state='pending' AND (c.sender=? OR c.recipient=?) AND EXISTS (
          SELECT 1 FROM walkers a JOIN walkers b ON b.room=a.room
          WHERE a.room=c.room AND a.id=c.sender AND b.id=c.recipient AND a.updated>=? AND b.updated>=?
        )
      )
    ) AS clinks, (
      SELECT json_object('from',sender,'to',recipient,'state',state,'expires',expires)
      FROM clink_requests WHERE room=? AND id=? AND (sender=? OR recipient=?)
    ) AS requestedClink
  `).bind(room,now,room,show?.id??null,id,room,now,id,id,online,online,room,clink?.id??null,id,id);
}

function clinkOutcome(request,event,id,now){
  if(!event)return "unavailable";
  const {action,target}=request;
  if(action==="invite"&&event.from===id&&event.to===target&&
    (event.state==="active"||event.state==="pending"&&event.expires>now))return "invited";
  if(action==="accept"&&event.to===id&&event.state==="active")return "accepted";
  if(action==="decline"&&event.to===id&&event.state==="declined")return "declined";
  if(action==="cancel"&&event.from===id&&event.state==="cancelled")return "cancelled";
  return "unavailable";
}

export function socialPayload(row,{id,now,show,clink,avatar}){
  const fountainShow=JSON.parse(row.fountainShow),clinks=JSON.parse(row.clinks);
  const social=show||clink?{}:undefined;
  if(show){
    const atFountain=Math.hypot(avatar.x-plazaShowSpot.x,avatar.y-plazaShowSpot.y)<=PLAZA_SHOW_REACH;
    social.show=row.showRecognized?"started":fountainShow&&atFountain&&!avatar.bus&&!isCycling(avatar)?"busy":"unavailable";
  }
  if(clink)social.clink=clinkOutcome(clink,JSON.parse(row.requestedClink),id,now);
  return {fountainShow,clinks,social};
}
