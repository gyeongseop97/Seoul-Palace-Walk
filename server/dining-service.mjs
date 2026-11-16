import {ITEMS} from "../public/activities.js";
import {DINING_SERVICE_SPEED,diningServiceRoute,diningTables,diningVenues} from "../public/dining-data.js";

const venues=new Map(diningVenues.map(venue=>[venue.id,venue]));
const readyDatabases=new WeakMap();
const orderWait=18000,kioskWait=90000,prepareTime=3600;
const counterActions=new Set(["counter","kiosk"]);
const dishActions=new Set(["counter","kiosk","order"]);
const busyPhases=new Set(["summoned","ordering","cooking","serving","clearing","returning"]);
const token=value=>typeof value==="string"&&/^[a-f0-9]{32}$/.test(value);

export const isDiningVenue=id=>venues.has(id);
export function validDiningCommand(action){
  const venue=venues.get(action?.venue);
  if(!venue||action.request!==undefined&&!token(action.request))return false;
  if(action.action==="bite")return token(action.request);
  if(action.action==="bell")return venue.service==="staff";
  if(!dishActions.has(action.action)||!venue.dishes.some(dish=>dish.kind===action.kind)||!ITEMS[action.kind]?.meal)return false;
  return action.action==="kiosk"?venue.service==="robot":venue.service==="staff";
}

export function ensureDiningService(db){
  let ready=readyDatabases.get(db);
  if(!ready){
    ready=db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS room_dining_service (
        room TEXT NOT NULL, venue TEXT NOT NULL, version INTEGER NOT NULL,
        tickets TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY (room,venue)
      )`).bind(),
      db.prepare("CREATE INDEX IF NOT EXISTS room_dining_service_updated ON room_dining_service(updated)").bind()
    ]).catch(error=>{readyDatabases.delete(db);throw error;});
    readyDatabases.set(db,ready);
  }
  return ready;
}

export function selectDiningService(db,room,venue){
  return db.prepare("SELECT version,tickets FROM room_dining_service WHERE room=? AND venue=?").bind(room,venue);
}
export function pruneDiningService(db,now){
  return db.prepare("DELETE FROM room_dining_service WHERE updated<?").bind(now-86400000);
}

const atVenue=(a,{minX,maxX,minY,maxY})=>a&&a.x>minX&&a.x<maxX&&a.y>minY&&a.y<maxY;
const sameSlot=(a,b)=>Boolean(a&&b&&a.index===b.index&&a.side===b.side);
const sameSeat=(a,b)=>sameSlot(a,b)&&a.seat===b.seat;
const near=(p,x,y)=>Math.hypot(p.x-x,p.y-y);

function findSeat(avatar,venue){
  if(!atVenue(avatar,venue.bounds)||!Number.isInteger(avatar.seat)||avatar.bus||avatar.bikeRide||avatar.bike&&!avatar.bike.parked)return null;
  const side=avatar.seatSide??0;
  for(const [index,table] of diningTables.entries()){
    const chair=table.chairs[side];
    if(!chair)continue;
    const x=venue.center.x+table.x,y=venue.center.y+table.z;
    if(near(avatar,x+chair.side*2.56,y)>.76&&near(avatar,venue.center.x+chair.x,y)>.52)continue;
    return {x,y,side:chair.side,index,seat:avatar.seat};
  }
  return null;
}

function travelTime({table},venue){
  return Math.ceil(diningServiceRoute(table,venue).length/DINING_SERVICE_SPEED*1000);
}

function setPhase(ticket,phase,now,duration=null){
  ticket.phase=phase;ticket.phaseAt=now;ticket.phaseUntil=duration==null?null:now+duration;
}
const occupied=(tickets,table,except)=>tickets.some(ticket=>ticket!==except&&sameSlot(ticket.table,table)&&ticket.phase!=="returning");

function progressTickets(tickets,venue,players,now){
  return tickets.filter(ticket=>{
    const avatar=players.get(ticket.player),present=atVenue(avatar,venue.bounds),currentSeat=findSeat(avatar,venue);
    const seated=sameSeat(ticket.table,currentSeat),due=ticket.phaseUntil!==null&&now>=ticket.phaseUntil;
    switch(ticket.phase){
      case "queued":
        if(!present||now-ticket.phaseAt>=kioskWait)return false;
        return Boolean(ticket.kind)||seated;
      case "carrying":
        if(!present)return false;
        if(currentSeat&&!occupied(tickets,currentSeat,ticket)){
          ticket.table=currentSeat;setPhase(ticket,"served",now);
        }
        return true;
      case "summoned":
        if(due)setPhase(ticket,seated?"ordering":"returning",now,seated?orderWait:travelTime(ticket,venue));
        return true;
      case "ordering":
        if(due||!seated)setPhase(ticket,"returning",now,travelTime(ticket,venue));
        return true;
      case "cooking":
        if(due){
          if(!seated)return false;
          setPhase(ticket,"serving",now,travelTime(ticket,venue));
        }
        return true;
      case "serving":
        if(due)setPhase(ticket,"served",now,travelTime(ticket,venue));
        return true;
      case "served":
        if(due)ticket.phaseUntil=null;
        if(seated){ticket.leftAt=null;return true;}
        ticket.leftAt??=now;
        if(ticket.phaseUntil===null&&now>=ticket.leftAt+(ticket.remaining===0?950:7000)&&
          now>=ticket.ateAt+ITEMS[ticket.kind].duration)setPhase(ticket,"clearQueued",now);
        return true;
      case "clearQueued":
        if(seated&&ticket.remaining>0){ticket.leftAt=null;setPhase(ticket,"served",now);}
        return true;
      case "clearing":
        if(due)setPhase(ticket,"returning",now,travelTime(ticket,venue));
        return true;
      case "returning":return !due;
      default:return false;
    }
  });
}

function startNextService(tickets,venue,players,now){
  if(tickets.some(ticket=>busyPhases.has(ticket.phase)||ticket.phase==="served"&&ticket.phaseUntil!==null))return;
  const pending=tickets.filter(ticket=>ticket.phase==="queued"||ticket.phase==="clearQueued")
    .sort((a,b)=>a.phaseAt-b.phaseAt);
  for(const ticket of pending){
    if(ticket.phase==="clearQueued"){
      setPhase(ticket,"clearing",now,travelTime(ticket,venue));
      return;
    }
    if(!ticket.kind){
      setPhase(ticket,"summoned",now,travelTime(ticket,venue));
      return;
    }
    const table=findSeat(players.get(ticket.player),venue);
    if(table&&!occupied(tickets,table,ticket)){
      ticket.table=table;setPhase(ticket,"cooking",now,prepareTime);
      return;
    }
  }
}

const initialResult={bell:"summoned",kiosk:"queued",counter:"pickedUp"};
function orderRequest(tickets,context){
  const {venue,id,command,players,now}=context;
  if(!command)return null;
  const own=tickets.find(ticket=>ticket.player===id),avatar=players.get(id);
  if(!atVenue(avatar,venue.bounds))return "unavailable";
  const table=findSeat(avatar,venue);
  switch(command.action){
    case "bell":case "kiosk":case "counter":{
      const {action}=command,standing=counterActions.has(action);
      if(own)return command.request&&command.request===own.id?initialResult[action]:"unavailable";
      if(command.request&&tickets.some(ticket=>ticket.id===command.request))return "unavailable";
      if(standing){
        const point=action==="kiosk"?venue.kioskPoint:venue.menuPoint;
        if(!point||avatar.seat!=null||near(avatar,point.x,point.y)>2.85)return "unavailable";
      }else if(!table||occupied(tickets,table,null))return "unavailable";
      const kind=standing?command.kind:null;
      tickets.push({id:command.request??crypto.randomUUID().replaceAll("-",""),player:id,venue:venue.id,kind,
        phase:action==="counter"?"carrying":"queued",table:standing?null:table,phaseAt:now,phaseUntil:null,
        remaining:kind?ITEMS[kind].uses:0,ateAt:0});
      return initialResult[action];
    }
    case "order":
      if(own?.orderRequest&&own.orderRequest===command.request)return "ordered";
      if(own?.phase!=="ordering"||!sameSeat(own.table,table))return "unavailable";
      own.kind=command.kind;own.remaining=ITEMS[own.kind].uses;own.orderRequest=command.request;
      setPhase(own,"cooking",now,travelTime(own,venue)+prepareTime);
      return "ordered";
    case "bite":
      if(own?.biteRequests?.includes(command.request))return "bitten";
      if(own?.phase!=="served"||!sameSeat(own.table,table)||own.remaining<=0||now-own.ateAt<ITEMS[own.kind].duration)return "unavailable";
      own.remaining--;own.ateAt=now;(own.biteRequests??=[]).push(command.request);
      return "bitten";
    default:return "unavailable";
  }
}

function publicTicket({id,player,venue,kind,phase,table,phaseAt,phaseUntil,remaining,ateAt}){
  return {id,player,venue,kind,phase,table,phaseAt,phaseUntil,remaining,ateAt};
}

export async function diningService(db,{room,id,key,venueId,command,players,now,active,state}){
  const venue=venues.get(venueId),lifetime=now-active;
  if(!atVenue(players.get(id),venue.bounds)&&!state)return {self:null,tickets:[],result:command?"unavailable":null};
  for(let attempt=0;attempt<4;attempt++){
    const current=state?.tickets??"[]";
    const tickets=progressTickets(JSON.parse(current),venue,players,now);
    const result=orderRequest(tickets,{venue,id,command,players,now});
    startNextService(tickets,venue,players,now);
    const next=JSON.stringify(tickets);
    if(current!==next){
      const [write]=await db.batch([db.prepare(`
        INSERT INTO room_dining_service(room,venue,version,tickets,updated)
        SELECT ?,?,1,?,? WHERE EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=? AND updated>=?)
        ON CONFLICT(room,venue) DO UPDATE SET version=room_dining_service.version+1,tickets=excluded.tickets,updated=excluded.updated
        WHERE room_dining_service.version=? RETURNING version
      `).bind(room,venue.id,next,now,room,id,key,now-lifetime,state?.version??0)]);
      if(!write.results.length){
        // Another diner advanced the venue. Pair the latest state with fresh
        // poses so an older poll cannot cancel the other diner's reservation.
        now=Math.max(now,Date.now());
        const [retry,walkers]=await db.batch([selectDiningService(db,room,venue.id),
          db.prepare("SELECT id,avatar FROM walkers WHERE room=? AND updated>=?").bind(room,now-lifetime)]);
        state=retry.results[0];
        players=new Map(walkers.results.map(row=>[row.id,JSON.parse(row.avatar)]));
        continue;
      }
    }
    const visible=tickets.map(publicTicket);
    return {self:visible.find(ticket=>ticket.player===id)??null,tickets:atVenue(players.get(id),venue.bounds)?visible:[],result};
  }
  const visible=JSON.parse(state?.tickets??"[]").map(publicTicket);
  return {self:visible.find(ticket=>ticket.player===id)??null,tickets:atVenue(players.get(id),venue.bounds)?visible:[],result:command?"unavailable":null};
}
