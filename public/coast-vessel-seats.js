// Positions use the unscaled hull frame. A seated guest faces local +z at yaw 0.
export const cruiseSeats = [];
export const cruiseTables = [];

function seat(id, name, x, z, floor, yaw, approach, width, tableId = null) {
  cruiseSeats.push({id, name, x, z, floor, yaw, approach, width, depth: .68, seatHeight: .47, tableId});
}

for (const side of [-1, 1]) {
  const sideId = side < 0 ? "port" : "starboard";
  // Leave the cross-aisle from the boarding gate clear all the way to the salon aisle.
  for (const [index, z] of [-4.30, side < 0 ? 3.15 : 2.35].entries()) {
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

// Set the lounge group across the starboard porch, clear of the turn between flights.
cruiseTables.push({id: "lounge", x: 1.65, z: -11.85, floor: 5.46, radius: .43, height: .69});
for (const direction of [-1, 1]) {
  const x = 1.65 + direction * .96;
  seat("lounge-" + (direction < 0 ? "aft" : "fore"), "라운지 테이블 좌석", x, -11.85, 5.46,
    -direction * Math.PI / 2, {x, z: -10.82}, .79, "lounge");
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
export function cruiseSeatSpot(seat) {
  // Keep the hips on the cushion with the lower legs clear of its front edge.
  const forward = seat.depth / 2 - .11;
  return {x: seat.x + Math.sin(seat.yaw) * forward, z: seat.z + Math.cos(seat.yaw) * forward};
}
export function cruiseSeatInReach(seat, x, z, floor) {
  return Boolean(seat && Math.abs(floor - seat.floor) < .22 &&
    Math.hypot(x - seat.approach.x, z - seat.approach.z) < 1.05);
}
export function cruiseSeatHeading(ship, seat) {
  return ((180 - (ship.yaw + seat.yaw) * 180 / Math.PI) % 360 + 360) % 360;
}
