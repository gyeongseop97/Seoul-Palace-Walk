import {standBatcher,standSign} from "./regional-stands.js";
import {parkBoundary,parkWalkways,parkRides,parkEntrance} from "./gyeongju-world-layout.js";

const wood=0x77513a,darkWood=0x50382d,oak=0xbc824c,iron=0x425158,brass=0xc49b52;
const stone=0xb2a58d,white=0xf5ecda,steel=0x9eafaf,waterBlue=0x578396;
const walls={restaurant:0xebcfa4,snack:0xf2d9aa,cafe:0xe7ceac,info:0xe2e8df,
  restroom:0xd8d3b8,locker:0xd2d9cb,firstaid:0xead9b4};
const accents={restaurant:0x933e32,snack:0x3c7e84,cafe:0x355c4b,info:0x346b80,
  restroom:0x56786b,locker:0x416a72,firstaid:0x36745e};

function guideMap(T,group,w,x,y,z){
  if(typeof document==="undefined")return;
  const canvas=document.createElement("canvas");
  canvas.width=680;canvas.height=430;
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  ctx.fillStyle="#f1e7c7";ctx.fillRect(0,0,680,430);
  ctx.fillStyle="#315855";ctx.fillRect(0,0,680,57);
  ctx.fillStyle="#fff7de";ctx.font='bold 31px "Malgun Gothic",sans-serif';
  ctx.fillText("경주월드 가이드맵",19,40);
  const bounds=parkBoundary.reduce((b,p)=>[Math.min(b[0],p.x),Math.min(b[1],p.z),Math.max(b[2],p.x),Math.max(b[3],p.z)],[Infinity,Infinity,-Infinity,-Infinity]);
  const pos=p=>[25+435*(p.x-bounds[0])/(bounds[2]-bounds[0]),78+325*(p.z-bounds[1])/(bounds[3]-bounds[1])];
  function trace(points){
    ctx.beginPath();
    points.forEach((p,i)=>{const [x,y]=pos(p);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
  }
  ctx.fillStyle="#94b595";trace(parkBoundary);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#fbf1cd";ctx.lineWidth=6;ctx.lineCap="round";ctx.lineJoin="round";
  for(const road of parkWalkways){trace(road);ctx.stroke();}
  const tones=["#ad5548","#476e92","#965687","#388978","#a16e30","#596e4b","#9171a2"];
  const font='bold 17px "Malgun Gothic",sans-serif';
  parkRides.forEach((ride,i)=>{
    const [px,py]=pos(ride),row=90+i*36;
    for(const [cx,cy] of [[px,py],[497,row]]){
      ctx.fillStyle=tones[i%tones.length];ctx.beginPath();ctx.arc(cx,cy,11,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=font;ctx.fillText(String(i+1),cx,cy+1);
    }
    ctx.textAlign="left";ctx.fillStyle="#293c3c";ctx.font=font;ctx.fillText(ride.name,515,row,153);
  });
  const [gx,gy]=pos(parkEntrance);
  ctx.fillStyle="#b54138";ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx-6,gy+12);ctx.lineTo(gx+6,gy+12);ctx.fill();
  ctx.fillStyle="#345854";ctx.textAlign="right";ctx.font=font;ctx.fillText("정문",gx-7,gy+10);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const mesh=new T.Mesh(new T.PlaneGeometry(w,w*430/680),new T.MeshBasicMaterial({map}));
  mesh.position.set(x,y,z);group.add(mesh);
}

export function buildParkFacilities(T,root,kit,services){
  const batch=standBatcher(T),sphere=new T.SphereGeometry(1,12,8),ring=new T.TorusGeometry(1,.13,6,16);
  const triangle=new T.BufferGeometry();
  triangle.setAttribute("position",new T.Float32BufferAttribute([-.5,0,0,.5,0,0,0,1,0],3));triangle.computeVertexNormals();
  const lit=new T.MeshStandardMaterial({color:0xffe1a3,emissive:0xffb654,roughness:.65});
  const up=new T.Vector3(0,1,0);
  for(const shop of services){
    const {w,d,type}=shop,edge=d/2,half=w/2,accent=accents[type]??iron,wall=walls[type]??white;
    const group=new T.Group();group.name=shop.name;group.position.set(shop.x,0,shop.z);
    group.rotation.y=(shop.heading??0)*Math.PI/180;root.add(group);
    const bulbs=[];
    const box=(color,x,y,z,w,h,d)=>kit.box(color,x,y,z,w,h,d,group);
    const cyl=(color,x,y,z,r,h,top=1,n=12)=>kit.cylinder(color,x,y,z,r,h,n,group,top);
    const ell=(color,x,y,z,a,b,c)=>{const p=kit.shape(sphere,color,x,y,z,group);p.scale.set(a,b,c);return p;};
    const hoop=(color,x,y,z,r)=>{const p=kit.shape(ring,color,x,y,z,group);p.scale.setScalar(r);return p;};
    const sign=(text,sub,x,y,z,width,height,back,ink="#fff3d5")=>
      standSign(T,group,text,sub,width,x,y,z,back,ink,height);
    function beam(color,x1,y1,z1,x2,y2,z2,r){
      const v=new T.Vector3(x2-x1,y2-y1,z2-z1);
      const p=cyl(color,(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,r,v.length(),1,8);
      p.quaternion.setFromUnitVectors(up,v.normalize());
      return p;
    }
    function timber(color,x1,y1,z1,x2,y2,z2,width,depth=width){
      const v=new T.Vector3(x2-x1,y2-y1,z2-z1);
      const p=box(color,(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,width,v.length(),depth);
      p.quaternion.setFromUnitVectors(up,v.normalize());
      return p;
    }
    function lamp(x,y,z){
      cyl(iron,x,y+.25,z,.025,.4);cyl(brass,x,y+.035,z,.235,.14,.25);
      bulbs.push([x,y-.065,z,.105,.095,.105]);
    }
    function counter(x,z,width){
      box(accent,x,.53,z,width,1.06,.64);
      box(oak,x,.54,z+.328,width-.12,.78,.055);
      const panels=Math.max(2,Math.round(width/.8));
      for(let i=1;i<panels;i++)box(wood,x-width/2+i*width/panels,.54,z+.36,.035,.77,.026);
      box(0xe7d7b7,x,1.09,z,width+.14,.13,.82);
      const pos=x+width*.31;
      box(iron,pos,1.22,z,.29,.12,.22);box(iron,pos,1.38,z,.40,.27,.08).rotation.x=-.13;
      box(0x8bb8af,pos,1.40,z+.042,.31,.16,.019).rotation.x=-.13;
    }
    function attendant(x,z,coat,hat){
      const skin=0xc79270,hair=0x46352d;
      for(const side of [-1,1]){
        cyl(0x444c4a,x+side*.093,.42,z,.094,.81,.91);
        ell(iron,x+side*.091,.09,z+.035,.113,.075,.16);
      }
      ell(coat,x,1.03,z,.236,.352,.164);
      box(white,x,1.03,z+.13,.25,.45,.065);
      ell(skin,x,1.54,z,.158,.204,.147);
      ell(hair,x,1.66,z-.011,.163,.114,.148);
      cyl(hat,x,1.73,z,.165,.11,1.03);ell(hat,x,1.692,z+.065,.18,.029,.15);
      for(const side of [-1,1]){
        ell(hair,x+side*.057,1.56,z+.136,.014,.014,.012);
        beam(coat,x+side*.164,1.23,z,x+side*.23,1.0,z+.06,.082);
        beam(skin,x+side*.23,1.0,z+.06,x+side*.176,1.03,z+.22,.056);
      }
    }
    function planter(x,z){
      cyl(0x975c43,x,.29,z,.32,.54,.82);cyl(0xca8861,x,.55,z,.34,.11);
      for(let i=0;i<7;i++){
        const ang=i*2.4,dx=Math.cos(ang)*.2,dz=Math.sin(ang)*.2;
        ell([0x647943,0x738a49,0x496b4b][i%3],x+dx,.7+i%2*.08,z+dz,.18,.24,.15);
        ell(i%2?0xda9a74:0xe6c464,x+dx,.87+i%2*.08,z+dz,.08,.053,.073);
      }
    }
    function floor(){
      box(0x978e7b,0,.035,0,w+.20,.07,d+.18);
      const nx=Math.ceil(w/1.55),nz=Math.ceil(d/1.48);
      for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
        const color=[0xd6c4a5,0xdacbad,0xcfc2a5,0xe2d2b2][(ix*3+iz*7)%4];
        box(color,-half+(ix+.5)*w/nx,.078,-edge+(iz+.5)*d/nz,w/nx-.025,.025,d/nz-.025);
      }
    }
    function hall(height,trim=wood){
      floor();
      box(wall,0,height/2,-edge,w,height,.19);
      for(const side of [-1,1]){
        box(wall,side*(half-.07),height*.5,-d*.235,.17,height,d*.53);
        box(stone,side*(half-.07),.34,0,.23,.61,d);
        for(const z of [-edge,0,edge-.13]){
          box(trim,side*(half-.12),height*.5,z,.21,height,.21);
          box(stone,side*(half-.12),.23,z,.36,.44,.36);
        }
        box(trim,side*(half-.10),height-.1,0,.24,.21,d+.19);
        box(trim,side*(half-.08),1.52,d*.23,.11,.1,d*.48);
        timber(trim,side*(half-.12),height-1,edge-.13,side*(half-.12),height-.15,edge-1,.15);
      }
      box(trim,0,height-.09,edge-.12,w,.22,.25);
    }
    function roof(height,rise,color,trim=wood,tiled=false){
      const span=half+.49,length=Math.hypot(span,rise),ridge=height+rise;
      const pitch=Math.atan2(rise,span);
      for(const side of [-1,1]){
        const panel=box(color,side*span*.5,height+rise*.5,0,length,.15,d+.94);
        panel.rotation.z=-side*pitch;
        box(trim,side*span,height-.025,0,.14,.20,d+.95);
        for(const z of [-edge-.47,edge+.47]){
          timber(trim,side*span,height,z,0,ridge,z,.17,.13);
        }
      }
      if(tiled){
        const lines=Math.ceil((d+.9)/.24);
        for(let k=0;k<=lines;k++){
          const z=-edge-.45+k*(d+.9)/lines;
          for(const side of [-1,1])beam([0xc08b5c,0xdba96e,0xb47b50][k%3],side*span,height+.086,z,0,ridge+.086,z,.065);
        }
      }else{
        const rows=Math.max(4,Math.ceil(span/.8)),cols=Math.max(3,Math.round(d/.98));
        for(const side of [-1,1])for(let i=0;i<rows;i++){
          const fraction=(i+.5)/rows,x=side*span*fraction,y=ridge-rise*fraction+.09;
          for(let j=0;j<cols;j++){
            const z=-(d+.84)/2+(j+.5)*(d+.84)/cols;
            const p=box((i+2*j)%3===0?trim:color,x,y,z,length/rows+.035,.043,(d+.84)/cols-.025);
            p.rotation.z=-side*pitch;
          }
        }
      }
      box(trim,0,ridge+.065,0,.24,.20,d+1.04);
      for(const side of [-1,1]){
        const gable=kit.shape(triangle,wall,0,height,side*edge,group);
        gable.scale.set(w,rise,1);if(side<0)gable.rotation.y=Math.PI;
        box(trim,0,height+rise*.48,side*(edge+.025),.17,rise,.16);
      }
    }
    function menuBoard(x,y,z,width,lines,background){
      const h=width*.43;
      box(wood,x,y,z,width+.13,h+.12,.12);
      sign(lines[0],lines[1],x,y,z+.065,width,h,background);
    }
    function masonry(x,z,width,height){
      const rows=Math.ceil(height/.28),cols=Math.ceil(width/.56);
      for(let row=0;row<rows;row++){
        for(let col=0;col<=cols;col++){
          const left=Math.max(-width/2,(-cols/2+col-(row%2)*.5)*width/cols);
          const right=Math.min(width/2,(-cols/2+col+1-(row%2)*.5)*width/cols);
          if(right-left<=.04)continue;
          box([0xb09d82,0xc2b399,0xc6b08c,0xac987c][(row+col*3)%4],x+(left+right)/2,(row+.5)*height/rows,z,right-left-.025,height/rows-.025,.09);
        }
      }
    }
    function flutedColumn(x,z,height,color){
      box(stone,x,.26,z,.54,.48,.54);
      box(color,x,height*.5,z,.34,height-.30,.34);
      for(const side of [-1,1])box(oak,x+side*.12,height*.5,z+.18,.035,height-.65,.024);
      box(oak,x,height-.29,z,.44,.12,.45);
      box(color,x,height-.16,z,.55,.15,.54);
    }
    function table(x,z,cafe=false){
      const top=cafe?0xe7ce9b:0xae784c;
      cyl(iron,x,.40,z,.09,.67);
      cyl(iron,x,.13,z,.32,.075);
      if(cafe)cyl(top,x,.71,z,.64,.10);
      else box(top,x,.71,z,1.42,.10,1.04);
      for(const side of [-1,1]){
        const sz=z+side*.87;
        for(const dx of [-.20,.20])for(const dz of [-.16,.16])cyl(iron,x+dx,.27,sz+dz,.027,.42);
        box(cafe?0x91a283:oak,x,.445,sz,.52,.09,.47);
        box(cafe?0x91a283:oak,x,.69,sz+side*.21,.50,.38,.07);
      }
      if(cafe){
        cyl(white,x+.13,.846,z,.091,.17,1.1);cyl(0x5a3f2a,x+.13,.932,z,.079,.013);
        hoop(white,x+.23,.858,z,.053);
        cyl(0xbb7753,x-.23,.851,z+.16,.092,.18,1.10);
        ell(0x67894f,x-.23,1.0,z+.16,.11,.12,.10);
      }else{
        cyl(darkWood,x+.47,.79,z-.22,.105,.05);
        ell(brass,x+.47,.835,z-.22,.091,.052,.091);cyl(brass,x+.47,.895,z-.22,.027,.046);
        box(0x927656,x-.48,.845,z-.24,.22,.16,.15);box(white,x-.48,.947,z-.24,.16,.068,.041);
      }
    }
    function espresso(x,z){
      box(iron,x,1.23,z,.88,.13,.51);box(steel,x,1.40,z-.15,.88,.38,.17);
      box(0xbfc5ba,x,1.62,z,.92,.19,.46);
      for(const dx of [-.23,.16]){
        cyl(iron,x+dx,1.49,z+.12,.065,.11);
        cyl(white,x+dx,1.35,z+.11,.066,.115,1.12);
      }
      for(let i=0;i<4;i++)cyl(white,x+(i-1.5)*.14,1.75,z-.035,.063,.11,1.1);
    }
    function mealHall(){
      hall(3.8);roof(3.8,1.55,0x915746,0x724434);
      box(stone,half*.65,4.50,-edge*.57,.82,2.8,.83);
      for(let i=0;i<9;i++)box(i%2?0xae9380:0x99877c,half*.65,3.4+i*.26,-edge*.57,.84,.06,.85);
      box(darkWood,half*.65,5.96,-edge*.57,.96,.15,.98);
      for(const side of [-1,1]){
        flutedColumn(side*(half-.20),edge-.11,3.77,accent);
        timber(wood,side*(half-.1),2.78,edge,side*(half-1.22),3.76,edge,.19);
        table(side*w*.32,d*.11);
        planter(side*(half-.51),edge-.40);
        lamp(side*w*.30,3.32,d*.16);
      }
      for(const k of [-.29,.29])masonry(k*w,edge+.012,w*.34,.52);
      // The deck rail ends on either side of the central walk-in opening.
      for(const side of [-1,1])box(oak,side*w*.31,.58,edge-.01,w*.32,.095,.27);
      const shadeWidth=w*.72,panels=12;
      for(let i=0;i<panels;i++){
        const x=-shadeWidth/2+(i+.5)*shadeWidth/panels,color=i%2?0xe7bf81:accent;
        box(color,x,3.20,edge+.36,shadeWidth/panels,.095,1.18).rotation.x=.19;
        box(color,x,3.02,edge+.92,shadeWidth/panels,.19,.08);
      }
      sign(shop.name,"CANYON VILLAGE",0,4.15,edge+.15,w*.56,.95,"#703b2e");
      const cz=-d*.22;counter(0,cz,w*.69);
      menuBoard(-w*.14,2.30,-edge+.15,w*.48,["꼬치어묵우동 · 덮밥","CANYON KITCHEN"],"#375348");
      for(let i=0;i<3;i++){
        const x=(i-1)*.48-w*.19;
        cyl(steel,x,1.24,cz,.21,.18,1.10);cyl(0x9c7750,x,1.34,cz,.20,.02);
        for(let j=0;j<2;j++){
          const sx=x+j*.08-.04;
          beam(oak,sx-.03,1.32,cz,sx+.03,1.68,cz+.05,.012);
          ell(0xc9975e,sx,1.40,cz,.044,.075,.043);
        }
      }
    }
    function foodHatch(){
      hall(2.94,0x8b6e49);roof(2.94,1.10,0xbf915e,0x825836,true);
      const cz=edge-.13;
      counter(0,cz,w-.44);box(0x456f72,0,.29,edge+.234,w-.26,.18,.05);
      for(const side of [-1,1]){
        box(oak,side*(half-.51),1.87,edge-.14,.39,1.45,.3);
        for(let n=0;n<4;n++)box(0xcbb481,side*(half-.51),1.28+n*.34,edge+.018,.33,.065,.03);
      }
      // Blue splash trim, weathered canopy ends and a raised ring buoy flank the hatch.
      for(const side of [-1,1]){
        cyl(0x847457,side*(half-.16),1.53,edge-.05,.15,2.78);
        for(const h of [1.64,1.71,2.78,2.85])cyl(brass,side*(half-.16),h,edge-.05,.16,.038);
        box(0x328e99,side*(half-.47),2.78,edge-.1,.70,.28,.20);
      }
      const buoy=hoop(0xdb6744,-half+.55,1.84,edge+.14,.34);
      for(let k=0;k<4;k++){
        const angle=k*Math.PI/2;
        const patch=box(white,buoy.position.x+.34*Math.cos(angle),1.84+.34*Math.sin(angle),edge+.14,.108,.086,.105);
        patch.rotation.z=angle;
      }
      sign(shop.name,"FOOD & DRINKS",0,3.37,edge+.15,w*.69,.76,"#765138");
      const x=-w*.27;
      box(iron,x,1.22,cz,.93,.15,.57);box(0xb0996a,x,1.32,cz,.73,.07,.42);
      for(let i=0;i<5;i++){
        const rod=box(i%2?0xd39a4e:0xcc8239,x+(i-2)*.12,1.39,cz,.072,.072,.38);
        rod.rotation.y=.1;
      }
      beam(steel,x-.34,1.25,cz-.21,x-.34,2.07,cz-.21,.046);
      box(steel,x-.13,2.07,cz-.21,.51,.08,.14);
      cyl(brass,x+.07,1.93,cz-.20,.123,.27,.9);cyl(steel,x+.07,1.76,cz-.20,.040,.08);
      const sx=w*.23;
      box(accent,sx,1.26,cz,.83,.20,.44);
      for(const [i,color] of [0xde6d60,0x66bbc6].entries()){
        const cx=sx+(i-.5)*.4;cyl(color,cx,1.58,cz,.158,.48);ell(white,cx,1.83,cz,.169,.063,.169);
        beam(iron,cx,1.42,cz+.12,cx,1.39,cz+.25,.029);
      }
      for(let i=0;i<5;i++)cyl(white,w*.05,1.20+i*.037,cz+.15,.096,.105,1.24);
      attendant(-.25,cz-1.04,0x4d8585,0xdab66f);
      menuBoard(0,2.10,-edge+.16,w*.54,["츄러스 · 슬러쉬","아이스 아메리카노"],"#3a635e");
      for(const side of [-1,1])lamp(side*w*.26,2.77,edge-.30);
    }
    function coffeeParlor(){
      hall(3.43,darkWood);roof(3.43,1.47,0x884b3c,darkWood);
      for(const side of [-1,1]){
        timber(darkWood,side*(half-1.0),3.47,edge+.1,side*w*.22,4.07,edge+.1,.12);
        box(wood,side*(half-.10),2.06,edge-.18,.28,3.92,.29);
        const width=half-1.69,x=side*(1.65+width*.5),front=edge-.13;
        box(wood,x,.46,front,width,.83,.31);
        masonry(x,front+.17,width,.75);
        box(darkWood,x,.89,front,width+.10,.14,.48);
        box(0xd9cbb5,x,2.85,front,width,.48,.28);
        // Open display windows preserve a clear view of the small tables behind them.
        for(const dx of [-.5,0,.5])box(darkWood,x+width*dx,1.83,front,.11,1.98,.19);
        box(wood,x,2.30,front,width,.088,.19);box(wood,x,2.69,front,width+.06,.15,.20);
        for(const dx of [-.37,-.13,.13,.37])box(wood,x+width*dx,2.49,front,.048,.34,.12);
        box(0x8e7652,x,1.08,front,width-.20,.22,.36);
        const leafCount=Math.max(4,Math.floor(width/.22));
        for(let i=0;i<leafCount;i++){
          const dx=(i+.5-leafCount/2)*(width-.22)/leafCount;
          ell(i%2?0x65814e:0x4e7554,x+dx,1.23+(i%3)*.016,front,.16,.13,.14);
          ell(i%3?0xe2a392:0xeac77e,x+dx,1.34,front+.025,.07,.064,.065);
        }
        table(side*w*.32,d*.11,true);
      }
      sign(shop.name,"COFFEE PARLOR",0,3.80,edge+.14,w*.63,.84,"#3e5744");
      hoop(brass,0,4.48,edge+.15,.23);
      const cz=-d*.22;counter(0,cz,w*.68);
      espresso(-w*.18,cz);attendant(w*.06,cz-.76,0x516c5b,0x735947);
      for(let i=0;i<3;i++){
        const x=(i-1)*.36+w*.17;
        cyl(0xdfc398,x,1.41,cz,.105,.43);cyl(wood,x,1.65,cz,.12,.055);
        box(white,x,1.41,cz+.104,.14,.08,.012);
      }
      menuBoard(0,2.29,-edge+.15,w*.43,["에스프레소 · 라떼","COFFEE & TEA"],"#46574a");
      for(const side of [-1,1])lamp(side*w*.25,3.04,0);
    }
    function lowRoof(height){
      box(accent,0,height,0,w+.72,.23,d+.7);
      box(0xa58e6b,0,height-.145,0,w+.74,.075,d+.73);
      box(iron,0,height+.14,-d*.025,w*.82,.13,d*.77);
    }
    function publicService(){
      const h=3.08;
      hall(h,0x706a52);
      if(type==="firstaid"||type==="info")roof(h,.98,type==="firstaid"?0xa66c50:0x50797b,0x6b5b48);
      else lowRoof(h);
      const icon={restroom:"WC",info:"i",locker:"▦",firstaid:"+"}[type]??"i";
      const english={restroom:"RESTROOM",info:"INFORMATION",locker:"LOCKERS",firstaid:"FIRST AID"}[type];
      sign(shop.name,english,0,h-.14,edge+.09,w*.70,.66,type==="info"?"#335d6b":"#436258");
      if(type==="info"){
        const mapW=Math.min(3.42,w*.56),mapX=-w*.12;
        for(const dx of [-.35,.35])box(wood,mapX+dx*mapW,.91,edge-.83,.13,1.75,.13);
        box(oak,mapX,1.74,edge-.81,mapW+.14,mapW*.633+.13,.20);
        guideMap(T,group,mapW,mapX,1.74,edge-.697);
        counter(w*.18,edge-.50,w*.41);attendant(w*.19,edge-1.22,0x548291,0x354e63);
        for(let i=0;i<4;i++)box([0xe5ae64,0x7b9fa4][i%2],w*.07+i*.13,1.19,edge-.35,.10,.075,.18);
        cyl(accent,-half+.53,3.55,edge-.15,.035,.7);
        ell(accent,-half+.53,4.01,edge-.15,.34,.34,.10);
        sign(icon,null,-half+.53,4.01,edge-.035,.42,.42,"#386e82");
      }else if(type==="firstaid"){
        // Recovery couch, folded linen and the first-aid counter.
        const x=-w*.26;
        for(const dx of [-.34,.34])for(const dz of [-.82,.82])cyl(steel,x+dx,.35,dz,.037,.56);
        box(0x789b88,x,.64,0,.83,.13,2);
        box(white,x,.76,-.65,.62,.13,.46);box(0x85afa0,x,.75,.46,.79,.094,.73);
        counter(w*.20,-d*.13,w*.43);
        box(white,w*.19,2.03,-edge+.16,1.25,.88,.19);
        box(accent,w*.19,2.03,-edge+.267,.15,.56,.025);box(accent,w*.19,2.03,-edge+.27,.56,.15,.032);
        box(wall,half*.53,1.44,edge-.17,w*.42,2.76,.20);
        box(wood,half*.53,1.67,edge-.05,w*.32,1.30,.10);
        box(0xa4bdb6,half*.53,1.67,edge+.012,w*.32-.14,1.15,.04);
        box(white,half*.53,1.67,edge+.045,w*.32, .075,.05);
        box(white,half*.53,1.67,edge+.047,.078,1.18,.05);
        box(accent,-half+.48,2.40,edge+.01,.67,.67,.14);
        box(white,-half+.48,2.40,edge+.09,.39,.107,.024);box(white,-half+.48,2.40,edge+.091,.11,.40,.024);
      }else if(type==="locker"){
        const dz=edge-1.25,span=w*.76,n=Math.max(5,Math.floor(span/.58));
        box(iron,0,1.10,dz-.33,span+.12,2.03,.9);
        for(let ix=0;ix<n;ix++)for(let iy=0;iy<3;iy++){
          const x=(ix+.5-n/2)*span/n,y=.50+iy*.61;
          box([0x669694,0x779a91,0x87a7a0,0xb8b8a0][(ix+iy*3)%4],x,y,dz+.15,span/n-.034,.57,.075);
          box(iron,x+span/n*.32,y,dz+.201,.039,.125,.043);
          box(white,x,y+.16,dz+.196,.14,.058,.016);
          for(let j=0;j<3;j++)box(0x4c6d6d,x,y-.12-j*.036,dz+.196,.15,.014,.01);
        }
        box(iron,half-.55,1.24,dz+.18,.42,1.17,.34);
        box(0x83afb1,half-.55,1.51,dz+.366,.32,.24,.035);
        for(let i=0;i<9;i++)box(white,half-.64+(i%3)*.09,1.30-Math.floor(i/3)*.07,dz+.366,.045,.027,.023);
      }else if(type==="restroom"){
        const back=-edge+.62;
        for(const side of [-1,1]){
          const x=side*w*.32;
          box(wall,x,1.33,edge-.18,w*.30,2.58,.22);
          masonry(x,edge-.047,w*.30,.82);
          for(let i=0;i<4;i++)box(0x8c9c91,x,1.61+i*.14,edge-.02,w*.23,.073,.08);
        }
        for(const side of [-1,1]){
          const x=side*w*.29;
          box(0xe8e5d7,x,1.28,back,.99,2.25,.11);box(accent,x,2.00,back+.06,.21,.19,.016);
          cyl(steel,x+.31,1.13,back+.08,.03,.18);
          box(0x9ea898,x,.7,.14,.71,.81,.45);ell(white,x,1.11,.17,.42,.12,.30);
          ell(0xb1c7c3,x,1.18,.17,.28,.055,.20);
          beam(steel,x,1.16,-.015,x,1.38,-.015,.031);beam(steel,x,1.38,-.015,x,1.38,.11,.032);
          box(0xa2bdc2,x,1.78,back+.085,.65,.54,.032);
        }
        sign(icon,"모두의 화장실",0,2.22,back+.095,.96,.59,"#59756d");
        for(const side of [-1,1])beam(steel,side*(half-.23),.86,.10,side*(half-.23),.86,edge-.48,.039);
      }
      lamp(0,2.74,edge-.69);
    }
    if(type==="restaurant")mealHall();
    else if(type==="snack")foodHatch();
    else if(type==="cafe")coffeeParlor();
    else publicService();
    batch(group);
    if(bulbs.length){
      const mesh=new T.InstancedMesh(sphere,lit,bulbs.length),dummy=new T.Object3D();
      bulbs.forEach(([x,y,z,w,h,d],i)=>{
        dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.computeBoundingSphere();group.add(mesh);
    }
  }
  return (_clock,night=0)=>{lit.emissiveIntensity=.16+night*.91;};
}
