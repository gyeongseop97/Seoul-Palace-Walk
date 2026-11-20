import {shore} from "./pohang-beach-profile.js";

// Local metres and seconds on the shared ocean clock. Crests travel west toward the sand.
export const surfLineup = {x: shore(-93) + 34, z: -93};
export const surfBounds = {north: -158, south: 120, inner: 5, outer: 112};
const waveNumber = 2 * Math.PI / 34;
const waveRate = 2 * Math.PI / 8;
const setRate = 2 * Math.PI / 48;

function smooth(a, b, value) {
  const u = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

// These spatial terms are constant for an ocean vertex. Sending them as attributes keeps
// the shader's swell mask and peeling crest in exactly the same position as the board physics.
export function surfField(x, z, depth = x - shore(z)) {
  const {north, south, inner, outer} = surfBounds;
  if (depth <= inner || depth >= outer || z <= north || z >= south) return null;
  const strength = smooth(north, north + 30, z) * (1 - smooth(south - 36, south, z))
    * smooth(inner, 18, depth) * (1 - smooth(68, outer, depth));
  const phase = waveNumber * (x + .16 * z) + .53 * Math.sin(.047 * z) + .25 * Math.sin(.028 * z + 1.4);
  const alongshore = waveNumber * .16 + .53 * .047 * Math.cos(.047 * z) + .25 * .028 * Math.cos(.028 * z + 1.4);
  return {strength, phase, group: .024 * x + .016 * z, alongshore};
}

// A train of waves steepens over the sandbar. The asymmetric profile has a steep
// shoreward face and a gentler shoulder. Six waves make up one swell set.
export function surfHeight(strength, spatialPhase, group, seconds) {
  const phase = spatialPhase + waveRate * seconds;
  const q = Math.cos(phase), s = Math.sin(phase);
  const gain = .78 + .22 * Math.cos(group + setRate * seconds);
  return 1.96 * strength * gain * (q + .42 * (q * q - .5) + .17 * s * s * s);
}

export function surfSample(x, z, seconds) {
  const field = surfField(x, z);
  if (!field) return {height: 0, drive: 0, dx: -1, dz: 0};
  const phase = field.phase + waveRate * seconds;
  const q = Math.cos(phase), s = Math.sin(phase);
  const set = .78 + .22 * Math.cos(field.group + setRate * seconds);
  const height = surfHeight(field.strength, field.phase, field.group, seconds);
  const drive = field.strength * set * smooth(-.64, .52, q) * (1 - smooth(-.06, .52, s));
  const length = Math.hypot(waveNumber, field.alongshore);
  return {height, drive, dx: -waveNumber / length, dz: -field.alongshore / length};
}

// GPU counterpart to surfSample. xyz carries the added water slopes and crest foam.
export const surfVertexShader = `
  if (surfField.x > 0.) {
    float angle = surfField.y + uTime * ${waveRate};
    float q = cos(angle), s = sin(angle);
    float setGain = .78 + .22 * cos(surfField.z + uTime * ${setRate});
    float amplitude = 1.96 * surfField.x * setGain;
    w.y += amplitude * (q + .42 * (q*q - .5) + .17*s*s*s);
    float slope = amplitude * (-s * (1. + .84*q) + .51 * s*s*q);
    breaker.xy = slope * vec2(${waveNumber}, surfField.w);
    float crest = smoothstep(.47, .94, q) * (1. - smoothstep(.20, .84, s));
    float spilling = 1. - smoothstep(41., 77., depth);
    breaker.z = surfField.x * spilling * (.45 + .55 * setGain) * crest;
  }
`;
