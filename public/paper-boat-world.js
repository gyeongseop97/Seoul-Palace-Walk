import {boatPose,paperColors} from "./paper-boats.js";

export function paperBoatFleet(T,root,{wx,wz},height,waterLevel){
  // Folded gunwales, pointed ends and a raised central paper fold share one mesh.
  const bow=[.32,.126,0],stern=[-.32,.126,0],keel=[0,.004,0],peak=[.012,.223,0];
  const points=[],shades=[];
  function facet(a,b,c,shade){points.push(...a,...b,...c);for(let j=0;j<3;j++)shades.push(shade,shade,shade);}
  for(const side of [-1,1]){
    const fore=[.12,.081,side*.106],aft=[-.12,.081,side*.106];
    const foreLip=[.114,.078,side*.095],aftLip=[-.114,.078,side*.095];
    const foreFloor=[.145,.027,0],aftFloor=[-.145,.027,0],fold=[0,.029,side*.055];
    facet(bow,keel,fore,.69);facet(fore,keel,aft,.84);facet(stern,aft,keel,.66);
    facet(bow,fore,foreLip,1);facet(fore,aft,aftLip,1);facet(fore,aftLip,foreLip,1);facet(aft,stern,aftLip,1);
    facet(bow,foreLip,foreFloor,.69);facet(stern,aftFloor,aftLip,.59);
    facet(foreLip,aftLip,aftFloor,.64);facet(foreLip,aftFloor,foreFloor,.72);
    // The folded triangular crown stands free of the gunwale, leaving two open pockets.
    facet(foreFloor,fold,peak,side===1?.93:.79);facet(aftFloor,peak,fold,side===1?.72:.98);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute("position",new T.Float32BufferAttribute(points,3));geo.setAttribute("color",new T.Float32BufferAttribute(shades,3));
  geo.computeVertexNormals();
  const materials=new Map(),models=new Map();
  return (boats,time,anchor)=>{
    if(!boats.length&&!models.size)return;
    const seen=new Set();
    for(const boat of boats){
      if(time>=boat.expires)continue;
      const p=boatPose(boat,time);
      if(!anchor||Math.hypot(anchor.x-p.x,anchor.y-p.y)>75)continue;
      seen.add(boat.id);
      let mesh=models.get(boat.id);
      if(!mesh){
        if(!materials.has(boat.color))materials.set(boat.color,new T.MeshStandardMaterial({color:paperColors[boat.color],vertexColors:true,roughness:.91,side:T.DoubleSide}));
        mesh=new T.Mesh(geo,materials.get(boat.color));mesh.name="청계천 종이배";mesh.userData.dynamic=true;root.add(mesh);models.set(boat.id,mesh);
      }
      const age=Math.max(0,(time-boat.sent)/1000);
      const settle=Math.max(0,1-age/.65);
      mesh.position.set(wx(p.x),height(p.x,p.y)+waterLevel+.028+.24*settle*settle+.009*Math.sin(age*4),wz(p.y)+boat.side*.38*settle);
      mesh.rotation.set(.06*Math.sin(age*3.1),p.yaw,.035*Math.sin(age*2.6)-.12*settle,"YXZ");
    }
    for(const [id,mesh] of models)if(!seen.has(id)){root.remove(mesh);models.delete(id);}
  };
}
