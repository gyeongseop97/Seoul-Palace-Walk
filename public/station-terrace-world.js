import {stationTerraces} from "./station-terraces.js";
import {stationApproaches,stationRise} from "./station-levels.js";
import {districtTile} from "./district-material.js";

export function buildUpperPlaza(T,kit,root,ground){
  const {box,wx,wz}=kit,stone=districtTile(T,"#b7b5ac","stone");
  const y=ground({x:0,y:1480})+stationRise+.07,edge=0x9a9f9c,metal=0x677979;
  const contour=ring=>ring.map(([x,z])=>new T.Vector2(wx(x),-wz(z)));
  function entranceEdge(x,z){
    for(const s of stationApproaches){
      if(s.h0===s.h1)continue;
      const dx=x-s.b[0],dz=z-s.b[1];
      if(Math.abs(dx*s.ux+dz*s.uy)<2&&Math.abs(dz*s.ux-dx*s.uy)<s.w/2+.8)return true;
    }
    // Exposed roadside edges need guards. Edges along the hall glazing and cafe stay open.
    if(z>1452&&x<.76*(z-1458)+2.3||z>1498&&x>26)return true;
    if(Math.hypot(x+62.7,z-1408.4)<4||Math.hypot(x+165.4,z-1516.2)<6)return true;
    return false;
  }
  for(const {rings} of stationTerraces){
    const shape=new T.Shape(contour(rings[0]));
    for(const hole of rings.slice(1))shape.holes.push(new T.Path(contour(hole)));
    const geometry=new T.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
    const {uv,position}=geometry.attributes;
    for(let i=0;i<uv.count;i++)uv.setXY(i,position.getX(i)/2.8,position.getZ(i)/2.8);
    const top=new T.Mesh(geometry,stone);top.position.y=y;top.receiveShadow=true;root.add(top);
    for(const ring of rings)for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(length<.02)continue;
      const g=new T.Group();g.position.set(wx(a[0]),y,wz(a[1]));g.rotation.y=Math.atan2(dx,dz);root.add(g);
      box(edge,0,-.27,length/2,.095,.54,length,g);
      const count=Math.ceil(length/2.1),bay=length/count;
      for(let k=0;k<count;k++){
        const mid=(k+.5)/count;
        if(length<.64||entranceEdge(a[0]+dx*mid,a[1]+dz*mid))continue;
        box(metal,0,.55,k*bay+.035,.075,1.10,.075,g);
        box(metal,0,1.07,(k+.5)*bay,.095,.084,bay,g);
        box(0x9ba9a8,0,.60,(k+.5)*bay,.045,.049,bay,g);
      }
    }
  }
  for(const [x,z] of [[-37,1414],[-58,1414],[-82,1414],[-102,1414],[-119,1403],[16,1456],[31,1488]]){
    const h=y-ground({x,y:z})-.54;
    box(0x959c99,wx(x),y-.54-h/2,wz(z),1.02,h,1.3,root);
  }
}
