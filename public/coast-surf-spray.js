import * as T from "three";
import {seaPoint} from "./region-coordinates.js";

// Drops leave the rail in world space, so a turn leaves a curved fan behind it.
export function buildSurfSpray(root, waterline) {
  const capacity = 128;
  const drops = new Array(capacity);
  const positions = new T.Float32BufferAttribute(new Float32Array(capacity * 3), 3);
  const sizes = new T.Float32BufferAttribute(new Float32Array(capacity), 1);
  positions.setUsage(T.DynamicDrawUsage);
  sizes.setUsage(T.DynamicDrawUsage);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", positions);
  geometry.setAttribute("diameter", sizes);
  const material = new T.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {pixels: {value: 1}, brightness: {value: 1}},
    vertexShader: `
      uniform float pixels;
      attribute float diameter;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(diameter * pixels * projectionMatrix[1][1] / max(.5, -view.z), 1., 18.);
      }`,
    fragmentShader: `
      uniform float brightness;
      void main() {
        float opacity = 1. - smoothstep(.04, .25, dot(gl_PointCoord - .5, gl_PointCoord - .5));
        gl_FragColor = vec4(vec3(.80, .93, .94) * brightness, .68 * opacity);
        #include <colorspace_fragment>
      }`
  });
  const mist = new T.Points(geometry, material);
  mist.frustumCulled = false;
  mist.renderOrder = 2;
  mist.visible = false;
  root.add(mist);
  let next = 0, lastEmission = -Infinity;
  return (players, viewer, t, night, height) => {
    if (t < lastEmission) { drops.fill(null); lastEmission = -Infinity; }
    if (t - lastEmission >= .045) {
      lastEmission = t;
      for (const player of players) {
        const ride = player.coast?.surf;
        if (player.coast?.mode !== "surf" || !ride || ride.rise < .35 || ride.speed < 3) continue;
        const p = seaPoint(player);
        if (Math.hypot(p.x - viewer.x, p.z - viewer.z) > 65) continue;
        const angle = player.heading * Math.PI / 180, fx = Math.sin(angle), fz = -Math.cos(angle);
        const x = p.x - .78 * fx, z = p.z - .78 * fz, y = waterline(x, z) + .08;
        for (const side of [-1, 1]) {
          const force = .55 + Math.max(0, side * ride.bank) * 1.6 + Math.random() * .7;
          drops[next] = {t, x: x - side * .19 * fz, z: z + side * .19 * fx, y,
            vx: -side * fz * force + .32 * fx * ride.speed,
            vz: side * fx * force + .32 * fz * ride.speed,
            vy: 1.0 + force * .57, diameter: .037 + Math.random() * .058};
          next = (next + 1) % capacity;
        }
      }
    }
    let count = 0;
    for (const drop of drops) {
      if (!drop) continue;
      const age = t - drop.t, life = 2 * drop.vy / 9.81;
      if (age < 0 || age >= life) continue;
      positions.setXYZ(count, drop.x + drop.vx * age, drop.y + age * (drop.vy - 4.905 * age), drop.z + drop.vz * age);
      sizes.setX(count++, drop.diameter * (1 - age / life));
    }
    mist.visible = count > 0;
    if (!count) return;
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    geometry.setDrawRange(0, count);
    material.uniforms.pixels.value = height * .5;
    material.uniforms.brightness.value = 1 - .7 * night;
  };
}
