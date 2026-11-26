import {graniteMaterial} from "./granite-material.js";

const finishes=[];
function carvedStone(T,faceted){
  const id=faceted?1:0;
  if(finishes[id])return finishes[id];
  const material=new T.MeshStandardMaterial({map:graniteMaterial(T).map,roughness:.96,flatShading:faceted});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vStonePoint;")
      .replace("#include <project_vertex>",`
        #include <project_vertex>
        vec4 stonePoint=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          stonePoint=instanceMatrix*stonePoint;
        #endif
        vStonePoint=mat3(modelMatrix)*stonePoint.xyz*1.9;
      `);
    shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vStonePoint;")
      .replace("#include <map_fragment>",`
        #ifdef USE_MAP
          // Blend metre-scaled projections so the grain follows the nose, curls and carved relief.
          vec3 dxStone=dFdx(vStonePoint),dyStone=dFdy(vStonePoint);
          vec3 weights=abs(normalize(cross(dxStone,dyStone)));
          weights*=weights; weights*=weights;
          weights/=max(dot(weights,vec3(1.)),.00001);
          vec3 stone=texture2D(map,vStonePoint.yz).rgb*weights.x
                    +texture2D(map,vStonePoint.xz).rgb*weights.y
                    +texture2D(map,vStonePoint.xy).rgb*weights.z;
          float fine=1.-smoothstep(.045,.22,max(length(dxStone),length(dyStone)));
          float grain=clamp((dot(stone,vec3(.2126,.7152,.0722))-.28)*2.8,-.42,.42);
          diffuseColor.rgb*=1.+grain*.72*fine;
          float stoneHeight=grain*.0012*fine;
        #endif
      `).replace("#include <normal_fragment_maps>",`
        #include <normal_fragment_maps>
        #ifdef USE_MAP
          vec3 dxView=dFdx(-vViewPosition),dyView=dFdy(-vViewPosition);
          vec3 r1=cross(dyView,normal),r2=cross(normal,dxView);
          float det=dot(dxView,r1);
          normal=normalize(normal-sign(det)*(r1*dFdx(stoneHeight)+r2*dFdy(stoneHeight))/max(abs(det),.000001));
        #endif
      `);
  };
  finishes[id]=material;
  return material;
}

// Each repeated chisel mark keeps its original position, colour and lighting but shares a draw.
export function finishStoneCarving(T,root){
  root.updateWorldMatrix(true,true);
  const inverse=root.matrixWorld.clone().invert(),local=new T.Matrix4(),shapes=new Map();
  root.traverse(part=>{
    if(!part.isMesh)return;
    const key=part.geometry.id+"/"+Number(part.material.flatShading);
    if(!shapes.has(key))shapes.set(key,[]);
    shapes.get(key).push(part);
  });
  for(const parts of shapes.values()){
    const first=parts[0],batch=new T.InstancedMesh(first.geometry,carvedStone(T,first.material.flatShading),parts.length);
    parts.forEach((part,i)=>{
      batch.setMatrixAt(i,local.multiplyMatrices(inverse,part.matrixWorld));
      batch.setColorAt(i,part.material.color);
      part.removeFromParent();
    });
    batch.computeBoundingSphere();
    batch.castShadow=batch.receiveShadow=batch.userData.streamStatic=true;
    root.add(batch);
  }
}
