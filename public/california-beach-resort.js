import {standBatcher,standSign} from "./regional-stands.js";

const tau=Math.PI*2,cream=0xffefd0,sand=0xd9c79c,teak=0xb58050,cedar=0x815b40;
const turquoise=0x298d94,navy=0x285368,foam=0xe8f5e8,coral=0xdf7155,gold=0xf0b94a,steel=0xa4b2af;

// One frond includes the central rib and pairs of drooping, tapered leaflets.
function palmFrond(T){
  const positions=[],indices=[];
  function diamond(a,b,c,d){
    const k=positions.length/3;positions.push(...a,...b,...c,...d,...d,...c,...b,...a);
    indices.push(k,k+1,k+2,k,k+2,k+3,k+4,k+5,k+6,k+4,k+6,k+7);
  }
  const spine=t=>1.48*Math.sin(t*Math.PI*.94)-.67*t;
  for(let i=0;i<15;i++){
    const t=i/15,end=(i+1)/15,z=t*3.35,y=spine(t);
    diamond([-.028,y,z],[-.024,spine(end),end*3.35],[.024,spine(end),end*3.35],[.028,y,z]);
    for(const side of [-1,1]){
      const width=.72*(Math.sin(Math.PI*(t*.89+.06))**.64);
      diamond([0,y,z],[side*width*.61,y+.045,z+.12],
        [side*width,y-.41-.30*t,z+.29+.10*t],[side*width*.39,y-.045,z+.18]);
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);geo.computeVertexNormals();return geo;
}

export function buildBeachResort(T,root,kit,{entrance,services,beds,walkways}){
  const batch=standBatcher(T),up=new T.Vector3(0,1,0),ball=new T.SphereGeometry(1,12,8);
  const frond=palmFrond(T),ring=new T.TorusGeometry(1,.18,7,24);
  const board=new T.LatheGeometry([[0,-1],[.12,-.84],[.24,-.42],[.26,.15],[.23,.57],[.12,.87],[0,1]]
    .map(([r,h])=>new T.Vector2(r,h)),14);
  const glow=new T.MeshStandardMaterial({color:0xffeecc,emissive:0xffc076,emissiveIntensity:.12,roughness:.5});
  const allLights=[],zones=[];
  function zone(name,x,z,heading=0){
    const group=new T.Group();group.name=name;group.position.set(x,0,z);group.rotation.y=heading;root.add(group);
    zones.push(group);return group;
  }
  const box=(g,col,x,y,z,w,h,d)=>kit.box(col,x,y,z,w,h,d,g);
  const cyl=(g,col,x,y,z,r,h,n=12,top=1)=>kit.cylinder(col,x,y,z,r,h,n,g,top);
  function oval(g,col,x,y,z,w,h,d){
    const p=kit.shape(ball,col,x,y,z,g);p.scale.set(w,h,d);return p;
  }
  function beam(g,col,a,b,r){
    const v=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const p=cyl(g,col,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,v.length(),8);
    p.quaternion.setFromUnitVectors(up,v.normalize());return p;
  }
  function sign(g,title,subtitle,x,y,z,w,h,back,ink="#fff5d5"){
    standSign(T,g,title,subtitle,w,x,y,z,back,ink,h);
  }
  function local(parent,x,y,z,heading=0){
    const g=new T.Group();g.position.set(x,y,z);g.rotation.y=heading;parent.add(g);return g;
  }
  function surfboard(g,x,y,z,tone,tilt,scale=1){
    const frame=local(g,x,y,z);frame.rotation.z=tilt;frame.scale.setScalar(scale);
    kit.shape(board,tone,0,0,0,frame).scale.z=.29;
    box(frame,cream,0,.02,.071,.022,1.64,.01);
    for(const side of [-1,1])box(frame,cream,side*.09,-.32,.059,.15,.057,.025).rotation.z=side*.31;
  }
  function lifering(g,x,y,z,r){
    kit.shape(ring,coral,x,y,z,g).scale.setScalar(r);
    for(let i=0;i<4;i++){
      const a=(i+.5)*Math.PI/2;
      box(g,foam,x+r*Math.cos(a),y+r*Math.sin(a),z,.38*r,.43*r,.37*r).rotation.z=a;
    }
  }
  function bulb(g,x,y,z,r){
    allLights.push({g,x,y,z,r});
  }
  function lantern(g,x,y,z){
    cyl(g,navy,x,y+.24,z,.028,.36,8);cyl(g,navy,x,y+.045,z,.20,.14,12,.34);
    bulb(g,x,y-.072,z,.105);
  }
  function crew(g,x,z,uniform,cap){
    const skin=0xb58263,hair=0x4d3c32;
    for(const side of [-1,1]){
      const dx=side*.103;
      cyl(g,navy,x+dx,.62,z,.104,.45,10);cyl(g,skin,x+dx,.292,z,.079,.31,10);
      oval(g,cream,x+dx,.124,z+.045,.097,.065,.148);
      beam(g,uniform,[x+side*.18,1.27,z],[x+side*.25,1.08,z+.035],.087);
      beam(g,skin,[x+side*.25,1.08,z+.035],[x+side*.21,1.08,z+.20],.059);
    }
    oval(g,uniform,x,1.039,z,.235,.33,.159);
    box(g,cream,x+.087,1.15,z+.145,.081,.048,.013);
    oval(g,skin,x,1.527,z,.151,.196,.148);
    oval(g,hair,x,1.632,z-.024,.160,.12,.146);
    for(const side of [-1,1])oval(g,hair,x+side*.054,1.546,z+.135,.014,.011,.011);
    cyl(g,cap,x,1.73,z,.17,.105,12,.87);oval(g,cap,x,1.693,z+.073,.164,.027,.152);
  }
  function palm(g,x,z,h,seed){
    const slant=.31*Math.sin(seed*1.36),bend=.44*Math.cos(seed*.65);
    let a=[x,.08,z];
    for(let i=1;i<=6;i++){
      const t=i/6,b=[x+slant*t*t,h*t,z+bend*t*t];
      beam(g,i%2?0x976f4b:0xa78257,a,b,.25-.093*t);
      cyl(g,0x715b41,b[0],b[1]-.055,b[2],.253-.09*t,.074,10,.95);a=b;
    }
    for(let i=0;i<10;i++){
      const f=kit.shape(frond,[0x488451,0x397850,0x5a9759,0x70a65a][i%4],a[0],a[1]-.08,a[2],g);
      f.rotation.y=i*tau/10+seed;f.rotation.x=i%2?.13:-.12;
      const s=h/5.9*(i%2?.86:1);f.scale.setScalar(s);
    }
    for(let i=0;i<3;i++)oval(g,0x8e7945,a[0]+.13*Math.cos(i*2.1),a[1]-.24,a[2]+.12*Math.sin(i*2.1),.13,.19,.14);
  }
  function deck(g,x,z,w,d,strip=false){
    box(g,cedar,x,.035,z,w,.07,d);
    const rows=Math.ceil(d/(strip?.46:.30));
    for(let i=0;i<rows;i++){
      box(g,[0xbe9263,0xcb9e6e,0xc3996c,0xaf875f][i%4],x,.079,z-d/2+(i+.5)*d/rows,w,.035,d/rows-.018);
    }
  }
  function planter(g,x,z){
    cyl(g,0x967650,x,.26,z,.49,.52,12,1.11);cyl(g,0xb79968,x,.53,z,.57,.10,12);
    cyl(g,0x594e39,x,.57,z,.47,.045,12);
    for(let i=0;i<8;i++){
      const a=i*2.4,p=oval(g,[0x548453,0x80a854,0x628c56][i%3],x+.23*Math.sin(a),.73+(i%2)*.12,z+.23*Math.cos(a),.092,.35,.12);
      p.rotation.set(.62*Math.cos(a),0,-.62*Math.sin(a));
    }
  }
  function shade(g,x,z,r,h,colors){
    cyl(g,cedar,x,h/2,z,.075,h,12);cyl(g,0xc5b699,x,.08,z,.26,.16,12);
    const panels=12;
    for(let i=0;i<panels;i++){
      const flag=kit.shape(shadePanel,colors[i%colors.length],x,h,z,g);
      flag.rotation.y=i*tau/panels;flag.scale.set(r,r*.35,r);
    }
    cyl(g,cream,x,h+.075,z,.08,.16,10,.66);
  }
  const shadePanel=new T.BufferGeometry();
  {
    const a=Math.PI/6,b=a/2;
    const crown=[0,0,0],left=[0,-.82,1],mid=[Math.sin(b),-1,Math.cos(b)],right=[Math.sin(a),-.82,Math.cos(a)];
    const verts=[...crown,...mid,...left,...crown,...right,...mid,...left,...mid,...crown,...mid,...right,...crown];
    shadePanel.setAttribute("position",new T.Float32BufferAttribute(verts,3));shadePanel.computeVertexNormals();
  }
  function gate(){
    const g=zone("캘리포니아비치 정문",entrance.x,entrance.z,Math.atan2(65,-32));
    deck(g,0,0,16,5,true);
    for(const side of [-1,1]){
      const x=side*5.3;
      box(g,0xbc8662,x,.23,0,2.26,.46,2.16);box(g,cream,x,2.20,0,1.72,3.73,1.60);
      for(const dx of [-.71,.71])box(g,navy,x+dx,2.28,.82,.115,3.84,.13);
      box(g,turquoise,x,4.01,0,2.16,.32,1.97);box(g,cream,x,4.25,0,1.83,.21,1.74);
      box(g,coral,x,4.44,0,1.51,.22,1.44);bulb(g,x,4.67,.01,.14);
      box(g,navy,x,1.77,.866,1.05,1.64,.11);
      sign(g,side<0?"입장":"종합안내",side<0?"ENTRY":"GUEST SERVICES",x,1.77,.927,.88,.51,"#266b73");
      surfboard(g,x-side*.9,1.31,.96,side<0?gold:turquoise,side*.17,1.10);
      const pedestal=side*3.43;
      box(g,steel,pedestal,.57,.18,.38,1.12,1.02);box(g,navy,pedestal,1.13,.18,.40,.09,1.04);
      box(g,0x75c9ae,pedestal,1.19,.39,.23,.055,.30);
      for(let i=0;i<3;i++){
        const a=i*tau/3;
        beam(g,steel,[pedestal,.71,.7],[pedestal+side*.48,.71+.25*Math.cos(a),.7+.25*Math.sin(a)],.031);
      }
      palm(g,side*8.15,-.54,side<0?6.15:6.65,side+4);
      planter(g,side*6.90,1.74);
    }
    box(g,navy,0,3.93,0,10.02,.30,.70);box(g,cream,0,4.23,0,10.60,.55,.81);
    box(g,turquoise,0,4.45,0,9.30,.49,.86);box(g,navy,0,4.82,0,7.82,.38,.88);
    box(g,coral,0,4.99,0,6.57,.12,.89);
    const crest=local(g,0,5.35,0);
    const disk=cyl(crest,gold,0,.12,0,.63,.17,28);disk.rotation.x=Math.PI/2;
    for(const s of [-1,1]){
      const wing=box(crest,cream,s*.90,.12,0,.86,.13,.12);wing.rotation.z=-s*.16;
      box(crest,coral,s*.79,-.05,0,.73,.09,.13);
    }
    for(let i=0;i<3;i++){
      const p=box(crest,i%2?foam:turquoise,0,-.24+i*.106,.117,1.22-i*.1,.087,.074);
      p.rotation.z=.08;
    }
    sign(g,"캘리포니아비치","CALIFORNIA BEACH",0,4.53,.457,7.20,1.04,"#197983","#fff2ca");
    const back=local(g,0,0,-.455,Math.PI);
    sign(back,"경주월드","GYEONGJU WORLD",0,4.48,.004,5.80,.77,"#28586c");
    for(let i=0;i<13;i++)bulb(g,(i-6)*.72,3.86,.37,.057);
    for(const s of [-1,1])box(g,gold,s*4.65,4.33,.422,.88,.075,.04);
  }
  function canopy(g,w,d,color){
    const back=3.48,front=3.19,pitch=Math.atan2(back-front,d+.79);
    const n=Math.ceil((w+.73)/.55),step=(w+.73)/n;
    for(let i=0;i<n;i++){
      const x=(i+.5)*step-(w+.73)/2,paint=i%2?color:cream;
      box(g,paint,x,(back+front)/2,0,step+.002,.11,Math.hypot(d+.79,back-front)).rotation.x=pitch;
      box(g,paint,x,front-.11,d/2+.397,step,.28,.10);
    }
    box(g,cedar,0,back-.12,-d/2,w+.48,.16,.16);
    for(const side of [-1,1]){
      box(g,cedar,side*(w/2-.11),1.54,d/2-.12,.17,3.08,.19);
      beam(g,cedar,[side*(w/2-.11),2.43,d/2-.12],[side*(w/2-.11),3.18,d/2-1.02],.075);
    }
  }
  function shop(g,s){
    const {w,d,type}=s,half=w/2,front=d/2,back=-front+.21;
    deck(g,0,0,w+.35,d+.27);
    const color=type==="snack"?coral:type==="rental"?turquoise:navy;
    const sideWall=type==="changing"?d:d*.75;
    box(g,cream,0,1.54,-front,w,3.08,.18);
    for(const side of [-1,1]){
      box(g,cream,side*(half-.065),1.55,-front+sideWall/2,.14,3.10,sideWall);
      for(let i=0;i<7;i++)box(g,i%2?sand:cream,side*(half-.065),.20+i*.18,-front+sideWall/2,.16,.041,sideWall);
    }
    canopy(g,w,d,color);
    box(g,navy,0,2.91,front+.399,w-.29,.48,.16);
    sign(g,s.name,type==="rental"?"BEACH RENTALS":type==="snack"?"BEACHSIDE SNACKS":"LOCKER & CHANGING ROOMS",
      0,2.94,front+.488,Math.min(w-.65,5.2),.55,"#265d65");
    for(const side of [-1,1])lantern(g,side*w*.29,2.82,.12);
    if(type==="rental")rental(g,w,d,back);
    else if(type==="changing")changing(g,w,d,back);
    else if(type==="snack")snack(g,w,d,back);
  }
  function vest(g,x,y,z,tone){
    const vestGroup=local(g,x,y,z);
    for(const side of [-1,1]){
      box(vestGroup,tone,side*.119,.01,0,.198,.49,.115).rotation.z=side*.045;
      box(vestGroup,tone,side*.146,.265,-.025,.116,.115,.135).rotation.z=-side*.28;
      box(vestGroup,0xe7c781,side*.12,.16,.069,.113,.044,.014);
    }
    for(const h of [-.12,.035]){
      box(vestGroup,navy,0,h,.067,.437,.042,.018);
      box(vestGroup,steel,.02,h,.081,.076,.053,.017);
    }
  }
  function rental(g,w,d,back){
    const rackZ=back+.29;
    for(const x of [-w*.42,w*.15])beam(g,steel,[x,.13,rackZ],[x,2.38,rackZ],.045);
    beam(g,steel,[-w*.42,2.27,rackZ],[w*.15,2.27,rackZ],.045);
    for(let i=0;i<7;i++){
      const x=((i-3)*.081-.136)*w;
      beam(g,steel,[x,2.29,rackZ],[x,2.07,rackZ+.06],.020);
      vest(g,x,1.84,rackZ+.05,[0xe7813e,0xf0a84d,0xe16c4a][i%3]);
    }
    const x=-w*.34;
    box(g,navy,x,.59,.37,w*.27,1.04,.80);
    for(let i=0;i<7;i++)box(g,i%2?teak:cedar,x+(i-3)*w*.036,.61,.779,.24,.94,.025);
    box(g,sand,x,1.14,.37,w*.29,.13,1.01);sign(g,"대여 · 반납",null,x,.74,.81,1.52,.41,"#286874");
    box(g,navy,x+.43,1.32,.40,.37,.26,.14).rotation.x=-.13;
    box(g,0x83bcb1,x+.43,1.33,.478,.29,.17,.017);
    const shelf=w*.32;box(g,cedar,shelf,.47,-.01,w*.25,.83,.64);box(g,teak,shelf,.92,-.01,w*.26,.09,.69);
    for(let j=0;j<3;j++)for(let i=0;i<3;i++){
      box(g,j%2?cream:0x91c8c7,shelf+(i-1)*.46,.996+j*.086,-.01,.41,.078,.47);
      box(g,0x4b8997,shelf+(i-1)*.46,.997+j*.086,.234,.30,.026,.015);
    }
    lifering(g,w*.31,1.92,back+.15,.41);
    sign(g,"구명자켓",null,-w*.23,.85,back+.13,1.44,.36,"#337683");
    crew(g,x,-.42,turquoise,cream);
    surfboard(g,w*.45,1.30,d*.19,gold,-.13,.95);
  }
  function changing(g,w,d,back){
    const mid=-d*.18;
    box(g,cream,0,3.68,mid,w*.83,.75,d*.58);
    for(let i=0;i<11;i++){
      const x=(i-5)*w*.071;
      box(g,0x67979e,x,3.81,mid+d*.29+.018,w*.061,.30,.037);
      box(g,0xb0c8b9,x,3.88,mid+d*.29+.040,w*.055,.037,.019);
    }
    box(g,navy,0,4.08,mid,w*.86,.16,d*.62);
    box(g,foam,0,4.19,mid,w*.78,.11,d*.55);
    const width=w*.63,step=width/12;
    box(g,navy,-w*.12,1.22,back+.09,width+.12,2.36,.37);
    for(let row=0;row<2;row++)for(let i=0;i<12;i++){
      const x=-w*.12+(i-5.5)*step,y=.67+row*1.07;
      const color=[0x729d9a,0x8bb2a7,0x548a91,0x8ab0a7][(i+row)%4];
      box(g,color,x,y,back+.32,step-.039,1.025,.18);
      box(g,cream,x,y+.31,back+.416,.128,.076,.015);
      box(g,navy,x+step*.29,y+.012,back+.431,.050,.13,.032);
      for(let j=0;j<2;j++)box(g,navy,x,y-.30-j*.055,back+.419,.22,.016,.017);
    }
    const x=w*.32;
    for(const dx of [-.96,.96])box(g,0xd8caa5,x+dx,1.24,back+1.12,.14,2.42,1.92);
    beam(g,steel,[x-.99,2.45,back+2.07],[x+.99,2.45,back+2.07],.038);
    for(let i=0;i<8;i++){
      const p=box(g,i%2?0x68a3a9:0x86b3af,x-.80+i*.081,1.40,back+2.07+i%2*.059,.104,1.94,.062);
      p.rotation.y=(i%2?1:-1)*.25;
    }
    sign(g,"탈의칸",null,x,2.72,back+.122,1.55,.40,"#365e71");
    for(const side of [-1,1]){
      const bx=side*w*.32,z=d*.19;
      for(const end of [-.80,.80])box(g,navy,bx+end,.25,z,.15,.40,.34);
      for(let i=0;i<3;i++)box(g,teak,bx,.48,z+(i-1)*.135,1.93,.084,.115);
      for(const dz of [-.48,.48]){
        const hookX=side*(w*.5-.17);
        box(g,cedar,hookX,1.66,d*.17+dz,.08,.21,.12);
        beam(g,steel,[hookX,1.60,d*.17+dz],[hookX-side*.11,1.66,d*.17+dz],.025);
      }
    }
    box(g,steel,-w*.5+.19,1.58,-d*.19,.11,1.05,.93);
    box(g,0xbcd4ca,-w*.5+.257,1.58,-d*.19,.03,.91,.79);
  }
  function snack(g,w,d,back){
    const z=d*.18;
    box(g,0xc98158,0,.64,z,w-.72,1.14,.83);box(g,cream,0,1.235,z,w-.52,.13,1.05);
    for(let i=0;i<21;i++)box(g,i%3?teak:cedar,(i-10)*(w-.94)/21,.66,z+.435,.065,1.05,.039);
    sign(g,"츄러스","CHURROS",-w*.24,2.32,back+.135,2.52,.63,"#a84d39");
    sign(g,"카페테리아","COFFEE & DRINKS",w*.24,2.32,back+.135,2.63,.63,"#427a72");
    box(g,steel,-w*.22,.87,back+.77,w*.39,1.52,.88);
    box(g,cedar,w*.23,.89,back+.75,w*.36,1.56,.87);
    // Churros in paper cups, drying rack and the press above the fryer.
    for(let i=0;i<3;i++){
      const x=-w*.33+i*.48;
      cyl(g,cream,x,1.43,z,.109,.29,10,1.25);
      for(let j=0;j<4;j++){
        const p=cyl(g,j%2?0xca853e:0xb47032,x+(j-1.5)*.048,1.69+(j%2)*.05,z,.032,.46,8);
        p.rotation.z=(1.5-j)*.12;
      }
    }
    const press=-w*.30;
    box(g,navy,press,1.68,back+.88,1.18,.14,.64);box(g,0x84653c,press,1.76,back+.9,.91,.052,.45);
    cyl(g,steel,press-.39,2.02,back+.66,.057,.72,12);box(g,steel,press-.145,2.33,back+.66,.54,.093,.09);
    cyl(g,cream,press+.13,2.16,back+.66,.153,.29,12);cyl(g,steel,press+.13,1.98,back+.66,.068,.11,8);
    box(g,navy,w*.30,1.43,z,1.02,.26,.53);
    for(const [i,color] of [0x36b8d5,0xee985c].entries()){
      const x=w*.30+(i-.5)*.47;
      cyl(g,color,x,1.79,z,.204,.48,16,1.06);cyl(g,foam,x,2.05,z,.225,.067,16);
      box(g,navy,x,1.60,z+.191,.124,.086,.14);box(g,coral,x,1.65,z+.273,.052,.151,.043);
    }
    box(g,navy,w*.13,1.83,back+.77,1.05,.34,.65);
    box(g,steel,w*.13,2.00,back+.84,1.04,.17,.54);
    for(const dx of [-.22,.22]){
      cyl(g,steel,w*.13+dx,1.89,back+1.03,.070,.14,10);
      cyl(g,cream,w*.13+dx,1.75,back+1.04,.071,.11,10,1.12);
    }
    for(let i=0;i<5;i++){
      cyl(g,i%2?cream:0xf0d299,w*.41,1.35+i*.048,z,.094,.115,12,1.12);
    }
    surfboard(g,w*.41,1.37,back+.14,coral,-.12,.89);
    crew(g,-.30,-.22,coral,cream);
    const fruitX=w*.076;
    box(g,cedar,fruitX,1.34,z+.14,.91,.13,.40);
    for(let i=0;i<7;i++){
      const row=Number(i>3),x=fruitX+((i%4)-1.5)*.18;
      oval(g,i%3?0xe9a24c:0xd1c55d,x,1.47+row*.06,z+.20-row*.16,.091,.088,.086);
    }
    box(g,teak,-w*.16,3.51,-d*.17,w*.51,.68,.20);
    sign(g,"CHURROS","& COLD DRINKS",-w*.16,3.54,-d*.17+.105,w*.45,.51,"#a54d39");
    planter(g,-w*.41,d*.45);planter(g,w*.41,d*.45);
  }
  function lounger(g,seat,i){
    const chair=local(g,seat.x-g.position.x,0,seat.z-g.position.z,-seat.heading*Math.PI/180);
    for(const side of [-1,1]){
      const x=side*.407;
      for(const z of [-.75,.59])beam(chair,cedar,[x,.10,z],[x,.46,z-.12],.046);
      beam(chair,teak,[x,.37,-.97],[x,.41,.53],.056);
      beam(chair,teak,[x,.40,.30],[x,.92,1.13],.050);
      beam(chair,teak,[x*.99,.57,.12],[x*.99,.58,.61],.038);
    }
    box(chair,cream,0,.443,-.31,.82,.075,1.34);
    const back=box(chair,cream,0,.710,.715,.82,.082,.98);back.rotation.x=-.55;
    for(let j=0;j<9;j++){
      const tone=j%2?(i%2?turquoise:0xaf7861):foam,x=(j-4)*.082;
      box(chair,tone,x,.484,-.31,.077,.012,1.34);
      box(chair,tone,x,.749,.695,.077,.012,.98).rotation.x=-.55;
    }
    const towel=box(chair,i%2?0xeaab65:0x83b8c4,0,.90,.935,.65,.098,.23);
    towel.rotation.x=-.55;
  }
  function cabana(g,x,z,heading){
    const c=local(g,x,0,z,heading),width=3.45,depth=3.25;
    for(const xSide of [-1,1])for(const zSide of [-1,1]){
      const px=xSide*width/2,pz=zSide*depth/2;
      box(c,cedar,px,1.46,pz,.14,2.85,.14);
      box(c,sand,px,.17,pz,.27,.33,.27);
      beam(c,teak,[px,2.20,pz],[px-xSide*.56,2.82,pz],.060);
      const curtain=box(c,foam,px-xSide*.17,2.30,pz,.37,.93,.075);
      curtain.rotation.z=-xSide*.22;
      box(c,cream,px-xSide*.08,1.59,pz,.17,.61,.09).rotation.z=xSide*.08;
      box(c,turquoise,px-xSide*.09,1.87,pz,.17,.08,.115);
    }
    for(const sign of [-1,1])box(c,teak,sign*width/2,2.83,0,.19,.16,depth+.33);
    box(c,cedar,0,2.83,0,.17,.16,depth+.32);
    for(let i=0;i<11;i++){
      box(c,i%2?0x83a49c:cream,(i-5)*.349,2.88,0,.362,.088,depth+.45);
      box(c,i%2?0x83a49c:cream,(i-5)*.349,2.77,-depth/2-.187,.36,.19,.05);
    }
    for(let i=0;i<7;i++)box(c,teak,0,.69+i*.23,depth/2,width-.16,.066,.066);
  }
  function resting(){
    for(let i=0;i<beds.length;i+=2){
      const a=beds[i],b=beds[i+1],x=b?(a.x+b.x)/2:a.x,z=b?(a.z+b.z)/2:a.z;
      const g=zone("선베드 · 휴식 데크",x,z),heading=-a.heading*Math.PI/180;
      const left=-Math.sin(heading),fore=-Math.cos(heading);
      const length=b?Math.hypot(a.x-b.x,a.z-b.z):2.1;
      const deckHeading=b?Math.atan2(a.z-b.z,b.x-a.x):heading;
      const base=local(g,0,0,0,deckHeading);
      deck(base,0,0,length+3.85,4.45,true);
      lounger(g,a,i);if(b)lounger(g,b,i+1);
      if(i%4===2){
        // The chair under the cabana and the one beside it are both usable.
        cabana(g,a.x-x,a.z-z,heading);
      }else{
        shade(g,-left*.72,-fore*.72,1.67,2.62,[coral,cream]);
      }
      cyl(g,teak,0,.29,0,.080,.46,10);
      cyl(g,cream,0,.55,0,.34,.075,16);
      cyl(g,0xe5b460,.13,.686,-.03,.064,.20,12,1.12);
      beam(g,coral,[.13,.77,-.03],[.155,.88,-.016],.010);
    }
  }
  function fingerpost(g,x,z,items,yaw=0){
    const post=local(g,x,0,z,yaw);
    cyl(post,navy,0,1.50,0,.083,2.95,10);
    cyl(post,cream,0,2.99,0,.11,.14,10,.72);
    for(let i=0;i<items.length;i++){
      const forward=i%2?-1:1,y=2.63-i*.43;
      box(post,forward>0?turquoise:coral,forward*.31,y,0,1.69,.36,.11);
      sign(post,items[i],null,forward*.31,y,.060,1.61,.32,forward>0?"#30757b":"#a75542");
    }
  }
  function walkwaysAndGardens(){
    const occupied=[...beds.map(p=>({...p,r:4.4})),...services.map(p=>({...p,r:p.w*.56+1})),{...entrance,r:13}];
    const placed=[...occupied];
    function clear(p){return placed.every(o=>(p.x-o.x)**2+(p.z-o.z)**2>o.r*o.r);}
    const unique=new Set();
    for(let i=0;i<walkways.length;i++){
      const path=walkways[i];
      if(path.length<2)continue;
      const g=zone("비치 산책로",path[0].x,path[0].z);
      for(let j=1;j<path.length;j++){
        const a=path[j-1],b=path[j],key=[a.x+","+a.z,b.x+","+b.z].sort().join("/");
        if(unique.has(key))continue;unique.add(key);
        const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.1)continue;
        const angle=Math.atan2(dx,dz),width=i===0?3.85:3.10;
        const outside=a.x>entrance.x+2&&b.x>=entrance.x;
        const lane=local(g,(a.x+b.x)/2-g.position.x,0,(a.z+b.z)/2-g.position.z,angle);
        const tiles=Math.ceil(length/1.36),tile=length/tiles;
        box(lane,outside?0xb3a38a:0xc2ae90,0,.037,0,width,.070,length);
        for(let k=0;k<tiles;k++){
          const z=-length/2+(k+.5)*tile;
          box(lane,outside?[0xcdbc9f,0xe1cdae,0xd5c4a8][(j+k)%3]:
            [0xdac7a8,0xe5ceb0,0xdec9a9,0xd5bfa3][(k+j)%4],0,.078,z,width-.19,.021,tile-.035);
        }
        const gap=outside?13:17,count=Math.floor(length/gap);
        for(let k=0;k<count;k++){
          const t=(k+.5)/count,side=(j+k+i)%2?1:-1;
          const s=width/2+2.35,p={x:a.x+dx*t+side*dz/length*s,z:a.z+dz*t-side*dx/length*s};
          // Pool gates have a clear line of sight to the water. Dress the dry approaches.
          const wetSide=p.x>6278&&p.x<6356&&p.z>238&&p.z<339;
          const kids=p.x>6354&&p.x<6383&&p.z>255&&p.z<283;
          if(wetSide||kids||!clear(p))continue;
          palm(g,p.x-g.position.x,p.z-g.position.z,4.2+((j+i+k)%4)*.48,j*3+i+k);
          cyl(g,0xc1ae86,p.x-g.position.x,.090,p.z-g.position.z,.68,.096,14);
          placed.push({...p,r:7.9});
        }
      }
    }
    const g=zone("비치 안내 표지",6373,236);
    fingerpost(g,2.8,-2.9,["산타모니카비치","선베드 · 라커동"],.35);
    fingerpost(g,-70.3,-6.9,["웨이브캐년","트리플다운"],.28);
    fingerpost(g,-11.5,75.6,["츄러스 · 음료","슬라이드"],-.55);
  }
  gate();
  for(const s of services){const g=zone(s.name,s.x,s.z);shop(g,s);}
  resting();walkwaysAndGardens();

  const lightMesh=new T.InstancedMesh(ball,glow,allLights.length);
  const coord=new T.Vector3(),matrix=new T.Matrix4(),rotation=new T.Quaternion(),scale=new T.Vector3();
  root.updateWorldMatrix(true,true);
  const toRoot=new T.Matrix4().copy(root.matrixWorld).invert();
  allLights.forEach(({g,x,y,z,r},i)=>{
    coord.set(x,y,z).applyMatrix4(g.matrixWorld).applyMatrix4(toRoot);
    matrix.compose(coord,rotation,scale.setScalar(r));lightMesh.setMatrixAt(i,matrix);
  });
  lightMesh.computeBoundingSphere();root.add(lightMesh);
  const nearDetails=[];
  for(const g of zones){
    // Flatten component transforms so deck planks, fronds and locker doors can share draw calls.
    const inverse=new T.Matrix4().copy(g.matrixWorld).invert(),meshes=[];
    g.traverse(obj=>{if(obj.isMesh&&obj.parent!==g)meshes.push(obj);});
    for(const m of meshes){
      matrix.multiplyMatrices(inverse,m.matrixWorld);g.add(m);
      matrix.decompose(m.position,m.quaternion,m.scale);
    }
    const groups=g.children.filter(p=>p.isGroup);
    g.remove(...groups);batch(g);
    for(const m of g.children){
      const sphere=m.isInstancedMesh?m.boundingSphere:null;
      if(m.isInstancedMesh&&sphere.radius>3)continue;
      if(!sphere&&!m.geometry.boundingSphere)m.geometry.computeBoundingSphere();
      const bounds=sphere??m.geometry.boundingSphere;
      m.updateMatrix();
      const radius=bounds.radius*m.matrix.getMaxScaleOnAxis();
      if(radius>3)continue;
      const center=bounds.center.clone().applyMatrix4(m.matrix).applyMatrix4(g.matrix);
      nearDetails.push({m,x:center.x,z:center.z,range:(radius>.9?138:radius>.36?85:48)**2});
    }
  }
  let lastX=Infinity,lastZ=Infinity;
  return (_clock,night=0,camera)=>{
    glow.emissiveIntensity=.12+night*1.38;
    if(!camera?.position)return;
    coord.copy(camera.position).applyMatrix4(toRoot);
    if((coord.x-lastX)**2+(coord.z-lastZ)**2<16)return;
    lastX=coord.x;lastZ=coord.z;
    for(const {m,x,z,range} of nearDetails)m.visible=(lastX-x)**2+(lastZ-z)**2<range;
  };
}
