import {gbEastWallX,gbOuterWallRuns,insideGbWall,onGbWestPath} from "./gyeongbok-perimeter.js";
import {court,courtAngle,hall,middle,palacePond,pavilions,stoneFountain,stoneHall,ticket} from "./layout.js";
import {plazaSites} from "./plaza-layout.js";

const gate=plazaSites.gate;
// Smoothed elevations in metres from the public 30 m SRTM surface. Ponds and
// their banks share a level within each basin.
const palaceProfile=[[0,0],[120,.65],[225,2.8],[320,4.25],[370,5.4],[480,7.2],
  [560,10.8],[625,13.8],[665,15.8],[749,15.8],[820,19.2],[880,21.1]];
const samcheongProfile=[[-890,0],[-1030,1],[-1145,.8],[-1280,2],[-1400,3],[-1515,6],[-1660,12],[-1780,16],[-1890,18]];
const sejongProfile=[[-905,0],[-840,.1],[-750,-.3],[-620,-.75],[-495,-1.2],[-355,-1.85],
  [-260,-2.7],[-130,-4.3],[-45,-4.8],[35,-3.95],[115,-3.35],[205,-3.1],[295,-3.15],[450,-2.7]];
const gardenProfile=[[6,6.1],[70,5.4],[140,4.3],[216,3.05],[300,2.0],[386,.9],[450,.2]];
// The northeast corner continues beyond the surveyed Samcheong-ro wall run.
const northeastBlend=gbOuterWallRuns[1].slice(0,4).map(({x,y})=>[y,x]);
const levelPads=[
  [stoneHall,34,24,.85],[stoneFountain,12,12,.90],[palacePond,23,23,.15],
  [court,20,13,-.20],[middle,13,13,-.26],[ticket,7,5,-3.16]
];
const clamp=value=>Math.max(0,Math.min(1,value));
const pavilion=name=>pavilions.find(site=>site.name===name);
const terracePads=[
  [hall,courtAngle,-24.1,23.6,-19.3,33.1,-.10],
  [pavilion("함녕전"),-.21,-19,19,-13,15,-.90],
  [pavilion("석어당"),-.20,-15,15,-9,10,1.84],
  [pavilion("정관헌"),-.04,-14,14,-10,13,.41]
].map(([site,angle,west,east,north,south,base])=>({site,cos:Math.cos(angle),sin:Math.sin(angle),west,east,north,south,base}));
function profileAt(value,profile,direction){
  for(let i=1;i<profile.length;i++){
    const [start,low]=profile[i-1],[end,high]=profile[i];
    if((value-end)*direction<=0)return low+(high-low)*clamp((value-start)/(end-start));
  }
  return profile.at(-1)[1];
}
export const samcheongLevel=y=>profileAt(y,samcheongProfile,-1);
// The southern avenue valley and the higher Jeongdong grounds join at the
// avenue sidewalks. Reduce SRTM building/foliage spikes to the street grade.
export function southWorldTerrainHeight({x,y}){
  const street=profileAt(y,sejongProfile,1);
  const west=clamp((485-x)/410);
  const south=clamp((y+200)/230);
  const garden=profileAt(y,gardenProfile,1)+west*4.5;
  let level=street+garden*clamp((474-x)/160)*south;
  const east=clamp((x-560)/200),sogong=clamp((y-155)/85)*clamp((490-y)/65);
  level+=east*sogong*2.6;
  for(const [site,w,d,base] of levelPads){
    const gap=Math.max(Math.abs(x-site.x)-w,Math.abs(y-site.y)-d,0);
    level+=(base-level)*clamp(1-gap/15);
  }
  // Each rotated stone terrace and its treads share the building datum.
  // Blend overlapping approaches, preserving the exact elevation inside a pad.
  let totalWeight=1,weightedHeight=level;
  for(const {site,cos,sin,west,east,north,south,base} of terracePads){
    const dx=x-site.x,dy=y-site.y;
    if(Math.abs(dx)>56||Math.abs(dy)>56)continue;
    const along=dx*sin+dy*cos,across=dx*cos-dy*sin;
    const gap=Math.max(west-across,across-east,north-along,along-south,0);
    if(!gap){totalWeight=1;weightedHeight=base;break;}
    const weight=Math.max(0,15/gap-1);
    totalWeight+=weight;
    weightedHeight+=base*weight;
  }
  level=weightedHeight/totalWeight;
  // Keep the plaza road and palace entrance at the same height.
  const gateBlend=clamp((y-gate.y)/55);
  return level*gateBlend;
}

export function outsideGroundOffset({x,y}){
  if(y>=gate.y)return southWorldTerrainHeight({x,y});
  return palaceGroundOffset(x,y);
}
export function gyeongbokTerrainHeight({x,y}){
  const north=gate.y-y;
  if(north<=0||north>910||Math.abs(x-gate.x)>330)return 0;
  const east=x-gate.x;
  let level=profileAt(north,palaceProfile,1);
  const terraceGap=Math.max(Math.abs(east)-31.5,Math.abs(north-300)-26.5,0);
  level+=(profileAt(300,palaceProfile,1)-level)*clamp(1-terraceGap/15);
  if(east>=-198&&east<=-59&&north>=353&&north<=495)level=6.2;
  else if(east>-219&&east<-39&&north>331&&north<517){
    const margin=Math.min(east+219,-39-east,north-331,517-north);
    level+=(6.2-level)*clamp(margin/22);
  }
  const boundary=gbEastWallX(y)??(y<=northeastBlend[0][0]?profileAt(y,northeastBlend,-1):null);
  const edge=boundary==null?0:clamp((x-boundary+74)/74)*clamp((845-north)/42);
  return level+(samcheongLevel(y)-level)*edge;
}

export function palaceGroundOffset(x,y){
  return insideGbWall(x,y)||onGbWestPath(x,y)?gyeongbokTerrainHeight({x,y}):0;
}

const terrainCell=8,terrainPatchCells=8,terrainPatchSize=terrainCell*terrainPatchCells;
const heightGrids=new WeakMap();
function terrainGrid(height){
  if(heightGrids.has(height))return heightGrids.get(height);
  const levels=new Map(),planes=new Map();
  function sample(x,z){
    const key=x+","+z;
    if(!levels.has(key))levels.set(key,height({x:x+300,y:z+225}));
    return levels.get(key);
  }
  function plane(x,z,size){
    const key=x+","+z+","+size;
    if(planes.has(key))return planes.get(key);
    const start=sample(x,z),dx=(sample(x+size,z)-start)/size,dz=(sample(x,z+size)-start)/size;
    const level=(a,b)=>start+(a-x)*dx+(b-z)*dz;
    let planar=true;
    for(let row=z;planar&&row<=z+size;row+=terrainCell){
      for(let col=x;col<=x+size;col+=terrainCell){
        if(Math.abs(sample(col,row)-level(col,row))>1e-8){planar=false;break;}
      }
    }
    planes.set(key,planar?level:null);
    return planes.get(key);
  }
  const grid={sample,plane};
  heightGrids.set(height,grid);
  return grid;
}

// Read the same triangle the mesh generator uses, including on a cell edge.
export function sampleMeshHeight(height,{x,y}){
  const grid=terrainGrid(height),sx=x-300,sz=y-225;
  const col=Math.floor(sx/terrainCell)*terrainCell,row=Math.floor(sz/terrainCell)*terrainCell;
  const u=(sx-col)/terrainCell,v=(sz-row)/terrainCell;
  return u+v<=1?
    grid.sample(col,row)*(1-u-v)+grid.sample(col+terrainCell,row)*u+grid.sample(col,row+terrainCell)*v:
    grid.sample(col+terrainCell,row+terrainCell)*(u+v-1)+grid.sample(col,row+terrainCell)*(1-u)+grid.sample(col+terrainCell,row)*(1-v);
}

// The same world-space grid must underlie ground, roads, paving and their
// markings. Independent triangle splits can put an upper layer below its base.
function clipTerrainPolygon(vertices,axis,limit,side){
  if(!vertices.length)return vertices;
  const measure=point=>((axis<0?point[0]+point[2]:point[axis])-limit)*side;
  if(side<0&&vertices.every(point=>measure(point)===0))return [];
  const clipped=[];
  let from=vertices.at(-1),start=measure(from);
  for(const to of vertices){
    const end=measure(to);
    if(start*end<0){
      const fraction=start/(start-end);
      clipped.push(from.map((value,index)=>value+(to[index]-value)*fraction));
    }
    if(end>=0)clipped.push(to);
    from=to;start=end;
  }
  return clipped;
}

function* drapeTerrainMesh(T,object,grid){
  object.updateMatrix();
  const matrix=object.matrix,inverse=matrix.clone().invert(),vertex=new T.Vector3();
  const old=object.geometry,{position,uv}=old.attributes;
  const points=[],vertices=[],texels=[],indices=[];
  let low=Infinity,high=-Infinity;
  for(let i=0;i<position.count;i++){
    vertex.fromBufferAttribute(position,i).applyMatrix4(matrix);
    const {x,y,z}=vertex;
    points.push([x,y,z,uv?.getX(i)??0,uv?.getY(i)??0]);
    low=Math.min(low,y);high=Math.max(high,y);
  }
  if(high-low<1e-5)object.userData.terrainSurface=true;

  function emitPolygon(polygon,height){
    const [a]=polygon;
    const corners=[];
    function corner(index){
      if(corners[index]!==undefined)return corners[index];
      const [x,y,z,u,v]=polygon[index];
      const offset=vertices.length/3;
      vertex.set(x,y+height(x,z),z).applyMatrix4(inverse);
      vertices.push(vertex.x,vertex.y,vertex.z);
      if(uv)texels.push(u,v);
      corners[index]=offset;
      return offset;
    }
    for(let i=1;i<polygon.length-1;i++){
      const b=polygon[i],c=polygon[i+1];
      const abx=b[0]-a[0],aby=b[1]-a[1],abz=b[2]-a[2];
      const acx=c[0]-a[0],acy=c[1]-a[1],acz=c[2]-a[2];
      if(Math.hypot(aby*acz-abz*acy,abz*acx-abx*acz,abx*acy-aby*acx)<1e-7)continue;
      indices.push(corner(0),corner(i),corner(i+1));
    }
  }
  function drapePatch(polygon,x,z,size){
    if(polygon.length<3)return;
    const level=grid.plane(x,z,size);
    if(level){emitPolygon(polygon,level);return;}
    if(size===terrainCell){
      const nw=grid.sample(x,z),ne=grid.sample(x+size,z);
      const sw=grid.sample(x,z+size),se=grid.sample(x+size,z+size);
      const diagonal=x+z+size;
      emitPolygon(clipTerrainPolygon(polygon,-1,diagonal,-1),(a,b)=>
        nw+(ne-nw)*(a-x)/size+(sw-nw)*(b-z)/size);
      emitPolygon(clipTerrainPolygon(polygon,-1,diagonal,1),(a,b)=>
        se+(sw-se)*(x+size-a)/size+(ne-se)*(z+size-b)/size);
      return;
    }
    const half=size/2;
    for(const east of [false,true]){
      const side=east?1:-1;
      const strip=clipTerrainPolygon(polygon,0,x+half,side);
      if(strip.length<3)continue;
      const col=east?x+half:x;
      drapePatch(clipTerrainPolygon(strip,2,z+half,-1),col,z,half);
      drapePatch(clipTerrainPolygon(strip,2,z+half,1),col,z+half,half);
    }
  }
  const index=old.index,faceCount=(index?.count??points.length)/3;
  const patchStart=value=>Math.floor(value/terrainPatchSize)*terrainPatchSize;
  for(let face=0;face<faceCount;face++){
    const i=face*3;
    const a=points[index?index.getX(i):i],b=points[index?index.getX(i+1):i+1],c=points[index?index.getX(i+2):i+2];
    const triangle=[a,b,c];
    const top=patchStart(Math.min(a[2],b[2],c[2])),bottom=Math.max(a[2],b[2],c[2]);
    const left=patchStart(Math.min(a[0],b[0],c[0])),right=Math.max(a[0],b[0],c[0]);
    if(bottom<top+terrainPatchSize&&right<left+terrainPatchSize)drapePatch(triangle,left,top,terrainPatchSize);
    else for(let z=top;z<=bottom;z+=terrainPatchSize){
      const lower=clipTerrainPolygon(triangle,2,z,1);
      const row=clipTerrainPolygon(lower,2,z+terrainPatchSize,-1);
      if(row.length<3)continue;
      const rowLeft=patchStart(Math.min(...row.map(point=>point[0]))),rowRight=Math.max(...row.map(point=>point[0]));
      for(let x=rowLeft;x<=rowRight;x+=terrainPatchSize){
        const east=clipTerrainPolygon(row,0,x,1);
        drapePatch(clipTerrainPolygon(east,0,x+terrainPatchSize,-1),x,z,terrainPatchSize);
      }
      yield;
    }
    if(face%64===63)yield;
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
  if(uv)geometry.setAttribute("uv",new T.Float32BufferAttribute(texels,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  object.geometry=geometry;
  if(!object.userData.sharedTerrainGeometry)old.dispose();
}

// The pavilion and trees stand upright, while paving and long walls conform.
export const palaceMeshHeight=point=>point.y>=gate.y?southWorldTerrainHeight(point):gyeongbokTerrainHeight(point);
export function* gradePalaceMeshes(T,objects,height=palaceMeshHeight){
  const grid=terrainGrid(height);
  let count=0;
  for(const object of objects){
    if(object.userData.flatBackground)continue;
    if(object.userData.terrainAnchor){
      object.position.y+=height(object.userData.terrainAnchor);
    }else if(object.userData.followTerrain){
      yield* drapeTerrainMesh(T,object,grid);
    }else{
      const {x,z}=object.position;
      object.position.y+=height({x:x+300,y:z+225});
    }
    if(++count%70===0)yield;
  }
}
