// Survey frame shared with the Gyeongju street map. Positive z points south.
export const twinTombName="대릉원 황남대총";
export const cheonma={x:-135.1,z:-286.9,radius:27,height:12.7,yaw:-.145};
const sin=Math.sin(cheonma.yaw),cos=Math.cos(cheonma.yaw);
export const cheonmaPoint=(across,along)=>({x:cheonma.x+cos*across+sin*along,z:cheonma.z-sin*across+cos*along});
export function cheonmaLocal(p){
 const dx=p.x-cheonma.x,dz=p.z-cheonma.z;
 return {a:cos*dx-sin*dz,b:sin*dx+cos*dz};
}
export function inCheonmaHall(p){
 const {a,b}=cheonmaLocal(p);
 return b>=7.3&&b<=28.3&&(Math.abs(a)<1.82||b<=17.65&&Math.abs(a)<5.52);
}
export function cheonmaExhibit(p){
 const {a,b}=cheonmaLocal(p);
 return Math.abs(a)<1.30&&Math.abs(b-12.8)<1.0;
}
export const daereungwonPlaces={
 geomchong:{x:-1.9,z:-185.9,name:"검총 관람길",heading:190},
 naemul:{x:464.4,z:412.2,name:"내물왕릉 관람길",heading:10},
 cheonmaDoor:{...cheonmaPoint(0,29.2),name:"천마총 전시관 입구",heading:8},
 cheonmaGallery:{...cheonmaPoint(0,15.7),name:"천마총 전시실",heading:8},
 twinTomb:{x:-107.8,z:-325.4,name:"황남대총 연못 전망길",heading:85},
 michu:{x:129.3,z:-69,name:"미추왕릉 참배길",heading:357}
};
export function michuStoneAt(p){
 const dx=p.x-126,dz=p.z+117.1;
 if(Math.abs(dx)>9||dz<27||dz>35)return false;
 const c=Math.cos(.10),s=Math.sin(.10),a=c*dx-s*dz,b=s*dx+c*dz;
 return Math.abs(b-30.15)<.84&&Math.abs(a)<1.78||Math.abs(b-30.6)<.38&&Math.abs(Math.abs(a)-3.42)<.37||
  Math.abs(b-32.45)<.50&&Math.abs(a-3.95)<.63;
}
// The north and south lobes share a continuous grassy saddle and one footprint.
const halfLength=60,crest=23,rounding=4;
const peak=Math.hypot(crest,rounding),span=Math.hypot(halfLength,rounding)-peak;
export function twinSection(z){
 const t=(Math.hypot(z,rounding)-peak)/span;
 return Math.sqrt(Math.max(0,1-t*t));
}
export function twinHeight(m,p){
 const dz=p.z-m.z,w=39.8*twinSection(dz);
 if(!w)return 0;
 const dx=(p.x-m.x-dz*.043)/w;
 return Math.abs(dx)<1?(22.5+.5*Math.tanh(dz/12))*twinSection(dz)**1.6*(1-dx*dx):0;
}
