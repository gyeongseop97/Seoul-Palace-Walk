import {buildUpperPlaza} from "./station-terrace-world.js";
import {approachHeight,escalatorSpeed,stationApproaches} from "./station-levels.js";
import {standSign} from "./regional-stands.js";
export function buildStationApproaches(T,root,kit,ground){
  const {box,wx,wz}=kit,stone=0xa9a9a3,edge=0xd7d5cb,steel=0x657779;
  buildUpperPlaza(T,kit,root,ground);
  const belts=[],dummy=new T.Object3D();
  const slab=document.createElement("canvas");slab.width=slab.height=64;
  const paint=slab.getContext("2d");paint.fillStyle="#c2a14d";paint.fillRect(0,0,64,64);
  paint.strokeStyle="#aa914c";paint.strokeRect(.5,.5,63,63);
  for(const u of [10,24,39,53])for(const v of [10,24,39,53]){
    paint.fillStyle="#a58843";paint.beginPath();paint.arc(u,v+1,3.5,0,Math.PI*2);paint.fill();
    paint.fillStyle="#ddbd68";paint.beginPath();paint.arc(u,v-1,2.8,0,Math.PI*2);paint.fill();
  }
  const warning=new T.CanvasTexture(slab);warning.colorSpace=T.SRGBColorSpace;warning.wrapS=warning.wrapT=T.RepeatWrapping;
  const warningStone=new T.MeshStandardMaterial({map:warning,roughness:.96});
  function tactileStrip(g,s,t){
    const width=s.w-.3,geo=new T.PlaneGeometry(width,.52);
    const uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*Math.round(width/.52));
    geo.rotateX(-Math.PI/2);
    const panel=new T.Mesh(geo,warningStone);panel.position.set(0,approachHeight(s,t)+.025,t);g.add(panel);
  }
  const alloy=new T.MeshStandardMaterial({color:0x586166,metalness:.48,roughness:.57});
  const nosing=new T.MeshStandardMaterial({color:0xc6ab5c,roughness:.71});
  const glass=new T.MeshStandardMaterial({color:0xa6cbd0,transparent:true,opacity:.31,depthWrite:false,side:T.DoubleSide});
  for(const s of stationApproaches){
    if(s.kind==="deck")continue;
    const g=new T.Group(),[x,y]=s.a;
    g.position.set(wx(x),ground({x,y})+.07,wz(y));g.rotation.y=Math.atan2(s.ux,s.uy);root.add(g);
    const h=t=>approachHeight(s,t),steps=s.h0!==s.h1,escalator=s.kind==="escalator";
    const tiles=Math.max(1,Math.ceil(steps?Math.abs(s.h1-s.h0)/.155:s.len/2.2));
    if(escalator){
      const run=s.len-1.2,count=Math.ceil(run/.41),pitch=run/count,lane=s.w/2-.29;
      for(const side of [-1,1]){
        const steps=new T.InstancedMesh(new T.BoxGeometry(lane,.26,pitch*.985),alloy,count);
        const lips=new T.InstancedMesh(new T.BoxGeometry(lane,.016,.034),nosing,count);
        for(const mesh of [steps,lips]){
          mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.userData.dynamic=true;mesh.frustumCulled=false;g.add(mesh);
        }
        const update=time=>{
          const phase=((time*escalatorSpeed*(-side))%pitch+pitch)%pitch;
          for(let i=0;i<count;i++){
            const t=.60+i*pitch+phase;
            dummy.position.set(side*s.w*.25,h(t)-.13,t);dummy.updateMatrix();steps.setMatrixAt(i,dummy.matrix);
            dummy.position.y+=.136;dummy.position.z-=pitch*.42;dummy.updateMatrix();lips.setMatrixAt(i,dummy.matrix);
          }
          steps.instanceMatrix.needsUpdate=lips.instanceMatrix.needsUpdate=true;
        };
        update(0);belts.push(update);
      }
      for(const end of [0,s.len])box(0x99a3a2,0,h(end)-.022,end+(end?-.24:.24),s.w-.18,.06,.94,g);
    }else for(let i=0;i<tiles;i++){
      const d=s.len/tiles,t=(i+.5)*d,top=h(t),thickness=steps&&s.h0>=0&&s.h1>=0?top+.18:.40;
      box(i%3?stone:0xb3b3ad,0,top-thickness/2,t,s.w,thickness,d+.005,g);
      if(steps)box(edge,0,top+.015,t-d*.46,s.w,.032,.075,g);
      else for(let u=-s.w/2+2;u<s.w/2;u+=2)box(0x959895,u,top+.006,t,.018,.012,d,g);
    }
    const rails=s.kind==="stairs"&&s.w>10?[-1,0,1]:[-1,1];
    if(s.kind==="stairs")for(const side of rails){
      const u=side*(s.w/2-.10);
      for(let t=1.2;t<s.len-.65;t+=2.3){
        box(steel,u,h(t)+.52,t,.075,1.03,.075,g);
        const rail=box(steel,u,h(t)+1.04,t,.10,.09,2.36,g);rail.rotation.x=-Math.atan2(s.h1-s.h0,s.len);
      }
    }
    if(s.kind==="escalator"||s.kind==="lowerLanding"){
      const beam=(a,b,r,c)=>{
        const start=new T.Vector3(...a),d=new T.Vector3(...b).sub(start),m=box(c,start.x+d.x/2,start.y+d.y/2,start.z+d.z/2,r,d.length(),r,g);
        m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());
      };
      for(const side of [-1,0,1]){
        const u=side*(s.w/2-.10);
        const breaks=escalator?[0,.8,s.len-.8,s.len]:[0,s.len];
        for(let i=1;i<breaks.length;i++){
          const a=breaks[i-1],b=breaks[i],lo=h(a),hi=h(b);
          beam([u,lo+.04,a],[u,hi+.04,b],.26,0xb6c1c1);
          beam([u,lo+.94,a],[u,hi+.94,b],.105,0x323d40);
          const v=[u,lo+.12,a,u,hi+.12,b,u,hi+.90,b,u,lo+.12,a,u,hi+.90,b,u,lo+.90,a];
          const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(v,3));geo.computeVertexNormals();
          g.add(new T.Mesh(geo,glass));
        }
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
    if(steps&&s.h0>=0){
      tactileStrip(g,s,-.36);tactileStrip(g,s,s.len+.34);
    }
    if(s===stationApproaches[1]){
      const board=new T.Group();board.position.set(-s.w/2-1,0,1.1);board.rotation.y=Math.PI;g.add(board);
      box(steel,0,1.04,0,.16,2.08,.16,board);
      standSign(T,board,"서울역  2F ↑","KTX · 맞이방",3.4,0,2.3,0,"#254764","#fff2d1",.93);
    }
  }
  return time=>{for(const update of belts)update(time);};
}
