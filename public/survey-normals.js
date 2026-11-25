// Survey models arrive without normals and would be shaded one hard facet at a time. This
// rebuilds them so neighbouring faces blend smoothly while real edges (eaves, columns,
// steps) stay crisp.
export function smoothSurveyNormals(T,geometry,visitCorner,creaseDegrees=48){
  const source=geometry.index?geometry.toNonIndexed():geometry;
  const position=source.attributes.position,count=position.count,faces=count/3;
  const faceNormal=new Float32Array(faces*3),unit=new Float32Array(faces*3);
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  const around=new Map();
  for(let face=0;face<faces;face++){
    a.fromBufferAttribute(position,face*3);b.fromBufferAttribute(position,face*3+1);c.fromBufferAttribute(position,face*3+2);
    b.sub(a);c.sub(a);b.cross(c);
    faceNormal[face*3]=b.x;faceNormal[face*3+1]=b.y;faceNormal[face*3+2]=b.z;
    const length=b.length()||1;
    unit[face*3]=b.x/length;unit[face*3+1]=b.y/length;unit[face*3+2]=b.z/length;
    for(let corner=0;corner<3;corner++){
      const i=face*3+corner,key=position.getX(i)+"/"+position.getY(i)+"/"+position.getZ(i);
      const list=around.get(key);
      if(list)list.push(face);else around.set(key,[face]);
    }
  }
  const limit=Math.cos(creaseDegrees*Math.PI/180),normals=new Float32Array(count*3);
  for(let face=0;face<faces;face++){
    const ux=unit[face*3],uy=unit[face*3+1],uz=unit[face*3+2];
    for(let corner=0;corner<3;corner++){
      const i=face*3+corner,key=position.getX(i)+"/"+position.getY(i)+"/"+position.getZ(i);
      let x=0,y=0,z=0;
      const candidates=around.get(key),accepted=visitCorner?[]:null;
      for(const other of candidates){
        if(ux*unit[other*3]+uy*unit[other*3+1]+uz*unit[other*3+2]<limit)continue;
        if(accepted)accepted.push(other);
        x+=faceNormal[other*3];y+=faceNormal[other*3+1];z+=faceNormal[other*3+2];
      }
      const length=Math.hypot(x,y,z)||1;
      normals[i*3]=x/length;normals[i*3+1]=y/length;normals[i*3+2]=z/length;
      if(visitCorner)visitCorner(i,candidates,accepted,normals);
    }
  }
  source.setAttribute("normal",new T.BufferAttribute(normals,3));
  return source;
}

// The scan stores its original positions and faces. The offline bake resolves
// the costly search for neighbours meeting the 48-degree crease rule. At load
// time we only add the selected face vectors and normalize, exactly as above.
export const normalChoice={face:0,all:1,previous:2,mask:3,zero:4};

export function surveyIndexHash(index){
  let hash=2166136261;
  for(const vertex of index)hash=Math.imul(hash^vertex,16777619);
  return hash>>>0;
}

function* expandNormals(T,geometry,bytes){
  const vertices=geometry.attributes.position.count,index=geometry.index.array;
  const weld=new Uint32Array(vertices),head=new Int32Array(vertices).fill(-1);
  const next=new Int32Array(index.length),previous=new Int32Array(vertices).fill(-1);
  let offset=0;
  // The first stream links vertices duplicated at a UV/material seam to the
  // first vertex at the same position, using unsigned backward distances.
  for(let i=0;i<vertices;i++){
    let distance=0,scale=1;
    for(;;){
      const byte=bytes[offset++];
      if(byte===undefined||scale>2**28)throw Error("Invalid survey vertex");
      distance+=(byte&127)*scale;
      if(byte<128)break;
      scale*=128;
    }
    if(distance>i)throw Error("Invalid survey weld");
    weld[i]=i-distance;
    if((i&8191)===8191)yield;
  }
  // Visiting corners backwards builds each adjacency list in original face
  // order, preserving floating-point summation at seams and degenerate faces.
  for(let i=index.length-1;i>=0;i--){
    const vertex=weld[index[i]];
    next[i]=head[vertex];head[vertex]=i;
    if((i&8191)===0)yield;
  }
  const result=geometry.toNonIndexed(),position=result.attributes.position;
  const areas=new Float32Array(index.length),normals=new Float32Array(index.length*3);
  for(let face=0;face<index.length;face+=3){
    const x=position.getX(face),y=position.getY(face),z=position.getZ(face);
    const ax=position.getX(face+1)-x,ay=position.getY(face+1)-y,az=position.getZ(face+1)-z;
    const bx=position.getX(face+2)-x,by=position.getY(face+2)-y,bz=position.getZ(face+2)-z;
    areas[face]=ay*bz-az*by;areas[face+1]=az*bx-ax*bz;areas[face+2]=ax*by-ay*bx;
    if((face&4095)===0)yield;
  }
  for(let i=0;i<index.length;i++){
    if((i&4095)===0)yield;
    const vertex=weld[index[i]],last=previous[vertex],start=3*i,choice=bytes[offset++];
    previous[vertex]=start;
    if(choice===normalChoice.zero)continue;
    if(choice===normalChoice.previous){
      if(last<0)throw Error("Missing survey normal");
      normals[start]=normals[last];normals[start+1]=normals[last+1];normals[start+2]=normals[last+2];
      continue;
    }
    let x=0,y=0,z=0;
    if(choice===normalChoice.face){
      const face=i-i%3;x=areas[face];y=areas[face+1];z=areas[face+2];
    }else{
      if(choice!==normalChoice.all&&choice!==normalChoice.mask)throw Error("Invalid survey face group");
      let bit=0,mask=0;
      for(let corner=head[vertex];corner>=0;corner=next[corner]){
        if(choice===normalChoice.mask){
          if(bit%8===0)mask=bytes[offset++];
          if(!(mask&(1<<(bit++%8))))continue;
        }
        const face=corner-corner%3;
        x+=areas[face];y+=areas[face+1];z+=areas[face+2];
      }
    }
    const length=Math.hypot(x,y,z)||1;
    normals[start]=(x||0)/length;normals[start+1]=(y||0)/length;normals[start+2]=(z||0)/length;
  }
  if(offset!==bytes.length)throw Error("Invalid survey stream length");
  result.setAttribute("normal",new T.BufferAttribute(normals,3));return result;
}

export async function restoreSurveyNormals(T,geometry,parser){
  const recipe=geometry.userData.surveyLighting;
  if(recipe?.version!==1||typeof DecompressionStream!=="function"||!geometry.index||
    recipe.vertices!==geometry.attributes.position.count||recipe.corners!==geometry.index.count||
    recipe.indexHash!==surveyIndexHash(geometry.index.array))return null;
  try{
    const zipped=await parser.getDependency("bufferView",recipe.bufferView);
    const stream=new Blob([zipped]).stream().pipeThrough(new DecompressionStream("gzip"));
    const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
    const steps=expandNormals(T,geometry,bytes);
    let slice=performance.now();
    for(let step=steps.next();;step=steps.next()){
      if(step.done)return step.value;
      if(performance.now()-slice>=6){
        if(globalThis.scheduler?.yield)await globalThis.scheduler.yield();
        else await new Promise(resolve=>setTimeout(resolve,0));
        slice=performance.now();
      }
    }
  }catch{return null;}
}
