import {beachPiano,MARKET_ANGLE} from "./beach-market-layout.js";
import {coastPoint} from "./region-coordinates.js";
import {standSign} from "./regional-stands.js";

export function addBeachMarketPiano(T,parent,kit,groundHeight){
  const {box,cylinder,wx,wz}=kit;
  const point=coastPoint(beachPiano.body);
  const root=new T.Group();
  root.name=beachPiano.name;
  root.position.set(wx(point.x),groundHeight(point),wz(point.y));
  root.rotation.y=MARKET_ANGLE;
  parent.add(root);
  const wood=0x3c2523,trim=0x704637;
  box(wood,0,.81,-.14,1.6,1.46,.42,root);
  box(trim,0,1.57,-.14,1.67,.09,.49,root);
  box(wood,0,.76,.16,1.61,.115,.35,root);
  for(const x of [-.72,.72]){
    box(trim,x,.37,.18,.10,.74,.13,root);
    box(wood,x,.07,.014,.16,.13,.58,root);
  }
  for(let key=0;key<21;key++){
    const x=(key-10)*.063;
    box(0xffefe0,x,.832,.232,.06,.024,.18,root);
    if(key<20&&![2,6].includes(key%7))box(0x231e23,x+.0315,.851,.183,.034,.026,.105,root);
  }
  for(const x of [-.079,0,.079])box(0xc99954,x,.11,.103,.039,.031,.11,root);
  standSign(T,root,"바다 피아노",null,1.10,0,1.28,.078,"#3c2523","#ffe1a4",.20);
  for(const x of [-.94,.94]){
    cylinder(wood,x,.83,-.32,.028,1.66,8,root);
    cylinder(0xffce86,x,1.74,-.32,.083,.16,10,root);
  }
}
