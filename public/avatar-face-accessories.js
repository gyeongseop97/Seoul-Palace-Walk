import {FACE_LINES} from "./avatar-head.js";

export const FACE_SCALE = [.338,.322,.314];
const FRAME_Y = FACE_LINES.eye * FACE_SCALE[1];
const SIDES = [-1,1];
const TAU = Math.PI*2;

const frames = {
  horn: {width:.107,height:.084,shape:2.8,outerLift:.013,rim:.014,color:0x422d26,hinge:0xd1a475,metalness:.06},
  round: {width:.097,height:.087,shape:2,outerLift:0,rim:.007,color:0xc8ad80,hinge:0xdfcda9,metalness:.62},
  square: {width:.109,height:.074,shape:5,outerLift:0,rim:.011,color:0x293442,hinge:0x687c89,metalness:.21},
};

function weld(T, pieces) {
  const positions=[], norm=[], colors=[], indices=[];
  for (const [part, color] of pieces) {
    const {position,normal}=part.attributes, start=positions.length/3;
    for(let i=0;i<position.count;i++) {
      positions.push(position.getX(i),position.getY(i),position.getZ(i));
      norm.push(normal.getX(i),normal.getY(i),normal.getZ(i));
      colors.push(color.r,color.g,color.b);
      if(!part.index)indices.push(start+i);
    }
    if(part.index)for(const index of part.index.array)indices.push(start+index);
    part.dispose();
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("normal",new T.Float32BufferAttribute(norm,3));
  geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  return geometry;
}

function pipe(T, points, radius, segments, loop=false) {
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),loop);
  return new T.TubeGeometry(curve,segments,radius,5,loop);
}

function frameDepth(x) {
  return .355-.062*(Math.abs(x)/.268)**2;
}

function outline(style, side) {
  const {width,height,shape,outerLift}=style;
  const power=2/shape, center=side*.128;
  return Array.from({length:36},(_,index)=>{
    const theta=TAU*index/36, cos=Math.cos(theta), sin=Math.sin(theta);
    const x=center+width*Math.sign(cos)*Math.abs(cos)**power;
    const y=FRAME_Y+height*Math.sign(sin)*Math.abs(sin)**power+outerLift*side*cos;
    return [x,y,frameDepth(x)];
  });
}

function lens(T, border, centerX) {
  const positions=[centerX,FRAME_Y,frameDepth(centerX)-.002];
  const indices=[];
  border.forEach(([x,y],index)=>{
    positions.push(x,y,frameDepth(x)-.002);
    indices.push(0,index+1,(index+1)%border.length+1);
  });
  const glass=new T.BufferGeometry();
  glass.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  glass.setIndex(indices);
  glass.computeVertexNormals();
  return glass;
}

function buildGlasses(T, styleName, lensesMaterial) {
  const style=frames[styleName], color=new T.Color(style.color), hingeColor=new T.Color(style.hinge);
  const modelParts=[],glassParts=[];
  for(const side of SIDES) {
    const rim=outline(style,side);
    modelParts.push([pipe(T,rim,style.rim,48,true),color]);
    glassParts.push([lens(T,rim,side*.128),hingeColor]);
    const width=style.width+.128,x=side*width;
    const hingeY=FRAME_Y+.019+style.outerLift;
    const stem=styleName==="round"?.006:styleName==="horn"?.011:.009;
    modelParts.push([pipe(T,[[x,hingeY,frameDepth(x)],[side*.276,hingeY,.279],
      [side*.345,hingeY-.007,.174],[side*.375,hingeY-.022,.033],[side*.376,hingeY-.048,-.061]],stem,16),color]);
    const rivet=new T.SphereGeometry(1,8,5).scale(stem*.83,stem*.83,stem*.46)
      .translate(x,hingeY,frameDepth(x)+style.rim*.85);
    modelParts.push([rivet,hingeColor]);
    if(styleName==="horn") {
      const tortoise=new T.Color(0x986a4e);
      for(const index of [side===1?2:14,side===1?29:22]){
        const tint=rim.slice(index,index+4).map(([px,py,pz])=>[px,py,pz+style.rim*.53]);
        modelParts.push([pipe(T,tint,.005,8),tortoise]);
      }
    }
  }
  const gap=.129-style.width, bridgeHeight=styleName==="round"?.030:.028;
  const bridge=SIDES.flatMap(side=>[[side*gap,FRAME_Y+.006,frameDepth(gap)],[side*gap*.56,FRAME_Y+bridgeHeight*.78,.359]]);
  modelParts.push([pipe(T,[bridge[0],bridge[1],[0,FRAME_Y+bridgeHeight,.364],bridge[3],bridge[2]],style.rim*.78,14),color]);
  for(const side of SIDES) {
    const x=side*gap, padY=FRAME_Y-.024;
    modelParts.push([pipe(T,[[x,FRAME_Y+.004,frameDepth(x)],[x,padY+.009,.339],[side*.040,padY,.323]],
      styleName==="round"?.0035:.005,8),color]);
    const pad=new T.SphereGeometry(1,8,6).scale(.008,.015,.006)
      .rotateZ(-side*.28).translate(side*.040,padY,.321);
    modelParts.push([pad,styleName==="round"?new T.Color(0xd9c8a9):color]);
  }
  return {
    frame:weld(T,modelParts),
    lenses:weld(T,glassParts),
    material:new T.MeshStandardMaterial({vertexColors:true,roughness:styleName==="round"?.29:.38,metalness:style.metalness}),
    lensesMaterial
  };
}

function skinSurface(T, head) {
  const model=new T.Mesh(head);
  model.scale.set(...FACE_SCALE);
  model.updateMatrixWorld();
  const direction=new T.Vector3(0,0,-1), origin=new T.Vector3();
  const cast=new T.Raycaster(origin,direction,0,2);
  return (x,y,depth)=>{
    cast.ray.origin.set(x,y,1);
    const hit=cast.intersectObject(model,false)[0];
    return hit?[x,y,hit.point.z+depth]:null;
  };
}

const edgeTaper=t=>Math.sin(Math.PI*t);
const jawLines=x=>{
  const edge=Math.abs(x)/.30;
  return [ -.293+.178*edge**2.3, -.224+.117*edge**2.6 ];
};

function whiskerRibbon(T, face, from, to, heightAt, thickness, columns) {
  const positions=[], indices=[], rows=6, stride=rows+1;
  for(let col=0;col<=columns;col++){
    const fraction=col/columns,x=from+(to-from)*fraction;
    const [low,high]=heightAt(x,fraction);
    for(let row=0;row<=rows;row++){
      const t=row/rows,y=low+(high-low)*t;
      const p=face(x,y,.003+thickness*edgeTaper(t)*(.36+.64*edgeTaper(fraction)))??face(x,high,.003);
      positions.push(...p);
      if(col!==columns&&row!==rows){
        const i=col*stride+row;
        if(to>from)indices.push(i,i+stride,i+1,i+1,i+stride,i+stride+1);
        else indices.push(i,i+1,i+stride,i+1,i+stride+1,i+stride);
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function moustacheLines(x,t) {
  const middle=-.176+.006*Math.sin(t*Math.PI)-.019*t**2;
  const thickness=.006+.012*edgeTaper(t)**.67;
  return [middle-thickness*.53,middle+thickness*.47];
}

function buildBeard(T, style, face) {
  const dark=new T.Color().setRGB(.70,.65,.62), bright=new T.Color().setRGB(1.15,1.12,1.09);
  const pieces=[];
  if(style!=="stubble") {
    for(const side of SIDES)
      pieces.push([whiskerRibbon(T,face,side*.005,side*.103,moustacheLines,.010,18),dark]);
  }
  if(style==="goatee") {
    const contour=x=>[-.299+.052*(Math.abs(x)/.104)**1.85,-.230-.014*(Math.abs(x)/.104)];
    pieces.push([whiskerRibbon(T,face,-.104,.104,contour,.027,22),dark]);
  }else if(style==="full") {
    pieces.push([whiskerRibbon(T,face,-.30,.30,jawLines,.030,46),dark]);
  }
  const strokes=style==="stubble"?122:style==="moustache"?16:36;
  for(let i=0;i<strokes;i++) {
    const u=((i+.5)*.61803398875)%1, v=((i+.37)*.41421356237)%1;
    let x, y, rise=.006, length=.009;
    if(style==="moustache"||style!=="stubble"&&i%3===0){
      const t=.05+.90*u;
      x=(i%2?1:-1)*(.005+.098*t);
      const [low,high]=moustacheLines(x,t);
      y=low+(high-low)*(.24+.55*v);
      rise=.003+.010*edgeTaper(.24+.55*v)*(.36+.64*edgeTaper(t));
      length=.004+.004*u;
    }else if(style==="goatee"){
      x=.181*(u-.5); y=-.246+.014*v-.029*v**2;
      rise=.023+.004*edgeTaper(v); length=.011;
    }else{
      x=.57*(u-.5);
      const [low,high]=jawLines(x), t=.19+.66*v;
      y=low+(high-low)*t+(style==="stubble"?.008:0);
      if(style==="full")rise=.004+.030*edgeTaper(t)*(.36+.64*edgeTaper(x/.6+.5));
      length=style==="stubble"?.004+.006*u:.010+.005*u;
    }
    const a=face(x,y,rise), b=face(x*1.018,y-length,rise+.0015);
    if(a&&b)pieces.push([pipe(T,[a,b],style==="stubble"?.0022:.0020,2),i%3===0?dark:bright]);
  }
  return weld(T,pieces);
}

export function makeFaceAccessories(T, head) {
  const glasses=new Map(), beards=new Map(), beardMaterials=new Map();
  const lensMaterial=new T.MeshStandardMaterial({color:0xc6e7e9,transparent:true,opacity:.12,depthWrite:false,roughness:.24});
  const empty=new T.BufferGeometry(), face=skinSurface(T,head);
  function create(parent) {
    const add=name=>{
      const mesh=new T.Mesh(empty,lensMaterial);
      mesh.name=name;
      mesh.visible=false;
      parent.add(mesh);
      return mesh;
    };
    return {frame:add("안경테"), lenses:add("안경 렌즈"), beard:add("수염")};
  }
  function apply(parts, glassesName, beardName, hairColor) {
    const showGlasses=typeof glassesName==="string"&&Object.hasOwn(frames,glassesName);
    parts.frame.visible=parts.lenses.visible=showGlasses;
    if(showGlasses){
      if(!glasses.has(glassesName))glasses.set(glassesName,buildGlasses(T,glassesName,lensMaterial));
      const model=glasses.get(glassesName);
      parts.frame.geometry=model.frame;
      parts.frame.material=model.material;
      parts.lenses.geometry=model.lenses;
      parts.lenses.material=model.lensesMaterial;
    }
    const showBeard=["stubble","moustache","goatee","full"].includes(beardName);
    parts.beard.visible=showBeard;
    if(showBeard){
      if(!beards.has(beardName))beards.set(beardName,buildBeard(T,beardName,face));
      if(!beardMaterials.has(hairColor))beardMaterials.set(hairColor,new T.MeshStandardMaterial({
        color:hairColor,vertexColors:true,roughness:.91,
      }));
      parts.beard.geometry=beards.get(beardName);
      parts.beard.material=beardMaterials.get(hairColor);
    }
  }
  return {create,apply};
}
