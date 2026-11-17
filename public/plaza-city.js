import {addObstacle} from "./layout.js";
import {plazaAt} from "./plaza-layout.js";

const podiums={
  sejong:[-99,204,93,93],hyundai:[-91,68,77,66],government:[-146,470,156,53],
  kyobo:[87,52,81,77],kt:[82,184,69,75]
};
const civicPodium=(north,museum)=>[82,north,68,(museum?76:85)+3];
const frontSteps=[(-52.1-88)/2,204,88-52.1,76];
const sejongSouthWing=[-96,140,82,31];
const sejongNorthWing=[-118,254,70,25];

export function registerPlazaCity(){
  // Ground-level shells span the building line, including the few metres of
  // the wide plaza pavement touched by the western and eastern podiums.
  for(const [east,north,width,length] of [...Object.values(podiums),frontSteps,sejongSouthWing,sejongNorthWing,
    civicPodium(291,false),civicPodium(385,true),[51,385,8,32]]){
    const {x,y}=plazaAt(east,north);
    addObstacle(x,y,width,length);
  }
}

export function* assemblePlazaCity(T,group,{wx,wz}){
  let stone=[],glass=[],screens=[],distant=[];
  const concrete=0xa6a6a0,granite=0xbeb8aa,shadow=0x535655;
  let terrainAnchor;
  const at=(east,north)=>{terrainAnchor=plazaAt(east,north);};
  const box=(color,east,level,north,width,height,length,batch=stone)=>
    batch.push({color,east,level,north,width,height,length});
  const slab=(color,east,north,width,length,bottom,height,batch=stone)=>{
    box(color,east,bottom+height/2,north,width,height,length,batch);
    if(!bottom&&width>4&&length>4)box(color,east,-.5,north,width,1.0,length,batch);
  };
  const pane=(color,east,level,north,width,height,length)=>
    box(color,east,level,north,width,height,length,glass);

  function label(name,east,north,height,width,facesEast){
    if(typeof document==="undefined")return;
    const canvas=document.createElement("canvas");
    canvas.width=512;canvas.height=96;
    const ink=canvas.getContext("2d");
    if(!ink)return;
    ink.font='600 54px "Malgun Gothic","Apple SD Gothic Neo",sans-serif';
    ink.textAlign="center";ink.textBaseline="middle";ink.fillStyle="#e7e0ce";
    ink.fillText(name,256,51,490);
    const texture=new T.CanvasTexture(canvas);
    texture.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(width,width*96/512),
      new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,opacity:.88}));
    const p=plazaAt(east,north);
    sign.position.set(wx(p.x),height,wz(p.y));
    sign.rotation.y=facesEast?Math.PI/2:-Math.PI/2;
    sign.userData.terrainAnchor=terrainAnchor;
    group.add(sign);
  }

  function windows({east,north,width,length,base,storeys,columns,pitch,face,tones,height=.7,fill=.77}){
    const side=face==="east"?1:-1;
    const facade=east+side*(width/2+.035),cell=length/columns;
    for(let row=0;row<storeys;row++){
      for(let col=0;col<columns;col++){
        const n=north-length/2+(col+.5)*cell;
        const y=base+(row+.52)*pitch;
        const tone=tones[(row*13+col*7+(row+col)%5)%tones.length];
        pane(tone,facade,y,n,.12,pitch*height,cell*fill);
      }
    }
  }

  function sideWindows(east,north,width,length,base,storeys,columns,pitch,color){
    const cell=width/columns;
    for(let row=0;row<storeys;row++)for(let col=0;col<columns;col++){
      const x=east-width/2+(col+.5)*cell;
      for(const sign of [-1,1]){
        pane(color,x,base+(row+.52)*pitch,north+sign*(length/2+.035),cell*.71,pitch*.65,.12);
      }
    }
  }

  function entrance(east,north,width,length,facesEast,color=0x52696c,height=5){
    const side=facesEast?1:-1;
    const front=east+side*(width/2+.035);
    pane(color,front,height/2,north,.16,height,length);
    for(let i=0;i<7;i++){
      box(0x8e9189,front+side*.13,height/2,north-length/2+i*length/6,.12,height,.15);
    }
    box(0x88877c,front+side*.52,height+.12,north,1.5,.22,length+.7);
  }

  // Broad granite steps, deep colonnade, patterned screens and the tall stage house.
  function sejongCenter(){
    const north=204;
    slab(0x83817a,...podiums.sejong,0,.35);
    for(let step=0;step<12;step++){
      const front=-52.1-step*.58;
      slab(step%2?0xa8a69d:0xb7b4aa,(front-88)/2,north,front+88,76,0,(step+1)*.235);
    }
    slab(0x98958c,-96,north,70,77,2.82,20.5);
    slab(0xbdb7a7,-104,north,88,81,23.32,1.25);
    slab(0xa4a296,-106,north,85,79,24.57,.72);
    slab(0x77786e,-109,north,79,75,25.29,.4);
    slab(0xb7b4a8,-124,north,40,53,25.69,10.3);
    slab(0x9d9b90,-124,north,41,55,35.99,.46);
    box(0x9e9b8f,-60.3,22.85,north,3.4,1.7,81);
    pane(0x5c6768,-60.91,5.05,north,.14,4.45,52);
    for(let i=0;i<15;i++){
      box(0xa6a394,-60.78,5.05,north-25+i*50/14,.24,4.45,.18);
    }
    for(let i=0;i<9;i++){
      const n=north-35.2+i*8.8;
      box(0xc5c0b0,-58.6,12.83,n,1.3,20.02,1.7);
      box(0xddd5c4,-57.84,12.83,n,.3,20.02,.88);
      box(0xaaa393,-58.6,3.25,n,1.75,.86,2.14);
    }
    for(const y of [8.5,16.5]){
      box(shadow,-60.78,y+3,north,.25,6,67);
      for(let n=north-32;n<=north+32;n+=1.2){
        box(0xb4ad9b,-60.55,y+3,n,.19,6,.2);
      }
      for(let h=1;h<=5;h++){
        box(0xaaa28f,-60.52,y+h,north,.17,.14,67);
      }
    }
    label("세종문화회관",-59.05,north,22.1,23,true);
    slab(0x878a86,...sejongNorthWing,0,16.3);
    const [east,northWing,width,length]=sejongNorthWing;
    windows({east,north:northWing,width,length,base:1.3,storeys:4,columns:5,pitch:3.65,
      face:"east",tones:[0x516365,0x677879,0x3f5359]});
  }

  function sejongAnnex(){
    const [east,north,width,length]=sejongSouthWing,front=east+width/2;
    slab(0xaaa69b,east,north,width,length,0,13.8);
    slab(granite,east,north,width+.55,length+.65,13.8,.62);
    windows({east,north,width,length,base:4.1,storeys:3,columns:7,pitch:3.03,face:"east",
      tones:[0x485a5e,0x536a70,0x647c80],height:.66,fill:.81});
    sideWindows(east,north,width,length,4.1,3,14,3.03,0x576969);
    for(let bay=0;bay<=7;bay++){
      const n=north-length/2+bay*length/7;
      box(0xc0baac,front+.12,7.12,n,.31,13.5,.54);
    }
    entrance(east,north,width,18,true,0x536567,3.78);
  }

  function hyundai(){
    const east=-91,north=68,width=72,length=54;
    slab(0x98978c,...podiums.hyundai,0,9.4);
    slab(0xb3ac9b,east,north,width,length,9.4,68.4);
    slab(0xa5a296,east,north,73,55,77.8,2.25);
    slab(0xa09d91,east-5,north,44,32,80.05,5.4);
    const tones=[0x4f5d60,0x52676a,0x617473,0x43575c,0x526569];
    windows({east,north,width,length,base:9.4,storeys:18,columns:13,pitch:3.8,
      face:"east",tones,height:.81,fill:.56});
    sideWindows(east,north,width,length,9.4,18,13,3.8,0x536467);
    for(let i=0;i<=13;i++){
      box(0xc2b8a4,-54.98,43.6,north-length/2+i*length/13,.23,68.4,.33);
    }
    entrance(east,north,77,30,true,0x536469,6.8);
    label("현대해상 광화문 사옥",-52.39,north,8.25,24,true);
  }

  function government(){
    const east=-146,north=470,width=152,length=43;
    slab(0xaaa89f,...podiums.government,0,6.8);
    slab(0xb5b0a2,east,north,width,length,6.8,77.9);
    slab(0xa5a396,east,north,width+1,length+1,84.7,2.1);
    slab(0x9d9a8e,east-3,north,73,30,86.8,4.0);
    const tones=[0x50646e,0x6b7b81,0x536872,0x58727c,0x596c71];
    windows({east,north,width,length,base:6.8,storeys:19,columns:10,pitch:4.1,
      face:"east",tones,height:.65,fill:.6});
    sideWindows(east,north,width,length,6.8,19,35,4.1,0x61747a);
    for(let i=0;i<=10;i++){
      box(0xb8b2a5,-69.88,45.75,north-length/2+i*length/10,.32,77.9,.62);
    }
    slab(0xa19f96,-101,431,62,24,0,20.5);
    windows({east:-101,north:431,width:62,length:24,base:1,storeys:5,columns:6,pitch:3.9,
      face:"east",tones});
    entrance(east,north,156,18,true,0x50616b,4.5);
    // The forecourt boundary belongs behind the pine grove and the arcade.
    // Sink the posts into the sloping ground rather than exposing their feet.
    const fence=-66.8,start=421,end=519,posts=36;
    for(let i=0;i<posts;i++){
      box(0x4e5856,fence,1.04,start+(end-start)*i/(posts-1),.11,2.72,.11);
    }
    for(const h of [.38,1.95])box(0x4e5856,fence,h,(start+end)/2,.11,.14,end-start);
    label("정부서울청사",-67.9,north,5.65,14,true);
  }

  function kyobo(){
    const east=87,north=52,width=77,length=72;
    slab(0x696a61,...podiums.kyobo,0,8.4);
    slab(0x918f82,east,north,width,length,8.4,75.6);
    slab(0x72756e,east,north,79,74,84,2.4);
    slab(0x7b7c74,east+5,north,52,42,86.4,4.3);
    const tones=[0x263b42,0x354f55,0x426268,0x4c6164,0x3c5055];
    windows({east,north,width,length,base:8.4,storeys:21,columns:14,pitch:3.6,
      face:"west",tones,height:.85,fill:.65});
    sideWindows(east,north,width,length,8.4,21,14,3.6,0x354a50);
    for(let i=0;i<8;i++){
      box(0xaaa392,48.38,45.95,north-length/2+i*length/7,.26,75.1,.62);
    }
    entrance(east,north,81,33,false,0x435d62,5.8);
    slab(0x536360,49.5,27,5.5,23,5.8,1.22);
    label("교보문고",46.42,north,7.2,20,false);
  }

  function kt(){
    const east=82,north=184,width=67,length=73;
    slab(0x9e9b90,...podiums.kt,0,6.4);
    slab(0x35515c,east,north,width,length,6.4,63.9);
    slab(0x526970,east,north,69,75,70.3,1.7);
    slab(0x54666c,east+3,north,39,33,72,5.4);
    const tones=[0x5e8290,0x416775,0x527886,0x426876,0x73959d,0x385b66];
    windows({east,north,width,length,base:6.4,storeys:17,columns:19,pitch:3.75,
      face:"west",tones,height:.95,fill:.97});
    sideWindows(east,north,width,length,6.4,17,16,3.75,0x527782);
    for(const offset of [-17.7,17.7]){
      const n=north+offset;
      box(0x232d36,47.91,15.0,n,.9,14.65,32.4);
      box(offset<0?0x3d627f:0x546477,47.42,15.0,n,.16,13.85,31.4,screens);
      for(let i=0;i<5;i++){
        const palette=offset<0?[0x314761,0x466b83,0x3b556d]:[0x726a76,0x454b67,0x59566d];
        box(palette[i%3],47.30,10.37+i*1.9,n+(i%2?3.1:-2.8),.09,1.8,19+i*1.2,screens);
      }
    }
    entrance(east,north,69,38,false,0x47616a);
    label("KT 광화문지사",47.16,north,24.9,22,false);
  }

  // Adjacent 1960s mid-rise blocks have similar masses and different frontages.
  function civicEast(north,museum){
    const east=82,width=62,length=museum?76:85;
    const facade=museum?0xa5a5a0:0x9a9d94;
    const tones=museum?[0x687a81,0x5d7176,0x58676e,0x657980]:[0x445751,0x4c605a,0x576961];
    slab(0xa5a59b,...civicPodium(north,museum),0,1.15);
    slab(facade,east,north,width,length,1.15,29.7);
    slab(museum?0xbbb9ae:0x9b9f93,east,north,63,length+.9,30.85,1.15);
    slab(0xa3a398,east+7,north+(museum?-9:1),38,museum?34:48,32,museum?3.7:3.1);
    windows({east,north,width,length,base:1.15,storeys:8,columns:14,pitch:3.69,
      face:"west",tones,height:.62,fill:.76});
    sideWindows(east,north,width,length,1.15,8,11,3.69,museum?0x5a7077:0x53625e);
    for(let row=1;row<=8;row++){
      box(museum?0xbcb9ad:0xadae9f,50.8,1.15+row*3.69,north,.38,.4,length);
    }
    if(museum){
      slab(0x777d75,51,north,8,32,0,7.8);
      entrance(51,north,8,24,false,0x4e6a73,5.2);
      label("대한민국역사박물관",46.95,north,6.76,22,false);
      for(let i=0;i<4;i++)box(0x667c62,68,32.27,north-26+i*8,3.5,.54,7);
    }else{
      entrance(east,north,62,18,false,0x556761);
      for(let i=0;i<39;i++){
        box(0x515e59,47.35,1.3,north-length/2+i*length/38,.10,2.6,.10);
      }
      for(const h of [.36,2.14])box(0x515e59,47.35,h,north,.1,.13,length);
    }
  }

  const cube=new T.BoxGeometry(1,1,1);
  const transform=new T.Object3D(),tint=new T.Color();
  const masonry=new T.MeshStandardMaterial({roughness:.9});
  const glazing=new T.MeshStandardMaterial({roughness:.54,metalness:.19});
  const screensMaterial=new T.MeshBasicMaterial({color:0xe0e3e6});
  const backdrop=new T.MeshStandardMaterial({roughness:.92});
  for(const [east,north,build] of [[-96,204,sejongCenter],[-96,140,sejongAnnex],[-91,68,hyundai],[-146,470,government],[87,52,kyobo],
    [82,184,kt],[82,291,()=>civicEast(291,false)],[82,385,()=>civicEast(385,true)]]){
    at(east,north);build();
    renderBatch(stone,masonry,true);
    renderBatch(glass,glazing,false,true);
    renderBatch(screens,screensMaterial,false,true);
    stone=[];glass=[];screens=[];
    yield;
  }

  // Secondary blocks sit behind the recognizable frontage and leave the gate's sightline open.
  for(const [east,north,width,length,height,color] of [
    [-168,67,61,52,48,0x899496],[-206,130,54,58,76,0x859598],
    [-174,182,42,46,58,0x86979c],[-215,230,56,62,91,0x7d9195],
    [-173,316,53,65,52,0x99a39e],[-227,397,58,63,68,0x899b9f],
    [161,38,66,58,95,0x82969e],[167,120,59,61,66,0x91a0a2],
    [188,188,66,49,103,0x81959c],[164,258,53,59,71,0x8a9ca0],
    [168,343,60,56,57,0x90a1a1],[171,419,48,57,52,0x96a49e],
  ]){
    at(east,north);
    slab(color,east,north,width,length,0,height,distant);
    slab(0x8b9795,east,north,width*.68,length*.67,height,3.6,distant);
    for(let h=7;h<height-2;h+=6){
      const side=Math.sign(east),front=east-side*(width/2+.05);
      box(0x667e87,front,h,north,.16,3.2,length*.87,distant);
    }
    renderBatch(distant,backdrop);
    distant=[];
    yield;
  }

  function renderBatch(entries,material,shadows=false,detail=false){
    if(!entries.length)return;
    const mesh=new T.InstancedMesh(cube,material,entries.length);
    for(const [index,part] of entries.entries()){
      const p=plazaAt(part.east,part.north);
      transform.position.set(wx(p.x),part.level,wz(p.y));
      transform.scale.set(part.width,part.height,part.length);
      transform.updateMatrix();
      mesh.setMatrixAt(index,transform.matrix);
      mesh.setColorAt(index,tint.setHex(part.color));
    }
    mesh.castShadow=shadows;mesh.receiveShadow=true;
    mesh.userData.terrainAnchor=terrainAnchor;
    mesh.userData.streamStatic=true;mesh.userData.streamDetail=detail;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
}
