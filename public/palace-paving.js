// One repeatable colour map per finish. Tile joints and edges are painted into the
// same surface as the paving, including along stairs, grades and the ceremonial lane.
const finishes={
  brickwalk:{metres:2.2,stone:[164,126,109],joint:"#958678"},
  setts:{metres:2.4,stone:[145,139,130],joint:"#807c75"},
  granite:{metres:3.6,stone:[169,167,160],joint:"#918f88"},
  court:{metres:5.0,stone:[176,171,157],joint:"#979385"},
  royal:{metres:3.2,stone:[191,188,175],joint:"#a5a193"},
  samdo:{metres:4.8,stone:[184,182,172],joint:"#918f82"},
  gravel:{metres:2.1,stone:[184,165,135],joint:"#b8a587"}
};
export const pavingRepeat=finish=>finishes[finish]?.metres??2.4;

export function makePavingMaterial(T,name,anisotropy=4){
  const spec=finishes[name];
  if(!spec)return null;
  const size=256,canvas=document.createElement("canvas");
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext("2d");
  let seed=47821;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  const color=delta=>"rgb("+spec.stone.map(c=>Math.round(c+delta)).join(",")+")";
  ctx.fillStyle=spec.joint;ctx.fillRect(0,0,size,size);
  function slab(x,y,w,h,tone,joint=1.6,chip=1.4,slant=0){
    // Draw the very same edge stone on the other side of a texture wrap.
    for(const offset of [0,-size,size]){
      const left=x+offset+joint/2,top=y+joint/2,right=left+w-joint,bottom=top+h-joint;
      if(right<0||left>size)continue;
      ctx.beginPath();ctx.moveTo(left+chip+slant,top);ctx.lineTo(right-chip+slant,top);
      ctx.lineTo(right+slant,top+chip);ctx.lineTo(right,bottom-chip);
      ctx.lineTo(right-chip,bottom);ctx.lineTo(left+chip,bottom);
      ctx.lineTo(left,bottom-chip);ctx.lineTo(left+slant,top+chip);ctx.closePath();
      ctx.fillStyle=color(tone);ctx.fill();
      ctx.strokeStyle="rgba(249,241,221,.16)";ctx.lineWidth=.9;
      ctx.beginPath();ctx.moveTo(left+slant,top+chip);ctx.lineTo(left+chip+slant,top);
      ctx.lineTo(right-chip+slant,top);ctx.stroke();
    }
  }
  if(name==="brickwalk"){
    // Alternating pairs of fired-clay pavers, with the joint continuing across repeats.
    for(let row=0;row<8;row++)for(let col=0;col<8;col++){
      const x=col*32,y=row*32;
      for(let i=0;i<2;i++){
        const tone=(random()-.5)*20;
        if((row+col)%2)slab(x+i*16,y,16,32,tone,1.2,1.1);
        else slab(x,y+i*16,32,16,tone,1.2,1.1);
      }
    }
  }else if(name==="samdo"){
    // Map the whole width once across the road. The central course and the two
    // side courses then keep unbroken longitudinal edges all the way to the steps.
    for(const [x,width,rows,cols,tone] of [[0,77,7,2,-6],[77,102,5,2,9],[179,77,7,2,-6]]){
      let y=0;
      const heights=Array.from({length:rows},()=>.85+random()*.30);
      const total=heights.reduce((a,b)=>a+b,0);
      for(const [r,weight] of heights.entries()){
        const h=size*weight/total,division=width*(.5+(r%2?.08:-.08));
        for(let i=0;i<cols;i++)slab(i?x+division:x,y,i?width-division:division,h,tone+(random()-.5)*10,1.4,1.3);
        y+=h;
      }
    }
    for(const x of [77,179]){
      ctx.fillStyle="#8f9187";ctx.fillRect(x-1,0,2,size);
      ctx.fillStyle="#c9c8bb";ctx.fillRect(x+1,0,1,size);
    }
  }else if(name!=="gravel"){
    const rows=name==="court"?[43,57,48,49,59]:name==="setts"?Array(12).fill(size/12):Array(8).fill(32);
    let y=0;
    for(const [r,h] of rows.entries()){
      const count=name==="court"?5:name==="setts"?8:4;
      const weights=Array.from({length:count},()=>name==="royal"?1:.62+random()*.76);
      const total=weights.reduce((a,b)=>a+b,0);
      let x=r%2?-size/count*.48:0;
      const slant=name==="court"?(random()-.5)*9:0;
      for(const weight of weights){
        const w=size*weight/total;
        const band=name==="granite"&&r%4===0?-7:0;
        slab(x,y,w,h,(random()-.5)*(name==="court"?20:12)+band,
          name==="court"?1.55:1.25,name==="court"?2.4:1,slant);
        x+=w;
      }
      y+=h;
    }
  }
  const pixels=ctx.getImageData(0,0,size,size),data=pixels.data;
  for(let i=0;i<data.length;i+=4){
    const grain=(random()-.5)*(name==="gravel"?24:13);
    for(let c=0;c<3;c++)data[i+c]+=grain;
  }
  ctx.putImageData(pixels,0,0);
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
  map.minFilter=T.LinearMipmapLinearFilter;map.anisotropy=anisotropy;
  return new T.MeshStandardMaterial({map,roughness:.97,side:T.DoubleSide});
}
