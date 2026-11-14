import {JUMP_MS} from "../public/activities.js";
import {JEGI_CATCH_EARLY,JEGI_CATCH_LATE,JEGI_CATCH_REACH,JEGI_FLIGHT_TIMES,JEGI_KICK_COOLDOWN,KITE_GUSTS,MINIGAME_LOBBY_MS,
  KITE_FLIGHT_ACTIONS,KITE_MAX_LINE_CM,KITE_MIN_LINE_CM,KITE_REEL_CM_PER_SECOND,KITE_RELEASE_CM_PER_SECOND,KITE_START_LINE_CM,
  MINIGAME_PICKUP_REACH,MINIGAME_REACH,MINIGAME_RESULT_MS,TUHO_ANGLE_LIMIT,TUHO_ARROWS,aimTolerance,atMinigameLane,
  atTuhoLine,minigameAim,minigameById,minigameChallenge,minigameDuration,minigamePickup,tuhoScores} from "../public/traditional-games.js";
import {inKiteLawn} from "../public/plaza-layout.js";

const validId=value=>typeof value==="string"&&/^[a-f0-9]{32}$/.test(value);
const hitGrace=1100,clockLead=260,actionLifetime=1800,kiteCutLifetime=7000,poseReach=1.45;
const kiteSpatialActions=["fly","unspool","reel"];
const kiteActions=[...kiteSpatialActions,"hold","land","cut"];
const isFreeAction=action=>action==="collect"||action==="throw"||action==="kick"||kiteActions.includes(action);
const validAt=at=>Number.isSafeInteger(at)&&at>=0&&at<1e13;
const validPose=({x,y})=>Number.isFinite(x)&&Number.isFinite(y);

function validFreeCommand(game,command){
  if(kiteActions.includes(command.action)){
    return game.id==="kite"&&(!kiteSpatialActions.includes(command.action)||
      validPose(command)&&inKiteLawn(command.x,command.y));
  }
  if(command.action==="collect")return game.id==="tuho";
  if(!validAt(command.at)||!validPose(command))return false;
  if(command.action==="kick")return game.id==="jegi"&&atMinigameLane(game,command);
  return game.id==="tuho"&&atTuhoLine(game,command)&&
    Number.isFinite(command.angle)&&Math.abs(command.angle)<=TUHO_ANGLE_LIMIT&&
    Number.isInteger(command.power)&&command.power>=0&&command.power<=100;
}

export function validMinigame(command){
  const game=minigameById(command?.game);
  if(!game||!validId(command.id))return false;
  if(isFreeAction(command.action))return validFreeCommand(game,command);
  if(command.action==="start")return true;
  if(!validId(command.round))return false;
  if(command.action==="join"||command.action==="leave")return true;
  return command.action==="hit"&&Number.isInteger(command.beat)&&command.beat>=0&&command.beat<game.beats&&
    validAt(command.at)&&
    (game.id==="kite"?command.move===-1||command.move===1:command.move===0)&&
    (command.aim===undefined&&command.power===undefined||
      validPose(command)&&atMinigameLane(game,command)&&
      command.aim===minigameAim(game,command)&&
      Number.isInteger(command.power)&&command.power>=0&&command.power<=(game.id==="tuho"?100:0));
}

const squared=term=>`(${term})*(${term})`;
const roomWalker=`w.room=? AND w.id=? AND w.player_key=? AND w.updated>=?`;
const walkerReady=`${roomWalker}
  AND json_extract(w.avatar,'$.seat') IS NULL AND json_extract(w.avatar,'$.bus') IS NULL
  AND json_extract(w.avatar,'$.bikeRide') IS NULL
  AND (json_extract(w.avatar,'$.bike') IS NULL OR json_type(w.avatar,'$.bike.parked') IS 'object')
  AND COALESCE(json_extract(w.avatar,'$.jump'),0)<=?`;
const walkerAtVenue=`${walkerReady}
  AND ${squared("json_extract(w.avatar,'$.x')-?")} + ${squared("json_extract(w.avatar,'$.y')-?")}<=?`;
const roomWalkerArguments=({room,id,key,online})=>[room,id,key,online];
const readyArguments=context=>[...roomWalkerArguments(context),context.now-JUMP_MS];
const venueArguments=(context,game)=>[
  ...readyArguments(context),game.point.x,game.point.x,game.point.y,game.point.y,MINIGAME_REACH**2
];
const walkerNearPose=`${squared("json_extract(w.avatar,'$.x')-?")}+${squared("json_extract(w.avatar,'$.y')-?")}<=?`;
const poseArguments=({x,y},reach=poseReach)=>[x,x,y,y,reach**2];
const matchFor=command=>command.action==="start"?command.id:command.round;
const seenFreeRequest=`SELECT 1 FROM minigame_free_requests WHERE room=? AND game=? AND player=? AND request=?`;
const jegiFlight=`CASE MAX(0,minigame_free.count-1) % ${JEGI_FLIGHT_TIMES.length}
  ${JEGI_FLIGHT_TIMES.map((duration,index)=>`WHEN ${index} THEN ${duration}`).join(" ")} END`;
const kiteInFlight=KITE_FLIGHT_ACTIONS.map(action=>`'${action}'`).join(",");

function kiteStatement(db,context,request){
  const {room,id,now,minigame:command}=context;
  if(command.action==="fly")return db.prepare(`
    INSERT INTO minigame_free (room,game,player,request,action,at,x,y,angle,power,points,count,arrows)
    SELECT w.room,'kite',w.id,?,'fly',?,?,?,0,?,0,0,0
    FROM walkers w WHERE ${walkerReady} AND ${walkerNearPose} AND NOT EXISTS (${seenFreeRequest})
    ON CONFLICT(room,game,player) DO UPDATE SET request=excluded.request,action=excluded.action,
      at=excluded.at,x=excluded.x,y=excluded.y,angle=0,power=excluded.power,points=0
    WHERE minigame_free.action NOT IN (${kiteInFlight}) AND minigame_free.at<=excluded.at
  `).bind(command.id,now,command.x,command.y,KITE_START_LINE_CM,...readyArguments(context),...poseArguments(command),...request);
  const spatial=kiteSpatialActions.includes(command.action);
  const length=`MAX(${KITE_MIN_LINE_CM},MIN(${KITE_MAX_LINE_CM},
    power+CAST(MAX(0,${now}-at)*(CASE action WHEN 'unspool' THEN ${KITE_RELEASE_CM_PER_SECOND}
      WHEN 'reel' THEN -${KITE_REEL_CM_PER_SECOND} ELSE 0 END)/1000.0 AS INTEGER)))`;
  return db.prepare(`
    UPDATE minigame_free SET request=?,
      action=CASE WHEN ?='hold' AND minigame_free.action='reel' AND ${length}<=${KITE_MIN_LINE_CM}
        THEN 'land' ELSE ? END,
      at=?,power=${length},x=json_extract(w.avatar,'$.x'),y=json_extract(w.avatar,'$.y'),
      angle=COALESCE(json_extract(w.avatar,'$.heading'),0),
      points=COALESCE(json_extract(w.avatar,'$.running'),0)
    FROM walkers w WHERE minigame_free.room=? AND minigame_free.game='kite' AND minigame_free.player=?
      AND minigame_free.action IN (${kiteInFlight}) AND minigame_free.action<>?
      AND ${spatial?`${walkerReady} AND ${walkerNearPose}`:roomWalker}
      AND NOT EXISTS (${seenFreeRequest})
  `).bind(command.id,command.action,command.action,now,room,id,command.action,
    ...(spatial?[...readyArguments(context),...poseArguments(command)]:roomWalkerArguments(context)),...request);
}

function freePlayStatements(db,context,game){
  const {room,id,now,minigame:command}=context;
  const request=[room,game.id,id,command.id],venue=venueArguments(context,game);
  const {at,x,y,angle,power}=command;
  let action;
  if(game.id==="kite"){
    action=kiteStatement(db,context,request);
  }else if(command.action==="collect"){
    action=db.prepare(`
      INSERT INTO minigame_free (room,game,player,request,action,at,x,y,angle,power,points,count,arrows)
      SELECT w.room,?,w.id,?,'collect',?,json_extract(w.avatar,'$.x'),json_extract(w.avatar,'$.y'),0,0,0,0,?
      FROM walkers w WHERE ${walkerAtVenue} AND ${walkerNearPose} AND NOT EXISTS (${seenFreeRequest})
      ON CONFLICT(room,game,player) DO UPDATE SET request=excluded.request,action=excluded.action,
        at=excluded.at,x=excluded.x,y=excluded.y,angle=0,power=0,points=0,count=0,arrows=excluded.arrows
      WHERE minigame_free.arrows=0 AND excluded.at>minigame_free.at
    `).bind(game.id,command.id,now,TUHO_ARROWS,...venue,...poseArguments(minigamePickup(game),MINIGAME_PICKUP_REACH),...request);
  }else{
    if(at<now-hitGrace||at>now+clockLead)return [];
    if(command.action==="throw"){
      const points=Number(tuhoScores(game,command,angle,power));
      action=db.prepare(`
        UPDATE minigame_free SET request=?,action='throw',at=?,x=?,y=?,angle=?,power=?,points=?,count=count+?,arrows=arrows-1
        WHERE room=? AND game=? AND player=? AND arrows>0 AND at<?
          AND EXISTS (SELECT 1 FROM walkers w WHERE ${walkerAtVenue} AND ${walkerNearPose})
          AND NOT EXISTS (${seenFreeRequest})
      `).bind(command.id,at,x,y,angle,power,points,points,room,game.id,id,at,...venue,...poseArguments(command),...request);
    }else{
      const elapsed="(excluded.at-minigame_free.at)";
      const far=`${squared("excluded.x-minigame_free.x")}+${squared("excluded.y-minigame_free.y")}`;
      const count=`CASE WHEN minigame_free.count=0 OR ${elapsed}>(${jegiFlight})+${JEGI_CATCH_LATE} THEN 1
        WHEN ${elapsed}>=(${jegiFlight})-${JEGI_CATCH_EARLY} AND ${far}<=${JEGI_CATCH_REACH**2}
        THEN minigame_free.count+1 ELSE 0 END`;
      action=db.prepare(`
        INSERT INTO minigame_free (room,game,player,request,action,at,x,y,angle,power,points,count,arrows)
        SELECT w.room,?,w.id,?,'kick',?,?,?,0,0,1,1,0
        FROM walkers w WHERE ${walkerAtVenue} AND ${walkerNearPose} AND NOT EXISTS (${seenFreeRequest})
        ON CONFLICT(room,game,player) DO UPDATE SET request=excluded.request,action=excluded.action,
          at=excluded.at,x=excluded.x,y=excluded.y,points=(${count})>0,count=${count}
        WHERE ${elapsed}>=${JEGI_KICK_COOLDOWN}
      `).bind(game.id,command.id,at,x,y,...venue,...poseArguments(command),...request);
    }
  }
  const remember=db.prepare(`
    INSERT INTO minigame_free_requests (room,game,player,request,at)
    SELECT room,game,player,request,at FROM minigame_free
    WHERE changes()=1 AND room=? AND game=? AND player=? AND request=?
    ON CONFLICT(room,game,player,request) DO NOTHING
  `).bind(...request);
  if(command.action==="cut")return [action,remember,db.prepare(`
    INSERT INTO minigame_kite_cuts (room,player,request,at,x,y,angle,power,points)
    SELECT room,player,request,at,x,y,angle,power,points FROM minigame_free
    WHERE changes()=1 AND room=? AND game=? AND player=? AND request=? AND action='cut'
    ON CONFLICT(room,player,request) DO NOTHING
  `).bind(...request)];
  return [action,remember];
}

function addParticipant(db,context,game,round){
  return db.prepare(`
    INSERT INTO minigame_players (room,round_id,player,nickname,joined)
    SELECT r.room,r.id,w.id,w.nickname,? FROM minigame_rounds r JOIN walkers w ON w.room=r.room
    WHERE r.room=? AND r.id=? AND r.game=? AND r.starts>? AND ${walkerAtVenue}
    ON CONFLICT(room,round_id,player) DO UPDATE SET withdrawn=NULL
  `).bind(context.now,context.room,round,game.id,context.now,...venueArguments(context,game));
}

function hitScore(game,{at,beat,move,aim,power}){
  const timing=`ABS(? - (r.starts + ${beat*game.beatMs+game.targetMs}))`;
  const target=field=>"CASE r.seed "+KITE_GUSTS.map((_,seed)=>
    `WHEN ${seed} THEN ${minigameChallenge(game,seed,beat)[field]}`).join(" ")+" END";
  const direction=game.id==="kite"?`WHEN (${target("move")})<>? THEN 0`:"";
  const directionArgs=game.id==="kite"?[move]:[];
  if(aim===undefined)return {
    sql:`CASE ${direction} WHEN ${timing}<=${game.perfect} THEN 3 WHEN ${timing}<=${game.good} THEN 1 ELSE 0 END`,
    args:[...directionArgs,at,at]
  };
  const lateral=`ABS(? - (${target("targetAim")}))`,tolerance=aimTolerance[game.id];
  const throwGame=game.id==="tuho",depth=throwGame?`ABS(? - (${target("targetPower")}))`:timing;
  const perfect=throwGame?tolerance.powerPerfect:game.perfect,good=throwGame?tolerance.powerGood:game.good;
  const action=throwGame?power:at;
  return {
    sql:`CASE ${direction} WHEN ${lateral}<=${tolerance.perfect} AND ${depth}<=${perfect} THEN 3
      WHEN ${lateral}<=${tolerance.good} AND ${depth}<=${good} THEN 1 ELSE 0 END`,
    args:[...directionArgs,aim,action,aim,action]
  };
}

export function minigameStatements(db,context){
  const {room,id,key,now,minigame:command}=context,game=minigameById(command.game);
  if(isFreeAction(command.action))return freePlayStatements(db,context,game);
  const round=matchFor(command);
  if(command.action==="start"){
    const starts=now+MINIGAME_LOBBY_MS,ends=starts+minigameDuration(game);
    return [db.prepare(`
      INSERT INTO minigame_rounds (room,id,game,seed,starts,ends,closes)
      SELECT ?,?,?,?,?,?,? FROM walkers w
      WHERE ${walkerAtVenue} AND NOT EXISTS (
        SELECT 1 FROM minigame_rounds WHERE room=? AND game=? AND ends>?
      ) ON CONFLICT(room,id) DO NOTHING
    `).bind(room,round,game.id,now%KITE_GUSTS.length,starts,ends,ends+MINIGAME_RESULT_MS,
      ...venueArguments(context,game),room,game.id,now),addParticipant(db,context,game,round)];
  }
  if(command.action==="join")return [addParticipant(db,context,game,round)];
  if(command.action==="leave")return [db.prepare(`
    UPDATE minigame_players SET withdrawn=?
    WHERE room=? AND round_id=? AND player=? AND withdrawn IS NULL
      AND EXISTS (SELECT 1 FROM minigame_rounds WHERE room=? AND id=? AND game=? AND ends>?)
      AND EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=?)
  `).bind(now,room,round,id,room,round,game.id,now,room,id,key)];
  if(command.at<now-hitGrace||command.at>now+clockLead)return [];
  const {at,beat,move,aim,power,x,y}=command,score=hitScore(game,command),spatial=aim!==undefined;
  const hit=db.prepare(`
    INSERT INTO minigame_hits (room,round_id,player,beat,request,points)
    SELECT r.room,r.id,p.player,?,?,${score.sql}
    FROM minigame_rounds r JOIN minigame_players p ON p.room=r.room AND p.round_id=r.id
    JOIN walkers w ON w.room=p.room AND w.id=p.player
    WHERE r.room=? AND r.id=? AND r.game=? AND p.player=? AND p.withdrawn IS NULL
      AND ? >= r.starts+? AND ? < r.starts+? AND ?<r.ends AND ?<r.ends+${hitGrace}
      AND ${walkerAtVenue}
      ${spatial?`AND ${walkerNearPose}`:""}
    ON CONFLICT(room,round_id,player,beat) DO NOTHING
  `).bind(beat,command.id,...score.args,room,round,game.id,id,at,beat*game.beatMs,
    at,(beat+1)*game.beatMs,at,now,...venueArguments(context,game),...(spatial?poseArguments(command):[]));
  if(!spatial)return [hit];
  // Both writes share the room's batch. A repeated or rejected hit cannot publish another pose.
  const action=db.prepare(`
    INSERT INTO minigame_actions (room,round_id,player,beat,request,game,at,move,aim,power,points,x,y)
    SELECT h.room,h.round_id,h.player,h.beat,h.request,?,?,?,?,?,h.points,?,?
    FROM minigame_hits h
    WHERE changes()=1 AND h.room=? AND h.round_id=? AND h.player=? AND h.beat=? AND h.request=?
    ON CONFLICT(room,round_id,player,beat) DO NOTHING
  `).bind(game.id,at,move,aim,power,x,y,room,round,id,beat,command.id);
  return [hit,action];
}

export function leaveMinigames(db,{room,id,key,now}){
  return db.prepare(`
    UPDATE minigame_players SET withdrawn=? WHERE room=? AND player=? AND withdrawn IS NULL
      AND EXISTS (SELECT 1 FROM minigame_rounds r WHERE r.room=minigame_players.room AND r.id=minigame_players.round_id AND r.ends>?)
      AND EXISTS (SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key IS ?)
  `).bind(now,room,id,now,room,id,key);
}

export function cleanupMinigames(db,room,before){
  const expired="SELECT id FROM minigame_rounds WHERE room=? AND closes<?";
  return [db.prepare(`DELETE FROM minigame_actions WHERE room=? AND round_id IN (${expired})`).bind(room,room,before),
    db.prepare(`DELETE FROM minigame_hits WHERE room=? AND round_id IN (${expired})`).bind(room,room,before),
    db.prepare(`DELETE FROM minigame_players WHERE room=? AND round_id IN (${expired})`).bind(room,room,before),
    db.prepare("DELETE FROM minigame_rounds WHERE room=? AND closes<?").bind(room,before),
    db.prepare("DELETE FROM minigame_free_requests WHERE room=? AND at<?").bind(room,before),
    db.prepare("DELETE FROM minigame_kite_cuts WHERE room=? AND at<?").bind(room,before),
    db.prepare(`DELETE FROM minigame_free WHERE room=? AND at<? AND NOT EXISTS (
      SELECT 1 FROM walkers w WHERE w.room=minigame_free.room AND w.id=minigame_free.player AND w.updated>=?
    )`).bind(room,before,before)];
}

const scoreFor=`COALESCE((SELECT SUM(h.points) FROM minigame_hits h
  WHERE h.room=p.room AND h.round_id=p.round_id AND h.player=p.player),0)`;
function recognize(command,room,id){
  if(!command)return {sql:"0",args:[]};
  if(isFreeAction(command.action))return {sql:`EXISTS (${seenFreeRequest})`,args:[room,command.game,id,command.id]};
  const round=matchFor(command);
  if(command.action==="hit")return {sql:`EXISTS (SELECT 1 FROM minigame_hits WHERE room=? AND round_id=? AND player=? AND beat=? AND request=?)`,
    args:[room,round,id,command.beat,command.id]};
  const withdrawal=command.action==="leave"?"IS NOT NULL":"IS NULL";
  return {sql:`EXISTS (SELECT 1 FROM minigame_players p JOIN minigame_rounds r ON r.room=p.room AND r.id=p.round_id
    WHERE p.room=? AND p.round_id=? AND p.player=? AND r.game=? AND p.withdrawn ${withdrawal})`,
    args:[room,round,id,command.game]};
}

export function selectMinigames(db,{room,id,now,online,minigame}){
  const command=recognize(minigame,room,id);
  return db.prepare(`
    SELECT (SELECT json_group_array(json_object('game',r.game,'id',r.id,'startsAt',r.starts,'endsAt',r.ends,'seed',r.seed,
      'count',(SELECT COUNT(*) FROM minigame_players p WHERE p.room=r.room AND p.round_id=r.id AND p.withdrawn IS NULL),
      'actions',json((SELECT json_group_array(json_object('player',player,'game',game,'beat',beat,'at',at,
        'move',move,'aim',aim,'power',power,'points',points,'x',x,'y',y)) FROM (
        SELECT player,game,beat,at,move,aim,power,points,x,y FROM minigame_actions a
        WHERE a.room=r.room AND a.round_id=r.id AND a.at>? ORDER BY a.at,a.player
      ))),
      'players',json((SELECT json_group_array(json_object('id',player,'nickname',nickname,'score',score,'withdrawn',withdrawn,'online',online)) FROM (
        SELECT p.player,p.nickname,p.withdrawn,${scoreFor} AS score,
          EXISTS(SELECT 1 FROM walkers w WHERE w.room=p.room AND w.id=p.player AND w.updated>=?) AS online
        FROM minigame_players p WHERE p.room=r.room AND p.round_id=r.id
        ORDER BY p.withdrawn IS NOT NULL,score DESC,p.joined,p.player LIMIT 12
      ))),
      'self',json((SELECT json_object('score',${scoreFor},'withdrawn',p.withdrawn,'hits',json((
        SELECT json_group_array(json_object('beat',h.beat,'points',h.points)) FROM minigame_hits h
        WHERE h.room=p.room AND h.round_id=p.round_id AND h.player=p.player
      ))) FROM minigame_players p WHERE p.room=r.room AND p.round_id=r.id AND p.player=?)
      ))) FROM minigame_rounds r WHERE r.room=? AND r.closes>? AND NOT EXISTS (
        SELECT 1 FROM minigame_rounds latest WHERE latest.room=r.room AND latest.game=r.game AND latest.starts>r.starts
      )) AS games,
    (SELECT json_group_array(json_object('player',player,'game',game,'id',request,'at',at,'x',x,'y',y,
      'angle',angle,'power',power,'points',points,'count',count,'arrows',arrows,'action',action)) FROM (
      SELECT f.* FROM minigame_free f JOIN walkers w ON w.room=f.room AND w.id=f.player
      WHERE f.room=? AND w.updated>=?
      ORDER BY (f.player<>?),f.at DESC LIMIT 64
    )) AS free,
    (SELECT json_group_array(json_object('player',player,'game','kite','id',request,'at',at,
      'x',x,'y',y,'angle',angle,'power',power,'points',points,'count',0,'arrows',0,'action','cut')) FROM (
      SELECT * FROM minigame_kite_cuts WHERE room=? AND at>? ORDER BY at DESC LIMIT 24
    )) AS kiteCuts, (${command.sql}) AS recognized
  `).bind(now-actionLifetime,online,id,room,now,room,online,id,room,now-kiteCutLifetime,...command.args);
}

export function minigamePayload(row,command){
  return {minigames:JSON.parse(row.games),minigameFree:JSON.parse(row.free),minigameKiteCuts:JSON.parse(row.kiteCuts),
    ...(command?{minigameResult:row.recognized?"accepted":"unavailable"}:{})};
}
