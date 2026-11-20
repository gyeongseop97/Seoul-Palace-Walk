import * as T from "three";
import {shore} from "./pohang-beach-profile.js";
import {surfLineup} from "./pohang-surf-waves.js";
import {oceanSurface} from "./pohang-water.js";

// The two floats let a paddler find the takeoff area from water level.
export function buildSurfBuoys(root) {
  const profile = [[0, -.46], [.32, -.28], [.46, .06], [.43, .25], [.25, .46],
    [.12, .51], [.11, .95], [.07, 1.03], [0, 1.03]];
  const hull = new T.LatheGeometry(profile.map(([radius, height]) => new T.Vector2(radius, height)), 16);
  const yellow = new T.MeshStandardMaterial({color: 0xffbd30, roughness: .62});
  const stripe = new T.MeshStandardMaterial({color: 0xfff3d4, roughness: .48});
  const band = new T.CylinderGeometry(.113, .119, .15, 16, 1, true);
  const offshore = surfLineup.x - shore(surfLineup.z);
  const floats = [-22, 22].map(offset => {
    const float = new T.Mesh(hull, yellow);
    const reflector = new T.Mesh(band, stripe);
    reflector.position.y = .74;
    float.add(reflector);
    const z = surfLineup.z + offset;
    float.position.set(shore(z) + offshore, 0, z);
    root.add(float);
    return float;
  });
  return (seconds, player) => {
    for (const float of floats) {
      const {x, z} = float.position;
      float.visible = Math.hypot(x - player.x, z - player.z) < 400;
      if (!float.visible) continue;
      const height = oceanSurface(x, z, seconds);
      float.position.y = height;
      float.rotation.z = .65 * Math.atan2(oceanSurface(x + .5, z, seconds) - height, .5);
      float.rotation.x = -.65 * Math.atan2(oceanSurface(x, z + .5, seconds) - height, .5);
    }
  };
}
