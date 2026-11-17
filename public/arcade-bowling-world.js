import {BOWLING_BALL_RADIUS,BOWLING_FRAME_COUNT,BOWLING_LANE_X,BOWLING_ROLL_MS,BOWLING_START,
  bowlingAimAngle,bowlingFrame,bowlingOffset,bowlingScore,bowlingTurn,readyBowlingFrame} from "./arcade-bowling.js";

const wood=0xcfad79,trim=0x45606a,steel=0x2a404a,cream=0xf1d6a6,teal=0x68c4b1,orange=0xe59b62;
const laneHeight=.136;
const pinColors=[0xffefe4,0xc54843];

export function addBowlingLane(T,parent,{box,shape}){
  const lane=new T.Group();lane.name="볼링 레인";lane.position.x=BOWLING_LANE_X;parent.add(lane);
  const block=(color,x,y,z,w,h,d,group=lane)=>box(color,x,y,z,w,h,d,group);
  const group=name=>{const child=new T.Group();child.name=name;lane.add(child);return child;};
  const dynamic=object=>{object.userData.dynamic=true;return object;};
  const ballGeometry=new T.SphereGeometry(BOWLING_BALL_RADIUS,18,13);
  const holeGeometry=new T.SphereGeometry(.02,9,6);
  const boards=[0xd0a977,0xd2ae7c,0xdfbb86,0xcda674,0xe2c393,0xd7b17f,0xc7a173];

  block(steel,0,.061,-.77,3.91,.122,9.89);
  block(wood,0,.115,-.50,3.05,.031,9.03);
  for(let col=0;col<17;col++){
    const x=(col-8)*.178;
    block(boards[col%boards.length],x,.132,-.5,.176,.008,9.02);
    for(let join=0;join<3;join++){
      const z=2.72-join*2.62+(col%4-.5)*.166;
      block(0xa9845d,x,.137,z,.176,.002,.008);
    }
  }
  block(0xdbb88a,0,.038,4.68,3.1,.08,1.22);
  block(cream,0,.144,4.008,3.04,.01,.047);
  block(0x39494c,0,.041,5.18,3.10,.012,.09);
  for(const mark of [-3,-2,-1,0,1,2,3]){
    const z=2.47-Math.abs(mark)*.15;
    for(const side of [-1,1]){
      const edge=block(0x715941,mark*.30+side*.024,.139,z,.034,.007,.118);
      edge.rotation.y=side*.41;
    }
    block(0x8f6e52,mark*.31,.081,4.67,.042,.008,.048);
  }
  for(const side of [-1,1]){
    block(0x1e2c35,side*1.72,.079,-.75,.363,.081,9.64);
    block(trim,side*1.918,.164,-.77,.102,.254,9.86);
    block(teal,side*1.92,.298,-.775,.071,.021,9.80);
    block(0x314954,side*1.48,.143,-.54,.049,.019,9.11);
  }
  block(0x1b2a33,0,.185,-5.382,3.50,.236,.53);
  block(0x233841,0,1.06,-5.73,3.86,2.08,.20);
  block(trim,0,1.94,-5.659,3.86,.306,.26);
  block(orange,0,1.968,-5.506,3.67,.039,.033);
  block(cream,0,2.083,-5.513,3.66,.054,.042);
  for(const side of [-1,1]){
    block(trim,side*1.748,.99,-5.509,.30,1.79,.41);
    block(0x4a7978,side*1.81,1.07,-5.268,.085,1.43,.033);
  }
  block(0x14232b,0,.446,-5.505,3.15,.882,.057);

  const returned=group("볼링공 거치대");
  block(0x39474b,2.73,.279,4.44,.78,.56,1.53,returned);
  block(trim,2.73,.581,4.44,.84,.098,1.60,returned);
  for(const side of [-1,1]){
    block(teal,2.73+side*.26,.66,4.44,.056,.079,1.49,returned);
    block(0x191f23,2.73+side*.09,.627,4.44,.055,.056,1.43,returned);
  }
  for(const [index,color] of [0x236c79,0xd67a52,0x6f5989,0x766c48].entries()){
    shape(ballGeometry,color,2.73,.811,3.90+index*.34,returned);
  }
  const ball=group("굴러가는 볼링공");
  const ballMesh=dynamic(shape(ballGeometry,0x247e88,0,0,0,ball));
  if(ballMesh.material?.isMeshStandardMaterial){
    ballMesh.material=ballMesh.material.clone();
    ballMesh.material.roughness=.23;
  }
  for(const [x,y,z] of [[-.031,.140,-.036],[.031,.140,-.036],[0,.128,.074]]){
    const hole=dynamic(shape(holeGeometry,0x121d2a,x,y,z,ball));
    hole.scale.y=.49;
  }
  ball.visible=false;

  const profile=points=>new T.LatheGeometry(points.map(([x,y])=>new T.Vector2(x,y)),16);
  const pinBody=profile([[0,0],[.089,0],[.110,.033],[.138,.109],[.145,.177],
    [.133,.253],[.105,.324],[.075,.393],[.060,.438],[.058,.479],[.075,.537],[.071,.586],[.046,.627],[0,.641]]);
  const bands=[
    profile([[.066,.424],[.062,.438],[.062,.447]]),
    profile([[.060,.462],[.060,.478],[.063,.490]])
  ];
  const pins=Array.from({length:10},(_,index)=>{
    const pin=group(`볼링 핀 ${index+1}`);
    dynamic(shape(pinBody,pinColors[0],0,0,0,pin));
    for(const band of bands)dynamic(shape(band,pinColors[1],0,0,0,pin));
    return pin;
  });
  const aim=group("볼링 조준선");
  aim.position.set(0,laneHeight+.013,BOWLING_START);
  const aimDashes=[.67,1.42,2.19,3.0,3.84,4.72].map(distance=>
    [distance,dynamic(block(0x478577,0,0,-distance,.064,.006,.29,aim))]);

  block(0x1a2d35,0,2.93,-5.685,3.75,1.53,.16);
  const score=makeDisplay();
  const axis=new T.Vector3();
  const axisAt=angle=>axis.set(-Math.cos(angle),0,-Math.sin(angle));
  let previousRoll,previousMask,state=readyBowlingFrame();
  function update(roll,now,aimPan,match,aimOffset=0){
    aim.visible=Number.isFinite(aimPan)&&(match?match.phase==="playing"&&!roll:!roll||now-roll.at>=BOWLING_ROLL_MS);
    if(aim.visible){
      const angle=bowlingAimAngle(aimPan),offset=bowlingOffset(aimOffset),lateral=Math.sin(angle);
      aim.rotation.y=-angle;
      aim.position.x=offset;
      for(const [distance,dash] of aimDashes)dash.visible=Math.abs(offset+lateral*distance)<1.48;
    }
    const mask=match?.standing;
    if(roll!==previousRoll||mask!==previousMask||state.rolling){
      state=roll?bowlingFrame(roll,now):readyBowlingFrame(mask);
      const pose=state.ball;
      previousRoll=roll;previousMask=mask;
      ball.visible=Boolean(pose?.visible);
      if(ball.visible){
        ball.position.set(pose.x,laneHeight+BOWLING_BALL_RADIUS-pose.drop,pose.z);
        ball.quaternion.setFromAxisAngle(axisAt(pose.angle),pose.spin);
      }
      state.pins.forEach(({x,z,fall,angle,visible},index)=>{
        const pin=pins[index];pin.visible=visible;
        if(!visible)return;
        pin.position.set(x,laneHeight+.108*Math.sin(fall),z);
        pin.quaternion.setFromAxisAngle(axisAt(angle),fall);
      });
    }
    score(state,match,now);
  }
  update(null,0);
  return {update};

  function makeDisplay(){
    if(typeof document==="undefined")return ()=>{};
    const canvas=document.createElement("canvas");canvas.width=768;canvas.height=310;
    const ctx=canvas.getContext("2d");if(!ctx)return ()=>{};
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const panel=dynamic(new T.Mesh(new T.PlaneGeometry(3.57,1.44),new T.MeshBasicMaterial({map,toneMapped:false})));
    panel.name="볼링 전광판";
    panel.position.set(0,2.93,-5.598);lane.add(panel);
    let previous="",players,scored=[];
    return ({roll,knocked,result,rolling},match,now)=>{
      let title="볼링",subtitle="공을 굴려 핀 10개를 쓰러뜨리세요";
      if(players!==match?.players){
        players=match?.players;
        scored=(players??[]).map(({id,nickname,frames})=>{
          const {total,scores}=bowlingScore(frames);
          return {id,nickname,total,pending:scores.includes(null)};
        });
      }
      const pageCount=Math.max(1,Math.ceil(scored.length/4)),page=Math.floor(now/5400)%pageCount;
      const rows=scored.slice(page*4,page*4+4);
      if(match){
        const active=players.find(player=>player.id===(roll?match.rollPlayer:match.turn)),turn=bowlingTurn(match);
        if(roll)title=`${active?.nickname??"플레이어"} 투구 중`;
        else if(match.phase==="finished")title="경기 종료";
        else if(active)title=`현재 차례 · ${active.nickname}`;
        subtitle=roll?`${roll.attempt}구   ·   넘어간 핀 ${knocked}개`:turn?`${turn.frame} / ${BOWLING_FRAME_COUNT} 프레임   ·   ${turn.attempt}구`:"";
      }else if(roll){
        title=rolling?"굴리는 중":{strike:"스트라이크",spare:"스페어",hit:"넘어진 핀",miss:"다시 조준"}[result];
        subtitle=`${roll.attempt}구   ·   ${knocked}개`;
      }
      const activeId=roll?match?.rollPlayer:match?.turn;
      const key=JSON.stringify([title,subtitle,page,pageCount,activeId,rows]);
      if(key===previous)return;
      previous=key;
      ctx.fillStyle="#102632";ctx.fillRect(0,0,768,310);
      ctx.strokeStyle="#507d84";ctx.lineWidth=2;ctx.strokeRect(9,9,750,292);
      ctx.textBaseline="middle";ctx.fillStyle="#f7dfaf";
      ctx.textAlign=rows.length?"left":"center";
      ctx.font=`700 ${rows.length?36:66}px "Malgun Gothic", sans-serif`;
      ctx.fillText(title,rows.length?29:384,rows.length?42:123,rows.length?688:690);
      ctx.fillStyle="#a8d7cb";ctx.font='600 24px "Malgun Gothic", sans-serif';
      ctx.fillText(subtitle,rows.length?30:384,rows.length?77:196,688);
      if(rows.length){
        const rowHeight=Math.min(60,188/rows.length);
        rows.forEach(({id,nickname,total,pending},index)=>{
          const y=101+index*rowHeight,active=id===activeId;
          ctx.fillStyle=active?"#20584f":index%2===0?"#203641":"#172e39";
          ctx.fillRect(25,y,718,rowHeight-3);
          if(active){ctx.fillStyle="#7ae6be";ctx.fillRect(25,y,5,rowHeight-3);}
          ctx.fillStyle=active?"#e4fff0":"#f2e2cb";
          ctx.font='700 32px "Malgun Gothic", sans-serif';ctx.textAlign="left";
          ctx.fillText(nickname,43,y+rowHeight*.48,pending?398:520);
          ctx.textAlign="right";ctx.fillText(`${total}점`,724,y+rowHeight*.48,132);
          if(pending){
            ctx.fillStyle="#aad5c7";ctx.font='600 20px "Malgun Gothic", sans-serif';
            ctx.fillText("집계 중",571,y+rowHeight*.48);
          }
        });
        if(pageCount>1){
          ctx.fillStyle="#a8d7cb";ctx.font='600 17px "Malgun Gothic", sans-serif';
          ctx.fillText(`${page+1} / ${pageCount}`,723,291);
        }
      }
      map.needsUpdate=true;
    };
  }
}
