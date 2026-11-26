// Keep nearby players, gestures, photos and inventory in the same logical room on both maps.
export const coastOrigin={x:10000,y:6000};
export const coastPoint=p=>({x:p.x+coastOrigin.x,y:p.z+coastOrigin.y});
export const seaPoint=p=>({x:p.x-coastOrigin.x,z:p.y-coastOrigin.y});
export const inCoastSpace=p=>Boolean(p&&p.x>=4700&&p.x<=11850&&p.y>=2600&&p.y<=7550);

// Keep the KTX forecourt and the historic centre in the same city frame.
export const gyeongjuOrigin={x:30000,y:22000};
export const gyeongjuPoint=p=>({x:gyeongjuOrigin.x+p.x,y:gyeongjuOrigin.y+p.z});
export const localGyeongju=p=>({x:p.x-gyeongjuOrigin.x,z:p.y-gyeongjuOrigin.y});
export const gyeongjuBounds={minX:19000,maxX:41500,minY:19800,maxY:29500};
export const inGyeongjuSpace=p=>Boolean(p&&p.x>=gyeongjuBounds.minX&&p.x<=gyeongjuBounds.maxX&&p.y>=gyeongjuBounds.minY&&p.y<=gyeongjuBounds.maxY);
