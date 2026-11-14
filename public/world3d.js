import * as T from "three";
import { buildJeongdong, hallRooms } from "./streets.js";
import { addWater } from "./water.js";
import { solidAt, platformAt, waterDepth, loftHeight, bridge, gate, middle, hall, stoneHall, courtAngle, ticketGuide } from "./layout.js";
import { addParkLife } from "./park-life.js";
import { addPalaceBirds } from "./palace-birds.js";
import { addPalaceSky } from "./palace-sky.js";
import { resolveSeoulEnvironment } from "./seoul-environment.js";
import { addSeoulPrecipitation, makeSeasonFoliage } from "./seoul-weather-scene.js";
import { addStands, addRegionalStands, makeItemProps, regionalStations, registerRegionalStands, underDoldamAwning } from "./street-stands.js";
import { registerHanbokRental } from "./passport-data.js";
import { addHanbokRental } from "./wearables-models.js";
import { assembleMuseum, registerMuseumNavigation, isInsideMuseum, museumOutsideDoor, museumInsideDoor, museumInsideSpawn, stairHeight } from "./museum.js";
import { PET_MS, FEED_MS, jumpLift, renderedJumpLift } from "./activities.js";
import { bikeFallAt } from "./avatar-gestures.js";
import { makeWalkerModels } from "./walker-model.js";
import { addMinigameMarkers, registerMinigameProps } from "./minigame-markers.js";
import { makeMinigameWorld } from "./minigame-world.js";
import { makeFirstPersonView } from "./first-person.js";
import { plazaShowSpot } from "./plaza-show.js";
import { gbSurveyModels, gbNightGlow } from "./gyeongbok.js";
import { gbSite, gwanghwamun, gbBounds, inGyeongbok, gbLightSpots } from "./gyeongbok-layout.js";
import { outsideGroundOffset,palaceGroundOffset,samcheongLevel,southWorldTerrainHeight } from "./gyeongbok-terrain.js";
import { gradeAvenueMeshes } from "./avenue-terrain.js";
import { gradeJeongdongMeshes } from "./jeongdong-terrain-render.js";
import { prepareSurveyTerrain } from "./survey-terrain.js";
import { assembleGwanghwamunPlaza, registerPlazaNavigation } from "./gwanghwamun-plaza.js";
import { inGwanghwamunPlaza, plazaBounds, plazaGroundHeight, plazaSites } from "./plaza-layout.js";
import { buildSejongCorridor } from "./sejong-corridor.js";
import { corridorBounds, corridorWalkable } from "./sejong-corridor-layout.js";
import { buildBikeDocks, makeRidingBike, registerBikeDocks } from "./sejong-bike-model.js";
import { bikeDocks, isBikePassenger, isCycling } from "./sejong-bike.js";
import { buildSejongBusModels } from "./sejong-bus-model.js";
import { BUS_FLOOR, busAt, busSeatPose } from "./sejong-bus.js";
import { addPalacePeople } from "./palace-people.js";
import { addStreetPeople } from "./street-people.js";
import { addBukchonPeople } from "./bukchon-people.js";
import { makePicnicWorld } from "./picnic-world.js";
import { buildSubwayAccess,registerExpandedSubway } from "./subway-expansion.js";
import { jeongdongExtensionBounds,registerJeongdongExtension } from "./jeongdong-extension-layout.js";
import { buildJeongdongExtension } from "./jeongdong-extension.js";
import { bukchonBounds,bukchonWalkable,bukchonGroundHeight,registerBukchonTrees } from "./bukchon-layout.js";
import { hwangudanBounds,hwangudanWalkable,hwangudanFloorHeight,registerHwangudanNavigation } from "./seoul-hwangudan-layout.js";
import { decodeWishFace, WISH_WIDTH, WISH_HEIGHT, WISH_COLORS, WISH_FLIGHT_MS } from "./wish-art.js";

export function makeWorld(container,{onCatFlee,catSeed}={}) {
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(57,1,.15,1290);
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.07;
  const handheld=matchMedia("(pointer:coarse)").matches;
  // Frame-rate governor: the render scale and shadows step down on a slow device and recover later.
  const quality={max:Math.min(devicePixelRatio,handheld?1.6:2),min:handheld?.6:.75,ratio:0,shadows:true,
    pinned:new URLSearchParams(location.search).get("quality")==="max",frame:16.7,checkAt:0,calm:0};
  quality.ratio=Math.min(quality.max,handheld?1.25:1.5);
  renderer.setPixelRatio(quality.pinned?quality.max:quality.ratio);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=quality.pinned;
  const selfEmote=document.createElement("span");
  selfEmote.className="self-emote";selfEmote.hidden=true;selfEmote.setAttribute("aria-hidden","true");
  const selfChat=document.createElement("span");
  selfChat.className="self-chat";selfChat.hidden=true;selfChat.setAttribute("aria-hidden","true");
  container.append(renderer.domElement,selfEmote,selfChat);
  let baseFov=57;
  const resize=()=>{
    if(!container.clientWidth||!container.clientHeight)return;
    camera.aspect=container.clientWidth/container.clientHeight;
    baseFov=camera.aspect<.78?68:57;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth,container.clientHeight);
  };
  new ResizeObserver(resize).observe(container);
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
  const drawPalaceSky=addPalaceSky(T,heavens,{sunDirection:sunDirection.clone().multiplyScalar(142)});
  const drawPrecipitation=addSeoulPrecipitation(T,outdoors),foliage=makeSeasonFoliage(T);
  const wx=x=>x-300,wz=y=>y-225;
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
  const {benches,trees,catWalls,fountains,lampMaterial,classical,middleModel,hallModel,drawPond,pavilionModels,buildGyeongbokDistrict}=
    buildJeongdong(T,deoksRoot,makeKit(deoksRoot),{deferGyeongbok:true});
  buildSejongCorridor(T,corridorRoot,makeKit(corridorRoot));
  registerJeongdongExtension();
  registerHwangudanNavigation();
  buildJeongdongExtension(T,deoksRoot,makeKit(deoksRoot));
  const corridorGround=corridorRoot.children.slice();
  const deoksExtras=new T.Group();
  registerBikeDocks();
  const addDocks=(root,where,height)=>buildBikeDocks(T,root,makeKit(root),{docks:bikeDocks.filter(where),register:false,height});
  addDocks(deoksExtras,dock=>dock.y>=28,southWorldTerrainHeight);
  addDocks(corridorRoot,dock=>dock.y<28&&dock.y>-280,southWorldTerrainHeight);
  const busGround=point=>point.y<gwanghwamun.y&&point.x>=680?
    bukchonGroundHeight(point)??samcheongLevel(point.y):southWorldTerrainHeight(point);
  const buses=buildSejongBusModels(T,transportRoot,kit,busGround);
  registerPlazaNavigation(benches);
  const drawWater=addWater(T,deoksExtras,fountains,{...makeKit(deoksExtras),terrain:southWorldTerrainHeight});
  registerRegionalStands();
  registerBukchonTrees();
  registerExpandedSubway();
  registerHanbokRental();
  const minigameProps=registerMinigameProps(floorHeight);
  const minigameWorld=makeMinigameWorld(T,outdoors,kit,floorHeight);
  const transportCount=transportRoot.children.length;
  const stations=[...addStands(T,transportRoot,makeKit(transportRoot)),...regionalStations];
  const transportGround=transportRoot.children.slice(transportCount);
  outdoors.add(transportRoot);
  const createItemProp=makeItemProps(T,kit);
  const picnicWorld=makePicnicWorld(T,outdoors,kit,floorHeight,createItemProp);
  const walkerModels=makeWalkerModels(T,scene,kit,createItemProp);
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
  const palacePeople=addPalacePeople(T,scene,kit,walkerModels,{floorHeight:point=>floorHeight(point),labelSprite:(...args)=>labelSprite(...args),handheld});
  const streetPeople=addStreetPeople(T,scene,kit,walkerModels,{floorHeight,labelSprite,handheld});
  const bukchonPeople=addBukchonPeople(walkerModels,{floorHeight,handheld});
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

  const surveyedPavilions=[["jeonggwanheon","정관헌"],["hamnyeongjeon","함녕전"],["seogeodang","석어당"]].map(([model,label])=>{
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
  const museum={outsideDoor:museumOutsideDoor,insideDoor:museumInsideDoor,insideSpawn:museumInsideSpawn,
    isInside:isInsideMuseum,floorAt:stairHeight,exhibits:[]};
  const birds=addPalaceBirds(T,outdoors,{...kit,floorHeight},{trees,walls:catWalls,seed:catSeed,deferNorth:true,deferPopulation:true});
  const parkLife=addParkLife(T,outdoors,{...kit,trees,floorHeight,terrainHeight:outsideGroundOffset,catWalls,benches,onCatFlee,catSeed,birds,
    deferNorth:true,deferPopulation:true});
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
  async function loadLandmark({name,point,groups,angle,root,onLoaded}){
    try{
      landmarkLoaders??=Promise.all([
        import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js"),
        import("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/meshopt_decoder.module.js")
      ]);
      const [{GLTFLoader},{MeshoptDecoder}]=await landmarkLoaders;
      const asset=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL(`./${name}.glb`,import.meta.url).href);
      const replaced=prepareSurveyTerrain(T,asset.scene,name,groups);
      asset.scene.position.set(wx(point.x),outsideGroundOffset(point),wz(point.y));
      asset.scene.rotation.y=angle;
      const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      asset.scene.traverse(mesh=>{
        if(!mesh.isMesh)return;
        if(!mesh.geometry.attributes.normal){
          const smoothed=smoothSurveyNormals(mesh.geometry);
          if(smoothed!==mesh.geometry){mesh.geometry.dispose();mesh.geometry=smoothed;}
        }
        const material=mesh.material;
        material.flatShading=false;material.metalness=0;material.roughness=.92;
        if(surveyDoors[name]){
          material.clippingPlanes=doorPlanes(surveyDoors[name],point,angle);
          material.clipIntersection=true;material.clipShadows=true;
          renderer.localClippingEnabled=true;
        }
        if(material.map){material.map.anisotropy=anisotropy;material.map.needsUpdate=true;}
        material.needsUpdate=true;
        mesh.castShadow=mesh.receiveShadow=true;
      });
      root.add(asset.scene);
      for(const group of replaced)group.visible=false;
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
  const deoks={root:deoksRoot,bounds:deoksBounds,*build(){
    yield* gradeJeongdongMeshes(T,deoksRoot,southWorldTerrainHeight,{trees,catWalls});
    deoksRoot.add(deoksExtras);
    const models=[classical,middleModel,hallModel,...surveyedPavilions.flatMap(pavilion=>pavilion.groups)];
    const replaceable=new Set(models.flatMap(model=>[model,...(model.userData.surveyRoofs??[])]));
    return yield* consolidate(deoksRoot,replaceable,foliage.register);
  }};
  const corridor={root:corridorRoot,bounds:corridorBounds,*build(){
    yield* gradeAvenueMeshes(T,corridorGround,southWorldTerrainHeight);
    return yield* consolidate(corridorRoot,new Set(),foliage.register);
  }};
  const transport={*build(){
    yield* gradeAvenueMeshes(T,transportGround,southWorldTerrainHeight);
    return yield* consolidate(transportRoot,new Set());
  }};
  let museumView,updatePlaza,updateHwangudan,northWildlife,plazaWildlife,southWildlife,buildTurn=false;
  const wildlife=[["jeongdong",jeongdongExtensionBounds],["hwangudan",hwangudanBounds],["bukchon",bukchonBounds]]
    .map(([id,bounds])=>({id,bounds,steps:null,ready:false}));
  const plaza={root:plazaRoot,bounds:plazaBounds,*build(){
    const birdPerches=[];
    updatePlaza=yield* assembleGwanghwamunPlaza(T,plazaRoot,makeKit(plazaRoot),{birdPerches,terrainHeight:southWorldTerrainHeight});
    addRegionalStands(T,plazaRoot,makeKit(plazaRoot),"gwanghwamun");
    addDocks(plazaRoot,dock=>dock.y<=-280&&dock.y>-790);
    yield* gradeAvenueMeshes(T,plazaRoot.children,southWorldTerrainHeight);
    addMinigameMarkers(T,plazaRoot,kit,["kite"],floorHeight);
    const chunks=yield* consolidate(plazaRoot,new Set(),foliage.register);
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
    addDocks(palaceRoot,dock=>dock.y<=-790&&dock.area!=="bukchon",dock=>palaceGroundOffset(dock.x,dock.y));
    addMinigameMarkers(T,palaceRoot,kit,["tuho","jegi"],floorHeight,minigameProps);
    const surveyed=gbSurveyModels.filter(id=>groups.has(id));
    const chunks=yield* consolidate(palaceRoot,new Set(surveyed.map(id=>groups.get(id))),foliage.register);
    for(const id of surveyed)addSurvey(palaceRoot,id,gbSite[id],[groups.get(id)],gbSite[id].angle);
    northWildlife=(function*(){yield* birds.loadNorth();yield* parkLife.loadNorth();})();
    return chunks;
  }};
  const gallery={*build(){
    museumView=yield* assembleMuseum(T,museumRoot,kit);
    museum.exhibits=museumView.exhibits;
    scene.add(museumRoot);
    return [];
  }};
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
    addDocks(root,dock=>dock.area==="bukchon",dock=>bukchonGroundHeight(dock)??bukchonGroundHeight(dock.access)??0);
  },()=>import("./bukchon.js"));
  const hwangudan=expansionDistrict(hwangudanBounds,hwangudanWalkable,function*(root,localKit,{assembleHwangudan}){
    updateHwangudan=(yield* assembleHwangudan(T,root,localKit))?.update;
    yield* gradeAvenueMeshes(T,root.children,southWorldTerrainHeight);
  },()=>import("./seoul-hwangudan.js"));
  const stationsDistrict=expansionDistrict({minX:55,maxX:1160,minY:-965,maxY:410},()=>false,function*(root,localKit){
    yield* buildSubwayAccess(T,root,localKit,floorHeight,{terrainHeight:outsideGroundOffset});
  });
  const expansions=[bukchon,hwangudan,stationsDistrict];
  const districts=[deoks,corridor,plaza,palace,...expansions],loading=container.querySelector("#loading-game");
  function distanceToDistrict({x,y},{minX,maxX,minY,maxY}){
    return Math.hypot(Math.max(minX-x,0,x-maxX),Math.max(minY-y,0,y-maxY));
  }
  function advanceWorld(anchor,indoors){
    const {x,y}=anchor;
    const nearCorridor=distanceToDistrict(anchor,corridorBounds)===0;
    const area=expansions.find(district=>district.contains(x,y))??
      (inGyeongbok(x,y)?palace:inGwanghwamunPlaza(x,y)?plaza:
        nearCorridor&&corridorWalkable(x,y)?corridor:distanceToDistrict(anchor,deoksBounds)===0?deoks:
        nearCorridor?corridor:null);
    const required=indoors?[gallery]:[area];
    // Street corners at either end of Sejong-daero share a foreground with the next district.
    if(area===corridor&&y>=-321&&y<-266)required.push(plaza);
    if(area===plaza&&y>-326)required.push(corridor);
    if(area===corridor&&y>103&&x<550)required.push(deoks);
    if(area===deoks&&y>103&&x>=442&&nearCorridor)required.push(corridor);
    const incomplete=district=>district&&!district.chunks&&!district.failed;
    const pending=required.find(incomplete);
    let nearby=null,gap=handheld?245:315;
    if(!indoors&&!pending)for(const district of districts){
      if(district.chunks||district.failed||district.fetching)continue;
      const distance=distanceToDistrict(anchor,district.bounds)+(district===stationsDistrict?110:0);
      if(distance<gap){nearby=district;gap=distance;}
    }
    const approachMuseum=!gallery.chunks&&!gallery.failed&&Math.hypot(anchor.x-museumOutsideDoor.x,anchor.y-museumOutsideDoor.y)<24;
    const travelling=Boolean(anchor.bus)||isCycling(anchor);
    const target=!indoors&&(approachMuseum?gallery:!transport.chunks&&!transport.failed?transport:nearby);
    const budget=pending?7:travelling?4:handheld?2.4:3.5;
    const deadline=performance.now()+budget;
    function build(target){
      if(target.load&&!target.module){
        if(!target.fetching){
          target.fetching=true;
          target.load().then(module=>{target.module=module;},error=>{
            target.failed=true;
            console.error("Could not load a walking district",error);
          }).finally(()=>{target.fetching=false;});
        }
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
      loading.hidden=!waiting&&!area?.failed&&!(indoors&&gallery.failed);
      const message=waiting?"산책길을 열고 있어요.":"산책길을 불러오지 못했어요.";
      if(loading.textContent!==message)loading.textContent=message;
    }
    return waiting;
  }

  const models=new Map(),parkedModels=new Map(),emojiMaps=new Map();
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
      camera.position.set(1.05,1.12,3.42);camera.lookAt(0,.76,0);
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
  function seatAt(position,clock){
    const bus=position.bus&&busAt(position.bus.index,clock),pose=bus&&busSeatPose(bus,position.bus.seat);
    if(pose)return {...pose,base:BUS_FLOOR+.015+busGround(bus)};
    const seat=benches[position.seat]?.slots[position.seatSide??0];
    return seat?{...seat,base:(seat.base??0)+outsideGroundOffset(seat)}:null;
  }
  // Low kerbs, benches and ledges can be stood on after a jump, so they raise the floor too.
  function floorHeight(position){
    const terrain=isInsideMuseum(position.x,position.y)?0:outsideGroundOffset(position);
    const basin=plazaGroundHeight(position);
    if(basin!=null)return terrain+basin;
    return Math.max(groundHeight(position),terrain+Math.max(platformAt(position.x,position.y,true),loftHeight(position)));
  }
  // Where a walker's feet are drawn: waist-deep below the surface while wading a pond.
  const footing=position=>floorHeight(position)-waterDepth(position.x,position.y);
  const rippleGeometry=new T.RingGeometry(.5,.58,30),ripples=new Map();
  rippleGeometry.rotateX(-Math.PI/2);
  function drawRipples(id,player,now,wet){
    let rings=ripples.get(id);
    if(!wet){
      if(rings)for(const ring of rings)ring.visible=false;
      return;
    }
    if(!rings){
      rings=[0,1].map(()=>new T.Mesh(rippleGeometry,new T.MeshBasicMaterial({color:0xeaf7f8,transparent:true,depthWrite:false})));
      for(const ring of rings)scene.add(ring);
      ripples.set(id,rings);
    }
    const busy=Math.hypot(player.vx||0,player.vy||0)>.05;
    rings.forEach((ring,i)=>{
      const phase=(now*(busy?.0011:.00055)+i*.5)%1;
      ring.visible=true;
      ring.position.set(wx(player.x),groundHeight(player)+.062,wz(player.y));
      ring.scale.setScalar(.75+phase*(busy?1.9:1.2));
      ring.material.opacity=(1-phase)*(busy?.62:.34);
    });
  }
  function groundHeight(position) {
    if(isInsideMuseum(position.x,position.y))return stairHeight(position)??0;
    const terrain=outsideGroundOffset(position);
    const plazaLevel=plazaGroundHeight(position);
    if(plazaLevel!=null)return terrain+plazaLevel;
    const bukchonLevel=bukchonGroundHeight(position);
    if(bukchonLevel!=null)return bukchonLevel;
    const hwangudanLevel=hwangudanFloorHeight(position);
    if(hwangudanLevel!=null)return terrain+hwangudanLevel;
    if(position.y<gwanghwamun.y)return terrain;
    const stair=stairHeight(position);
    if(stair!=null)return terrain+stair;
    if(Math.abs(position.y-bridge.y)<3.15&&Math.abs(position.x-bridge.x)<3.6)return terrain+Math.max(0,.23-(Math.abs(position.x-bridge.x)-2.70)*.34);
    if(Math.abs(position.y-gate.y)<2.0&&Math.abs(position.x-gate.x)<4.1)return terrain+.265;
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
  let cameraAnchor=null,cameraDistance=0,prevTime=0,governedAt=0,cullAt=0,shadowAt=0;
  let streamX=Infinity,streamY=Infinity;
  // Last resort on a slow device: draw fewer birds and only the cats close by.
  function thinWildlife(sparse){
    quality.sparse=sparse;birds.setSparse(sparse);parkLife.setSparse(sparse);
  }
  function govern(now){
    const elapsed=now-(governedAt||now);
    governedAt=now;
    if(quality.pinned||elapsed<=0||elapsed>250)return;
    quality.frame+=(elapsed-quality.frame)*.06;
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
      if(quality.sparse)thinWildlife(false);
      else if(!quality.shadows)quality.shadows=true;
      else if(quality.ratio<quality.max-.01){
        quality.ratio=Math.min(quality.max,quality.ratio*1.08);
        renderer.setPixelRatio(quality.ratio);resize();
      }
    }
  }
  function render(state,now){
    if(container.hidden)return;
    const {me,peers,view,firstPerson,fountainShow,parkedBikes=[],clock=Date.now()}=state,delta=Math.min(.064,(now-(prevTime||now))/1000);
    prevTime=now;
    const anchor=me,angle=view.pan*Math.PI/180,indoors=museum.isInside(anchor.x,anchor.y),
      atPlaza=inGwanghwamunPlaza(anchor.x,anchor.y);
    const waiting=advanceWorld(anchor,indoors);
    if(waiting&&(indoors?!gallery.chunks:cameraAnchor==null||Math.hypot(anchor.x-300-pivot.x,anchor.y-225-pivot.z)>65))return;
    picnicWorld.update(indoors?null:anchor,state.picnics);
    const weather=state.environment&&resolveSeoulEnvironment(state.environment,clock);
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
    scene.fog.density=indoors?.0039:.0039+cloud*.00065+fog*.016;
    hemi.color.copy(ambientDay).lerp(overcastAmbient,cloud*.58).lerp(ambientNight,night);
    hemi.groundColor.copy(season==="winter"?winterGround:ordinaryGround);
    sun.color.copy(sunlightDay).lerp(sunlightWarm,twilight*.84);
    // Gradually follow the northward route without shifting the skyline at district boundaries.
    const horizonFollow=T.MathUtils.smoothstep(180-anchor.y,0,220);
    heavens.position.set((wx(anchor.x)-21)*horizonFollow,0,(wz(anchor.y)+14)*horizonFollow);
    if(now>=cullAt||Math.hypot(anchor.x-streamX,anchor.y-streamY)>22){
      cullAt=now+180;streamX=anchor.x;streamY=anchor.y;
      const cx=wx(anchor.x),cz=wz(anchor.y),reach=quality.sparse?300:handheld&&!quality.pinned?415:540;
      const detailReach=quality.pinned?reach:quality.sparse?100:handheld?145:200;
      let releaseBudget=12;
      placeLights(anchor);
      function cull(chunks,active){
        for(const chunk of chunks){
          const {x,z,radius,object,parent,detail,ownsGeometry}=chunk;
          const range=(detail?detailReach:reach)+(object.parent?18:0)+radius;
          if(active&&(x-cx)**2+(z-cz)**2<range**2){
            if(!object.parent)parent.add(object);
            chunk.releaseAt=now+20000;
          }else{
            if(object.parent)object.removeFromParent();
            if(chunk.releaseAt&&now>=chunk.releaseAt&&releaseBudget>0){
              // Keep the cell's CPU data. Three uploads it again when we walk back.
              if(object.isInstancedMesh)object.dispose();
              if(ownsGeometry)object.geometry.dispose();
              chunk.releaseAt=0;releaseBudget--;
            }
          }
        }
      }
      if(transport.chunks)cull(transport.chunks,!indoors);
      for(const district of districts){
        if(!district.chunks)continue;
        const attached=district.root.parent===outdoors;
        const visible=!indoors&&distanceToDistrict(anchor,district.bounds)<reach+(attached?90:65);
        if(visible){
          if(!attached)outdoors.add(district.root);
        }else if(attached)district.root.removeFromParent();
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
          loadLandmark(next).finally(()=>{surveyLoading=false;});
        }
      }
    }
    outdoors.visible=!indoors;museumView?.setVisible(indoors);
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
    const shadowed=quality.shadows&&!indoors&&sun.intensity>.24;
    if(sun.castShadow!==shadowed)sun.castShadow=shadowed;
    if(shadowed&&(renderer.shadowMap.autoUpdate||now>=shadowAt)){
      aimShadow(wx(anchor.x),groundHeight(anchor),wz(anchor.y));renderer.shadowMap.needsUpdate=true;shadowAt=now+(handheld?80:48);
    }
    govern(now);
    lampMaterial.emissiveIntensity=.03+night*2.15;
    spotLights.forEach((light,i)=>{light.intensity=lightDay[i]*(1-night)+night*lightPower[i];});
    buses.update(clock,indoors?null:anchor);
    if(palaceRoot.parent===outdoors)for(const {material,rest,strength} of gbNightGlow)material.emissiveIntensity=rest+night*strength;
    if(plazaRoot.parent===outdoors)updatePlaza(now,night,indoors?null:anchor,fountainShow?.startedAt??0,clock);
    if(hwangudan.root.parent===outdoors)updateHwangudan?.(night);
    const roster=[me,...peers],present=new Set(roster.map(player=>player.id));
    minigameWorld.begin(clock,indoors?null:anchor,state.minigames,state.minigameAction,state.minigameFree);
    if(!indoors){
      if(deoksRoot.parent===outdoors&&distanceToDistrict(anchor,deoksBounds)<120){drawWater(now*.001,night);drawPond(now*.001,night);}
      nightSky(night*(1-cloud*.91)*(1-fog*.89));
      drawPalaceSky(clock,night,{cloud,fog,twilight,direction:weather?skyUniforms.solar.value:undefined,haze:scene.fog.color});
      birds.update(clock,delta,roster);
    }
    const parkedNearby=new Set();
    for(const bike of parkedBikes){
      if(indoors||isInsideMuseum(bike.x,bike.y)||(bike.x-anchor.x)**2+(bike.y-anchor.y)**2>140**2)continue;
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
    palacePeople.update(clock,now,delta,indoors?null:anchor,roster,Boolean(quality.sparse));
    streetPeople.update(clock,now,delta,indoors?null:anchor,Boolean(quality.sparse));
    bukchonPeople.update(clock,now,delta,indoors?null:anchor,Boolean(quality.sparse));
    for(const [id,model] of models){
      if(present.has(id))continue;
      minigameWorld.remove(model);
      walkerModels.dispose(model);
      models.delete(id);
      for(const ring of ripples.get(id)??[]){ring.removeFromParent();ring.material.dispose();}
      ripples.delete(id);
    }
    roster.forEach(player=>{
      let model=models.get(player.id);
      const visible=museum.isInside(player.x,player.y)===indoors&&Math.hypot(player.x-anchor.x,player.y-anchor.y)<135;
      if(!visible){if(model){model.group.visible=false;walkerModels.clearChat(model);}drawRipples(player.id,player,now,false);return;}
      if(!model){model=walkerModels.create(player.coat??0xab5947,player.nickname,labelSprite);models.set(player.id,model);}
      drawRipples(player.id,player,now,waterDepth(player.x,player.y)>0&&jumpLift(player,clock)<.3);
      const floor=footing(player.bikeDriverPosition??player);
      walkerModels.update(model,player,{now,clock,delta,seat:seatAt(player,clock),floor,jump:renderedJumpLift(player,clock,floor),emojiTexture,chatTexture,
        turnEase:player===me?1-Math.exp(-delta*22):1});
      minigameWorld.pose(player,model,state.photoCapture);
      if(model.label)model.label.visible=!state.photoCapture;
    });
    minigameWorld.live(models,indoors||state.photoCapture?null:state.minigameAimPreview);
    const seat=seatAt(anchor,clock),bus=anchor.bus&&busAt(anchor.bus.index,clock);
    const outsideBus=bus&&!firstPerson;
    const floor=seat?0:footing(anchor.bikeDriverPosition??anchor);
    const fallWeight=firstPerson?(bikeFallAt(anchor,clock)?.weight??0):0;
    const eyeHeight=outsideBus?2.115+busGround(bus):seat?(firstPerson?1.30:1.22)+(seat.base??0):
      (firstPerson?1.28:1.20)+floor+renderedJumpLift(anchor,clock,floor)+(isCycling(anchor)?.12:0)-fallWeight*.87;
    const cameraPoint=outsideBus?bus:seat??anchor;
    anchorPoint.set(wx(cameraPoint.x),eyeHeight,wz(cameraPoint.y));
    const anchorKey=bus?`${anchor.id}-${bus.index}-${firstPerson}`:anchor.bikeRide?.driver??anchor.id;
    const changed=cameraAnchor!==anchorKey||pivot.distanceToSquared(anchorPoint)>144;
    if(changed||firstPerson&&(bus||isBikePassenger(anchor)))pivot.copy(anchorPoint);
    else pivot.lerp(anchorPoint,1-Math.exp(-delta*20));
    cameraAnchor=anchorKey;
    const zoomFov=baseFov-view.zoom*(firstPerson?6:1.7);
    if(Math.abs(zoomFov-camera.fov)>.01){
      camera.fov+=(zoomFov-camera.fov)*(1-Math.exp(-delta*12));
      camera.updateProjectionMatrix();
    }
    const pitch=firstPerson?Math.max(-87,Math.min(65,view.tilt)):
      Math.max(-83,Math.min(62,(outsideBus?23:14)+(view.tilt<0?view.tilt*1.22:view.tilt)));
    const orbitPitch=firstPerson?pitch:Math.max(outsideBus?4:-10,pitch);
    const elevation=orbitPitch*Math.PI/180;
    const horizontal=Math.cos(elevation);
    arm.set(-Math.sin(angle)*horizontal,Math.sin(elevation),Math.cos(angle)*horizontal);
    if(firstPerson){
      camera.position.copy(pivot);
      camera.lookAt(gaze.copy(pivot).sub(arm));
      camera.rotateZ(fallWeight*.62);
      cameraDistance=0;
    }else{
      const distance=Math.min(outsideBus?11.8-view.zoom*1.15:4.55-view.zoom*.42,indoors&&arm.y>0?(4.97-pivot.y)/arm.y:Infinity);
      let available=distance;
      // Shorten the orbit arm at walls and let it ease back out as space opens.
      for(let sample=1,count=Math.ceil(distance/.20);sample<=count;sample++){
        const step=distance*sample/count;
        const point={x:pivot.x+300+arm.x*step,y:pivot.z+225+arm.z*step};
        const terrain=indoors?0:outsideGroundOffset(point);
        if(solidAt(point.x,point.y,pivot.y+arm.y*step-.17-terrain)){
          available=Math.max(.34,step-.24);break;
        }
      }
      if(changed||!cameraDistance||available<cameraDistance)cameraDistance=available;
      else cameraDistance+=(available-cameraDistance)*(1-Math.exp(-delta*8));
      camera.position.copy(pivot).addScaledVector(arm,cameraDistance);
      if(pitch===orbitPitch)camera.lookAt(pivot);
      else{
        const direction=pitch*Math.PI/180;
        gaze.set(Math.sin(angle)*Math.cos(direction),-Math.sin(direction),-Math.cos(angle)*Math.cos(direction));
        camera.lookAt(gaze.add(camera.position));
      }
    }
    if(state.photoCamera){
      const photo=state.photoCamera,yaw=photo.pan*Math.PI/180,tilt=photo.tilt*Math.PI/180;
      camera.position.set(wx(photo.x),floorHeight(photo)+photo.height,wz(photo.y));
      gaze.set(Math.sin(yaw)*Math.cos(tilt),-Math.sin(tilt),-Math.cos(yaw)*Math.cos(tilt));
      camera.lookAt(gaze.add(camera.position));
      if(camera.fov!==photo.fov){camera.fov=photo.fov;camera.updateProjectionMatrix();}
      cameraDistance=camera.position.distanceTo(anchorPoint);
      guideMarker.visible=false;showMarker.visible=false;
    }
    cameraUp.set(0,1,0).applyQuaternion(camera.quaternion);
    for(const model of models.values())if(model.group.visible&&model.chatSprite)walkerModels.placeChat(model,cameraUp);
    const anchorModel=models.get(anchor.id);
    if(anchorModel&&cameraDistance<1.08)anchorModel.group.visible=false;
    const umbrella=firstPerson&&anchor.sharedUmbrella&&anchorModel?.umbrella;
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
      sheltered:Boolean(shelter||anchor.umbrella),sharedShelter:Boolean(shelter),inside:indoors||Boolean(anchor.bus&&firstPerson),
      sparse:quality.sparse,pixelRatio:quality.pinned?quality.max:quality.ratio,night});
    renderer.render(scene,camera);
    if(firstPerson){
      firstPersonView??=makeFirstPersonView(T,createItemProp);
      firstPersonView.render(renderer,camera,me,{now,clock,delta,seat,clink:me.clink,night});
    }
  }
  const ray=new T.Raycaster(),sample=new T.Vector3();
  function pick(clientX,clientY){
    const rect=renderer.domElement.getBoundingClientRect();
    if(cameraAnchor==null||!rect.width||!rect.height||
       clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom)return null;
    ray.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),camera);
    if(guideMarker.visible&&ray.intersectObject(guideMarker,false).length)return {...ticketGuide.approach,guide:true};
    if(showMarker.visible&&ray.intersectObject(showMarker,false).length)return {x:plazaShowSpot.x,y:plazaShowSpot.y};
    for(let step=.25;step<=105;step+=.25){
      ray.ray.at(step,sample);
      if(sample.y>floorHeight({x:sample.x+300,y:sample.z+225}))continue;
      return {x:sample.x+300,y:sample.z+225};
    }
    return null;
  }
  function clearChat(){
    for(const model of models.values())walkerModels.clearChat(model);
    selfChat.hidden=true;selfChat.textContent="";
  }
  // A souvenir photograph: one frame from a fixed camera, returned as a JPEG data URL.
  function snapshot(state,{from,to,fov=50}){
    render(state,performance.now());
    const previous=camera.fov,marker=guideMarker.visible,musicMarker=showMarker.visible;
    camera.fov=fov;camera.updateProjectionMatrix();
    camera.position.set(wx(from.x),groundHeight(from)+from.height,wz(from.y));
    camera.lookAt(wx(to.x),groundHeight(to)+to.height,wz(to.y));
    guideMarker.visible=false;
    showMarker.visible=false;
    renderer.render(scene,camera);
    const picture=renderer.domElement.toDataURL("image/jpeg",.92);
    guideMarker.visible=marker;showMarker.visible=musicMarker;camera.fov=previous;camera.updateProjectionMatrix();
    return picture;
  }
  function capturePhoto(state){
    render({...state,firstPerson:false,photoCapture:true},performance.now());
    return renderer.domElement.toDataURL("image/jpeg",.92);
  }
  const renderStats=()=>({...renderer.info.render,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
    areas:{plaza:Boolean(plaza.chunks),palace:Boolean(palace.chunks),museum:Boolean(gallery.chunks)}});
  return {render,pick,previewWalker,clearChat,floorHeight,groundHeight,renderStats,snapshot,capturePhoto,
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

// Survey models arrive without normals and would be shaded one hard facet at a time. This
// rebuilds them so neighbouring faces blend smoothly while real edges (eaves, columns,
// steps) stay crisp.
function smoothSurveyNormals(geometry,creaseDegrees=48){
  const source=geometry.index?geometry.toNonIndexed():geometry;
  const position=source.attributes.position,count=position.count,faces=count/3;
  const faceNormal=new Float32Array(faces*3),unit=new Float32Array(faces*3);
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  const around=new Map();
  for(let face=0;face<faces;face++){
    a.fromBufferAttribute(position,face*3);b.fromBufferAttribute(position,face*3+1);c.fromBufferAttribute(position,face*3+2);
    b.sub(a);c.sub(a);b.cross(c);
    faceNormal[face*3]=b.x;faceNormal[face*3+1]=b.y;faceNormal[face*3+2]=b.z;
    const length=b.length()||1;
    unit[face*3]=b.x/length;unit[face*3+1]=b.y/length;unit[face*3+2]=b.z/length;
    for(let corner=0;corner<3;corner++){
      const i=face*3+corner,key=position.getX(i)+"/"+position.getY(i)+"/"+position.getZ(i);
      const list=around.get(key);
      if(list)list.push(face);else around.set(key,[face]);
    }
  }
  const limit=Math.cos(creaseDegrees*Math.PI/180),normals=new Float32Array(count*3);
  for(let face=0;face<faces;face++){
    const ux=unit[face*3],uy=unit[face*3+1],uz=unit[face*3+2];
    for(let corner=0;corner<3;corner++){
      const i=face*3+corner,key=position.getX(i)+"/"+position.getY(i)+"/"+position.getZ(i);
      let x=0,y=0,z=0;
      for(const other of around.get(key)){
        if(ux*unit[other*3]+uy*unit[other*3+1]+uz*unit[other*3+2]<limit)continue;
        x+=faceNormal[other*3];y+=faceNormal[other*3+1];z+=faceNormal[other*3+2];
      }
      const length=Math.hypot(x,y,z)||1;
      normals[i*3]=x/length;normals[i*3+1]=y/length;normals[i*3+2]=z/length;
    }
  }
  source.setAttribute("normal",new T.BufferAttribute(normals,3));
  return source;
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
