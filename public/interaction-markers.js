import {interiorAt} from "./interior-layout.js";

const STYLES = {
  food:{light:0xffc66f,ink:"#ffdf9c",label:"받기"},
  enter:{light:0x86dbc2,ink:"#c3f7df",label:"입장"},
  exit:{light:0x9bbad9,ink:"#d4e6fa",label:"나가기"},
  activity:{light:0xbfc1ee,ink:"#e6e1ff",label:"체험"}
};
const MAX_VISIBLE = 5;
const RANGE = 20;
const LABEL_RANGE = 8;
const PARTICLES = 6;
const SCAN_MS = 135;
const TAU = Math.PI*2;

function canvasTexture(T,width,height,paint){
  const canvas=document.createElement("canvas");
  canvas.width=width;canvas.height=height;
  paint(canvas.getContext("2d"));
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;
  return map;
}

function labelTexture(T,style,label){
  const width=Math.max(116,36+Array.from(label).length*30);
  const map=canvasTexture(T,width,55,ctx=>{
    ctx.beginPath();ctx.roundRect(3,3,width-6,49,16);
    ctx.fillStyle="#1d2b25da";ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle=style.ink;ctx.stroke();
    ctx.font='600 27px "Malgun Gothic", sans-serif';
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=style.ink;
    ctx.fillText(label,width/2,28,width-20);
  });
  return {map,ratio:width/55};
}

export function makeInteractionMarkers(T,scene,{wx,wz,floorHeight},points){
  const markers=points.filter(point=>Object.hasOwn(STYLES,point.kind)).map(point=>({
    ...point,interior:interiorAt(point.x,point.y)
  }));
  const root=new T.Group();root.name="장소 안내 표식";scene.add(root);
  const ringGeometry=new T.RingGeometry(.62,.665,32).rotateX(-Math.PI/2);
  const rimGeometry=new T.RingGeometry(.57,.595,32).rotateX(-Math.PI/2);
  const glowGeometry=new T.PlaneGeometry(1.48,1.48).rotateX(-Math.PI/2);
  const glow=canvasTexture(T,64,64,ctx=>{
    const light=ctx.createRadialGradient(32,32,0,32,32,32);
    light.addColorStop(0,"#ffffff12");light.addColorStop(.7,"#ffffff38");
    light.addColorStop(.88,"#ffffff89");light.addColorStop(1,"#ffffff00");
    ctx.fillStyle=light;ctx.fillRect(0,0,64,64);
  });
  const particleMap=canvasTexture(T,32,32,ctx=>{
    const light=ctx.createRadialGradient(16,16,0,16,16,16);
    light.addColorStop(0,"#ffffffff");light.addColorStop(.35,"#ffffffb0");light.addColorStop(1,"#ffffff00");
    ctx.fillStyle=light;ctx.fillRect(0,0,32,32);
  });
  const additive={depthTest:true,depthWrite:false,transparent:true,toneMapped:false,blending:T.AdditiveBlending};
  const labels=new Map();
  const slots=Array.from({length:Math.min(MAX_VISIBLE,markers.length)},()=>{
    const group=new T.Group();group.visible=false;root.add(group);
    const ring=new T.Mesh(ringGeometry,new T.MeshBasicMaterial(additive));
    const rim=new T.Mesh(rimGeometry,new T.MeshBasicMaterial({color:0x233934,transparent:true,depthWrite:false,toneMapped:false}));
    const halo=new T.Mesh(glowGeometry,new T.MeshBasicMaterial({...additive,map:glow}));
    rim.position.y=.003;ring.position.y=.006;
    const data=new T.BufferAttribute(new Float32Array(PARTICLES*3),3).setUsage(T.DynamicDrawUsage);
    const geometry=new T.BufferGeometry();geometry.setAttribute("position",data);
    const particles=new T.Points(geometry,new T.PointsMaterial({...additive,map:particleMap,size:.11}));
    particles.frustumCulled=false;
    const label=new T.Sprite(new T.SpriteMaterial({depthTest:true,depthWrite:false,transparent:true,toneMapped:false}));
    label.position.y=1.67;label.center.set(.5,0);
    group.add(halo,rim,ring,particles,label);
    return {group,ring,rim,halo,data,particles,label,point:null};
  });

  function assign(slot,point){
    if(slot.point===point)return;
    slot.point=point;slot.group.visible=Boolean(point);
    if(!point)return;
    const style=STYLES[point.kind],label=point.label||style.label;
    const name=Array.from(label.trim()).slice(0,12).join("")||style.label;
    const key=point.kind+"/"+name;
    if(!labels.has(key))labels.set(key,labelTexture(T,style,name));
    const texture=labels.get(key);
    slot.label.material.map=texture.map;slot.label.material.needsUpdate=true;
    slot.label.scale.set(.28*texture.ratio,.28,1);
    for(const object of [slot.ring,slot.halo,slot.particles])object.material.color.setHex(style.light);
    slot.group.name=name+" 안내 표식";
    const ground=point.height??floorHeight(point);
    let top=ground;
    if(point.height==null){
      for(const [dx,dy] of [[-.59,0],[.59,0],[0,-.59],[0,.59]]){
        const edge=floorHeight({x:point.x+dx,y:point.y+dy});
        if(edge<=ground+.28)top=Math.max(top,edge);
      }
    }
    slot.group.position.set(wx(point.x),top+.046,wz(point.y));
  }

  let scannedAt=-Infinity,scanX=Infinity,scanY=Infinity,lastInterior;
  function update(player,now){
    if(!player||!slots.length){root.visible=false;return;}
    root.visible=true;
    const interior=interiorAt(player.x,player.y);
    if(now-scannedAt>=SCAN_MS||Math.hypot(player.x-scanX,player.y-scanY)>4||lastInterior!==interior){
      scannedAt=now;scanX=player.x;scanY=player.y;lastInterior=interior;
      const nearest=[];
      for(const point of markers){
        if(point.interior!==interior)continue;
        const distance=(point.x-scanX)**2+(point.y-scanY)**2;
        if(distance<RANGE**2)nearest.push({point,distance});
      }
      nearest.sort((a,b)=>a.distance-b.distance);
      for(let i=0;i<slots.length;i++)assign(slots[i],nearest[i]?.point??null);
    }
    for(const slot of slots){
      const {point,ring,rim,halo,particles,label,data}=slot;
      if(!point)continue;
      const distance=Math.hypot(player.x-point.x,player.y-point.y);
      const fog=Math.max(0,Math.min(1,(RANGE-distance)/5));
      const time=now*.001,offset=.14*(point.x+point.y),pulse=.5+.5*Math.sin(time*2.5+offset);
      const breath=1+pulse*.052;
      ring.scale.set(breath,1,breath);halo.scale.copy(ring.scale);
      ring.material.opacity=(.60+pulse*.22)*fog;rim.material.opacity=.56*fog;halo.material.opacity=.70*fog;
      particles.material.opacity=(.55+pulse*.30)*fog;
      label.visible=distance<LABEL_RANGE;
      label.material.opacity=Math.min(1,(LABEL_RANGE-distance)*.75);
      if(!fog)continue;
      for(let i=0;i<PARTICLES;i++){
        const rise=(time*.47+i/PARTICLES+Math.abs(offset)*.11)%1;
        const angle=i*TAU/PARTICLES+rise*.88+offset;
        const radius=.50+.09*Math.cos(i*1.3+rise*TAU);
        data.setXYZ(i,radius*Math.cos(angle),.08+Math.sin(rise*Math.PI/2)*.73,radius*Math.sin(angle));
      }
      data.needsUpdate=true;
    }
  }
  return {update};
}
