import {inCoastSpace} from "./region-coordinates.js";

const nameKey=name=>name.normalize("NFC").trim().replace(/\s+/g," ");
const roomKey=(name,code)=>"palace-coast-room:v1:"+JSON.stringify([nameKey(name),code||"open"]);
const lastKey=name=>"palace-last-coast-room:v1:"+nameKey(name);
const positionPrefix="pohang-walk-position:v1:";

// Only the destination and invitation code survive closing the tab. A new
// visit still uses the normal room admission and gets its own player key.
export function rememberRegion(storage,name,code,pohang){
  try{
    if(pohang){
      storage.setItem(roomKey(name,code),"pohang");
      storage.setItem(lastKey(name),JSON.stringify({code:code||null}));
    }else{
      if(storage.getItem(positionPrefix+JSON.stringify([nameKey(name),code||"open"])))storage.setItem(roomKey(name,code),"seoul");
      else storage.removeItem(roomKey(name,code));
      storage.removeItem(lastKey(name));
    }
  }catch{}
}
export function savedInPohang(storage,name,code){
  try{return storage.getItem(roomKey(name,code))==="pohang";}catch{return false;}
}
export function lastCoastRoom(storage,name,includeLegacy=false,invitation=""){
  try{
    const room=JSON.parse(storage.getItem(lastKey(name)));
    if(room&&(room.code===null||typeof room.code==="string"&&room.code.length>0)&&
      (!invitation||invitation===room.code)&&savedInPohang(storage,name,room.code))return room;
    // Older positions have no timestamp or last city. Offer a matching save
    // only when the player chooses to resume it explicitly.
    if(includeLegacy){
      let match=null;
      for(let i=0;i<storage.length;i++){
        const key=storage.key(i);
        if(!key?.startsWith(positionPrefix))continue;
        let parts,pose;
        try{parts=JSON.parse(key.slice(positionPrefix.length));pose=JSON.parse(storage.getItem(key));}catch{continue;}
        if(!Array.isArray(parts)||parts[0]!==nameKey(name)||typeof parts[1]!=="string"||
          (invitation&&parts[1]!==invitation)||!inCoastSpace(pose)||![pose.heading,pose.height].every(Number.isFinite))continue;
        const code=parts[1]==="open"?null:parts[1];
        if(storage.getItem(roomKey(name,code)))continue;
        if(match)return null;
        match={code};
      }
      return match;
    }
  }catch{}
  return null;
}
