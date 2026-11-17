import {standSign} from "./regional-stands.js";

export function addArcadeStairwell(T,parent,{box},stairs){
  const group=new T.Group();
  group.name=stairs.name;group.position.set(stairs.localX,0,stairs.localZ);parent.add(group);
  const block=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,group);
  if(stairs.up){
    for(let index=0;index<11;index++){
      const h=.16+index*.18,z=.98-index*.19;
      block(index%2?0x556269:0x5d6b71,0,h/2,z,1.47,h,.195);
      block(0xccab79,0,h+.005,z+.083,1.45,.012,.029);
    }
    for(const side of [-1,1]){
      block(0x304a50,side*.78,.88,0,.14,1.76,2.26).rotation.x=-.48;
      block(0xd1995d,side*.79,1.99,0,.071,.075,2.57).rotation.x=.73;
    }
  }else{
    block(0x253740,0,.78,.47,1.48,1.54,.12);
    block(0x518385,0,1.49,.38,1.44,.07,.16);
    for(const side of [-1,1])block(0x889489,side*.78,.56,0,.07,1.12,.87);
    block(0x162a32,0,.021,.03,1.47,.035,.96);
    for(let index=0;index<4;index++)block(0xa78b65,0,.042,index*.16-.28,1.39,.015,.022);
  }
  standSign(T,group,stairs.up?"2층 ↑":"1층 ↓",stairs.up?"사격 · 양궁 · 스크린 야구":"볼링 · 농구 · 출구",
    2.04,0,2.94,-.17,"#234750","#ffe6ae",.43);
}
