import {BASEBALL_HIT_WINDOW_MS,BASEBALL_LANE_X,BASEBALL_MOUND_Z,BASEBALL_PITCH_COUNT,BASEBALL_PLATE_Z,
  BASEBALL_SCREEN_Z,BASEBALL_SWING_LEAD_MS,baseballFrame} from "./arcade-baseball.js";

const dark=0x202b37,frame=0x455c6b,accent=0x71bbba,turf=0x3f6155,line=0xe9e4ca;
const resultText={miss:"헛스윙",foul:"파울",single:"안타",double:"2루타",home:"홈런"};

export function addBaseballLane(T,parent,{box,cylinder,shape}){
  const lane=new T.Group();lane.name="스크린 야구 타석";lane.position.x=BASEBALL_LANE_X;parent.add(lane);
  const block=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,lane);
  const active=mesh=>{mesh.userData.dynamic=true;return mesh;};
  block(dark,0,.034,-.58,4.51,.068,9.56);
  block(turf,0,.078,-.59,4.35,.034,9.44);
  for(const side of [-1,1]){
    block(frame,side*2.17,1.58,-.59,.071,.083,9.52);
    block(frame,side*2.17,3.14,-.59,.084,.09,9.52);
    block(0x2c4249,side*2.16,.131,-.59,.092,.12,9.54);
    for(const z of [-5.31,-2.21,.96,4.1]){
      block(dark,side*2.17,1.63,z,.13,3.26,.13);
      block(accent,side*2.17,2.99,z-.069,.080,.18,.028);
    }
    for(const x of [side*.46,side*1.12])block(line,x,.102,BASEBALL_PLATE_Z+.23,.024,.015,1.16);
    for(const dz of [-.34,.8])block(line,side*.79,.102,BASEBALL_PLATE_Z+dz,.66,.015,.024);
  }
  for(const z of [-5.31,-2.21,.96,4.1])block(frame,0,3.16,z,4.42,.09,.09);
  block(0x86684f,0,.109,BASEBALL_PLATE_Z,.83,.026,.61);
  const plateContour=new T.Shape([[-.19,.15],[.19,.15],[.19,-.02],[0,-.17],[-.19,-.02]]
    .map(([x,z])=>new T.Vector2(x,z)));
  const plate=shape(new T.ShapeGeometry(plateContour),line,0,.126,BASEBALL_PLATE_Z,lane);
  plate.rotation.x=-Math.PI/2;

  const net=[];
  for(const side of [-1,1]){
    const x=side*2.16;
    for(let z=-5.29;z<=4.12;z+=.26)net.push(x,.16,z,x,3.11,z);
    for(let y=.18;y<=3.12;y+=.24)net.push(x,y,-5.30,x,y,4.13);
  }
  const netGeometry=new T.BufferGeometry();
  netGeometry.setAttribute("position",new T.Float32BufferAttribute(net,3));
  lane.add(new T.LineSegments(netGeometry,new T.LineBasicMaterial({color:0xa3b4bd,transparent:true,opacity:.26,depthWrite:false})));

  block(dark,0,1.70,BASEBALL_SCREEN_Z-.055,4.41,3.16,.13);
  block(frame,0,.47,BASEBALL_SCREEN_Z+.023,4.33,.20,.14);
  block(frame,0,2.96,BASEBALL_SCREEN_Z+.023,4.33,.15,.14);
  makeField();
  const status=makeStatus();

  const machineZ=BASEBALL_MOUND_Z-.36;
  block(dark,0,.22,machineZ,.78,.38,.88);
  block(0x374e58,0,.74,machineZ,.45,.68,.51);
  block(0x52837e,0,1.23,machineZ,.67,.48,.62);
  block(dark,0,1.46,machineZ,.47,.45,.58);
  const muzzle=cylinder(dark,0,1.46,machineZ+.29,.178,.16,16,lane);
  muzzle.rotation.x=Math.PI/2;
  const pitchLight=active(block(accent,.256,1.51,machineZ+.304,.096,.075,.021));

  const ball=new T.Group();ball.name="스크린 야구공";lane.add(ball);
  active(shape(new T.SphereGeometry(.082,18,12),0xffeed3,0,0,0,ball));
  const seam=active(shape(new T.TorusGeometry(.067,.0031,6,20),0xae483f,0,.045,0,ball));
  seam.rotation.x=Math.PI/2;
  const underside=active(shape(new T.TorusGeometry(.067,.0031,6,20),0xae483f,0,-.045,0,ball));
  underside.rotation.x=Math.PI/2;
  ball.visible=false;

  const zone=new T.Group();zone.name="타격선";lane.add(zone);
  zone.position.z=BASEBALL_PLATE_Z;
  const zoneMaterial=new T.MeshStandardMaterial({color:accent,emissive:0x4c9f97,emissiveIntensity:.32});
  const corners=[[-.43,.77],[.43,.77],[.43,1.55],[-.43,1.55]];
  for(let i=0;i<corners.length;i++){
    const [x,y]=corners[i],[nextX,nextY]=corners[(i+1)%4];
    const edge=active(box(accent,(x+nextX)/2,(y+nextY)/2,0,Math.abs(nextX-x)||.018,Math.abs(nextY-y)||.018,.017,zone));
    edge.material=zoneMaterial;
  }
  zone.visible=false;

  function update(state,now){
    const {ball:pose}=baseballFrame(state,now);
    ball.visible=Boolean(pose);
    if(pose){
      ball.position.set(pose.x,pose.y+.085,pose.z);
      ball.rotation.set(pose.spin,pose.spin*.42,0);
    }
    pitchLight.visible=Boolean(state?.pitch&&now<state.pitch.at);
    zone.visible=Boolean(state?.pitch&&!state.finished&&!state.result&&now>=state.pitch.at);
    if(zone.visible){
      const swingWindow=Math.abs(now+BASEBALL_SWING_LEAD_MS-(state.pitch.at+state.pitch.flight))<=BASEBALL_HIT_WINDOW_MS;
      zoneMaterial.color.setHex(swingWindow?0xd7f6a1:accent);
      zoneMaterial.emissiveIntensity=swingWindow?.76:.32;
    }
    status(state,now);
  }
  update(null,0);
  return {update};

  function canvasPanel(width,height,w,h,x,y,z){
    if(typeof document==="undefined")return null;
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d");if(!ctx)return null;
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const screen=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,toneMapped:false}));
    screen.position.set(x,y,z);lane.add(screen);
    return {ctx,map,screen};
  }

  function makeField(){
    const field=canvasPanel(768,420,4.13,2.18,0,1.54,BASEBALL_SCREEN_Z+.029);
    if(!field)return;
    const {ctx,map}=field;
    ctx.fillStyle="#559dba";ctx.fillRect(0,0,768,420);
    ctx.fillStyle="#d1dedb";ctx.fillRect(0,94,768,67);
    for(let row=0;row<5;row++){
      for(let col=0;col<69;col++){
        ctx.fillStyle=["#889e9e","#587f85","#d8cfad","#6c8793"][(row*31+col*17)%4];
        ctx.fillRect(col*11.4,row*11+103,8,5);
      }
    }
    ctx.fillStyle="#405e66";ctx.fillRect(0,155,768,21);
    ctx.fillStyle="#3c6a52";ctx.fillRect(0,176,768,244);
    for(let col=-6;col<=6;col++){
      ctx.fillStyle=col%2===0?"#4f8060":"#427457";
      ctx.beginPath();ctx.moveTo(385+col*42,178);ctx.lineTo(385+(col+1)*42,178);
      ctx.lineTo(385+(col+1)*113,420);ctx.lineTo(385+col*113,420);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle="#9f7451";ctx.beginPath();ctx.moveTo(384,205);ctx.lineTo(511,271);
    ctx.lineTo(384,399);ctx.lineTo(257,271);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#fff0cb";ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(41,176);ctx.lineTo(384,398);
    ctx.lineTo(733,176);ctx.stroke();
    for(const [x,y] of [[384,207],[460,273],[308,273],[384,395]]){
      ctx.fillStyle="#fff5de";ctx.fillRect(x-5,y-3,10,6);
    }
    ctx.fillStyle="#a9a284";ctx.beginPath();ctx.ellipse(384,287,28,11,0,0,Math.PI*2);ctx.fill();
    map.needsUpdate=true;
  }

  function makeStatus(){
    block(dark,0,3.12,BASEBALL_SCREEN_Z+.013,3.34,.42,.12);
    const display=canvasPanel(560,104,3.16,.39,0,3.12,BASEBALL_SCREEN_Z+.081);
    if(!display)return ()=>{};
    const {ctx,map,screen}=display;active(screen);
    let previous="";
    return (state,now)=>{
      const title=state?.finished?"게임 종료":state?.result?resultText[state.result]:
        state?.pitch?(now<state.pitch.at?"투구 준비":"타격 타이밍"):"스크린 야구";
      const info=state?`${state.pitchNo}/${BASEBALL_PITCH_COUNT}구    ·    ${state.score}점    ·    ${state.hits}안타`:"공이 타격선에 오면 배트를 휘두르세요";
      const key=title+"/"+info;if(key===previous)return;
      previous=key;
      ctx.fillStyle="#172b38";ctx.fillRect(0,0,560,104);
      ctx.strokeStyle="#679d9a";ctx.lineWidth=2;ctx.strokeRect(5,5,550,94);
      ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#ffe5b6";
      ctx.font='700 36px "Malgun Gothic", sans-serif';ctx.fillText(title,280,33,526);
      ctx.fillStyle="#a9ded1";ctx.font='600 21px "Malgun Gothic", sans-serif';ctx.fillText(info,280,76,526);
      map.needsUpdate=true;
    };
  }
}
