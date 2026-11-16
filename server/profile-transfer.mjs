import {DatabaseConfigurationError,getTursoDatabase} from "./database.mjs";
import {GITHUB_PAGES_ORIGIN} from "../public/hosting.js";
import {PHOTO_CHUNK_BYTES,normalizeContinueCode} from "../public/profile-transfer.js";
import {cleanPassport} from "../public/passport-state.js";
import {HEADWEAR,KEEPSAKES} from "../public/wearable-options.js";
import {LOOK_DEFAULTS,LOOK_OPTIONS} from "../public/look-options.js";

const schema=[
  `CREATE TABLE IF NOT EXISTS walk_profiles (
    code_hash TEXT PRIMARY KEY, upload_hash TEXT NOT NULL, created INTEGER NOT NULL,
    profile TEXT NOT NULL, photos TEXT NOT NULL, parts INTEGER NOT NULL, ready INTEGER NOT NULL DEFAULT 0
  )`,
  "CREATE INDEX IF NOT EXISTS walk_profiles_uploads ON walk_profiles(ready,created)",
  `CREATE TABLE IF NOT EXISTS walk_profile_photos (
    code_hash TEXT NOT NULL, id TEXT NOT NULL, part INTEGER NOT NULL, data TEXT NOT NULL,
    PRIMARY KEY(code_hash,id,part)
  )`
];
const initialized=new WeakMap();
function ensure(db){
  let pending=initialized.get(db);
  if(!pending){
    pending=db.batch(schema.map(sql=>db.prepare(sql).bind())).catch(error=>{initialized.delete(db);throw error;});
    initialized.set(db,pending);
  }
  return pending;
}
const photoId=/^[a-zA-Z0-9-]{1,80}$/,tokenPattern=/^[a-f0-9]{32}$/;
const allowedImages=new Set(["image/jpeg","image/webp","image/png"]);
const text=(value,length)=>typeof value==="string"?[...value.normalize("NFC").replace(/[\p{Cc}\p{Bidi_Control}]/gu,"").trim()].slice(0,length).join(""):"";
const integer=(value,min=0)=>Number.isSafeInteger(value)&&value>=min;
const partsFor=size=>Math.ceil(size/PHOTO_CHUNK_BYTES);
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),value=>value.toString(16).padStart(2,"0")).join("");
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))),
  byte=>byte.toString(16).padStart(2,"0")).join("");
const json=(value,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store"}});
const error=(message,status=400)=>json({error:message},status);
const missing=()=>error("이어하기 코드를 찾을 수 없어요.",404);

function cleanProfile(value){
  const nickname=text(value?.nickname,16),character=value?.character,look=value?.look;
  if(!nickname||!["man","woman"].includes(character)||!LOOK_OPTIONS.hair.includes(look?.hair)||
    !LOOK_OPTIONS.eyes.includes(look.eyes)||!LOOK_OPTIONS.outfit.includes(look.outfit))return null;
  const optional=Object.fromEntries(Object.entries(LOOK_DEFAULTS).map(([feature,fallback])=>
    [feature,LOOK_OPTIONS[feature].includes(look[feature])?look[feature]:fallback]));
  return {nickname,character,look:{hair:look.hair,eyes:look.eyes,outfit:look.outfit,...optional,
    headwear:HEADWEAR.includes(look.headwear)?look.headwear:"none",keepsake:KEEPSAKES.includes(look.keepsake)?look.keepsake:"none"},
    progress:cleanPassport(value.progress)};
}
function cleanPhotos(value){
  if(!Array.isArray(value))return null;
  const seen=new Set(),photos=[];
  for(const photo of value){
    if(!photo||typeof photo.id!=="string"||!photoId.test(photo.id)||seen.has(photo.id)||!integer(photo.date)||
      !integer(photo.size,1)||!allowedImages.has(photo.mime))return null;
    seen.add(photo.id);
    photos.push({id:photo.id,date:photo.date,place:text(photo.place,80),mode:text(photo.mode,20),size:photo.size,mime:photo.mime});
  }
  return photos;
}
async function create(db,body){
  const profile=cleanProfile(body.profile),photos=cleanPhotos(body.photos);
  if(!profile||!photos)return error("닉네임, 복장 또는 사진 기록을 읽을 수 없어요.");
  const code=token(),uploadKey=token(),[codeHash,uploadHash]=await Promise.all([hash(code),hash(uploadKey)]);
  const now=Date.now(),cutoff=now-86400000,parts=photos.reduce((total,photo)=>total+partsFor(photo.size),0);
  await db.batch([
    db.prepare("DELETE FROM walk_profile_photos WHERE code_hash IN (SELECT code_hash FROM walk_profiles WHERE ready=0 AND created<?)").bind(cutoff),
    db.prepare("DELETE FROM walk_profiles WHERE ready=0 AND created<?").bind(cutoff),
    db.prepare("INSERT INTO walk_profiles(code_hash,upload_hash,created,profile,photos,parts) VALUES(?,?,?,?,?,?)")
      .bind(codeHash,uploadHash,now,JSON.stringify(profile),JSON.stringify(photos),parts)
  ]);
  return json({code,uploadKey});
}
async function transfer(db,body){
  if(body.action==="create")return create(db,body);
  const code=normalizeContinueCode(body.code);
  if(!tokenPattern.test(code))return error("이어하기 코드 32자리를 확인해 주세요.");
  const codeHash=await hash(code),writing=body.action==="upload"||body.action==="finish";
  if(writing&&(typeof body.uploadKey!=="string"||!tokenPattern.test(body.uploadKey)))return missing();
  const uploadHash=writing?await hash(body.uploadKey):null;
  if(body.action==="finish"){
    const {results}=await db.prepare(`UPDATE walk_profiles SET ready=1 WHERE code_hash=? AND upload_hash=?
      AND parts=(SELECT COUNT(*) FROM walk_profile_photos WHERE code_hash=?) RETURNING ready`)
      .bind(codeHash,uploadHash,codeHash).all();
    return results.length?json({ok:true}):error("사진 전송이 끝나지 않았어요.",409);
  }
  const {results}=await db.prepare(`SELECT profile,photos,ready FROM walk_profiles WHERE code_hash=?
    AND (${writing?"upload_hash=?":"ready=1"})`).bind(...(writing?[codeHash,uploadHash]:[codeHash])).all();
  const row=results[0];
  if(!row)return missing();
  const photos=JSON.parse(row.photos);
  if(body.action==="read")return json({profile:JSON.parse(row.profile),photos});
  const photo=photos.find(item=>item.id===body.id),part=body.part;
  if(!photo||!integer(part)||part>=partsFor(photo.size))return error("사진 조각을 찾을 수 없어요.",404);
  if(body.action==="download"){
    const {results}=await db.prepare("SELECT data FROM walk_profile_photos WHERE code_hash=? AND id=? AND part=?")
      .bind(codeHash,photo.id,part).all();
    return results.length?json(results[0]):error("사진 조각을 찾을 수 없어요.",404);
  }
  const length=Math.min(PHOTO_CHUNK_BYTES,photo.size-part*PHOTO_CHUNK_BYTES),data=body.data;
  if(typeof data!=="string"||data.length!==Math.ceil(length/3)*4||!/^[A-Za-z0-9+/]+={0,2}$/.test(data)||
    Buffer.from(data,"base64").length!==length)return error("사진 조각을 읽을 수 없어요.");
  const [,saved]=await db.batch([
    db.prepare(`INSERT OR IGNORE INTO walk_profile_photos(code_hash,id,part,data)
      SELECT ?,?,?,? FROM walk_profiles WHERE code_hash=? AND upload_hash=? AND ready=0`)
      .bind(codeHash,photo.id,part,data,codeHash,uploadHash),
    db.prepare("SELECT data=? AS matches FROM walk_profile_photos WHERE code_hash=? AND id=? AND part=?")
      .bind(data,codeHash,photo.id,part)
  ]);
  return saved.results[0]?.matches?json({ok:true}):error("사진 조각을 저장할 수 없어요.",409);
}

export async function handleProfileRequest(request,getDatabase=getTursoDatabase){
  const origin=request.headers.get("Origin"),fromPages=origin===GITHUB_PAGES_ORIGIN;
  const cors=new Headers({"Vary":"Origin","Cache-Control":"no-store"});
  if(fromPages)cors.set("Access-Control-Allow-Origin",GITHUB_PAGES_ORIGIN);
  if(request.method==="OPTIONS"){
    cors.set("Vary","Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
    const headers=(request.headers.get("Access-Control-Request-Headers")??"").split(/\s*,\s*/).filter(Boolean);
    if(!fromPages||request.headers.get("Access-Control-Request-Method")!=="POST"||headers.some(value=>value.toLowerCase()!=="content-type"))
      return new Response(null,{status:403,headers:cors});
    cors.set("Access-Control-Allow-Methods","POST, OPTIONS");cors.set("Access-Control-Allow-Headers","Content-Type");
    cors.set("Access-Control-Max-Age","86400");return new Response(null,{status:204,headers:cors});
  }
  let response;
  try{
    if(origin&&origin!==new URL(request.url).origin&&!fromPages)response=error("이 사이트에서 다시 시도해 주세요.",403);
    else if(request.method!=="POST")response=error("지원하지 않는 요청이에요.",405);
    else{
      const raw=await request.text();
      if(raw.length>1_500_000)response=error("전송할 기록이 너무 커요.",413);
      else{
        let body;
        try{body=JSON.parse(raw);}catch{}
        if(!["create","upload","finish","read","download"].includes(body?.action))response=error("이어하기 요청을 읽을 수 없어요.");
        else{const db=getDatabase();await ensure(db);response=await transfer(db,body);}
      }
    }
  }catch(failure){
    const configuration=failure instanceof DatabaseConfigurationError;
    if(!configuration)console.error("Profile transfer failed",failure.code??failure.name);
    response=error(configuration?failure.message:"이어하기 서버에 연결하지 못했어요. 다시 시도해 주세요.",configuration?503:500);
  }
  for(const [key,value] of response.headers)cors.set(key,value);
  return new Response(response.body,{status:response.status,headers:cors});
}
