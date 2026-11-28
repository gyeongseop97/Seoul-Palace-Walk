import {breaststroke,swimSeed,swimStroke} from "./beach-swimming.js";
import {inSwimmingDepth,playerWater} from "./california-beach-play.js";
import {inCaliforniaBeach} from "./california-beach-layout.js";
import {localGyeongju} from "./region-coordinates.js";
export function createBeachBathers(T,kit){
  const worldPoint=new T.Vector3(),{box,shape}=kit;
  const ring=new T.TorusGeometry(.52,.145,10,36).rotateX(-Math.PI/2);
  const stripe=new T.TorusGeometry(.53,.15,9,7,Math.PI/6).rotateX(-Math.PI/2);
  const handle=new T.TorusGeometry(.092,.021,6,14,Math.PI);
  const ripple=new T.TorusGeometry(.91,.014,5,44).rotateX(-Math.PI/2);
  const pearl=new T.SphereGeometry(1,7,5);
  function vest(model){
    const g=new T.Group();model.garb.add(g);g.name="구명재킷";
    const safety=0xee8c38,trim=0xffbc58;
    for(const s of [-1,1]){
      const front=box(safety,s*.130,.177,.192,.222,.45,.12,g);front.rotation.z=s*.076;
      box(trim,s*.143,.30,.255,.130,.049,.022,g);
      box(0x3f5661,s*.138,.11,.255,.232,.044,.026,g);
      box(safety,s*.141,.339,0,.145,.073,.30,g);
    }
    box(safety,0,.17,-.159,.449,.434,.09,g);box(0x3f5661,0,.115,-.215,.431,.047,.029,g);
    return g;
  }
  function tube(model){
    const g=new T.Group();model.group.add(g);g.name="유수풀 튜브";
    shape(ring,0xeaaa45,0,0,0,g);
    for(let i=0;i<6;i++)shape(stripe,0xffefbd,0,.004,0,g).rotation.y=i*Math.PI/3;
    for(const s of [-1,1])shape(handle,0x346a77,s*.53,.115,0,g).rotation.y=Math.PI/2;
    return g;
  }
  function spray(model){
    const g=new T.Group();model.group.add(g);
    const ring=shape(ripple,0xc8faf7,0,0,0,g);
    const drops=Array.from({length:12},()=>shape(pearl,0xc9f5f5,0,0,0,g));
    return {g,ring,drops};
  }
  function pose(player,model,clock,seatStyle){
    const q=localGyeongju(player),inside=inCaliforniaBeach(q);
    if(!inside&&!model.beachVisited)return;
    const wet=inside&&!seatStyle?playerWater(player,clock):null,deep=inSwimmingDepth(wet),tubing=wet?.kind==="river";
    const jacket=inside&&(player.beachGear?.vest||deep||tubing||seatStyle==="tube");
    if(jacket)model.beachVest??=vest(model);
    if(model.beachVest)model.beachVest.visible=Boolean(jacket);
    if(tubing)model.beachTube??=tube(model);
    if(model.beachTube)model.beachTube.visible=Boolean(tubing);
    if(deep){
      const stroke=swimStroke(clock/1000,player.stepping,swimSeed(player),player.running,model.swimStroke);
      model.swimStroke=stroke;breaststroke(model,stroke);
      model.face.getWorldPosition(worldPoint);
      model.group.position.y+=wet.level+(stroke.idle?.25:.16+.13*stroke.breath)-worldPoint.y;
      if(model.label)model.label.position.y=wet.level+.95-model.group.position.y;
    }else{
      if(model.beachSwimming){model.body.position.z=0;model.body.rotation.x=0;}
      model.swimStroke=null;
      if(tubing){model.group.position.y=wet.level-.40;model.beachTube.position.y=.48;}
    }
    if(seatStyle==="bodySlide"){
      model.body.rotation.x=-.75;
      for(let i=0;i<2;i++){const side=i?1:-1;
        model.legs[i].upper.rotation.set(-.86,0,side*.06);model.legs[i].lower.rotation.set(.12,0,0);
        model.arms[i].upper.rotation.set(-.66,0,side*.52);model.arms[i].lower.rotation.set(-1.14,0,0);
      }
    }
    const age=(clock-(player.beachSplash??0))/1000;
    if(wet&&age>=0&&age<1.2){
      const fx=model.beachSpray??=spray(model);fx.g.visible=true;fx.g.position.y=wet.level-model.group.position.y+.02;
      fx.ring.scale.setScalar(.17+age*1.2);fx.ring.visible=age<.95;
      fx.drops.forEach((d,i)=>{
        const phase=i*2.4,r=age*(.6+i%4*.23);
        const h=.12+age*(2.25+i%3*.36)-3.94*age*age;
        d.visible=h>0;d.position.set(Math.cos(phase)*r,h,Math.sin(phase)*r);
        d.scale.set(.032,.078,.032);
      });
    }else if(model.beachSpray)model.beachSpray.g.visible=false;
    if(wet)model.shadow.visible=false;
    model.beachVisited=inside;model.beachSwimming=deep||seatStyle==="bodySlide";
  }
  return pose;
}
