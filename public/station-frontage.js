// East/west roof profile and plaza storefronts reconstructed from the public floor guide
// and plaza views. The horizontal control points follow the station building outline.
export function lettering(T,g,title,x,y,z,w,h,ink="#ffffff"){
  const c=document.createElement("canvas");c.width=1024;c.height=192;
  const ctx=c.getContext("2d");ctx.fillStyle=ink;ctx.font="bold 121px sans-serif";ctx.textBaseline="middle";ctx.textAlign="center";ctx.fillText(title,512,102,992);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
  panel.position.set(x,y,z);g.add(panel);
}
export function stationFrontage(T,kit,{groupAt,beam,ground},b){
  const {box,cylinder,matte}=kit,g=groupAt(0,0);
  // Station plaza is level across this block; anchor in the local terrain rather than at world zero.
  g.position.y=ground({x:0,y:1480});
  const wrap=b.rings[0],steel=0xb9c9ce,navy=0x34586a,wallHeight=b.kind==="terminal"?12.4:b.id===331969674?14.3:13.2;
  for(let i=0;i<wrap.length;i++){
    const a=wrap[i],e=wrap[(i+1)%wrap.length],dx=e[0]-a[0],dz=e[1]-a[1],l=Math.hypot(dx,dz);
    if(l<.15)continue;
    const seg=new T.Group();seg.position.set((a[0]+e[0])/2,0,(a[1]+e[1])/2);seg.rotation.y=Math.atan2(-dz,dx);g.add(seg);
    box(b.id===170403784?0xaab4b5:navy,0,wallHeight/2,0,l,wallHeight,.24,seg);
    box(0xd7dcd9,0,wallHeight-.04,0,l,.92,.37,seg);
    if(l>3){
      for(let h=3.2;h<wallHeight-.6;h+=2.8)box(steel,0,h,0,l,.105,.31,seg);
      const n=Math.ceil(l/3.75);
      for(let j=0;j<n;j++)box(0x9aafb7,(j+.5)*l/n-l/2,wallHeight/2,0,.12,wallHeight,.35,seg);
    }
  }
  const roofShape=new T.Shape(wrap.map(([x,y])=>new T.Vector2(x,-y)));
  const geo=new T.ShapeGeometry(roofShape);geo.rotateX(-Math.PI/2);
  const lid=new T.Mesh(geo,matte(b.id===170403784?0x9caaa6:0xc5cfcf));lid.position.y=wallHeight;g.add(lid);
  if(b.id===170403784){
    for(let i=0;i<7;i++){
      const x=-117+i*14.3;box(0x879a9d,x,13.42,1628,4.3,.42,139,g);
      box(0xc1d4d4,x,13.71,1628,3.6,.18,138,g);
    }return;
  }
  if(b.id===331969674)return;
  const vertices=[],indices=[],N=52;
  function roof(t,v){
    const x=23-177*t,z=1477+43*t+32*Math.sin(Math.PI*t),depth=18+4*Math.sin(t*Math.PI);
    const slope=(43+32*Math.PI*Math.cos(Math.PI*t))/177,norm=Math.hypot(1,slope);
    return [x+v*depth*slope/norm,22.9+2.3*Math.cos(t*Math.PI*2)+v*1.8+.8*(1-v*v),z+v*depth/norm];
  }
  for(let i=0;i<=N;i++){
    for(let j=0;j<=6;j++){
      vertices.push(...roof(i/N,j/3-1));if(i&&j){const k=i*7+j;indices.push(k-8,k-7,k,k-8,k,k-1);}
    }
    if(i%3===0){
      beam(g,roof(i/N,-1),roof(i/N,1),.22,0xb8c5c6);
      for(const v of [-.83,.83]){
        const [x,y,z]=roof(i/N,v);cylinder(steel,x,(12.5+y)/2,z,.23,y-12.5,8,g);
      }
    }
    if(i)for(const v of [-1,1]){
      const a=roof((i-1)/N,v),e=roof(i/N,v);beam(g,a,e,.61,0xe1e6e4);
      beam(g,[a[0],a[1]-.63,a[2]],[e[0],e[1]-.63,e[2]],.24,0xa2b6ba);
    }
  }
  const sheet=new T.BufferGeometry();sheet.setAttribute("position",new T.Float32BufferAttribute(vertices,3));sheet.setIndex(indices);sheet.computeVertexNormals();
  const roofMesh=new T.Mesh(sheet,new T.MeshStandardMaterial({color:0xdce4e4,side:T.DoubleSide,roughness:.59,metalness:.24}));g.add(roofMesh);
  // A low shopfront faces the main stair, beneath the southern end of the upper terrace.
  function pavilion(x,y,angle,w,h,d){
    const p=groupAt(x,y,angle);box(0x547580,0,h/2,-d/2,w,h,d,p);
    for(let u=-w/2+.5;u<w/2;u+=2.5)box(steel,u,h/2,.03,.13,h,.13,p);
    box(steel,0,h+.15,-d/2,w+.8,.34,d+.9,p);return p;
  }
  const cafe=pavilion(35.5,1503.3,2.69,14,10,5.5);
  box(0xd3d1bf,0,5.65,.1,14,.54,.30,cafe);
  lettering(T,cafe,"STARBUCKS",0,9.2,.20,9,.98);
  lettering(T,cafe,"다이소",0,3.23,.23,4,1.05);
  for(const [i,title] of ["태극당","브릭샌드","금옥당"].entries()){
    const row=pavilion(1.2-i*2.5,1450-i*6.1,1.20,6.3,4.4,2.9);
    lettering(T,row,title,0,3.62,.17,4.3,.82);
  }
  const outlet=pavilion(-4.8,1430,1.49,22,14.2,4);
  box(0xd9dcda,0,13.38,.15,22,1.65,.32,outlet);
  lettering(T,outlet,"LOTTE OUTLETS",0,13.43,.37,16,1.32,"#274f81");
  const west=pavilion(-161.2,1514.5,-1.19,17,12,5.8);
  box(0xe3e6e0,0,11.1,3.3,20,.58,8.4,west).rotation.x=-.16;
  for(const u of [-4.4,0,4.4]){
    box(0xc1cbca,u,7.42,.17,3.95,3.23,.26,west);
    for(const side of [-1,1]){
      box(0x527482,u+side*.9,7.36,.33,1.71,2.94,.095,west);
      box(0xc2c9c5,u+side*.22,7.11,.42,.07,.64,.06,west);
    }
  }
  lettering(T,west,"서울역   Seoul Station",0,9.8,.21,13,1.18);
  for(let j=0;j<3;j++){
    const cyl=cylinder(j===1?0x597b87:0xc6cdd0,-177,3.25+j*2.3,1571,1,j===1?3.7:1.25,48,g);
    cyl.scale.x=15.3;cyl.scale.z=25;
  }
  const arex=pavilion(-189.9,1571,-Math.PI/2,10.6,4.2,2.4);
  lettering(T,arex,"공항철도  AREX",0,3.55,.18,8.5,.79);
  for(const [x,z] of [[45,1441],[46.4,1446],[48,1451],[-201,1522],[-202,1534]]){
    cylinder(steel,x,.46,z,.15,.92,12,g);cylinder(0xd7b454,x,.72,z,.16,.09,12,g);
  }
}
