type CharmKind = "orange" | "flower" | "star" | "planet" | "bolt";

/** Original enamel and translucent acrylic silhouettes, drawn at a 64-unit scale. */
export function paintKeychainCharm(context: CanvasRenderingContext2D, kind: CharmKind, radius: number, color?: string) {
  context.save(); context.scale(radius / 30, radius / 30);
  const outlines: Record<CharmKind, string> = {
    orange: "M1 -25C15 -29 28 -16 28 1C28 19 17 29 0 29C-18 29 -29 16 -28 0C-28 -15 -16 -27 1 -25Z",
    flower: "M-8 -14C-20 -32 -34 -17 -21 -5C-40 0 -29 19 -14 12C-18 32 4 36 9 18C22 34 38 16 23 5C42 -3 26 -24 13 -15C9 -34 -11 -34 -8 -14Z",
    star: "M0 -31L9 -12L30 -10L15 6L19 28L0 18L-20 28L-16 6L-31 -10L-10 -13Z",
    planet: "M-27 -2C-27 -17 -16 -28 0 -28C16 -28 26 -16 26 0C26 16 15 27 0 27C-16 27 -27 15 -27 -2Z",
    bolt: "M2 -32L-23 4L-5 5L-11 32L25 -10L7 -10L13 -31Z",
  };
  const fill = color || ({ orange: "#f48b35", flower: "#b7a9ee", star: "#89c9df", planet: "#5f738e", bolt: "#f6ce5a" })[kind];
  const silhouette = new Path2D(outlines[kind]);
  context.shadowColor = "#00000035"; context.shadowBlur = 7; context.shadowOffsetX = 2; context.shadowOffsetY = 5;
  context.fillStyle = fill; context.fill(silhouette); context.shadowColor = "transparent";
  context.strokeStyle = "#28333e"; context.lineWidth = 2.8; context.stroke(silhouette);
  context.save(); context.clip(silhouette);
  const glaze = context.createLinearGradient(-22, -29, 17, 25); glaze.addColorStop(0, "#ffffff65"); glaze.addColorStop(.38, "#ffffff00"); glaze.addColorStop(1, "#00000028");
  context.fillStyle = glaze; context.fillRect(-40, -40, 80, 80);
  context.restore();
  context.lineCap = "round"; context.lineJoin = "round";
  if (kind === "orange") {
    context.beginPath(); context.arc(0, 1, 21, 0, Math.PI * 2); context.fillStyle = "#ffd77d"; context.fill(); context.strokeStyle = "#fff1b6"; context.lineWidth = 2; context.stroke();
    for (let segment = 0; segment < 7; segment++) {
      context.save(); context.translate(0, 1); context.rotate(segment / 7 * Math.PI * 2);
      context.beginPath(); context.moveTo(3, -2); context.arc(0, 0, 16.5, -.12, .66); context.closePath(); context.fillStyle = segment % 2 ? "#f4a332" : "#f8b841"; context.fill(); context.restore();
    }
    context.beginPath(); context.moveTo(1, -25); context.quadraticCurveTo(5, -36, 18, -32); context.quadraticCurveTo(14, -21, 1, -25); context.fillStyle = "#669157"; context.fill(); context.strokeStyle = "#28333e"; context.lineWidth = 1.6; context.stroke();
  } else if (kind === "flower") {
    context.beginPath(); context.arc(0, 1, 10, 0, Math.PI * 2); context.fillStyle = "#ffce5f"; context.fill(); context.strokeStyle = "#564761"; context.lineWidth = 1.4; context.stroke();
    context.fillStyle = "#b27f36"; for (const [x, y] of [[-3, -2], [3, 0], [0, 5]]) { context.beginPath(); context.arc(x, y, 1.2, 0, Math.PI * 2); context.fill(); }
    context.strokeStyle = "#ede6ff"; context.lineWidth = 2; for (let i = 0; i < 5; i++) { context.save(); context.rotate(i * Math.PI * 2 / 5); context.beginPath(); context.moveTo(0, -14); context.lineTo(-2, -22); context.stroke(); context.restore(); }
  } else if (kind === "planet") {
    context.beginPath(); context.ellipse(0, 1, 36, 9, -.35, 0, Math.PI * 2); context.strokeStyle = "#28333e"; context.lineWidth = 7; context.stroke(); context.strokeStyle = "#e2bb77"; context.lineWidth = 4; context.stroke();
    context.beginPath(); context.arc(0, 0, 22, Math.PI * 1.1, Math.PI * 1.75); context.strokeStyle = "#b8d3e5"; context.lineWidth = 2; context.stroke();
    context.fillStyle = "#dbe9f1"; context.beginPath(); context.arc(8, -10, 2, 0, Math.PI * 2); context.fill();
  } else {
    context.save(); context.scale(.76, .76); context.strokeStyle = "#ffffff87"; context.lineWidth = 1.6; context.stroke(silhouette); context.restore();
    if (kind === "star") { context.fillStyle = "#f0fbfc"; context.beginPath(); context.arc(-5, -4, 2.5, 0, Math.PI * 2); context.fill(); }
  }
  context.restore();
}

export function paintChainLink(context: CanvasRenderingContext2D, x: number, y: number, angle: number, edgeOn = false, scale = 1) {
  context.save(); context.translate(x, y); context.rotate(angle); context.scale(scale, scale);
  context.beginPath(); context.ellipse(0, 0, edgeOn ? 2.1 : 4.2, 6.6, 0, 0, Math.PI * 2);
  context.strokeStyle = "#344454"; context.lineWidth = 3.4; context.stroke();
  context.strokeStyle = "#bac8d0"; context.lineWidth = 1.7; context.stroke();
  context.beginPath(); context.ellipse(0, 0, edgeOn ? 2.1 : 4.2, 6.6, 0, Math.PI * 1.05, Math.PI * 1.8); context.strokeStyle = "#f6fbff"; context.lineWidth = 1; context.stroke();
  context.restore();
}
