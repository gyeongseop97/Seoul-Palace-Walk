import {ARCADE_SITE} from "./arcade-layout.js";
import {standSign} from "./regional-stands.js";

export function addArcadeExterior(T,parent,{wx,wz,box},groundHeight){
  const facade=new T.Group();
  const {body,angle,width,depth}=ARCADE_SITE,z=depth/2;
  facade.name=ARCADE_SITE.name;
  facade.position.set(wx(body.x),groundHeight(body),wz(body.y));
  facade.rotation.y=angle;parent.add(facade);
  const block=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,facade);
  block(0x34464e,0,1.78,0,width,4,depth);
  block(0x3c4e56,0,5.43,.04,width-.25,3.40,depth-.17);
  block(0x202c33,0,7.14,0,width+.36,.25,depth+.4);
  block(0x293d45,0,4.00,z,width+.23,.24,.38);
  block(0x202c33,0,3.36,z,width+.22,.62,.28);
  block(0x458f84,0,3.02,z+.155,width,.05,.08);
  block(0xd5835e,0,3.68,z+.155,width,.05,.08);
  standSign(T,facade,"광화문 오락실","볼링 · 농구 · 펌프 · 인형뽑기 · 두더지 잡기",6.5,0,3.34,z+.152,"#263642","#f9dfb1",.49);
  for(const side of [-1,1]){
    block(0x182630,side*.64,1.41,z+.02,1.22,2.71,.08);
    block(0x52747b,side*.63,1.57,z+.07,1.04,1.94,.027);
    block(0xf2d5ab,side*.22,1.28,z+.105,.06,.35,.08);
    for(const dx of [2.43,4.51,6.61]){
      block(0x202c33,side*dx,1.61,z+.04,1.44,1.68,.12);
      block(0x416271,side*dx,1.61,z+.105,1.25,1.48,.028);
      block(0x458f84,side*dx,1.10,z+.125,1.05,.055,.021);
      block(0x25353c,side*dx,5.62,z-.03,1.50,1.40,.16);
      block(0x5e8692,side*dx,5.62,z+.063,1.27,1.18,.036);
      block(0x425a60,side*dx,5.62,z+.09,.035,1.17,.026);
    }
  }
  standSign(T,facade,"2층","사격 · 양궁 · 스크린 야구",3.54,0,5.69,z+.062,"#294451","#ffe9bd",.46);
}
