// Bake from a fully initialized game's pedestrian collision map. The resulting
// junctions and checked polylines let all clients plan the same trips offline.
export function bakeVisitorPaths({walkable,clearSegment,benches,stations,venues,busker,busStops,bikeDocks}){
  const step=2,cols=583,rows=1158,top=-1890,count=cols*rows;
  const cell=(x,y)=>Math.round((y-top)/step)*cols+Math.round(x/step);
  const xy=n=>({x:(n%cols)*step,y:top+Math.floor(n/cols)*step});
  const open=new Uint8Array(count),owner=new Int32Array(count).fill(-1),parent=new Int32Array(count).fill(-1);
  for(let n=0;n<count;n++){const p=xy(n);open[n]=+walkable(p.x,p.y);}
  const nodes=[],spots=[],queue=new Int32Array(count);
  let head=0,tail=0;
  function seed(p,activity,radius){
    const base=cell(p.x,p.y);let best=-1,d=Infinity;
    for(let j=-radius;j<=radius;j++)for(let i=-radius;i<=radius;i++){
      const n=base+i+j*cols;if(!open[n]||owner[n]>=0)continue;
      const q=xy(n),dist=Math.hypot(q.x-p.x,q.y-p.y);
      if(dist<d&&(!activity||clearSegment(q,p))){best=n;d=dist;}
    }
    if(best<0)return;
    const idx=nodes.length;nodes.push(xy(best));spots.push(activity);
    owner[best]=idx;queue[tail++]=best;
  }
  const edible=new Set(["crepe","beer","cake","yakgwa","riceCake","wine","coffee","makgeolli","highball"]);
  for(const [i,s] of stations.entries())if(edible.has(s.kind))seed(s,["shop",i],3);
  for(const v of venues)seed(v.outsideDoor,["meal",v.id],4);
  seed({x:busker.x,y:busker.y+2.8},["music"],3);
  for(const stop of busStops)seed(stop.board,["busStop",stop.id],2);
  for(const dock of bikeDocks)seed(dock.access,["bikeDock",dock.id],2);
  let lastWater=-Infinity;
  for(const [i,b] of benches.entries()){
    if(b.table||!b.slots?.[0]?.approach)continue;
    if(b.footBath&&!b.ledge)continue;
    if(!b.footBath&&!b.catPerch)continue;
    if(b.footBath&&Math.abs(b.x-lastWater)<30)continue;
    seed(b.slots[0].approach,[b.footBath?"water":"seat",i],3);
    if(b.footBath)lastWater=b.x;
  }
  // One attraction per walkable city block, including narrow alleyways.
  for(let y=top+36;y<421;y+=69)for(let x=33;x<1160;x+=69){
    const p={x,y};if(nodes.some(q=>Math.hypot(q.x-x,q.y-y)<39))continue;
    seed(p,null,15);
  }
  const edges=new Map(),deltas=[1,cols,-1,-cols,cols+1,cols-1,-cols+1,-cols-1];
  const depth=new Uint16Array(count);
  while(head<tail){
    const n=queue[head++],a=owner[n],p=xy(n);
    for(const delta of deltas){
      const next=n+delta,b=owner[next];
      if(!open[next]||a===b)continue;
      const q=xy(next);if(Math.abs(q.x-p.x)>step)continue;
      const key=a<b?a+":"+b:b+":"+a,weight=depth[n]+depth[next]+1;
      if(b>=0&&(edges.get(key)?.weight??Infinity)<=weight)continue;
      if(!clearSegment(p,q))continue;
      if(b<0){owner[next]=a;parent[next]=n;depth[next]=depth[n]+1;queue[tail++]=next;}
      else edges.set(key,{a,b,n,next,weight});
    }
  }
  function trace(n){const path=[];while(n>=0){path.push(xy(n));n=parent[n];}return path;}
  const links=[];
  for(const {a,b,n,next} of edges.values()){
    const raw=[...trace(n).reverse(),...trace(next)],via=[];
    for(let i=0;i<raw.length-1;){
      let k=i+1;
      while(k+1<raw.length&&clearSegment(raw[i],raw[k+1]))k++;
      if(k<raw.length-1)via.push(raw[k].x,raw[k].y);
      i=k;
    }
    links.push([a,b,...via]);
  }
  // A lawn pocket isolated by walls is not a destination on a citywide walk.
  const adjacent=nodes.map(()=>[]);
  for(const [a,b] of links){adjacent[a].push(b);adjacent[b].push(a);}
  const seen=new Set();let main=[];
  for(let i=0;i<nodes.length;i++){
    if(seen.has(i))continue;
    const component=[i];seen.add(i);
    for(const n of component)for(const other of adjacent[n]){
      if(!seen.has(other)){seen.add(other);component.push(other);}
    }
    if(component.length>main.length)main=component;
  }
  const ids=new Map(main.map((n,i)=>[n,i]));
  return {nodes:main.map(n=>[nodes[n].x,nodes[n].y,...(spots[n]??[])]),
    links:links.filter(([a])=>ids.has(a)).map(([a,b,...via])=>[ids.get(a),ids.get(b),...via])};
}
