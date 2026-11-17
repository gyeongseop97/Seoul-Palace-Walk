import {ARCADE_AIR_HOCKEY,ARCADE_BRICK_BREAKER,ARCADE_PINBALL,ARCADE_STAIRS,ARCADE_THIRD_SITE} from "./arcade-layout.js";
import {addArcadeStairwell} from "./arcade-stairs-world.js";
import {standSign} from "./regional-stands.js";

export function* buildArcadeThird(T,parent,kit){
  const floor=ARCADE_THIRD_SITE,{wx,wz,box}=kit;
  const {insideWidth:width,insideDepth:depth}=floor;
  const room=new T.Group();
  room.name=floor.name;
  room.position.set(wx(floor.center.x),0,wz(floor.center.y));
  room.rotation.y=floor.insideAngle;
  parent.add(room);

  const wall=0x3e4757,edge=0x2d3443,trim=0x937763;
  const block=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,room);
  const cove=new T.MeshStandardMaterial({color:0xe3b995,emissive:0xe6af7b,emissiveIntensity:.48,roughness:.51});
  block(0x33343c,0,-.045,0,width,.09,depth);
  block(edge,0,4.07,0,width+.18,.18,depth+.16);
  for(const side of [-1,1]){
    block(wall,0,2,side*depth/2,width,4,.16);
    block(wall,side*width/2,2,0,.16,4,depth);
    block(trim,0,.14,side*(depth/2-.108),width-.20,.23,.10);
    block(trim,side*(width/2-.108),.14,0,.10,.23,depth-.20);
    for(let i=0;i<11;i++){
      const z=(i-5)*1.19;
      block(i%2?0x3b4350:0x4a515b,side*(width/2-.098),2.08,z,.047,2.75,1.12);
    }
    block(0x5b5964,0,3.76,side*(depth/2-.19),width-.36,.16,.26);
    block(0xe3b995,0,3.67,side*(depth/2-.195),width-.42,.035,.052).material=cove;
  }

  const games=[{game:ARCADE_PINBALL,accent:0xc79265,light:0xffd2ad},
    {game:ARCADE_AIR_HOCKEY,accent:0x70a2a6,light:0xc5f5ec},
    {game:ARCADE_BRICK_BREAKER,accent:0xa290ad,light:0xf6d5fb}];
  for(const {game,accent,light} of games){
    const {localX:x}=game;
    block(0x222b35,x,.008,-1.69,5.25,.015,6.54);
    block(accent,x,.017,1.62,5.15,.015,.042);
    for(const side of [-1,1])block(accent,x+side*2.56,.016,-1.62,.034,.015,6.50);
    block(edge,x,2.91,-depth/2+.141,5.34,.73,.14);
    standSign(T,room,game.name,"",4.49,x,2.92,-depth/2+.218,"#2b333e","#f6dfb5",.52);
    const lamp=new T.PointLight(light,12,11.5);
    lamp.position.set(x,3.64,.45);room.add(lamp);
    block(0xead0a9,x,3.92,.45,4.69,.05,.09).material=cove;
  }
  yield;
  for(let i=0;i<17;i++){
    const x=(i-8)*1.14;
    block(i%2?0x606269:0x535863,x,.012,5.13,1.09,.02,.63);
  }
  block(0x424653,0,2.84,depth/2-.14,6.65,1.02,.13);
  const welcome=new T.Group();
  welcome.position.set(0,0,depth/2-.225);
  welcome.rotation.y=Math.PI;
  room.add(welcome);
  standSign(T,welcome,"광화문 오락실 3층","핀볼 · 에어하키 · 벽돌깨기",6.17,0,2.85,0,"#3b4452","#ffdeaf",.76);
  for(const stairs of ARCADE_STAIRS[floor.id])addArcadeStairwell(T,room,kit,stairs);
  return {room};
}
