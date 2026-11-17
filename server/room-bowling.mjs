import {ARCADE_BOWLING, ARCADE_SITE} from "../public/arcade-layout.js";
import {interiorAt} from "../public/interior-layout.js";
import {advanceBowlingMatch, BOWLING_OFFSET_LIMIT, BOWLING_ROLL_MS, bowlingFrame, bowlingMatchRoll, bowlingTurn, makeBowlingMatch}
  from "../public/arcade-bowling.js";

const schema = `CREATE TABLE IF NOT EXISTS room_bowling (
  room TEXT PRIMARY KEY, revision INTEGER NOT NULL, updated INTEGER NOT NULL, state TEXT NOT NULL
)`;
const ready = new WeakMap();
const inLane = ARCADE_BOWLING.reach + .2;
const nearLane = 5.4;
const foulLineReach = .42;
const idleTurnMs = 60000;
const onlineMs = 9000;
const recentAcks = 64;
const emptyState = {match: null, withdrawn: [], acks: [], turnSince: 0};

export function ensureRoomBowling(db) {
  let pending = ready.get(db);
  if (!pending) {
    pending = db.prepare(schema).bind().all().catch(error => {
      ready.delete(db);
      throw error;
    });
    ready.set(db, pending);
  }
  return pending;
}

export function validBowling(command) {
  if (typeof command?.id !== "string" || !/^[a-f0-9]{32}$/.test(command.id)) return false;
  if (["join", "leave"].includes(command.action)) return true;
  return command.action === "throw" && Number.isFinite(command.pan) && command.pan >= 0 && command.pan <= 360 &&
    Number.isFinite(command.power) && command.power >= 0 && command.power <= 1;
}

export const selectRoomBowling = (db, room) =>
  db.prepare("SELECT revision,state FROM room_bowling WHERE room=?").bind(room);
export const pruneRoomBowling = (db, now) =>
  db.prepare("DELETE FROM room_bowling WHERE updated<?").bind(now - 86400000);

function canBowl(avatar, reach) {
  return avatar && interiorAt(avatar.x, avatar.y) === ARCADE_SITE.id &&
    Math.hypot(avatar.x - ARCADE_BOWLING.x, avatar.y - ARCADE_BOWLING.y) <= reach &&
    avatar.seat == null && !avatar.bus && !avatar.bikeRide && !(avatar.bike && !avatar.bike.parked) &&
    (!avatar.arcade || avatar.arcade.kind === "bowling");
}

function removePlayer(match, id) {
  const position = match.players.findIndex(player => player.id === id);
  if (position < 0) return match;
  const players = match.players.filter(player => player.id !== id);
  if (!players.length) return null;
  if (match.turn !== id) return {...match, players};
  const following = [...players.slice(position), ...players.slice(0, position)];
  const next = following.find(player => bowlingTurn({...match, players, turn: player.id, standing: 1023}));
  return {...match, players, turn: next?.id ?? null, phase: next ? "playing" : "finished", standing: 1023};
}

function reconcile(state, players, now) {
  let {match, withdrawn, turnSince} = state;
  if (!match) return state;
  const rollFinished = match.roll && now >= match.roll.at + BOWLING_ROLL_MS;
  if (rollFinished) {
    const result = bowlingFrame(match.roll, match.roll.at + BOWLING_ROLL_MS);
    const knocked = result.pins.reduce((total, pin) => total + Number(pin.visible && pin.fall > 0), 0);
    match = advanceBowlingMatch(match, knocked, result.standing);
    turnSince = now;
  }
  for (const player of match.players) {
    if (match?.rollPlayer === player.id) continue;
    const live = players.get(player.id);
    if (!withdrawn.includes(player.id) && live?.updated >= now - onlineMs && canBowl(live.avatar, nearLane)) continue;
    if (match?.turn === player.id) turnSince = now;
    match = removePlayer(match, player.id);
  }
  if (match?.turn && !match.roll && match.players.length > 1 && now - turnSince >= idleTurnMs) {
    match = removePlayer(match, match.turn);
    turnSince = now;
  }
  if (match === state.match) return state;
  withdrawn = withdrawn.filter(id => match?.players.some(player => player.id === id));
  return {...state, match, withdrawn, turnSince};
}

function perform(state, {id, command}, player, now) {
  const {action} = command;
  const answer = reason => reason ? {id: command.id, accepted: false, reason} : {id: command.id, accepted: true};
  const recorded = state.acks.find(entry => entry.command === command.id && entry.player === id);
  if (recorded) return [state, answer(recorded.reason)];
  const record = (next, reason) => [{
    ...next, acks: [...next.acks.slice(1 - recentAcks), {command: command.id, player: id, reason}]
  }, answer(reason)];
  const rejected = reason => record(state, reason);

  const {match, withdrawn} = state;
  const alreadyJoined = match?.players.some(player => player.id === id);
  let next = state;
  if (action === "leave") {
    if (!alreadyJoined) return record(state);
    if (match.rollPlayer === id) {
      next = {...state, withdrawn: [...new Set([...withdrawn, id])]};
    } else {
      next = {...state, match: removePlayer(match, id), withdrawn: withdrawn.filter(player => player !== id),
        turnSince: match.turn === id ? now : state.turnSince};
    }
  } else if (!canBowl(player?.avatar, inLane)) {
    return rejected("too-far");
  } else if (action === "join") {
    if (!match || match.phase === "finished") {
      next = {...state, match: makeBowlingMatch([{id, nickname: player.nickname}]), withdrawn: [], turnSince: now};
    } else if (!alreadyJoined) {
      next = {...state, match: {...match, players: [...match.players, {id, nickname: player.nickname, frames: []}]},
        turnSince: match.players.length < 2 ? now : state.turnSince};
    } else if (withdrawn.includes(id)) {
      next = {...state, withdrawn: withdrawn.filter(player => player !== id)};
    }
  } else {
    if (!alreadyJoined || withdrawn.includes(id)) return rejected("not-joined");
    if (match.phase === "finished") return rejected("finished");
    if (match.turn !== id) return rejected("not-your-turn");
    if (match.roll) return rejected("rolling");
    const offset = ARCADE_BOWLING.y - player.avatar.y;
    if (Math.abs(player.avatar.x - ARCADE_BOWLING.x) > foulLineReach || Math.abs(offset) > BOWLING_OFFSET_LIMIT + .001) {
      return rejected("too-far");
    }
    const roll = bowlingMatchRoll(match, command.pan, command.power, now, offset);
    if (!roll) return rejected("not-your-turn");
    next = {...state, match: {...match, roll, rollPlayer: id}, turnSince: now};
  }
  return record(next);
}

function saveState(db, {room, id, key, now}, row, state) {
  const authenticated = "EXISTS(SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=? AND updated>=?)";
  const args = [room, id, key, now - onlineMs];
  const data = JSON.stringify(state);
  if (!row) {
    return db.prepare(`
      INSERT INTO room_bowling(room,revision,updated,state) SELECT ?,1,?,? WHERE ${authenticated}
      ON CONFLICT(room) DO NOTHING RETURNING revision
    `).bind(room, now, data, ...args).all();
  }
  return db.prepare(`
    UPDATE room_bowling SET revision=revision+1,updated=?,state=? WHERE room=? AND revision=? AND ${authenticated}
    RETURNING revision
  `).bind(now, data, room, row.revision, ...args).all();
}

function bowlingPlayers(rows, avatars, now) {
  return new Map(rows.filter(row => row.updated >= now - onlineMs).map(row => [
    row.id, {updated: row.updated, avatar: avatars?.get(row.id) ?? JSON.parse(row.avatar), nickname: row.nickname || "동행"}
  ]));
}

export async function roomBowling(db, context) {
  const {room, id, key, command, now, avatar} = context;
  const inside = interiorAt(avatar.x, avatar.y) === ARCADE_SITE.id;
  if (!inside && !command) return {bowling: null};
  let {row, rows, avatars} = context;
  let match = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const time = Math.max(now, Date.now());
    const actors = bowlingPlayers(rows, avatars, time);
    const before = row ? JSON.parse(row.state) : emptyState;
    const settled = reconcile(before, actors, time);
    const [after, result] = command ? perform(settled, context, actors.get(id), time) : [settled, undefined];
    match = before.match;
    if (after === before || (await saveState(db, {room, id, key, now: time}, row, after)).results.length) {
      return {bowling: inside ? after.match : null, bowlingResult: result};
    }
    // A concurrent request changed the roster or the ball. Re-evaluate the command
    // on that version with fresh nearby players before attempting the update again.
    const [updated, walkers] = await db.batch([
      selectRoomBowling(db, room),
      db.prepare("SELECT id,updated,avatar,nickname FROM walkers WHERE room=? AND updated>=?").bind(room, time - onlineMs)
    ]);
    row = updated.results[0];
    rows = walkers.results;
    avatars = null;
  }
  return {bowling: inside ? match : null, bowlingResult: command ? {id: command.id, accepted: false, reason: "busy"} : undefined};
}
