import * as T from "three";
import {bridge,cruiseHullStations,helmStation,mainDeckRail,salonBowDoor,salonSideHalfWidth,salonTaperStart} from "./coast-vessel-layout.js";
import {cruiseSeats,cruiseTables} from "./coast-vessel-seats.js";
// Three connected decks aboard a 51 m excursion yacht.
export function makeCruise(){
 const root=new T.Group(),batches=new Map(),box=new T.BoxGeometry(),cyl=new T.CylinderGeometry(1,1,1,12),ball=new T.SphereGeometry(1,16,10);
 const cream=0xf5f0e5,navy=0x172e45,brass=0xbf965c,glass=0x315868,wood=0xb4865c;
 const material=c=>new T.MeshStandardMaterial({color:c,roughness:c===glass?.16:.51,metalness:c===brass?.64:.09});
 function piece(geo,c,x,y,z,w,h,d,rx=0,ry=0,rz=0){
  const obj=new T.Object3D();obj.position.set(x,y,z);obj.scale.set(w,h,d);obj.rotation.set(rx,ry,rz);obj.updateMatrix();
  const k=geo.uuid+c;if(!batches.has(k))batches.set(k,{geo,c,ms:[]});batches.get(k).ms.push(obj.matrix);
 }
 function beam(a,b,r,c){const v=new T.Vector3(...a),q=new T.Vector3(...b),length=v.distanceTo(q),o=new T.Object3D();
  o.position.copy(v.clone().lerp(q,.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(v).normalize());o.scale.set(r,length,r);o.updateMatrix();
  const k=cyl.uuid+c;if(!batches.has(k))batches.set(k,{geo:cyl,c,ms:[]});batches.get(k).ms.push(o.matrix);}
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
 for(const side of [-1,1]){
  const sides=[-7.82,salonTaperStart,salonBowDoor.z];
  for(let i=1;i<sides.length;i++){
   const back=sides[i-1],front=sides[i],x0=side*salonSideHalfWidth(back),x1=side*salonSideHalfWidth(front);
   const length=Math.hypot(x1-x0,front-back),yaw=Math.atan2(x1-x0,front-back),x=(x0+x1)/2,z=(back+front)/2;
   piece(box,cream,x,2.75,z,.14,.56,length,0,yaw);
   salonWindow(x,3.91,z,length,1.82,yaw+Math.PI/2);
  }
  piece(box,cream,side*2.28,2.74,-7.82,3.03,.56,.15);
  salonWindow(side*2.28,3.91,-7.82,3.02,1.83);
  piece(box,cream,side*.75,3.7,-7.82,.082,2.46,.115);
  for(const z of [-7.81,-5.16,-2.5,.1,2.7,salonTaperStart,7.9,salonBowDoor.z])
   piece(box,cream,side*salonSideHalfWidth(z),3.8,z,.105,2.47,.095);
  const wing=salonSideHalfWidth(salonBowDoor.z)-salonBowDoor.half,mid=side*(salonBowDoor.half+wing/2);
  piece(box,cream,mid,2.75,salonBowDoor.z,wing,.56,.13);
  salonWindow(mid,3.91,salonBowDoor.z,wing,1.83);
  piece(box,cream,side*salonBowDoor.half,3.68,salonBowDoor.z,.105,2.44,.13);
  piece(box,cream,mid,3.91,salonBowDoor.z,.075,1.82,.095);
 }
 piece(box,cream,0,4.82,salonBowDoor.z,salonBowDoor.half*2,.16,.13);
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
 piece(box,cream,.77,5.20,-12.46,5.03,.36,1.40);
 piece(box,wood,.77,5.415,-12.46,5.03,.045,1.40);
 shell([[5.44,3.47,-5.4,10.2],[5.89,3.56,-5.5,10.3]],cream);
 shell([[5.89,3.56,-5.5,10.3],[7.5,3.15,-4.9,9.45]],0x25495c);
 shell([[7.51,3.75,-5.54,10.45],[7.84,3.66,-5.55,10.3]],cream);
 for(const side of [-1,1]){
  for(let i=0;i<4;i++)piece(box,cream,side*3.36,6.7,-3.5+i*1.55,.15,1.55,.16,.15);
  for(let i=0;i<12;i++){const m=0.78+.22*Math.sin((i+1)/14*Math.PI);piece(ball,0x7c9cab,side*5.01*m,1.18,-13+i*2.04,.17,.23,.39);}
  for(const [height,w,z0,z1] of [[2.48,mainDeckRail.half,mainDeckRail.aft,mainDeckRail.front],[5.44,4.26,-13.05,12.75]]){
   const edge=outline(w,z0,z1);for(let i=1;i<edge.length;i++){const [x,z]=edge[i-1],[u,v]=edge[i],a=x*side,b=u*side;
    for(const dy of [.49,1])beam([a,height+dy,z],[b,height+dy,v],dy===1?.057:.032,dy===1?brass:cream);
    const n=Math.ceil((v-z)/1.8);for(let k=0;k<n;k++){const f=k/n;piece(cyl,cream,a+(b-a)*f,height+.5,z+(v-z)*f,.035,1,.035);}
   }}
  beam([side*2.9,5.52,-5.1],[side*2.65,7.9,-6.4],.12,cream);
  piece(box,0xe1b77c,side*4.23,2.52,-5,.09,.1,11);
 }
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
 for(let i=0;i<12;i++)piece(box,wood,-2.55,2.47+i*.266,-15.6+i*.34,1.45,.16,.48);
 beam([-3.29,3.5,-15.7],[-3.29,6.29,-11.9],.07,brass);
 piece(cyl,cream,-1.44,11.19,4.45,.12,1.20,.12);piece(box,navy,-1.44,11.75,4.45,1.34,.09,.20);
 piece(ball,cream,1.49,10.97,4.2,.43,.38,.43);
 // Open companionway from the aft promenade to the flybridge helm.
 for(let i=0;i<11;i++)piece(box,wood,1.7,5.48+i*.233,-9.45+i*.38,1.18,.15,.48);
 beam([2.32,6.32,-9.65],[2.32,8.63,-5.55],.045,brass);
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

 for(const {geo,c,ms} of batches.values()){const m=new T.InstancedMesh(geo,material(c),ms.length);ms.forEach((a,i)=>m.setMatrixAt(i,a));root.add(m);}
 return root;
}
