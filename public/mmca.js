import {mmcaAt,mmcaFrame,mmcaCourtyards,mmcaLawns,mmcaBuildings,mmcaTrees,mmcaPlanters,mmcaLamps,mmcaBenches,
  mmcaSign,mmcaGround,mmcaEducationCore,mmcaEducationColumns} from "./mmca-layout.js";
import {addObstacle} from "./layout.js";

export function* buildMmca(T,root,kit,tiledRoof,naturalGround){
  const {wx,wz,box,cylinder,matte}=kit;
  const campus=new T.Group();
  campus.name="국립현대미술관 서울";
  campus.position.set(wx(mmcaFrame.x),0,wz(mmcaFrame.y));
  campus.rotation.y=mmcaFrame.angle;
  root.add(campus);
  const ground=(x,z)=>mmcaGround(x,z),stone=0x9d9c94,metal=0x333c3d,wood=0x8b6c52;
  function mesh(geometry,material,parent=campus,shadows=true){
    const object=new T.Mesh(geometry,material);
    object.castShadow=shadows;object.receiveShadow=true;parent.add(object);
    return object;
  }
  function block(color,x,y,z,w,h,d,parent=campus){
    const object=box(color,x,y,z,w,h,d,parent);
    object.castShadow=object.receiveShadow=true;
    return object;
  }
  function foot(color,x,z,w,h,d,base=0,parent=campus){
    return block(color,x,ground(x,z)+base+h/2,z,w,h,d,parent);
  }
  function cylinderAt(color,x,z,base,radius,height,sides,top=1){
    const object=cylinder(color,x,ground(x,z)+base+height/2,z,radius,height,sides,campus,top);
    object.castShadow=object.receiveShadow=true;
    return object;
  }
  function patterned(palette,{stagger=false,joints=true}={}){
    const size=128,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const row=Math.floor(y/32),offset=x+(stagger&&row%2?32:0),seam=y%32<=1||offset%64<=1;
      const noise=((x*61+y*41+(x^y)*17)%19)-9,variation=(row*19+Math.floor(offset/64)*13)%16-7;
      const shift=noise*.40+variation;
      const value=palette.map(component=>Math.max(0,Math.min(255,component+shift-(joints&&seam?24:0))));
      data.set([...value,255],(y*size+x)*4);
    }
    const map=new T.DataTexture(data,size,size);
    map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
    map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
    return new T.MeshStandardMaterial({map,roughness:.87,side:T.DoubleSide});
  }
  const tiles=patterned([198,192,178]),brick=patterned([149,92,76],{stagger:true});
  const paving=patterned([170,171,161],{stagger:true}),grass=patterned([119,134,81],{joints:false});
  const plinth=patterned([137,135,125],{stagger:true});
  grass.userData.seasonFoliage="ground";
  const roofMat=matte(0x7f817c),glass=new T.MeshStandardMaterial({color:0x566b6f,roughness:.33,metalness:.23,
    emissive:0x30332a,emissiveIntensity:.18});
  function polygon(outline,material,height,project=(x,z)=>[x*.8,z*.43]){
    const vertices=[],uv=[];
    const points=outline.map(([x,z])=>new T.Vector2(x,z));
    for(const triangle of T.ShapeUtils.triangulateShape(points,[])){
      const [a,b,c]=triangle.map(index=>points[index]);
      const clockwise=(b.y-a.y)*(c.x-a.x)>(b.x-a.x)*(c.y-a.y);
      for(const index of clockwise?triangle:[triangle[0],triangle[2],triangle[1]]){
        const {x,y:z}=points[index];
        vertices.push(x,height(x,z),z);uv.push(...project(x,z));
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    geometry.computeVertexNormals();
    const object=mesh(geometry,material,campus,false);
    return object;
  }
  const below=(x,z)=>Math.min(ground(x,z)-.20,(naturalGround?.(mmcaAt(x,z))??ground(x,z)-.7)-.14);
  function foundation(outline,top){
    const positions=[],uv=[];
    for(const [index,[a,b]] of outline.entries()){
      const [c,d]=outline[(index+1)%outline.length],run=Math.hypot(c-a,d-b),parts=Math.max(1,Math.ceil(run/4));
      const point=t=>[a+(c-a)*t,b+(d-b)*t];
      for(let j=0;j<parts;j++){
        const [x,z]=point(j/parts),[nx,nz]=point((j+1)/parts);
        const one=ground(x,z)+top,two=ground(nx,nz)+top,l=below(x,z),r=below(nx,nz);
        positions.push(x,l,z,nx,r,nz,nx,two,nz,x,l,z,nx,two,nz,x,one,z);
        const u=run*j/parts,v=run*(j+1)/parts;
        uv.push(u,l,v,r,v,two,u,l,v,two,u,one);
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    geometry.computeVertexNormals();
    const surface=mesh(geometry,plinth,campus,false);
    surface.name="미술관 기초 벽";
  }
  for(const [i,{name,vertices}] of mmcaCourtyards.entries()){
    const outline=name==="교육동 아래 통로"?[[-1.9,-25.2],[25.87,-25.2],[25.87,-9.439],[24,-10],[-1.9,-10]]:vertices;
    polygon(outline,paving,(x,z)=>ground(x,z)+i*.003);
  }
  for(const {vertices} of mmcaLawns)polygon(vertices,grass,(x,z)=>ground(x,z)+.017);
  function facade([ax,az],[bx,bz],low,high,material,uScale,vScale){
    const run=Math.hypot(ax-bx,az-bz),a=ground(ax,az),b=ground(bx,bz);
    const geometry=new T.BufferGeometry(),u=run*uScale,v=(high-low)*vScale;
    geometry.setAttribute("position",new T.Float32BufferAttribute([
      ax,a+low,az,bx,b+low,bz,bx,b+high,bz,ax,a+high,az
    ],3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute([0,0,u,0,u,v,0,v],2));
    geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
    return mesh(geometry,material);
  }
  function shell(building,material,low,high,brickwork=false){
    const {vertices}=building;
    for(const [i,point] of vertices.entries()){
      facade(point,vertices[(i+1)%vertices.length],low,high,material,brickwork?1.9:.78,brickwork?2.9:.28);
    }
    polygon(vertices,roofMat,(x,z)=>ground(x,z)+high);
  }
  function windows([ax,az],[bx,bz],bottom,h,{inset=0,tint=glass,spacing=1.28}={}){
    const length=Math.hypot(ax-bx,az-bz),cx=(ax+bx)/2,cz=(az+bz)/2;
    const group=new T.Group();
    group.position.set(cx,ground(cx,cz),cz);group.rotation.y=Math.atan2(az-bz,bx-ax);
    campus.add(group);
    const pane=mesh(new T.BoxGeometry(length,h,.085),tint,group,false);
    pane.position.set(0,bottom+h/2,inset);
    for(const y of [bottom,bottom+h*.41,bottom+h]){
      block(metal,0,y,inset,length,.055,.15,group);
    }
    const bays=Math.ceil(length/spacing);
    for(let n=0;n<=bays;n++)block(metal,length*(n/bays-.5),bottom+h/2,inset,.060,h,.16,group);
  }
  function sign(x,z,height,width,angle,title,subtitle,background="#292f2e"){
    if(typeof document==="undefined")return;
    const canvas=document.createElement("canvas");
    canvas.width=512;canvas.height=216;
    const context=canvas.getContext("2d");if(!context)return;
    context.fillStyle=background;context.fillRect(0,0,512,216);
    context.fillStyle="#f1ede5";context.textAlign="center";context.textBaseline="middle";
    context.font='700 62px "Malgun Gothic",sans-serif';context.fillText(title,256,83,468);
    context.fillStyle="#d0cec1";context.font='30px "Malgun Gothic",sans-serif';context.fillText(subtitle,256,157,468);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
    const face=mesh(new T.PlaneGeometry(width,width*216/512),new T.MeshBasicMaterial({map:texture}),campus,false);
    face.position.set(x,height,z);face.rotation.y=angle;
  }
  for(const building of mmcaBuildings){
    const {id,west,east,north,south,height,vertices}=building;
    if(id.startsWith("brick")){
      foundation(vertices,.17);
      shell(building,brick,.17,height,true);
      for(const [i,a] of vertices.entries()){
        const b=vertices[(i+1)%vertices.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        const nx=dz/length,nz=-dx/length;
        const round=id==="brick"&&(i<2||i>=5);
        const min=round?.02:Math.min(.13,1.6/length),max=1-min;
        const edge=(t,n)=>[a[0]+dx*t+nx*n,a[1]+dz*t+nz*n];
        if(length<.7)continue;
        for(const y of [1.02,4.8,8.5]){
          if(y+2>height-.65)continue;
          const groups=round?1:Math.max(1,Math.round(length/8.5));
          for(let j=0;j<groups;j++){
            const low=min+(max-min)*(j+(round?0:.075))/groups;
            const high=min+(max-min)*(j+(round?1:.925))/groups;
            windows(edge(low,.10),edge(high,.10),y,2.04,{spacing:round?.60:.88});
            for(const h of [y-.065,y+2.12])facade(edge(low,.15),edge(high,.15),h,h+.13,matte(0xbeb8a8),1,1);
          }
        }
        facade(edge(0,.075),edge(1,.075),height-.23,height,tiles,.4,.5);
      }
      if(id==="brick"){
        const tower=[...vertices.slice(5),...vertices.slice(0,2),[-7,37]];
        shell({vertices:tower},brick,height,height+1.15,true);
        for(const [i,a] of tower.entries()){
          const b=tower[(i+1)%tower.length];
          facade(a,b,height+1.10,height+1.24,tiles,.78,.28);
        }
        const doorZ=south-7;
        windows([west-.10,doorZ-2.7],[west-.10,doorZ+2.7],.17,2.84,{spacing:1.38});
        foot(0x88827a,west-.97,doorZ,2.3,.09,6.1);
        block(0x716960,west-.65,ground(west,doorZ)+3.09,doorZ,1.37,.13,6.04);
        foot(stone,west-1,south-6,2.3,.20,7.4);
        sign(west-.21,ground(west,doorZ)+3.76,doorZ,-Math.PI/2,"국립현대미술관 서울","MMCA SEOUL", "#6c4035");
      }
    }else if(id==="gyeonggeundang"||id==="okcheopdang"){
      const w=east-west,d=south-north,x=(east+west)/2,z=(south+north)/2,group=new T.Group();
      group.position.set(x,ground(x,z),z);campus.add(group);
      foundation(vertices,.14);
      block(0x9f9280,0,.29,0,w+.7,.58,d+.65,group);
      block(0xe0c38c,0,1.89,0,w-.8,2.65,d-.8,group);
      // The courtyard faces the long colonnade of each hall.
      const bays=id==="gyeonggeundang"?7:5,spacing=(d-1.45)/bays;
      for(const side of [-1,1]){
        const face=side*(w/2-.22);
        for(let i=0;i<=bays;i++){
          const zz=(i-bays/2)*spacing;
          block(0x963e2f,face,1.91,zz,.23,2.72,.23,group);
          block(0x98543e,face,3.34,zz,.58,.30,.71,group);
          if(i===bays)continue;
          const mid=zz+spacing/2;
          block(0x54755a,face+side*.045,1.83,mid,.11,1.88,spacing-.36,group);
          block(0xc8b988,face+side*.108,1.97,mid,.03,1.13,spacing-.76,group);
          for(let j=-2;j<=2;j++)block(0x697f5a,face+side*.139,1.97,mid+j*(spacing-.77)/6,.035,1.15,.041,group);
          for(const yy of [1.64,2.05,2.36])block(0x6b7c56,face+side*.144,yy,mid,.033,.049,spacing-.76,group);
        }
        block(0x496552,face,3.39,0,.30,.26,d,group);
        block(0x7e4836,face,1.03,0,.20,.13,d-.52,group);
        for(const xx of [-.33,0,.33]){
          block(0x8e5240,xx*w,1.93,side*(d/2-.25),.21,2.71,.21,group);
        }
        block(0x4c6651,0,3.39,side*(d/2-.19),w,.25,.29,group);
      }
      // The roof is turned so the long axis and eaves follow the surveyed pavilion.
      const roof=new T.Group();roof.rotation.y=Math.PI/2;group.add(roof);
      tiledRoof(roof,d+2.4,w+2.2,3.62,id==="gyeonggeundang"?1.8:1.4);
    }else{
      shell(building,tiles,id==="education"?3.9:0,height);
      const y=ground(east,south);
      if(id==="education"){
        const core=mmcaEducationCore,point=mmcaAt((core.west+core.east)/2,(core.north+core.south)/2);
        const skin=patterned([154,158,153]);
        for(const [i,a] of core.vertices.entries())facade(a,core.vertices[(i+1)%core.vertices.length],0,3.91,skin,.75,.30);
        foundation(core.vertices,0);
        addObstacle(point.x,point.y,core.east-core.west,core.south-core.north,mmcaFrame.angle);
        polygon(vertices,plinth,(x,z)=>ground(x,z)+3.91);
        for(const [x,z] of mmcaEducationColumns){
          const low=below(x,z)-ground(x,z),post=mmcaAt(x,z);
          cylinderAt(0xa29d8d,x,z,low,.31,3.94-low,10);
          addObstacle(post.x,post.y,.62,.62,mmcaFrame.angle);
        }
        windows([core.west+.18,core.south+.05],[core.east-.18,core.south+.05],.17,3.48,{spacing:1.25});
        windows([core.east+.05,core.south-.18],[core.east+.05,core.north+.18],.17,3.48,{spacing:1.28});
        windows([east-.24,south+.12],[east-5.6,south+.12],4.24,4.34,{spacing:1.68});
        const canopyZ=south+1.75;
        block(0x8b8a7f,(west+east)/2,y+3.85,canopyZ,east-west,.24,3.55);
        for(const x of [west+4,west+13,west+22,west+31])block(0xe7d7a8,x,y+3.70,canopyZ,.8,.06,.24);
      }else if(id==="glass"){
        foundation(vertices,0);
        windows([east,south+.08],[west,south+.08],.32,9.9,{spacing:1.16});
        windows([east+.08,north],[east+.08,south],.32,9.9,{spacing:1.16});
      }else{
        foundation(vertices,0);
        windows([east-.15,south+.10],[west+.15,south+.10],.16,id==="lobby"?3.6:2.55,{spacing:1.28});
        if(id==="lobby")windows([west-.12,north],[west-.12,south],.18,3.6);
        for(const edge of [north+.15,south-.15])block(metal,(west+east)/2,y+height+.13,edge,east-west,.055,.035);
      }
    }
    yield;
  }
  for(const [x,z,w,d] of mmcaPlanters){
    foot(0x706c5f,x,z,w,.34,d);
    foot(0x616e45,x,z,w-.19,.16,d-.19,.32);
    for(let i=0;i<5;i++){
      const px=x+(i-2)*w*.16;
      const foliage=mesh(new T.IcosahedronGeometry(.31,1),matte(i%2?0x667647:0x77844b));
      foliage.position.set(px,ground(px,z)+.55,z+.05);
      const petals=mesh(new T.IcosahedronGeometry(.09,0),matte([0xc38072,0xe0bc75,0xac819d][i%3]),campus,false);
      petals.position.set(px+.05,ground(px,z)+.80,z-.06);
    }
  }
  const crownShape=new T.IcosahedronGeometry(1,1);
  for(const [index,[x,z,h]] of mmcaTrees.entries()){
    const base=ground(x,z);
    cylinderAt(0x6b5948,x,z,0,h*.043,h*.66,9,.61);
    for(let limb=0;limb<6;limb++){
      const angle=limb*2.4+index,r=h*(.14+(limb%3)*.035);
      const branch=cylinder(0x6e5c4a,x+Math.cos(angle)*r*.61,base+h*.51,z+Math.sin(angle)*r*.61,h*.019,h*.33,7,campus,.57);
      branch.rotation.z=-Math.cos(angle)*.62;branch.rotation.x=Math.sin(angle)*.62;branch.castShadow=true;
      const crown=mesh(crownShape,matte([0x929655,0xb7a15a,0x737b50,0x9b9150][(limb+index)%4]));
      crown.position.set(x+Math.cos(angle)*r,base+h*(.62+limb*.045),z+Math.sin(angle)*r);
      crown.scale.set(h*.235,h*.18,h*.23);
    }
  }
  for(const [x,z] of mmcaLamps){
    cylinderAt(metal,x,z,0,.062,3.82,9,.83);
    cylinderAt(0xbcb7a4,x,z,3.765,.30,.09,12,.67);
    cylinderAt(0x374242,x,z,3.845,.27,.09,12,.72);
  }
  for(const [x,z] of mmcaBenches){
    foot(stone,x-1.1,z,.26,.44,.44);
    foot(stone,x+1.1,z,.26,.44,.44);
    foot(wood,x,z,2.75,.10,.55,.43);
  }
  const [x,z]=mmcaSign;
  foot(0x2e3535,x,z,.69,2.45,2.8);
  sign(x-.36,z,ground(x,z)+1.59,2.66,-Math.PI/2,"MMCA","국립현대미술관 서울");
  sign(x+.36,z,ground(x,z)+1.59,2.66,Math.PI/2,"MMCA","국립현대미술관 서울");
}
