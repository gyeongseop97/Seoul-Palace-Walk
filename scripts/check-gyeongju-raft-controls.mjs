import assert from "node:assert/strict";
import {RAFT_INDEX,busSeatPose} from "../public/bus-network.js";
import {raftStops} from "../public/gyeongju-raft-layout.js";
import {takeRaftHelm,driveRaft,raftPoseAt,releaseRaft} from "../public/gyeongju-raft-navigation.js";
import * as captain from "../public/raft-client.js?captain";
import * as passenger from "../public/raft-client.js?passenger";

const time=Date.UTC(2026,0,1)+2000,lease="a".repeat(32);
const manual={...takeRaftHelm(null,time,"kim"),lease};
for(const [client,id] of [[captain,"kim"],[passenger,"lee"]])client.receiveRaft(manual,id,time);
assert.equal(captain.clientRaftAt(time).stopId,raftStops[0].id);
assert.equal(passenger.drivePacket(time),null);
assert.equal(passenger.raftCommand("moor"),null);
assert.equal(captain.setRaftAxes(1,.6,time),true);
const command=captain.drivePacket(time);
assert.deepEqual(command,{action:"drive",lease,seq:1,throttle:1,turn:.6});
assert.equal(captain.drivePacket(time+100),null);
// The pilot sees input immediately, even before the next room response arrives.
assert(captain.clientRaftAt(time+160).heading>manual.heading);
const confirmation={...driveRaft(manual,time+110,command),lease};
captain.receiveRaft(confirmation,"kim",time+230);
passenger.receiveRaft(confirmation,"lee",time+260);
const frame=time+1300,actual=raftPoseAt(confirmation,frame);
for(const client of [captain,passenger]){
 const boat=client.busAt(RAFT_INDEX,frame);
 assert(Math.hypot(actual.x-boat.x,actual.y-boat.y)<.003);
 assert(Math.abs(actual.heading-boat.heading)<.02);
 assert.equal(boat.stopId,null);
 assert.equal(client.nearBus(raftStops[0].board,frame),null);
 assert(Math.hypot(busSeatPose(boat,2).x-actual.x,busSeatPose(boat,2).y-actual.y)<1);
}
assert.equal(captain.setRaftAxes(0,0,frame),true);
assert.equal(captain.drivePacket(frame,false).throttle,0);
assert.equal(captain.drivePacket(frame+900,false),null);
assert.equal(captain.drivePacket(frame+900).seq,3);
assert.equal(captain.setRaftAxes(1,1,manual.leaseUntil+20000),true);
assert(Number.isFinite(captain.clientRaftAt(manual.leaseUntil+20001).x));
assert.equal(captain.drivePacket(manual.leaseUntil+20000),null);
const released=releaseRaft(confirmation,frame);
captain.receiveRaft(released,"kim",frame+1);
assert.equal(captain.raftCommand("release"),null);
assert.equal(captain.drivePacket(frame+1),null);
captain.resetRaft();
assert.equal(captain.clientRaftAt(time).stopId,raftStops[0].id);
console.log("Raft controls: immediate helm response, passenger convergence, bus-seat alignment, background neutral input and lease expiry passed.");
