import {partitions} from "./culture-station-layout.js";
import {standSign} from "./regional-stands.js";

const wallpaper={hall:0xdcc7a8,first:0xe1ceac,ladies:0xdecbb7,vip:0xdac6a0,third:0xe6d9bc,grill:0xe9dbca};
const carpet=new Set(["vip","anteroom","office","grill","prep"]);
function canvasMap(T,w,h,draw){
  const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
}
function glasswork(ctx,n){
  ctx.fillStyle="#ddba6a";ctx.fillRect(0,0,n,n);
  for(let j=0;j<16;j++)for(let i=0;i<16;i++){
    ctx.fillStyle=["#fac575","#f1dd9c","#93adb1","#c48372"][(i+j+Math.abs(8-i)*Math.abs(8-j))%4];
    ctx.fillRect(i*n/16+2,j*n/16+2,n/16-4,n/16-4);
  }
  ctx.translate(n/2,n/2);
  for(const [r,color] of [[.46,"#604e42"],[.45,"#c39e63"],[.405,"#836251"],[.39,"#e5cd88"]]){
    ctx.beginPath();ctx.arc(0,0,n*r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  // A ring of linked dancers around a taegeuk. Lead lines divide the tinted panes.
  ctx.strokeStyle="#665343";ctx.lineWidth=n*.004;
  for(let i=0;i<16;i++){
    ctx.rotate(Math.PI/8);ctx.fillStyle=i%2?"#ad6b62":"#799997";
    ctx.beginPath();ctx.moveTo(n*.20,-n*.018);ctx.lineTo(n*.31,-n*.05);ctx.quadraticCurveTo(n*.33,0,n*.31,n*.050);ctx.lineTo(n*.20,n*.018);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(n*.179,0,n*.016,0,2*Math.PI);ctx.fillStyle="#d3976e";ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(n*.215,-n*.02);ctx.lineTo(n*.221,-n*.045);ctx.lineTo(n*.203,-n*.064);ctx.moveTo(n*.215,n*.02);ctx.lineTo(n*.221,n*.045);ctx.lineTo(n*.203,n*.064);ctx.stroke();
  }
  const r=n*.117;ctx.fillStyle="#5f8194";ctx.beginPath();ctx.arc(0,0,r,0,2*Math.PI);ctx.fill();
  ctx.beginPath();ctx.arc(0,0,r,Math.PI,0);ctx.arc(r/2,0,r/2,0,Math.PI);ctx.arc(-r/2,0,r/2,0,Math.PI,true);ctx.fillStyle="#bc6c5b";ctx.fill();ctx.stroke();
}
export function* buildCultureStation(T,root,kit,v){
  const g=new T.Group();g.position.set(kit.wx(v.center.x),0,kit.wz(v.center.y));root.add(g);
  const box=(color,x,h,z,w,d,l,p=g)=>kit.box(color,x,h,z,w,d,l,p);
  const rod=(c,x,h,z,r,d,n=12)=>kit.cylinder(c,x,h,z,r,d,n,g);
  const cream=0xe6d8be,wood=0x754a36,brass=0xaf8751;
  const tile=canvasMap(T,128,128,ctx=>{
    ctx.fillStyle="#b8aa92";ctx.fillRect(0,0,128,128);
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){ctx.fillStyle=["#d9cbb5","#d4c6af","#e3d5bf","#dbceba"][(i*3+j)%4];ctx.fillRect(i*32+1,j*32+1,31,31);}
    ctx.strokeStyle="#95785a";ctx.lineWidth=3;ctx.strokeRect(5,5,118,118);
  });
  tile.wrapS=tile.wrapT=T.RepeatWrapping;
  const terrazzo=new T.MeshStandardMaterial({map:tile,roughness:.65});
  for(const r of v.rooms){
    const w=r.x1-r.x0,d=r.z1-r.z0,x=(r.x0+r.x1)/2,z=(r.z0+r.z1)/2;
    if(r.key==="stair"){
      const n=20;
      for(let i=0;i<n;i++){const h=3.12*(i+.5)/n;box(0x948a77,x,h-.12,r.z0+d*(i+.5)/n,w,.24,d/n+.002);}
      for(const side of [-1,1]){
        const u=x+side*(w/2-.2),hand=box(wood,u,2.55,z,.11,.13,Math.hypot(d,3.12));hand.rotation.x=-Math.atan2(3.12,d);
        for(let i=0;i<8;i++)box(brass,u,.55+3.12*i/8,r.z0+d*i/8,.06,1.06,.06);
      }
    }else{
      box(carpet.has(r.key)?0x8c3e48:["small","gallery","conference","restoration","rto"].includes(r.key)?0xa27750:0xc2b9a3,x,-.12,z,w,.24,d);
      if(["hall","west","first","third"].includes(r.key)){
        const geo=new T.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);
        const uv=geo.attributes.uv,pos=geo.attributes.position;
        for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+x)/3.2,(pos.getZ(i)+z)/3.2);
        const floor=new T.Mesh(geo,terrazzo);floor.position.set(x,.008,z);g.add(floor);
      }
      if(r.key==="hall"&&r.name==="중앙홀"&&w>15&&d>14){
        for(const side of [-1,1]){
          box(0x80634e,x+side*(w/2-1.3),.016,z,.18,.014,d-2.5);
          box(0x80634e,x,.016,z+side*(d/2-1.3),w-2.5,.014,.18);
        }
        const ceiling=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshBasicMaterial({map:canvasMap(T,384,384,glasswork),side:T.DoubleSide}));
        ceiling.rotation.x=Math.PI/2;ceiling.position.set(x,r.height-.22,z);g.add(ceiling);
        for(const s of [-1,1]){
          box(brass,x+4.2*s,r.height-.20,z,.38,.24,8.8);
          box(brass,x,r.height-.20,z+4.2*s,8.8,.24,.38);
        }
      }
    }
    box(0xeee4d0,x,r.height+.07,z,w,.14,d);
    if(["grill","third","first","conference","vip"].includes(r.key)){
      for(let u=r.x0+2.2;u<r.x1;u+=3.6)box(cream,u,r.height-.11,z,.14,.25,d);
      for(const s of [-1,1])box(0xd1ba97,x,r.height-.22,z+s*(d/2-.15),w,.32,.31);
    }
    yield;
  }
  for(const w of partitions(v)){
    const {axis,line,lo,hi,r,q,lintel}=w,span=hi-lo,m=(lo+hi)/2;
    const along=axis==="z",h=Math.max(r.height,q?.height??0),sill=lintel?2.85:0;
    const strip=(c,y,height,depth=.17,start=lo,len=span,offset=0)=>box(c,along?start+len/2:line+offset,y,along?line+offset:start+len/2,along?len:depth,height,along?depth:len);
    strip(wallpaper[r.key]??0xded3bd,(h+sill)/2,h-sill);
    strip(0xbdab90,h-.26,.27,.29);
    if(lintel){
      strip(wood,2.87,.18,.25);for(const u of [lo,hi-.12])strip(wood,1.43,2.86,.25,u,.12);continue;
    }
    strip(["vip","grill","office"].includes(r.key)?wood:0xa18e76,.62,1.24,.20);strip(0x836b52,1.25,.09,.24);
    if(w.outer&&span>3.8&&r.key!=="stair"){
      const count=Math.floor(span/3.6);
      for(let i=0;i<count;i++){
        const u=lo+span*(i+.5)/count,ww=Math.min(2,span/count-.65);
        strip(0x77614f,2.55,2.76,.22,u-ww/2-.10,ww+.2);strip(0xb2c5be,2.55,2.53,.24,u-ww/2,ww);
        strip(wood,2.55,2.6,.26,u-.046,.092);strip(wood,2.83,.09,.26,u-ww/2,ww);
      }
    }
    if(w.outer&&r.key==="hall"&&span>7)strip(0xceba9b,8.05,.44,.55);
  }
  const plaque=(x,y,z,title,english,angle=0,w=2.8)=>{
    const tag=new T.Group();tag.position.set(x,y,z);tag.rotation.y=angle;g.add(tag);
    standSign(T,tag,title,english,w,0,0,0,"#53453d","#fbebcd",.57);
  };
  function pendant(x,z,h,arms){
    rod(brass,x,h-.53,z,.04,1);rod(brass,x,h-1.05,z,.19,.24);
    for(let i=0;i<arms;i++){
      const t=2*Math.PI*i/arms,dx=.54*Math.cos(t),dz=.54*Math.sin(t);
      const arm=box(brass,x+dx/2,h-1.1,z+dz/2,.066,.065,.55);arm.rotation.y=Math.atan2(dx,dz);
      rod(0xffe6b1,x+dx,h-1,z+dz,.14,.32,12);
    }
  }
  if(v.id==="culture284"){
    for(const x of [-5.65,5.65])for(const z of [-6.05,-4.75,.65,1.95,7.45,8.75]){
      box(0xb5aa96,x,.43,z,1.08,.86,1.08);rod(0xc5baa8,x,4.2,z,.39,6.82,20);
      for(const [h,rad] of [[.9,.51],[1.10,.45],[7.53,.49],[7.74,.60]])rod(cream,x,h,z,rad,.20,20);
      box(cream,x,8.05,z,1.43,.44,1.43);
    }
    // The western passage has a lower ceiling. Enclose the clerestory above it.
    {
      const z=-7.65;
      box(0xd1b994,0,10.20,z,19.2,13.72,.33);box(cream,0,13.95,z,19.2,.3,.52);
      const face=z<0?1:-1,front=z+face*.23;
      const fan=new T.Shape();fan.moveTo(-4.85,0);fan.absarc(0,0,4.85,Math.PI,0,true);fan.lineTo(-4.85,0);
      const light=new T.Mesh(new T.ShapeGeometry(fan,30),new T.MeshBasicMaterial({color:0xc3cebf,side:T.DoubleSide}));
      light.position.set(0,8.15,front);g.add(light);
      for(let i=0;i<=12;i++){
        const a=Math.PI*i/12,b=Math.PI*(i+1)/12,dx=4.85*Math.cos(a),dy=4.85*Math.sin(a);
        const bar=box(0x6d6355,dx/2,8.15+dy/2,front+.03*face,.085,4.85,.08);bar.rotation.z=a-Math.PI/2;
        if(i<12){
          const ex=4.85*Math.cos(b),ey=4.85*Math.sin(b);
          const trim=box(cream,(dx+ex)/2,8.15+(dy+ey)/2,front+.05*face,.20,Math.hypot(ex-dx,ey-dy),.21);trim.rotation.z=Math.atan2(ey-dy,ex-dx)-Math.PI/2;
        }
      }
      box(cream,0,8.07,front,10.3,.23,.37);
    }
    for(const z of [-5.4,1.3,8.1]){
      const a=new T.Shape();a.moveTo(-6.22,0);a.lineTo(-5.15,0);a.absarc(0,0,5.15,Math.PI,0,true);
      a.lineTo(6.22,0);a.lineTo(6.22,5.94);a.lineTo(-6.22,5.94);a.closePath();
      const arch=new T.Mesh(new T.ExtrudeGeometry(a,{depth:.53,bevelEnabled:false,curveSegments:24}),kit.matte(cream));arch.position.set(0,8.23,z-.265);g.add(arch);
    }
  }
  const named=new Set();
  for(const r of v.rooms){
    if(named.has(r.key)||["lobby","passage","west","stair"].includes(r.key))continue;
    named.add(r.key);const x=(r.x0+r.x1)/2,z=(r.z0+r.z1)/2,w=r.x1-r.x0;
    plaque(x,2.2,r.z0+.19,r.name,{"hall":"CENTRAL HALL","grill":"THE GRILL","rto":"RAILROAD TRANSPORTATION OFFICE"}[r.key]??"문화역서울284",0,Math.min(2.75,w*.7));
    if(["grill","vip","ladies","first","third"].includes(r.key))pendant(x,z,r.height,5);
    if(r.key==="vip"){
      box(0xc7b7a0,r.x0+.42,.83,z,.63,1.66,2.85);box(0x483b33,r.x0+.76,.60,z,.075,1.08,1.62);
      box(cream,r.x0+.45,1.62,z,.9,.23,3.15);
    }
    if(r.key==="grill"){
      // Front wall of the former dining room: dark panelling, crimson drapes, plaster coffers.
      for(let xx=r.x0+2.2;xx<r.x1;xx+=3.6){
        for(const side of [-1,1])box(0x833f46,xx+side*.92,2.55,r.z0+.21,.32,2.94,.23);
        box(wood,xx,4.02,r.z0+.17,2.28,.16,.22);
      }
      for(const side of [-1,1])box(0xc7b593,x,r.height-.18,z+side*(r.z1-r.z0)*.31,w-.5,.19,.24);
    }
    if(r.key==="restoration"){
      for(let i=0;i<3;i++){
        const xx=r.x0+.75+i*1.2;box(wood,xx,.5,r.z0+.8,.93,.96,.65);
        rod(i%2?0x69796c:0xb89571,xx,1.12,r.z0+.8,.24,.31,i%2?16:6);
      }
    }
    if(r.key==="rto"){box(wood,x,.23,r.z0+1.6,w-.8,.46,3);box(0x493f3c,x,2.4,r.z0+.18,w-.6,4.8,.25);}
  }
  g.add(new T.HemisphereLight(0xffe7bd,0xd7c3b2,1.18));
  return {room:g};
}
