// Keep nearby players, gestures, photos and inventory in the same logical room on both maps.
export const coastOrigin={x:10000,y:6000};
export const coastPoint=p=>({x:p.x+coastOrigin.x,y:p.z+coastOrigin.y});
export const seaPoint=p=>({x:p.x-coastOrigin.x,z:p.y-coastOrigin.y});
export const inCoastSpace=p=>Boolean(p&&p.x>=4700&&p.x<=11850&&p.y>=2600&&p.y<=7550);
