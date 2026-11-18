import {ARCADE_GAMES} from "./arcade-layout.js";
import {BRICK_MASK,BRICK_PADDLE,CLASSIC_BRICKS,CLASSIC_FIELDS,CLASSIC_RADII,HOCKEY_GOAL,HOCKEY_MALLET,PIN_BUMPERS,PIN_DRAIN,PIN_FLIPPERS} from "./arcade-classics.js";
import {standSign} from "./regional-stands.js";

const looks={
  pinball:{name:"핀볼",accent:0xe88937,trim:0xbb6541,field:0x483048,line:0x9573a1,ink:"#ffaa56"},
  airHockey:{name:"에어하키",accent:0x48d8db,trim:0x367c90,field:0xbedee1,line:0x377b9a,ink:"#91f2ed"},
  brickBreaker:{name:"벽돌 깨기",accent:0xf17b9e,trim:0x8e4e73,field:0x222445,line:0x494878,ink:"#ffa5ce"}
};

export function* buildClassics(T,room,{box,cylinder,shape}){
  const games=new Map();
  for(const [kind,field] of Object.entries(CLASSIC_FIELDS)){
    const {localX,localZ,width,depth}=ARCADE_GAMES[kind],look=looks[kind];
    const stage=new T.Group();stage.name=look.name;stage.position.set(localX,0,localZ);room.add(stage);
    const {x,z,top}=field,dark=0x232333,chrome=0x9095a1;
    const block=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,stage);
    const disc=(color,x,y,z,r,h,sides=24)=>cylinder(color,x,y,z,r,h,sides,stage);
    const animated=object=>{object.userData.dynamic=true;return object;};
    for(const legX of [-width*.34,width*.34])for(const legZ of [-depth*.35,depth*.35]){
      block(dark,legX,.345,legZ,.19,.69,.21);
      block(chrome,legX,.057,legZ,.28,.115,.30);
    }
    block(dark,0,.802,0,width,.37,depth);
    block(look.trim,0,.916,0,width+.045,.148,depth+.044);
    block(look.field,0,top-.055,0,x*2,.11,z*2);
    for(const side of [-1,1]){
      block(dark,side*(x+.085),top+.02,0,.172,.203,z*2+.20);
      block(look.accent,side*(x+.085),top+.112,0,.135,.024,z*2+.10);
    }
    for(const end of [-1,1]){
      const opening=kind==="airHockey"?HOCKEY_GOAL:kind==="pinball"&&end===1?PIN_DRAIN+.055:0;
      const span=x+.15-opening;
      for(const side of [-1,1]){
        block(dark,side*(opening+span/2),top+.020,end*(z+.078),span,.203,.158);
        block(look.accent,side*(opening+span/2),top+.116,end*(z+.076),span,.025,.117);
      }
      if(opening)block(chrome,0,top-.035,end*(z+.095),opening*2,.109,.225);
    }
    const signZ=-depth/2+.022;
    block(dark,0,1.48,signZ,width-.25,.56,.16);
    block(look.accent,0,1.775,signZ,width-.19,.050,.195);
    standSign(T,stage,look.name,"",width-.46,0,1.49,signZ+.094,"#2a2637",look.ink,.38);
    for(const ledX of [-width*.36,width*.36])block(look.accent,ledX,.85,depth/2+.014,.38,.035,.018);
    let parts;
    if(kind==="pinball"){
      for(const center of [-.67,0,.67])block(look.line,center,top+.003,-.18,.055,.006,2.66);
      for(const side of [-1,1]){
        const guide=block(look.accent,side*.69,top+.066,1.47,.28,.13,.78);
        guide.rotation.y=side*.25;
      }
      const bumpers=PIN_BUMPERS.map(([bx,bz],i)=>{
        disc(i%2?0xdfad52:0xb54b5b,bx,top+.044,bz,.198,.085);
        const topDisc=animated(disc(look.accent,bx,top+.104,bz,.154,.055));
        topDisc.material=topDisc.material.clone();
        return topDisc;
      });
      const flippers=PIN_FLIPPERS.map(([px,pz],i)=>{
        const hinge=new T.Group();hinge.position.set(px,top+.066,pz);hinge.userData.dynamic=true;stage.add(hinge);
        const bar=box(0xffcf79,(i?-1:1)*.23,0,0,.47,.092,.131,hinge);
        bar.userData.dynamic=true;return hinge;
      });
      parts={bumpers,flippers};
    }else if(kind==="airHockey"){
      block(look.line,0,top+.002,0,x*2,.004,.024);
      const ring=new T.RingGeometry(.45,.477,42).rotateX(-Math.PI/2);
      shape(ring,look.line,0,top+.004,0,stage);
      for(const side of [-1,1]){
        block(look.line,0,top-.009,side*(z-.13),1.22,.02,.23);
      }
      const mallets=[0xef8560,0x468ca7].map(color=>{
        const mallet=new T.Group();mallet.userData.dynamic=true;stage.add(mallet);
        for(const [y,r,h] of [[.042,HOCKEY_MALLET,.083],[.108,.121,.085]]){
          animated(cylinder(color,0,y,0,r,h,24,mallet));
        }
        return mallet;
      });
      parts={mallets};
    }else{
      for(let row=0;row<9;row++)block(look.line,0,top+.003,(row-4)*.39,x*2-.10,.006,.012);
      const bricks=CLASSIC_BRICKS.map(({x:bx,z:bz,row})=>
        animated(block([0xf177a3,0xfab35e,0x84cbc2,0x9692ef][row],bx,top+.041,bz,.302,.081,.20)));
      const paddle=animated(block(look.accent,0,top+.051,1.68,BRICK_PADDLE*2,.10,.12));
      parts={bricks,paddle};
    }
    const r=CLASSIC_RADII[kind];
    const ball=animated(kind==="airHockey"?disc(0x26303b,0,top+.034,0,r,.057):
      shape(new T.SphereGeometry(r,16,9),kind==="pinball"?0xe2eaf1:0xffe4af,0,top+r,0,stage));
    games.set(kind,{field,ball,parts});
    yield;
  }
  function draw(kind,state){
    const {field,ball,parts}=games.get(kind),{top}=field;
    const location=state?.ball??(kind==="pinball"?[.965,1.61]:kind==="airHockey"?[0,0]:[0,1.35]);
    ball.position.x=location[0];ball.position.z=location[1];
    ball.visible=state?.phase!=="finished";
    if(kind==="pinball"){
      parts.flippers.forEach((joint,i)=>{joint.rotation.y=(i?1:-1)*(.31-(state?.flippers[i]??0)*.97);});
      parts.bumpers.forEach((bumper,i)=>{
        const flash=state?.hit===i?state.flash:0;
        bumper.material.emissive.setHex(0xff792d);bumper.material.emissiveIntensity=.11+flash*1.25;
      });
    }else if(kind==="airHockey"){
      const paddles=[state?.paddle??[0,1.51],state?.rival??[0,-1.51]];
      parts.mallets.forEach((mallet,i)=>mallet.position.set(paddles[i][0],top,paddles[i][1]));
    }else{
      const mask=state?.mask??BRICK_MASK;
      parts.bricks.forEach((brick,i)=>{brick.visible=Boolean(mask&(1<<i));});
      parts.paddle.position.x=state?.paddle[0]??0;
    }
  }
  return {updateArcade(local,_now,peers){
    for(const kind of games.keys()){
      const peer=peers.filter(player=>player.arcade?.kind===kind).sort((a,b)=>(a.arcade.hockey?.joined??0)-(b.arcade.hockey?.joined??0)||a.id.localeCompare(b.id))[0];
      draw(kind,local?.kind===kind?local:peer?.arcade);
    }
  }};
}
