const plushColors={
  bear:[0xc49357,0xb47756,0xe3bb7c],rabbit:[0xddafc9,0xb49cd7,0xe9d5ca],cat:[0xa9a7d4,0xd69262,0x8da9bf],
  duck:[0xf6ce68,0xeaa85f,0xffdc8b],panda:[0xe4ded4,0xd2cbd6,0xdadeda],star:[0xf9d783,0xefadad,0x90c9bc],
  frog:[0x9cc487,0x78b395,0xb2cc71],penguin:[0x647889,0x8682a6,0x6397a5]
};

const factories=new WeakMap();
export function createPlush(T,type,variant=0){
  if(!factories.has(T))factories.set(T,buildFactory(T));
  return factories.get(T)(type,variant);
}
function buildFactory(T){
  const plushGeometries=new Map(),cream=0xf2d5ab;
  const shape=(geometry,color,x,y,z,parent)=>{
    const m=new T.Object3D();m.geometry=geometry;m.material={color:new T.Color(color)};m.position.set(x,y,z);parent.add(m);return m;
  };
  const plushMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.94});
  const plushOval=new T.SphereGeometry(1,10,8);
  const starchip=new T.Shape();
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5+Math.PI/2,rad=i%2?.094:.177;
    if(i===0)starchip.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);
    else starchip.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);
  }
  starchip.closePath();
  const star=new T.ExtrudeGeometry(starchip,{depth:.082,bevelEnabled:true,bevelThickness:.016,bevelSize:.014,bevelSegments:1});
  const ear=new T.ConeGeometry(1,1,12);
  function makePlushGeometry(type,variant){
    const parts=new T.Group();
    const color=plushColors[type][variant];
    const stuffed=(tint,x,y,z,w,h,d)=>{
      const model=shape(plushOval,tint,x,y,z,parts);
      model.scale.set(w,h,d);return model;
    };
    const starFace=type==="star",penguin=type==="penguin",frog=type==="frog";
    const panda=type==="panda",duck=type==="duck";
    if(starFace)shape(star,color,0,.165,-.037,parts);
    else{
      stuffed(color,0,.115,0,.109,.117,.098);
      stuffed(panda||penguin?0xece4db:cream,0,.112,.082,.067,.078,.019);
      stuffed(color,0,.241,-.003,frog?.131:.118,frog?.085:.103,.103);
      for(const s of [-1,1]){
        const feet=panda?0x525456:penguin||duck?0xe5a25c:color;
        stuffed(feet,s*.081,.047,.061,.041,.049,.050);
        stuffed(panda?0x56595f:color,s*.101,.126,.017,.043,.079,.044).rotation.z=s*.42;
        if(!duck&&!penguin){
          if(type==="cat"){
            shape(ear,color,s*.071,.321,-.031,parts).scale.set(.038,.096,.035);
            stuffed(0xe8b6ad,s*.072,.321,-.006,.023,.035,.009);
          }else{
            const rabbit=type==="rabbit",earY=rabbit?.352:frog?.296:.308;
            stuffed(panda?0x525456:color,s*.077,earY,-.027,.043,rabbit?.093:.047,.041).rotation.z=s*-.24;
            if(rabbit||type==="bear")stuffed(0xe6acaa,s*.079,earY,.006,.024,rabbit?.069:.024,.013).rotation.z=s*-.24;
          }
        }
        if(panda||penguin)stuffed(panda?0x55585b:0xeee3d5,s*.049,.242,.082,.042,.041,.029).rotation.z=s*.24;
      }
      stuffed(duck||penguin?0xd88353:frog?0x6c966d:0x775750,0,.211,.103,duck?.055:penguin?.035:.023,.018,.030);
      if(type==="bear"||type==="rabbit")stuffed(0xaa665b,-.083,.089,.091,.018,.025,.006).rotation.z=-.18;
    }
    for(const s of [-1,1]){
      const eyeY=starFace?.175:frog?.265:.251,eyeZ=starFace?.055:panda||penguin?.110:.101;
      stuffed(0x453d40,s*.051,eyeY,eyeZ,.013,.018,.011);
      stuffed(0xf6ece7,s*.051-.005,eyeY+.006,eyeZ+.010,.005,.005,.004);
      stuffed(0xe69183,s*.070,eyeY-.033,eyeZ-.001,.018,.010,.009);
    }
    const positions=[],normals=[],colors=[],indices=[];
    const point=new T.Vector3(),normal=new T.Vector3(),normalMatrix=new T.Matrix3();
    for(const part of parts.children){
      part.updateMatrix();
      normalMatrix.getNormalMatrix(part.matrix);
      const geometry=part.geometry,{position,normal:sourceNormal}=geometry.attributes;
      const offset=positions.length/3;
      const tint=part.material.color;
      for(let i=0;i<position.count;i++){
        point.fromBufferAttribute(position,i).applyMatrix4(part.matrix);
        normal.fromBufferAttribute(sourceNormal,i).applyNormalMatrix(normalMatrix);
        positions.push(point.x,point.y,point.z);normals.push(normal.x,normal.y,normal.z);
        colors.push(tint.r,tint.g,tint.b);
        if(!geometry.index)indices.push(offset+i);
      }
      if(geometry.index)for(const index of geometry.index.array)indices.push(offset+index);
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute("normal",new T.Float32BufferAttribute(normals,3));
    geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);
    return geometry;
  }
  return (type,variant)=>{
    const key=type+"-"+variant;
    if(!plushGeometries.has(key))plushGeometries.set(key,makePlushGeometry(type,variant));
    const plush=new T.Mesh(plushGeometries.get(key),plushMaterial);
    return plush;
  };
}
