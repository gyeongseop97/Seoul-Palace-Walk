// Dancheong: the painted band of lotus medallions that runs under palace eaves.
export function dancheongTexture(T){
  const c=document.createElement("canvas");c.width=256;c.height=64;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#2f6f58";ctx.fillRect(0,0,256,64);
  for(let i=0;i<4;i++){
    const x=i*64,disc=(radius,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x+32,32,radius,0,7);ctx.fill();};
    ctx.fillStyle="#b7402f";ctx.fillRect(x,0,64,9);ctx.fillRect(x,55,64,9);
    ctx.fillStyle="#e9dfc4";ctx.fillRect(x,9,64,3);ctx.fillRect(x,52,64,3);
    ctx.fillStyle="#46966f";
    ctx.beginPath();ctx.moveTo(x,14);ctx.lineTo(x+15,32);ctx.lineTo(x,50);ctx.fill();
    ctx.beginPath();ctx.moveTo(x+64,14);ctx.lineTo(x+49,32);ctx.lineTo(x+64,50);ctx.fill();
    disc(16,"#2d5fa8");disc(11,"#e9dfc4");disc(7,"#c8452f");disc(3,"#e2b43c");
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=T.RepeatWrapping;map.anisotropy=4;
  return map;
}
