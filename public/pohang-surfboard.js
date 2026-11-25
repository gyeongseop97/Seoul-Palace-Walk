import * as T from "three";

// Stations along the stringer: tail to nose, half-width, rocker and half-thickness.
const sections=[
 [-1.16,.03,.064,.010],[-1.09,.15,.045,.025],[-.92,.22,.019,.039],
 [-.62,.29,.007,.048],[-.25,.325,0,.052],[.17,.33,.002,.052],
 [.51,.302,.016,.047],[.82,.247,.049,.040],[1.05,.16,.10,.028],[1.22,.013,.164,.009]
];
const railSteps=18;
const shapes=new Map(),materials=new Map();
// The front of the wide midpoint is an actual vertex on each rail of the blank.
const [gripZ,gripWidth,gripRocker]=sections[5];
const railContact=new T.Vector3();
export function carrySurfboard(board,model){
 const side=model.surfboardCarrySide,hand=model.arms[side<0?0:1].hand;
 if(board.parent===hand)return;
 hand.add(board);
 const scale=1/(model.body.scale.x*hand.scale.x);
 board.scale.setScalar(scale);
 board.rotation.set(-.035,0,side*1.46,"XYZ");
 railContact.set(side*gripWidth,gripRocker,gripZ).applyQuaternion(board.quaternion).multiplyScalar(scale);
 board.position.set(0,-.076,.024).sub(railContact);
}
function material(color){
 if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.55}));
 return materials.get(color);
}
function blank(){
 const points=[],indices=[];
 for(const [z,width,rocker,half] of sections){
  for(let j=0;j<railSteps;j++){
   const phi=j/railSteps*Math.PI*2;
   points.push(width*Math.cos(phi),rocker+half*Math.sin(phi),z);
  }
 }
 for(let i=1;i<sections.length;i++)for(let j=0;j<railSteps;j++){
  const base=(i-1)*railSteps,start=base+j,next=base+(j+1)%railSteps;
  indices.push(start,next,start+railSteps,next,next+railSteps,start+railSteps);
 }
 for(let j=1;j<railSteps-1;j++){
  const tip=(sections.length-1)*railSteps;
  indices.push(0,j+1,j,tip,tip+j,tip+j+1);
 }
 const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(points,3));
 geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function deckStrip(name,start,end,left,right){
 if(shapes.has(name))return shapes.get(name);
 const vertices=[],indices=[],columns=9;
 for(let i=start;i<=end;i++){
  const [z,w,rocker,thick]=sections[i];
  for(let j=0;j<columns;j++){
   const x=left+(right-left)*j/(columns-1);
   vertices.push(w*x,rocker+thick*Math.sqrt(1-x*x)+.002,z);
   const k=(i-start)*columns+j;
   if(i>start&&j>0)indices.push(k-columns-1,k-1,k-columns,k-1,k,k-columns);
  }
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute("position",new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);
 geo.computeVertexNormals();shapes.set(name,geo);return geo;
}
function fin(){
 const shape=new T.Shape();
 shape.moveTo(-.13,0);shape.quadraticCurveTo(-.13,-.063,-.245,-.18);
 shape.quadraticCurveTo(-.055,-.166,.12,0);shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:.016,bevelEnabled:false,curveSegments:7});
 geo.rotateY(-Math.PI/2);geo.translate(.008,0,0);return geo;
}
export function surfboard(index=0){
 const group=new T.Group();group.name="영일대 서핑보드";
 if(!shapes.has("blank")){shapes.set("blank",blank());shapes.set("fin",fin());}
 group.add(new T.Mesh(shapes.get("blank"),material([0xf4bb72,0x6cc5bd,0xe89481][index%3])));
 group.add(new T.Mesh(deckStrip("stringer",0,9,-.019,.019),material(0x9c633e)));
 group.add(new T.Mesh(deckStrip("nose band",6,7,-.77,.77),material(0xf9ecd3)));
 for(const side of [-1,1]){
  const stripe=new T.Mesh(deckStrip("tail pad"+side,1,3,side<0?-.72:.07,side<0?-.07:.72),material(0x355452));
  group.add(stripe);
  const sideFin=new T.Mesh(shapes.get("fin"),material(0x386563));sideFin.position.set(side*.154,-.025,-.59);
  sideFin.scale.setScalar(.76);sideFin.rotation.z=side*.16;group.add(sideFin);
 }
 const centerFin=new T.Mesh(shapes.get("fin"),material(0x315453));centerFin.position.set(0,-.027,-.83);group.add(centerFin);
 return group;
}
