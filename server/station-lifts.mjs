import {liftBanks,liftLanding,partAt,railHeight} from "../public/station-levels.js";
import {dispatchLift} from "../public/lift-dispatch.js";

const initialized=new WeakMap();
export function ensureLiftTables(db){
  if(!initialized.has(db))initialized.set(db,db.prepare(`CREATE TABLE IF NOT EXISTS station_lifts (
    room TEXT NOT NULL, bank TEXT NOT NULL, revision INTEGER NOT NULL, state TEXT NOT NULL,
    PRIMARY KEY(room,bank))`).bind().all().catch(e=>{initialized.delete(db);throw e;}));
  return initialized.get(db);
}
export function validLift(c){
  return /^[a-f0-9]{32}$/.test(c?.id??"")&&["call","select"].includes(c.action)&&
    liftBanks.some(b=>b.id===c.bank&&b.stops.some(s=>s.floor===c.floor));
}
function canPress(bank,c,avatar){
  const {x,y}=avatar,p=partAt(x,y);
  if(c.action==="select")return p?.style==="lift"&&Math.abs(x-bank.center.x)<=1.5&&Math.abs(y-bank.center.y)<=1.5;
  const landing=liftLanding(c.floor,bank),i=bank.stops.findIndex(s=>s.floor===c.floor);
  return p?.style==="bridge"&&Math.hypot(x-landing.x,y-landing.y)<2&&Math.abs(railHeight(x,y)-bank.levels[i])<.1;
}
export const readLifts=(db,room)=>db.prepare("SELECT bank,revision,state FROM station_lifts WHERE room=?").bind(room);
export async function roomLifts(db,room,avatar,c,now,initialRows){
  if(!partAt(avatar.x,avatar.y))return c?{liftReply:{id:c.id,ok:false}}:{};
  await ensureLiftTables(db);
  const select=()=>readLifts(db,room).all();
  let rows=initialRows??(await select()).results,reply;
  if(c){
    const bank=liftBanks.find(b=>b.id===c.bank);
    for(let i=0;i<5;i++){
      const row=rows.find(r=>r.bank===bank.id),s=row?JSON.parse(row.state):{stops:[],recent:[]};
      if(s.recent.includes(c.id)){reply={id:c.id,ok:true};break;}
      if(!canPress(bank,c,avatar)){reply={id:c.id,ok:false};break;}
      const state=JSON.stringify({stops:dispatchLift(bank,s.stops,c.floor,now),recent:[...s.recent.slice(-63),c.id]});
      const saved=await db.prepare(`INSERT INTO station_lifts(room,bank,revision,state) VALUES(?,?,1,?)
        ON CONFLICT(room,bank) DO UPDATE SET revision=revision+1,state=excluded.state WHERE station_lifts.revision=?
        RETURNING revision`).bind(room,bank.id,state,row?.revision??0).all();
      if(saved.results.length){
        rows=rows.filter(r=>r.bank!==bank.id).concat({bank:bank.id,state});reply={id:c.id,ok:true};break;
      }
      ({results:rows}=await select());
    }
  }
  return {stationLifts:Object.fromEntries(rows.map(r=>[r.bank,JSON.parse(r.state).stops])),liftReply:reply};
}
