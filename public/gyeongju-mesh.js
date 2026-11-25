import * as T from "three";

export function randomSeed(seed){
 return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
export function localFrame(x,z,yaw=0){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return (across,along)=>({x:x+across*c+along*s,z:z-across*s+along*c});
}

// Static pieces share both geometry and material. Small spatial batches let the
// renderer discard entire streets, including the distant KTX forecourt.
export function districtMeshes(root){
 const cells=new Map(),o=new T.Object3D(),up=new T.Vector3(0,1,0);
 const materials=new Map(),labels=new Map(),box=new T.BoxGeometry(),post=new T.CylinderGeometry(.5,.5,1,10);
 const oval=new T.IcosahedronGeometry(1,1),plane=new T.PlaneGeometry(),rough=new T.MeshStandardMaterial({roughness:.86,side:T.DoubleSide});
 function cell(x,z){
  const key=Math.floor(x/90)+","+Math.floor(z/90);
  let value=cells.get(key);
  if(!value){value={batches:new Map(),surfaces:new Map()};cells.set(key,value);}
  return value;
 }
 function add(geo,mat,color,x,y,z,w,h,d,yaw=0,pitch=0,roll=0,quaternion){
  const batches=cell(x,z).batches,key=geo.id+"/"+mat.id;
  let b=batches.get(key);
  if(!b){b={geo,mat,parts:[]};batches.set(key,b);}
  o.position.set(x,y,z);o.scale.set(w,h,d);
  if(quaternion)o.quaternion.copy(quaternion);else o.rotation.set(pitch,yaw,roll,"YXZ");
  o.updateMatrix();b.parts.push([o.matrix.clone(),color]);
 }
 const piece=(x,y,z,w,h,d,color,yaw=0,pitch=0,roll=0)=>add(box,rough,color,x,y,z,w,h,d,yaw,pitch,roll);
 const column=(x,y,z,w,h,d,color)=>add(post,rough,color,x,y,z,w,h,d);
 const crown=(x,y,z,w,h,d,color,yaw=0)=>add(oval,rough,color,x,y,z,w,h,d,yaw);
 const geo=(geometry,x,y,z,w,h,d,color,yaw=0,mat=rough)=>add(geometry,mat,color,x,y,z,w,h,d,yaw);
 function beam(a,b,r,color){
  const v=new T.Vector3(b.x-a.x,b.y-a.y,b.z-a.z),len=v.length();
  if(len<.002)return;
  const q=new T.Quaternion().setFromUnitVectors(up,v.multiplyScalar(1/len));
  add(post,rough,color,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,r*2,len,r*2,0,0,0,q);
 }
 // A shared world-aligned texture prevents seams where two paved paths meet.
 function paving(kind){
  if(materials.has(kind))return materials.get(kind);
  const cv=document.createElement("canvas");cv.width=cv.height=128;
  const ctx=cv.getContext("2d"),rng=randomSeed(9173),img=ctx.createImageData(128,128);
  for(let i=0;i<img.data.length;i+=4){
   const light=kind==="grass"?211+rng()*43:223+rng()*32;
   img.data[i]=light;img.data[i+1]=light;img.data[i+2]=light;img.data[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  if(kind==="pavers"){
   ctx.strokeStyle="#b9b8b5";ctx.lineWidth=2;
   for(let y=0;y<128;y+=32){
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);
    for(let x=(y/32%2)*32;x<128;x+=64){ctx.moveTo(x,y);ctx.lineTo(x,y+32);}
    ctx.stroke();
   }
  }else if(kind==="grass"){
   ctx.strokeStyle="rgba(121,123,113,.27)";
   for(let i=0;i<700;i++){const x=rng()*128,y=rng()*128;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+1.6,y-2.2);ctx.stroke();}
  }
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;
  const mat=new T.MeshStandardMaterial({vertexColors:true,map:tex,roughness:1,side:T.DoubleSide});materials.set(kind,mat);return mat;
 }
 const plain=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.90});
 function face(vertices,indices,color,kind){
  if(vertices.length===0)return;
  const mat=kind?paving(kind):plain,store=cell(vertices[0][0],vertices[0][2]).surfaces;
  // Coplanar road and sidewalk polygons must not write into the sun's depth map.
  const shadow=vertices.some(v=>v[1]>.20),key=mat.id+":"+shadow;
  let b=store.get(key);
  if(!b){b={mat,shadow,pos:[],uv:[],col:[],idx:[]};store.set(key,b);}
  const off=b.pos.length/3,tint=new T.Color(color),unit=kind==="pavers"?1.32:3.8;
  for(const [x,y,z] of vertices){b.pos.push(x,y,z);b.uv.push(x/unit,z/unit);b.col.push(tint.r,tint.g,tint.b);}
  for(const i of indices)b.idx.push(off+i);
 }
 function polygon(points,y,color,kind){
  if(points.length<3)return;
  const loop=points.filter((p,i)=>!i||p.x!==points[i-1].x||p.z!==points[i-1].z);
  if(loop.length>2&&loop[0].x===loop.at(-1).x&&loop[0].z===loop.at(-1).z)loop.pop();
  const vec=loop.map(p=>new T.Vector2(p.x,-p.z));
  face(loop.map(p=>[p.x,y,p.z]),T.ShapeUtils.triangulateShape(vec,[]).flat(),color,kind);
 }
 function strip(points,width,y,color,kind){
  if(points.length<2)return;
  const sides=points.map((p,i)=>{
   const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
   const ax=p.x-a.x,az=p.z-a.z,bx=b.x-p.x,bz=b.z-p.z,la=Math.hypot(ax,az)||1,lb=Math.hypot(bx,bz)||1;
   const nx=az/la+bz/lb,nz=-ax/la-bx/lb,l=Math.hypot(nx,nz)||1;
   const mx=nx/l,mz=nz/l,dot=i===points.length-1?1:Math.abs(mx*bz/lb-mz*bx/lb);
   const r=width*.5/Math.max(.62,dot);
   return [[p.x+mx*r,y,p.z+mz*r],[p.x-mx*r,y,p.z-mz*r]];
  });
  for(let i=1;i<sides.length;i++)face([...sides[i-1],...sides[i]], [0,1,2,1,3,2],color,kind);
 }
 function sign(text,x,y,z,w,h,yaw,background="#31504c",ink="#fff4d8"){
  const key=[text,background,ink].join("/");
  let mat=labels.get(key);
  if(!mat){
   const c=document.createElement("canvas");c.width=512;c.height=128;const ctx=c.getContext("2d");
   ctx.fillStyle=background;ctx.fillRect(0,0,512,128);ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.strokeRect(6,6,500,116);
   ctx.fillStyle=ink;ctx.textAlign="center";ctx.textBaseline="middle";ctx.font='600 74px "Malgun Gothic", sans-serif';ctx.fillText(text,256,66,478);
   const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
   mat=new T.MeshStandardMaterial({map,roughness:.8,side:T.FrontSide});labels.set(key,mat);
  }
  add(plane,mat,0xffffff,x,y,z,w,h,1,yaw);
 }
 function finish(){
  const tint=new T.Color();
  for(const c of cells.values()){
   for(const b of c.surfaces.values()){
    const g=new T.BufferGeometry();
    g.setAttribute("position",new T.Float32BufferAttribute(b.pos,3));g.setAttribute("uv",new T.Float32BufferAttribute(b.uv,2));
    g.setAttribute("color",new T.Float32BufferAttribute(b.col,3));g.setIndex(b.idx);g.computeVertexNormals();g.computeBoundingSphere();
    const mesh=new T.Mesh(g,b.mat);mesh.receiveShadow=true;mesh.castShadow=b.shadow;root.add(mesh);
    mesh.userData.viewRange=Infinity;
   }
   for(const {geo,mat,parts} of c.batches.values()){
    const m=new T.InstancedMesh(geo,mat,parts.length);
    parts.forEach(([matrix,color],i)=>{m.setMatrixAt(i,matrix);m.setColorAt(i,tint.set(color));});
    m.computeBoundingSphere();m.castShadow=geo!==plane&&!mat.transparent;m.receiveShadow=true;root.add(m);
    m.userData.viewRange=geo===box||geo===post||geo===plane?245:530;
   }
  }
  cells.clear();
 }
 return {piece,column,crown,geo,beam,face,polygon,strip,sign,finish};
}
