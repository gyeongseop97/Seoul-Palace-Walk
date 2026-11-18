import {cleanArcadeActivity} from "./room-arcade.mjs";
import {ensureSocialTables} from "../database/social-schema.mjs";

const within=(v,lo,hi)=>Number.isFinite(v)&&v>=lo&&v<=hi;
const authenticated="SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=? AND updated>=?";
export async function exchangeMotion(db,{room,id,key,motion},now){
  if(!key||!motion||!within(motion.x,-480,2100)||!within(motion.y,-1900,1100))return null;
  const {x,y,frame}=motion,queryArgs=[room,id,key,now-15000];
  const operations=[];
  await ensureSocialTables(db);
  if(frame!=null){
    const {seq,heading,vx,vy,running,blocked,at}=frame;
    if(!Number.isSafeInteger(seq)||seq<=0||!within(at,now-5000,now+2000)||!within(heading,0,360)||
       !within(vx,-16,16)||!within(vy,-16,16)||typeof running!=="boolean"||typeof blocked!=="boolean")return null;
    const arcade=frame.arcade&&cleanArcadeActivity({x,y,arcade:frame.arcade});
    if(frame.arcade&&!arcade)return null;
    const packet=JSON.stringify({x,y,heading,vx,vy,running,blocked,at:Math.min(at,now),arcade:arcade||null});
    operations.push(db.prepare(`INSERT INTO motion_frames(room,player,seq,updated,x,y,packet)
      SELECT ?,?,?,?,?,?,? WHERE EXISTS (${authenticated})
      ON CONFLICT(room,player) DO UPDATE SET seq=excluded.seq,updated=excluded.updated,
        x=excluded.x,y=excluded.y,packet=excluded.packet WHERE excluded.seq>motion_frames.seq`)
      .bind(room,id,seq,now,x,y,packet,...queryArgs));
  }
  operations.push(db.prepare(`SELECT player,seq,packet FROM motion_frames WHERE room=? AND updated>=?
    AND player<>? AND x BETWEEN ? AND ? AND y BETWEEN ? AND ? AND EXISTS (${authenticated})
    ORDER BY (x-?)*(x-?)+(y-?)*(y-?) LIMIT 48`).bind(room,now-2500,id,x-110,x+110,y-110,y+110,...queryArgs,x,x,y,y));
  const rows=(await db.batch(operations)).at(-1).results;
  return {frames:rows.map(row=>({id:row.player,seq:row.seq,...JSON.parse(row.packet)}))};
}
