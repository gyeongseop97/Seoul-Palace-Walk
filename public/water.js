import {addObstacle} from "./layout.js";
import {basinWater} from "./water-shader.js";

function basinOutline(T,radius){
  const points=Array.from({length:64},(_,i)=>{
    const angle=i*Math.PI/32,edge=radius*(.89+.11*Math.cos(4*angle));
    return new T.Vector2(edge*Math.cos(angle),edge*Math.sin(angle));
  });
  const shape=new T.Shape(points);
  shape.closePath();
  return shape;
}

function stoneBasin(T,scene,x,z,radius){
  const outer=basinOutline(T,radius),rim=basinOutline(T,radius*1.015),inside=basinOutline(T,radius*.91);
  rim.holes.push(inside);
  for(const [shape,y,depth,color] of [[outer,0,.39,0x9a9687],[rim,.39,.135,0xbcb4a0]]){
    const stone=new T.Mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),new T.MeshStandardMaterial({color,roughness:.92}));
    stone.rotation.x=-Math.PI/2;stone.position.set(x,y,z);stone.receiveShadow=true;scene.add(stone);
  }
  const pool=new T.ShapeGeometry(inside),uv=pool.getAttribute("uv");
  for(let i=0;i<uv.count;i++)uv.setXY(i,.5+uv.getX(i)/(2*radius),.5+uv.getY(i)/(2*radius));
  return pool;
}

export function addWater(T,scene,sources,{cylinder,rand,terrain=()=>0}) {
  const state=[];
  const sprite=document.createElement("canvas");
  sprite.width=sprite.height=32;
  const ctx=sprite.getContext("2d"),fade=ctx.createRadialGradient(16,16,2,16,16,16);
  fade.addColorStop(0,"rgba(255,255,255,1)");fade.addColorStop(.55,"rgba(255,255,255,.68)");
  fade.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=fade;ctx.fillRect(0,0,32,32);
  const dropTexture=new T.CanvasTexture(sprite);
  for(const {x,z,radius:r,scalloped=false} of sources) {
    const source=new T.Group();
    source.position.y=terrain({x:x+300,y:z+225});
    scene.add(source);
    if(!scalloped){
      cylinder(0x8e9087,x,.20,z,r,.41,36,source);
      cylinder(0xaba89b,x,.44,z,r*1.012,.15,36,source);
    }
    const poolShape=scalloped?stoneBasin(T,source,x,z,r):new T.CircleGeometry(r*.91,42);
    // The Seokjojeon basin is green bronze under the water; the Jeongdong one is pale stone.
    const pool = new T.Mesh(poolShape,scalloped?basinWater(T,{bed:[0x6f8f80,0x9db5a2],tile:1.6,tint:0x2a8a86,depth:.26}):
      basinWater(T,{bed:[0x9aa09a,0xc6c8bd],tile:2.4,tint:0x2f8fa0,depth:.2}));
    pool.rotation.x=-Math.PI/2;pool.position.set(x,scalloped?.493:.531,z);source.add(pool);
    cylinder(scalloped?0x426658:0x939b94,x,.76,z,r*.095,.49,16,source);
    cylinder(scalloped?0x567c68:0xb6b1a0,x,1.028,z,r*.136,.13,16,source);
    if(scalloped)for(let i=0;i<4;i++){
      const angle=i*Math.PI/2;
      cylinder(0x50766a,x+Math.cos(angle)*r*.61,.62,z+Math.sin(angle)*r*.61,r*.046,.24,10,source);
    }
    // Short colliders follow the lip instead of blocking the surrounding walk.
    const edges=scalloped?20:14;
    for(let i=0;i<edges;i++){
      const angle=i*Math.PI*2/edges;
      const edge=scalloped?r*(.75+.11*Math.cos(4*angle)):r*.79,segment=r*(scalloped?.37:.60);
      addObstacle(x+300+Math.cos(angle)*edge,z+225+Math.sin(angle)*edge,segment,segment,0,.53);
    }
    addObstacle(x+300,z+225,r*1.21,r*1.21,0,.53);
    const count=154,positions=new Float32Array(count*3),seeds=[];
    const geom=new T.BufferGeometry();
    const data=new T.BufferAttribute(positions,3);
    data.setUsage(T.DynamicDrawUsage);geom.setAttribute("position",data);
    for(let i=0;i<count;i++)seeds.push({phase:rand(),angle:rand()*Math.PI*2,amp:.65+rand()*.43,side:i%6!==0});
    const material=new T.PointsMaterial({color:0xdbf8ff,map:dropTexture,size:.19,transparent:true,opacity:.91,depthWrite:false,alphaTest:.035});
    const drops=new T.Points(geom,material);
    drops.position.set(x,0,z);drops.frustumCulled=false;source.add(drops);
    const jets=9,segments=14,streams=new T.BufferGeometry();
    const streamData=new T.BufferAttribute(new Float32Array(jets*segments*6),3);
    streamData.setUsage(T.DynamicDrawUsage);streams.setAttribute("position",streamData);
    const plume=new T.LineSegments(streams,new T.LineBasicMaterial({
      color:0xd6f2fc,transparent:true,opacity:.72,depthWrite:false
    }));
    plume.position.set(x,0,z);plume.frustumCulled=false;source.add(plume);
    state.push({pool,data,positions,seeds,r,material,streamData,jets,segments});
  }
  return (seconds,night)=>{
    for(const {pool,data,positions,seeds,r,material,streamData,jets,segments} of state){
      pool.material.uniforms.clock.value=seconds;
      pool.material.uniforms.night.value=night;
      material.color.set(night>.5?0xb0dbfb:0xdbf8ff);
      for(let i=0;i<seeds.length;i++){
        const jet=seeds[i],t=(seconds*(jet.side?.73:.63)+jet.phase)%1;
        const travel=jet.side?t*r*.69:(t*.32+.045)*jet.amp;
        const arc=(jet.side?1.17:2.33)*jet.amp*4*t*(1-t);
        positions[i*3]=Math.cos(jet.angle)*travel;
        positions[i*3+1]=.56+arc+(jet.side?.48:.51)*(1-t);
        positions[i*3+2]=Math.sin(jet.angle)*travel;
      }
      data.needsUpdate=true;
      let cursor=0;
      for(let jet=0;jet<jets;jet++){
        const a=jet*Math.PI*2/jets;
        const height=(jet%3===0?2.42:1.31)*(1+.062*Math.sin(seconds*3.5+jet));
        for(let segment=0;segment<segments;segment++){
          for(let sample=segment;sample<=segment+1;sample++){
            const t=sample/segments;
            const radius=.075+t*r*(jet%3===0?.20:.70);
            const bend=Math.sin(t*15-seconds*11+jet)*t*.038;
            streamData.setXYZ(cursor++,Math.cos(a+bend)*radius,.56+.44*(1-t)+4*height*t*(1-t),Math.sin(a+bend)*radius);
          }
        }
      }
      streamData.needsUpdate=true;
    }
  };
}
