// Faceted low-poly trees in several silhouettes. Autumn and evergreen palettes are mixed
// so a single view shows yellow ginkgo, red maple and still-green crowns side by side.
export const treePalettes={
  ginkgo:{leaf:[0xe3ad2c,0xf0c23e,0xf7d250,0xfbe070],wood:0x86694c,autumn:true},
  amber:{leaf:[0xd96f28,0xe6862e,0xf09a3a,0xf6b351],wood:0x7a5740,autumn:true},
  maple:{leaf:[0xc0392b,0xd4492f,0xe55d36,0xee7a45],wood:0x6f4c3d,autumn:true},
  russet:{leaf:[0xb0652e,0xc47a33,0xd6923c,0xe2a94f],wood:0x74523e,autumn:true},
  olive:{leaf:[0xa3a83e,0xb7bb48,0xc9cb55,0xd9d86a],wood:0x7c5f44,autumn:true},
  fresh:{leaf:[0x74ad42,0x8bc24e,0x9fd35b,0xb5e06f],wood:0x855f42},
  deep:{leaf:[0x4b8747,0x599a51,0x69ac5c,0x7cbd69],wood:0x70503e},
  pine:{leaf:[0x3a6e48,0x467f51,0x53905b,0x62a066],wood:0x85523c}
};
export const treeStyles=["cloud","branchy","cone","ball","round","column"];

function noise(x,y,z,seed){
  const value=Math.sin(x*12.9898+y*78.233+z*37.719+seed*19.19)*43758.5453;
  return value-Math.floor(value);
}

export function makeTreeBuilder(T,scene,{clearance,rand,fits=()=>true,snapshotPart}){
  // Shared vertices move together, so the facets stay watertight.
  function lumpy(detail,seed,amount){
    const geometry=new T.IcosahedronGeometry(1,detail),points=geometry.attributes.position;
    for(let i=0;i<points.count;i++){
      const x=points.getX(i),y=points.getY(i),z=points.getZ(i);
      const key=[Math.round(x*1e3),Math.round(y*1e3),Math.round(z*1e3)];
      const scale=1+(noise(key[0],key[1],key[2],seed)-.5)*2*amount;
      points.setXYZ(i,x*scale,y*scale,z*scale);
    }
    geometry.computeVertexNormals();geometry.computeBoundingBox();
    return geometry;
  }
  const small=[lumpy(0,1,.13),lumpy(0,2,.17),lumpy(0,3,.11)];
  const medium=[lumpy(1,4,.13),lumpy(1,5,.16),lumpy(1,6,.10)];
  const large=[lumpy(2,7,.09),lumpy(2,8,.11)];
  const wood=new T.CylinderGeometry(.62,1,1,6);
  wood.computeBoundingBox();
  const materials=new Map();
  function facet(color,kind=""){
    const key=`${color}/${kind}`;
    if(!materials.has(key)){
      const material=new T.MeshStandardMaterial({color,roughness:.86,flatShading:true});
      if(kind)material.userData.seasonFoliage=kind;
      materials.set(key,material);
    }
    return materials.get(key);
  }
  const up=new T.Vector3(0,1,0),axis=new T.Vector3();
  const pick=list=>list[Math.floor(rand()*list.length)];
  // An instancer copies each finished tree's transforms synchronously. Its working
  // meshes can be reused for the next tree; ordinary scene builders retain theirs.
  const working=snapshotPart?[]:null;
  let partCount=0;
  function part(geometry,material){
    if(!working)return new T.Mesh(geometry,material);
    const index=partCount++;
    let mesh=working[index];
    if(!mesh){
      mesh=new T.Mesh(geometry,material);working[index]=mesh;
    }else{
      mesh.geometry=geometry;mesh.material=material;
    }
    return mesh;
  }

  function limb(parts,from,to,radius,color){
    axis.set(to.x-from.x,to.y-from.y,to.z-from.z);
    const mesh=part(wood,facet(color));
    mesh.position.set((from.x+to.x)/2,(from.y+to.y)/2,(from.z+to.z)/2);
    mesh.scale.set(radius,axis.length(),radius);
    mesh.quaternion.setFromUnitVectors(up,axis.normalize());
    mesh.name="Tree limb";
    if(!clearance.meshFits(mesh))return null;
    parts.push(mesh);return mesh;
  }
  function blob(parts,state,set,palette,x,y,z,rx,ry=rx,rz=rx,tone=rand()){
    if(!fits(x,y,z,Math.max(rx,rz)))return null;
    const shade=Math.min(palette.leaf.length-1,Math.max(0,Math.floor(tone*palette.leaf.length)));
    const mesh=part(pick(set),facet(palette.leaf[shade],palette===treePalettes.pine?"evergreen":"leaf"));
    mesh.position.set(x,y,z);mesh.scale.set(rx,ry,rz);
    mesh.rotation.set(rand()*.5,rand()*6.283,rand()*.5);
    mesh.name="Tree crown";
    if(!clearance.trim(mesh))return null;
    parts.push(mesh);
    const top=y+mesh.scale.y*.82;
    if(top>state.top.y)state.top={x,y:top,z};
    state.reach=Math.max(state.reach,Math.hypot(x-state.x,z-state.z)+rx);
    return mesh;
  }
  // Higher blobs take lighter shades, like sunlit tops.
  const lit=(level,jitter=.3)=>Math.min(.999,Math.max(0,level*.75+rand()*jitter));

  function trunk(parts,x,z,height,radius,color,bend){
    const angle=rand()*6.283,drift=bend*height;
    const points=[{x,y:0,z},
      {x:x+Math.cos(angle)*drift*.55,y:height*.45,z:z+Math.sin(angle)*drift*.55},
      {x:x+Math.cos(angle+.9)*drift*.25,y:height,z:z+Math.sin(angle+.9)*drift*.25}];
    for(let i=1;i<points.length;i++){
      if(!limb(parts,points[i-1],points[i],radius*(i===1?1:.64),color))return null;
    }
    // Root flare
    for(let i=0;i<4;i++){
      const a=angle+i*1.571+rand()*.5;
      limb(parts,{x,y:radius*1.5,z},{x:x+Math.cos(a)*radius*1.35,y:-.06,z:z+Math.sin(a)*radius*1.35},radius*.52,color);
    }
    return points.at(-1);
  }

  const shapes={
    cloud(parts,state,palette,x,z,height,spread){
      const tip=trunk(parts,x,z,height*.50,height*.042,palette.wood,.10);
      if(!tip)return false;
      const forks=3+Math.floor(rand()*2),start=rand()*6.283;
      for(let i=0;i<forks;i++){
        const a=start+i*6.283/forks+rand()*.5,r=spread*(.20+rand()*.10);
        const end={x:tip.x+Math.cos(a)*r,y:height*(.62+rand()*.08),z:tip.z+Math.sin(a)*r};
        limb(parts,{x:tip.x,y:tip.y-height*.05,z:tip.z},end,height*.018,palette.wood);
        const size=spread*(.26+rand()*.09);
        blob(parts,state,medium,palette,end.x,end.y+size*.35,end.z,size,size*.86,size,lit(.2));
      }
      const crown=spread*(.31+rand()*.07);
      blob(parts,state,medium,palette,tip.x+spread*.05,height*.84,tip.z,crown,crown*.9,crown,lit(.8));
      blob(parts,state,medium,palette,tip.x-spread*.16,height*.74,tip.z+spread*.1,crown*.8,crown*.72,crown*.8,lit(.5));
      return true;
    },
    branchy(parts,state,palette,x,z,height,spread){
      const tip=trunk(parts,x,z,height*.80,height*.040,palette.wood,.035);
      if(!tip)return false;
      const count=4+Math.floor(rand()*2),start=rand()*6.283;
      const cluster=(cx,cy,cz,size,heading,level)=>{
        const lumps=5+Math.floor(rand()*3);
        for(let j=0;j<lumps;j++){
          const along=(j/(lumps-1)-.35)*size*1.5,side=(rand()-.5)*size*.9;
          const r=size*(.42+rand()*.22)*(1-j/lumps*.35);
          blob(parts,state,small,palette,cx+Math.cos(heading)*along-Math.sin(heading)*side,
            cy+(rand()-.3)*size*.5+j*size*.05,cz+Math.sin(heading)*along+Math.cos(heading)*side,r,r*.86,r,lit(level));
        }
      };
      for(let i=0;i<count;i++){
        const t=i/(count-1),a=start+i*2.4+rand()*.4,reach=spread*(.48-t*.16);
        const from={x:x+(tip.x-x)*(.5+t*.4),y:height*(.38+t*.30),z:z+(tip.z-z)*(.5+t*.4)};
        const to={x:from.x+Math.cos(a)*reach,y:from.y+height*(.10+rand()*.06),z:from.z+Math.sin(a)*reach};
        if(!limb(parts,from,to,height*.016,palette.wood))continue;
        cluster(to.x,to.y+spread*.05,to.z,spread*(.26-t*.05),a,.25+t*.5);
      }
      cluster(tip.x,height*.90,tip.z,spread*.24,rand()*6.283,.85);
      return true;
    },
    cone(parts,state,palette,x,z,height,spread){
      const tip=trunk(parts,x,z,height*.34,height*.036,palette.wood,.02);
      if(!tip)return false;
      const levels=5+Math.floor(rand()*2),start=rand()*6.283;
      for(let level=0;level<levels;level++){
        const t=level/(levels-1),ring=spread*.36*(1-t)**.85,size=spread*(.23-t*.10);
        const count=level===levels-1?1:Math.max(3,Math.round(6-t*3.5));
        for(let i=0;i<count;i++){
          const a=start+level*.7+i*6.283/count,r=count===1?0:ring*(.85+rand()*.3);
          const s=size*(.85+rand()*.3);
          blob(parts,state,level<2?medium:small,palette,tip.x+Math.cos(a)*r,
            height*(.36+t*.56)+(rand()-.5)*size*.4,tip.z+Math.sin(a)*r,s,s*.92,s,lit(t));
        }
      }
      blob(parts,state,small,palette,tip.x,height*.985,tip.z,spread*.07,spread*.09,spread*.07,.95);
      return true;
    },
    column(parts,state,palette,x,z,height,spread){
      const tip=trunk(parts,x,z,height*.30,height*.034,palette.wood,.02);
      if(!tip)return false;
      const levels=4;
      for(let level=0;level<levels;level++){
        const t=level/(levels-1),size=spread*(.30-t*.10)*(level===0?.86:1);
        blob(parts,state,medium,palette,tip.x+(rand()-.5)*spread*.08,height*(.40+t*.46),
          tip.z+(rand()-.5)*spread*.08,size,size*1.18,size,lit(t,.2));
      }
      return true;
    },
    ball(parts,state,palette,x,z,height,spread){
      const tip=trunk(parts,x,z,height*.58,height*.028,palette.wood,.03);
      if(!tip)return false;
      const size=spread*.46;
      blob(parts,state,large,palette,tip.x,height*.58+size*.72,tip.z,size,size*1.02,size,lit(.6,.4));
      return true;
    },
    round(parts,state,palette,x,z,height,spread){
      const tip=trunk(parts,x,z,height*.52,height*.040,palette.wood,.14);
      if(!tip)return false;
      const size=spread*.50;
      blob(parts,state,large,palette,tip.x,height*.52+size*.66,tip.z,size,size*.84,size*.94,lit(.55,.3));
      const a=rand()*6.283;
      blob(parts,state,medium,palette,tip.x+Math.cos(a)*size*.62,height*.52+size*.38,tip.z+Math.sin(a)*size*.62,
        size*.52,size*.46,size*.52,lit(.3));
      blob(parts,state,medium,palette,tip.x-Math.cos(a)*size*.5,height*.52+size*1.02,tip.z-Math.sin(a)*size*.4,
        size*.44,size*.40,size*.44,lit(.85));
      return true;
    }
  };

  // Returns {radius,top,reach} when the tree stands clear of buildings, otherwise null.
  function grow(x,z,{height,spread=height*.62,style=pick(treeStyles),palette=treePalettes.fresh,terrainAnchor}){
    partCount=0;
    const parts=[],state={x,z,top:{x,y:0,z},reach:0};
    const colors=typeof palette==="string"?treePalettes[palette]:palette;
    if(!shapes[style](parts,state,colors,x,z,height,spread)||!state.top.y){
      return null;
    }
    for(const mesh of parts){
      if(terrainAnchor)mesh.userData.terrainAnchor=terrainAnchor;
      else if(working)delete mesh.userData.terrainAnchor;
      if(snapshotPart)snapshotPart(mesh);else scene.add(mesh);
    }
    return {radius:height*.04,top:state.top,reach:state.reach,autumn:Boolean(colors.autumn),leaf:colors.leaf};
  }

  function shrub(x,z,size,palette){
    const colors=typeof palette==="string"?treePalettes[palette]:palette;
    const mesh=new T.Mesh(pick(medium),facet(pick(colors.leaf),"evergreen"));
    mesh.position.set(x,size*.36,z);mesh.scale.set(size,size*.64,size*.86);mesh.rotation.y=rand()*6.283;
    mesh.name="Garden shrub";
    if(snapshotPart){
      if(!clearance.trim(mesh))return null;
      snapshotPart(mesh);return mesh;
    }
    scene.add(mesh);
    return clearance.trim(mesh)?mesh:null;
  }
  return {grow,shrub,facet};
}
