export type VehicleKind = "car" | "bike";

export type VehicleMotionInput = {
  /** Target speed, clamped to 0..1. */
  speed: number;
  /** Corner lean, clamped to -1..1 and mapped to maxLean degrees. */
  lean?: number;
  /** Allow one brief bike wheelie per launch from rest. */
  wheelie?: boolean;
};

export type VehicleMotionOptions = {
  kind?: VehicleKind;
  /** Metres per second. */
  maxSpeed?: number;
  /** Metres per second squared. */
  maxAcceleration?: number;
  maxBraking?: number;
  /** Velocity response time in seconds. */
  responseTime?: number;
  /** Physical wheel radius in metres. */
  wheelRadius?: number;
  /** Axle spacing in metres, used to delay the rear suspension's road input. */
  wheelbase?: number;
  /** SVG viewBox units per metre. Use 100 for a car or 200 for a bike. */
  pixelsPerMeter?: number;
  /** Maximum bike corner lean in degrees. */
  maxLean?: number;
  /** Deterministic road irregularity, clamped to 0..1. */
  roughness?: number;
  /** Repeating artwork widths in SVG viewBox units. */
  roadPeriod?: number;
  markingPeriod?: number;
  backgroundPeriod?: number;
};

export type VehicleSpring = { position: number; velocity: number };

/** Distances are metres, velocity is m/s, acceleration is m/s², angles are degrees. */
export type VehicleMotionState = {
  velocity: number;
  acceleration: number;
  travel: number;
  pitch: VehicleSpring;
  frontSuspension: VehicleSpring;
  rearSuspension: VehicleSpring;
  frontWing: VehicleSpring;
  rearWing: VehicleSpring;
  lean: VehicleSpring;
  riderTuck: VehicleSpring;
  wheelie: VehicleSpring;
  launchArmed: boolean;
  /** Active seconds since this launch, or -1 when no launch is in progress. */
  launchElapsed: number;
};

/** Renderer-ready values. Distances are SVG units, except travel, which stays in metres. */
export type VehicleMotionFrame = {
  speed: number;
  velocity: number;
  acceleration: number;
  travel: number;
  /** Unwrapped wheel angle in radians, exactly travel / wheelRadius. */
  wheelAngle: number;
  /** Wrapped clockwise wheel rotation in degrees. */
  wheelRotation: number;
  /** Positive pitch makes a right-facing vehicle's nose dive. */
  pitch: number;
  /** Suspension-only pitch, for a body inside a separate rear-axle wheelie group. */
  bodyPitch: number;
  bodyY: number;
  /** Positive values mean suspension compression. */
  frontSuspension: number;
  rearSuspension: number;
  frontWing: number;
  rearWing: number;
  forkCompression: number;
  rearSquat: number;
  lean: number;
  riderTuck: number;
  /** Positive lift angle. Already subtracted from pitch. */
  wheelie: number;
  wheelBlur: number;
  wheelSpokes: number;
  speedLines: number;
  speedLineOffset: number;
  roadOffset: number;
  markingOffset: number;
  backgroundOffset: number;
  farBackgroundOffset: number;
  shadowOpacity: number;
  shadowScaleX: number;
  shadowScaleY: number;
  heat: number;
  heatPhase: number;
};

const TAU = Math.PI * 2;
const MAX_FRAME_MS = 50;
const MAX_STEP_SECONDS = 1 / 120;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const finite = (value: number | undefined, fallback: number) => Number.isFinite(value) ? value! : fallback;
const unit = (value: number | undefined) => clamp(finite(value, 0), 0, 1);
const bounded = (value: number | undefined, fallback: number, min: number, max: number) => clamp(finite(value, fallback), min, max);
const smoothstep = (start: number, end: number, value: number) => {
  const progress = clamp((value - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
};
const spring = (): VehicleSpring => ({ position: 0, velocity: 0 });
const wrap = (value: number, period: number) => ((value % period) + period) % period;

function resolveOptions(options: VehicleMotionOptions) {
  const kind = options.kind === "bike" ? "bike" : "car";
  return {
    kind,
    maxSpeed: bounded(options.maxSpeed, kind === "bike" ? 60 : 70, 1, 150),
    maxAcceleration: bounded(options.maxAcceleration, kind === "bike" ? 14 : 18, 0.1, 100),
    maxBraking: bounded(options.maxBraking, kind === "bike" ? 22 : 28, 0.1, 150),
    responseTime: bounded(options.responseTime, 0.55, 0.05, 3),
    wheelRadius: bounded(options.wheelRadius, kind === "bike" ? 0.32 : 0.34, 0.05, 2),
    wheelbase: bounded(options.wheelbase, kind === "bike" ? 1.45 : 2.8, 0.25, 8),
    pixelsPerMeter: bounded(options.pixelsPerMeter, kind === "bike" ? 200 : 100, 1, 1000),
    maxLean: bounded(options.maxLean, 24, 0, 45),
    roughness: bounded(options.roughness, 0.55, 0, 1),
    roadPeriod: bounded(options.roadPeriod, 160, 1, 10000),
    markingPeriod: bounded(options.markingPeriod, 240, 1, 10000),
    backgroundPeriod: bounded(options.backgroundPeriod, 640, 1, 10000),
  };
}

export function createVehicleMotion(initialSpeed = 0, options: VehicleMotionOptions = {}): VehicleMotionState {
  return {
    velocity: unit(initialSpeed) * resolveOptions(options).maxSpeed,
    acceleration: 0,
    travel: 0,
    pitch: spring(), frontSuspension: spring(), rearSuspension: spring(),
    frontWing: spring(), rearWing: spring(), lean: spring(), riderTuck: spring(), wheelie: spring(),
    launchArmed: unit(initialSpeed) < 0.015,
    launchElapsed: -1,
  };
}

/** A neutral reduced-motion pose preserves wheel/road phase without accumulating hidden travel. */
export function restVehicleMotion(state: VehicleMotionState): VehicleMotionState {
  return { ...createVehicleMotion(), travel: state.travel };
}

/** Exact damped-spring solution for a constant target; stable even at the frame-duration cap. */
function stepSpring(state: VehicleSpring, target: number, seconds: number, frequency: number, damping = 0.8): VehicleSpring {
  const displacement = state.position - target;
  const decayRate = damping * frequency;
  const angular = frequency * Math.sqrt(1 - damping * damping);
  const decay = Math.exp(-decayRate * seconds);
  const sine = Math.sin(angular * seconds);
  const cosine = Math.cos(angular * seconds);
  const position = target + decay * (displacement * cosine + (state.velocity + decayRate * displacement) / angular * sine);
  const velocity = decay * (state.velocity * cosine - (decayRate * state.velocity + frequency * frequency * displacement) / angular * sine);
  if (Math.abs(position - target) < 0.000001 && Math.abs(velocity) < 0.00001) return { position: target || 0, velocity: 0 };
  return { position, velocity };
}

/** Integrates a bounded acceleration, exponential approach, and finite final settle exactly. */
function stepVelocity(velocity: number, target: number, seconds: number, limit: number, responseTime: number) {
  let next = velocity;
  let travel = 0;
  let remaining = seconds;
  const direction = Math.sign(target - velocity);
  const epsilon = Math.min(0.01, limit * responseTime);

  function linear(duration: number, acceleration: number) {
    travel += next * duration + acceleration * duration * duration / 2;
    next += acceleration * duration;
    remaining = Math.max(0, remaining - duration);
  }

  let error = Math.abs(target - next);
  if (error > limit * responseTime) {
    linear(Math.min(remaining, (error - limit * responseTime) / limit), direction * limit);
  }
  error = Math.abs(target - next);
  if (remaining > 0 && error > epsilon) {
    const duration = Math.min(remaining, responseTime * Math.log(error / epsilon));
    const decay = Math.exp(-duration / responseTime);
    travel += target * duration + (next - target) * responseTime * (1 - decay);
    next = target + (next - target) * decay;
    remaining = Math.max(0, remaining - duration);
  }
  if (remaining > 0) {
    const rate = epsilon / responseTime;
    const duration = Math.min(remaining, Math.abs(target - next) / rate);
    linear(duration, direction * rate);
    if (remaining > 0) {
      next = target;
      travel += target * remaining;
    }
  }
  return { velocity: next, acceleration: (next - velocity) / seconds, travel };
}

/**
 * Pure active-time step. It never reads wall time or mutates its arguments.
 * A zero delta is a strict no-op, so the scheduler's first resumed frame cannot catch up.
 * Frames over 50ms are bounded and subdivided for consistent force sampling.
 */
export function stepVehicleMotion(state: VehicleMotionState, input: VehicleMotionInput, deltaMs: number, options: VehicleMotionOptions = {}): VehicleMotionState {
  const seconds = clamp(finite(deltaMs, 0), 0, MAX_FRAME_MS) / 1000;
  if (seconds === 0) return state;
  const settings = resolveOptions(options);
  const targetSpeed = unit(input.speed);
  const targetVelocity = targetSpeed * settings.maxSpeed;
  const steps = Math.ceil(seconds / MAX_STEP_SECONDS);
  const dt = seconds / steps;
  const next = { ...state };

  for (let index = 0; index < steps; index += 1) {
    const limit = targetVelocity >= next.velocity ? settings.maxAcceleration : settings.maxBraking;
    const movement = stepVelocity(next.velocity, targetVelocity, dt, limit, settings.responseTime);
    next.velocity = movement.velocity;
    next.acceleration = movement.acceleration;
    next.travel += movement.travel;
    const speed = unit(next.velocity / settings.maxSpeed);
    const acceleration = clamp(next.acceleration / settings.maxAcceleration, -1, 1);
    const braking = clamp(-next.acceleration / settings.maxBraking, 0, 1);
    const load = next.acceleration >= 0 ? acceleration : -braking;
    const roadStrength = settings.roughness * smoothstep(0, 0.12, speed);
    const wheelbase = settings.wheelbase;
    const road = (distance: number) => roadStrength * (Math.sin(distance / 17 * TAU) * 0.008 + Math.sin(distance / 3.1 * TAU) * 0.002);
    const frontRoad = road(next.travel);
    const rearRoad = road(next.travel - wheelbase);
    const downforce = settings.kind === "car" ? speed * speed * 0.011 : 0;
    const transfer = settings.kind === "bike" ? 0.035 : 0.023;

    next.pitch = stepSpring(next.pitch, -load * (settings.kind === "bike" ? 3.7 : 2.1) + (rearRoad - frontRoad) / wheelbase * 180 / Math.PI, dt, 11);
    next.frontSuspension = stepSpring(next.frontSuspension, -load * transfer + downforce + frontRoad, dt, 18, 0.72);
    next.rearSuspension = stepSpring(next.rearSuspension, load * transfer + downforce + rearRoad, dt, 16, 0.76);
    next.frontWing = stepSpring(next.frontWing, settings.kind === "car" ? speed * speed * 2.6 + frontRoad * 90 : 0, dt, 21, 0.68);
    next.rearWing = stepSpring(next.rearWing, settings.kind === "car" ? -speed * speed * 1.7 - rearRoad * 65 : 0, dt, 18, 0.7);
    next.lean = stepSpring(next.lean, settings.kind === "bike" ? clamp(finite(input.lean, 0), -1, 1) * settings.maxLean * smoothstep(0, 0.12, speed) : 0, dt, 8, 0.9);
    next.riderTuck = stepSpring(next.riderTuck, settings.kind === "bike" ? smoothstep(0.1, 0.82, speed) : 0, dt, 7, 0.9);

    if (speed < 0.015 && targetSpeed < 0.03 && next.launchElapsed < 0) next.launchArmed = true;
    if (settings.kind === "bike" && input.wheelie && next.launchArmed && targetSpeed >= 0.45 && speed < 0.12 && acceleration > 0.55) {
      next.launchArmed = false;
      next.launchElapsed = 0;
    }
    if (next.launchElapsed >= 0) {
      next.launchElapsed += dt;
      if (next.launchElapsed >= 0.9) next.launchElapsed = -1;
    }
    const launch = next.launchElapsed < 0 ? 0 : Math.sin(next.launchElapsed / 0.9 * Math.PI);
    const wheelieTarget = settings.kind === "bike" && input.wheelie ? launch * 9 * Math.max(0, acceleration) * (1 - smoothstep(0.12, 0.42, speed)) : 0;
    next.wheelie = stepSpring(next.wheelie, wheelieTarget, dt, 12, 0.85);
  }
  return next;
}

export function getVehicleMotionFrame(state: VehicleMotionState, options: VehicleMotionOptions = {}): VehicleMotionFrame {
  const settings = resolveOptions(options);
  const speed = unit(state.velocity / settings.maxSpeed);
  const wheelAngle = state.travel / settings.wheelRadius;
  const wheelBlur = smoothstep(22, 75, state.velocity / settings.wheelRadius);
  const distance = state.travel * settings.pixelsPerMeter;
  const frontSuspension = state.frontSuspension.position * settings.pixelsPerMeter;
  const rearSuspension = state.rearSuspension.position * settings.pixelsPerMeter;
  const wheelie = Math.max(0, state.wheelie.position);
  const lift = clamp(wheelie / 9, 0, 1);
  return {
    speed, velocity: state.velocity, acceleration: state.acceleration, travel: state.travel,
    wheelAngle, wheelRotation: wrap(wheelAngle * 180 / Math.PI, 360),
    pitch: state.pitch.position - wheelie,
    bodyPitch: state.pitch.position,
    bodyY: (frontSuspension + rearSuspension) / 2,
    frontSuspension, rearSuspension,
    frontWing: state.frontWing.position, rearWing: state.rearWing.position,
    forkCompression: Math.max(0, frontSuspension), rearSquat: Math.max(0, rearSuspension),
    lean: clamp(state.lean.position, -settings.maxLean, settings.maxLean), riderTuck: clamp(state.riderTuck.position, 0, 1), wheelie,
    wheelBlur, wheelSpokes: 1 - wheelBlur,
    speedLines: smoothstep(0.15, 0.85, speed),
    speedLineOffset: -wrap(distance * 1.7, 320),
    roadOffset: -wrap(distance, settings.roadPeriod),
    markingOffset: -wrap(distance, settings.markingPeriod),
    backgroundOffset: -wrap(distance * 0.12, settings.backgroundPeriod),
    farBackgroundOffset: -wrap(distance * 0.045, settings.backgroundPeriod),
    shadowOpacity: 0.2 + speed * 0.12 - lift * 0.035,
    shadowScaleX: 1 + speed * 0.12,
    shadowScaleY: 1 - lift * 0.25,
    heat: smoothstep(0.08, 0.65, speed) * 0.48,
    heatPhase: wrap(distance * 0.006, TAU),
  };
}

/** Unit-bearing CSS values are ready for translate/rotate; opacity and scale stay unitless. */
export function vehicleMotionStyles(frame: VehicleMotionFrame) {
  const number = (value: number) => value.toFixed(5);
  const px = (value: number) => `${number(value)}px`;
  const deg = (value: number) => `${number(value)}deg`;
  return {
    "--vehicle-speed": number(frame.speed),
    "--vehicle-velocity": number(frame.velocity),
    "--vehicle-acceleration": number(frame.acceleration),
    "--vehicle-travel": number(frame.travel),
    "--vehicle-wheel-angle": deg(frame.wheelRotation),
    "--vehicle-pitch": deg(frame.pitch),
    "--vehicle-body-pitch": deg(frame.bodyPitch),
    "--vehicle-body-y": px(frame.bodyY),
    "--vehicle-front-suspension": px(frame.frontSuspension),
    "--vehicle-rear-suspension": px(frame.rearSuspension),
    "--vehicle-front-wing": deg(frame.frontWing),
    "--vehicle-rear-wing": deg(frame.rearWing),
    "--vehicle-fork-compression": px(frame.forkCompression),
    "--vehicle-rear-squat": px(frame.rearSquat),
    "--vehicle-lean": deg(frame.lean),
    "--vehicle-rider-tuck": number(frame.riderTuck),
    "--vehicle-wheelie": deg(frame.wheelie),
    "--vehicle-wheel-blur": number(frame.wheelBlur),
    "--vehicle-wheel-spokes": number(frame.wheelSpokes),
    "--vehicle-speed-lines": number(frame.speedLines),
    "--vehicle-speed-line-offset": px(frame.speedLineOffset),
    "--vehicle-road-offset": px(frame.roadOffset),
    "--vehicle-marking-offset": px(frame.markingOffset),
    "--vehicle-background-offset": px(frame.backgroundOffset),
    "--vehicle-far-background-offset": px(frame.farBackgroundOffset),
    "--vehicle-shadow-opacity": number(frame.shadowOpacity),
    "--vehicle-shadow-scale-x": number(frame.shadowScaleX),
    "--vehicle-shadow-scale-y": number(frame.shadowScaleY),
    "--vehicle-heat": number(frame.heat),
    "--vehicle-heat-phase": number(frame.heatPhase),
  };
}
