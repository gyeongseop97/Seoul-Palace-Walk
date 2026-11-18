export const CLASSIC_FIELDS={
  pinball:{x:1.06,z:1.99,top:1.03},
  airHockey:{x:1.46,z:2.15,top:1.03},
  brickBreaker:{x:1.12,z:1.91,top:1.03}
};
export const isClassic=kind=>Object.hasOwn(CLASSIC_FIELDS,kind);
export const PIN_BUMPERS=[[-.52,-.94],[.52,-.94],[0,-.27],[-.67,.37],[.67,.37]];
export const PIN_FLIPPERS=[[-.47,1.54],[.47,1.54]];
export const PIN_DRAIN=.33;
export const HOCKEY_GOAL=.54,HOCKEY_MALLET=.22,BRICK_PADDLE=.34;
export const CLASSIC_RADII={pinball:.079,airHockey:.108,brickBreaker:.075};
export const CLASSIC_BRICKS=Array.from({length:24},(_,i)=>({
  x:(i%6-2.5)*.338,z:-1.48+Math.floor(i/6)*.25,row:Math.floor(i/6)
}));
export const BRICK_MASK=(1<<CLASSIC_BRICKS.length)-1;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const fixedStep=1/150, maxFrame=.09, float=value=>Math.round(value*1000)/1000;
const phases=new Set(["ready","playing","finished"]);

export function classicSnapshot(state){
  const seat=state.hockey;
  const hockey=state.kind==="airHockey"&&seat&&Number.isSafeInteger(seat.joined)&&seat.joined>0&&
    Array.isArray(seat.aim)&&seat.aim.length===2&&seat.aim.every(Number.isFinite)&&Number.isSafeInteger(seat.serve)&&seat.serve>=0?
    {joined:seat.joined,aim:[float(clamp(seat.aim[0],-1.2,1.2)),float(clamp(seat.aim[1],-1.89,-.23))],serve:seat.serve}:null;
  return {...(hockey?{hockey}:{}),kind:state.kind,phase:state.phase,score:state.score,other:state.other,lives:state.lives,mask:state.mask,
    ball:state.ball.map(float),paddle:state.paddle.map(float),rival:state.rival.map(float),
    flippers:state.flippers.map(float),hit:state.hit,flash:float(state.flash)};
}

export function cleanClassicSnapshot(state){
  const {kind,phase,score,other,lives,mask,ball,paddle,rival,flippers,hit,flash}=state;
  const range=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
  const int=(n,a,b)=>Number.isInteger(n)&&range(n,a,b);
  const pair=(v,a,b)=>Array.isArray(v)&&v.length===2&&range(v[0],-a,a)&&range(v[1],-b,b);
  if(!isClassic(kind)||!phases.has(phase)||!int(score,0,1000000)||!int(other,0,5)||!int(lives,0,3)||
    !int(mask,0,BRICK_MASK)||!pair(ball,1.55,2.42)||!pair(paddle,1.55,2.42)||!pair(rival,1.55,2.42)||
    !Array.isArray(flippers)||flippers.length!==2||!flippers.every(value=>range(value,0,1))||
    !int(hit,-1,23)||!range(flash,0,1))return null;
  return classicSnapshot(state);
}

function bounceCircle(ball,x,z,radius,vx=0,vz=0,force=0){
  const dx=ball.x-x,dz=ball.z-z,dist=Math.hypot(dx,dz);
  if(dist>=radius)return false;
  const nx=dist>1e-6?dx/dist:0,nz=dist>1e-6?dz/dist:-1;
  ball.x=x+nx*radius;ball.z=z+nz*radius;
  const inward=(ball.vx-vx)*nx+(ball.vz-vz)*nz;
  if(inward>=0&&!force)return false;
  const impulse=force-Math.min(0,inward)*1.92;
  ball.vx+=nx*impulse;ball.vz+=nz*impulse;
  return true;
}

function reflectSides(ball,edge){
  if(ball.x< -edge||ball.x>edge){
    ball.x=clamp(ball.x,-edge,edge);ball.vx=ball.x<0?Math.abs(ball.vx):-Math.abs(ball.vx);
  }
}

export function makeArcadeClassics(play=()=>{}){
  let game=null,accumulator=0,aim=null,held=[0,0],flips=[0,0],opponent=null;
  function start(kind){
    if(!isClassic(kind))return false;
    game={kind,phase:"ready",score:0,other:0,lives:3,mask:BRICK_MASK,hit:-1,flash:0,
      ball:{x:0,z:0,vx:0,vz:0},paddle:{x:0,z:0,vx:0,vz:0},rival:{x:0,z:0,vx:0,vz:0},serve:0};
    accumulator=0;aim=null;held=[0,0];flips=[0,0];
    resetRound();
    return true;
  }
  function resetRound(){
    const {kind,ball,paddle,rival}=game;
    game.phase="ready";game.serve++;
    Object.assign(ball,{x:kind==="pinball"?.965:0,z:kind==="pinball"?1.61:kind==="brickBreaker"?1.35:0,vx:0,vz:0});
    Object.assign(paddle,{x:0,z:kind==="airHockey"?1.51:1.68,vx:0,vz:0});
    Object.assign(rival,{x:0,z:-1.51,vx:0,vz:0});aim=null;
  }
  function launch(){
    if(game.phase==="finished"){start(game.kind);return;}
    if(game.phase!=="ready")return;
    game.phase="playing";
    const {ball,kind,serve}=game;
    if(kind==="pinball")Object.assign(ball,{vx:-.08,vz:-7.4});
    if(kind==="brickBreaker")Object.assign(ball,{x:game.paddle.x,vx:serve%2?1.55:-1.50,vz:-3.8});
    if(kind==="airHockey")Object.assign(ball,{vx:serve%2?.55:-.51,vz:serve%2?1.65:-1.72});
    play("launch");
  }
  function tap(point,drag=false){
    if(!game||!point)return false;
    if(game.kind==="pinball"){
      if(drag)return false;
      if(game.phase!=="playing")launch();
      else flips[point.x<0?0:1]=.19;
    }else{
      if(game.phase==="finished"&&!drag){start(game.kind);return true;}
      if(!drag&&game.phase==="ready")launch();
      aim=point;
    }
    return true;
  }
  function action(){
    if(!game)return;
    if(game.phase!=="playing")launch();
    else if(game.kind==="pinball")flips=[.19,.19];
  }
  function move(dx,dz){held=[dx,dz];if(dx||dz)aim=null;}
  function hit(index){
    game.hit=index;game.flash=1;play("hit");
  }
  function downBall(){
    game.lives--;
    if(game.lives===0){game.phase="finished";return;}
    resetRound();
  }
  function stepPinball(dt){
    const {ball}=game,{x,z}=CLASSIC_FIELDS.pinball,r=CLASSIC_RADII.pinball;
    ball.vz+=2.55*dt;
    reflectSides(ball,x-r);
    if(ball.z< -z+r){
      ball.z=-z+r;ball.vz=Math.abs(ball.vz)*.83;
      if(ball.x>.69)ball.vx=-2.55;
    }
    for(const [i,[bx,bz]] of PIN_BUMPERS.entries()){
      if(bounceCircle(ball,bx,bz,r+.19,0,0,1.32)){
        game.score+=100;hit(i);
      }
    }
    for(const [i,[px,pz]] of PIN_FLIPPERS.entries()){
      if(flips[i]<=0||ball.vz<-.8||Math.abs(ball.x-px)>.47||ball.z<pz-.31||ball.z>pz+.20)continue;
      ball.z=Math.min(ball.z,pz-.085);ball.vz=-6.6;
      ball.vx=(i===0?1:-1)*(1.18+Math.abs(ball.x-px)*2.4);
      game.score+=10;hit(-1);
    }
    if(ball.z>z-.31&&Math.abs(ball.x)>PIN_DRAIN&&ball.vz>0){
      ball.vx=ball.x<0?1.65:-1.65;ball.vz=-Math.max(.46,ball.vz*.32);ball.z=z-.31;
    }
    if(ball.z>z+.13)downBall();
  }
  function follow(mallet,x,z,max,dt){
    const dx=x-mallet.x,dz=z-mallet.z,d=Math.hypot(dx,dz),speed=Math.min(max,d*17);
    mallet.vx=d?dx/d*speed:0;mallet.vz=d?dz/d*speed:0;
    mallet.x+=mallet.vx*dt;mallet.z+=mallet.vz*dt;
  }
  function stepHockey(dt){
    const {ball,paddle,rival}=game,{x,z}=CLASSIC_FIELDS.airHockey,r=CLASSIC_RADII.airHockey;
    const playerX=aim?.x??paddle.x+held[0]*.78,playerZ=aim?.z??paddle.z+held[1]*.78;
    follow(paddle,clamp(playerX,-x+.26,x-.26),clamp(playerZ,.23,z-.26),5.9,dt);
    const intercept=ball.z<.1?ball.x+ball.vx*.13:paddle.x*.19;
    const attack=ball.z<-.23&&ball.vz<1.15;
    if(opponent)follow(rival,opponent[0],opponent[1],5.9,dt);
    else follow(rival,clamp(intercept,-x+.26,x-.26),attack?clamp(ball.z-.26,-z+.24,-.37):-1.58,2.45+game.score*.22,dt);
    for(const mallet of [paddle,rival]){
      if(bounceCircle(ball,mallet.x,mallet.z,r+HOCKEY_MALLET,mallet.vx*.76,mallet.vz*.76))hit(-1);
    }
    reflectSides(ball,x-r);
    if(Math.abs(ball.z)>z-r){
      if(Math.abs(ball.x)<HOCKEY_GOAL-r*.35){
        if(Math.abs(ball.z)>z+.09){
          if(ball.z<0)game.score++;else game.other++;
          game.phase=game.score>=5||game.other>=5?"finished":"ready";
          hit(-1);
          if(game.phase==="ready")resetRound();
        }
      }else{
        ball.z=clamp(ball.z,-z+r,z-r);ball.vz=ball.z<0?Math.abs(ball.vz): -Math.abs(ball.vz);
      }
    }
    const speed=Math.hypot(ball.vx,ball.vz);
    if(speed<.23){ball.vx+=.6*dt;ball.vz+=(ball.z<0?.59:-.59)*dt;}
    ball.vx*=Math.exp(-.19*dt);ball.vz*=Math.exp(-.19*dt);
  }
  function stepBricks(dt,previous){
    const {ball,paddle}=game,{x,z}=CLASSIC_FIELDS.brickBreaker,r=CLASSIC_RADII.brickBreaker;
    const playerX=aim?.x??paddle.x+held[0]*.74;
    follow(paddle,clamp(playerX,-x+BRICK_PADDLE,x-BRICK_PADDLE),1.68,6.3,dt);
    reflectSides(ball,x-r);
    if(ball.z< -z+r){ball.z=-z+r;ball.vz=Math.abs(ball.vz);}
    if(ball.vz>0&&previous>=0&&previous<1.56&&ball.z>=1.56&&Math.abs(ball.x-paddle.x)<BRICK_PADDLE+r){
      const offset=clamp((ball.x-paddle.x)/BRICK_PADDLE,-1,1);
      ball.z=1.556;ball.vx=offset*4.1+paddle.vx*.15;
      ball.vz=-Math.max(2.9,4.48-Math.abs(offset)*1.10);hit(-1);
    }
    for(const [i,brick] of CLASSIC_BRICKS.entries()){
      if(!(game.mask&(1<<i))||Math.abs(ball.x-brick.x)>.151+r||Math.abs(ball.z-brick.z)>.10+r)continue;
      if(Math.abs(previous-brick.z)>.10+r-1e-4)ball.vz*=-1;else ball.vx*=-1;
      game.mask&=~(1<<i);game.score+=10*(brick.row+1);hit(i);
      if(!game.mask)game.phase="finished";
      break;
    }
    if(ball.z>z+.13)downBall();
  }
  function advance(dt){
    game.flash=Math.max(0,game.flash-dt*3);
    flips=flips.map(value=>Math.max(0,value-dt));
    if(game.kind==="pinball"){
      for(const [i,on] of [held[0]<0,held[0]>0].entries())if(on)flips[i]=.075;
    }
    if(game.phase!=="playing"){
      if(game.phase==="ready"&&game.kind==="brickBreaker"){
        const limit=CLASSIC_FIELDS.brickBreaker.x-BRICK_PADDLE;
        follow(game.paddle,clamp(aim?.x??game.paddle.x+held[0]*.74,-limit,limit),1.68,6.3,dt);
        game.ball.x=game.paddle.x;
      }
      return;
    }
    const ball=game.ball,previous=ball.z;
    const ballStep=game.kind==="brickBreaker"?dt*.82:dt;
    ball.x+=ball.vx*ballStep;ball.z+=ball.vz*ballStep;
    if(game.kind==="pinball")stepPinball(dt);
    else if(game.kind==="airHockey")stepHockey(dt);
    else stepBricks(dt,previous);
    const speed=Math.hypot(ball.vx,ball.vz),max=game.kind==="pinball"?8.2:7.1;
    if(speed>max){ball.vx*=max/speed;ball.vz*=max/speed;}
  }
  function update(elapsed){
    if(!game)return;
    accumulator+=clamp(elapsed,0,maxFrame);
    while(accumulator>=fixedStep){advance(fixedStep);accumulator-=fixedStep;}
  }
  function state(){
    if(!game)return null;
    const {kind,phase,score,other,lives,mask,hit,flash,ball,paddle,rival}=game;
    return {kind,phase,score,other,lives,mask,hit,flash,ball:[ball.x,ball.z],paddle:[paddle.x,paddle.z],
      rival:[rival.x,rival.z],flippers:flips.map(time=>Math.min(1,time/.075))};
  }
  return {start,stop(){game=null;opponent=null;},setOpponent(target){opponent=target;},clear(){held=[0,0];aim=null;},tap,action,move,update,state};
}
