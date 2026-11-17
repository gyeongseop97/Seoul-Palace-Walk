import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {insideCorridorPolygon} from "./sejong-corridor-layout.js";
import {plazaAvenueOutline,plazaEastSidewalks,plazaOutline} from "./plaza-layout.js";
import {plazaWestPavement} from "./gwanghwamun-plaza.js";
import {bukchonPavers} from "./bukchon-surfaces.js";
import {gradeAvenueMeshes} from "./avenue-terrain.js";
import {makeStreetSurfaceCut} from "./street-surface-cuts.js";
import {makeCrosswalkMarkings} from "./crosswalk-markings.js";

const point=(x,y)=>({x,y});
const walk=(name,width,points)=>({name,width,points:points.map(([x,y])=>point(x,y))});
export const subwayAccessPaths=[
  walk("시청역 남쪽 보도",7,[[522,285],[543,298],[551,317],[546,336],[534,349],[522,374],[519,397]]),
  walk("시청역 덕수궁길 보도",8,[[475,307],[470,325],[464,346],[465.8,357],[460,365],[445,377],[438,395],[434,405]]),
  // Meet the east sidewalk before the corner of The Plaza hotel.
  walk("시청역 남쪽 횡단보도",6,[[467.5,334],[503,336],[545,331.5]]),
  walk("광화문역 서쪽 보도",8,[[443,-413],[434,-416.7],[418,-417.2],[400,-418],[364,-418],[331,-418],[320,-427],
    [317,-438],[302,-446],[298,-455]]),
  walk("광화문역 동쪽 보도",8,[[524,-324],[526,-346],[527,-376],[530,-388]]),
  walk("경복궁역 사직로 보도",7,[[388,-884],[356,-886],[321,-886],[275,-886],[239,-887],[207,-896],
    [178,-905],[150,-909],[125,-915],[112,-920],[110,-933],[84,-941],[63,-931]]),
  walk("경복궁역 자하문로 보도",7.4,[[149,-908],[145,-891],[148,-872],[139,-866],[102,-869],[70,-879],[64,-881]]),
  walk("경복궁역 서측 횡단보도",5.5,[[65,-930],[67,-907],[66,-883]]),
  walk("경복궁역 북서쪽 보도",6.4,[[64,-932],[72,-947],[77,-956],[80,-961]]),
  walk("시청역 1번 출구 앞",6.1,[[461.2,351.65],[461.2,359.45],[464.6,362.4]])
];

const cities={
  city:["시청역","덕수궁 · 서울광장",0x008c58],
  plaza:["광화문역","광화문광장",0x8255ac],
  palace:["경복궁역","경복궁 · 사직로",0xe97c1c],
  euljiro:["을지로입구역","환구단 · 소공동",0x008c58],
  anguk:["안국역","북촌 · 안국동",0xe97c1c]
};
function entrance(area,number,x,y,heading){
  const [station,district,color]=cities[area],angle=heading*Math.PI/180;
  const front=distance=>point(x+Math.sin(angle)*distance,y+Math.cos(angle)*distance);
  return {id:area+"-exit-"+number,station,district,color,area,number,mode:"subway",name:station+" "+number+"번 출구",x,y,angle,
    door:front(3.35),arrive:{...front(5.35),heading:(180-heading+360)%360}};
}

// Survey anchors from OpenStreetMap's entrance nodes. Short offsets fit the
// project's existing street widths and preserve a clear landing for each exit.
export const expandedSubwayStops=[
  entrance("city",1,461.2,354.4,0),entrance("city",4,523.2,105,0),entrance("city",5,525.3,187.4,0),
  entrance("city",6,547.8,328.6,0),entrance("city",7,518.3,388.3,0),entrance("city",12,434.7,395.8,0),
  entrance("plaza",1,299.5,-452.5,0),entrance("plaza",2,522.6,-521.7,0),entrance("plaza",3,526.4,-384.9,0),
  entrance("plaza",4,525.5,-322.4,180),entrance("plaza",5,522.9,-224.6,0),entrance("plaza",6,454.8,-221.5,90),
  entrance("plaza",8,321.0,-434.6,0),entrance("plaza",9,480.3,-388.8,0),
  entrance("palace",1,61.6,-932.5,90),entrance("palace",2,80.2,-953.1,180),entrance("palace",3,104.5,-936.3,90),
  entrance("palace","3-1",113.4,-916.7,90),entrance("palace",4,145.4,-906.8,90),
  entrance("palace",6,146.5,-869.5,-90),entrance("palace",7,62.5,-879.4,90),
  entrance("euljiro",3,669.1,227,0),entrance("anguk",1,1136.1,-924.7,90)
];

function band({width,points}){
  const side=sign=>points.map((point,index)=>{
    const before=points[Math.max(0,index-1)],after=points[Math.min(points.length-1,index+1)];
    const dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy);
    return {x:point.x+sign*dy*width/(2*length),y:point.y-sign*dx*width/(2*length)};
  });
  return [...side(1),...side(-1).reverse()];
}
const pavement=subwayAccessPaths.map(band);
const crossingIndexes=[2,7];
const inside=(x,y,polygon)=>insideCorridorPolygon(x,y,polygon);
const accessBounds=pavement.map(outline=>{
  const xs=outline.map(p=>p.x),ys=outline.map(p=>p.y);
  return {outline,minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
});
addZone({name:"지하철 출입구 보행로",
  contains:(x,y)=>accessBounds.some(({outline,minX,maxX,minY,maxY})=>
    x>=minX&&x<=maxX&&y>=minY&&y<=maxY&&inside(x,y,outline))&&!inside(x,y,plazaAvenueOutline),
  walkable:()=>true
});
addLandmarks(expandedSubwayStops.map(stop=>({...stop.arrive,name:stop.name})));

export function registerExpandedSubway(){
  for(const stop of expandedSubwayStops)addObstacle(stop.x,stop.y,2.42,4.9,stop.angle);
}

export function* buildSubwayAccess(T,root,{wx,wz,box,matte},floorAt,{terrainHeight}={}){
  const approaches=new T.Group();
  root.add(approaches);
  const cutSidewalks=makeStreetSurfaceCut(T,pavement.filter((_,index)=>!crossingIndexes.includes(index)));
  const existing=[plazaOutline,plazaAvenueOutline,...plazaEastSidewalks,...plazaWestPavement()];
  const stone=bukchonPavers(T);
  function surface(parts,color,height,name=""){
    if(!parts.length)return;
    const shapes=parts.map(outline=>new T.Shape(outline.map(p=>new T.Vector2(wx(p.x),-wz(p.y)))));
    const geometry=new T.ShapeGeometry(shapes),{position,uv}=geometry.attributes;
    if(color?.map)for(let i=0;i<uv.count;i++)uv.setXY(i,position.getX(i)/3.6,position.getY(i)/3.6);
    geometry.rotateX(-Math.PI/2);
    const mesh=new T.Mesh(geometry,color?.isMaterial?color:matte(color));
    mesh.name=name;
    mesh.position.y=height;mesh.receiveShadow=true;
    mesh.userData.followTerrain=true;approaches.add(mesh);
  }
  for(const [index,outline] of pavement.entries()){
    if(crossingIndexes.includes(index)){
      const road=cutSidewalks(outline),markings=makeCrosswalkMarkings(T,road);
      const {width,points}=subwayAccessPaths[index],paint=[],tactile=[];
      const bends=points.slice(1,-1);
      surface(road,0x62635d,.061);
      for(let i=1;i<points.length;i++){
        const bands=markings(points[i-1],points[i],width);
        paint.push(...bands.paint);
        tactile.push(...bands.tactile.filter(part=>!bends.some(bend=>
          part.some(p=>Math.hypot(p.x-bend.x,p.y-bend.y)<.87))));
      }
      surface(paint,0xe3dfc9,.070);
      surface(tactile,0xbba05a,.069);
    }else{
      const {name}=subwayAccessPaths[index],cut=makeStreetSurfaceCut(T,existing);
      surface(cut(outline),stone,.031,name);
      existing.push(outline);
    }
    yield;
  }
  if(terrainHeight)yield* gradeAvenueMeshes(T,approaches.children,terrainHeight);
  for(const stop of expandedSubwayStops){
    const group=new T.Group();group.name=stop.name;
    group.position.set(wx(stop.x),floorAt(stop),wz(stop.y));
    group.rotation.y=stop.angle;root.add(group);
    const part=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,group);
    part(0x5d5c55,0,-.105,0,2.34,.24,4.80);
    part(0x302f2f,0,.07,0,2.36,.14,4.8);
    for(let step=0;step<6;step++)part(step%2?0x6d6c64:0x535653,0,.13+step*.014,1.91-step*.66,2.16,.058,.64);
    for(const side of [-1,1]){
      part(0x667275,side*1.16,.23,0,.14,.45,4.9);
      part(0x9bb6b2,side*1.16,.77,0,.065,.68,4.75);
      for(const end of [-2.31,2.31])part(0x5b676b,side*1.15,1.32,end,.11,2.62,.11);
    }
    part(0x788083,0,2.60,0,2.62,.13,5.1);
    part(stop.color,0,2.34,2.52,2.53,.42,.11);
    part(0xb99b4e,0,.055,2.64,2.39,.038,.26);
    const canvas=document.createElement("canvas");canvas.width=512;canvas.height=90;
    const ctx=canvas.getContext("2d");if(!ctx)continue;
    ctx.fillStyle="#f0eddd";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="bold 53px sans-serif";ctx.fillText(stop.name,256,47,477);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(2.39,.42),new T.MeshBasicMaterial({map:texture,transparent:true}));
    sign.position.set(0,2.34,2.59);group.add(sign);
    yield;
  }
}
