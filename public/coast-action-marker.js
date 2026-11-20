import * as T from "three";
import {cruiseScale} from "./coast-vessel-layout.js";

// One translucent floor decal follows the same interaction as the nearby menu.
export function buildCoastActionMarker(shore,ship,floorAt){
 const canvas=document.createElement("canvas");canvas.width=512;canvas.height=176;
 const ctx=canvas.getContext("2d"),map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshBasicMaterial({map,transparent:true,opacity:.64,depthTest:true,depthWrite:false,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,toneMapped:false});
 const plane=new T.Mesh(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),material);
 const root=new T.Group(),eye=new T.Vector3();root.name="coast-action-marker";root.visible=false;
 root.add(plane);shore.add(root);
 let lastLabel="",width=1;
 function paint(label){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font='bold 80px "Malgun Gothic", sans-serif';ctx.textBaseline="middle";ctx.textAlign="center";
  // Outline the letters over sand and timber without putting a signboard behind them.
  ctx.lineJoin="round";ctx.lineWidth=13;ctx.strokeStyle="#244c49";ctx.fillStyle="#f2fff5";
  ctx.strokeText(label,256,118,480);ctx.fillText(label,256,118,480);
  ctx.beginPath();ctx.ellipse(256,37,26,15,0,0,2*Math.PI);
  ctx.strokeStyle="#224c47";ctx.lineWidth=12;ctx.stroke();
  ctx.strokeStyle="#baf8dc";ctx.lineWidth=6;ctx.stroke();
  const span=Math.min(canvas.width,ctx.measureText(label).width+34);
  map.repeat.x=span/canvas.width;map.offset.x=(1-map.repeat.x)/2;
  map.needsUpdate=true;
  width=Math.min(1.72,span*.72/canvas.height);
 }
 return function update(anchor,camera){
  root.visible=Boolean(anchor);
  if(!anchor)return;
  const parent=anchor.deck?ship:shore;
  if(root.parent!==parent)parent.add(root);
  if(lastLabel!==anchor.label){lastLabel=anchor.label;paint(lastLabel);}
  const y=anchor.h??floorAt(anchor);
  root.position.set(anchor.x,y+.046,anchor.z);
  // Rotate only within the deck or paving plane. The ship itself supplies its pitch and roll.
  eye.copy(camera.position);parent.worldToLocal(eye);
  root.rotation.y=Math.atan2(eye.x-anchor.x,eye.z-anchor.z);
  const scale=anchor.deck?1/cruiseScale:1;
  plane.scale.set(width*scale,1,.72*scale);
 };
}
