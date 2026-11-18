// Keep the walkable terrace and floors underneath the measured timber facade.
const shellCutoff={junghwajeon:1.79,hamnyeongjeon:1.32,seogeodang:.90};
// The pavilion's stair and railing scans are intact above the base.
const groundCutoff={jeonggwanheon:-.08};

export function prepareSurveyTerrain(T,asset,name,models){
  const minHeight=name==="gyeonghoeru"?.24:shellCutoff[name]??groundCutoff[name];
  if(minHeight==null)return models;
  const replaced=shellCutoff[name]!=null?models.flatMap(model=>model.userData.surveyShell??[]):models;
  if(!replaced.length)throw Error("Missing modeled survey components");

  asset.updateMatrixWorld(true);
  const position=new T.Vector3(),inverse=asset.matrixWorld.clone().invert(),matrix=new T.Matrix4();
  let retained=0;
  asset.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry,index=geometry.index,vertices=geometry.getAttribute("position");
    const heights=new Float32Array(vertices.count);
    matrix.multiplyMatrices(inverse,mesh.matrixWorld);
    for(let vertex=0;vertex<vertices.count;vertex++){
      heights[vertex]=position.fromBufferAttribute(vertices,vertex).applyMatrix4(matrix).y;
    }
    const triangles=[];
    for(let face=0,count=index?.count??vertices.count;face<count;face+=3){
      const a=index?.getX(face)??face,b=index?.getX(face+1)??face+1,c=index?.getX(face+2)??face+2;
      if(Math.min(heights[a],heights[b],heights[c])>=minHeight)triangles.push(a,b,c);
    }
    geometry.setIndex(triangles);
    retained+=triangles.length;
  });
  if(!retained)throw Error("Missing survey geometry above the floor");
  return replaced;
}

// Some scans keep their own lawn, steps and paving. This records how high that surface
// lies around the building so walkers stand on it instead of wading through it.
export function surveyGroundField(T,asset,base,cell=.4){
  asset.updateMatrixWorld(true);
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),heights=new Map();
  const key=(col,row)=>col*65536+row;
  const raise=(col,row,height)=>{
    const id=key(col,row);
    if(!(heights.get(id)>=height))heights.set(id,height);
  };
  asset.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const index=mesh.geometry.index,position=mesh.geometry.getAttribute("position"),matrix=mesh.matrixWorld;
    for(let face=0,count=index?.count??position.count;face<count;face+=3){
      a.fromBufferAttribute(position,index?.getX(face)??face).applyMatrix4(matrix);
      b.fromBufferAttribute(position,index?.getX(face+1)??face+1).applyMatrix4(matrix);
      c.fromBufferAttribute(position,index?.getX(face+2)??face+2).applyMatrix4(matrix);
      if(Math.max(a.y,b.y,c.y)>base+.7||Math.min(a.y,b.y,c.y)<base-.4)continue;
      // Only surfaces that face up: walls and column drums are left out.
      const abx=b.x-a.x,aby=b.y-a.y,abz=b.z-a.z,acx=c.x-a.x,acy=c.y-a.y,acz=c.z-a.z;
      const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx,length=Math.hypot(nx,ny,nz);
      if(!length||Math.abs(ny)/length<.7)continue;
      raise(Math.floor((a.x+b.x+c.x)/3/cell),Math.floor((a.z+b.z+c.z)/3/cell),(a.y+b.y+c.y)/3);
      const area=abz*acx-abx*acz;
      for(let col=Math.floor(Math.min(a.x,b.x,c.x)/cell),last=Math.floor(Math.max(a.x,b.x,c.x)/cell);col<=last;col++){
        for(let row=Math.floor(Math.min(a.z,b.z,c.z)/cell),end=Math.floor(Math.max(a.z,b.z,c.z)/cell);row<=end;row++){
          const px=(col+.5)*cell-a.x,pz=(row+.5)*cell-a.z;
          const u=(pz*acx-px*acz)/area,v=(abz*px-abx*pz)/area;
          if(u>=0&&v>=0&&u+v<=1)raise(col,row,a.y+aby*u+acy*v);
        }
      }
    }
  });
  return (x,z)=>heights.get(key(Math.floor(x/cell),Math.floor(z/cell)));
}
