import * as T from "three";
import {bridge,cruiseHullStations,cruiseStairs,exitGate,helmStation,loungePorch,loungeRails,mainDeckRail,
 mainFloor,midFloor,salonBowDoor,salonPortDoor,salonSideHalfWidth,salonTaperStart,cruiseScale} from "./coast-vessel-layout.js";
import {cruiseSeats,cruiseTables} from "./coast-vessel-seats.js";
import {roundPropDetail} from "./pohang-prop-lod.js";
// Three connected decks aboard a 51 m excursion yacht.
export function makeCruise(){
 const root=new T.Group(),batches=new Map(),box=new T.BoxGeometry(),cyl=new T.CylinderGeometry(1,1,1,12),ball=new T.SphereGeometry(1,16,10);
 const cream=0xf5f0e5,navy=0x172e45,brass=0xbf965c,glass=0x315868,wood=0xb4865c;
 const finish=c=>c===brass?brass:c===glass?glass:cream;
 const material=(c,surface=c)=>new T.MeshStandardMaterial({color:c,roughness:surface===glass?.16:.51,metalness:surface===brass?.64:.09});
 function addPart(geo,c,matrix){
  const surface=finish(c),key=geo.id+"/"+surface;
  if(!batches.has(key))batches.set(key,{geo,surface,colors:new Map(),count:0});
  const batch=batches.get(key);
  if(!batch.colors.has(c))batch.colors.set(c,[]);
  batch.colors.get(c).push(matrix);batch.count++;
 }
 function piece(geo,c,x,y,z,w,h,d,rx=0,ry=0,rz=0){
  const obj=new T.Object3D();obj.position.set(x,y,z);obj.scale.set(w,h,d);obj.rotation.set(rx,ry,rz);obj.updateMatrix();
  addPart(geo,c,obj.matrix);
 }
 function beam(a,b,r,c){const v=new T.Vector3(...a),q=new T.Vector3(...b),length=v.distanceTo(q),o=new T.Object3D();
  o.position.copy(v.clone().lerp(q,.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(v).normalize());o.scale.set(r,length,r);o.updateMatrix();
  addPart(cyl,c,o.matrix);}
 const stations=cruiseHullStations;
 const outline=(w,z0,z1)=>stations.map(([z,f])=>[w*f,z0+(z+18)/38*(z1-z0)]);
 function shell(rows,c){
  const pos=[],idx=[];for(const [y,w,z0,z1] of rows){const side=outline(w,z0,z1);for(const [x,z] of [...side,...side.toReversed().map(([x,z])=>[-x,z])])pos.push(x,y,z);}
  const n=stations.length*2;for(let j=1;j<rows.length;j++)for(let k=0;k<n;k++){const a=(j-1)*n+k,b=(j-1)*n+(k+1)%n;idx.push(a,b,b+n,a,b+n,a+n);}
  const off=(rows.length-1)*n;for(let k=1;k<n-1;k++)idx.push(off,off+k,off+k+1);
  const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const m=material(c);m.side=T.DoubleSide;root.add(new T.Mesh(g,m));
 }
 shell([[-1.5,3.7,-15,17],[.2,4.8,-17.4,19.1],[1.76,5.25,-18,20]],navy);
 shell([[1.76,5.25,-18,20],[1.92,5.28,-18,20]],brass);
 shell([[1.92,5.28,-18,20],[2.40,5.20,-18,20]],cream);
 shell([[2.41,5.03,-17.8,19.65],[2.46,5.03,-17.8,19.65]],wood);
 const panePlane=new T.PlaneGeometry();
 const salonPanes=new T.MeshBasicMaterial({color:0x78b7cd,transparent:true,opacity:.19,depthWrite:false,side:T.DoubleSide,forceSinglePass:true});
 function salonWindow(x,y,z,width,height,yaw=0){
  const m=new T.Mesh(panePlane,salonPanes);m.position.set(x,y,z);m.scale.set(width,height,1);m.rotation.y=yaw;root.add(m);
 }
 const portAft=salonPortDoor.z-salonPortDoor.half,portFore=salonPortDoor.z+salonPortDoor.half;
 for(const side of [-1,1]){
  const panels=side<0?[[-7.82,portAft],[portFore,salonTaperStart]]:[[-7.82,salonTaperStart]];
  panels.push([salonTaperStart,salonBowDoor.z]);
  for(const [back,front] of panels){
   const x0=side*salonSideHalfWidth(back),x1=side*salonSideHalfWidth(front);
   const length=Math.hypot(x1-x0,front-back),yaw=Math.atan2(x1-x0,front-back),x=(x0+x1)/2,z=(back+front)/2;
   piece(box,cream,x,2.75,z,.14,.56,length,0,yaw);
   salonWindow(x,3.91,z,length,1.82,yaw+Math.PI/2);
  }
  piece(box,cream,side*2.28,2.74,-7.82,3.03,.56,.15);
  salonWindow(side*2.28,3.91,-7.82,3.02,1.83);
  piece(box,cream,side*.75,3.7,-7.82,.082,2.46,.115);
  const midPosts=side<0?[portAft,portFore]:[.1];
  for(const z of [-7.81,-5.16,-2.5,...midPosts,2.7,salonTaperStart,7.9,salonBowDoor.z])
   piece(box,cream,side*salonSideHalfWidth(z),3.8,z,.105,2.47,.095);
  const wing=salonSideHalfWidth(salonBowDoor.z)-salonBowDoor.half,mid=side*(salonBowDoor.half+wing/2);
  piece(box,cream,mid,2.75,salonBowDoor.z,wing,.56,.13);
  salonWindow(mid,3.91,salonBowDoor.z,wing,1.83);
  piece(box,cream,side*salonBowDoor.half,3.68,salonBowDoor.z,.105,2.44,.13);
  piece(box,cream,mid,3.91,salonBowDoor.z,.075,1.82,.095);
 }
 piece(box,cream,0,4.82,salonBowDoor.z,salonBowDoor.half*2,.16,.13);
 piece(box,cream,-salonSideHalfWidth(salonPortDoor.z),4.82,salonPortDoor.z,.14,.16,salonPortDoor.half*2);
 // The mat connects the threshold to the fore-and-aft aisle without a raised sill.
 piece(box,0x405d60,-2.55,2.472,salonPortDoor.z,3.42,.017,1.98);
 const aisleStart=-7.78,aisleEnd=salonBowDoor.z+.15,aisleCentre=(aisleStart+aisleEnd)/2;
 piece(box,0x405d60,0,2.472,aisleCentre,1.68,.017,aisleEnd-aisleStart);
 for(const side of [-1,1]){
  piece(box,0xd0b78d,side*.775,2.486,aisleCentre,.035,.008,aisleEnd-aisleStart-.1);
 }
 const headliner=new T.MeshBasicMaterial({color:0xe6dfcc});
 function ceilingPanel(x,y,z,w,d){
  const panel=new T.Mesh(box,headliner);panel.position.set(x,y,z);panel.scale.set(w,.045,d);root.add(panel);
 }
 ceilingPanel(0,4.93,(salonTaperStart-7.82)/2,7.63,salonTaperStart+7.82);
 const frontCeiling=new T.BufferGeometry(),outer=salonSideHalfWidth(salonTaperStart)-.035,inner=salonSideHalfWidth(salonBowDoor.z)-.035;
 frontCeiling.setAttribute("position",new T.Float32BufferAttribute([
  -outer,4.9075,salonTaperStart,outer,4.9075,salonTaperStart,inner,4.9075,salonBowDoor.z,-inner,4.9075,salonBowDoor.z
 ],3));frontCeiling.setIndex([0,1,2,0,2,3]);root.add(new T.Mesh(frontCeiling,headliner));
 for(const x of [-2.66,2.66])for(const z of [-5.8,-2.3,1.2,4.7,8.2])piece(cyl,0xf9e9be,x,4.895,z,.104,.025,.104);
 shell([[5.0,4.53,-11.77,13.25],[5.38,4.44,-11.78,13.1]],cream);
 shell([[5.39,4.28,-11.78,12.8],[5.43,4.28,-11.78,12.8]],wood);
 const [aftStair,upperStair]=cruiseStairs;
 const porchX=(loungePorch.left+loungePorch.right)/2,porchZ=(loungePorch.aft+loungePorch.front)/2;
 const porchWidth=loungePorch.right-loungePorch.left,porchRun=loungePorch.front-loungePorch.aft;
 piece(box,cream,porchX,midFloor-.23,porchZ,porchWidth,.36,porchRun);
 piece(box,wood,porchX,midFloor-.025,porchZ,porchWidth,.05,porchRun);
 // The full width of each flight meets a flat turning space, including its outer corner.
 piece(box,wood,0,midFloor-.055,aftStair.end+.56,7.22,.11,1.12);
 shell([[5.44,3.47,-5.4,10.2],[5.89,3.56,-5.5,10.3]],cream);
 shell([[5.89,3.56,-5.5,10.3],[7.5,3.15,-4.9,9.45]],0x25495c);
 shell([[7.51,3.75,-5.54,10.45],[7.84,3.66,-5.55,10.3]],cream);
 piece(box,wood,0,bridge.floor-.045,upperStair.end+.49,5.68,.09,.98);
 for(const side of [-1,1]){
  for(let i=0;i<4;i++)piece(box,cream,side*3.36,6.7,-3.5+i*1.55,.15,1.55,.16,.15);
  for(let i=0;i<12;i++){const m=0.78+.22*Math.sin((i+1)/14*Math.PI);piece(ball,0x7c9cab,side*5.01*m,1.18,-13+i*2.04,.17,.23,.39);}
  const mainEdge=outline(mainDeckRail.half,mainDeckRail.aft,mainDeckRail.front);
  const loungeEdge=side<0?loungeRails.port:loungeRails.starboard;
  for(const [height,edge,gated] of [[2.48,mainEdge,side<0],[5.44,loungeEdge,false]]){
   for(let i=1;i<edge.length;i++){const [x,z]=edge[i-1],[u,v]=edge[i];
    const railX=at=>side*(x+(u-x)*(at-z)/(v-z));
    const spans=gated?
     [[z,Math.min(v,exitGate.z-exitGate.half)],[Math.max(z,exitGate.z+exitGate.half),v]]:[[z,v]];
    for(const [start,end] of spans){
     if(start>=end)continue;
     for(const dy of [.49,1])beam([railX(start),height+dy,start],[railX(end),height+dy,end],dy===1?.057:.032,dy===1?brass:cream);
     const bays=Math.ceil((end-start)/1.8);
     for(let k=0;k<bays;k++){
      const at=start+(end-start)*k/bays;
      if(gated&&at===exitGate.z+exitGate.half)continue;
      piece(cyl,cream,railX(at),height+.5,at,.035,1,.035);
     }
    }
   }}
  const trimEnd=side<0?portAft:.5;
  piece(box,0xe1b77c,side*4.23,2.52,(trimEnd-10.5)/2,.09,.1,trimEnd+10.5);
 }
 // The port gangway bridges the drop to the pier and folds up across the opening at sea.
 const {x:gateX,z:gateZ,half:gateHalf,run,drop}=exitGate,portalTop=mainFloor+2.14;
 const uprightHeight=portalTop-mainFloor-.215;
 for(const side of [-1,1]){
  piece(box,cream,gateX,mainFloor+uprightHeight/2,gateZ+side*gateHalf,.10,uprightHeight,.10);
  piece(box,brass,gateX,mainFloor+.54,gateZ+side*gateHalf,.14,.12,.14);
 }
 const green=0x185743;
 piece(box,green,gateX,portalTop,gateZ,.10,.43,gateHalf*2+.12);
 piece(box,green,gateX+.35,portalTop,gateZ+gateHalf,.79,.37,.07);
 if(typeof document!=="undefined"){
  const label=document.createElement("canvas");label.width=384;label.height=128;
  const ink=label.getContext("2d");ink.fillStyle="#185743";ink.fillRect(0,0,label.width,label.height);
  ink.strokeStyle="#99c6ad";ink.lineWidth=3;ink.strokeRect(6,6,372,116);
  ink.fillStyle="#fffdf2";ink.font='bold 86px "Malgun Gothic", sans-serif';ink.textAlign="center";ink.textBaseline="middle";
  ink.fillText("출구",192,67);
  const map=new T.CanvasTexture(label);map.colorSpace=T.SRGBColorSpace;
  const face=new T.MeshBasicMaterial({map});
  function placard(x,z,width,height,yaw){
   const m=new T.Mesh(panePlane,face);m.position.set(x,portalTop,z);m.scale.set(width,height,1);m.rotation.y=yaw;root.add(m);
  }
  for(const side of [-1,1]){
   placard(gateX+side*.052,gateZ,1.54,.401,side*Math.PI/2);
   placard(gateX+.35,gateZ+gateHalf+side*.037,.76,.353,side===1?0:Math.PI);
  }
 }
 const gangway=new T.Group(),length=Math.hypot(run,drop);
 gangway.name="port-gangway";gangway.position.set(gateX,mainFloor,gateZ);root.add(gangway);
 function gangwayPart(m,x,y,z,w,h,d){
  const layer=new T.Mesh(box,m);layer.position.set(x,y,z);layer.scale.set(w,h,d);gangway.add(layer);
 }
 const tread=material(0x566365),trim=material(0xc9ab69);
 gangwayPart(tread,-length/2,-.04,0,length,.08,gateHalf*2-.16);
 for(const side of [-1,1])gangwayPart(trim,-length/2,.009,side*(gateHalf-.105),length,.014,.043);
 for(let i=1;i<=6;i++)gangwayPart(trim,-length*i/7,.013,0,.027,.016,gateHalf*2-.31);
 root.userData.setGangwayOpen=open=>{gangway.rotation.z=open?Math.atan2(drop,run):-Math.PI/2;};
 root.userData.setGangwayOpen(false);
 // Close the handrail across the narrow stem and behind the aft deck seats.
 for(const [z,half] of [[mainDeckRail.front,mainDeckRail.half*stations.at(-1)[1]],
                        [mainDeckRail.aft,mainDeckRail.half*stations[0][1]]]){
  for(const [height,radius,color] of [[2.97,.032,cream],[3.48,.057,brass]])
   beam([-half,height,z],[half,height,z],radius,color);
  const bays=Math.ceil(2*half/1.8);
  for(let i=0;i<=bays;i++){
   if(z===mainDeckRail.aft&&(i===0||i===bays))continue;
   piece(cyl,cream,-half+2*half*i/bays,2.98,z,.035,1,.035);
  }
 }
 for(const stair of cruiseStairs){
  const run=(stair.end-stair.start)/stair.steps,rise=(stair.to-stair.from)/stair.steps;
  for(let i=0;i<stair.steps;i++){
   const top=stair.from+(i+.5)*rise,z=stair.start+(i+.5)*run;
   piece(box,wood,stair.x,top-rise/2,z,stair.half*2,rise,run);
  }
  for(const side of [-1,1]){
   const x=stair.x+side*(stair.half-.055);
   beam([x,stair.from-.10,stair.start],[x,stair.to-.10,stair.end],.075,cream);
  }
  const railX=stair.x+stair.side*stair.half;
  beam([railX,stair.from+.94,stair.start],[railX,stair.to+.94,stair.end],.05,brass);
  const posts=stair===aftStair?3:4; // the lounge rail supplies the aft flight's top post
  for(let i=0;i<posts;i++){
   const t=i/3,y=stair.from+t*(stair.to-stair.from),z=stair.start+t*(stair.end-stair.start);
   piece(cyl,cream,railX,y+.47,z,.035,.94,.035);
  }
 }
 piece(cyl,cream,-1.44,11.19,4.45,.12,1.20,.12);piece(box,navy,-1.44,11.75,4.45,1.34,.09,.20);
 piece(ball,cream,1.49,10.97,4.2,.43,.38,.43);
 // A sheltered service counter opens onto the aft lounge alongside the companionway.
 piece(box,wood,-1.65,5.90,-7.02,2.3,.88,.62);
 piece(box,cream,-1.65,6.39,-7.02,2.44,.10,.73);
 piece(box,cream,-1.65,7.62,-6.83,2.69,.10,1.51);
 for(const x of [-2.82,-.48])piece(cyl,brass,x,6.55,-6.60,.033,2.06,.033);
 for(let i=0;i<4;i++){
  const x=-2.49+i*.24;piece(cyl,i%2?0x466749:0x693934,x,6.59,-7.05,.057,.32,.057);
  piece(cyl,brass,x,6.77,-7.05,.024,.10,.024);
 }
 piece(box,wood,-.98,6.47,-7.11,.57,.042,.33);piece(box,0xf2cc77,-1.07,6.53,-7.10,.19,.10,.14);
 // The wheelhouse has a real aft doorway, low sills and a continuous view over the bow.
 const {aft,front,half,door,floor}=bridge,mid=(aft+front)/2,len=front-aft,top=floor+2.79;
 const panes=new T.MeshBasicMaterial({color:0x98d7ea,transparent:true,opacity:.095,side:T.DoubleSide,depthWrite:false});
 const glassPanel=(x,y,z,w,h,d)=>{
  const pane=new T.Mesh(box,panes);pane.position.set(x,y,z);pane.scale.set(w,h,d);root.add(pane);
 };
 piece(box,cream,0,top,mid,half*2+.34,.16,len+.44);
 piece(box,navy,0,top-.103,mid,half*2+.22,.065,len+.29);
 ceilingPanel(0,top-.15,mid,half*2+.16,len+.20);
 for(const side of [-1,1]){
  const rearWidth=half-door;
  piece(box,cream,side*(door+rearWidth/2),floor+.37,aft,rearWidth,.74,.13);
  glassPanel(side*(door+rearWidth/2),floor+1.67,aft,rearWidth,1.88,.028);
  for(const x of [door,half])piece(box,cream,side*x,floor+1.34,aft,.092,2.68,.11);
  piece(box,cream,side*half,floor+.30,mid,.11,.60,len);
  glassPanel(side*half,floor+1.64,mid,.028,2.05,len);
  for(const z of [mid,front])piece(box,cream,side*half,floor+1.64,z,.085,2.06,.085);
  piece(cyl,brass,side*door,floor+1.02,aft-.10,.042,.45,.042);
 }
 piece(box,cream,0,floor+2.50,aft,door*2,.35,.13);
 piece(box,navy,0,floor+.29,front,half*2,.58,.11);
 glassPanel(0,floor+1.64,front,half*2,2.05,.025);
 for(const x of [-1.49,1.49])piece(box,cream,x,floor+1.64,front,.065,2.11,.075);
 piece(box,wood,0,floor+.385,7.43,3.12,.77,.59);
 piece(box,navy,0,floor+.79,7.30,3.32,.15,.77,-.15);
 for(const x of [-.98,.06,.98]){
  piece(box,glass,x,floor+.92,7.47,.64,.31,.10,-.22);
  piece(box,0x79b6a8,x,floor+.925,7.408,.52,.21,.012,-.22);
  for(let k=0;k<5;k++)piece(box,k%3?0xa2dac7:0xf0bf7a,x-.19+k*.088,floor+.918+Math.sin(k+x)*.035,7.385,.058,.024+.025*(1+Math.cos(k*x)),.012,-.22);
  for(let j=0;j<3;j++)piece(cyl,j===1?brass:navy,x-.15+j*.15,floor+.90,7.09,.026,.06,.026);
 }
 const wheel=new T.Mesh(new T.TorusGeometry(.24,.026,8,20),material(brass));
 wheel.position.set(helmStation.x,floor+.91,6.88);wheel.rotation.x=-.22;root.add(wheel);
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam([helmStation.x,floor+.91,6.88],[helmStation.x+.22*Math.cos(a),floor+.91+.22*Math.sin(a),6.88-.05*Math.sin(a)],.014,navy);}
 beam([1.22,floor+.82,7.16],[1.22,floor+1,7.04],.022,brass);
 for(const x of [-2.91,2.91]){
  for(const z of [-4.6,-2,1])piece(cyl,cream,x,8.27,z,.035,.81,.035);
  beam([x,8.68,-4.8],[x,8.68,1.60],.043,brass);
 }
 for(const s of cruiseSeats){
  const booth=s.floor===2.46&&s.tableId,upholstery=booth?0xa36d54:0x427979;
  const along=(d)=>[s.x+Math.sin(s.yaw)*d,s.z+Math.cos(s.yaw)*d];
  const [bx,bz]=along(-s.depth/2+.055);
  piece(box,navy,s.x,s.floor+.17,s.z,s.width-.13,.32,s.depth-.13,0,s.yaw);
  piece(box,wood,s.x,s.floor+.345,s.z,s.width,.04,s.depth,0,s.yaw);
  piece(box,upholstery,s.x,s.floor+s.seatHeight-.055,s.z,s.width-.04,.11,s.depth-.035,0,s.yaw);
  piece(box,cream,bx,s.floor+.675,bz,s.width,.42,.105,0,s.yaw);
  const [px,pz]=along(-s.depth/2+.13);
  piece(box,upholstery,px,s.floor+.68,pz,s.width-.08,.34,.07,0,s.yaw);
 }
 for(const table of cruiseTables){
  const {x,z,floor,radius,height}=table;
  piece(cyl,navy,x,floor+.035,z,radius*.48,.065,radius*.48);
  piece(cyl,brass,x,floor+height/2,z,.067,height-.09,.067);
  piece(cyl,wood,x,floor+height-.043,z,radius,.086,radius);
  for(const side of [-1,1]){
   const cz=z+side*radius*.56;
   piece(cyl,cream,x,floor+height+.012,cz,.112,.022,.112);
   piece(cyl,0x3e6b73,x,floor+height+.075,cz,.062,.102,.062);
  }
 }

 const tint=new T.Color();
 // At flush rail-to-panel joints the final opaque sample belongs to the panel.
 const ordered=[...batches.values()].sort((a,b)=>Number(a.geo===box)-Number(b.geo===box));
 for(const {geo,surface,colors,count} of ordered){
  const mesh=new T.InstancedMesh(geo,material(0xffffff,surface),count);
  let i=0;
  for(const [color,matrices] of colors){
   tint.setHex(color);
   for(const matrix of matrices){mesh.setMatrixAt(i,matrix);mesh.setColorAt(i++,tint);}
  }
  root.add(mesh);
 }
 root.userData.updateDetail=roundPropDetail(root,cyl,ball,cruiseScale);
 return root;
}
