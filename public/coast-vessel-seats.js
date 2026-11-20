// Positions use the unscaled hull frame. A seated guest faces local +z at yaw 0.
export const cruiseSeats = [];
export const cruiseTables = [];

function seat(id, name, x, z, floor, yaw, approach, width, tableId = null) {
  cruiseSeats.push({id, name, x, z, floor, yaw, approach, width, depth: .68, seatHeight: .47, tableId});
}

for (const side of [-1, 1]) {
  const sideId = side < 0 ? "port" : "starboard";
  for (const [index, z] of [-4.30, 2.35].entries()) {
    const tableId = "salon-" + sideId + "-" + index;
    const x = side * 2.77;
    cruiseTables.push({id: tableId, x, z, floor: 2.46, radius: .53, height: .79});
    for (const direction of [-1, 1]) {
      const seatZ = z + direction * 1.10;
      seat(tableId + (direction < 0 ? "-aft" : "-fore"), "선실 창가 좌석", x, seatZ, 2.46,
        direction < 0 ? 0 : Math.PI, {x: side * 1.62, z: seatZ}, 1.12, tableId);
    }
  }
  for (const [index, z] of [-3.45, -.30].entries()) {
    seat("sun-" + sideId + "-" + index, "전망 갑판 좌석", side * 2.36, z, 7.85,
      -side * Math.PI / 2, {x: side * 1.40, z}, .96);
  }
}

cruiseTables.push({id: "lounge", x: -.05, z: -11.13, floor: 5.46, radius: .43, height: .69});
for (const direction of [-1, 1]) {
  const z = -11.13 + direction * .96;
  seat("lounge-" + (direction < 0 ? "aft" : "fore"), "라운지 테이블 좌석", -.05, z, 5.46,
    direction < 0 ? 0 : Math.PI, {x: .98, z}, .79, "lounge");
}
for (const [index, x] of [.15, 2.05].entries()) {
  seat("stern-" + index, "후미 갑판 좌석", x, -15.75, 2.46, 0, {x, z: -14.78}, 1.15);
}

export function cruiseFurnitureBlocks(p, floor) {
  // Leave clearance for a walking avatar's hips around the actual table and seat outlines.
  const margin = .18;
  for (const table of cruiseTables) {
    if (table.floor === floor && Math.hypot(p.x - table.x, p.z - table.z) < table.radius + margin) return true;
  }
  for (const s of cruiseSeats) {
    if (s.floor !== floor) continue;
    const dx = p.x - s.x, dz = p.z - s.z;
    const c = Math.cos(s.yaw), a = Math.sin(s.yaw);
    if (Math.abs(dx * c - dz * a) < s.width / 2 + margin &&
        Math.abs(dx * a + dz * c) < s.depth / 2 + margin) return true;
  }
  return false;
}

export const cruiseSeatById = new Map(cruiseSeats.map(s => [s.id, s]));
export function cruiseSeatInReach(seat, x, z, floor) {
  return Boolean(seat && Math.abs(floor - seat.floor) < .22 &&
    Math.hypot(x - seat.approach.x, z - seat.approach.z) < 1.05);
}
export function cruiseSeatHeading(ship, seat) {
  return ((180 - (ship.yaw + seat.yaw) * 180 / Math.PI) % 360 + 360) % 360;
}
