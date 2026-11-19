// Visitor rooms traced from MCST's 2024 문화역서울284 층별 평면도 (sheet 2).
// The two sheets have different scales. Local +z faces the plaza on both plans.
const levels=[
  {id:"culture284",name:"문화역서울284 · 1층",center:{x:1900,y:810},scale:.126,origin:[602,512],
    outsideDoor:{x:26.5,y:1323,heading:90},exit:[602,666],spawn:[602,647],enterLabel:"문화역서울284 들어가기",exitLabel:"서울역광장으로",
    rooms:[
      ["hall","중앙홀",525,451,678,598,17],["hall","중앙홀",550,434,650,451,17],
      ["hall","현관",556,598,650,676,12],["first","1·2등 대합실",399,451,525,547,6.1],
      ["ladies","부인대합실",326,451,399,504,5.88],["office","역장실",243,451,310,489,4.58],
      ["vip","귀빈실",168,450,243,556,4.54],["anteroom","귀빈예비실",243,504,310,556,4.6],
      ["west","서측복도",244,407,854,451,3.5],["west","귀빈실 전실",225,432,244,451,3.5],
      ["lobby","남측 복도",310,451,326,556,4.6],["lobby","남측 복도",243,489,310,504,4.6],
      ["lobby","계단 앞",326,504,399,530,4.6],["stair","그릴로 오르는 계단",361,530,391,593,6.2],
      ["third","3등 대합실",678,451,850,578,7],["third","3등 대합실",850,496,872,555,7]],
    openings:[["hall","first",.68],["hall","third",.55],["hall","west",.54],["west","first",.45],["west","third",.43],["west","ladies",.77],["west","office",.45],["west","vip",.7],["ladies","lobby",.7],["lobby","anteroom",.52],["vip","anteroom",.62],["lobby","office",.40],["lobby","first",.45],["lobby","stair",.51]]},
  {id:"culture284-grill",name:"문화역서울284 · 2층",center:{x:1900,y:900},scale:.113,origin:[529,170],
    parent:"culture284",outside:[376,585],exit:[247,191],spawn:[271,191],enterLabel:"2층 그릴 관람",exitLabel:"1층 계단으로",
    rooms:[["restoration","복원전시실",173,131,261,213,4.27],["prep","그릴준비실",173,70,261,131,4.27],
      ["grill","그릴",261,80,467,179,6.08],["gallery","랑하복도",261,179,467,213,4.28],
      ["small","소식당",467,80,589,105,7.27],["passage","중앙홀 옆 복도",589,80,625,213,3.8],
      ["passage","북측 복도",625,125,884,147,3.8],["conference","구회의실",625,147,791,213,3.8]],
    openings:[["restoration","gallery",.47],["restoration","prep",.55],["prep","grill",.56],["gallery","grill",.32],["grill","small",.50],["small","passage",.45],["passage","conference",.46]]},
  {id:"culture284-rto",name:"문화역서울284 · RTO",center:{x:1900,y:975},scale:1,origin:[0,0],
    outsideDoor:{x:13,y:1259,heading:90},exit:[0,7.3],spawn:[0,5.5],enterLabel:"RTO 들어가기",exitLabel:"북측 광장으로",
    rooms:[["rto","RTO 공연장",-10,-8,10,8,6]],openings:[]}
];
export const cultureVenues=levels.map(l=>{
  const local=(x,y)=>({x:(x-l.origin[0])*l.scale,y:(y-l.origin[1])*l.scale});
  const point=(x,y)=>{const p=local(x,y);return {x:l.center.x+p.x,y:l.center.y+p.y};};
  const rooms=l.rooms.map(([key,name,x,y,x1,y1,height])=>{
    const a=local(x,y),b=local(x1,y1);return {key,name,x0:a.x,z0:a.y,x1:b.x,z1:b.y,height};
  });
  const {x,y}=l.center;
  return {...l,area:"station",point,rooms,bounds:{minX:x+Math.min(...rooms.map(r=>r.x0)),maxX:x+Math.max(...rooms.map(r=>r.x1)),
    minY:y+Math.min(...rooms.map(r=>r.z0)),maxY:y+Math.max(...rooms.map(r=>r.z1))},
    insideDoor:{...point(...l.exit),heading:180},insideSpawn:{...point(...l.spawn),heading:0}};
});
export const cultureFrontDoors=[-4.05,0,4.05].map((d,i)=>({outside:{x:26.5,y:1323+d,heading:90},
  inside:{...cultureVenues[0].point(602+(1-i)*28,666),heading:180}}));
cultureVenues[1].outsideDoor={...cultureVenues[0].point(...levels[1].outside),heading:0};
export function culturePart(x,y){
  for(const venue of cultureVenues){
    const b=venue.bounds;
    if(x<b.minX||x>b.maxX||y<b.minY||y>b.maxY)continue;
    const u=x-venue.center.x,z=y-venue.center.y;
    for(const r of venue.rooms)if(u>=r.x0-1e-7&&u<=r.x1+1e-7&&z>=r.z0-1e-7&&z<=r.z1+1e-7)return {venue,r,u,z};
  }
  return null;
}
export function cultureHeight(x,y){
  const p=culturePart(x,y);
  return p?.r.key==="stair"?3.12*(p.z-p.r.z0)/(p.r.z1-p.r.z0):null;
}
// Segment a shared partition at every room corner; cut the same door in its mesh and collider.
export function partitions(v){
  const walls=[],axes=["x","z"];
  for(const axis of axes){
    const other=axis==="x"?"z":"x",a0=axis+"0",a1=axis+"1",b0=other+"0",b1=other+"1";
    for(const line of new Set(v.rooms.flatMap(r=>[r[a0],r[a1]]))){
      const edges=v.rooms.filter(r=>r[a0]===line||r[a1]===line);
      const stops=[...new Set(edges.flatMap(r=>[r[b0],r[b1]]))].sort((a,b)=>a-b);
      for(let i=1;i<stops.length;i++){
        const lo=stops[i-1],hi=stops[i],mid=(lo+hi)/2;
        const touching=edges.filter(r=>r[b0]<mid&&mid<r[b1]);if(!touching.length)continue;
        const [r,q]=touching;if(q&&q.key===r.key)continue;
        // A smaller extension can meet the interior of another rectangular room.
        if(v.rooms.some(p=>p[a0]<line&&line<p[a1]&&p[b0]<mid&&mid<p[b1]))continue;
        const spec=q&&v.openings.find(([a,b])=>(r.key===a&&q.key===b)||(q.key===a&&r.key===b));
        const width=spec?Math.min(2.7,(hi-lo)*.79):0,door=spec?lo+(hi-lo)*spec[2]:0;
        const push=(a,b,lintel=false)=>{if(b-a>.025)walls.push({axis,line,lo:a,hi:b,r,q,lintel,outer:!q});};
        if(width){
          const from=Math.max(lo+.06,door-width/2),to=Math.min(hi-.06,door+width/2);push(lo,from);push(from,to,true);push(to,hi);
        }else push(lo,hi);
      }
    }
  }return walls;
}
export function registerCultureFurniture(add){
  for(const v of cultureVenues){
    for(const w of partitions(v)){
      if(w.lintel)continue;
      const mid=(w.lo+w.hi)/2,z=w.axis==="z";
      add(v.center.x+(z?mid:w.line),v.center.y+(z?w.line:mid),z?w.hi-w.lo:.12,z?.12:w.hi-w.lo);
    }
    if(v.id==="culture284")for(const x of [-5.65,5.65])for(const z of [-6.05,-4.75,.65,1.95,7.45,8.75])add(v.center.x+x,v.center.y+z,.72,.72);
  }
}
