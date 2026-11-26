// Keep one mesh kit per district. Jobs in the same street block share its
// batches, materials and textures. A teleport can preempt a partly built block.
export function nearbyConstruction(eye,meshes){
 const size=90,blocks=new Map();
 function add(p,draw){
  const x=Math.floor(p.x/size),z=Math.floor(p.z/size),id=x+","+z;
  let block=blocks.get(id);
  if(!block){block={x:(x+.5)*size,z:(z+.5)*size,jobs:[],cursor:0};blocks.set(id,block);}
  block.jobs.push(draw);
 }
 function nearest(){
  let selected,dist=Infinity;
  for(const [id,b] of blocks){
   const d=(eye.x-b.x)**2+(eye.z-b.z)**2;
   if(d<dist){dist=d;selected=id;}
  }
  return selected;
 }
 function* assemble(decorations){
  let garden=decorations;
  while(blocks.size||garden){
   const startX=eye.x,startZ=eye.z;
   if(blocks.size){
    const id=nearest(),b=blocks.get(id);
    while(b.cursor<b.jobs.length){
     const work=b.jobs[b.cursor++]();
     if(work?.next)yield* work;
     yield;
     if((eye.x-startX)**2+(eye.z-startZ)**2>size**2)break;
    }
    if(b.cursor===b.jobs.length)blocks.delete(id);
    yield* meshes.finishSteps();
   }
   if(garden){
    // Keep seeded ponds and trees in their original random sequence.
    for(let n=0;n<64;n++){
     if(garden.next().done){garden=null;break;}
     yield;
     if((eye.x-startX)**2+(eye.z-startZ)**2>size**2)break;
    }
    yield* meshes.finishSteps();
   }
  }
 }
 return {add,assemble};
}
