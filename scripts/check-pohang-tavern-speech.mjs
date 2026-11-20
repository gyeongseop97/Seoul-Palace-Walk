import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {coastRequest} from "../server/pohang.mjs";
import {readTavernSpeech,tavernReply,menuTicket} from "../public/tavern-speech.js";
import {tavernTables} from "../public/coast-tavern-layout.js";

for(const call of ["이모","이모님!","사장님","저기요","여기요~"])assert.deepEqual(readTavernSpeech(call),{call:true});
for(const text of ["회 2접시, 소주 3병, 조개 3개","모둠회 두 접시랑 소주 세 병하고 조개 세 개 주세요","회2접시소주3병조개3개"]){
 assert.deepEqual(readTavernSpeech(text).order.portions,{soju:12,sashimi:6,grilledClam:3});
}
assert.equal(readTavernSpeech("조개 두 바구니 주세요").order.portions.grilledClam,6);
assert.equal(readTavernSpeech("조개 열두 개요").order.portions.grilledClam,12);
assert.equal(menuTicket({grilledClam:2}).portions.grilledClam,6);
for(const text of ["회 2접시와 맥주 1병 주세요","소주 2.5병","조개 세 병","회 0접시","여기요, 조개 28개"])assert(readTavernSpeech(text).error);
assert.equal(readTavernSpeech("오늘 바다 예쁘다"),null);
assert.equal(readTavernSpeech("회 좋아해?"),null);
const client=createClient({url:"file::memory:"}),db=adaptDatabase(client),room="a".repeat(32),key="f".repeat(32);
const a="b".repeat(32),b="c".repeat(32),t=1_000_000;
async function ask(id,time,table,action,extra={}){
 const pose={...tavernTables[table].seats[id===a?0:1],mode:action==="sit"?"walk":"table",yaw:0};
 const response=await coastRequest(db,{room,id,key,coast:{pose,action,table,...extra}},time);
 assert.equal(response.status,200);return (await response.json()).tavernOrders.find(row=>row.spot===table);
}
const say=(id,time,table,text,called,token=randomUUID())=>ask(id,time,table,"talkTavern",{text,called,token});
try{
 await initializeDatabase(client);
 for(const id of [a,b])await db.prepare("INSERT INTO walkers(room,id,updated,avatar,view,player_key,nickname,coat) VALUES(?,?,0,'{}','{}',?,?,123)").bind(room,id,key,id[0]).all();
 assert.equal(await say(a,t,0,"여기요",0),undefined,"standing diner cannot summon staff");
 for(const id of [a,b])await ask(id,t,0,"sit",{seat:id===a?0:1});
 assert.equal(await say(a,t,1,"여기요",0),undefined,"a different table cannot be called");
 const call=await say(a,t,0,"사장님!",0);
 assert.match(tavernReply(call,t),/갈게요/);
 const greeting=await ask(b,t+2650,0);
 assert.match(tavernReply(greeting,t+2650),/뭐 드릴까요/);
 const sample="회 2접시, 소주 3병, 조개 3개",nonce=randomUUID();
 const bad=await say(a,t+2700,0,"회 2접시, 맥주 3병 주세요",t);
 assert.equal(bad.ordered,0);
 const reply=await say(a,t+2750,0,sample,t,nonce);
 assert.equal(reply.phase,"cooking");
 assert.match(tavernReply(reply,t+2750),/회 2접시, 소주 3병, 조개 3개/);
 assert.equal((await say(b,t+2800,0,"소주 한 병",t)).summary,reply.summary);
 const delivery=await ask(b,t+11100,0);
 assert.deepEqual([delivery.soju,delivery.sashimi,delivery.rawClams],[12,6,3]);
 assert.match(tavernReply(delivery,t+11100),/맛있게/);
 assert.equal((await say(a,t+11200,0,sample,t,nonce)).ordered,reply.ordered);
 const combo="이모, 조개 두 바구니 주세요",comboId=randomUUID(),next=t+12000;
 const arriving=await say(b,next,0,combo,t,comboId);
 assert.equal(arriving.phase,"called");
 assert.equal((await ask(a,next+2750,0)).phase,"ordering");
 const later=await ask(a,next+13000,0);
 assert.equal(later.phase,"served");
 assert.equal(later.rawClams,9,"two baskets add six clams to the three already served");
 assert.equal((await say(b,next+13100,0,combo,t,comboId)).called,next);
 console.log("Seated diners call, order in Korean, hear shared replies and receive exact quantities once.");
}finally{client.close();}
