export function buildKtx(T,train,{box,rod,group,girder,paintMap},livery="sancheon",boarding=true){
  // Lofted car bodies: one cross-section is carried along each car and tapered into the nose.
  // Each strip of the section has its own colour, which gives the livery its clean bands.
  const text=(parent,title,x,y,z,w,h,ink,angle=0,weight="bold")=>{
    const map=paintMap(512,128,(ctx,cw,ch)=>{ctx.fillStyle=ink;ctx.font=weight+" 86px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(title,cw/2,ch/2+4,cw-16);},false);
    const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false}));
    panel.position.set(x,y,z);panel.rotation.y=angle;parent.add(panel);
  };
  const section=[[0,-.72],[1.30,-.72],[1.44,-.60],[1.56,-.10],[1.63,.60],[1.655,1.12],[1.66,1.34],[1.66,1.42],[1.615,2.30],[1.56,2.45],[1.43,2.70],[1.15,2.90],[.70,3.03],[0,3.06]];
  const liveries={
    sancheon:{body:0xf1f3f1,roof:0xd5dbda,skirt:0x7f888c,band:0x161c21,stripe:0x1d4f91,accent:0x1d4f91,pane:0x2f4558},
    classic:{body:0xe9ecea,roof:0xc9d0d0,skirt:0x9aa3a6,band:0x1f4f8f,stripe:0xf1f3f1,accent:0x1f4f8f,pane:0x1b2c40}
  };

  const look=liveries[livery],tint=new T.Color();
  const strip=[0x30363a,look.skirt,look.skirt,look.body,look.body,look.stripe,look.body,look.band,look.body,look.roof,look.roof,look.roof,look.roof];
  // z, width scale, height and underside of each station along the cab car.
  const nose=[[-40,.10,.55,.05],[-39.6,.34,1.05,-.25],[-38.8,.58,1.55,-.50],[-37.6,.78,2.05,-.66],[-36.2,.90,2.55,-.72],[-34.6,.97,3.05,-.72],[-33,1,3.5,-.72],[-31.6,1,3.78,-.72],[-18,1,3.78,-.72]];
  const at=([z,w,h,b],i,side)=>[side*section[i][0]*w,b+(section[i][1]+.72)/3.78*h,z];
  const xyz=[],rgb=[];
  function loft(stations,cab){
    for(let k=1;k<stations.length;k++)for(const side of [-1,1])for(let i=0;i<section.length-1;i++){
      const a=at(stations[k-1],i,side),b=at(stations[k],i,side),c=at(stations[k],i+1,side),d=at(stations[k-1],i+1,side);
      let color=strip[i];
      if(cab){
        // The blue of the nose sweeps back into the stripe; the cab car has no window band.
        if(i===7)color=look.body;
        if(stations[k][0]<=-34.6&&i>=3&&i<=6)color=look.accent;
        if(stations[k][0]<=-37.6&&i>=1&&i<=8)color=look.accent;
      }
      tint.setHex(color,T.SRGBColorSpace);
      for(const point of side>0?[a,b,c,a,c,d]:[a,c,b,a,d,c]){xyz.push(...point);rgb.push(tint.r,tint.g,tint.b);}
    }
    for(const [station,flip] of [[stations[0],1],[stations.at(-1),-1]]){
      tint.setHex(0x2a3034,T.SRGBColorSpace);
      for(const side of [-1,1])for(let i=0;i<section.length-1;i++){
        const a=at(station,i,side),b=at(station,i+1,side),centre=[0,station[3]+station[2]/2,station[0]];
        for(const point of side*flip>0?[centre,b,a]:[centre,a,b]){xyz.push(...point);rgb.push(tint.r,tint.g,tint.b);}
      }
    }
  }
  loft(nose,true);
  const cars=[[-17.4,2.9],[3.4,23.7],[24.2,44.5]];
  for(const [a,b] of cars)loft([[a,1,3.78,-.72],[b,1,3.78,-.72]],false);
  const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(xyz,3));
  geo.setAttribute("color",new T.Float32BufferAttribute(rgb,3));geo.computeVertexNormals();
  const body=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.34,metalness:.22,side:T.DoubleSide}));body.castShadow=true;train.add(body);
  // Wraparound windscreen, side cab windows, headlights and the coupler hatch.
  const dark=new T.MeshStandardMaterial({color:0x10161b,roughness:.16,metalness:.5,side:T.DoubleSide});
  const lift=(station,i,side,out=.02)=>{const p=at(station,i,side);return [p[0]+side*out*.5,p[1]+out,p[2]];};
  const patch=(points,material=dark)=>{
    const quad=new T.BufferGeometry();quad.setAttribute("position",new T.Float32BufferAttribute(points.flat(),3));
    quad.setIndex([0,1,2,0,2,3]);quad.computeVertexNormals();train.add(new T.Mesh(quad,material));
  };
  for(const side of [-1,1]){
    patch([lift(nose[3],13,side),lift(nose[3],11,side),lift(nose[5],11,side),lift(nose[5],13,side)]);
    patch([lift(nose[3],11,side),lift(nose[3],9,side),lift(nose[5],10,side),lift(nose[5],11,side)]);
    patch([lift(nose[5],9,side,.03),lift(nose[5],8,side,.03),lift(nose[6],8,side,.03),lift(nose[6],9,side,.03)]);
    const lamp=at(nose[2],5,side),glow=new T.Mesh(new T.SphereGeometry(.17,12,8),new T.MeshBasicMaterial({color:0xfff2c4}));
    glow.position.set(lamp[0]*.92,lamp[1]+.04,lamp[2]+.12);glow.scale.set(.7,.5,1.5);train.add(glow);
    const tail=at(nose[2],3,side);box(0xc23a2f,tail[0]*.9,tail[1]+.1,tail[2]+.1,.14,.09,.3,train);
  }
  box(0x23292d,0,.2,-39.92,.5,.34,.2,train);
  // Cooling grilles and the wordmark on the power car.
  for(const side of [-1,1]){
    for(let j=0;j<9;j++)box(0x3a4349,side*1.645,1.86,-29.6+j*.82,.05,.82,.5,train).rotation.z=side*.05;
    text(train,"KTX",side*1.672,.68,-22.4,2.5,.62,livery==="sancheon"?"#1d4f91":"#ffffff",side*Math.PI/2);
  }
  const glass=new T.MeshStandardMaterial({color:look.pane,roughness:.12,metalness:.55});
  const windowShape=new T.BoxGeometry(.03,.66,1.44);
  for(const [index,[a,b]] of cars.entries()){
    const len=b-a,mid=(a+b)/2;
    for(const side of [-1,1]){
      for(let z=a+2.1;z<b-1.6;z+=1.72){
        if(boarding&&index===1&&side<0&&Math.abs(z-12)<1.6)continue;
        const pane=new T.Mesh(windowShape,glass);pane.position.set(side*1.647,1.87,z);pane.rotation.z=side*.051;train.add(pane);
      }
      text(train,"KTX",side*1.672,.72,a+2.2,1.5,.38,livery==="sancheon"?"#1d4f91":"#ffffff",side*Math.PI/2);
      text(train,(index+1)+"호차",side*1.672,.72,b-1.9,.9,.24,"#3a454c",side*Math.PI/2,"600");
      // Plug door with its window, step and yellow leading edges.
      const doorZ=index===1?12:a+1.1,door=group(side*1.665,doorZ,0,train);
      if(!(boarding&&index===1&&side<0)){
        box(look.body,0,1.02,0,.05,2.3,1.02,door);box(0x1a2228,side*.012,1.62,0,.04,.78,.5,door);box(0x9aa5a8,0,-.1,0,.3,.06,1.08,door);
        for(const dz of [-.52,.52])box(0x8c979b,side*.01,1.02,dz,.05,2.3,.03,door);
      }
    }
    box(0x1f2529,0,1.2,b+.33,2.7,2.86,.62,train);
    // Bogies, underfloor equipment and roof fairings.
    for(const z of [a+2.4,b-2.4]){
      box(0x2e3438,0,-.86,z,2.3,.26,3.1,train);
      for(const side of [-1,1])for(const dz of [-.95,.95]){
        const wheel=rod(0x3c4348,side*.72,-1.02,z+dz,.44,.14,train);wheel.rotation.z=Math.PI/2;
        const rim=rod(0xa9b1b3,side*.8,-1.02,z+dz,.3,.03,train);rim.rotation.z=Math.PI/2;
        box(0x555d62,side*1.08,-.94,z+dz,.14,.2,.4,train);
      }
    }
    box(0x3a4146,0,-.92,mid,2.5,.42,len-8.6,train);
    box(look.roof,0,3.1,mid,1.5,.16,len*.42,train);
    for(const side of [-1,1])box(look.skirt,side*1.43,-.72,mid,.06,.5,len-6.4,train);
  }
  // Pantograph on the second car.
  const pan=group(0,7.5,0,train);box(0x4a5257,0,3.2,0,1.1,.1,1.5,pan);
  girder(pan,[0,3.25,-.5],[0,3.95,.4],.06,0x30363a);girder(pan,[0,3.95,.4],[0,4.55,-.3],.05,0x30363a);box(0x30363a,0,4.57,-.3,1.5,.04,.26,pan);
  return train;
}
