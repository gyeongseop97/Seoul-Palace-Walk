import {gradePalaceMeshes,groundPiece} from "./gyeongbok-terrain.js";

// Pieces that touch each other form one object: a gate, a lantern on its base, a statue.
// Lifting each piece by the ground under its own centre shears the object on a slope, so
// every such cluster is anchored at one point and rises as a whole.
function anchorClusters(T,objects,terrain){
  const box=new T.Box3(),pieces=[];
  for(const object of objects){
    // Shrubs grow where they stand, each on its own patch of ground.
    if(object.userData.followTerrain||object.name==="Garden shrub")continue;
    box.setFromObject(object);
    if(box.isEmpty())continue;
    pieces.push({object,min:box.min.toArray(),max:box.max.toArray(),x:object.position.x,z:object.position.z});
  }
  const parent=pieces.map((_,index)=>index),cells=new Map(),size=6;
  const find=index=>{while(parent[index]!==index)index=parent[index]=parent[parent[index]];return index;};
  const touches=(a,b)=>[0,1,2].every(axis=>a.min[axis]<=b.max[axis]+.03&&b.min[axis]<=a.max[axis]+.03);
  // Anything longer than a building is a wall or a path; it should not tie its neighbours together.
  const compact=piece=>Math.max(piece.max[0]-piece.min[0],piece.max[2]-piece.min[2])<=20;
  pieces.forEach((piece,index)=>{
    if(!compact(piece))return;
    for(let col=Math.floor(piece.min[0]/size);col<=Math.floor(piece.max[0]/size);col++){
      for(let row=Math.floor(piece.min[2]/size);row<=Math.floor(piece.max[2]/size);row++){
        const key=col+","+row,cell=cells.get(key)??cells.set(key,[]).get(key);
        for(const other of cell)if(find(other)!==find(index)&&touches(piece,pieces[other]))parent[find(index)]=find(other);
        cell.push(index);
      }
    }
  });
  const clusters=new Map();
  pieces.forEach((piece,index)=>{
    if(!compact(piece))return;
    const root=find(index);
    (clusters.get(root)??clusters.set(root,[]).get(root)).push(piece);
  });
  for(const cluster of clusters.values()){
    if(cluster.length<2)continue;
    const span=axis=>Math.max(...cluster.map(piece=>piece.max[axis]))-Math.min(...cluster.map(piece=>piece.min[axis]));
    if(span(0)>20||span(2)>20)continue;
    // Steps and beds laid down a steep bank are meant to follow it piece by piece.
    const lifts=cluster.map(piece=>terrain({x:piece.x+300,y:piece.z+225}));
    if(Math.max(...lifts)-Math.min(...lifts)>.5)continue;
    // Stand the cluster on the ground under the middle of the pieces that reach it.
    const base=Math.min(...cluster.map(piece=>piece.min[1]));
    const footing=cluster.filter(piece=>piece.min[1]<=base+.3);
    const x=footing.reduce((sum,piece)=>sum+(piece.min[0]+piece.max[0])/2,0)/footing.length;
    const z=footing.reduce((sum,piece)=>sum+(piece.min[2]+piece.max[2])/2,0)/footing.length;
    for(const {object} of cluster)object.userData.terrainAnchor={x:x+300,y:z+225};
  }
}

export function* gradeJeongdongMeshes(T,root,terrain,{trees=[],catWalls=[]}={}){
  function* grade(objects){
    const ordinary=[];
    for(const object of objects){
      const {gradeChildren,terrainAnchor,terrainWallSpan,flatBackground}=object.userData;
      if(gradeChildren){
        yield* grade(object.children);
      }else if(terrainAnchor){
        object.position.y+=terrain(terrainAnchor);
      }else if(terrainWallSpan){
        const {a,b,length}=terrainWallSpan;
        const start=terrain(a),end=terrain(b);
        object.position.y+=(start+end)/2;
        object.updateMatrix();
        // Only the wall's horizontal span rises. Posts and masonry stay vertical.
        object.matrix.elements[1]=(end-start)/length;
        object.matrixAutoUpdate=false;
      }else if(flatBackground){
        object.position.y=-8;
      }else{
        groundPiece(T,object);
        ordinary.push(object);
      }
    }
    anchorClusters(T,ordinary,terrain);
    yield* gradePalaceMeshes(T,ordinary,terrain);
  }
  yield* grade(root.children);
  for(const tree of trees)if(tree.top)tree.top.y+=terrain({x:tree.x+300,y:tree.z+225});
  for(const wall of catWalls)wall.groundAt=terrain;
  const material=new T.MeshStandardMaterial({color:0x777650,roughness:1});
  material.userData.seasonFoliage="ground";
  const patch=64,edge=485;
  for(let top=-12;top<451;top+=patch){
    for(let left=-47;left<edge;left+=patch){
      const width=Math.min(patch,edge-left);
      const geometry=new T.PlaneGeometry(width,patch);
      geometry.rotateX(-Math.PI/2);
      const tile=new T.Mesh(geometry,material);tile.receiveShadow=true;
      tile.position.set(left+width/2-300,-.20,top+patch/2-225);
      tile.userData.followTerrain=true;
      yield* gradePalaceMeshes(T,[tile],terrain);
      root.add(tile);
    }
    yield;
  }
}
