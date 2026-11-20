import {shore, wave} from "./pohang-layout.js";
import {surfBounds, surfField, surfHeight} from "./pohang-surf-waves.js";

const nx = 140, nz = 350, startZ = -1650, dz = 3000 / nz;
const divisions = 4;
const coast = Array.from({length: nz + 1}, (_, j) => shore(startZ + j * dz));
const ranges = Array.from({length: nx + 1}, (_, i) => -7 + 1900 * (i / nx) ** 1.65);
const columns = nx * divisions + 1;
const dense = (i, j) => ranges[i + 1] > surfBounds.inner && ranges[i] < surfBounds.outer
  && startZ + (j + 1) * dz > surfBounds.north && startZ + j * dz < surfBounds.south;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Subdivide only the breaker patch. Border cells share its extra edge vertices,
// so no gaps open between the steep surf and the low-resolution offshore water.
export function createOceanGrid() {
  const positions = [], uv = [], fields = [], indices = [], scales = [], tiles = [];
  const corners = new Map(), borders = new Map();
  function vertex(col, row) {
    const key = row * columns + col;
    if (corners.has(key)) return corners.get(key);
    const i = Math.min(nx - 1, Math.floor(col / divisions));
    const j = Math.min(nz - 1, Math.floor(row / divisions));
    const u = col / divisions - i, v = row / divisions - j;
    const d = ranges[i] + (ranges[i + 1] - ranges[i]) * u;
    const z = startZ + (j + v) * dz, x = coast[j] + (coast[j+1] - coast[j]) * v + d;
    const f = surfField(x, z, d), fade = clamp((d + 5) / 15, 0, 1);
    const id = scales.length;
    positions.push(x, 0, z); uv.push(d, z); scales.push(fade * fade * (3 - 2 * fade));
    if (f) fields.push(f.strength, f.phase, f.group, f.alongshore);
    else fields.push(0, 0, 0, 0);
    corners.set(key, id);
    return id;
  }
  function indexCell(i,j) {
    const col = i * divisions, row = j * divisions;
    const horizontal = dense(i, j-1) || dense(i, j+1), vertical = dense(i-1, j) || dense(i+1, j);
    if (!dense(i,j) && (horizontal || vertical)) {
      const ring = [];
      // Clockwise when seen from above. Adjacent coarse cells share a single edge.
      const sides = [[0,0,0,1,dense(i-1,j)], [0,divisions,1,0,dense(i,j+1)],
        [divisions,divisions,0,-1,dense(i+1,j)], [divisions,0,-1,0,dense(i,j-1)]];
      for (const [x,z,dx,dz,refine] of sides) {
        for (let k = 0; k < divisions; k += refine ? 1 : divisions) {
          const u = x + k*dx, v = z + k*dz;
          ring.push({u:u/divisions,v:v/divisions,id:vertex(col+u,row+v)});
        }
      }
      const center = vertex(col + divisions/2, row + divisions/2);
      for (let k = 0; k < ring.length; k++) indices.push(center,ring[k].id,ring[(k+1)%ring.length].id);
      borders.set(j*nx+i, {center,ring});
      return;
    }
    const step = dense(i,j) ? 1 : divisions;
    for (let y = 0; y < divisions; y += step) for (let x = 0; x < divisions; x += step) {
      const a = vertex(col+x,row+y), b = vertex(col+x+step,row+y);
      const c = vertex(col+x,row+y+step), d = vertex(col+x+step,row+y+step);
      indices.push(c,d,b,c,b,a);
    }
  }
  // The depth and colour passes share vertices. Each tile can be culled independently.
  for(let row=0;row<nz;row+=30){
    const endRow=Math.min(row+30,nz),edge=coast.slice(row,endRow+1);
    for(let col=0;col<nx;col+=28){
      const endCol=Math.min(col+28,nx),start=indices.length;
      for(let j=row;j<endRow;j++)for(let i=col;i<endCol;i++)indexCell(i,j);
      tiles.push({start,count:indices.length-start,minX:Math.min(...edge)+ranges[col],
        maxX:Math.max(...edge)+ranges[endCol],minZ:startZ+row*dz,maxZ:startZ+endRow*dz});
    }
  }
  function vertexHeight(id, seconds) {
    return wave(positions[id*3], positions[id*3+2], seconds) * scales[id]
      + (fields[id*4] ? surfHeight(fields[id*4], fields[id*4+1], fields[id*4+2], seconds) : 0);
  }
  function height(x,z,seconds) {
    const row = clamp((z-startZ)/dz, 0, nz-1e-8), j = Math.floor(row), v = row-j;
    const d = x - coast[j] - (coast[j+1]-coast[j])*v;
    const i = clamp(Math.floor(nx * (Math.max(0,(d+7)/1900)) ** (1/1.65)), 0, nx-1);
    const u = clamp((d-ranges[i])/(ranges[i+1]-ranges[i]), 0, 1);
    const h = id => vertexHeight(id,seconds), border = borders.get(j*nx+i);
    if (border) {
      const {ring,center} = border;
      for (let k=0; k<ring.length; k++) {
        const a=ring[k], b=ring[(k+1)%ring.length];
        const ax=a.u-.5, az=a.v-.5, bx=b.u-.5, bz=b.v-.5, determinant=ax*bz-az*bx;
        const wa=((u-.5)*bz-(v-.5)*bx)/determinant, wb=(ax*(v-.5)-az*(u-.5))/determinant;
        if (wa>=-1e-9 && wb>=-1e-9) return h(center)*(1-wa-wb)+h(a.id)*wa+h(b.id)*wb;
      }
    }
    const count = dense(i,j) ? divisions : 1, step = divisions/count;
    const ix = Math.min(count-1,Math.floor(u*count)), iz = Math.min(count-1,Math.floor(v*count));
    const fx = u*count-ix, fz = v*count-iz;
    const base = (j*divisions+iz*step)*columns+i*divisions+ix*step;
    const br = h(corners.get(base+step)), tl = h(corners.get(base+step*columns));
    return fx+fz<=1 ? h(corners.get(base))*(1-fx-fz)+br*fx+tl*fz
      : h(corners.get(base+step+step*columns))*(fx+fz-1)+tl*(1-fx)+br*(1-fz);
  }
  return {positions,uv,fields,indices,tiles,height};
}
