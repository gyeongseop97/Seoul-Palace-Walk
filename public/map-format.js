// Outdoor neighbourhoods share one physical scale. Overview and indoor plans
// supply their surveyed bounds instead. The short side always fits the panel.
export const nearbyMap = "nearby";
export const mapFormat = Object.freeze({
  nearbySpan: 340,
  miniSpan: 126,
  minZoom: .23,
  maxZoom: 1.3,
  playerScale: .72,
  playerDot: 5,
  placeDot: 3,
  placeHit: 9,
  destinationDot: 5,
  trackedRing: 11,
});

export function fitMapBounds(key, center, width, height) {
  const nearby = key === nearbyMap;
  const span = mapFormat.nearbySpan;
  const [x, y, w, h] = nearby
    ? [center.x - span / 2, center.y - span / 2, span, span]
    : key.split(" ").map(Number);
  const aspect = width > 0 && height > 0 ? width / height : w / h;
  const fittedWidth = Math.max(w, h * aspect), fittedHeight = Math.max(h, w / aspect);
  return {x: x + (w - fittedWidth) / 2, y: y + (h - fittedHeight) / 2, w: fittedWidth, h: fittedHeight};
}

export function drawMapGround(base, svg, mini, bounds) {
  const defs = svg(base, "defs", {});
  const id = mini ? "mini-map-grid" : "world-map-grid";
  const pattern = svg(defs, "pattern", {id, width: 28, height: 28, patternUnits: "userSpaceOnUse"});
  svg(pattern, "rect", {width: 28, height: 28, fill: "var(--map-ground)"});
  svg(pattern, "path", {d: "M28 0H0V28", fill: "none", stroke: "var(--map-grid)", "stroke-opacity": .1, "stroke-width": .7});
  const [x, y, width, height] = bounds.split(" ").map(Number);
  svg(base, "rect", {x: x - width, y: y - height, width: width * 3, height: height * 3,
    fill: "url(#" + id + ")", "pointer-events": "none"});
  return {defs, outdoors: svg(base, "g", {class: "outdoor-map-ground"})};
}
