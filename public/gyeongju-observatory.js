// The observation chamber sits behind the opening in stone courses 13–15.
export const tower={x:630.3,z:144,yaw:0,landing:3.08};
const c=Math.cos(tower.yaw),s=Math.sin(tower.yaw);
export const towerPoint=(across,along)=>({x:tower.x+c*across+s*along,z:tower.z-s*across+c*along});
export const observatoryApproach=towerPoint(0,4.0);
export const chamberEntry=towerPoint(0,.24);
export const insideObservatory=p=>Math.hypot(p.x-tower.x,p.z-tower.z)<=1.10;
export function observatoryCameraBlocked(p,y){
 const dx=p.x-tower.x,dz=p.z-tower.z,r=Math.hypot(dx,dz);
 if(r>3||y<0||y>8.3)return false;
 const radius=1.46+1.04*(1-Math.min(1,Math.max(0,(y-.445)/7.776)))**2;
 if(y<tower.landing)return r<radius+.10;
 const across=c*dx-s*dz,along=s*dx+c*dz;
 if(along>0&&Math.abs(across)<.36&&y>4.17&&y<5.01)return false;
 return r>radius-.40&&r<radius+.14;
}
