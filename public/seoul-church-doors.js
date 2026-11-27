// A pointed arch for the Methodist church and a semicircular arch for the cathedral.
export function churchDoor(T,{box,matte},entry,pointed){
  const group=new T.Group();group.name=entry.name+" 출입문";
  group.rotation.y=entry.facade.angle;
  const width=pointed?2.6:3.2,spring=2.35,rise=pointed?1.76:width/2;
  function arch(half,height,top,base,z,color){
    const outline=new T.Shape();
    outline.moveTo(-half,base);outline.lineTo(half,base);outline.lineTo(half,height);
    if(pointed){
      outline.quadraticCurveTo(half,height+top*.53,0,height+top);
      outline.quadraticCurveTo(-half,height+top*.53,-half,height);
    }else outline.absellipse(0,height,half,top,0,Math.PI,false,0);
    outline.closePath();
    const mesh=new T.Mesh(new T.ShapeGeometry(outline,10),matte(color));
    mesh.position.z=z;group.add(mesh);
  }
  arch(width/2+.27,spring,rise+.31,.04,.18,pointed?0xcd9e86:0xd7bea2);
  arch(width/2,spring,rise,.04,.20,0x4e3a31);
  arch(width/2-.16,spring,rise-.18,spring-.01,.22,0x677d7d);
  const leaf=width/2-.11;
  for(const side of [-1,1]){
    box(0x77503b,side*(leaf/2+.04),1.13,.23,leaf,2.15,.08,group);
    box(0x604131,side*(leaf/2+.04),1.49,.28,leaf-.24,.99,.04,group);
    box(0x664535,side*(leaf/2+.04),.55,.28,leaf-.24,.55,.04,group);
    box(0xc2a46e,side*.14,1.07,.34,.054,.24,.10,group);
  }
  box(0x523f34,0,spring,.26,width-.17,.13,.10,group);
  box(0x795e47,0,spring+(rise-.18)/2,.26,.075,rise-.18,.08,group);
  box(0x795e47,0,spring+rise*.42,.26,width*(pointed?.65:.79),.074,.08,group);
  box(0xbcb1a2,0,.04,.38,width+.45,.08,.76,group);
  return group;
}
