import {inCoastSpace,inGyeongjuSpace} from "./region-coordinates.js";
// Shared coordinate limits include the mapped streets west of Gyeonghuigung.
export const worldExtent={minX:-525,maxX:2100,minY:-1900,maxY:1750};
export const inGameWorld=p=>inCoastSpace(p)||inGyeongjuSpace(p)||Boolean(p&&p.x>=worldExtent.minX&&p.x<=worldExtent.maxX&&p.y>=worldExtent.minY&&p.y<=worldExtent.maxY);
