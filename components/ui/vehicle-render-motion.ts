import type { VehicleMotionFrame } from "./vehicle-motion";
import { bikeRiderArmPath, bikeRiderTorsoPath } from "./superbike-art";

function carBodyPoint(x: number, y: number, frame: VehicleMotionFrame): [number, number] {
  const angle = frame.pitch * Math.PI / 180, dx = x - 321, dy = y - 190;
  return [321 + dx * Math.cos(angle) - dy * Math.sin(angle), 190 + dx * Math.sin(angle) + dy * Math.cos(angle) + frame.bodyY];
}

/** Wishbone wheel ends stay on fixed axles while body ends follow spring/pitch. */
export function updateCarJoints(root: SVGSVGElement, frame: VehicleMotionFrame): void {
  for (const [name, x, y, axle] of [["front-upper", 425, 174, 491], ["front-lower", 412, 204, 491], ["rear-upper", 211, 166, 151], ["rear-lower", 215, 204, 151]] as const) {
    const point = carBodyPoint(x, y, frame);
    root.querySelector(`.car-${name}-link`)?.setAttribute("d", `M${point[0].toFixed(3)} ${point[1].toFixed(3)}L${axle} 190`);
  }
}

/** Only joint geometry changes here; the shared hook owns the sole frame loop. */
export function updateBikeJoints(root: SVGSVGElement, frame: VehicleMotionFrame): void {
  root.querySelector(".bike-rider-torso")?.setAttribute("d", bikeRiderTorsoPath(frame.riderTuck));
  const arm = bikeRiderArmPath(frame.riderTuck);
  root.querySelector(".bike-rider-arm")?.setAttribute("d", arm);
  root.querySelector(".bike-rider-arm-outline")?.setAttribute("d", arm);
  const scale = Math.max(.45, 1 - frame.rearSquat / 28);
  root.querySelector(".bike-rear-shock")?.setAttribute("transform", `translate(265 111) scale(1 ${scale.toFixed(4)}) translate(-265 -111)`);
}
