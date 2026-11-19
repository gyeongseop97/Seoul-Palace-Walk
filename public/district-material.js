export function districtTile(T,color,kind){
  const canvas=document.createElement("canvas");canvas.width=canvas.height=128;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle=color;ctx.fillRect(0,0,128,128);
  if(kind==="windows"||kind==="brick"){
    ctx.fillStyle=kind==="brick"?"#8b7567":"#6f7a79";ctx.fillRect(0,0,128,3);
    ctx.fillStyle="#43575d";ctx.fillRect(21,20,86,72);
    ctx.fillStyle="#677e83";ctx.fillRect(24,23,37,65);
    ctx.fillStyle=color;ctx.fillRect(62,20,3,73);ctx.fillRect(20,48,89,3);
    ctx.fillStyle="#aaa394";ctx.fillRect(17,92,94,5);
  }else if(kind==="crossing"){
    ctx.fillStyle="#e4e0d2";ctx.fillRect(0,0,57,128);
  }else if(kind==="path"||kind==="stone"||kind==="street"){
    for(let row=0;row<4;row++){
      ctx.fillStyle="rgba(65,53,43,.22)";ctx.fillRect(0,row*32,128,1.5);
      for(let x=row%2*32;x<128;x+=64)ctx.fillRect(x,row*32,1.5,32);
    }
  }else if(kind==="tiles"){
    ctx.fillStyle="#5b6664";ctx.fillRect(0,0,15,128);ctx.fillStyle="#222b2c";ctx.fillRect(109,0,19,128);
    ctx.fillStyle="#505b59";ctx.fillRect(0,0,128,4);
  }
  let seed=2850;
  for(let i=0;i<1600;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    ctx.fillStyle=i%2?"rgba(45,40,33,.06)":"rgba(245,239,228,.07)";ctx.fillRect(seed%128,(seed>>>16)%128,1,1);
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;
  return new T.MeshStandardMaterial({map:texture,roughness:.93,side:T.DoubleSide});
}
