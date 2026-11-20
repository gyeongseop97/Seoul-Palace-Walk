// The Seoul feed renders room snapshots supplied by the occupied console.
// Its separate document keeps Seoul navigation and the console visitor's position independent.
try{
 const {makeWorld}=await import("./world3d.js");
 const world=makeWorld(document.getElementById("feed"),{graphics:"medium"});
 window.drawStudioFeed=state=>world.render(state,performance.now());
 window.stopStudioFeed=()=>document.querySelector("canvas")?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
}catch{window.studioFeedError=true;}
