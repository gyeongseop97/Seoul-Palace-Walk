import {cleanGuestbookMessage,GUESTBOOK_LIMIT,guestbookVenues} from "../public/guestbook-data.js";
import {interiorBounds} from "../public/interior-layout.js";

const PAGE_SIZE=16;
const POST_INTERVAL=8_000;
const requestId=value=>typeof value==="string"&&/^[a-f0-9]{32}$/.test(value);
const reply=(value,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store"}});
const readyDatabases=new WeakMap();

function ensureGuestbook(db){
  let ready=readyDatabases.get(db);
  if(!ready){
    ready=db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS room_guestbook (
        room TEXT NOT NULL, venue TEXT NOT NULL, id TEXT NOT NULL, player TEXT NOT NULL,
        nickname TEXT NOT NULL, message TEXT NOT NULL, created INTEGER NOT NULL,
        PRIMARY KEY (room, venue, id)
      )`).bind(),
      db.prepare("CREATE INDEX IF NOT EXISTS room_guestbook_chronology ON room_guestbook(room,venue,created DESC,id DESC)").bind(),
      db.prepare("CREATE INDEX IF NOT EXISTS room_guestbook_player ON room_guestbook(room,player,created)").bind()
    ]).catch(error=>{readyDatabases.delete(db);throw error;});
    readyDatabases.set(db,ready);
  }
  return ready;
}

export async function handleGuestbook(db,{room,id,key,guestbook,now,active}){
  const {venue,action,before,message,request}=guestbook??{};
  const write=action==="post";
  const validVenue=typeof venue==="string"&&Object.hasOwn(guestbookVenues,venue);
  const validCursor=before==null||!write&&Number.isSafeInteger(before.created)&&before.created>0&&requestId(before.id);
  if(!key||!validVenue||(!write&&action!=="list")||(write&&!requestId(request))||!validCursor){
    return reply({error:"방명록 요청을 읽을 수 없어요."},400);
  }
  const text=write?cleanGuestbookMessage(message):"";
  if(write&&!text)return reply({error:`방명록은 1~${GUESTBOOK_LIMIT}자로 입력해 주세요.`},400);

  await ensureGuestbook(db);
  const {minX,maxX,minY,maxY}=interiorBounds[venue];
  const withinVenue=`json_extract(avatar,'$.x')>? AND json_extract(avatar,'$.x')<? AND json_extract(avatar,'$.y')>? AND json_extract(avatar,'$.y')<?`;
  const bounds=[minX,maxX,minY,maxY];
  const visitor="FROM walkers WHERE room=? AND id=? AND player_key=? AND updated>=?";
  const credentials=[room,id,key,active];
  const accessible=`SELECT 1 ${visitor} AND ${withinVenue}`;
  const operations=[db.prepare(`SELECT (${withinVenue}) AS inside ${visitor}`).bind(...bounds,...credentials)];
  if(write){
    operations.push(db.prepare(`INSERT INTO room_guestbook (room,venue,id,player,nickname,message,created)
      SELECT ?,?,?,?,COALESCE(nickname,'동행'),?,? ${visitor} AND ${withinVenue}
      AND NOT EXISTS (SELECT 1 FROM room_guestbook WHERE room=? AND player=? AND created>?)
      ON CONFLICT(room,venue,id) DO NOTHING
    `).bind(room,venue,request,id,text,now,...credentials,...bounds,room,id,now-POST_INTERVAL));
    operations.push(db.prepare("SELECT id FROM room_guestbook WHERE room=? AND venue=? AND id=? AND player=?")
      .bind(room,venue,request,id));
  }
  const cursorClause=before?"AND (created,id)<(?,?)":"";
  const cursorArgs=before?[before.created,before.id]:[];
  operations.push(db.prepare(`SELECT id,nickname,message,created FROM room_guestbook WHERE room=? AND venue=?
    ${cursorClause} AND EXISTS (${accessible}) ORDER BY created DESC,id DESC LIMIT ?
  `).bind(room,venue,...cursorArgs,...credentials,...bounds,PAGE_SIZE+1));
  const results=await db.batch(operations);
  const actor=results[0].results[0];
  if(!actor)return reply({error:"산책방에 다시 입장해 주세요."},409);
  if(!Number(actor.inside))return reply({error:"실내에 들어가 방명록 가까이에서 다시 열어 주세요."},403);
  if(write&&!results[2].results.length)return reply({error:"방명록에 글을 남겼어요. 잠시 뒤 다시 써 주세요."},429);

  const rows=results.at(-1).results;
  const entries=rows.slice(0,PAGE_SIZE);
  const next=rows.length>PAGE_SIZE?{created:entries.at(-1).created,id:entries.at(-1).id}:null;
  return reply({entries,next});
}
