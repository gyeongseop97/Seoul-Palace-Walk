import * as T from "three";
import { buildJeongdong, hallRooms } from "./streets.js";
import { addWater } from "./water.js";
import { addObstacle, solidAt, platformAt, loftHeight, bridge, gate, middle, hall, stoneHall, courtAngle, fountain,ticketGuide } from "./layout.js";
import { addParkLife } from "./park-life.js";
import {addCityVisitors} from "./city-visitors.js";
import { addPalaceBirds } from "./palace-birds.js";
import { addPalaceSky } from "./palace-sky.js";
import { resolveSeoulEnvironment } from "./seoul-environment.js";
import { addSeoulPrecipitation, makeSeasonFoliage } from "./seoul-weather-scene.js";
import { addStands, addRegionalStands, makeItemProps, regionalStations, registerRegionalStands, underDoldamAwning } from "./street-stands.js";
import { BUNGEO_STALL,COOKING_STALLS,cookingStallById } from "./bungeo-data.js";
import { addBungeoStall, registerBungeoStall } from "./bungeo-world.js";
import { makeBungeoCustomer } from "./bungeo-customer.js";
import { ARCADE_GAMES,ARCADE_SITE,ARCADE_STAIRS,ARCADE_THIRD_SITE,ARCADE_UPPER_SITE,registerArcade } from "./arcade-layout.js";
import { addArcadeExterior } from "./arcade-exterior.js";
import { poseArcade } from "./arcade-presence.js";
import { CLASSIC_FIELDS,isClassic } from "./arcade-classics.js";
import { buildClassics } from "./arcade-classics-world.js";
import { TARGET_LANES } from "./arcade-targets.js";
import { BASEBALL_CENTER,BASEBALL_PLATE_Z,baseballBatterSide } from "./arcade-baseball.js";
import { hanbokRental,registerHanbokRental } from "./passport-data.js";
import { addHanbokRental } from "./wearables-models.js";
import { assembleMuseum, registerMuseumNavigation, isInsideMuseum, museumOutsideDoor, museumInsideDoor, museumInsideSpawn, stairHeight } from "./museum.js";
import { interiorAt } from "./interior-layout.js";
import {cultureVenues,cultureHeight} from "./culture-station-layout.js";
import {approachAt,partAt,railHeight,sameStation} from "./station-levels.js";
import {railRooms,railRoomById,railCounters,plazaCafe,registerRailFurniture,ktxCoach,ktxBoardingSpots} from "./rail-station-layout.js";
import {semaVenue} from "./sema-layout.js";
import { mmcaVenue,mmcaExhibits,mmcaWalls } from "./mmca-gallery-layout.js";
import { diningTrayPose,diningVenues,stationDining } from "./dining-data.js";
import { registerDiningNavigation } from "./dining-layout.js";
import { buildDiningFacade } from "./dining-world.js";
import { PET_MS, FEED_MS, ITEMS, diningTray, jumpLift, renderedJumpLift } from "./activities.js";
import { bikeFallAt } from "./avatar-gestures.js";
import { FOOT_BATH_PERIOD,footBathSeatBase,footKickAge,makeWalkerModels } from "./walker-model.js";
import { addMinigameMarkers, registerMinigameProps } from "./minigame-markers.js";
import { makeMinigameWorld } from "./minigame-world.js";
import { makeInteractionMarkers } from "./interaction-markers.js";
import { minigamePickup,traditionalGames } from "./traditional-games.js";
import { makeFirstPersonView } from "./first-person.js";
import {MOLE_BOARD,MOLE_HOLES,moleView} from "./arcade-mole.js";
import { plazaShowSpot } from "./plaza-show.js";
import { gbSurveyModels, gbNightGlow } from "./gyeongbok.js";
import { gbSite, gwanghwamun, gbBounds, inGyeongbok, gbLightSpots, wishPond } from "./gyeongbok-layout.js";
import { gbEastOpenings } from "./gyeongbok-perimeter.js";
import { nearMarketStreet } from "./uijeongbu-layout.js";
import { outsideGroundOffset,palaceGroundOffset,sampleMeshHeight,southWorldSurfaceHeight } from "./gyeongbok-terrain.js";
import { gradeAvenueMeshes } from "./avenue-terrain.js";
import { gradeJeongdongMeshes } from "./jeongdong-terrain-render.js";
import { prepareSurveyTerrain,surveyGroundField } from "./survey-terrain.js";
import { assembleGwanghwamunPlaza, registerPlazaNavigation } from "./gwanghwamun-plaza.js";
import { inGwanghwamunPlaza, plazaBounds, plazaGroundHeight, plazaSites } from "./plaza-layout.js";
import { buildSejongCorridor } from "./sejong-corridor.js";
import { corridorBounds, corridorWalkable } from "./sejong-corridor-layout.js";
import { buildBikeDocks, makeRidingBike, registerBikeDocks } from "./sejong-bike-model.js";
import { bikeDocks, isBikePassenger, isCycling } from "./sejong-bike.js";
import { buildSejongBusModels } from "./sejong-bus-model.js";
import {BUS_FLOOR,busSeatPose,isRaftBus,stopsForRegion} from "./bus-network.js";
import {busAt,clientRaftAt,watchesRaft} from "./raft-client.js";
import {RAFT_SEAT_HEIGHT,raftHeave} from "./gyeongju-raft-layout.js";
import {makeRaftStroke} from "./gyeongju-raft-model.js";
import {buildGyeongjuBuses} from "./gyeongju-bus-model.js";
import { transitStops } from "./transit-routes.js";
import { addPalacePeople } from "./palace-people.js";
import { addStreetPeople } from "./street-people.js";
import { makePicnicWorld } from "./picnic-world.js";
import { buildSubwayAccess,registerExpandedSubway } from "./subway-expansion.js";
import { jeongdongExtensionBounds,registerJeongdongExtension } from "./jeongdong-extension-layout.js";
import {stationBounds,stationBands,stationGround,registerStation} from "./station-layout.js";
import {westBounds,westWalkable,registerWestDistrict,WEST_PAVING_HEIGHT} from "./west-district-layout.js";
import { buildJeongdongExtension } from "./jeongdong-extension.js";
import { bukchonBounds,bukchonWalkable,bukchonGroundHeight,bukchonSurfaceGrade,registerBukchonTrees } from "./bukchon-layout.js";
import { hwangudanBounds,hwangudanWalkable,hwangudanFloorHeight,registerHwangudanNavigation } from "./seoul-hwangudan-layout.js";
import { cheonggyeBounds,cheonggyeWalkable,cheonggyeLevel,cheonggyeCameraCeiling,cheonggyeCameraWall,cheonggyeOpenAir,
  inCheonggye,registerCheonggyeNavigation } from "./cheonggye-layout.js";
import { CHEONGGYE_WATER_LEVEL,cheonggyeSeats } from "./cheonggye-seats.js";
import { songhyeonBounds,songhyeonWalkable,songhyeonGroundHeight,registerSonghyeonNavigation } from "./songhyeon-layout.js";
import { decodeWishFace, WISH_WIDTH, WISH_HEIGHT, WISH_COLORS, WISH_FLIGHT_MS } from "./wish-art.js";

export function makeWorld(container,{onCatFlee,catSeed,graphics="high",coast=null,gyeongju=null}={}) {
  const regional=coast??gyeongju;
  const scene=new T.Scene();
  const arcadeFloors=new Set([ARCADE_SITE,ARCADE_UPPER_SITE,ARCADE_THIRD_SITE].map(venue=>venue.id));
  scene.matrixAutoUpdate=false;
  // Height samplers for the ground that comes with scanned buildings.
  const scannedGrounds=[];
  const camera=new T.PerspectiveCamera(57,1,.15,1290);
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.07;
  const handheld=matchMedia("(pointer:coarse)").matches;
  // Frame-rate governor: the render scale and shadows step down on a slow device and recover later.
  const profiles={high:{min:1.5,max:2.25},medium:{min:1,max:1.5},low:{min:.72,max:1}};
  const quality={mode:graphics,max:0,min:0,ratio:0,shadows:true,
    pinned:new URLSearchParams(location.search).get("quality")==="max",frame:16.7,checkAt:0,calm:0};
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  const selfEmote=document.createElement("span");
  selfEmote.className="self-emote";selfEmote.hidden=true;selfEmote.setAttribute("aria-hidden","true");
  const selfChat=document.createElement("span");
  selfChat.className="self-chat";selfChat.hidden=true;selfChat.setAttribute("aria-hidden","true");
  container.append(renderer.domElement,selfEmote,selfChat);
  let baseFov=57;
  let viewport=container;
  const resize=()=>{
    if(!viewport.clientWidth||!viewport.clientHeight)return;
    camera.aspect=viewport.clientWidth/viewport.clientHeight;
    baseFov=camera.aspect<.78?68:57;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth,viewport.clientHeight);
  };
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
  function attachViewport(target=container){
    if(viewport===target)return;
    resizeObserver.unobserve(viewport);viewport=target;viewport.append(renderer.domElement);
    resizeObserver.observe(viewport);resize();
  }
  resize();
  const skyUniforms={
    horizon:{value:new T.Color(0xcce4f0)},zenith:{value:new T.Color(0x367ec5)},
    solar:{value:new T.Vector3(-.6,.66,.34)},twilight:{value:0},twilightTint:{value:new T.Color(0xffa978)}
  };
  const sky=new T.Mesh(new T.SphereGeometry(705,32,20),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,uniforms:skyUniforms,
    vertexShader:`
      varying vec3 skyDirection;
      void main(){
        skyDirection=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    `,
    fragmentShader:`
      varying vec3 skyDirection;
      uniform vec3 horizon,zenith,solar,twilightTint;
      uniform float twilight;
      void main(){
        vec3 direction=normalize(skyDirection);
        vec3 color=mix(horizon,zenith,smoothstep(-.06,.54,direction.y));
        float glow=(1.-smoothstep(.03,.46,abs(direction.y)))*pow(max(0.,dot(direction,solar)),2.5);
        gl_FragColor=vec4(mix(color,twilightTint,twilight*glow*.74),1.);
        #include <colorspace_fragment>
      }
    `
  }));
  // Keep the sky enclosing the camera along the entire north–south walk.
  const outdoors=new T.Group(),heavens=new T.Group();
  let arcadeBowGeometry;
  outdoors.matrixAutoUpdate=false;
  sky.renderOrder=-3;heavens.add(sky);outdoors.add(heavens);scene.add(outdoors);
  scene.fog=new T.FogExp2(0xc6dbe3,.0039);
  const hemi=new T.HemisphereLight(0xe8f0ff,0x86765a,1.42);
  const sun=new T.DirectionalLight(0xffe7bd,3.05);
  sun.position.set(-86,97,52);
  const sunDirection=sun.position.clone().normalize();
  // One shadow map follows the walker; snapping it to whole texels keeps edges from crawling.
  const shadowReach=handheld?40:58;
  sun.castShadow=true;
  sun.shadow.mapSize.setScalar(handheld?1024:2048);
  Object.assign(sun.shadow.camera,{left:-shadowReach,right:shadowReach,top:shadowReach,bottom:-shadowReach,near:10,far:420});
  sun.shadow.bias=-.00035;sun.shadow.normalBias=.045;
  const shadowRight=new T.Vector3().crossVectors(new T.Vector3(0,1,0),sunDirection).normalize();
  const shadowUp=new T.Vector3().crossVectors(sunDirection,shadowRight).normalize();
  const worldUp=new T.Vector3(0,1,0);
  const shadowFocus=new T.Vector3();
  function aimShadow(x,y,z){
    const texel=shadowReach*2/sun.shadow.mapSize.x;
    shadowFocus.set(x,y,z);
    const across=Math.round(shadowFocus.dot(shadowRight)/texel)*texel,along=Math.round(shadowFocus.dot(shadowUp)/texel)*texel;
    const depth=shadowFocus.dot(sunDirection);
    sun.target.position.copy(shadowRight).multiplyScalar(across).addScaledVector(shadowUp,along).addScaledVector(sunDirection,depth);
    sun.position.copy(sun.target.position).addScaledVector(sunDirection,210);
    sun.target.updateMatrixWorld();
  }
  const moonLight=new T.DirectionalLight(0xabc9ff,0);
  moonLight.position.set(-145,94,33);
  scene.add(hemi,sun,sun.target,moonLight);
  const origin=regional?.origin??{x:300,y:225};
  const wx=x=>x-origin.x,wz=y=>y-origin.y;
  const drawPalaceSky=regional?null:addPalaceSky(T,heavens,{
    sunDirection:sunDirection.clone().multiplyScalar(142),landscape:outdoors,
    cityOrigin:{x:wx(plazaSites.sejong.x)-21,z:wz(plazaSites.sejong.y)+14},
    cityExclusions:[stationBounds,westBounds,corridorBounds,plazaBounds,gbBounds,bukchonBounds,hwangudanBounds,cheonggyeBounds,songhyeonBounds,
      {minX:45,maxX:560,minY:30,maxY:420}]
  });
  const drawPrecipitation=addSeoulPrecipitation(T,outdoors),foliage=makeSeasonFoliage(T);
  const randomFrom=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const rand=randomFrom(220621);
  const mat=new Map(),cylinders=new Map(),unit=new T.BoxGeometry(1,1,1);
  function matte(color){
    if(!mat.has(color))mat.set(color,new T.MeshStandardMaterial({color,roughness:.88}));
    return mat.get(color);
  }
  function shape(geometry,color,x,y,z,parent=scene){
    const object=new T.Mesh(geometry,matte(color));
    object.position.set(x,y,z);parent.add(object);return object;
  }
  function box(color,x,y,z,w,h,d,parent=scene){
    const object=shape(unit,color,x,y,z,parent);object.scale.set(w,h,d);return object;
  }
  function cylinder(color,x,y,z,r,h,sides=12,parent=scene,top=1){
    const key=sides+"/"+top;
    if(!cylinders.has(key))cylinders.set(key,new T.CylinderGeometry(top,1,1,sides));
    const object=shape(cylinders.get(key),color,x,y,z,parent);object.scale.set(r,h,r);return object;
  }

  const makeKit=root=>({wx,wz,rand,matte,
    shape:(geo,color,x,y,z,parent=root)=>shape(geo,color,x,y,z,parent),
    box:(color,x,y,z,w,h,d,parent=root)=>box(color,x,y,z,w,h,d,parent),
    cylinder:(color,x,y,z,r,h,sides,parent=root,top)=>cylinder(color,x,y,z,r,h,sides,parent,top)});
  const kit=makeKit(outdoors),deoksRoot=new T.Group(),corridorRoot=new T.Group(),transportRoot=new T.Group();
  const diningById=Object.fromEntries(diningVenues.map(venue=>[venue.id,venue]));
  function* addDiningFronts(root,area){
    for(const venue of diningVenues)if(venue.area===area)yield* buildDiningFacade(T,root,makeKit(root),venue,southWorldSurfaceHeight);
  }
  const {benches,trees,catWalls,fountains,lampMaterial,classical,middleModel,hallModel,drawPond,pavilionModels,buildGyeongbokDistrict}=
    regional?{benches:[],trees:[],catWalls:[],fountains:[],lampMaterial:matte(0xffffff),pavilionModels:new Map()}:buildJeongdong(T,deoksRoot,makeKit(deoksRoot),{deferGyeongbok:true});
  if(!regional)buildSejongCorridor(T,corridorRoot,makeKit(corridorRoot));
  registerJeongdongExtension();
  registerWestDistrict();
  registerStation();
  registerHwangudanNavigation();
  registerCheonggyeNavigation();
  registerSonghyeonNavigation(benches);
  if(!regional)buildJeongdongExtension(T,deoksRoot,makeKit(deoksRoot));
  const corridorGround=corridorRoot.children.slice();
  const deoksExtras=new T.Group();
  registerBikeDocks();
  const addDocks=(root,where,height)=>buildBikeDocks(T,root,makeKit(root),{docks:bikeDocks.filter(where),register:false,height});
  if(!regional)addDocks(deoksExtras,dock=>dock.y>=28&&dock.area!=="west"&&dock.area!=="station",southWorldSurfaceHeight);
  if(!regional)addDocks(corridorRoot,dock=>dock.y<28&&dock.y>-280&&dock.area!=="cheonggye"&&dock.area!=="west",southWorldSurfaceHeight);
  const createItemProp=makeItemProps(T,kit);
  const walkerModels=makeWalkerModels(T,scene,kit,createItemProp);
  const seaside=coast?.create(outdoors,coast.play,walkerModels,{...kit,chatTexture});
  const historicCity=gyeongju?.create(outdoors,gyeongju.origin,{...kit,chatTexture},walkerModels);
  if(seaside){heavens.visible=false;camera.far=3900;camera.updateProjectionMatrix();}
  const outdoorWalkers={...walkerModels,create(...args){
    const model=walkerModels.create(...args);
    outdoors.add(model.group);
    return model;
  }};
  const bungeoCustomer=makeBungeoCustomer(outdoorWalkers,{floorHeight,labelSprite,chatTexture});
  const busInBukchon=point=>point.x>=680&&point.y< -890;
  const busGround=point=>gyeongju?0:busInBukchon(point)?sampleMeshHeight(bukchonSurfaceGrade,point):southWorldSurfaceHeight(point);
  const buses=gyeongju?buildGyeongjuBuses(T,transportRoot,kit,walkerModels):coast?null:buildSejongBusModels(T,transportRoot,kit,walkerModels,busGround,
    point=>busInBukchon(point)?bukchonGroundHeight(point)??busGround(point):busGround(point));
  registerPlazaNavigation(benches);
  const drawWater=regional?null:addWater(T,deoksExtras,fountains,{...makeKit(deoksExtras),terrain:southWorldSurfaceHeight});
  registerRegionalStands();
  registerBungeoStall();
  registerArcade();
  registerBukchonTrees();
  registerExpandedSubway();
  registerHanbokRental();
  const minigameProps=registerMinigameProps(floorHeight);
  const minigameWorld=makeMinigameWorld(T,outdoors,kit,floorHeight);
  const transportCount=transportRoot.children.length;
  const stations=regional?regional.stations??[]:[...addStands(T,transportRoot,makeKit(transportRoot)),...regionalStations,...railCounters,plazaCafe];
  const transportGround=transportRoot.children.slice(transportCount);
  outdoors.add(transportRoot);
  const picnicWorld=makePicnicWorld(T,outdoors,kit,floorHeight,createItemProp);
  let firstPersonView,firstPersonUmbrella;
  const spotLights=[gate,middle,stoneHall].map((point,i)=>{
    const light=new T.PointLight(0xffc47f,0,i===2?55:30,2);
    light.position.set(wx(point.x)+(i===0?7:0),(i===2?4.5:2.6)+outsideGroundOffset(point),wz(point.y)+(i===0?2:i===2?22:9));
    scene.add(light);
    return light;
  });
  // The same three lights serve both maps: at Gyeongbokgung they move to the halls nearest the walker.
  const lightHomes=spotLights.map((light,i)=>({position:light.position.clone(),range:light.distance,power:i===2?720:126}));
  const plazaLights=[plazaSites.myeongnyang,plazaSites.haechi,plazaSites.sejong,plazaSites.time,plazaSites.woldae]
    .map(spot=>({...spot,height:5.4,range:36,power:340}));
  let lightPower=lightHomes.map(home=>home.power),lightDay=lightHomes.map(()=>0);
  // The room a walker stands in, if any: its lamp is lit by day as well as by night.
  function roomAt(point){
    for(const room of hallRooms){
      const dx=point.x-room.x,dy=point.y-room.y,c=Math.cos(room.angle),s=Math.sin(room.angle);
      if(Math.abs(dx*c-dy*s)<room.w/2&&Math.abs(dx*s+dy*c)<room.d/2)return room;
    }
    return null;
  }
  function placeLights(anchor){
    lightDay=lightHomes.map(()=>0);
    const mapped=inGyeongbok(anchor.x,anchor.y)?gbLightSpots:inGwanghwamunPlaza(anchor.x,anchor.y)?plazaLights:null;
    if(!mapped){
      spotLights.forEach((light,i)=>{light.position.copy(lightHomes[i].position);light.distance=lightHomes[i].range;});
      lightPower=lightHomes.map(home=>home.power);
    }else{
      const nearest=mapped.map(spot=>({spot,gap:Math.hypot(spot.x-anchor.x,spot.y-anchor.y)})).sort((a,b)=>a.gap-b.gap);
      spotLights.forEach((light,i)=>{
        const {spot}=nearest[i];
        light.position.set(wx(spot.x),spot.height+outsideGroundOffset(spot),wz(spot.y));light.distance=spot.range;
      });
      lightPower=nearest.slice(0,spotLights.length).map(({spot})=>spot.power);
    }
    const room=roomAt(anchor);
    if(room){
      spotLights[0].position.set(wx(room.x),room.floor+room.height-.7+outsideGroundOffset(room),wz(room.y));
      spotLights[0].distance=Math.max(room.w,room.d)*.8+8;
      lightPower[0]=130;lightDay[0]=85;
    }
  }
  const palacePeople=addPalacePeople(T,outdoors,kit,outdoorWalkers,{floorHeight:point=>floorHeight(point),labelSprite:(...args)=>labelSprite(...args),handheld});
  const streetPeople=addStreetPeople(T,outdoors,kit,outdoorWalkers,{floorHeight,labelSprite,handheld});
  const nightSky=addNightSky(T,heavens,randomFrom(173408));
  const dayHorizon=new T.Color(0xcce4f0),nightHorizon=new T.Color(0x23384f);
  const dayZenith=new T.Color(0x367ec5),nightZenith=new T.Color(0x080e21);
  const dayFog=new T.Color(0xc6dbe3),nightFog=new T.Color(0x1b2b40);
  const ambientDay=new T.Color(0xe8f0ff),ambientNight=new T.Color(0xa7c1ff);
  const cloudHorizon=new T.Color(0xc8d0d5),cloudZenith=new T.Color(0x879bab),cloudNight=new T.Color(0x18283c);
  const warmHorizon=new T.Color(0xedb49a),warmZenith=new T.Color(0x63718d);
  const sunlightDay=new T.Color(0xffe7bd),sunlightWarm=new T.Color(0xffa568);
  const winterGround=new T.Color(0xa1a7a3),ordinaryGround=new T.Color(0x86765a);
  const overcastAmbient=new T.Color(0xc7d4df),fogHorizon=new T.Color(0xd1d9db);
  const atmosphere={cloud:.13,rain:0,snow:0,windX:0,windZ:0,fog:0,twilight:0};
  let night=0,scannedMiddle=false,environmentShown=false;
  const lanterns=new Map();
  const lanternModel=makeWishLantern(kit);
  function removeLantern(id,entry){
    entry.light.removeFromParent();
    entry.paper?.map.dispose();
    entry.paper?.dispose();
    lanterns.delete(id);
  }

  const surveyedPavilions=regional?[]:[["jeonggwanheon","정관헌"],["hamnyeongjeon","함녕전"],["seogeodang","석어당"]].map(([model,label])=>{
    const {spec,groups}=pavilionModels.get(label);
    return {model,point:spec,groups,angle:spec.angle};
  });
  const guideMarker=makeGuideMarker();
  guideMarker.position.set(wx(ticketGuide.x),2.42+outsideGroundOffset(ticketGuide),wz(ticketGuide.y));
  const showMarker=makeGuideMarker("♫");
  showMarker.position.set(wx(plazaShowSpot.x),1.95+outsideGroundOffset(plazaShowSpot),wz(plazaShowSpot.y));
  showMarker.scale.setScalar(1.12);
  showMarker.visible=false;
  outdoors.add(guideMarker,showMarker);
  registerMuseumNavigation();
  const bounds=semaVenue.bounds;
  for(const x of [bounds.minX,bounds.maxX])addObstacle(x,(bounds.minY+bounds.maxY)/2,.3,bounds.maxY-bounds.minY);
  for(const y of [bounds.minY,bounds.maxY])addObstacle((bounds.minX+bounds.maxX)/2,y,bounds.maxX-bounds.minX,.3);
  const {minX,maxX,minY,maxY}=mmcaVenue.bounds;
  const perimeter=[[minX,minY,maxX,minY],[minX,maxY,maxX,maxY],[minX,minY,minX,maxY],[maxX,minY,maxX,maxY]];
  for(const [x1,y1,x2,y2] of [...perimeter,...mmcaWalls]){
    addObstacle((x1+x2)/2,(y1+y2)/2,Math.max(.28,x2-x1),Math.max(.28,y2-y1));
  }
  for(const {x,y,obstacles=[[0,0,5.9,5.9,2.12]]} of mmcaExhibits){
    for(const [dx,dy,width,depth,height] of obstacles)addObstacle(x+dx,y+dy,width,depth,0,height);
  }
  addObstacle(339,537.5,2.4,1.05,0,1.25);
  registerDiningNavigation(benches,diningVenues.filter(v=>v!==stationDining));
  benches.push(...cheonggyeSeats);
  registerDiningNavigation(benches,[stationDining]);
  registerRailFurniture(addObstacle,benches);
  if(regional)benches.splice(0,benches.length,...(seaside??historicCity).benches);
  const museum={outsideDoor:museumOutsideDoor,insideDoor:museumInsideDoor,insideSpawn:museumInsideSpawn,
    id:"museum",name:"덕수궁 전시관",outsideName:"석조전 서관",isInside:isInsideMuseum,floorAt:stairHeight,exhibits:[]};
  const amenity=(point,label)=>({...point,kind:"activity",label});
  const interactionMarkers=regional?null:makeInteractionMarkers(T,scene,{wx,wz,floorHeight},[
    ...COOKING_STALLS.map(stall=>amenity(stall,stall.kind==="hotteok"?"호떡 굽기":"붕어빵 굽기")),
    ...stations.map(station=>({...station,kind:"food",label:station.kind==="churu"?"츄르 사기":ITEMS[station.kind].name+" 받기"})),
    ...ktxBoardingSpots.map(spot=>({...spot,ktxTrack:spot.track,kind:"enter",label:ktxCoach.enterLabel})),
    {...ktxCoach.insideDoor,kind:"exit",label:ktxCoach.exitLabel},
    ...[museum,mmcaVenue,semaVenue,ARCADE_SITE,...diningVenues.filter(v=>v!==stationDining),...railRooms.filter(v=>v!==ktxCoach&&v.id!=="ktx-platform")].flatMap(venue=>[
      {...venue.outsideDoor,kind:"enter",label:venue.enterLabel??(venue===ARCADE_SITE?"오락실 입장":diningById[venue.id]?"식당 입장":"전시관 입장")},
      {...venue.insideDoor,kind:"exit",label:venue.exitLabel??"나가기"}
    ]),
    ...Object.values(ARCADE_STAIRS).flat().map(point=>amenity(point,point.name)),
    ...diningVenues.map(venue=>({...(venue.kioskPoint??venue.menuPoint),kind:"food",
      label:venue.kioskPoint?"키오스크 주문":"카운터 주문"})),
    ...bikeDocks.map(dock=>amenity(dock.access,"따릉이 대여")),
    ...stopsForRegion(gyeongju).map(stop=>amenity(stop.board,"버스 정류장")),
    ...transitStops.filter(stop=>stop.mode==="subway").map(stop=>amenity(stop.door,"지하철 타기")),
    ...traditionalGames.map(game=>{
      if(game.id!=="tuho")return amenity(game.point,game.action);
      const {x,y}=minigamePickup(game);
      return amenity({x:x+.87,y},"투호 화살 받기");
    }),
    amenity(hanbokRental,"한복 대여"),
    amenity({x:fountain.x+4.8,y:fountain.y+5.3},"소원등 날리기"),
    amenity({x:wishPond.x,y:wishPond.y-wishPond.reach+5},"소원등 날리기"),
    amenity(mmcaVenue.guestbookPoint,"방명록"),...diningVenues.map(venue=>amenity(venue.guestbookPoint,"방명록"))
  ]);
  const birds=addPalaceBirds(T,outdoors,{...kit,floorHeight},{trees,walls:catWalls,seed:catSeed,deferNorth:true,deferPopulation:true});
  const parkLife=addParkLife(T,outdoors,{...kit,trees,floorHeight,terrainHeight:outsideGroundOffset,catWalls,benches,onCatFlee,catSeed,birds,
    deferNorth:true,deferPopulation:true});
  const cityVisitors=addCityVisitors(T,kit,walkerModels,{benches,stations,parkLife,floorHeight,seatAt,room:catSeed,neighborhood:coast?.visitors,showMeal:updateTableTray,
    water(id,now,seat,pose,clock){
      const point=seat?.waterPoint;
      drawRipples(id,now,point?{...point,level:outsideGroundOffset(seat)+CHEONGGYE_WATER_LEVEL+.016,seat,kick:footKickAge(pose,clock)}:null);
    }});
  const coastWildlife=coast?(function*(){yield* birds.loadExpansion("pohang");yield* parkLife.loadExpansion("pohang");})():null;
  let coastWildlifeReady=false;
  let landmarkLoaders,surveyLoading=false;
  const surveyQueue=[];
  // Doorways cut through the surveyed shells so the furnished rooms inside can be entered.
  // Each is a box in the building's own coordinates: across, toward the front, and up.
  const surveyDoors={
    junghwajeon:{x:0,z:9.2,width:3.1,depth:2.8,floor:2.08,height:3.0},
    hamnyeongjeon:{x:1.1,z:5.9,width:2.6,depth:2.6,floor:1.85,height:2.95},
    seogeodang:{x:0,z:3.6,width:2.4,depth:2.2,floor:1.05,height:2.75}
  };
  function doorPlanes({x,z,width,depth,floor,height},point,angle){
    floor+=outsideGroundOffset(point);
    const c=Math.cos(angle),s=Math.sin(angle),px=wx(point.x),pz=wz(point.y);
    const across=new T.Vector3(c,0,-s),front=new T.Vector3(s,0,c),up=new T.Vector3(0,1,0);
    const baseX=across.x*px+across.z*pz,baseZ=front.x*px+front.z*pz;
    // With clipIntersection a fragment is dropped only when it lies behind every plane.
    return [
      new T.Plane(across.clone(),-(baseX+x+width/2)),new T.Plane(across.clone().negate(),baseX+x-width/2),
      new T.Plane(front.clone(),-(baseZ+z+depth/2)),new T.Plane(front.clone().negate(),baseZ+z-depth/2),
      new T.Plane(up.clone(),-(floor+height)),new T.Plane(up.clone().negate(),floor)
    ];
  }
  async function loadGltf(path){
    landmarkLoaders??=Promise.all([
      import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js"),
      import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/meshopt_decoder.module.js")
    ]);
    const [{GLTFLoader},{MeshoptDecoder}]=await landmarkLoaders;
    return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL(path,import.meta.url).href);
  }
  async function loadYiStatue({yiFigure,yiFallback}){
    try{
      const {scene:statue}=await loadGltf("./art/yi-sun-sin.glb");
      if(new T.Box3().setFromObject(statue).isEmpty())throw new Error("이순신 장군상 모델에 형상이 없습니다.");
      statue.name="이순신 장군상 STL 변환 모델";
      statue.traverse(mesh=>{
        if(mesh.isMesh)mesh.castShadow=mesh.receiveShadow=true;
      });
      yiFigure.add(statue);
      yiFallback.visible=false;
      shadowDirty=true;
      document.getElementById("yi-stl-credit")?.removeAttribute("hidden");
      container.dataset.yiStatue="stl";
    }catch{
      container.dataset.yiStatue="modeled";
    }
  }
  async function loadLandmark({name,point,groups,angle,root,onLoaded}){
    try{
      const northSurvey=gbSurveyModels.includes(name);
      const [asset,lighting]=await Promise.all([
        loadGltf(`./${name}.glb`),
        northSurvey?null:import("./survey-normals.js")
      ]);
      const replaced=prepareSurveyTerrain(T,asset.scene,name,groups);
      asset.scene.position.set(wx(point.x),outsideGroundOffset(point),wz(point.y));
      asset.scene.rotation.y=angle;
      const bay=groups[0]?.userData.door;
      const entrance=surveyDoors[name]??(northSurvey&&bay?{
        x:0,z:point.d*.5,width:(bay.b-bay.a+1)*point.w/point.bays-.6,
        depth:Math.max(3.2,point.d*.52),floor:.48,height:3.18
      }:null);
      if(northSurvey){
        const span=name==="gyeonghoeru"?40:point.w+2.6;
        asset.scene.scale.setScalar(span);
        if(name==="gyeonghoeru")asset.scene.rotation.y+=Math.PI/2;
      }
      const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      const surfaces=[];
      asset.scene.traverse(mesh=>{if(mesh.isMesh)surfaces.push(mesh);});
      for(const mesh of surfaces){
        const original=mesh.geometry;
        if(!original.attributes.normal){
          if(northSurvey)original.computeVertexNormals();
          else{
            const restored=await lighting.restoreSurveyNormals(T,original,asset.parser)??lighting.smoothSurveyNormals(T,original);
            if(restored!==original){original.dispose();mesh.geometry=restored;}
          }
        }
        const material=mesh.material;
        material.flatShading=false;material.metalness=0;material.roughness=.92;
        if(entrance){
          material.clippingPlanes=doorPlanes(entrance,point,angle);
          material.clipIntersection=true;material.clipShadows=true;
          renderer.localClippingEnabled=true;
        }
        if(material.map){material.map.anisotropy=anisotropy;material.map.needsUpdate=true;}
        material.needsUpdate=true;
        mesh.castShadow=mesh.receiveShadow=true;
      }
      root.add(asset.scene);
      if(!northSurvey)scannedGrounds.push(surveyGroundField(T,asset.scene,asset.scene.position.y));
      for(const group of replaced)group.visible=false;
      shadowDirty=true;
      container.dataset[name]="survey";
      onLoaded?.();
      return true;
    }catch{
      container.dataset[name]="modeled";
      return false;
    }
  }
  function addSurvey(root,name,point,groups,angle=0,onLoaded){surveyQueue.push({root,name,point,groups,angle,onLoaded});}
  addSurvey(deoksRoot,"seokjojeon",stoneHall,[classical]);
  addSurvey(deoksRoot,"junghwamun",middle,[middleModel],courtAngle,()=>{scannedMiddle=true;});
  addSurvey(deoksRoot,"junghwajeon",hall,[hallModel],courtAngle);
  for(const {model,point,groups,angle} of surveyedPavilions)addSurvey(deoksRoot,model,point,groups,angle);

  const deoksBounds={minX:jeongdongExtensionBounds.minX,maxX:560,minY:jeongdongExtensionBounds.minY,maxY:420};
  const plazaRoot=new T.Group(),palaceRoot=new T.Group(),museumRoot=new T.Group();
  const cookingScenes=new Map();
  let viewedCooking=null;
  function addCookingStalls(area,root){
    const localKit=makeKit(root);
    for(const stall of COOKING_STALLS)if(stall.area===area){
      cookingScenes.set(stall.id,addBungeoStall(T,root,localKit,groundHeight,stall));
    }
  }
  const deoks={root:deoksRoot,bounds:deoksBounds,*build(){
    yield* gradeJeongdongMeshes(T,deoksRoot,southWorldSurfaceHeight,{trees,catWalls});
    yield* addDiningFronts(deoksRoot,"jeongdong");
    deoksRoot.add(deoksExtras);
    addCookingStalls("jeongdong",deoksRoot);
    const models=[classical,middleModel,hallModel,...surveyedPavilions.flatMap(pavilion=>pavilion.groups)];
    const replaceable=new Set(models.flatMap(model=>[model,model.userData.surveyShell].filter(Boolean)));
    return yield* consolidate(deoksRoot,replaceable,foliage.register);
  }};
  const corridor={root:corridorRoot,bounds:corridorBounds,*build(){
    yield* gradeAvenueMeshes(T,corridorGround,southWorldSurfaceHeight);
    return yield* consolidate(corridorRoot,new Set(),foliage.register);
  }};
  const transport={*build(){
    yield* gradeAvenueMeshes(T,transportGround,southWorldSurfaceHeight);
    return yield* consolidate(transportRoot,new Set());
  }};
  let updatePlaza,updateHwangudan,updateCheonggye,northWildlife,plazaWildlife,southWildlife,buildTurn=false;
  const wildlife=[["jeongdong",jeongdongExtensionBounds],["hwangudan",hwangudanBounds],["bukchon",bukchonBounds],
    ["station",stationBounds],["west",westBounds],["songhyeon",songhyeonBounds],["cheonggye",cheonggyeBounds]]
    .map(([id,bounds])=>({id,bounds,steps:null,ready:false}));
  const plaza={root:plazaRoot,bounds:plazaBounds,*build(){
    const birdPerches=[];
    let monuments;
    updatePlaza=yield* assembleGwanghwamunPlaza(T,plazaRoot,makeKit(plazaRoot),{
      birdPerches,terrainHeight:southWorldSurfaceHeight,onMonuments:built=>{monuments=built;}
    });
    addRegionalStands(T,plazaRoot,makeKit(plazaRoot),"gwanghwamun");
    addDocks(plazaRoot,dock=>dock.y<=-280&&dock.y>-790&&dock.area!=="west");
    yield* gradeAvenueMeshes(T,plazaRoot.children,southWorldSurfaceHeight);
    yield* addDiningFronts(plazaRoot,"gwanghwamun");
    addCookingStalls("gwanghwamun",plazaRoot);
    addArcadeExterior(T,plazaRoot,makeKit(plazaRoot),southWorldSurfaceHeight);
    addMinigameMarkers(T,plazaRoot,kit,["kite"],floorHeight);
    const chunks=yield* consolidate(plazaRoot,new Set([monuments.yiFallback]),foliage.register);
    void loadYiStatue(monuments);
    plazaWildlife=birds.loadPlaza(birdPerches);
    return chunks;
  }};
  const palace={root:palaceRoot,bounds:gbBounds,*build(){
    const {groups}=yield* buildGyeongbokDistrict(palaceRoot);
    const stands=addRegionalStands(T,palaceRoot,makeKit(palaceRoot),"gyeongbokgung");
    for(const group of stands.children){
      group.position.y+=palaceGroundOffset(group.position.x+300,group.position.z+225);
    }
    addHanbokRental(T,palaceRoot,makeKit(palaceRoot));
    addCookingStalls("gyeongbokgung",palaceRoot);
    addDocks(palaceRoot,dock=>dock.y<=-790&&!dock.area,dock=>palaceGroundOffset(dock.x,dock.y));
    addMinigameMarkers(T,palaceRoot,kit,["tuho","jegi"],floorHeight,minigameProps);
    const surveyed=gbSurveyModels.filter(id=>groups.has(id));
    const chunks=yield* consolidate(palaceRoot,new Set(surveyed.map(id=>groups.get(id))),foliage.register);
    for(const id of surveyed)addSurvey(palaceRoot,id,gbSite[id],[groups.get(id)],gbSite[id].angle);
    northWildlife=(function*(){yield* birds.loadNorth();yield* parkLife.loadNorth();})();
    return chunks;
  }};
  const gallery={root:museumRoot,outsideDoor:museumOutsideDoor,*build(){
    this.view=yield* assembleMuseum(T,museumRoot,kit);
    museum.exhibits=this.view.exhibits;
    return [];
  }};
  function indoorDistrict(venue,load,builder){
    const root=new T.Group();
    root.name=venue.name;root.matrixAutoUpdate=false;
    return {root,outsideDoor:venue.outsideDoor,load,*build(){
      const features=yield* this.module[builder](T,root,makeKit(root),venue,walkerModels);
      if(venue===ARCADE_THIRD_SITE)Object.assign(features,yield* buildClassics(T,features.room,makeKit(features.room)));
      if(arcadeFloors.has(venue.id)||railRoomById[venue.id])yield* consolidate(root,new Set());
      features?.afterBatch?.();
      this.view=features;
      return [];
    }};
  }
  const indoorsById={
    museum:gallery,
    ...Object.fromEntries(railRooms.filter(v=>!cultureVenues.includes(v)).map(venue=>[venue.id,indoorDistrict(venue,()=>import("./rail-station-world.js"),"buildRailRoom")])),
    [semaVenue.id]:indoorDistrict(semaVenue,()=>import("./sema-gallery.js"),"buildSemaGallery"),
    [mmcaVenue.id]:indoorDistrict(mmcaVenue,()=>import("./mmca-gallery.js"),"buildMmcaGallery"),
    [ARCADE_SITE.id]:indoorDistrict(ARCADE_SITE,()=>import("./arcade-world.js"),"buildArcadeInterior"),
    [ARCADE_UPPER_SITE.id]:indoorDistrict(ARCADE_UPPER_SITE,()=>import("./arcade-upper-world.js"),"buildArcadeUpper"),
    [ARCADE_THIRD_SITE.id]:indoorDistrict(ARCADE_THIRD_SITE,()=>import("./arcade-third-world.js"),"buildArcadeThird"),
    ...Object.fromEntries(diningVenues.map(venue=>[venue.id,indoorDistrict(venue,()=>import("./dining-world.js"),"buildDiningInterior")])),
  };
  for(const venue of cultureVenues)indoorsById[venue.id]=indoorDistrict(venue,()=>import("./culture-station-world.js"),"buildCultureStation");
  const railComplex=indoorDistrict(railRooms[0],()=>import("./station-complex-world.js"),"buildStationComplex");
  for(const id of ["station-hall","ktx-platform",stationDining.id])indoorsById[id]=railComplex;
  const indoorDistricts=[...new Set(Object.values(indoorsById))];
  function expansionDistrict(bounds,contains,build,load){
    const root=new T.Group();
    return {root,bounds,contains,load,*build(){
      yield* build(root,makeKit(root),this.module);
      return yield* consolidate(root,new Set(),foliage.register);
    }};
  }
  const bukchon=expansionDistrict(bukchonBounds,bukchonWalkable,function*(root,localKit,{buildBukchon}){
    yield* buildBukchon(T,root,localKit);
    addRegionalStands(T,root,localKit,"bukchon");
    addCookingStalls("bukchon",root);
    addDocks(root,dock=>dock.area==="bukchon",dock=>bukchonGroundHeight(dock)??bukchonGroundHeight(dock.access)??0);
  },()=>import("./bukchon.js"));
  const hwangudan=expansionDistrict(hwangudanBounds,hwangudanWalkable,function*(root,localKit,{assembleHwangudan}){
    updateHwangudan=(yield* assembleHwangudan(T,root,localKit))?.update;
    yield* gradeAvenueMeshes(T,root.children,southWorldSurfaceHeight);
  },()=>import("./seoul-hwangudan.js"));
  const songhyeon=expansionDistrict(songhyeonBounds,songhyeonWalkable,function*(root,localKit,{buildSonghyeon}){
    yield* buildSonghyeon(T,root,localKit);
    addDocks(root,dock=>dock.area==="songhyeon",dock=>songhyeonGroundHeight(dock.x,dock.y)??0);
  },()=>import("./songhyeon.js"));
  const cheonggye=expansionDistrict(cheonggyeBounds,cheonggyeWalkable,function*(root,localKit,{buildCheonggye}){
    updateCheonggye=yield* buildCheonggye(T,root,localKit,southWorldSurfaceHeight);
    addDocks(root,dock=>dock.area==="cheonggye",southWorldSurfaceHeight);
  },()=>import("./cheonggye.js"));
  const stationsDistrict=expansionDistrict({minX:55,maxX:1160,minY:-965,maxY:410},()=>false,function*(root,localKit){
    yield* buildSubwayAccess(T,root,localKit,floorHeight,{terrainHeight:outsideGroundOffset});
  });
  const west=expansionDistrict(westBounds,westWalkable,function*(root,localKit,{buildWestDistrict}){
    yield* buildWestDistrict(T,root,localKit,Math.min(4,renderer.capabilities?.getMaxAnisotropy?.()??1));
    const stores=addRegionalStands(T,root,localKit,"west");
    for(const building of stores.children)building.position.y+=southWorldSurfaceHeight({x:building.position.x+300,y:building.position.z+225});
    addDocks(root,dock=>dock.area==="west",southWorldSurfaceHeight);
    yield* addDiningFronts(root,"west");
  },()=>import("./west-district.js"));
  let updateEscalators;
  const stationDistricts=stationBands.map(([minY,maxY],i)=>expansionDistrict({...stationBounds,minY,maxY},
    (x,y)=>y>=minY&&y<maxY&&(stationGround(x,y)!=null||approachAt(x,y)!=null),function*(root,localKit,{buildStationBand}){
      const animate=yield* buildStationBand(T,root,localKit,i);
      if(animate)updateEscalators=animate;
      addDocks(root,dock=>dock.area==="station"&&dock.y>=minY&&dock.y<maxY,southWorldSurfaceHeight);
      yield* buildSubwayAccess(T,root,localKit,floorHeight,{stationBand:[minY,maxY]});
    },()=>import("./station-world.js")));
  const expansions=[songhyeon,cheonggye,bukchon,hwangudan,west,...stationDistricts,stationsDistrict];
  const districts=[deoks,corridor,plaza,palace,...expansions],loading=container.querySelector("#loading-game");
  function distanceToDistrict({x,y},{minX,maxX,minY,maxY}){
    return Math.hypot(Math.max(minX-x,0,x-maxX),Math.max(minY-y,0,y-maxY));
  }
  function advanceWorld(anchor,inside){
    const indoors=Boolean(inside);
    const {x,y}=anchor;
    const nearCorridor=distanceToDistrict(anchor,corridorBounds)===0;
    const inNorthernMap=y<plazaBounds.minY+100;
    const area=(anchor.up&&cheonggyeLevel(anchor)!=null?cheonggye:null)??expansions.find(district=>district.contains(x,y))??
      (inGyeongbok(x,y)?palace:inGwanghwamunPlaza(x,y)?plaza:
        nearCorridor&&corridorWalkable(x,y)?corridor:distanceToDistrict(anchor,deoksBounds)===0?deoks:
        nearCorridor?corridor:inNorthernMap&&distanceToDistrict(anchor,bukchonBounds)===0?bukchon:
        inNorthernMap&&distanceToDistrict(anchor,gbBounds)===0?palace:null);
    const required=indoors?[inside]:area?[area]:[];
    const requireDistrict=district=>{if(!required.includes(district))required.push(district);};
    // Street corners at either end of Sejong-daero share a foreground with the next district.
    if(area===corridor&&y>=-321&&y<-266)requireDistrict(plaza);
    if(area===plaza&&y>-326)requireDistrict(corridor);
    if(area===corridor&&y>103&&x<550)requireDistrict(deoks);
    if(area===deoks&&y>103&&x>=442&&nearCorridor)requireDistrict(corridor);
    if(!indoors&&x>=500&&x<655&&y>=-196&&y<=-107){
      requireDistrict(cheonggye);requireDistrict(corridor);
    }
    if(!indoors&&area===songhyeon&&x<810)requireDistrict(bukchon);
    if(!indoors&&nearMarketStreet(x,y)){
      requireDistrict(palace);requireDistrict(plaza);
    }
    // At the Sajik-ro crossing and the east gates, both sides belong in the
    // foreground. Load them together after a shortcut or a restored visit.
    if(!indoors&&y<gwanghwamun.y+102&&y>gwanghwamun.y-28&&Math.abs(x-gwanghwamun.x)<102){
      requireDistrict(plaza);requireDistrict(palace);
    }
    if(!indoors&&(gbEastOpenings.some(gate=>Math.hypot(x-gate.x,y-gate.y)<43)||
       y<gwanghwamun.y+54&&y>gwanghwamun.y-35&&x>gwanghwamun.x+80&&x<gwanghwamun.x+208)){
      requireDistrict(palace);requireDistrict(bukchon);
    }
    const incomplete=district=>!district.chunks&&!district.failed;
    // Fetch both sides of a district crossing together. Mesh assembly still
    // runs one chunk at a time on the render thread.
    function fetchModule(target){
      if(!target.load||target.module||target.fetching||target.failed)return;
      target.fetching=true;
      target.load().then(module=>{target.module=module;},error=>{
        target.failed=true;console.error("Could not load a walking district",error);
      }).finally(()=>{target.fetching=false;});
    }
    for(const district of required)if(incomplete(district))fetchModule(district);
    const pending=required.find(district=>incomplete(district)&&!district.fetching);
    let nearby=null,gap=handheld?245:315;
    if(!indoors&&!pending)for(const district of districts){
      if(district.chunks||district.failed||district.fetching)continue;
      const distance=distanceToDistrict(anchor,district.bounds)+(district===stationsDistrict?110:0);
      if(distance<gap){nearby=district;gap=distance;}
    }
    const approachInterior=!indoors&&indoorDistricts.find(district=>incomplete(district)&&
      Math.hypot(anchor.x-district.outsideDoor.x,anchor.y-district.outsideDoor.y)<24);
    const travelling=Boolean(anchor.bus)||isCycling(anchor);
    const target=!indoors&&(approachInterior||(!transport.chunks&&!transport.failed?transport:nearby));
    const budget=pending?7:quality.frame>22?1:travelling?3:handheld?2:3.5;
    const deadline=performance.now()+budget;
    function build(target){
      if(target.load&&!target.module){
        fetchModule(target);
        return;
      }
      target.steps??=target.build();
      try{
        do{
          const step=target.steps.next();
          if(step.done){target.chunks=step.value;target.steps=null;cullAt=0;break;}
        }while(performance.now()<deadline);
      }catch(error){
        target.failed=true;target.steps=null;
        console.error("Could not assemble a walking district",error);
      }
    }
    function populate(iterator){
      do{if(iterator.next().done)return true;}while(performance.now()<deadline);
      return false;
    }
    if(pending)build(pending);
    else if(!indoors){
      const close=wildlife.filter(area=>!area.ready&&distanceToDistrict(anchor,area.bounds)<105)
        .sort((a,b)=>distanceToDistrict(anchor,a.bounds)-distanceToDistrict(anchor,b.bounds))[0];
      const nearSouth=deoks.chunks&&distanceToDistrict(anchor,deoksBounds)<100&&(birds.needsPopulation||parkLife.needsPopulation);
      const nearPlaza=plazaWildlife&&distanceToDistrict(anchor,plazaBounds)<215;
      const nearNorth=northWildlife&&distanceToDistrict(anchor,gbBounds)<225;
      buildTurn=!buildTurn;
      if(target&&(buildTurn||!(nearSouth||close||nearPlaza||nearNorth)))build(target);
      else if(nearSouth){
        southWildlife??=(function*(){yield* birds.populate();yield* parkLife.populate();})();
        if(populate(southWildlife))southWildlife=null;
      }else if(close){
        const {id}=close;
        close.steps??=(function*(){yield* birds.loadExpansion(id);yield* parkLife.loadExpansion(id);})();
        if(populate(close.steps)){close.ready=true;close.steps=null;}
      }else if(nearPlaza){
        if(populate(plazaWildlife))plazaWildlife=null;
      }else if(nearNorth){
        if(populate(northWildlife))northWildlife=null;
      }else if(target)build(target);
    }
    const waiting=required.some(incomplete);
    if(loading){
      loading.hidden=!waiting&&!required.some(district=>district.failed);
      const message=waiting?"산책길을 열고 있어요.":"산책길을 불러오지 못했어요.";
      if(loading.textContent!==message)loading.textContent=message;
    }
    return waiting;
  }

  const models=new Map(),parkedModels=new Map(),emojiMaps=new Map(),tableTrays=new Map(),serviceTrays=new Map();
  function updateServiceTrays(tickets,clock){
    const placed=new Set();
    for(const ticket of tickets){
      if(!ticket.kind||!ticket.table||!(["served","clearQueued","clearing"].includes(ticket.phase)))continue;
      placed.add(ticket.id);
      let tray=serviceTrays.get(ticket.id);
      if(!tray){
        const root=new T.Group();root.name="식탁 트레이";root.userData.diningTicketId=ticket.id;scene.add(root);
        const {x,y,height,heading}=diningTrayPose(ticket.table);
        root.position.set(wx(x),height+(railHeight(x,y)??0),wz(y));root.rotation.y=(180-heading)*Math.PI/180;
        tray={root,show:createItemProp(root)};serviceTrays.set(ticket.id,tray);
      }
      const age=clock-ticket.ateAt;
      tray.show(ticket.kind,age>=0&&age<ITEMS[ticket.kind].duration?age/1000:-1,ticket.remaining);
    }
    for(const [id,{root,show}] of serviceTrays){
      if(placed.has(id))continue;
      root.removeFromParent();show.dispose();serviceTrays.delete(id);
    }
  }
  function updateTableTray(player,seat,clock){
    const meal=seat?.tray&&diningTray(player,clock);
    let tableItem=tableTrays.get(player.id);
    if(!meal){
      if(tableItem)tableItem.root.visible=false;
      return;
    }
    if(!tableItem){
      const root=new T.Group();scene.add(root);
      tableItem={root,show:createItemProp(root)};tableTrays.set(player.id,tableItem);
    }
    const {x,y,height,heading}=seat.tray;
    tableItem.root.visible=true;
    tableItem.root.position.set(wx(x),height+(railHeight(x,y)??0),wz(y));
    tableItem.root.rotation.y=(180-heading)*Math.PI/180;
    tableItem.show(meal.item.kind,meal.itemAge<meal.spec.duration?meal.itemAge/1000:-1,meal.item.remaining);
  }
  function labelSprite(nickname,coat){
    const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
    const font='650 36px "Segoe UI","Malgun Gothic",sans-serif';
    ctx.font=font;
    canvas.width=Math.ceil(ctx.measureText(nickname).width+65);canvas.height=62;
    ctx.fillStyle="rgba(13,26,20,.68)";
    ctx.beginPath();ctx.roundRect(1,1,canvas.width-2,60,23);ctx.fill();
    ctx.strokeStyle="rgba(242,225,180,.32)";ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle="#"+coat.toString(16).padStart(6,"0");
    ctx.beginPath();ctx.arc(22,31,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff7e4";ctx.font=font;ctx.textBaseline="middle";ctx.fillText(nickname,40,32);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));
    sprite.scale.set(Math.min(3.6,canvas.width/160),.38,1);sprite.position.y=1.84;
    return sprite;
  }
  function emojiTexture(emoji){
    if(!emojiMaps.has(emoji)){
      const canvas=document.createElement("canvas");canvas.width=canvas.height=112;
      const ctx=canvas.getContext("2d");
      ctx.beginPath();ctx.arc(56,56,52,0,Math.PI*2);
      ctx.fillStyle="rgba(246,229,188,.94)";ctx.fill();ctx.strokeStyle="#795c38";ctx.lineWidth=3;ctx.stroke();
      ctx.font='69px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign="left";ctx.textBaseline="alphabetic";
      const bounds=ctx.measureText(emoji);
      const x=56+(bounds.actualBoundingBoxLeft-bounds.actualBoundingBoxRight)/2;
      const y=56+(bounds.actualBoundingBoxAscent-bounds.actualBoundingBoxDescent)/2;
      ctx.fillText(emoji,Number.isFinite(x)?x:56-bounds.width/2,Number.isFinite(y)?y:79);
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;emojiMaps.set(emoji,texture);
    }
    return emojiMaps.get(emoji);
  }
  const chatFont='600 28px "Segoe UI","Malgun Gothic","Apple SD Gothic Neo","Apple Color Emoji","Segoe UI Emoji",sans-serif';
  const chatGraphemes=typeof Intl.Segmenter==="function"?new Intl.Segmenter("ko",{granularity:"grapheme"}):null;
  const chatText=text=>[...text].slice(0,80).join("").replace(/\s+/gu," ").trim();
  function chatTexture(message){
    const text=chatText(message);
    if(!text)return null;
    const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d"),lines=[];
    if(!ctx)return null;
    const units=chatGraphemes?Array.from(chatGraphemes.segment(text),part=>part.segment):Array.from(text);
    const maxWidth=392,lineHeight=36,padding=16;
    ctx.font=chatFont;
    let line="";
    for(const unit of units){
      if(line&&ctx.measureText(line+unit).width>maxWidth){
        const space=line.lastIndexOf(" ");
        if(space>line.length*.55){lines.push(line.slice(0,space));line=line.slice(space+1)+unit;}
        else{lines.push(line.trimEnd());line=unit.trimStart();}
      }else line+=unit;
    }
    if(line.trim())lines.push(line.trim());
    canvas.width=Math.ceil(Math.min(maxWidth,Math.max(...lines.map(row=>ctx.measureText(row).width)))+padding*2);
    const boxHeight=lines.length*lineHeight+padding*2,mid=canvas.width/2;
    canvas.height=boxHeight+13;
    ctx.fillStyle="#f7edda";ctx.strokeStyle="#504633";ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(1.5,1.5,canvas.width-3,boxHeight-3,15);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(mid-10,boxHeight-2);ctx.lineTo(mid,boxHeight+9);ctx.lineTo(mid+10,boxHeight-2);ctx.fill();ctx.stroke();
    ctx.fillRect(mid-8,boxHeight-4,16,4);
    ctx.fillStyle="#25352a";ctx.font=chatFont;ctx.textAlign="center";ctx.textBaseline="middle";
    lines.forEach((row,index)=>ctx.fillText(row,mid,padding+lineHeight*(index+.5),maxWidth));
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    return map;
  }
  let walkerPreview;
  function previewWalker(canvas,appearance){
    const context=canvas.getContext("2d");
    if(!context)return;
    const {width,height}=canvas;
    if(!walkerPreview){
      const stage=new T.Scene(),camera=new T.PerspectiveCamera(33,width/height,.1,20);
      stage.background=new T.Color(0x26392d);
      camera.position.set(.95,1.04,3.30);camera.lookAt(0,.70,0);
      const key=new T.DirectionalLight(0xffe1ba,1.45);
      key.position.set(4,7,5);
      stage.add(new T.HemisphereLight(0xf5f1df,0x8b7863,2.05),key);
      const target=new T.WebGLRenderTarget(width,height);
      target.texture.colorSpace=T.SRGBColorSpace;
      walkerPreview={stage,camera,target,models:makeWalkerModels(T,stage,kit,createItemProp),
        model:null,coat:null,pixels:new Uint8Array(width*height*4),image:context.createImageData(width,height)};
    }
    const preview=walkerPreview,coat=appearance.coat??0xab5947;
    const name=appearance.nickname??"";
    if(preview.coat!==coat||preview.name!==name){
      if(preview.model)preview.models.dispose(preview.model);
      preview.model=preview.models.create(coat,"",labelSprite,name);preview.coat=coat;preview.name=name;
    }
    preview.models.update(preview.model,{x:300,y:225,heading:180,character:appearance.character,look:appearance.look},
      {now:performance.now(),clock:Date.now(),delta:.1,floor:0,turnEase:1,emojiTexture});
    const previous=renderer.getRenderTarget();
    try{
      renderer.setRenderTarget(preview.target);
      renderer.render(preview.stage,preview.camera);
      renderer.readRenderTargetPixels(preview.target,0,0,width,height,preview.pixels);
    }finally{renderer.setRenderTarget(previous);}
    const stride=width*4;
    for(let y=0;y<height;y++){
      const from=(height-1-y)*stride;
      preview.image.data.set(preview.pixels.subarray(from,from+stride),y*stride);
    }
    context.putImageData(preview.image,0,0);
  }
  const helmStroke=makeRaftStroke();
  function seatAt(position,clock){
    if(seaside&&position.coast?.mode==="deck"&&position.coast.deckSeat){
      const seat=seaside.cruiseSeatPose(position.coast.deckSeat);
      if(seat)return {...seat,base:footBathSeatBase(seat.top)};
    }
    const bus=position.bus&&busAt(position.bus.index,clock),pose=bus&&busSeatPose(bus,position.bus.seat);
    if(pose&&bus.kind==="raft")return {...pose,heading:position.id===bus.helm?bus.heading:pose.heading,
      base:footBathSeatBase(RAFT_SEAT_HEIGHT+raftHeave(clock))};
    if(pose)return {...pose,base:BUS_FLOOR+.015+busGround(bus)};
    if(seaside&&position.coast?.mode==="table"){
      const dish=seaside.tavernDiningPlate(position.coast.seat);
      return {x:position.x,y:position.y,heading:position.heading,base:footBathSeatBase(seaside.tavernStoolTop),
        plate:dish&&{x:dish.x+origin.x,y:dish.z+origin.y,h:dish.h,tableX:dish.tableX+origin.x,tableY:dish.tableZ+origin.y}};
    }
    if(coast&&position.coast?.mode==="bus")return {x:position.x,y:position.y,heading:position.heading,base:2.72};
    const seat=benches[position.seat]?.slots[position.seatSide??0];
    if(seat?.beach||seat?.cafeFloor!=null)return {...seat,base:footBathSeatBase(seat.top)};
    if(!seat&&position.groundSit&&!isCycling(position))return {x:position.x,y:position.y,heading:position.heading,
      base:footBathSeatBase(floorHeight(position)),ground:true};
    if(seat?.footBath)return {...seat,base:footBathSeatBase(outsideGroundOffset(seat)+seat.base)};
    return seat?{...seat,base:(seat.base??0)+(interiorAt(seat.x,seat.y)?railHeight(seat.x,seat.y)??0:
      songhyeonGroundHeight(seat.x,seat.y)??outsideGroundOffset(seat))}:null;
  }
  // Low kerbs, benches and ledges can be stood on after a jump, so they raise the floor too.
  function floorHeight(position){
    if(historicCity)return historicCity.surface(position);
    if(seaside)return seaside.surface(position);
    const rail=railHeight(position.x,position.y);
    if(rail!=null)return rail+platformAt(position.x,position.y,true);
    const culture=cultureHeight(position.x,position.y);if(culture!=null)return culture;
    const terrain=interiorAt(position.x,position.y)?0:outsideGroundOffset(position);
    const approach=approachAt(position.x,position.y);if(approach?.height<0)return terrain+approach.height;
    if(position.x<150&&position.y< -120&&westWalkable(position.x,position.y)){
      return terrain+WEST_PAVING_HEIGHT+platformAt(position.x,position.y,true);
    }
    const basin=plazaGroundHeight(position);
    if(basin!=null)return terrain+basin;
    const river=cheonggyeLevel(position);
    if(river!=null)return terrain+river;
    let level=Math.max(groundHeight(position),terrain+Math.max(platformAt(position.x,position.y,true),loftHeight(position)));
    // A scanned lawn or step a little above the ground lifts the walker onto it.
    if(scannedGrounds.length&&!interiorAt(position.x,position.y)){
      const x=wx(position.x),z=wz(position.y),ground=level;
      for(const scanned of scannedGrounds){
        const height=scanned(x,z);
        if(height>level&&height<ground+.6)level=height;
      }
    }
    return level;
  }
  const footing=floorHeight;
  const rippleGeometry=new T.RingGeometry(.5,.58,30),ripples=new Map();
  rippleGeometry.rotateX(-Math.PI/2);
  const dropGeometry=new T.SphereGeometry(.024,6,5);
  const dropMaterial=new T.MeshBasicMaterial({color:0xe6f6f7,transparent:true,opacity:.85,depthWrite:false});
  // Droplets a kicking foot throws up. They follow the room clock, as the kick does.
  function drawSplash(rings,surface){
    if(surface?.kick==null){
      if(rings?.drops)for(const drop of rings.drops)drop.visible=false;
      return;
    }
    rings.drops??=Array.from({length:10},()=>{const drop=new T.Mesh(dropGeometry,dropMaterial);scene.add(drop);return drop;});
    const ahead=Math.hypot(surface.x-surface.seat.x,surface.y-surface.seat.y)||1;
    const fx=(surface.x-surface.seat.x)/ahead,fy=(surface.y-surface.seat.y)/ahead;
    rings.drops.forEach((drop,index)=>{
      const foot=index%2,side=foot?1:-1;
      // The foot breaks the surface as its swing turns upward.
      const age=(surface.kick/FOOT_BATH_PERIOD+foot*.5)%1*FOOT_BATH_PERIOD/1000;
      const spread=(index*2.399)%1.5-.75,speed=.45+(index*.618%1)*.55,rise=1.25+(index*.382%1)*.75;
      const height=rise*age-4.9*age*age;
      drop.visible=height>0;
      if(!drop.visible)return;
      const reach=speed*age,cos=Math.cos(spread),sin=Math.sin(spread);
      const x=surface.x-fy*side*.075+(fx*cos-fy*sin)*reach,y=surface.y+fx*side*.075+(fy*cos+fx*sin)*reach;
      drop.position.set(wx(x),surface.level+height,wz(y));
      drop.scale.setScalar(1-age*1.4);
    });
  }
  // Rings spreading from feet resting in the stream.
  function drawRipples(id,now,surface=null){
    let rings=ripples.get(id);
    if(!surface){
      drawSplash(rings,null);
      if(rings)for(const ring of rings)ring.visible=false;
      return;
    }
    if(!rings){
      rings=[0,1].map(()=>new T.Mesh(rippleGeometry,new T.MeshBasicMaterial({color:0xeaf7f8,transparent:true,depthWrite:false})));
      for(const ring of rings)scene.add(ring);
      ripples.set(id,rings);
    }
    drawSplash(rings,surface);
    const {x,y,level}=surface;
    rings.forEach((ring,i)=>{
      const phase=(now*.00055+i*.5)%1;
      ring.visible=true;
      ring.position.set(wx(x),level,wz(y));
      ring.scale.setScalar(.37+phase*.60);
      ring.material.opacity=(1-phase)*.26;
    });
  }
  function groundHeight(position) {
    if(historicCity)return historicCity.surface(position);
    if(seaside)return seaside.surface(position);
    const rail=railHeight(position.x,position.y);
    if(rail!=null)return rail;
    if(interiorAt(position.x,position.y))return cultureHeight(position.x,position.y)??stairHeight(position)??0;
    const terrain=outsideGroundOffset(position);
    const river=cheonggyeLevel(position);
    if(river!=null)return terrain+river;
    const plazaLevel=plazaGroundHeight(position);
    if(plazaLevel!=null)return terrain+plazaLevel;
    const songhyeonLevel=songhyeonGroundHeight(position.x,position.y);
    if(songhyeonLevel!=null)return songhyeonLevel;
    const bukchonLevel=bukchonGroundHeight(position);
    if(bukchonLevel!=null)return bukchonLevel;
    const hwangudanLevel=hwangudanFloorHeight(position);
    if(hwangudanLevel!=null)return terrain+hwangudanLevel;
    if(position.y<gwanghwamun.y)return terrain;
    const stair=stairHeight(position);
    if(stair!=null)return terrain+stair;
    if(Math.abs(position.y-bridge.y)<3.15&&Math.abs(position.x-bridge.x)<3.6)return terrain+Math.max(0,.23-(Math.abs(position.x-bridge.x)-2.70)*.34);
    // Daehanmun: the stone base under the gate, then the terrace and its steps to the street.
    const gateAhead=position.x-gate.x,gateAside=Math.abs(position.y-gate.y);
    if(gateAhead>-4.6&&gateAhead<4.6&&gateAside<7.7)return terrain+.29;
    if(gateAhead>=4.6&&gateAhead<13.6&&gateAside<8.75)return terrain+.20*Math.max(0,Math.min(1,(13.6-gateAhead)/1.4));
    const dx=position.x-middle.x,dy=position.y-middle.y;
    const localX=dx*Math.cos(courtAngle)-dy*Math.sin(courtAngle),localZ=dx*Math.sin(courtAngle)+dy*Math.cos(courtAngle);
    if(Math.abs(localX)<2.0&&Math.abs(localZ)<7.2){
      if(!scannedMiddle)return terrain+(Math.abs(localZ)<3.8?.24:0);
      return terrain+.69*Math.max(0,Math.min(1,(7.2-Math.abs(localZ))/2.6));
    }
    return terrain;
  }
  const ring=new T.Mesh(new T.RingGeometry(.18,.25,28),new T.MeshBasicMaterial({color:0xffcf70,side:T.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
  const pivot=new T.Vector3(),anchorPoint=new T.Vector3(),arm=new T.Vector3(),gaze=new T.Vector3();
  const spriteScreen=new T.Vector3(),cameraUp=new T.Vector3();
  function spriteClipped(sprite){
    sprite.getWorldPosition(spriteScreen).applyMatrix4(camera.matrixWorldInverse);
    const depth=-spriteScreen.z;
    if(depth<=camera.near)return true;
    spriteScreen.applyMatrix4(camera.projectionMatrix);
    const width=sprite.scale.x*camera.projectionMatrix.elements[0]/depth;
    const height=sprite.scale.y*camera.projectionMatrix.elements[5]/depth;
    return spriteScreen.x-width*sprite.center.x<-.98||spriteScreen.x+width*(1-sprite.center.x)>.98||
      spriteScreen.y-height*sprite.center.y<-.98||spriteScreen.y+height*(1-sprite.center.y)>.98||spriteScreen.z>1;
  }
  function showLocalSprite(model,sprite,element,text){
    const show=Boolean(sprite?.visible&&(!model.group.visible||spriteClipped(sprite)));
    if(show){
      sprite.visible=false;
      if(element.textContent!==text)element.textContent=text;
      element.style.opacity=sprite.material.opacity;
    }else if(element.textContent){
      element.textContent="";
    }
    if(element.hidden===show)element.hidden=!show;
  }
  const coach=railRoomById["ktx-coach"];
  let cameraAnchor=null,cameraOnBridge=false,lowerStream=false,cameraDistance=0,prevTime=0,governedAt=0,cullAt=0;
  let visibleRoot=outdoors,visibleInterior=null;
  let shadowDirty=true,shadowTime=-Infinity,shadowFrame=-Infinity,shadowX=Infinity,shadowY=Infinity;
  const shadowDirection=new T.Vector3();
  let streamX=Infinity,streamY=Infinity,streamInterior,streamReleaseAt=Infinity;
  // Last resort on a slow device: draw fewer birds and only the cats close by.
  function thinWildlife(sparse){
    quality.sparse=sparse;birds.setSparse(sparse);parkLife.setSparse(sparse);
    cullAt=0;
  }
  function setQuality(mode){
    const profile=profiles[mode];
    if(!profile)return;
    quality.mode=mode;
    quality.max=Math.min(devicePixelRatio,profile.max);
    quality.min=Math.min(quality.max,coast&&!quality.pinned?(mode==="low"?.60:.75):profile.min);
    quality.ratio=quality.max;
    quality.shadows=mode!=="low";
    quality.frame=16.7;quality.calm=0;quality.raiseAfter=0;quality.checkAt=performance.now()+2500;
    renderer.setPixelRatio(quality.ratio);resize();
    thinWildlife(mode==="low");shadowDirty=true;
  }
  setQuality(graphics);
  function govern(now){
    const elapsed=now-(governedAt||now);
    governedAt=now;
    if(quality.pinned||(coast&&quality.mode==="high")||document.hidden||elapsed<=0||elapsed>(coast?2000:250))return;
    quality.frame+=(Math.min(elapsed,160)-quality.frame)*.06;
    if(now<quality.checkAt)return;
    quality.checkAt=now+1300;
    if(quality.frame>23){
      quality.calm=0;
      // Hold the lower setting for a while so the picture does not pump up and down.
      quality.raiseAfter=now+40000;
      if(quality.ratio>quality.min+.01){
        quality.ratio=Math.max(quality.min,quality.ratio*.87);
        renderer.setPixelRatio(quality.ratio);resize();
      }else if(quality.shadows&&quality.frame>30)quality.shadows=false;
      else if(!quality.shadows&&!quality.sparse&&quality.frame>30)thinWildlife(true);
      quality.frame=19;
    }else if(quality.frame<17.6&&++quality.calm>=5&&now>(quality.raiseAfter??0)){
      quality.calm=0;
      if(quality.sparse&&quality.mode!=="low")thinWildlife(false);
      else if(!quality.shadows&&quality.mode!=="low")quality.shadows=true;
      else if(quality.ratio<quality.max-.01){
        quality.ratio=Math.min(quality.max,quality.ratio*1.08);
        renderer.setPixelRatio(quality.ratio);resize();
      }
    }
  }
  function updateSunShadow(indoors,anchor,peers,clock,now){
    const enabled=quality.shadows&&!indoors&&sun.intensity>.24;
    if(sun.castShadow!==enabled){
      sun.castShadow=enabled;
      shadowDirty=true;
    }
    if(!enabled)return;
    const movingCaster=player=>{
      const actionAge=clock-Math.max(player.wave??0,player.gesture?.at??0,player.itemUse?player[player.itemUse]?.started??0:0,
        player.feed?.at??0,player.pet?.at??0);
      return player.stepping||player.bus||Math.abs(player.vx??0)+Math.abs(player.vy??0)>.025||
        jumpLift(player,clock)>0||actionAge>=0&&actionAge<2700;
    };
    const active=movingCaster(anchor)||peers.some(peer=>(peer.x-anchor.x)**2+(peer.y-anchor.y)**2<shadowReach**2&&movingCaster(peer));
    // An idle camera keeps the same high-resolution shadow map between refreshes.
    // Characters and vehicles keep the usual update rate while they are moving.
    const interval=active?(quality.pinned?0:handheld?80:48):165;
    const recentered=(anchor.x-shadowX)**2+(anchor.y-shadowY)**2>12**2;
    const changedSun=shadowDirection.distanceToSquared(sunDirection)>.003**2;
    const frame=renderer.info.render.frame;
    const idleGap=active||!Number.isFinite(frame)||frame-shadowFrame>=2;
    if(!shadowDirty&&!recentered&&!changedSun&&(!idleGap||now-shadowTime<interval))return;
    aimShadow(wx(anchor.x),groundHeight(anchor),wz(anchor.y));
    renderer.shadowMap.needsUpdate=true;
    shadowTime=now;shadowFrame=frame;shadowX=anchor.x;shadowY=anchor.y;
    shadowDirection.copy(sunDirection);
    shadowDirty=false;
  }
  function render(state,now){
    if(container.hidden)return;
    if(coastWildlife&&!coastWildlifeReady)coastWildlifeReady=coastWildlife.next().done;
    const {me,peers,view,firstPerson,fountainShow,parkedBikes=[],clock=Date.now()}=state,delta=Math.min(.064,(now-(prevTime||now))/1000);
    seaside?.setClock(clock);
    prevTime=now;
    const anchor=state.monitorFocus??me,angle=view.pan*Math.PI/180,insideId=state.monitorFocus?null:interiorAt(anchor.x,anchor.y),indoors=Boolean(insideId),
      atPlaza=inGwanghwamunPlaza(anchor.x,anchor.y);
    const interior=indoorsById[insideId];
    const service=gyeongju||diningById[insideId]?state.diningService??[]:[];
    const baking=state.bungeoMode&&(cookingStallById(state.bungeoMode.stall)??BUNGEO_STALL);
    const waiting=!regional&&advanceWorld(anchor,interior);
    const blocked=waiting&&(indoors||cameraAnchor==null||Math.hypot(anchor.x-300-pivot.x,anchor.y-225-pivot.z)>65);
    loading?.classList?.toggle("loading-transition",blocked);
    if(blocked)return;
    interactionMarkers?.update(state.photoCapture||anchor.bus?null:anchor,now);
    picnicWorld.update(indoors?null:anchor,state.picnics);
    let weather=state.environment&&resolveSeoulEnvironment(state.environment,clock);
    const seaStorm=seaside?.stormAt(anchor)??0;
    if(weather&&seaStorm>0)weather={...weather,rain:Math.max(weather.rain,seaStorm),snow:weather.snow*(1-seaStorm),
      cloud:Math.max(weather.cloud,seaStorm),fog:Math.max(weather.fog,seaStorm*.76),
      windX:weather.windX+seaStorm*2.6,windZ:weather.windZ-seaStorm*1.1};
    const ease=environmentShown?Math.min(1,delta*4.2):1;
    const targetNight=weather?.night??Number(Boolean(view.night));
    night+=(targetNight-night)*ease;
    environmentShown=true;
    for(const key of ["cloud","rain","snow","windX","windZ","fog","twilight"]){
      const target=weather?.[key]??(key==="cloud"?.13:0);
      atmosphere[key]+=(target-atmosphere[key])*ease;
    }
    if(weather){
      const {x,y,z}=weather.sun;
      skyUniforms.solar.value.set(x,y,z);
      sunDirection.set(x,Math.max(.09,y),z).normalize();
      shadowRight.crossVectors(worldUp,sunDirection).normalize();
      shadowUp.crossVectors(sunDirection,shadowRight).normalize();
    }
    const {cloud,fog,twilight}=atmosphere;
    const season=weather?.season??"autumn";
    foliage.update(season,atmosphere.snow);
    skyUniforms.twilight.value=twilight*(1-cloud*.77)*(1-fog);
    skyUniforms.horizon.value.copy(dayHorizon).lerp(warmHorizon,twilight*.57).lerp(cloudHorizon,cloud*.85)
      .lerp(fogHorizon,fog).lerp(nightHorizon,night);
    skyUniforms.zenith.value.copy(dayZenith).lerp(warmZenith,twilight*.65).lerp(cloudZenith,cloud*.87)
      .lerp(fogHorizon,fog*.58).lerp(nightZenith,night).lerp(cloudNight,cloud*night*.55);
    scene.fog.color.copy(dayFog).lerp(warmHorizon,twilight*.34).lerp(cloudHorizon,cloud*.8)
      .lerp(fogHorizon,fog).lerp(nightFog,night);
    scene.background=sameStation(insideId,"station-hall")||insideId==="ktx-coach"?skyUniforms.horizon.value:null;
    scene.fog.density=indoors?.0039:.0039+cloud*.00065+fog*.016;
    if(seaside)scene.fog.density=.00049+fog*.002+seaStorm*.009;
    if(historicCity)scene.fog.density=.00145+fog*.006;
    hemi.color.copy(ambientDay).lerp(overcastAmbient,cloud*.58).lerp(ambientNight,night);
    hemi.groundColor.copy(season==="winter"?winterGround:ordinaryGround);
    sun.color.copy(sunlightDay).lerp(sunlightWarm,twilight*.84);
    // The sky follows the route; modeled buildings stay fixed in the world.
    const horizonFollow=Math.max(T.MathUtils.smoothstep(180-anchor.y,0,220),T.MathUtils.smoothstep(anchor.y-410,0,300));
    heavens.position.set((wx(anchor.x)-21)*horizonFollow,0,(wz(anchor.y)+14)*horizonFollow);
    // Range visibility only changes with the walker, a new district or quality tier.
    // A stationary view only needs another sweep when detached buffers expire.
    const streamTravel=(anchor.x-streamX)**2+(anchor.y-streamY)**2;
    if(!cullAt||streamTravel>22**2||streamInterior!==insideId||now>=cullAt&&(streamTravel>0||now>=streamReleaseAt)){
      cullAt=now+180;streamX=anchor.x;streamY=anchor.y;streamInterior=insideId;streamReleaseAt=Infinity;
      const cx=wx(anchor.x),cz=wz(anchor.y),reach=quality.sparse?300:handheld&&!quality.pinned?415:540;
      const detailReach=quality.pinned?reach:quality.sparse?100:handheld?145:200;
      let releaseBudget=12;
      placeLights(anchor);
      function cull(chunks,active){
        for(const chunk of chunks){
          const {x,z,radius,object,parent,detail,ownsGeometry}=chunk;
          const range=(detail?detailReach:reach)+(object.parent?18:0)+radius;
          if(active&&(x-cx)**2+(z-cz)**2<range**2){
            if(!object.parent){parent.add(object);if(object.castShadow)shadowDirty=true;}
            chunk.releaseAt=0;
          }else{
            if(object.parent){
              object.removeFromParent();
              chunk.releaseAt=now+20000;
              if(object.castShadow)shadowDirty=true;
            }
            if(chunk.releaseAt&&now>=chunk.releaseAt&&releaseBudget>0){
              // Keep the cell's CPU data. Three uploads it again when we walk back.
              if(object.isInstancedMesh)object.dispose();
              if(ownsGeometry)object.geometry.dispose();
              chunk.releaseAt=0;releaseBudget--;
            }
            if(chunk.releaseAt)streamReleaseAt=Math.min(streamReleaseAt,chunk.releaseAt);
          }
        }
      }
      if(transport.chunks)cull(transport.chunks,!indoors);
      for(const district of districts){
        if(!district.chunks)continue;
        const attached=district.root.parent===outdoors;
        const visible=!indoors&&distanceToDistrict(anchor,district.bounds)<reach+(attached?90:65);
        if(visible){
          if(!attached){outdoors.add(district.root);shadowDirty=true;}
        }else if(attached){district.root.removeFromParent();shadowDirty=true;}
        cull(district.chunks,visible);
      }
      if(!indoors&&!surveyLoading){
        let next=null,distance=handheld?135:210;
        for(const item of surveyQueue){
          if(item.started||item.root.parent!==outdoors)continue;
          const gap=Math.hypot(item.point.x-anchor.x,item.point.y-anchor.y);
          if(gap<distance){next=item;distance=gap;}
        }
        if(next){
          surveyLoading=next.started=true;
          loadLandmark(next).finally(()=>{surveyLoading=false;cullAt=0;});
        }
      }
    }
    const activeRoot=indoors?interior?.root:outdoors;
    if(activeRoot!==visibleRoot){
      visibleRoot?.removeFromParent();
      visibleInterior?.view?.setVisible?.(false);
      if(activeRoot)scene.add(activeRoot);
      interior?.view?.setVisible?.(true);
      visibleRoot=activeRoot;visibleInterior=interior;
      shadowDirty=true;
    }
    interior?.view?.update?.(clock,state.galleryLight??0,service,anchor);
    interior?.view?.updateArcade?.(state.arcade,now,peers,clock,view,state.bowling);
    updateServiceTrays(service,clock);
    guideMarker.visible=!indoors&&Math.hypot(anchor.x-ticketGuide.x,anchor.y-ticketGuide.y)<22;
    showMarker.visible=atPlaza&&!indoors&&Math.hypot(anchor.x-plazaShowSpot.x,anchor.y-plazaShowSpot.y)<38;
    if(guideMarker.visible){
      const pulse=state.guideNearby?Math.sin(now*.004)*.045:0;
      guideMarker.scale.setScalar((state.guideNearby ? .88 : .78)+pulse);
      guideMarker.material.opacity=state.guideNearby?1:.82;
    }
    hemi.intensity=indoors?1.72:1.42-night*.88+cloud*(1-night)*.12;
    sun.intensity=indoors?0:3.05*(1-night)*(1-cloud*.83)*(1-fog*.68)*(1-twilight*.38);
    moonLight.intensity=indoors?0:night*.95*(1-cloud*.52);
    sun.visible=sun.intensity>0;
    moonLight.visible=moonLight.intensity>0;
    updateSunShadow(indoors,anchor,peers,clock,now);
    govern(now);
    lampMaterial.emissiveIntensity=.03+night*2.15;
    spotLights.forEach((light,i)=>{
      light.intensity=lightDay[i]*(1-night)+night*lightPower[i];
      light.visible=!indoors&&light.intensity>0;
    });
    buses?.update(clock,indoors?null:anchor);
    if(palaceRoot.parent===outdoors)for(const {material,rest,strength} of gbNightGlow)material.emissiveIntensity=rest+night*strength;
    const cookingId=state.bungeoStall??(state.bungeoMolds?BUNGEO_STALL.id:baking?.id);
    const watching=indoors?null:cookingScenes.get(cookingId);
    if(viewedCooking&&viewedCooking!==watching)viewedCooking.update(null,clock,null);
    viewedCooking=watching;
    watching?.update(state.bungeoMolds,clock,anchor,state.bungeoStock,baking?.id===cookingId?state.bungeoMode:null);
    bungeoCustomer.update(cookingId===BUNGEO_STALL.id?state.bungeoOrder:null,
      !indoors&&plazaRoot.parent===outdoors?anchor:null,now,clock,delta);
    if(hwangudan.root.parent===outdoors)updateHwangudan?.(night);
    if(!indoors&&cheonggye.root.parent===outdoors)updateCheonggye?.(now*.001,night,scene.fog.color,anchor,state.paperBoats,clock);
    const roster=[me,...peers],present=new Set(roster.map(player=>player.id));
    if(!indoors&&Math.abs(anchor.x-20)<95&&Math.abs(anchor.y-1424)<95)updateEscalators?.(clock*.001);
    minigameWorld.begin(clock,indoors?null:anchor,state.minigames,state.minigameAction,state.minigameFree);
    if(!indoors){
      // Every pond shares one surface, so it keeps moving at Gyeongbokgung too.
      drawPond?.(now*.001,night);
      if(deoksRoot.parent===outdoors&&distanceToDistrict(anchor,deoksBounds)<120)drawWater(now*.001,night,anchor);
      nightSky(night*(1-cloud*.91)*(1-fog*.89));
      drawPalaceSky?.(clock,night,{cloud,fog,twilight,direction:weather?skyUniforms.solar.value:undefined,haze:scene.fog.color});
      birds.update(clock,delta,roster);
    }
    const parkedNearby=new Set();
    for(const bike of parkedBikes){
      if(indoors||interiorAt(bike.x,bike.y)||(bike.x-anchor.x)**2+(bike.y-anchor.y)**2>140**2)continue;
      parkedNearby.add(bike.id);
      let model=parkedModels.get(bike.id);
      if(!model){model=makeRidingBike(T,{rearSeat:true}).group;parkedModels.set(bike.id,model);outdoors.add(model);}
      const rider=bike.id===me.id?me:peers.find(player=>player.id===bike.id);
      const fallWeight=rider?bikeFallAt(rider,clock)?.weight??0:0;
      model.position.set(wx(bike.x),footing(bike)+fallWeight*.16,wz(bike.y));
      model.rotation.set(0,(180-bike.heading)*Math.PI/180,fallWeight*1.25,"YXZ");
    }
    for(const [id,model] of parkedModels)if(!parkedNearby.has(id)){model.removeFromParent();parkedModels.delete(id);}
    for(const {id,feed} of roster)if(feed&&feed.at<=clock&&feed.at+FEED_MS>clock)parkLife.feed(feed.id,feed.at,id);
    for(const {pet} of roster)if(pet&&pet.at<=clock&&pet.at+PET_MS>clock)parkLife.pet(pet.id,pet.at);
    parkLife.update(clock,indoors?null:anchor,roster,season==="autumn");
    if(!regional)palacePeople.update(clock,now,delta,indoors?null:anchor,roster,Boolean(quality.sparse));
    if(!regional)streetPeople.update(clock,now,delta,indoors?null:anchor,Boolean(quality.sparse));
    if(!gyeongju)cityVisitors.update(clock,now,delta,anchor,insideId,roster,Boolean(quality.sparse));
    for(const [id,model] of models){
      if(present.has(id))continue;
      minigameWorld.remove(model);
      walkerModels.dispose(model);
      models.delete(id);
      const tray=tableTrays.get(id);
      if(tray){tray.show.dispose();tray.root.removeFromParent();tableTrays.delete(id);}
      for(const ring of ripples.get(id)??[]){ring.removeFromParent();ring.material.dispose();}
      for(const drop of ripples.get(id)?.drops??[])drop.removeFromParent();
      ripples.delete(id);
    }
    const diners=new Map(service.map(ticket=>[ticket.player,ticket]));
    function diningPose(player){
      const taste=player.coast?.tasting;
      if(player.coast?.mode==="table"){
        if(taste?.kind==="grilledClam"&&clock>=taste.at&&clock-taste.at<1500)
          return {...player,item:{kind:taste.kind,remaining:0,started:taste.at},itemUse:"item"};
        if(player.coast.tableGlass||taste&&clock>=taste.at&&clock-taste.at<1500)
          return {...player,item:null,secondItem:null};
      }
      const ticket=diners.get(player.id);
      if(!ticket?.kind||!(ticket.phase==="carrying"||ticket.phase==="served"&&ticket.table.seat===player.seat&&
        ticket.table.side===(player.seatSide??0)*2-1))return player;
      return {...player,diningMeal:{kind:ticket.kind,remaining:ticket.remaining,started:ticket.ateAt}};
    }
    const bus=anchor.bus&&busAt(anchor.bus.index,clock);
    const firstPersonRaft=firstPerson&&bus?.kind==="raft";
    const raft=historicCity&&(isRaftBus(anchor.bus?.index)||watchesRaft(state.photoCamera??anchor))?clientRaftAt(clock):null;
    const pilot=raft?.helm&&roster.find(player=>player.id===raft.helm&&isRaftBus(player.bus?.index));
    const rowing=pilot&&helmStroke(raft,pilot.bus.seat,clock);
    roster.forEach(player=>{
      let model=models.get(player.id);
      const visible=sameStation(interiorAt(player.x,player.y),insideId)&&Math.hypot(player.x-anchor.x,player.y-anchor.y)<135;
      if(!visible){if(model){model.group.visible=false;model.group.removeFromParent();walkerModels.clearChat(model);seaside?.hideBoard(player.id);}drawRipples(player.id,now);
        updateTableTray(player,null,clock);return;}
      if(!model){model=walkerModels.create(player.coat??0xab5947,player.nickname,labelSprite);models.set(player.id,model);}
      else if(!model.group.parent)scene.add(model.group);
      const floor=footing(player.bikeDriverPosition??player);
      const tableSeat=seatAt(player,clock);
      const waterPoint=tableSeat?.waterPoint;
      drawRipples(player.id,now,
        waterPoint?{...waterPoint,level:outsideGroundOffset(waterPoint)+CHEONGGYE_WATER_LEVEL+.016,seat:tableSeat,kick:footKickAge(player,clock)}:null);
      updateTableTray(player,tableSeat,clock);
      walkerModels.update(model,diningPose(player),{now,clock,delta,seat:tableSeat,floor,jump:renderedJumpLift(player,clock,floor),emojiTexture,chatTexture,
        turnEase:player===me?1-Math.exp(-delta*22):1,steeringGrips:player===pilot?rowing?.hands:null});
      seaside?.pose(player,model);
      minigameWorld.pose(player,model,state.photoCapture);
      if(arcadeFloors.has(insideId)){
        let activity=player===me?state.arcade:player.arcade;
        if(state.bowling?.rollPlayer===player.id||state.bowling?.turn===player.id){
          activity={kind:"bowling",bowling:{roll:state.bowling.rollPlayer===player.id?state.bowling.roll:null}};
        }else if(activity?.kind==="bowling"&&state.bowling)activity=null;
        poseArcade(activity,model,clock);
        if(activity?.kind==="mole"&&!model.moleHammer){
          const hand=model.arms[0].end,hammer=model.moleHammer=new T.Group();
          hammer.name="두더지 게임 망치";hammer.rotation.y=Math.PI/2;hammer.position.set(0,-.04,.04);hand.add(hammer);
          cylinder(0xd1a26b,0,.088,0,.026,.265,10,hammer);
          cylinder(0x458384,0,.228,0,.066,.178,12,hammer).rotation.z=Math.PI/2;
          for(const side of [-1,1])cylinder(0xc28e56,side*.087,.228,0,.068,.025,12,hammer).rotation.z=Math.PI/2;
        }
        if(model.moleHammer)model.moleHammer.visible=activity?.kind==="mole";
        if(insideId===ARCADE_UPPER_SITE.id){
          let gear=model.arcadeGear;
          const kind=activity?.kind,using=kind==="baseball"&&Boolean(activity.hand)||Object.hasOwn(TARGET_LANES,kind);
          // The bat sits in the top hand, the one on the side away from the pitcher.
          const handIndex=kind==="baseball"?(activity.hand==="left"?1:0):1;
          if(using&&(gear?.kind!==kind||gear.handIndex!==handIndex)){
            gear?.group.removeFromParent();
            const group=new T.Group(),hand=model.arms[handIndex].end;
            group.position.set(0,-.045,.058);hand.add(group);
            if(kind==="baseball"){
              // Knob, taped handle, taper and barrel along the group's own y; the pose turns the whole bat.
              group.position.set(0,-.06,.03);
              cylinder(0xc99a63,0,-.125,0,.034,.022,10,group);
              cylinder(0x3d4a50,0,.0,0,.021,.24,10,group);
              cylinder(0xd4ac78,0,.24,0,.021,.26,12,group,1.75);
              cylinder(0xd4ac78,0,.52,0,.037,.30,12,group,1.12);
              cylinder(0xddb886,0,.676,0,.041,.016,12,group,.82);
            }else if(kind==="archery"){
              arcadeBowGeometry??=new T.TorusGeometry(.28,.027,7,16,Math.PI*1.14);
              shape(arcadeBowGeometry,0xc38b56,0,.08,.12,group).rotation.z=-Math.PI*.57;
              cylinder(0xc8cec4,0,.10,.09,.006,.56,6,group);
            }else{
              box(0x305265,0,.035,.13,.12,.074,.35,group);
              box(0xdd945d,0,.040,.335,.076,.061,.081,group);
            }
            gear=model.arcadeGear={kind,group,handIndex};
          }
          if(gear)gear.group.visible=using;
        }
      }else if(model.moleHammer)model.moleHammer.visible=false;
      if(insideId!==ARCADE_UPPER_SITE.id&&model.arcadeGear)model.arcadeGear.group.visible=false;
      if(model.label)model.label.visible=!state.photoCapture&&!(firstPersonRaft&&player.bus?.index===bus.index);
      if(state.photoCapture){
        model.emote.visible=false;
        if(model.chatSprite)model.chatSprite.visible=false;
      }
    });
    minigameWorld.live(models,indoors||state.photoCapture?null:state.minigameAimPreview);
    const seat=seatAt(anchor,clock);
    const coastBus=coast&&anchor.coast?.mode==="bus";
    const atCoastHelm=coast&&anchor.coast?.mode==="deck"&&coast.play.boat.helm===anchor.id;
    const surfing=seaside&&anchor.coast?.mode==="surf";
    const anchorModel=models.get(anchor.id);
    const ridingScooterView=firstPerson&&anchor.coast?.mode==="scooter"&&!state.photoCamera;
    const tavernView=firstPerson&&anchor.coast?.mode==="table"&&!state.photoCamera;
    const carryingBoardView=firstPerson&&!state.photoCamera&&Boolean(anchorModel?.surfboardCarrySide);
    const rowingView=firstPersonRaft&&anchor.id===pilot?.id&&!state.photoCamera;
    const bodyView=ridingScooterView||tavernView||carryingBoardView||rowingView;
    const shipOrbit=atCoastHelm&&!firstPerson;
    const outsideRaft=bus?.kind==="raft"&&!firstPerson;
    const outsideBus=(bus||coastBus)&&!outsideRaft&&!firstPerson;
    const floor=seat?0:footing(anchor.bikeDriverPosition??anchor);
    const fallWeight=firstPerson?(bikeFallAt(anchor,clock)?.weight??0):0;
    // In a train seat the lens rides above the headrests, so the rows behind never cover it.
    const coachSeat=insideId==="ktx-coach"&&Boolean(seat)&&!firstPerson;
    const eyeHeight=outsideBus?2.115+(coastBus?1.85:busGround(bus)):seat?(firstPerson?1.30:coachSeat?1.5:1.22)+(seat.base??0):
      (firstPerson?1.28:1.20)+floor+renderedJumpLift(anchor,clock,floor)+(isCycling(anchor)?.12:0)-fallWeight*.87;
    const cameraPoint=(outsideBus||outsideRaft)&&bus?bus:seat??anchor;
    const watchLift=seaside?.watchLift()??0;
    anchorPoint.set(wx(cameraPoint.x),eyeHeight+watchLift,wz(cameraPoint.y));
    if(tavernView||rowingView)anchorModel?.headJoint.localToWorld(anchorPoint.set(0,.266,.22));
    if(carryingBoardView){
      // Lean over the carrying shoulder when looking down so the gripping hand fits even on a phone.
      const glance=Math.max(0,Math.min(1,(view.tilt-22)/38));
      const lean=-anchorModel.surfboardCarrySide*.14*glance;
      anchorPoint.x+=lean*Math.cos(angle)-.04*Math.sin(angle)*glance;
      anchorPoint.z+=lean*Math.sin(angle)+.04*Math.cos(angle)*glance;
    }
    if(ridingScooterView){anchorPoint.x+=.08*Math.sin(angle);anchorPoint.z-=.08*Math.cos(angle);}
    if(surfing)anchorPoint.y-=(firstPerson?.87:.42)*(1-(anchor.coast.surf?.rise??0));
    if(shipOrbit)anchorPoint.set(coast.play.ship.x,5.1+watchLift,coast.play.ship.z);
    const anchorKey=bus?`${anchor.id}-${bus.index}-${firstPerson}`:anchor.bikeRide?.driver??anchor.id;
    const changed=cameraAnchor!==anchorKey||pivot.distanceToSquared(anchorPoint)>144;
    if(changed||outsideRaft||bodyView||anchor.coast?.mode==="deck"||firstPerson&&(bus||isBikePassenger(anchor)))pivot.copy(anchorPoint);
    else pivot.lerp(anchorPoint,1-Math.exp(-delta*20));
    cameraAnchor=anchorKey;
    const streamLevel=cheonggyeLevel(anchor);
    cameraOnBridge=Boolean(anchor.up&&streamLevel===.12);
    lowerStream=streamLevel!=null&&streamLevel<-.34&&!cameraOnBridge;
    const anchorRoof=lowerStream?cheonggyeCameraCeiling(anchor.x,anchor.y):null;
    const approachRoof=lowerStream?cheonggyeCameraCeiling(anchor.x,anchor.y,true):null;
    const anchorGrade=lowerStream?outsideGroundOffset(anchor):0;
    if(anchorRoof!=null&&anchorPoint.y<anchorGrade+anchorRoof-.05){
      pivot.y=Math.min(pivot.y,anchorGrade+anchorRoof-.20);
    }
    const tightStreamView=!firstPerson&&approachRoof!=null&&anchorPoint.y<anchorGrade+approachRoof-.05;
    const zoomFov=atCoastHelm?(firstPerson?78:67)-view.zoom*2:baseFov-view.zoom*(firstPerson?6:1.7);
    if(Math.abs(zoomFov-camera.fov)>.01){
      camera.fov+=(zoomFov-camera.fov)*(1-Math.exp(-delta*12));
      camera.updateProjectionMatrix();
    }
    const viewPitch=firstPerson?Math.max(-87,Math.min(65,view.tilt+(tavernView?15:0))):
      Math.max(-83,Math.min(62,(shipOrbit?24:outsideBus?23:outsideRaft?18:14)+(view.tilt<0?view.tilt*1.22:view.tilt)));
    const bathView=!firstPerson&&seat?.footBath;
    const pitch=tightStreamView?Math.max(20,Math.min(41,viewPitch)):bathView?Math.max(23,viewPitch):viewPitch;
    const orbitPitch=firstPerson?pitch:Math.max(shipOrbit?8:outsideBus?4:coachSeat?9:-10,pitch);
    const elevation=orbitPitch*Math.PI/180;
    const horizontal=Math.cos(elevation);
    arm.set(-Math.sin(angle)*horizontal,Math.sin(elevation),Math.cos(angle)*horizontal);
    if(firstPerson){
      camera.position.copy(pivot);
      if(surfing)camera.position.y=Math.max(camera.position.y,seaside.waterline(camera.position.x,camera.position.z)+.25);
      camera.lookAt(gaze.copy(camera.position).sub(arm));
      camera.rotateZ(fallWeight*.62);
      cameraDistance=0;
    }else{
      const ceiling=insideId==="ktx-coach"?2.4:sameStation(insideId,"station-hall")?(railHeight(anchor.x,anchor.y)??0)+8:arcadeFloors.has(insideId)?3.74:diningById[insideId]?4.5:4.97;
      const distance=Math.min(shipOrbit?42-view.zoom*3:outsideBus?11.8-view.zoom*1.15:outsideRaft?6.8-view.zoom*.6:surfing?5.7-view.zoom*.50:4.55-view.zoom*.42,
        indoors&&arm.y>0?(ceiling-pivot.y)/arm.y:Infinity,tightStreamView?2.36:bathView?3.3:Infinity);
      let available=distance;
      // Shorten the orbit arm at walls and let it ease back out as space opens.
      for(let sample=1,count=Math.ceil(distance/.20);sample<=count;sample++){
        const step=distance*sample/count;
        const point={x:pivot.x+origin.x+arm.x*step,y:pivot.z+origin.y+arm.z*step};
        const terrain=seaside?0:indoors?cultureHeight(point.x,point.y)??railHeight(point.x,point.y)??0:outsideGroundOffset(point)+Math.min(0,approachAt(point.x,point.y)?.height??0);
        const y=pivot.y+arm.y*step;
        const roof=lowerStream?cheonggyeCameraCeiling(point.x,point.y):null;
        const roofCollision=roof!=null&&pivot.y<terrain+roof+.05&&y>terrain+roof-.20;
        const streamWall=lowerStream&&cheonggyeCameraWall(point.x,point.y,y-terrain-.16);
        // Seats do not stop the lens there. Only the car body and the luggage shelves do.
        const coachHit=coachSeat&&(Math.abs(point.x-coach.center.x)>1.72||Math.abs(point.y-coach.center.y)>11.55||
          y>1.9&&Math.abs(point.x-coach.center.x)>1.05);
        if(roofCollision||streamWall||(coachSeat?coachHit:historicCity?historicCity.cameraBlocked(point,y):seaside?seaside.cameraBlocked(point,y):solidAt(point.x,point.y,y-.17-terrain))){
          available=Math.max(.34,step-.24);break;
        }
      }
      if(changed||!cameraDistance||available<cameraDistance)cameraDistance=available;
      else cameraDistance+=(available-cameraDistance)*(1-Math.exp(-delta*8));
      camera.position.copy(pivot).addScaledVector(arm,cameraDistance);
      if(surfing)camera.position.y=Math.max(camera.position.y,seaside.waterline(camera.position.x,camera.position.z)+.30);
      if(pitch===orbitPitch)camera.lookAt(pivot);
      else{
        const direction=pitch*Math.PI/180;
        gaze.set(Math.sin(angle)*Math.cos(direction),-Math.sin(direction),-Math.cos(angle)*Math.cos(direction));
        camera.lookAt(gaze.add(camera.position));
      }
    }
    if(baking){
      const {body}=baking,portrait=camera.aspect<.85,fov=portrait?73:54;
      const distance=Math.max(2.14,1.49/(Math.tan(fov*Math.PI/360)*camera.aspect)+.45);
      const ground=groundHeight(body),side=Math.sin(baking.angle),forward=Math.cos(baking.angle);
      camera.position.set(wx(body.x)+side*distance,ground+2.43,wz(body.y)+forward*distance);
      camera.lookAt(wx(body.x),ground+1.05,wz(body.y));
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      cameraDistance=0;
    }else if(state.arcade?.kind==="mole"){
      const machine=ARCADE_GAMES.mole.machine,{distance,fov,eye}=moleView(camera.aspect);
      camera.position.set(wx(machine.x+distance),eye,wz(machine.y));
      camera.lookAt(wx(machine.x+.05),MOLE_BOARD.top+.14,wz(machine.y));
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      cameraDistance=0;
    }else if(state.arcade?.kind==="pinball"||state.arcade?.kind==="airHockey"){
      const {kind,farSide}=state.arcade,{machine}=ARCADE_GAMES[kind],field=CLASSIC_FIELDS[kind];
      const hockey=kind==="airHockey",side=hockey&&farSide?-1:1;
      // Mirror the lens inside the room for the far seat; fit both ends even in portrait.
      const eye=3.79,offset=hockey?1.68:.95,target=hockey?.34:.28,rise=eye-field.top,run=offset-target;
      const distance=Math.hypot(rise,run),cos=rise/distance,sin=run/distance;
      let slope=0;
      for(const z of [field.z+.17,-field.z-.17]){
        const depth=distance-(z-target)*sin;
        slope=Math.max(slope,Math.abs((z-target)*cos)/depth,(field.x+.18)/(depth*camera.aspect));
      }
      const fov=2*Math.atan(slope*1.115)*180/Math.PI;
      camera.position.set(wx(machine.x+side*offset),eye,wz(machine.y));
      camera.lookAt(wx(machine.x+side*target),field.top,wz(machine.y));
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      cameraDistance=0;
    }else if(isClassic(state.arcade?.kind)){
      const machine=ARCADE_GAMES[state.arcade.kind].machine,portrait=camera.aspect<.88;
      const fov=portrait?75:55,offset=portrait?6.30:4.68;
      camera.position.set(wx(machine.x+offset),3.64,wz(machine.y));
      camera.lookAt(wx(machine.x+.12),1.07,wz(machine.y));
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      cameraDistance=2;
    }else if(Object.hasOwn(TARGET_LANES,state.arcade?.kind)){
      const kind=state.arcade.kind,lane=TARGET_LANES[kind],machine=ARCADE_GAMES[kind].machine;
      const fov=camera.aspect<.8?56:47,pitch=view.tilt*Math.PI/180;
      camera.position.set(wx(machine.x+lane.sourceZ),lane.sourceY,wz(machine.y));
      gaze.set(Math.sin(angle)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(angle)*Math.cos(pitch));
      camera.lookAt(gaze.add(camera.position));
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      cameraDistance=0;
    }else if(state.arcade?.kind==="baseball"){
      const machine=ARCADE_GAMES.baseball.machine;
      const portrait=camera.aspect<.8,fov=portrait?76:59;
      camera.position.set(wx(machine.x+(portrait?6.13:5.87)),BASEBALL_CENTER.y,wz(machine.y));
      camera.lookAt(wx(machine.x+BASEBALL_PLATE_Z),BASEBALL_CENTER.y,wz(machine.y));
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      cameraDistance=2.0;
    }else if(state.arcade?.kind==="bowling"){
      const machine=ARCADE_GAMES.bowling.machine;
      const fov=camera.aspect<.8?69:55,pitch=view.tilt*Math.PI/180;
      camera.position.set(wx(machine.x+6.49),1.87,wz(machine.y)+.62-(state.arcade.canAim?state.arcade.aimOffset*.44:0));
      gaze.set(Math.sin(angle)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(angle)*Math.cos(pitch));
      camera.lookAt(gaze.add(camera.position));
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      cameraDistance=1.55;
    }else if(state.arcade?.kind==="claw"||state.arcade?.kind==="basket"){
      const claw=state.arcade.kind==="claw",machine=ARCADE_GAMES[state.arcade.kind].machine;
      const fov=camera.aspect<.80?(claw?76:71):57;
      if(claw){
        const yaw=(view.pan-270)*Math.PI/180;
        const framing=1.24/(Math.tan(fov*Math.PI/360)*camera.aspect)+.72;
        const distance=Math.max(1.95,Math.min(4.46,Math.max(2.64,framing)-view.zoom*.24));
        const x=Math.min(ARCADE_SITE.bounds.maxX-.22,machine.x+Math.cos(yaw)*distance);
        const y=Math.max(ARCADE_SITE.bounds.minY+.23,Math.min(ARCADE_SITE.bounds.maxY-.23,machine.y+Math.sin(yaw)*distance));
        camera.position.set(wx(x),Math.max(1.57,Math.min(3.52,2.28+view.tilt*.026)),wz(y));
        camera.lookAt(wx(machine.x),1.53,wz(machine.y));
      }else{
        const heading=view.pan*Math.PI/180,tilt=view.tilt*Math.PI/180;
        camera.position.set(wx(machine.x+2.81),1.62,wz(machine.y));
        gaze.set(Math.sin(heading)*Math.cos(tilt),-Math.sin(tilt),-Math.cos(heading)*Math.cos(tilt));
        camera.lookAt(gaze.add(camera.position));
      }
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      cameraDistance=0;
    }else if(state.photoCamera){
      const photo=state.photoCamera,yaw=photo.pan*Math.PI/180,tilt=photo.tilt*Math.PI/180;
      camera.position.set(wx(photo.x),floorHeight(photo)+photo.height,wz(photo.y));
      gaze.set(Math.sin(yaw)*Math.cos(tilt),-Math.sin(tilt),-Math.cos(yaw)*Math.cos(tilt));
      camera.lookAt(gaze.add(camera.position));
      if(camera.fov!==photo.fov){camera.fov=photo.fov;camera.updateProjectionMatrix();}
      cameraDistance=camera.position.distanceTo(anchorPoint);
      guideMarker.visible=false;showMarker.visible=false;
    }
    if(plazaRoot.parent===outdoors){
      updatePlaza(now,night,indoors?null:anchor,fountainShow?.startedAt??0,clock,camera);
    }
    cameraUp.set(0,1,0).applyQuaternion(camera.quaternion);
    for(const model of models.values())if(model.group.visible&&model.chatSprite)walkerModels.placeChat(model,cameraUp);
    bungeoCustomer.placeChat(cameraUp);
    if(anchorModel&&cameraDistance<1.08)anchorModel.group.visible=false;
    if(arcadeFloors.has(insideId)&&cameraDistance<3.2&&anchorModel?.label)anchorModel.label.visible=false;
    const umbrella=firstPerson&&!bodyView&&anchor.sharedUmbrella&&anchorModel?.umbrella;
    if(umbrella?.visible){
      if(!firstPersonUmbrella){firstPersonUmbrella=umbrella.clone();outdoors.add(firstPersonUmbrella);}
      umbrella.getWorldPosition(firstPersonUmbrella.position);
      umbrella.getWorldQuaternion(firstPersonUmbrella.quaternion);
      umbrella.getWorldScale(firstPersonUmbrella.scale);
    }
    if(firstPersonUmbrella)firstPersonUmbrella.visible=Boolean(umbrella?.visible);
    if(anchorModel?.emote.visible||anchorModel?.chatSprite)camera.updateMatrixWorld();
    showLocalSprite(anchorModel,anchorModel?.emote,selfEmote,me.emote?.emoji);
    showLocalSprite(anchorModel,anchorModel?.chatSprite,selfChat,anchorModel?.chatSprite?chatText(me.chat.text):"");
    if(anchorModel){
      anchorModel.headJoint.visible=!bodyView;
      if(bodyView){
        anchorModel.group.visible=true;
        if(anchorModel.label)anchorModel.label.visible=false;
      }
    }
    for(const player of roster){
      if(player.id===anchor.id)continue;
      const group=models.get(player.id)?.group;
      if(group?.visible&&Math.hypot(group.position.x-camera.position.x,group.position.z-camera.position.z)<.70&&
        camera.position.y>=group.position.y-.10&&camera.position.y<group.position.y+1.72)group.visible=false;
    }
    ring.visible=Boolean(state.destination);
    if(state.destination){
      ring.position.set(wx(state.destination.x),floorHeight(state.destination)+.10,wz(state.destination.y));
      ring.scale.setScalar(1+Math.sin(now*.0068)*.12);
    }
    const lit=new Set();
    roster.forEach(player=>{
      const age=(clock-player.wish)/1000,origin=player.wishOrigin;
      const duration=WISH_FLIGHT_MS/1000;
      if(indoors||age<0||age>=duration||!player.wish)return;
      lit.add(player.id);
      let entry=lanterns.get(player.id);
      if(entry?.wish!==player.wish){
        if(entry)removeLantern(player.id,entry);
        const light=lanternModel.clone();
        const phase=[...player.id].reduce((hash,letter)=>Math.imul(hash,31)+letter.charCodeAt(0)|0,0);
        let paper;
        if(player.wishArt?.some(Boolean)){
          const surface=light.getObjectByName("lantern-paper"),map=makeLanternPaper(player.wishArt);
          paper=surface.material.clone();paper.map=paper.emissiveMap=map;
          surface.material=paper;
        }
        const angle=(player.wishHeading??0)*Math.PI/180;
        const direction={x:Math.sin(angle),z:-Math.cos(angle),reach:0};
        if(origin){
          const height=floorHeight(origin)+1.87;
          for(let step=.25;step<=2.5;step+=.25){
            if(solidAt(origin.x+direction.x*step,origin.y+direction.z*step,height))break;
            direction.reach=step;
          }
        }
        entry={light,paper,phase,direction,yaw:-angle,wish:player.wish};
        scene.add(light);lanterns.set(player.id,entry);
      }
      const {light,phase,direction}=entry;
      const lane=((phase>>>0)%9-4)*.24,wave=age*1.7+phase%53;
      const rise=age*.48-.42*(1-Math.exp(-age*.87));
      const drift=Math.min(1,age*.8),fallback=fountains[0],forward=direction.reach*(1-Math.exp(-age*1.6));
      light.position.set((origin?wx(origin.x):fallback.x)+direction.x*forward+drift*(lane+Math.sin(wave*.44)*(.13+age*.065)),
        (origin?floorHeight(origin):0)+1.96+rise+Math.sin(wave)*.07,
        (origin?wz(origin.y):fallback.z+2.85)+direction.z*forward+drift*(lane*.47+age*.11));
      light.rotation.set(Math.cos(wave)*.073,entry.yaw+age*.54+lane*Math.min(1,age*.23),Math.sin(wave)*.095);
      light.scale.setScalar(Math.min(1,.26+age*1.3,(duration-age)/2.4));
    });
    for(const [id,entry] of lanterns)if(!lit.has(id))removeLantern(id,entry);
    const wet=Math.max(atmosphere.rain,atmosphere.snow)>.018;
    const photoGround=wet&&state.photoCamera?floorHeight(state.photoCamera):null;
    const walkerFloor=wet?floorHeight(anchor):0;
    const shelter=anchor.umbrellaShelter;
    drawPrecipitation({x:camera.position.x,z:camera.position.z,floor:photoGround??walkerFloor,
      walkerX:wx(shelter?.x??anchor.x),walkerZ:wz(shelter?.y??anchor.y),walkerFloor,clock,atmosphere,
      sheltered:Boolean(shelter||anchor.umbrella),sharedShelter:Boolean(shelter),inside:indoors||Boolean(bus&&firstPerson&&!firstPersonRaft),
      sparse:quality.sparse,pixelRatio:quality.pinned?quality.max:quality.ratio,night});
    seaside?.update(state,night,camera,renderer.domElement.height,quality.sparse||quality.ratio<.9);
    historicCity?.update(state,night,camera,raft,rowing);
    renderer.render(scene,camera);
    if(firstPerson&&!state.bungeoMode&&!bodyView){
      firstPersonView??=makeFirstPersonView(T,createItemProp);
      const mole=state.arcade?.kind==="mole"?state.arcade:null;
      const hole=mole&&MOLE_HOLES[mole.swingHole],table=ARCADE_GAMES.mole.machine;
      const swing=mole&&{swingAt:mole.swingAt,point:hole?new T.Vector3(wx(table.x+hole.z),MOLE_BOARD.top+.12,wz(table.y-hole.x)):null};
      firstPersonView.render(renderer,camera,diningPose(me),{now,clock,delta,seat,clink:me.clink,night,mole:swing,stroke:models.get(me.id)?.swimStroke});
    }
    return true;
  }
  const ray=new T.Raycaster(),sample=new T.Vector3();
  function pointRay(clientX,clientY){
    const rect=renderer.domElement.getBoundingClientRect();
    if(cameraAnchor==null||!rect.width||!rect.height||
       clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom)return false;
    ray.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),camera);
    return true;
  }
  function pickBungeo(clientX,clientY,stallId=BUNGEO_STALL.id){
    return pointRay(clientX,clientY)?cookingScenes.get(stallId)?.pick(ray)??null:null;
  }
  function pickMole(clientX,clientY){
    return pointRay(clientX,clientY)?indoorsById[ARCADE_SITE.id].view?.pickMole(ray)??null:null;
  }
  function pickBaseballAim(clientX,clientY){
    if(!pointRay(clientX,clientY)||Math.abs(ray.ray.direction.x)<1e-5)return null;
    const machine=ARCADE_GAMES.baseball.machine;
    const distance=(wx(machine.x+BASEBALL_PLATE_Z)-ray.ray.origin.x)/ray.ray.direction.x;
    if(distance<0)return null;
    ray.ray.at(distance,sample);
    return {x:wz(machine.y)-sample.z,y:sample.y};
  }
  function pickClassicTap(clientX,clientY,kind){
    if(!isClassic(kind)||!pointRay(clientX,clientY)||Math.abs(ray.ray.direction.y)<1e-5)return null;
    const field=CLASSIC_FIELDS[kind],machine=ARCADE_GAMES[kind].machine;
    const distance=(field.top-ray.ray.origin.y)/ray.ray.direction.y;
    if(distance<0)return null;
    ray.ray.at(distance,sample);
    const x=wz(machine.y)-sample.z,z=sample.x-wx(machine.x);
    return Math.abs(x)<=field.x+.19&&Math.abs(z)<=field.z+.24?{x,z}:null;
  }
  function pick(clientX,clientY,boardingTrack){
    if(!pointRay(clientX,clientY))return null;
    if(boardingTrack&&visibleInterior===railComplex){
      const track=interactionMarkers?.pickBoardingMarker(ray)??railComplex.view?.pickBoardingDoor(ray.ray,boardingTrack);
      if(track)return {ktxTrack:track};
    }
    if(guideMarker.visible&&ray.intersectObject(guideMarker,false).length)return {...ticketGuide.approach,guide:true};
    if(showMarker.visible&&ray.intersectObject(showMarker,false).length)return {x:plazaShowSpot.x,y:plazaShowSpot.y};
    const trackHit=seaside?.pickTrack(ray.ray);
    for(let step=.25;step<=105;step+=.25){
      if(trackHit&&step>=trackHit.distance)return trackHit.point;
      ray.ray.at(step,sample);
      const point={x:sample.x+origin.x,y:sample.z+origin.y,up:cameraOnBridge};
      const deck=approachAt(point.x,point.y);
      if(deck?.s.kind==="deck")point.up=ray.ray.direction.y<0&&ray.ray.origin.y>=outsideGroundOffset(point)+deck.height;
      // Below street level the retaining-wall gap and the channel have no street floor.
      const openWater=lowerStream&&inCheonggye(point.x,point.y)&&cheonggyeOpenAir(point.x,point.y)&&cheonggyeLevel(point)==null;
      const height=openWater?outsideGroundOffset(point)+CHEONGGYE_WATER_LEVEL:floorHeight(point);
      if(partAt(point.x,point.y)==null&&visibleInterior===railComplex)continue;
      if(sample.y<=height)return deck?point:{x:point.x,y:point.y};
    }
    return null;
  }
  function clearChat(){
    for(const model of models.values())walkerModels.clearChat(model);
    selfChat.hidden=true;selfChat.textContent="";
  }
  function capturePhoto(state){
    render({...state,firstPerson:false,photoCapture:true},performance.now());
    return renderer.domElement.toDataURL("image/jpeg",.92);
  }
  const renderStats=()=>({...renderer.info.render,quality:quality.mode,pixelRatio:quality.ratio,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
    areas:{...Object.fromEntries(stationDistricts.map((d,i)=>["station-"+i,Boolean(d.chunks)])),west:Boolean(west.chunks),plaza:Boolean(plaza.chunks),palace:Boolean(palace.chunks),cheonggye:Boolean(cheonggye.chunks),songhyeon:Boolean(songhyeon.chunks),
      ...Object.fromEntries(Object.entries(indoorsById).map(([id,district])=>[id,Boolean(district.chunks)]))}});
  return {render,setQuality,attachViewport,setVisitorRoom:cityVisitors.setRoom,pick,pickBungeo,pickMole,pickBaseballAim,pickClassicTap,previewWalker,clearChat,floorHeight,groundHeight,renderStats,capturePhoto,
    benches,stations,parkLife,birds,palacePeople,museum,underDoldamAwning};
}

// The world is assembled from tens of thousands of small boxes and cylinders. Drawing each
// one separately costs far more than its triangles, so static pieces are combined per map
// cell: repeated shapes become instanced batches and everything else is merged into one
// vertex-coloured mesh. Cells outside the view are culled as a whole.
function* consolidate(scene,fallbackGroups,registerSeason,cell=48){
  scene.updateMatrixWorld(true);
  const plainMaterials=new Map(),instanceGroups=new Map(),mergeGroups=new Map(),made=[];
  const local=new T.Matrix4(),inverse=new T.Matrix4(),normalMatrix=new T.Matrix3(),centre=new T.Vector3(),vertex=new T.Vector3();
  const bounds=new T.Box3(),inverses=new Map(),looks=new Map();
  function plainKey(material){
    return [material.flatShading,material.side,material.roughness,material.metalness,material.opacity,
      material.depthTest,material.depthWrite,material.depthFunc,material.colorWrite,material.fog,material.toneMapped,
      material.polygonOffset,material.polygonOffsetFactor,material.polygonOffsetUnits,material.dithering,
      material.shadowSide,material.userData.seasonFoliage].join("/");
  }
  function plainMaterial(key,source,vertexColors){
    const id=key+(vertexColors?"/v":"/i");
    if(!plainMaterials.has(id)){
      const material=source.clone();material.color.setHex(0xffffff);material.vertexColors=vertexColors;
      if(source.userData.seasonFoliage)registerSeason?.(material,source.userData.seasonFoliage);
      plainMaterials.set(id,material);
    }
    return plainMaterials.get(id);
  }
  const candidates=[];
  const visit=mesh=>{
    if(!mesh.isMesh||mesh.isSkinnedMesh||mesh.userData.dynamic||!mesh.visible)return;
    if(mesh.isInstancedMesh){
      if(mesh.userData.streamStatic){
        if(!mesh.boundingSphere)mesh.computeBoundingSphere();
        made.push([mesh,mesh.boundingSphere,false,mesh.userData.streamDetail]);
      }
      return;
    }
    const material=mesh.material;
    if(Array.isArray(material)||!material.isMeshStandardMaterial||material.isMeshPhysicalMaterial||material.transparent||material.alphaTest>0||
       material.clippingPlanes||mesh.customDepthMaterial||mesh.customDistanceMaterial||
       Object.keys(mesh.geometry.attributes).some(name=>!["position","normal","uv","color"].includes(name)))return;
    if(!mesh.geometry.attributes.position||!mesh.geometry.attributes.normal)return;
    candidates.push(mesh);
  };
  const pending=[scene];let visited=0;
  while(pending.length){
    const object=pending.pop();
    visit(object);
    for(let i=object.children.length-1;i>=0;i--)pending.push(object.children[i]);
    if(++visited%512===0)yield;
  }
  for(const [index,mesh] of candidates.entries()){
    if(index&&index%512===0)yield;
    const material=mesh.material,geometry=mesh.geometry;
    let owner=scene;
    for(let parent=mesh.parent;parent;parent=parent.parent)if(fallbackGroups.has(parent)){owner=parent;break;}
    if(!geometry.boundingBox)geometry.computeBoundingBox();
    bounds.copy(geometry.boundingBox).applyMatrix4(mesh.matrixWorld).getCenter(centre);
    const place=owner===scene?Math.floor(centre.x/cell)+"/"+Math.floor(centre.z/cell):"local";
    if(!looks.has(material)){
      const plain=!material.vertexColors&&!material.stencilWrite&&material.blending===T.NormalBlending&&
        material.emissive.getHex()===0&&!Object.values(material).some(value=>value?.isTexture);
      if(!plain&&material.userData.seasonFoliage)registerSeason?.(material,material.userData.seasonFoliage);
      looks.set(material,{plain,look:plain?plainKey(material):"m"+material.id});
    }
    const {plain,look}=looks.get(material);
    const ground=mesh.userData.terrainSurface||mesh.userData.flatBackground||
      (bounds.max.y<=.2&&bounds.max.y-bounds.min.y<.26);
    const detail=Boolean(mesh.userData.streamDetail);
    const castShadow=!ground&&!detail;
    const entry={mesh,owner,plain,look,castShadow,detail};
    const instanceKey=[owner.id,place,look,castShadow,detail,mesh.renderOrder,geometry.id].join("|");
    if(!instanceGroups.has(instanceKey))instanceGroups.set(instanceKey,[]);
    instanceGroups.get(instanceKey).push(entry);
  }
  const ownerInverse=owner=>{
    if(!inverses.has(owner))inverses.set(owner,new T.Matrix4().copy(owner.matrixWorld).invert());
    return inverses.get(owner);
  };
  for(const [key,entries] of instanceGroups){
    const {mesh:first,owner,plain,look,castShadow,detail}=entries[0];
    if(entries.length>=14){
      const material=plain?plainMaterial(look,first.material,false):first.material;
      const batch=new T.InstancedMesh(first.geometry,material,entries.length);
      inverse.copy(ownerInverse(owner));
      entries.forEach(({mesh},i)=>{
        batch.setMatrixAt(i,local.multiplyMatrices(inverse,mesh.matrixWorld));
        if(plain)batch.setColorAt(i,mesh.material.color);
        mesh.removeFromParent();
      });
      batch.castShadow=castShadow;batch.receiveShadow=true;batch.renderOrder=first.renderOrder;
      batch.computeBoundingSphere();owner.add(batch);
      made.push([batch,batch.boundingSphere,false,detail]);
      yield;
      continue;
    }
    const mergeKey=key.slice(0,key.lastIndexOf("|"));
    if(!mergeGroups.has(mergeKey))mergeGroups.set(mergeKey,[]);
    mergeGroups.get(mergeKey).push(...entries);
  }
  for(const entries of mergeGroups.values()){
    yield;
    const {mesh:first,owner,plain,look,castShadow,detail}=entries[0];
    const withUv=!plain&&entries.every(({mesh})=>mesh.geometry.attributes.uv);
    const withColor=plain||first.material.vertexColors;
    let vertices=0,corners=0;
    for(const {mesh} of entries){
      vertices+=mesh.geometry.attributes.position.count;
      corners+=mesh.geometry.index?mesh.geometry.index.count:mesh.geometry.attributes.position.count;
    }
    const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3);
    const uvs=withUv?new Float32Array(vertices*2):null,colors=withColor?new Float32Array(vertices*3):null;
    const indices=vertices>65535?new Uint32Array(corners):new Uint16Array(corners);
    inverse.copy(ownerInverse(owner));
    let v=0,c=0;
    for(const {mesh} of entries){
      const {position,normal,uv,color}=mesh.geometry.attributes,index=mesh.geometry.index;
      local.multiplyMatrices(inverse,mesh.matrixWorld);
      normalMatrix.getNormalMatrix(local);
      const flipped=local.determinant()<0,tint=mesh.material.color,count=position.count;
      for(let i=0;i<count;i++){
        vertex.fromBufferAttribute(position,i).applyMatrix4(local);
        positions[(v+i)*3]=vertex.x;positions[(v+i)*3+1]=vertex.y;positions[(v+i)*3+2]=vertex.z;
        vertex.fromBufferAttribute(normal,i).applyMatrix3(normalMatrix).normalize();
        normals[(v+i)*3]=vertex.x;normals[(v+i)*3+1]=vertex.y;normals[(v+i)*3+2]=vertex.z;
        if(uvs){uvs[(v+i)*2]=uv.getX(i);uvs[(v+i)*2+1]=uv.getY(i);}
        if(colors){
          const shade=!plain&&color;
          colors[(v+i)*3]=plain?tint.r:shade?color.getX(i):1;
          colors[(v+i)*3+1]=plain?tint.g:shade?color.getY(i):1;
          colors[(v+i)*3+2]=plain?tint.b:shade?color.getZ(i):1;
        }
      }
      const total=index?index.count:count;
      for(let i=0;i<total;i+=3){
        const a=v+(index?index.getX(i):i),b=v+(index?index.getX(i+1):i+1),d=v+(index?index.getX(i+2):i+2);
        indices[c++]=a;indices[c++]=flipped?d:b;indices[c++]=flipped?b:d;
      }
      v+=count;
      mesh.removeFromParent();
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.BufferAttribute(positions,3));
    geometry.setAttribute("normal",new T.BufferAttribute(normals,3));
    if(uvs)geometry.setAttribute("uv",new T.BufferAttribute(uvs,2));
    if(colors)geometry.setAttribute("color",new T.BufferAttribute(colors,3));
    geometry.setIndex(new T.BufferAttribute(indices,1));
    geometry.computeBoundingSphere();
    const merged=new T.Mesh(geometry,plain?plainMaterial(look,first.material,true):first.material);
    merged.castShadow=castShadow;merged.receiveShadow=true;merged.renderOrder=first.renderOrder;
    owner.add(merged);
    made.push([merged,geometry.boundingSphere,true,detail]);
  }
  for(const [object] of made){object.updateMatrix();object.matrixAutoUpdate=false;}
  scene.updateMatrixWorld(true);
  // World-space bounds of every combined piece, used to skip far-away map cells.
  return made.map(([object,sphere,ownsGeometry,detail])=>{
    const centre=sphere.center.clone().applyMatrix4(object.matrixWorld);
    return {object,parent:object.parent,x:centre.x,z:centre.z,radius:sphere.radius*object.matrixWorld.getMaxScaleOnAxis(),
      ownsGeometry,detail,releaseAt:0};
  });
}

function makeGuideMarker(music){
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=112;
  const ctx=canvas.getContext("2d");
  ctx.beginPath();ctx.arc(56,56,49,0,Math.PI*2);
  ctx.fillStyle=music?"#244a5b":"#453716";ctx.fill();
  ctx.beginPath();ctx.arc(56,56,43,0,Math.PI*2);
  ctx.fillStyle=music?"#ade4f2":"#f1c650";ctx.fill();
  ctx.strokeStyle=music?"#d9f5fa":"#ffea9a";ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle=music?"#203c53":"#342918";
  if(music){
    ctx.font="bold 62px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(music,56,57);
  }else{
    ctx.beginPath();ctx.roundRect(50,29,12,36,6);ctx.fill();
    ctx.beginPath();ctx.arc(56,78,6,0,Math.PI*2);ctx.fill();
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  return new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));
}

function makeWishLantern({box,cylinder,matte}){
  const lantern=new T.Group();
  const ribs=[[-.37,.27],[-.30,.35],[-.13,.43],[.13,.43],[.30,.35],[.37,.27]];
  const corners=[[-.574,.819],[.574,.819],[.819,.574],[.819,-.574],
    [.574,-.819],[-.574,-.819],[-.819,-.574],[-.819,.574]];
  const sides=corners.length,vertices=[],uv=[],indices=[];
  for(let side=0;side<sides;side++){
    const offset=vertices.length/3;
    for(const [row,[y,radius]] of ribs.entries()){
      for(let edge=0;edge<=1;edge++){
        const [x,z]=corners[(side+edge)%sides];
        vertices.push(x*radius,y,z*radius);
        uv.push((Math.floor(side/2)+(side%2?.985:.015+edge*.97))/4,(y-ribs[0][0])/.74);
      }
      if(row){
        const i=offset+2*row;
        indices.push(i-2,i-1,i,i-1,i+1,i);
      }
    }
  }
  const shade=new T.BufferGeometry();
  shade.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
  shade.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
  shade.setIndex(indices);shade.computeVertexNormals();

  const paperMap=makeLanternPaper();
  const surface=new T.Mesh(shade,new T.MeshStandardMaterial({
    map:paperMap,emissiveMap:paperMap,emissive:0xffdf9f,emissiveIntensity:.94,roughness:.96
  }));
  surface.name="lantern-paper";
  lantern.add(surface);

  for(const y of [-.38,.38]){
    cylinder(0x713d2b,0,y,0,.275,.055,sides,lantern);
    cylinder(0xc38043,0,y+Math.sign(y)*.034,0,.233,.023,sides,lantern);
  }
  const timber=matte(0x8d462b);
  for(let side=0;side<sides;side++){
    const [x,z]=corners[side];
    const curve=new T.CatmullRomCurve3(ribs.map(([y,r])=>
      new T.Vector3(x*(r+.008),y,z*(r+.008))));
    lantern.add(new T.Mesh(new T.TubeGeometry(curve,8,.009,4,false),timber));
  }
  const loop=new T.Mesh(new T.TorusGeometry(.079,.009,5,15,Math.PI),timber);
  loop.position.y=.416;lantern.add(loop);
  cylinder(0x8c402d,0,-.46,0,.015,.14,6,lantern);
  cylinder(0xc28c47,0,-.53,0,.046,.048,8,lantern);
  cylinder(0xae3e38,0,-.61,0,.044,.15,9,lantern,.53);
  for(let side=0;side<8;side++){
    const a=side*Math.PI/4;
    box(0xd8644a,Math.cos(a)*.03,-.63,Math.sin(a)*.03,.008,.12,.008,lantern);
  }

  const halo=document.createElement("canvas");halo.width=halo.height=64;
  const haloCtx=halo.getContext("2d"),gradient=haloCtx.createRadialGradient(32,32,3,32,32,32);
  gradient.addColorStop(0,"#ffd0887a");gradient.addColorStop(.48,"#ffae482b");gradient.addColorStop(1,"#ffae4800");
  haloCtx.fillStyle=gradient;haloCtx.fillRect(0,0,64,64);
  const haloMap=new T.CanvasTexture(halo);haloMap.colorSpace=T.SRGBColorSpace;
  const light=new T.Sprite(new T.SpriteMaterial({map:haloMap,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  light.scale.set(1.72,1.72,1);lantern.add(light);
  return lantern;
}

function makeLanternPaper(faces){
  const paper=document.createElement("canvas");
  paper.width=512;paper.height=256;
  const ctx=paper.getContext("2d"),ink=document.createElement("canvas");
  ink.width=WISH_WIDTH;ink.height=WISH_HEIGHT;
  const brush=ink.getContext("2d");
  for(let side=0;side<4;side++){
    ctx.save();ctx.translate(side*128,0);
    const glow=ctx.createRadialGradient(64,125,6,64,124,132);
    glow.addColorStop(0,"#ffe3a2");glow.addColorStop(.52,"#fbc47d");glow.addColorStop(1,"#d57840");
    ctx.fillStyle=glow;ctx.fillRect(0,0,128,256);
    for(let i=0;i<160;i++){
      ctx.fillStyle=i%3?"#a05b311b":"#fff2be47";
      ctx.fillRect(i*47%128,i*83%256,1+(i%4),1);
    }
    ctx.strokeStyle="#a0422d";ctx.lineWidth=2;
    ctx.strokeRect(8,12,112,232);ctx.strokeRect(13,17,102,222);
    const pixels=decodeWishFace(faces?.[side]);
    if(pixels){
      brush.clearRect(0,0,WISH_WIDTH,WISH_HEIGHT);
      for(let i=0;i<pixels.length;i++){
        if(!pixels[i])continue;
        brush.fillStyle=WISH_COLORS[pixels[i]];
        brush.fillRect(i%WISH_WIDTH,Math.floor(i/WISH_WIDTH),1,1);
      }
      ctx.drawImage(ink,16,24,96,208);
    }else if(!faces){
      ctx.fillStyle="#9e412f";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.font='bold 42px "Malgun Gothic", sans-serif';
      ctx.fillText("소",64,95);ctx.fillText("원",64,139);
      for(let i=-2;i<=2;i++){
        ctx.save();ctx.translate(64,206);ctx.rotate(i*.48);
        ctx.beginPath();ctx.ellipse(0,-12,4.3,13,0,0,Math.PI*2);ctx.fill();ctx.restore();
      }
    }
    ctx.restore();
  }
  const map=new T.CanvasTexture(paper);map.colorSpace=T.SRGBColorSpace;
  return map;
}

function addNightSky(T,scene,rand){
  const vertices=[],color=[];
  for(let i=0;i<980;i++){
    const az=rand()*Math.PI*2,y=.056+rand()*.94,r=Math.sqrt(1-y*y)*530;
    vertices.push(Math.cos(az)*r,y*530,Math.sin(az)*r);
    const v=.26+rand()*.74;color.push(v*.84,v*.91,v);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
  geometry.setAttribute("color",new T.Float32BufferAttribute(color,3));
  const stars=new T.Points(geometry,new T.PointsMaterial({size:1.18,vertexColors:true,opacity:0,transparent:true,depthWrite:false,fog:false}));
  scene.add(stars);
  const canvas=document.createElement("canvas");canvas.width=canvas.height=192;
  const ctx=canvas.getContext("2d"),halo=ctx.createRadialGradient(96,96,40,96,96,94);
  halo.addColorStop(0,"rgba(184,202,245,.27)");halo.addColorStop(1,"rgba(158,181,241,0)");
  ctx.fillStyle=halo;ctx.fillRect(0,0,192,192);
  ctx.save();ctx.beginPath();ctx.arc(96,96,49,0,Math.PI*2);ctx.clip();
  const disk=ctx.createLinearGradient(44,55,149,138);
  disk.addColorStop(0,"#aebcdb");disk.addColorStop(.56,"#f8edce");disk.addColorStop(1,"#f4eee2");
  ctx.fillStyle=disk;ctx.fillRect(43,43,106,106);
  for(let i=0;i<39;i++){
    const x=53+rand()*88,y=51+rand()*87,r=1+rand()*10;
    ctx.fillStyle=i%2===0?"rgba(91,110,146,.12)":"rgba(249,237,211,.21)";
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const moon=new T.Sprite(new T.SpriteMaterial({map,opacity:0,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
  moon.position.set(-427,135,154);moon.scale.set(34,34,1);scene.add(moon);
  return night=>{
    stars.visible=moon.visible=night>.022;
    stars.material.opacity=night*.93;
    moon.material.opacity=night;
  };
}
