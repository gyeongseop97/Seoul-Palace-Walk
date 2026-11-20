import * as T from "three";
// A 39 m excursion yacht with an open teak stern, glazed salon and flybridge.
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
 const stations=[[-18,.70],[-15,.95],[-9,1],[0,1],[8,.94],[13,.76],[17,.44],[20,.035]];
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
 shell([[2.47,4.0,-9,13],[2.96,4.12,-9.2,13]],cream);
 shell([[2.96,4.12,-9.2,13],[5.0,3.92,-8.6,12.2]],glass);
 shell([[5.0,4.53,-13.4,13.25],[5.38,4.44,-13.35,13.1]],cream);
 shell([[5.39,4.28,-13.1,12.8],[5.43,4.28,-13.1,12.8]],wood);
 shell([[5.44,3.47,-5.4,10.2],[5.89,3.56,-5.5,10.3]],cream);
 shell([[5.89,3.56,-5.5,10.3],[7.5,3.15,-4.9,9.45]],0x25495c);
 shell([[7.51,3.75,-7.25,10.45],[7.84,3.66,-7.13,10.3]],cream);
 for(const side of [-1,1]){
  for(let i=0;i<7;i++)piece(box,cream,side*3.99,3.95,-6.9+i*1.95,.12,2.03,.13,.10);
  for(let i=0;i<4;i++)piece(box,cream,side*3.36,6.7,-3.5+i*1.55,.15,1.55,.16,.15);
  for(let i=0;i<12;i++){const m=0.78+.22*Math.sin((i+1)/14*Math.PI);piece(ball,0x7c9cab,side*5.01*m,1.18,-13+i*2.04,.17,.23,.39);}
  for(const [height,w,z0,z1] of [[2.48,5.05,-17.8,19.5],[5.44,4.26,-13.05,12.75]]){
   const edge=outline(w,z0,z1);for(let i=1;i<edge.length;i++){const [x,z]=edge[i-1],[u,v]=edge[i],a=x*side,b=u*side;
    for(const dy of [.49,1])beam([a,height+dy,z],[b,height+dy,v],dy===1?.057:.032,dy===1?brass:cream);
    const n=Math.ceil((v-z)/1.8);for(let k=0;k<n;k++){const f=k/n;piece(cyl,cream,a+(b-a)*f,height+.5,z+(v-z)*f,.035,1,.035);}
   }}
  for(const z of [-12,-9]){piece(box,0xc88c68,side*2.7,5.78,z,1.6,.44,1.2);piece(box,cream,side*2.7,6.03,z-.55,1.6,.56,.19);}
  beam([side*2.9,5.52,-5.1],[side*2.65,7.9,-6.4],.12,cream);
  piece(box,0xe1b77c,side*4.23,2.52,-5,.09,.1,11);
 }
 for(let i=0;i<11;i++)piece(box,wood,-2.55,2.55+i*.276,-15.5+i*.35,1.45,.18,.48);
 beam([-3.29,3.5,-15.7],[-3.29,6.29,-11.9],.07,brass);
 piece(cyl,cream,0,8.65,1,.19,1.8,.19);piece(box,navy,0,9.55,1,2.8,.12,.34);piece(ball,cream,-1.1,8.49,-.9,.66,.65,.66);
 for(const x of [-1.8,1.8])piece(ball,cream,x,8.16,4,.31,.27,.31);
 for(let i=0;i<3;i++)piece(box,cream,-2+i*2,2.75,-15,1.35,.45,.89);
 // A raised helm, upholstered loungers and low tables give the upper decks a human scale.
 piece(box,cream,0,8.25,7.5,2.85,.78,.61);piece(box,glass,0,8.72,7.52,2.32,.31,.25,-.28);
 piece(box,navy,0,8.48,6.77,.7,.18,.55);piece(box,cream,0,8.72,6.47,.7,.54,.13);
 const wheel=new T.Mesh(new T.TorusGeometry(.24,.026,8,20),material(brass));wheel.position.set(-.46,8.65,7.13);wheel.rotation.x=-.27;root.add(wheel);
 for(const sign of [-1,1]){for(const z of [-12.2,-9.4]){piece(box,wood,sign*3.16,5.59,z,1.08,.24,1.84);piece(box,cream,sign*3.16,5.78,z,1.01,.22,1.65);piece(box,0x497b81,sign*3.16,5.92,z+.5,.86,.14,.45);}}

 for(const {geo,c,ms} of batches.values()){const m=new T.InstancedMesh(geo,material(c),ms.length);ms.forEach((a,i)=>m.setMatrixAt(i,a));root.add(m);}
 return root;
}
