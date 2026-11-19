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
      const d=s.len/tiles,t=(i+.5)*d,top=h(t),thickness=steps?top+.18:.40;
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
    if(s.kind==="escalator"){
      const glass=new T.MeshStandardMaterial({color:0x9fc5d3,transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide});
      const arch=new T.CylinderGeometry(2.7,2.7,s.len,20,1,true,0,Math.PI);
      arch.rotateZ(Math.PI/2);arch.rotateY(Math.PI/2);
      const cover=new T.Mesh(arch,glass);cover.position.set(0,h(s.len/2)+2.7,s.len/2);
      cover.rotation.x=-Math.atan2(s.h1-s.h0,s.len);g.add(cover);
      for(let t=0;t<=s.len;t+=3.5)for(const side of [-1,1])box(steel,side*2.15,h(t)+1.45,t,.10,2.9,.13,g);
    }
    if(s===stationApproaches[1]){
      const board=new T.Group();board.position.set(-s.w/2-1,0,1.1);board.rotation.y=Math.PI;g.add(board);
      box(steel,0,1.04,0,.16,2.08,.16,board);
      standSign(T,board,"서울역  2F ↑","KTX · 맞이방",3.4,0,2.3,0,"#254764","#fff2d1",.93);
    }
  }
}
