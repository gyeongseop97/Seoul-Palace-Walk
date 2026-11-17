import {makeTreeBuilder} from "./lowpoly-trees.js";
import {bankAt,cheonggyeAccess,cheonggyeAccessDrop,cheonggyeBedLevel,cheonggyeBounds,cheonggyeBridges,cheonggyeCascade,cheonggyeLevel,
  cheonggyeOpenAir,cheonggyeRailOpening,cheonggyeRoadLeads,cheonggyeStations,cheonggyeSurfaces,cheonggyeTrees,cheonggyeWalkFrom,riverAt,stepStoneXs} from "./cheonggye-layout.js";
import {CHEONGGYE_WATER_LEVEL,cheonggyeSeats} from "./cheonggye-seats.js";

export function* buildCheonggye(T,root,kit,terrain){
  const {wx,wz,box,cylinder,matte}=kit;
  const at=(x,y)=>terrain({x,y});
  let seed=7341;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const concrete=0x8b8f84,granite=0xa6a99b,cap=0xbcc0b3,rail=0x424b48;
  const stone=[0xa6a596,0x9a9d91,0x929489,0xa1a092,0xaaa89d,0x8d9086];
  const waterLevel=CHEONGGYE_WATER_LEVEL;
  function block(color,x,y,width,length,height,level,angle=0){
    const mesh=box(color,wx(x),level+height/2,wz(y),width,height,length,root);
    mesh.rotation.y=angle;
    return mesh;
  }
  function strip(color,a,b,width,height,level){
    const x=(a.x+b.x)/2,y=(a.y+b.y)/2,dy=b.y-a.y,dx=b.x-a.x;
    return block(color,x,y,Math.hypot(dx,dy)+.01,width,height,at(x,y)+level,-Math.atan2(dy,dx));
  }
  function mesh(vertices,indices,material){
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);
    if(material.map){
      const uv=[];
      for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]/3.2,vertices[i+2]/3.2);
      geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    }
    geometry.computeVertexNormals();
    const model=new T.Mesh(geometry,material);
    model.userData.terrainSurface=true;model.receiveShadow=true;root.add(model);
    return model;
  }
  function surface(outline,material,offset){
    const contour=outline.map(({x,y})=>new T.Vector2(wx(x),-wz(y)));
    const pos=outline.flatMap(({x,y})=>[wx(x),at(x,y)+offset,wz(y)]);
    return mesh(pos,T.ShapeUtils.triangulateShape(contour,[]).flat(),material);
  }
  function grid(rows,material){
    const vertices=rows.flatMap(row=>row.flatMap(({x,y,level})=>[wx(x),at(x,y)+level,wz(y)])),indices=[];
    const sides=rows[0].length;
    for(let i=1;i<rows.length;i++)for(let j=1;j<sides;j++){
      const a=(i-1)*sides+j-1,b=a+sides;
      indices.push(a,a+1,b,b,a+1,b+1);
    }
    return mesh(vertices,indices,material);
  }
  function stoneTiles(w,h,tones,stagger){
    const size=128,pixels=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const row=Math.floor(y/h),along=(x+row*stagger)%size,column=Math.floor(along/w);
      const border=along%w===0||y%h===0,bevel=along%w===1||y%h===1;
      const block=tones[(row*29+column*17+row*column)%tones.length],grain=(x*19+y*71+(x*y)%11)%9-4;
      const shade=border?119+grain:bevel?Math.min(244,block+12):block+grain;
      pixels.set([shade,shade-2,shade-7,255],(y*size+x)*4);
    }
    const map=new T.DataTexture(pixels,size,size);
    map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
    map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.anisotropy=4;map.generateMipmaps=true;
    map.needsUpdate=true;return map;
  }
  const slabs=stoneTiles(32,16,[184,195,209,201,190,218],16);
  const cobbles=stoneTiles(16,16,[160,183,177,189,171,194],8);
  const paving=new T.MeshStandardMaterial({color:0xdfdfd6,map:slabs,roughness:.96,side:T.DoubleSide});
  const darkPaving=new T.MeshStandardMaterial({color:0xc9cfc5,map:slabs,roughness:.93,side:T.DoubleSide});
  const asphalt=new T.MeshStandardMaterial({color:0x686d66,roughness:1,side:T.DoubleSide});
  const lower=new T.MeshStandardMaterial({color:0xd8d0bb,map:cobbles,roughness:.97,side:T.DoubleSide});
  // Clear, shallow water: the pebbled bed shows through with moving light on it, the surface
  // ripples downstream and mirrors the sky, and foam gathers at the banks and below the falls.
  const waterNoise=`
    float hash(vec2 p){p=fract(p*vec2(.1371,.0917)+.13);p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x*7.31);}
    vec2 hash2(vec2 p){float n=hash(p);return vec2(n,hash(p*1.31+n*5.7+2.9));}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p){return .56*noise(p)+.29*noise(p*2.07+3.1)+.15*noise(p*4.31+7.7);}`;
  const water=new T.ShaderMaterial({
    uniforms:{clock:{value:0},night:{value:0},mist:{value:new T.Color(0xa4b3b4)}},
    side:T.DoubleSide,
    vertexShader:`
      attribute vec2 stream;
      varying vec3 point;
      varying vec2 flow;
      varying float viewDepth;
      void main(){
        point=(modelMatrix*vec4(position,1.)).xyz;
        flow=stream;
        vec4 view=modelViewMatrix*vec4(position,1.);
        viewDepth=-view.z;
        gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`
      uniform float clock,night;
      uniform vec3 mist;
      varying vec3 point;
      varying vec2 flow;
      varying float viewDepth;
      ${waterNoise}
      // Distance to the nearest cell centre, the gap to the next one, and a tone for the cell.
      vec3 cells(vec2 p){
        vec2 i=floor(p),f=fract(p);float best=8.,next=8.,tone=0.;
        for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
          vec2 g=vec2(float(x),float(y)),o=hash2(i+g);float d=length(g+o-f);
          if(d<best){next=best;best=d;tone=o.x;}else if(d<next)next=d;
        }
        return vec3(best,next-best,tone);
      }
      // The surface as a height: ripples carried downstream, quicker and rougher in white water.
      float swell(vec2 p,float rough){
        float t=clock;
        return fbm(vec2(p.x-t*.62,p.y+sin(p.x*.31+t*.4)*.12)*vec2(1.25,2.3))*.62
          +fbm(vec2(p.x-t*1.05,p.y)*vec2(3.1,5.4)+11.)*(.24+rough*.34)
          +noise(vec2(p.x-t*1.6,p.y)*vec2(7.4,11.)+31.)*(.07+rough*.16);
      }
      void main(){
        // flow.x runs along the stream in metres; flow.y is -1 at the north edge and 1 at the south.
        float edge=abs(flow.y),along=flow.x;
        // Kept near zero so the noise stays crisp.
        vec2 p=vec2(along-840.,point.z+355.);
        float churn=step(623.5,along)*(1.-smoothstep(1.2,7.,along-624.));
        float stones=smoothstep(651.5,653.5,along)*(1.-smoothstep(670.5,679.,along));
        float rough=clamp(churn+stones*.55,0.,1.);
        float e=.07,h=swell(p,rough);
        vec2 slope=vec2(swell(p+vec2(e,0.),rough)-h,swell(p+vec2(0.,e),rough)-h)/e;
        vec3 normal=normalize(vec3(-slope.x*.105,1.,-slope.y*.105));
        vec3 eye=normalize(cameraPosition-point);
        float facing=clamp(dot(normal,eye),0.,1.);
        // Looking through the surface: the bed lies a little further along the line of sight.
        float depth=mix(.10,.44,1.-edge*edge)*(.8+.4*noise(p*.21+5.));
        vec2 bed=p-eye.xz/max(eye.y,.32)*depth*.72-normal.xz*depth*1.9;
        vec3 pebble=cells(bed*4.4);
        vec3 ground=mix(vec3(.17,.165,.125),vec3(.47,.43,.32),pebble.z*pebble.z);
        ground*=.38+.62*smoothstep(.01,.20,pebble.y);
        ground=mix(ground,vec3(.085,.15,.070),smoothstep(.30,.80,fbm(bed*.42+2.))*.66);
        // Sunlight gathered by the ripples into a moving net on the bed.
        vec2 warp=vec2(fbm(bed*.9+clock*.11),fbm(bed*.9+17.-clock*.13));
        float net=cells(bed*1.35+warp*1.5+vec2(-clock*.21,clock*.05)).y;
        float fine=cells(bed*2.9-warp*1.1+vec2(-clock*.33,-clock*.07)).y;
        float caustic=pow(1.-smoothstep(0.,.26,net),3.6)*.8+pow(1.-smoothstep(0.,.22,fine),4.)*.35;
        float day=1.-night;
        vec3 lit=ground*(mix(.16,.62,day)+caustic*mix(.08,.95,day));
        // Water takes the red out of the light first, so deeper water turns green.
        float way=depth/max(.34,facing);
        vec3 through=exp(-vec3(2.6,.80,1.75)*way);
        vec3 body=lit*through+mix(vec3(.020,.085,.058),vec3(.006,.022,.030),night)*(1.-through.g);
        vec3 mirror=reflect(-eye,normal);
        vec3 sky=mix(mix(vec3(.72,.80,.80),vec3(.36,.56,.72),clamp(mirror.y*1.6,0.,1.)),
          mix(vec3(.060,.090,.135),vec3(.030,.050,.090),clamp(mirror.y*1.6,0.,1.)),night);
        float fresnel=.03+.97*pow(1.-facing,4.6);
        vec3 color=mix(body,sky,fresnel*.82);
        // Glints: only the ripple faces that throw the sun straight at the eye light up.
        vec3 sun=normalize(vec3(-.32,.64,.71));
        vec3 crisp=normalize(normal+vec3(noise(p*23.-clock*1.9)-.5,0.,noise(p*23.+41.-clock*1.7)-.5)*.16);
        float glint=pow(max(0.,dot(reflect(-eye,crisp),sun)),170.)*2.4+pow(max(0.,dot(mirror,sun)),22.)*.22;
        color+=mix(vec3(1.,.95,.80),vec3(.30,.36,.46),night)*glint*mix(1.,.35,night);
        // Foam: a broken line lapping the banks, streaks below the stones, and white water under the falls.
        float lap=smoothstep(.90,.995,edge+(fbm(vec2(p.x*1.7-clock*.35,flow.y*3.))-.5)*.10);
        float streak=fbm(vec2(p.x*.55-clock*.9,p.y*4.2))*fbm(vec2(p.x*2.3-clock*1.5,p.y*9.)+9.);
        float foam=lap*.55+stones*smoothstep(.20,.42,streak)*.5+churn*smoothstep(.12,.40,streak+churn*churn*.30);
        color=mix(color,mix(vec3(.93,.96,.95),vec3(.30,.36,.42),night),clamp(foam,0.,1.)*.88);
        gl_FragColor=vec4(mix(color,mist,smoothstep(100.,480.,viewDepth)*.62),1.);
        #include <colorspace_fragment>
      }`
  });
  // Falling water: a thin sheet with streaks running down it, white where it breaks.
  const cascade=new T.ShaderMaterial({
    uniforms:water.uniforms,side:T.DoubleSide,transparent:true,depthWrite:false,
    vertexShader:`
      attribute vec2 stream;
      varying vec2 flow;
      void main(){
        flow=stream;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }`,
    fragmentShader:`
      uniform float clock,night;
      varying vec2 flow;
      ${waterNoise}
      void main(){
        // flow.x is metres travelled down the cascade, flow.y metres across it.
        float run=flow.x-clock*2.6;
        float veil=fbm(vec2(flow.y*9.5,run*.9))*.6+noise(vec2(flow.y*31.,run*2.4))*.4;
        float burst=smoothstep(.45,.85,fbm(vec2(flow.y*2.2,run*1.7)+5.));
        float white=clamp(veil*.75+burst*.45,0.,1.);
        vec3 color=mix(vec3(.47,.66,.66),vec3(.97,.99,.98),white);
        color=mix(color,color*vec3(.26,.32,.42),night);
        gl_FragColor=vec4(color,.50+.46*white);
        #include <colorspace_fragment>
      }`
  });
  // A sheet of water laid over rows of points; each point carries its place in the flow.
  function sheet(rows,material){
    const model=grid(rows,material);
    model.geometry.setAttribute("stream",new T.Float32BufferAttribute(rows.flatMap(row=>row.flatMap(({flow})=>flow)),2));
    model.receiveShadow=false;
    return model;
  }
  {
    const xs=[];
    for(let x=cheonggyeStations[0];x<cheonggyeStations.at(-1);x+=2)xs.push(x);
    xs.push(cheonggyeStations.at(-1));
    sheet(xs.map(x=>{
      const north=bankAt(x,-1,-3.26),south=bankAt(x,1,-3.08);
      return [0,1,2,3,4,5,6].map(j=>({x,y:north.y+(south.y-north.y)*j/6,level:waterLevel,flow:[x,j/3-1]}));
    }),water);
  }
  {
    // A stone kerb drops from each path into the water, and a dark bed lies under it all,
    // so nothing shows through between the path and the stream.
    const xs=[cheonggyeStations[0]];
    for(let x=cheonggyeStations[0]+6;x<cheonggyeStations.at(-1);x+=6)xs.push(x);
    xs.push(cheonggyeStations.at(-1));
    const kerb=new T.MeshStandardMaterial({color:0x8f8d80,roughness:1,side:T.DoubleSide});
    for(const [side,inset] of [[-1,-3.35],[1,-3.15]]){
      grid(xs.map(x=>{const p=bankAt(x,side,inset);return [{...p,level:cheonggyeBedLevel},{...p,level:waterLevel-.42}];}),kerb);
    }
    grid(xs.map(x=>[bankAt(x,-1,.3),bankAt(x,1,.3)].map(p=>({...p,level:waterLevel-.44}))),
      new T.MeshStandardMaterial({color:0x3f4338,roughness:1,side:T.DoubleSide}));
  }
  for(const {kind,outline,points,width} of [...cheonggyeRoadLeads.map(lead=>({...lead,kind:"road"})),...cheonggyeSurfaces]){
    if(kind==="plaza")surface(outline,paving,.028);
    if(kind==="paving")surface(outline,paving,.039);
    if(kind==="road")surface(outline,asphalt,.01);
    if(kind==="lower")surface(outline,lower,cheonggyeBedLevel);
    if(kind==="crossing"){
      const [a,,b]=points,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      for(let i=2;i<length-1;i+=1.1){
        const x=a.x+dx*i/length,y=a.y+dy*i/length;
        block(0xc5c3b5,x,y,width-.36,.49,.022,at(x,y)+.028,-Math.atan2(-dx,dy));
      }
    }
  }
  yield;
  const head=cheonggyeStations[0],cascadePit=cheonggyeCascade;
  // Solid ground at street level under all the paving, so no gap between two pavements
  // shows the land far below. It stays open over the channel, the cascade, and the cuts
  // where stairs and ramps go down.
  {
    // A cut is open a little inside its edge, so the ground laps over the retaining wall.
    const open=(x,y)=>cheonggyeOpenAir(x,y)&&(!cheonggyeRailOpening(x,y)||
      cheonggyeOpenAir(x,y,.15)&&cheonggyeLevel({x,y})<-.06);
    const {minX,maxX,minY,maxY}=cheonggyeBounds,coarse=2,fine=.25,vertices=[],indices=[];
    const quad=(x,y,size)=>{
      const first=vertices.length/3;
      for(const [dx,dy] of [[0,0],[size,0],[0,size],[size,size]])vertices.push(wx(x+dx),at(x+dx,y+dy)-.03,wz(y+dy));
      indices.push(first,first+2,first+1,first+1,first+2,first+3);
    };
    for(let x=minX;x<maxX;x+=coarse){
      for(let y=minY;y<maxY;y+=coarse){
        let gaps=0;
        for(let i=0;i<=4;i++)for(let j=0;j<=4;j++)if(open(x+i*coarse/4,y+j*coarse/4))gaps++;
        if(!gaps)quad(x,y,coarse);
        else if(gaps<25){
          for(let fx=x;fx<x+coarse-1e-6;fx+=fine)for(let fy=y;fy<y+coarse-1e-6;fy+=fine){
            if(!open(fx+fine/2,fy+fine/2))quad(fx,fy,fine);
          }
        }
      }
      if(x%60<coarse)yield;
    }
    const ground=mesh(vertices,indices,new T.MeshStandardMaterial({color:0x8b9087,roughness:1,side:T.DoubleSide}));
    ground.name="Cheonggyecheon street-level ground";
  }
  yield;
  // Walls close the head of the channel under the waterfall and the sides of its recess.
  {
    const wall=new T.MeshStandardMaterial({color:0x767a71,roughness:1,side:T.DoubleSide});
    const face=(a,b,top)=>grid([a,b].map(p=>[{...p,level:waterLevel-.55},{...p,level:top}]),wall);
    const north=bankAt(head,-1,.3).y,south=bankAt(head,1,.3).y,lip=-.96,cascade=cascadePit;
    face({x:head,y:north},{x:head,y:cascade.north},.03);
    face({x:head,y:cascade.north},{x:head,y:cascade.south},lip);
    face({x:head,y:cascade.south},{x:head,y:south},.03);
    for(const y of [cascade.north,cascade.south])face({x:cascade.west,y},{x:head+.02,y},.03);
    face({x:cascade.west,y:cascade.north},{x:cascade.west,y:cascade.south},-.1);
  }
  for(let i=0;i<6;i++){
    const x=616+i*1.27,y=-149.7+i*.21;
    block(i%2?cap:granite,x,y,1.28,10.1,.27,at(x,y)-i*.23-.08);
  }
  // True where a point lies in the bank behind the wall face, so a cut there needs retaining walls.
  function inBank({x,y}){
    if(x<cheonggyeStations[0])return true;
    const [centre,north,south]=riverAt(x);
    return y<centre?centre-north-y>.3:y-centre-south>.3;
  }
  for(const route of cheonggyeAccess){
    const {points,width,kind,landing}=route;
    const length=points.slice(1).map((b,i)=>Math.hypot(b.x-points[i].x,b.y-points[i].y));
    const total=length.reduce((sum,value)=>sum+value,0);
    const risers=kind==="steps"?23:Math.ceil(total/2),stations=landing?[0,landing]:[0];
    for(let i=1;i<=risers;i++)stations.push(landing+(1-landing)*i/risers);
    function cross(t,level){
      let d=t*total,i=0;
      while(i<length.length-1&&d>length[i])d-=length[i++];
      const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y;
      const x=a.x+d*dx/length[i],y=a.y+d*dy/length[i],s=width/(2*length[i]);
      return [{x:x-dy*s,y:y+dx*s,level},{x:x+dy*s,y:y-dx*s,level}];
    }
    const level=t=>.041+cheonggyeAccessDrop(route,Math.max(0,t))*cheonggyeBedLevel;
    const rows=[cross(0,level(0))];
    for(let i=1;i<stations.length;i++){
      const end=stations[i];
      if(kind==="steps")rows.push(cross(end,level(stations[i-1])));
      rows.push(cross(end,level(end)));
    }
    grid(rows,darkPaving);
    // Wall in the cut on either side: below the paving everywhere, and up to the street
    // where the route passes through the bank.
    for(let side=0;side<2;side++)grid(rows.map(row=>{
      const lip=row[side];
      return [{...lip,level:inBank(lip)?.041:lip.level},lip,{...lip,level:waterLevel-.35}];
    }),darkPaving);
    // Handrails follow the slope below the landing; a guard rail edges the stairwell above.
    const sloped=stations.filter(t=>t>=landing);
    for(let i=0;i<sloped.length;i+=Math.max(1,Math.floor(sloped.length/8))){
      for(const p of cross(sloped[i],level(sloped[i])))cylinder(rail,wx(p.x),at(p.x,p.y)+p.level+.36,wz(p.y),.032,.77,7,root);
    }
    const rails=sloped.map(t=>cross(t,level(t)+.78));
    for(let i=1;i<rails.length;i++)for(let side=0;side<2;side++){
      const a=rails[i-1][side],b=rails[i][side];
      bar(rail,a,b,.038);
      if(level(sloped[i-1])>-.5||!inBank(a)||!inBank(b))continue;
      bar(rail,{...a,level:.91},{...b,level:.91},.037);
      if(i%4===0)cylinder(rail,wx(a.x),at(a.x,a.y)+.47,wz(a.y),.036,.85,6,root);
    }
    yield;
  }
  function bar(color,a,b,radius){
    const from=new T.Vector3(wx(a.x),at(a.x,a.y)+a.level,wz(a.y)),to=new T.Vector3(wx(b.x),at(b.x,b.y)+b.level,wz(b.y));
    const delta=to.clone().sub(from),center=from.clone().lerp(to,.5);
    const mesh=cylinder(color,center.x,center.y,center.z,radius,delta.length(),6,root);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  }

  // Stretches of the bank, as [from, to] along x, where a test holds; ends are refined so
  // walls and paving stop exactly at the edge of a stairwell.
  function runs(test){
    const first=cheonggyeStations[0],last=cheonggyeStations.at(-1),found=[];
    const edge=(inside,outside)=>{
      for(let i=0;i<14;i++){const mid=(inside+outside)/2;if(test(mid))inside=mid;else outside=mid;}
      return inside;
    };
    let start=null,before=first;
    for(let x=first;x<last+.2;x+=.2){
      const here=Math.min(last,x),holds=test(here);
      if(holds&&start===null)start=here===first?first:edge(here,before);
      if(!holds&&start!==null){found.push([start,edge(before,here)]);start=null;}
      before=here;
    }
    if(start!==null)found.push([start,last]);
    return found.filter(([from,to])=>to-from>.05);
  }
  const pieces=(from,to)=>{
    const cuts=[from,...cheonggyeStations.filter(x=>x>from+.2&&x<to-.2),to],stops=[from];
    for(let i=1;i<cuts.length;i++){
      const count=Math.ceil((cuts[i]-cuts[i-1])/3.6);
      for(let j=1;j<=count;j++)stops.push(cuts[i-1]+(cuts[i]-cuts[i-1])*j/count);
    }
    return stops;
  };
  for(const side of [-1,1]){
    const faceAt=x=>bankAt(x,side,.3),lipAt=x=>bankAt(x,side,3.53);
    const open=(x,inset)=>{const p=bankAt(x,side,inset);return cheonggyeRailOpening(p.x,p.y);};
    const backing=new T.MeshStandardMaterial({color:0x656961,roughness:1,side:T.DoubleSide});
    let count=0;
    for(const [from,to] of runs(x=>!open(x,.3))){
      const stations=pieces(from,to);
      for(let i=1;i<stations.length;i++){
        const a=stations[i-1],b=stations[i],x=(a+b)/2,p=faceAt(x);
        // Dark backing fills the mortar joints and continues below the water.
        grid([faceAt(a),faceAt(b)].map(p=>[{...p,level:waterLevel-.55},{...p,level:.032}]),backing);
        for(let row=0;row<7;row++){
          const shift=row%2===0?0:Math.min(.21,(b-a)*.12);
          const level=cheonggyeBedLevel+row*.54;
          strip(stone[(row*3+count*7)%stone.length],faceAt(Math.min(to,a+shift)),faceAt(Math.min(to,b+shift-.025)),.34,.51,level);
        }
        count++;
        if(open(x,1.9))continue;
        const upperA=faceAt(a),upperB=faceAt(b);
        strip(cap,upperA,upperB,.42,.17,.026);
        bar(rail,{...upperA,level:.91},{...upperB,level:.91},.037);
        bar(rail,{...upperA,level:.51},{...upperB,level:.51},.026);
        if(b-a>.95)cylinder(rail,wx(p.x),at(p.x,p.y)+.47,wz(p.y),.036,.85,6,root);
        if(count%12===0)yield;
      }
    }
    // The paved strip between the wall and the walk, left open over stairs and ramps.
    // East of the plaza the walk itself is laid right up to the wall.
    for(const [from,to] of runs(x=>x<=cheonggyeWalkFrom&&![.45,1.1,1.9,2.7,3.4].some(inset=>open(x,inset)))){
      const stations=pieces(from,to);
      for(let i=1;i<stations.length;i++){
        const a=stations[i-1],b=stations[i];
        surface([faceAt(a),faceAt(b),lipAt(b),lipAt(a)],paving,.038);
      }
    }
    yield;
  }

  for(const bridge of cheonggyeBridges){
    const {x,north,south,width,skew,style,footprint}=bridge;
    const along=t=>({x:x+skew*t,y:north+(south-north)*t});
    if(style==="wood"){
      const rows=[],posts=[];
      for(let i=0;i<=18;i++){
        const t=i/18,p=along(t),level=cheonggyeBedLevel+.25+Math.sin(t*Math.PI)*.71;
        rows.push([{x:p.x-width/2,y:p.y,level},{x:p.x+width/2,y:p.y,level}]);
        if(i%3===0)posts.push(rows.at(-1));
        const seam=block(0x735c40,p.x,p.y,width,.028,.025,at(p.x,p.y)+level+.009);
        seam.userData.streamDetail=true;
      }
      grid(rows,new T.MeshStandardMaterial({color:0xa2835d,side:T.DoubleSide}));
      for(let i=0;i<posts.length;i++)for(let side=0;side<2;side++){
        const a=posts[i][side];
        cylinder(0x594d3f,wx(a.x),at(a.x,a.y)+a.level+.42,wz(a.y),.058,.86,8,root);
        if(i)bar(0x6b5841,{...posts[i-1][side],level:posts[i-1][side].level+.83},{...a,level:a.level+.83},.038);
      }
      yield;
      continue;
    }
    surface(footprint,style==="road"?asphalt:darkPaving,.115);
    const sides=[-1,1];
    for(const side of sides){
      const edge=t=>{const p=along(t);return {...p,x:p.x+side*width/2};};
      const a=edge(0),b=edge(1);
      strip(style==="stone"?0x8e8e82:concrete,a,b,.55,.52,-.45);
      strip(cap,a,b,.36,style==="stone"?.26:.16,.12);
      bar(rail,{...a,level:.98},{...b,level:.98},.041);
      for(let i=0;i<15;i++){
        const p=edge(i/14);
        if(style==="stone"){
          block(stone[i%stone.length],p.x,p.y,.43,.24,.85,at(p.x,p.y)+.16);
          if(i%3===0)block(cap,p.x,p.y,.54,.34,.15,at(p.x,p.y)+.94);
        }else cylinder(rail,wx(p.x),at(p.x,p.y)+.54,wz(p.y),.039,.84,6,root);
      }
      if(style==="road"){
        const innerA={...a,x:a.x-side*2.75},innerB={...b,x:b.x-side*2.75};
        surface([a,b,innerB,innerA],paving,.126);
        strip(0xab863e,innerA,innerB,.10,.012,.132);
      }
    }
    // A full underside reads as a bridge from the lower promenade. Piers
    // stay at the water's edge so there is walking clearance on each bank.
    const underside=new T.MeshStandardMaterial({color:0x716f65,side:T.DoubleSide});
    surface(footprint,underside,-.59);
    for(const side of [-1,1]){
      const p=bankAt(x,side,-3.55);
      block(style==="stone"?0x9d9a89:0x828881,p.x,p.y,width-1,1.32,2.83,at(p.x,p.y)+waterLevel);
      if(style==="stone")for(let i=0;i<9;i++){
        const sx=x-width*.425+i*width*.107;
        block(stone[i%stone.length],sx,p.y+side*.68,1.05,.17,.34,at(sx,p.y)-2.47);
      }
    }
    yield;
  }
  // Stepping stones: rows of separate blocks, so the water runs between them.
  for(const [i,x] of stepStoneXs.entries()){
    const [y,north,south]=riverAt(x),from=y-north+2.6,span=north+south-5.2,count=Math.round(span/1.42),pitch=span/count;
    for(let j=0;j<count;j++){
      const sy=from+(j+.5)*pitch;
      block(stone[(i*3+j)%stone.length],x+((i+j)%2?.03:-.03),sy,1.34,pitch-.30,.39,at(x,sy)+waterLevel-.12);
    }
  }
  for(const {x,y,side} of cheonggyeSeats.filter(({ledge})=>ledge)){
    const base=at(x,y)+cheonggyeBedLevel;
    block(0x908d82,x,y-side*.070,2.53,.54,.18,base-.145);
    for(const offset of [-.61,.61]){
      block(0xb7b1a2,x+offset,y+side*.075,1.13,.47,.073,base-.03);
      block(0xa39e91,x+offset,y-side*.258,1.13,.20,.095,base-.146);
    }
  }
  // The Spring sculpture, plaza runnel, and the split waterfall at the head.
  const spring={x:553.8,y:-157.2},base=at(spring.x,spring.y);
  block(cap,spring.x,spring.y,4.6,4.4,.28,base);
  const start=new T.Vector3(wx(spring.x),base+.38,wz(spring.y));
  const points=[];
  for(let i=0;i<=165;i++){
    const t=i/165,a=t*Math.PI*16,r=1.72*(1-t)**.75+.035;
    points.push(new T.Vector3(start.x+Math.cos(a)*r+.56*t,start.y+t*11.5,start.z+Math.sin(a)*r));
  }
  const spiral=new T.TubeGeometry(new T.CatmullRomCurve3(points),166,.11,7,false);
  const colors=new Float32Array(spiral.attributes.position.count*3);
  const tone=new T.Color();
  for(let i=0;i<spiral.attributes.position.count;i++){
    const t=Math.min(1,Math.max(0,(spiral.attributes.position.getY(i)-start.y)/11.5));
    tone.setHSL(.91-.095*Math.cos(Math.PI*1.4*t),.56,.39+.16*Math.sin(Math.PI*t));
    colors.set([tone.r,tone.g,tone.b],i*3);
  }
  spiral.setAttribute("color",new T.BufferAttribute(colors,3));
  const sculpture=new T.Mesh(spiral,new T.MeshStandardMaterial({vertexColors:true,roughness:.47,metalness:.34}));
  root.add(sculpture);
  // The runnel crosses the plaza to the head of the stream, spills down the granite steps
  // and drops over the last of them into the channel.
  const runnel=[{x:606,y:-154.4,flow:[606,-1]},{x:616.2,y:-153.6,flow:[616.2,-1]}],reach=4.3;
  sheet(runnel.map(({x,y,flow})=>[{x,y,level:.133,flow},{x,y:y+reach,level:.133,flow:[flow[0],1]}]),water);
  {
    const {west,north,south}=cheonggyeCascade,rows=[],across=[north+.12,(north+south)/2,south-.12];
    let run=0,last=null;
    const row=(x,level)=>{
      if(last)run+=Math.hypot(x-last[0],level-last[1]);
      last=[x,level];
      rows.push(across.map(y=>({x,y,level,flow:[run,y]})));
    };
    for(let i=0;i<6;i++){
      const film=.19-i*.23+.035;
      row(west+i*1.27+.02,film);row(west+i*1.27+1.31,film);
    }
    // Over the lip, thrown clear of the wall, and down to the stream.
    const lip=last[0],from=last[1];
    for(let i=1;i<=10;i++){const t=i/10;row(lip+.12+t*1.25,from+(waterLevel+.03-from)*t*t);}
    sheet(rows,cascade);
  }
  yield;
  const trees=makeTreeBuilder(T,root,{rand,clearance:{meshFits:()=>true,trim:()=>true}});
  for(const [i,[x,y,height]] of cheonggyeTrees.entries()){
    const footing=at(x,y);
    const first=root.children.length;
    trees.grow(wx(x),wz(y),{height,style:i%4===0?"cloud":"round",palette:["pine","ginkgo","fresh","amber"][i%4]});
    for(let j=first;j<root.children.length;j++)root.children[j].position.y+=footing+.03;
    block(0x676e57,x,y,1.24,1.40,.07,footing+.04);
    yield;
  }
  const rock=new T.DodecahedronGeometry(1,0);
  for(let i=0;i<74;i++){
    const x=632+rand()*408,side=i%2?1:-1,p=bankAt(x,side,-3.75-rand()*.33);
    const mesh=kit.shape(rock,stone[i%stone.length],wx(x),at(p.x,p.y)+waterLevel+.09,wz(p.y),root);
    mesh.scale.set(.28+rand()*.4,.12+rand()*.21,.26+rand()*.39);mesh.rotation.y=rand()*Math.PI;
    mesh.userData.streamDetail=true;
    if(i%12===0)yield;
  }
  // Reeds and water plants stand in the shallows once the stream turns more natural, east of Gwangtonggyo.
  {
    const vertices=[],colors=[],indices=[],tone=new T.Color(),greens=[0x5f8a3c,0x79a046,0x8fae52,0x4f7a3a,0xa0a85a];
    const clear=x=>!cheonggyeBridges.some(bridge=>Math.abs(x-bridge.x)<bridge.width/2+1.5);
    for(let i=0;i<64;i++){
      const x=i<12?700+rand()*120:852+rand()*190,side=i%2?1:-1,p=bankAt(x,side,-3.62-rand()*.55);
      if(!clear(x))continue;
      const foot=at(p.x,p.y)+waterLevel-.04,blades=6+Math.floor(rand()*6);
      for(let j=0;j<blades;j++){
        const angle=rand()*Math.PI*2,spread=.05+rand()*.26,height=.42+rand()*.62,lean=.08+rand()*.26,width=.022+rand()*.022;
        const bx=p.x+Math.cos(angle)*spread,by=p.y+Math.sin(angle)*spread,first=vertices.length/3;
        const tx=bx+Math.cos(angle)*lean,ty=by+Math.sin(angle)*lean,nx=-Math.sin(angle)*width,ny=Math.cos(angle)*width;
        vertices.push(wx(bx-nx),foot,wz(by-ny),wx(bx+nx),foot,wz(by+ny),
          wx((bx+tx)/2+Math.cos(angle)*width),foot+height*.55,wz((by+ty)/2+Math.sin(angle)*width),wx(tx),foot+height,wz(ty));
        tone.setHex(greens[Math.floor(rand()*greens.length)]);
        for(const shade of [.72,.72,.95,1.1])colors.push(tone.r*shade,tone.g*shade,tone.b*shade);
        indices.push(first,first+1,first+2,first,first+2,first+3,first+1,first+3,first+2);
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const reeds=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:T.DoubleSide}));
    reeds.userData.streamDetail=true;root.add(reeds);
  }
  // Major frontages keep the bends and spacing recognizable from street level.
  const blocks=[
    [706.4,-101.1,28.5,24.2,60,0x9a9d92,-1,15],
    [779.4,-218.1,49.2,40.3,159,0x687d80,1,32],
    [765.9,-87,33.5,31.5,106,0xafad9e,-1,21],
    [818,-82.6,39.7,26.2,102,0xa3a698,-1,21],
    [869.1,-170.6,42.4,22.0,82,0x919d9a,1,19],
    [891.9,-81.1,60.8,22.0,70,0x8e9d9b,-1,16],
    [943.6,-207.8,43.5,41.6,88,0x88908b,1,22],
    [948.7,-63,22.5,35.4,68,0x819195,-1,15],
    [1038.6,-62,51.2,33.1,49,0x9da398,-1,12]
  ];
  for(const [x,y,width,length,height,color,side,levels] of blocks){
    const footing=at(x,y),front=y+side*(length/2+.027),pitch=(height-2.6)/levels;
    block(color,x,y,width,length,height+1,footing-1);
    block(0xa5a99d,x,y,width+.39,length+.39,.42,footing+height-.42);
    block(0x646d66,x,front,width+.17,.11,.32,footing+2.53);
    const tint=[0x557079,0x627b7e,0x738684,0x485e61];
    const bays=Math.ceil(width/3.3),bay=width/bays;
    for(let level=0;level<levels;level++)for(let bayIndex=0;bayIndex<bays;bayIndex++){
      const window=block(tint[(level*3+bayIndex)%tint.length],x-width/2+(bayIndex+.5)*bay,front,bay*.69,.08,
        pitch*.67,footing+2.63+level*pitch);
      window.userData.streamDetail=true;
    }
    yield;
  }
  return (seconds,night,haze)=>{
    water.uniforms.clock.value=seconds;
    water.uniforms.night.value=night;
    water.uniforms.mist.value.copy(haze);
  };
}
