const laneColors = ["#68c8d8", "#f0bc6e", "#ef89a9", "#9ed0a3"];
const laneAngles = [-Math.PI / 2, 0, Math.PI, Math.PI / 2];
const arrowOutline = [[0, -.48], [.43, -.03], [.2, -.03], [.2, .4], [-.2, .4], [-.2, -.03], [-.43, -.03]];

function arrow(context, lane, x, y, size, color, outline) {
  context.save();
  context.translate(x, y);
  context.rotate(laneAngles[lane]);
  context.beginPath();
  arrowOutline.forEach(([px, py], index) => {
    if (index === 0) context.moveTo(px * size, py * size);
    else context.lineTo(px * size, py * size);
  });
  context.closePath();
  if (outline) {
    context.strokeStyle = outline;
    context.lineWidth = Math.max(1, size * .1);
    context.lineJoin = "round";
    context.stroke();
  }
  context.fillStyle = color;
  context.fill();
  context.restore();
}

export function drawPumpTrack(context, state) {
  const {width, height} = context.canvas;
  context.fillStyle = "#16252d";
  context.fillRect(0, 0, width, height);

  const laneWidth = width / 4;
  const start = height * .09, goal = height * .78, distance = goal - start;
  const tolerance = distance * (state?.hitZone ?? .13);
  const iconSize = height * .19;
  for (let lane = 0; lane < laneColors.length; lane++) {
    const x = laneWidth * lane, color = laneColors[lane];
    const lit = lane === state?.litLane;
    context.fillStyle = color;
    context.globalAlpha = lane === state?.readyLane ? .19 : .065;
    context.fillRect(x + 1, 0, laneWidth - 2, height);
    context.globalAlpha = lit ? .55 : .18;
    context.fillRect(x + 1, goal - tolerance, laneWidth - 2, 2 * tolerance);
    context.globalAlpha = 1;
    context.strokeStyle = "#c8d6d988";
    context.beginPath();
    context.moveTo(x, goal);
    context.lineTo(x + laneWidth, goal);
    context.stroke();
    arrow(context, lane, x + laneWidth / 2, goal, iconSize, lit ? "#fff5e4" : "#20333e", color);
  }

  for (const {lane, progress} of state?.notes ?? []) {
    const x = laneWidth * (lane + .5), y = start + progress * distance;
    arrow(context, lane, x, y, iconSize, laneColors[lane], "#101b20");
  }
  if (!state?.active) {
    context.fillStyle = "#f4e4c4";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `600 ${Math.round(height * .14)}px sans-serif`;
    context.fillText(state?.finished ? `점수 ${state.score}` : "화살표에 맞춰 밟기", width / 2, height * .36);
  }
}
