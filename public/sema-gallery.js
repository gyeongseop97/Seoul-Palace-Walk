import {semaExhibits} from "./sema-layout.js";
import {museumArtUrl} from "./museum-catalog.js";
import {standSign} from "./regional-stands.js";

export function* buildSemaGallery(T,root,{wx,wz,box},venue){
  const room=new T.Group();
  room.position.set(wx(venue.insideSpawn.x),0,wz(511));root.add(room);
  const block=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,room);
  block(0x9d8a72,0,-.06,0,24,.12,18);
  for(let i=-11;i<=11;i++)block(0x877561,i,.001,0,.012,.004,18);
  for(const side of [-1,1]){
    block(0xebe5d8,side*12,2.4,0,.28,4.8,18);
    block(0xebe5d8,0,2.4,side*9,24,4.8,.28);
    block(0x856b51,side*11.84,.13,0,.06,.26,18);
    block(0x856b51,0,.13,side*8.84,24,.26,.06);
    block(0x67776c,side*5.9,4.54,0,.09,.11,17.8);
  }
  block(0xf1e9d9,0,4.85,0,24,.16,18);
  block(0x4e645b,0,2.10,-8.80,4.6,2.45,.10);
  standSign(T,room,"행복을 그린 화가","르누아르 · 서소문본관 2009",4.22,0,2.16,-8.73,"#475e53","#f8e9c8",1.43);
  const exit=new T.Group();exit.position.z=8.79;exit.rotation.y=Math.PI;room.add(exit);
  box(0x624f43,0,1.26,0,2.16,2.52,.10,exit);
  standSign(T,exit,"출구",null,1.26,0,2.88,.06,"#45574c","#f3ecd7",.36);
  const loader=new T.TextureLoader();
  for(const work of semaExhibits){
    const frame=new T.Group();frame.position.set(work.x-venue.insideSpawn.x,2.10,work.y-511);frame.rotation.y=work.angle;room.add(frame);
    const h=2.06,w=h*work.ratio;
    box(0x765837,0,0,0,w+.18,h+.18,.11,frame);
    box(0xc3a176,0,0,.055,w+.075,h+.075,.038,frame);
    const map=loader.load(museumArtUrl(work.file));map.colorSpace=T.SRGBColorSpace;
    const painting=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map}));
    painting.position.z=.079;frame.add(painting);
    standSign(T,frame,work.title,work.credit,2.06,0,-1.39,.02,"#eae4d7","#443c32",.38);
    yield;
  }
  const fill=new T.HemisphereLight(0xffedce,0xb9a795,2.35);room.add(fill);
  return {};
}
