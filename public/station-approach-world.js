import {approachAt,stationApproaches} from "./station-levels.js";
import {standSign} from "./regional-stands.js";
export function buildStationApproaches(T,root,kit,ground){
  const {box,wx,wz}=kit,stone=0xa9a9a3,edge=0xd7d5cb,steel=0x657779;
  for(const s of stationApproaches){
    const g=new T.Group(),[x,y]=s.a;
    g.position.set(wx(x),ground({x,y})+.07,wz(y));g.rotation.y=Math.atan2(s.ux,s.uy);root.add(g);
    const h=t=>s.h0+(s.h1-s.h0)*t/s.len,steps=s.h0!==s.h1;
    const tiles=Math.max(1,Math.ceil(steps?Math.abs(s.h1-s.h0)/.155:s.len/2.2));
    for(let i=0;i<tiles;i++){
      const d=s.len/tiles,t=(i+.5)*d,top=h(t),thickness=steps&&s.h0>=0&&s.h1>=0?top+.18:.40;
      box(i%3?stone:0xb3b3ad,0,top-thickness/2,t,s.w,thickness,d+.005,g);
      if(steps)box(edge,0,top+.015,t-d*.46,s.w,.032,.075,g);
      else for(let u=-s.w/2+2;u<s.w/2;u+=2)box(0x959895,u,top+.006,t,.018,.012,d,g);
    }
    if(s.kind==="deck"){
      for(let t=3;t<s.len-1;t+=9)for(const side of [-1,1])
        box(0x969b98,side*s.w*.32,h(t)/2,t,.43,h(t),.65,g);
    }
    const rails=s.kind==="stairs"&&s.w>10?[-1,0,1]:[-1,1];
    for(const side of rails){
      const u=side*(s.w/2-.10);
      for(let t=1.2;t<s.len-.65;t+=2.3){
        // Leave openings where two elevated walkways meet along an edge.
        const outside=s.w/2+.24,px=x+s.ux*t+s.uy*side*outside,py=y+s.uy*t-s.ux*side*outside;
        const other=side&&approachAt(px,py);
        if(other&&other.s!==s&&Math.abs(other.height-h(t))<.5)continue;
        box(steel,u,h(t)+.52,t,.075,1.03,.075,g);
        const rail=box(steel,u,h(t)+1.04,t,.10,.09,2.36,g);rail.rotation.x=-Math.atan2(s.h1-s.h0,s.len);
      }
    }
    if(s.kind==="escalator"||s.kind==="lowerLanding"){
      const glass=new T.MeshStandardMaterial({color:0x9fc5d3,transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide});
      const beam=(a,b,r,c)=>{
        const start=new T.Vector3(...a),d=new T.Vector3(...b).sub(start),m=box(c,start.x+d.x/2,start.y+d.y/2,start.z+d.z/2,r,d.length(),r,g);
        m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());
      };
      for(const side of [-1,0,1]){
        const u=side*(s.w/2-.10);
        beam([u,s.h0+.69,0],[u,s.h1+.69,s.len],.37,0xb1bec0);
        beam([u,s.h0+1.0,0],[u,s.h1+1.0,s.len],.123,0x3f4b4d);
      }
      if(!s.open){
        const count=Math.ceil(s.len/3.5),curve=(j,t)=>{const a=Math.PI*j/12;return [2.32*Math.cos(a),h(t)+2.05+1.53*Math.sin(a),t];};
        const verts=[];
        for(let k=0;k<=count;k++){
          const t=s.len*k/count;
          for(const side of [-1,1])box(steel,side*2.31,h(t)+1.03,t,.1,2.06,.12,g);
          for(let j=0;j<12;j++){
            const a=curve(j,t),b=curve(j+1,t);beam(a,b,.09,steel);
            if(k<count){const c=curve(j+1,s.len*(k+1)/count),d=curve(j,s.len*(k+1)/count);verts.push(...a,...b,...c,...a,...c,...d);}
          }
        }
        const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();g.add(new T.Mesh(geo,glass));
        if(s.h0<0)for(const side of [-1,1])for(let i=0;i<tiles;i++){
          const t=s.len*(i+.5)/tiles,depth=-h(t);if(depth>.08)box(0x88918e,side*(s.w/2+.06),-depth/2,t,.16,depth+.1,s.len/tiles+.01,g);
        }
      }
    }
    if(s===stationApproaches[1]){
      const board=new T.Group();board.position.set(-s.w/2-1,0,1.1);board.rotation.y=Math.PI;g.add(board);
      box(steel,0,1.04,0,.16,2.08,.16,board);
      standSign(T,board,"서울역  2F ↑","KTX · 맞이방",3.4,0,2.3,0,"#254764","#fff2d1",.93);
    }
  }
}
