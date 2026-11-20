import assert from "node:assert/strict";
import {bindPlayViewport} from "../public/play-viewport.js";

const viewport=Object.assign(new EventTarget(),{width:390,height:844,offsetTop:0,scale:1});
globalThis.window=Object.assign(new EventTarget(),{visualViewport:viewport,innerHeight:844});
globalThis.document={activeElement:null};
globalThis.requestAnimationFrame=setImmediate;
const chat=new EventTarget(),mobile=Object.assign(new EventTarget(),{matches:true});
const styles=new Map(),attributes=new Map();
const shell={
  style:{setProperty:styles.set.bind(styles),removeProperty:styles.delete.bind(styles)},
  toggleAttribute:attributes.set.bind(attributes),removeAttribute:attributes.delete.bind(attributes)
};
function expectViewport(height,top,keyboard){
  assert.equal(styles.get("--play-visible-height"),height+"px");
  assert.equal(styles.get("--play-visible-top"),top+"px");
  assert.equal(attributes.get("data-chat-keyboard"),keyboard);
}
async function update(target,event){
  target.dispatchEvent(new Event(event));
  await new Promise(setImmediate);
}

bindPlayViewport(shell,chat,mobile);
expectViewport(844,0,false);
document.activeElement=chat;
await update(chat,"focus");
viewport.height=475;
await update(viewport,"resize");
expectViewport(475,0,true);
viewport.offsetTop=140;
await update(viewport,"scroll");
expectViewport(475,140,true);

// The keyboard can disappear before the layout viewport regains its full height.
window.innerHeight=470;
document.activeElement=null;
await update(chat,"blur");
expectViewport(475,140,true);
Object.assign(viewport,{height:844,offsetTop:0});
await update(viewport,"resize");
expectViewport(844,0,false);

// Rotating to landscape establishes a new full height for the next keyboard.
Object.assign(viewport,{width:844,height:390});
window.innerHeight=390;
await update(window,"resize");
expectViewport(390,0,false);
document.activeElement=chat;
await update(chat,"focus");
expectViewport(390,0,false);
viewport.height=215;
await update(viewport,"resize");
expectViewport(215,0,true);
console.log("Mobile controls follow the visible viewport through keyboard open, pan, dismissal and rotation.");
