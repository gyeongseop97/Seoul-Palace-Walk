import * as T from "three";
import {rink,hillLength,hillLane,hillPoint,hillHeight,gates,gateSide,iceEvent} from "./outdoor-sports.js";

// Static strips share one vertex-colored mesh for each venue.
export function createSportVenue(city,origin,grade){
 const vertices=[],colors=[],tint=new T.Color();
 function quad(a,b,c,d,color){
  tint.setHex(color);
  for(const v of [a,b,c,a,c,d]){vertices.push(v[0]-origin.x,v[1],v[2]-origin.y);colors.push(tint.r,tint.g,tint.b);}
 }
 function ice(t,r,h=0){
  const x=rink.x+Math.cos(t)*r*rink.rx,y=rink.y+Math.sin(t)*r*rink.ry;
  return [x,grade({x,y})+.13+h,y];
 }
 const n=96,turn=Math.PI*2/n;
 if(city==="seoul"){
  const radii=[0,.28,.287,.72,.727,.94,.95,1];
  const shades=[0xb9e3ef,0xeaf9ff,0xbce4f1,0xeaf9ff,0xbce5f0,0x80baca,0xaedbe8];
  for(let i=0;i<n;i++){
   const a=i*turn,b=(i+1)*turn;
   for(let j=1;j<radii.length;j++)quad(ice(a,radii[j-1]),ice(b,radii[j-1]),ice(b,radii[j]),ice(a,radii[j]),shades[j-1]);
   if(i>=70&&i<=73)continue;
   quad(ice(a,1),ice(b,1),ice(b,1,.56),ice(a,1,.56),i%8<4?0xeeffff:0xd9eeef);
   quad(ice(a,1,.56),ice(b,1,.56),ice(b,1,.67),ice(a,1,.67),0x327a9e);
  }
 }else{
  function vertex(s,side,h=0){const p=hillPoint(s,side);return [p.x,hillHeight(s,side)+h,p.y];}
  const widths=[-52,-41,-32,-24,-18,-10.25,-9.9,-.1,.25,2.9,3.15,10.85,11.1,18,25,33,42,52];
  const shades=[0x90a469,0x829c61,0x70915b,0x668750,0x79945b,0xf5e7bc,0x5f686d,0xf5e7bc,0x83a05a,0xe3d487,0x9ab956,0xe3d487,0x84a360,0x759951,0x819d60,0x8ba36a,0x9baa70];
  for(let s=-52;s<hillLength+4;s+=2){
   for(let j=1;j<widths.length;j++)
    quad(vertex(s,widths[j-1]),vertex(s+2,widths[j-1]),vertex(s+2,widths[j]),vertex(s,widths[j]),shades[j-1]);
   if(s>=0&&s<hillLength)for(const side of [-10.25,.25]){
    quad(vertex(s,side),vertex(s+2,side),vertex(s+2,side,.43),vertex(s,side,.43),Math.floor(s/6)%2?0xf4e8d4:0xd96749);
   }
  }
  for(const kind of ["luge","sled"]){
   const lane=hillLane(kind);
   for(const [i,s] of gates.entries())for(const offset of [-1.9,1.9]){
    const x=lane+gateSide(i)+offset,color=i%2?0x32a3ac:0xe07540;
    quad(vertex(s,x-.075,.03),vertex(s,x+.075,.03),vertex(s,x+.075,1.32),vertex(s,x-.075,1.32),0xf8f3df);
    const tip=x+Math.sign(offset)*.58;
    quad(vertex(s,x,.85),vertex(s,tip,.99),vertex(s,tip,1.3),vertex(s,x,1.3),color);
   }
   for(const s of [0,hillLength-2])for(let i=0;i<8;i++)for(let j=0;j<2;j++){
    let side=lane-4+i;
    quad(vertex(s+j*.7,side,.045),vertex(s+(j+1)*.7,side,.045),vertex(s+(j+1)*.7,side+1,.045),vertex(s+j*.7,side+1,.045),(i+j)%2?0x344047:0xfff6dc);
   }
  }
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
 geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:city==="seoul"?.26:.91}));
 mesh.receiveShadow=true;mesh.name=city==="seoul"?"서울광장 아이스링크":"경주 산악 루지·잔디썰매";return mesh;
}

// A bounded ring of blade marks, shared by everyone skating in this view.
export function createIceMarks(parent,origin,grade){
 const capacity=360,positions=new Float32Array(capacity*12),history=new Map(),ages=new Float64Array(capacity);
 const geometry=new T.BufferGeometry(),points=new T.BufferAttribute(positions,3);
 points.setUsage(T.DynamicDrawUsage);geometry.setAttribute("position",points);
 const lines=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0xe7faff,transparent:true,opacity:.52,depthWrite:false}));
 lines.frustumCulled=false;parent.add(lines);
 let cursor=0,used=0;
 return (skaters,time)=>{
  if(!skaters.length){if(used){history.clear();used=cursor=0;geometry.setDrawRange(0,0);}lines.visible=false;return;}
  let changed=false;
  for(const p of skaters){
   if(p.sport!=="skate")continue;
   const prev=history.get(p.id),d=prev?Math.hypot(prev.x-p.x,prev.y-p.y):Infinity;
   if(d<.24&&time-prev.time<1200)continue;
   history.set(p.id,{x:p.x,y:p.y,time});
   if(!prev||time-prev.time>500||d>2||p.sportMove==="hop"&&iceEvent(p,time))continue;
   const dx=(p.y-prev.y)/d*.115,dy=(prev.x-p.x)/d*.115;let k=cursor*12;
   for(const sign of [-1,1])for(const end of [prev,p]){
    positions[k++]=end.x+sign*dx-origin.x;positions[k++]=grade(end)+.157;positions[k++]=end.y+sign*dy-origin.y;
   }
   ages[cursor]=time;cursor=(cursor+1)%capacity;used=Math.min(used+1,capacity);changed=true;
  }
  for(const [id,last] of history)if(time-last.time>1500)history.delete(id);
  for(let i=0;i<used;i++)if(ages[i]&&time-ages[i]>11000){positions.fill(0,i*12,i*12+12);ages[i]=0;changed=true;}
  if(changed){points.needsUpdate=true;geometry.setDrawRange(0,used*4);}
  lines.visible=Boolean(skaters.length&&used);
 };
}

const unitBox=new T.BoxGeometry(1,1,1),wheel=new T.CylinderGeometry(1,1,1,10);
const matCache=new Map();
function part(parent,color,x,y,z,w,h,d,round=false){
 if(!matCache.has(color))matCache.set(color,new T.MeshStandardMaterial({color,roughness:.55}));
 const mesh=new T.Mesh(round?wheel:unitBox,matCache.get(color));mesh.position.set(x,y,z);
 if(round){mesh.rotation.z=Math.PI/2;mesh.scale.set(w,h,d);}else mesh.scale.set(w,h,d);
 parent.add(mesh);return mesh;
}
function equipment(model,kind){
 const group=new T.Group();
 if(kind==="skate"){
  const blades=model.legs.map(leg=>part(leg.end,0x9abcc8,0,-.068,.05,.018,.055,.27));
  group.userData.blades=blades;
 }else{
  const sled=kind==="sled",color=sled?0x00ada5:0xf17648;
  part(group,color,0,.135,.04,.60,.15,1.05);
  part(group,0x394757,0,.22,-.12,.43,.11,.43);
  part(group,color,0,.36,-.36,.54,.30,.1);
  for(const side of [-1,1]){
   part(group,color,side*.28,.23,.08,.065,.15,1);
   if(!sled)for(const z of [-.32,.37])part(group,0x293944,side*.32,.12,z,.12,.095,.12,true);
  }
  if(!sled)part(group,0x293944,0,.43,.39,.38,.06,.07);
 }
 model.group.add(group);return group;
}
export function poseSport(model,p,clock,floor){
 const kind=p.sport;
 if(kind!==model.sportKind){
  model.body.rotation.y=0;
  if(model.sportGear){for(const b of model.sportGear.userData.blades??[])b.removeFromParent();model.sportGear.removeFromParent();}
  model.sportKind=kind;model.sportGear=kind?equipment(model,kind):null;
 }
 if(!kind)return;
 if(kind!=="skate"){model.sportGear.position.y=floor-model.group.position.y;return;}
 model.body.rotation.y=0;
 const event=iceEvent(p,clock),speed=Math.min(1,Math.hypot(p.vx??0,p.vy??0)/7);
 const sway=Math.sin(clock*.0045)*speed;
 model.body.rotation.z+=sway*.1;model.chest.rotation.x+=speed*.14;
 model.legs[0].upper.rotation.z+=.12*sway;model.legs[1].upper.rotation.z-=.12*sway;
 if(event){
  const t=event.t,arc=Math.sin(Math.PI*t);
  if(event.kind==="fall"){model.body.rotation.z+=Math.min(1,t*5,(1-t)*4)*1.38;model.body.position.y-=arc*.12;}
  else if(event.kind==="spin"){model.body.rotation.y+=Math.PI*2*t;model.body.position.y+=arc*.08;}
  else {model.body.position.y+=arc*.68;model.chest.rotation.x+=arc*.22;}
 }
}
