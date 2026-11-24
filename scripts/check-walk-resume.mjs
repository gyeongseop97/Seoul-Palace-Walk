import assert from "node:assert/strict";
import {lastCoastRoom,rememberRegion,savedInPohang} from "../public/walk-resume.js";

const values=new Map();
const storage={
  get length(){return values.size;},key:i=>Array.from(values.keys())[i],
  getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)
};
const name="바다 산책",first="BEACH001",second="BEACH002";
const pose=JSON.stringify({x:10040,y:5910,height:0,heading:140,up:false,layout:4});
const oldKey=code=>"pohang-walk-position:v1:"+JSON.stringify([name,code]);
storage.setItem(oldKey(first),pose);
assert.equal(lastCoastRoom(storage,name),null);
assert.deepEqual(lastCoastRoom(storage,name,true),{code:first});
storage.setItem(oldKey(second),pose);
assert.equal(lastCoastRoom(storage,name,true),null);
assert.deepEqual(lastCoastRoom(storage,name,true,second),{code:second});
rememberRegion(storage,name,first,true);
assert.deepEqual(lastCoastRoom(storage,"바다   산책"),{code:first});
assert.equal(savedInPohang(storage,"다른 사람",first),false);
rememberRegion(storage,name,first,false);
assert.equal(lastCoastRoom(storage,name,true,first),null);
rememberRegion(storage,name,null,true);
assert.deepEqual(lastCoastRoom(storage,name),{code:null});
assert.equal(lastCoastRoom(storage,name,false,second),null);
console.log("Checked Pohang resume per nickname and room, existing positions and returning to Seoul.");
