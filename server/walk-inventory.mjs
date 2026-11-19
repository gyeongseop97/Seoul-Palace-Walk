import {inventoryAction} from "../public/walk-inventory.js";
import {ARCADE_CLAW} from "../public/arcade-layout.js";
import {regionalStations,streetCounters} from "../public/street-stands.js";
import {railCounters,plazaCafe} from "../public/rail-station-layout.js";
const counters=[...regionalStations,...streetCounters,...railCounters,plazaCafe];
const actions=new Set(["store","hold","give","prize","wear","remove","collect"]);
const token=v=>typeof v==="string"&&/^[a-f0-9]{32}$/.test(v);
export const validInventory=(c,id)=>c&&actions.has(c.action)&&token(c.id)&&typeof c.kind==="string"&&c.kind.length<60&&
  (c.action!=="give"||token(c.to)&&c.to!==id);

export async function applyInventory(db,{room,id,key,now,cmd,rows}){
  const readReceipt=()=>db.prepare("SELECT 1 AS done FROM bag_receipts WHERE room=? AND player=? AND request=?").bind(room,id,cmd.id);
  if((await readReceipt().all()).results.length)return {id:cmd.id,ok:true};
  const own=rows.find(row=>row.id===id&&row.player_key===key),other=cmd.action==="give"&&rows.find(row=>row.id===cmd.to&&row.updated>=now-9000);
  if(!own)return {id:cmd.id,error:"산책방에 다시 들어와 주세요."};
  const a=JSON.parse(own.avatar),b=other&&JSON.parse(other.avatar);
  if(cmd.action==="collect"&&(a.bus||a.bikeRide||a.seat!=null||!counters.some(s=>s.kind===cmd.kind&&(s.up==null||Boolean(a.up)===s.up)&&Math.hypot(s.x-a.x,s.y-a.y)<2.65)))
    return {id:cmd.id,error:"매장 앞에서 받아 주세요."};
  if(cmd.action==="prize"&&Math.hypot(a.x-ARCADE_CLAW.x,a.y-ARCADE_CLAW.y)>ARCADE_CLAW.reach+1)
    return {id:cmd.id,error:"인형뽑기 기계 가까이에서 받아 주세요."};
  const error=inventoryAction(a,cmd,now,b);
  if(error)return {id:cmd.id,error};
  const changes=[[own,a],...(other?[[other,b]]:[])];
  const match=changes.map(()=>"(id=? AND avatar=?)").join(" OR ");
  const writes=changes.map(([row,value])=>{value.bagClaim=cmd.id;return [row.id,JSON.stringify(value)];});
  // A changed hand, vanished recipient or simultaneous gift cancels both sides.
  const result=await db.batch([
    db.prepare(`WITH ready AS MATERIALIZED (SELECT COUNT(*) AS n FROM walkers WHERE room=? AND (${match}))
      UPDATE walkers SET avatar=CASE id ${writes.map(()=>"WHEN ? THEN ?").join(" ")} ELSE avatar END
      WHERE room=? AND id IN (${writes.map(()=>"?").join(",")}) AND (SELECT n FROM ready)=?
      AND NOT EXISTS(SELECT 1 FROM bag_receipts WHERE room=? AND player=? AND request=?)`).bind(
        room,...changes.flatMap(([r])=>[r.id,r.avatar]),...writes.flat(),room,...writes.map(([i])=>i),writes.length,room,id,cmd.id),
    db.prepare("INSERT OR IGNORE INTO bag_receipts(room,player,request,at) SELECT ?,?,?,? WHERE changes()=?").bind(room,id,cmd.id,now,writes.length),
    readReceipt(),
    db.prepare(`SELECT id,avatar FROM walkers WHERE room=? AND id IN (${writes.map(()=>"?").join(",")})`).bind(room,...writes.map(([i])=>i))
  ]);
  if(!result[2].results.length)return {id:cmd.id,retry:true};
  for(const [row] of changes)row.avatar=result[3].results.find(r=>r.id===row.id)?.avatar??row.avatar;
  return {id:cmd.id,ok:true};
}
