import {at,gbInnerCompounds,gbSite,gbSites} from "./gyeongbok-layout.js";

const rotateInCompound=(east,north,compound,turn=compound.turn??0)=>{
  if(!turn)return [east,north];
  const [west,right,south,top]=compound.bounds,c=Math.cos(turn),s=Math.sin(turn);
  const x=(west+right)/2,z=(south+top)/2,dx=east-x,dz=north-z;
  return [x+dx*c-dz*s,z+dx*s+dz*c];
};

export function inGyeongbokCompound(east,north){
  return gbInnerCompounds.some(compound=>{
    const [west,right,south,top]=compound.bounds;
    const [e,n]=rotateInCompound(east,north,compound,-(compound.turn??0));
    return e>west-2&&e<right+2&&n>south-2&&n<top+2;
  });
}

const finishes={
  natural:{wood:0x644235,lattice:0x45352c,plaster:0xdfd6bf,bracket:0x725043,fascia:0x5f3e32},
  dancheong:{wood:0x8f5143,lattice:0x31534a,plaster:0xd8cfac,bracket:0x54816a,fascia:0x3c6455},
  restored:{wood:0x744b3b,lattice:0x41392f,plaster:0xe2d7be,bracket:0x426b58,fascia:0x3b5c4e},
  service:{wood:0x725147,lattice:0x503d32,plaster:0xe3d8bd,bracket:0x705249,fascia:0x6a4c41},
  library:{wood:0x733e33,lattice:0x305d51,plaster:0xa77b65,bracket:0x4f7765,fascia:0x426e60}
};
const granite=0xa9a59a,darkerStone=0x908c81;

export function* buildGyeongbokCompounds(T,root,{wx,wz,box,cylinder},{wall,block,plot,nameplate,materials,treeKit},groups){
  const world=(east,north)=>{const p=at(east,north);return {x:wx(p.x),z:wz(p.y)};};
  const rect=(west,right,south,top)=>[at(west,south),at(right,south),at(right,top),at(west,top)];
  function solid(east,north,width,depth,angle=0,top){
    const p=world(east,north);block(p.x,p.z,width,depth,angle,top);
  }
  function part(color,east,north,width,depth,height,base=0){
    const p=world(east,north);return box(color,p.x,base+height/2,p.z,width,height,depth);
  }
  function followGround(mesh){
    mesh.userData.followTerrain=true;mesh.userData.sharedTerrainGeometry=true;
    return mesh;
  }
  const tiles=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const roll=Math.cos((x%16)/16*Math.PI*2),joint=y%16===0?-.8:0;
    const tone=56+Math.round(8*roll+7*joint+(x*11+y*23)%4);
    tiles.set([tone-3,tone,tone+4,255],(y*64+x)*4);
  }
  const tileTexture=new T.DataTexture(tiles,64,64,T.RGBAFormat);
  tileTexture.wrapS=tileTexture.wrapT=T.RepeatWrapping;tileTexture.colorSpace=T.SRGBColorSpace;
  tileTexture.magFilter=T.LinearFilter;tileTexture.minFilter=T.LinearMipmapLinearFilter;
  tileTexture.generateMipmaps=true;tileTexture.needsUpdate=true;
  const tileMaterial=new T.MeshStandardMaterial({map:tileTexture,side:T.DoubleSide,roughness:.9});

  function roof(group,w,d,eave,rise,hip){
    const verts=[],uv=[],ridge=w*(hip?.33:.445);
    const point=(side,t,u)=>{
      const length=w/2+(ridge-w/2)*t,y=eave+rise*(t*.42+t*t*.58)+Math.abs(u)**5*(1-t)**2*.29;
      if(side<2)return [u*length,y,(side?1:-1)*d/2*(1-t)];
      return [(side===2?1:-1)*length,y,u*d/2*(1-t)];
    };
    for(let side=0;side<4;side++){
      const span=side<2?w:d;
      for(let row=0;row<6;row++)for(let col=0;col<14;col++){
        for(const [dr,dc] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
          const t=(row+dr)/6,u=(col+dc)/14;
          verts.push(...point(side,t,2*u-1));uv.push(u*span/1.25,t*d*.29);
        }
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(verts,3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
    const covering=new T.Mesh(geometry,tileMaterial);covering.castShadow=covering.receiveShadow=true;group.add(covering);
    box(0x6e7169,0,eave+rise+.07,0,ridge*2+.21,.14,.23,group);
    box(0x3c4142,0,eave+rise+.19,0,ridge*2+.26,.11,.25,group);
    for(const side of [-1,1]){
      box(0x494d4b,side*(ridge+.08),eave+rise+.24,0,.23,.20,.29,group);
      box(0x40352b,0,eave-.075,side*(d/2-.18),w-.18,.12,.20,group);
    }
  }

  function shell({name,sign="",east,north,w,d,h,bays=4,finish="natural",angle=0,gate=false,hip=false,raised=.48}){
    const {wood,lattice,plaster,bracket,fascia}=finishes[finish];
    const p=world(east,north),group=new T.Group();
    group.name=name;group.position.set(p.x,0,p.z);group.rotation.y=angle;root.add(group);
    const piece=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,group);
    const spacing=w/bays;
    if(gate){
      for(const side of [-1,1]){
        piece(granite,side*(w/2-.20),.13,0,.58,.26,d+.27);
        piece(wood,side*(w/2-.20),1.5,0,.28,2.60,d-.13);
        piece(wood,side*(w/2-.42),1.34,-.10,.51,2.26,.21);
        const x=p.x+side*(w/2-.20)*Math.cos(angle),z=p.z-side*(w/2-.20)*Math.sin(angle);
        block(x,z,.53,d+.10,angle,2.81);
      }
    }else{
      piece(darkerStone,0,-.49,0,w+1.55,1,d+1.22);
      piece(darkerStone,0,raised*.25,0,w+1.58,raised*.5,d+1.26);
      piece(granite,0,raised*.75,0,w+1.50,raised*.5,d+1.15);
      block(p.x,p.z,w+1.50,d+1.15,angle,raised);
      block(p.x,p.z,w-.20,d-.15,angle);
      for(const side of [-1,1]){
        for(let i=0;i<=bays;i++){
          const x=-w/2+i*spacing;
          piece(granite,x,raised+.09,side*d*.49,.46,.18,.45);
          piece(wood,x,raised+h/2+.08,side*d*.49,.23,h-.10,.25);
          piece(bracket,x,raised+h-.18,side*d*.49,.38,.30,.44);
        }
        for(let i=0;i<bays;i++){
          const x=-w/2+(i+.5)*spacing,doorWidth=spacing*.66;
          piece(plaster,x,raised+h*.48,side*d*.48,spacing-.20,h*.84,.16);
          if(finish==="service"&&i%2===0)continue;
          piece(lattice,x,raised+h*.51,side*(d*.49+.085),doorWidth,h*.66,.11);
          piece(0xc6b895,x,raised+h*.61,side*(d*.49+.155),doorWidth-.19,h*.35,.038);
          for(const k of [-.31,-.16,0,.16,.31])piece(lattice,x+doorWidth*k,raised+h*.61,side*(d*.49+.185),.038,h*.38,.035);
          for(const dy of [-.115,.0,.115])piece(lattice,x,raised+h*(.61+dy),side*(d*.49+.187),doorWidth-.16,.036,.035);
        }
        piece(plaster,side*(w/2-.08),raised+h*.46,0,.16,h*.85,d-.30);
        piece(wood,side*(w/2+.02),raised+h*.32,0,.12,.14,d-.16);
      }
      for(let i=0;i<3;i++){
        const height=raised*(i+1)/3,z=d/2+1.08-i*.24;
        const stairWidth=Math.min(3.8,w*.42);
        piece(granite,0,height/2,z,stairWidth,height,.26);
        block(p.x+z*Math.sin(angle),p.z+z*Math.cos(angle),stairWidth,.28,angle,height);
      }
    }
    for(const side of [-1,1]){
      piece(fascia,0,raised+h-.03,side*(d/2+.02),w+.32,.34,.22);
      if(["dancheong","restored","library"].includes(finish)){
        piece(0xbb8059,0,raised+h+.082,side*(d/2+.143),w+.21,.042,.025);
        piece(0x263c42,0,raised+h-.138,side*(d/2+.143),w+.21,.044,.025);
        for(let i=0;i<=bays*3;i++){
          const x=-w*.48+i*w*.96/(bays*3),tone=i%3===0?0xcba16d:0x79946a;
          piece(tone,x,raised+h-.024,side*(d/2+.151),.12,.107,.027);
        }
      }
    }
    roof(group,w+1.96,d+1.62,raised+h+.14,gate?.88:Math.min(2.04,d*.23),hip||gate);
    if(sign)nameplate(sign,group,0,raised+h-.26,d/2+.21,Math.min(2.5,w*.60),.42,"#43352b","#f0d9a8");
    return group;
  }

  const annex=(east,north,w,d,extra={})=>shell({east,north,w,d,h:2.55,bays:Math.ceil(w/3.5),raised:.36,...extra});
  function joinGaps(compound,from,to,gap,height){
    const vertical=from[0]===to[0],a=vertical?from[1]:from[0],b=vertical?to[1]:to[0];
    const dot=value=>rotateInCompound(vertical?from[0]:value,vertical?value:from[1],compound);
    const ends=gap?[a,gap[0],gap[1],b]:[a,b];
    for(let i=0;i<ends.length;i+=2){
      const [e1,n1]=dot(ends[i]),[e2,n2]=dot(ends[i+1]);
      const length=Math.hypot(e2-e1,n2-n1);
      if(length<=.4)continue;
      wall(at(e1,n1),at(e2,n2),height,false,false);
      if(compound.id==="hamhwadang"){
        const center=world((e1+e2)/2,(n1+n2)/2);
        const angle=Math.atan2(n2-n1,e2-e1);
        followGround(box(0x966e5b,center.x,height-.15,center.z,length+.19,.18,.58)).rotation.y=angle;
        followGround(box(0xb28e79,center.x,height-.25,center.z,length+.20,.029,.59)).rotation.y=angle;
      }
    }
    if(!gap)return;
    const [east,north]=dot((gap[0]+gap[1])/2),angle=(compound.turn??0)+(vertical?Math.PI/2:0);
    shell({east,north,w:Math.min(4.8,gap[1]-gap[0]-.7),d:1.65,h:2.58,bays:1,angle,gate:true,raised:.05,
      finish:compound.id==="taewonjeon"||compound.id==="gyejodang"?"dancheong":"natural"});
  }
  for(const compound of gbInnerCompounds){
    const {bounds:[west,right,south,top],style,split}=compound;
    const point=(east,north)=>at(...rotateInCompound(east,north,compound));
    const height=style==="low"?1.55:2.30;
    plot([point(west,south),point(right,south),point(right,top),point(west,top)],materials.gravel,.047);
    joinGaps(compound,[west,south],[right,south],compound.south,height);
    joinGaps(compound,[west,top],[right,top],compound.north,height);
    joinGaps(compound,[west,south],[west,top],compound.west,height);
    joinGaps(compound,[right,south],[right,top],compound.east,height);
    if(split){
      const [e,n1,n2,low,high]=split;
      joinGaps(compound,[e,n1],[e,n2],[low,high],1.65);
    }
    yield;
  }

  for(const spec of gbSites.filter(spec=>spec.kind==="inner")){
    groups.set(spec.id,shell({...spec,raised:spec.finish==="dancheong"?.63:.47,hip:spec.finish==="dancheong"}));
    yield;
  }

  // Low linked hall wings leave the dry courts open. The taller halls above
  // remain distinct from the surrounding 행각 and service rooms.
  for(const row of [
    [73,225,13,4.2,{angle:Math.PI/2,finish:"dancheong"}],
    [91,288,17,5.2,{}],[133,288,17,5.2,{}],[93,339,24,4.6,{}],[134,339,19,4.7,{}],
    [105,367,13,5.1,{finish:"service"}],[146,367,24,5.1,{finish:"service"}],
    [157,386,19,5.2,{angle:Math.PI/2,finish:"service"}],[114,422,20,5.8,{finish:"service"}],
    [100,408,22,5.2,{angle:Math.PI/2,finish:"service"}],
    [94,485,12,5.4,{name:"복안당",sign:"福安堂"}],[126,475,8.4,6.0,{name:"청연루",sign:"清讌樓",raised:.71}],
    [17,561.3,51,4.9,{finish:"restored"}],[43.8,552,18.2,4.9,{angle:Math.PI/2,finish:"restored"}],[-10.5,552.5,13.5,4.8,{angle:Math.PI/2,finish:"restored"}],
    [10,642,17,4.6,{}],[45,642,20,4.6,{}],[27.65,627,13.6,3.4,{raised:.42}],
    [-222,733,18,5.2,{angle:Math.PI/2+.24}],[-205,765,26,5.3,{angle:.24}],[-150,755,17,5.0,{angle:Math.PI/2+.24}],
    [17,780,16,4.2,{}],[57,780,19,4.2,{}],[21,813,21,4.8,{}],[54,813,24,4.9,{}],
    [-67.55,824.3,4.1,3.5,{finish:"library",raised:.59}],[-45.45,824.3,2.3,3.5,{finish:"library",raised:.54}]
  ]){
    annex(...row);
    yield;
  }

  const oct=gbSite.parujeong,p=world(oct.east,oct.north),octagon=new T.Group();
  octagon.name=oct.name;octagon.position.set(p.x,0,p.z);root.add(octagon);groups.set(oct.id,octagon);
  cylinder(granite,0,.11,0,3.28,.74,8,octagon);
  cylinder(0xa1705a,0,1.46,0,2.52,2.40,8,octagon);
  cylinder(0x3f4c4d,0,2.81,0,3.42,.25,8,octagon,.82);
  cylinder(0x684b3b,0,3.93,0,2.45,2.30,8,octagon);
  cylinder(0x3e4749,0,5.20,0,3.65,.39,8,octagon,.84);
  cylinder(0x444d4e,0,6.05,0,3.45,1.43,8,octagon,.08);
  cylinder(0xa39b80,0,6.93,0,.16,.50,8,octagon,.66);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,r=2.42;
    const panel=box(0x31584d,Math.sin(a)*r,3.87,Math.cos(a)*r,1.42,1.48,.14,octagon);
    panel.rotation.y=a;
    const paper=box(0xd5c19f,Math.sin(a)*(r+.085),4.02,Math.cos(a)*(r+.085),1.15,.82,.075,octagon);paper.rotation.y=a;
  }
  block(p.x,p.z,6,2.7,0,.48);
  block(p.x,p.z,2.7,6,0,.48);
  block(p.x,p.z,5.06,5.06,0,5.45);
  yield;

  // Four six-sided brick chimneys rise behind Gyotaejeon on Amisan's stone tiers.
  for(let tier=0;tier<4;tier++){
    const west=-15+tier*.75,right=30-tier*.7,north=478+tier*4.05,depth=4.45,height=(tier+1)*.24;
    followGround(part(granite,(west+right)/2,north,right-west,depth,height+.16,-.16));
    followGround(part(0x75824e,(west+right)/2,north+.13,right-west-1.04,depth-.58,.08,height));
    for(let i=0;i<Math.floor((right-west)/1.5);i++){
      followGround(part(i%3?0xa29c8d:0xb5ac9c,west+.76+i*1.5,north-depth/2,1.46,.19,.22,height-.23));
    }
    solid((west+right)/2,north,right-west,depth,0,height);
  }
  for(const east of [-6,2,10,18]){
    const north=489.9,p=world(east,north);
    cylinder(darkerStone,p.x,.94,p.z,1.17,.29,6);
    cylinder(0x9b6854,p.x,2.09,p.z,.84,2.13,6);
    for(let y=1.37;y<3.14;y+=.27)cylinder(0xb0836c,p.x,y,p.z,.849,.025,6);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      const motif=box(0xc4b190,p.x+.781*Math.sin(a),2.27,p.z+.781*Math.cos(a),.29,.58,.045);
      motif.rotation.y=a;
    }
    cylinder(0x3b4140,p.x,3.19,p.z,.99,.20,6);
    cylinder(0x424b48,p.x,3.41,p.z,.97,.31,6,root,.46);
    cylinder(0x777068,p.x,3.66,p.z,.18,.25,6);
    solid(east,north,1.69,1.69,0,3.5);
  }
  yield;

  const chimney=gbSite["jagyeong-chimney"],chimneyOrigin=world(chimney.east,chimney.north-.63);
  const relief=new T.Group();relief.name=chimney.name;relief.position.set(chimneyOrigin.x,0,chimneyOrigin.z);root.add(relief);
  const carving=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,relief);
  carving(granite,0,.34,0,7.7,.68,1.25);
  carving(0xa46552,0,1.51,0,7.2,1.94,1.06);
  carving(0x65615a,0,2.55,0,7.4,.19,1.29);
  carving(0x434c46,0,2.69,0,7.55,.14,1.36);
  carving(0xa77b64,0,1.56,.557,6.76,1.31,.075);
  carving(0x75695b,0,1.56,.601,6.25,1.07,.035);
  for(let row=0;row<7;row++){
    for(let column=0;column<16;column++){
      const x=-3.37+(column+(row%2)*.5)*.428,y=.75+row*.246;
      if(y>.98&&y<2.12&&Math.abs(x)<3.20)continue;
      carving(column%3===0?0xa57560:0xa46c59,x,y,.55,.39,.208,.062);
    }
  }
  for(const x of [-2.55,-1.23,1.10,2.39]){
    const height=1.21+(Math.abs(x)%1)*.36;
    carving(0xc0a388,x,1.53,.636,.075,height*.62,.052);
    for(let i=0;i<3;i++){
      const branch=carving(0xb0a180,x+.18*(i%2?1:-1),1.52+i*.155,.647,.34,.075,.050);
      branch.rotation.z=i%2?-.26:.25;
    }
  }
  const sun=cylinder(0xc6a378,.11,1.91,.647,.19,.043,14,relief);sun.rotation.x=Math.PI/2;
  for(let i=0;i<5;i++){
    const x=-2.88+i*1.44;
    carving(0x786e60,x,2.88,-.04,.49,.31,.66);
    carving(0x494e49,x,3.09,-.04,.58,.11,.75);
  }
  solid(chimney.east,chimney.north-.63,7.7,1.25,0,3.2);
  yield;

  // Janggo storage yard and kitchen jars. Opaque ceramic profiles, low stands,
  // and a quiet dirt surface distinguish it from an ordinary planted bed.
  plot(rect(-99,-67,605,626),materials.gravel,.046);
  for(const edge of [[-99,605,-99,626],[-99,626,-67,626],[-67,610,-67,626],[-99,605,-78,605]]){
    const [a,b,c,d]=edge;wall(at(a,b),at(c,d),.78,false,false);
  }
  function jar(east,north,size,tone){
    const p=world(east,north),color=[0x645043,0x5a4337,0x784d3a,0x6d5244][tone%4];
    cylinder(granite,p.x,.07,p.z,size*.60,.14,10);
    cylinder(color,p.x,size*.41+.14,p.z,size*.50,size*.64,12,root,1.35);
    cylinder(color,p.x,size*.97+.14,p.z,size*.68,size*.50,12,root,.62);
    cylinder(0x4d433c,p.x,size*1.24+.14,p.z,size*.46,.10,12,root,.88);
    solid(east,north,size*1.18,size*1.18,0,size*1.24+.2);
  }
  for(let row=0;row<5;row++)for(let col=0;col<9;col++){
    if(row===0&&col>5)continue;
    jar(-95+col*2.94,609+row*3.19,.75+(row*7+col*3)%6*.075,row+col);
  }
  for(let i=0;i<8;i++)jar(154.3,397.9+i*2.2,.66+i%3*.10,i);
  yield;

  // The compacted earth routes are kept clear by short rope stakes; red shrubs
  // stay outside the visitor path around the southern edge of Hyangwonji.
  const edges=[
    [[68,618],[69,625],[69,632],[69,640],[67,649],[64,656],[60,662]],
    [[-23,665],[-26,671],[-29,678],[-32,685]],
    [[-26,592],[-25,599],[-22,606],[-20,613],[-19,620]]
  ];
  const cordColor=0x978363,stakeColor=0x77664e;
  for(const line of edges){
    for(const [e,n] of line){
      const {x,z}=world(e,n);
      cylinder(stakeColor,x,.32,z,.075,.64,7);
      cylinder(0x9d8a69,x,.65,z,.093,.065,7);
      solid(e,n,.14,.14,0,.68);
    }
    for(let i=1;i<line.length;i++){
      const a=world(...line[i-1]),b=world(...line[i]);
      for(let step=0;step<4;step++){
        const pos=t=>new T.Vector3(a.x+(b.x-a.x)*t,.56-Math.sin(t*Math.PI)*.125,a.z+(b.z-a.z)*t);
        const from=pos(step/4),to=pos((step+1)/4),direction=to.clone().sub(from),center=from.clone().addScaledVector(direction,.5);
        const cord=followGround(cylinder(cordColor,center.x,center.y,center.z,.016,direction.length()+.018,5));
        cord.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
      }
    }
  }
  for(const [e,n,w,d] of [[64.5,657,8,4.3],[-20,664,9,3.8],[-16,601,6.8,3.4],[70,584,8.5,4.1]]){
    plot(rect(e-w/2,e+w/2,n-d/2,n+d/2),materials.garden.lawn,.036);
    for(let i=0;i<5;i++){
      const p=world(e-w*.39+i*w*.19,n+Math.sin(i*2.2)*.80);
      treeKit.shrub(p.x,p.z,.42+i%3*.08,i===3?"olive":i%2?"russet":"maple");
    }
  }
  yield;

  // The modern museum reproduces a pagoda-shaped tower, flanking halls and
  // broad stone stairs. Its exterior is distinct from the palace timber halls.
  const museum=gbSite["folk-museum"],museumOrigin=world(museum.east,museum.north),museumModel=new T.Group();
  museumModel.name=museum.name;museumModel.position.set(museumOrigin.x,0,museumOrigin.z);root.add(museumModel);
  groups.set(museum.id,museumModel);
  const museumPart=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,museumModel);
  const wallStone=0xbcbab0,edgeStone=0x9e9f96;
  museumPart(edgeStone,0,-.30,0,74.6,2.8,45.6);
  museumPart(wallStone,0,3.68,1.4,72.3,5.16,40.6);
  museumPart(0x9b9c91,0,6.34,1.4,73.8,.42,41.4);
  for(const side of [-1,1]){
    const wing=new T.Group();wing.position.x=side*25.8;museumModel.add(wing);
    museumPart(0xc0bdb0,side*25.8,9.02,-5.7,18.9,5.0,20.0);
    for(let i=0;i<5;i++)museumPart(0x6f7774,side*25.8+(i-2)*3.26,9.16,4.4,1.86,2.8,.11);
    roof(wing,21.4,22.6,11.75,3.25,true);
    for(let i=0;i<7;i++)museumPart(0xa5a79c,side*(14.7+i*3.16),4.05,21.76,.59,4.0,.56);
    yield;
  }
  museumPart(wallStone,0,8.29,-.5,28,4.25,26.3);
  museumPart(edgeStone,0,10.49,-.5,28.6,.35,26.8);
  let height=10.69;
  for(const [i,w] of [22.5,18.45,15.12,11.70,8.55].entries()){
    const storey=new T.Group();storey.position.set(0,0,-.5);museumModel.add(storey);
    const h=i===0?4.30:3.47;
    museumPart(i%2?0xa9a99a:0xb8b6aa,0,height+h/2,-.5,w-1.6,h,w*.91-1.5);
    for(const side of [-1,1])for(let panel=0;panel<5;panel++){
      const x=(panel-2)*w*.15;
      museumPart(0x67716c,x,height+h*.48,-.5+side*(w*.455-.71),w*.095,h*.53,.12);
      museumPart(0x939c8e,x,height+h*.69,-.5+side*(w*.455-.62),w*.111,.12,.13);
    }
    roof(storey,w,w*.91,height+h,.96+i*.08,true);
    height+=h+.22;
    yield;
  }
  cylinder(0x747870,0,height+1.50,-.5,.37,2.6,10,museumModel,.47);
  for(let i=0;i<15;i++){
    const rise=(i+1)*.193,z=27.1-i*.42;
    museumPart(granite,0,rise/2,z,16.6,rise,.43);
    block(museumOrigin.x,museumOrigin.z+z,16.6,.43,0,rise);
  }
  for(const side of [-1,1])museumPart(edgeStone,side*8.75,1.45,23.86,.78,2.9,6.8);
  museumPart(0x545b58,0,4.44,21.81,13.3,4.1,.13);
  nameplate(museum.name,museumModel,0,7.23,22.05,9.2,.89,"#68716e","#efe9d9");
  solid(museum.east,museum.north,74.6,45.6,0);
}
