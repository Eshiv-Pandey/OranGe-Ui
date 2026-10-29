"use client";

import { useId, useRef, type CSSProperties } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { OPEN_WHEEL_GEOMETRY, openWheelCarSvgBody } from "./open-wheel-car-art";
import { generateVehicleConfig, normalizeVehicleConfig, vehicleSize, type TireCompound, type VehicleConfig, type VehicleLivery } from "./vehicle-art";
import { updateCarJoints } from "./vehicle-render-motion";
import { useVehicleMotion } from "./use-vehicle-motion";
import "../../styles/vehicles.css";

export type OpenWheelCarProps = AppearanceProps & {
  size?: number; seed?: string | number; config?: VehicleConfig; livery?: Partial<VehicleLivery>;
  number?: string | number; tireCompound?: TireCompound; speed?: number; track?: boolean;
  theme?: "light" | "dark"; "aria-label"?: string;
};

export function OpenWheelCar({ size = 640, seed = "orangeui:open-wheel", config, livery, number, tireCompound, speed = .45, track = true, theme, appearance = "polished", className, "aria-label": label = "Open-wheel car on a scrolling track" }: OpenWheelCarProps) {
  const id = useId(), ref = useRef<SVGSVGElement>(null);
  const base = config ? normalizeVehicleConfig(config) : generateVehicleConfig(seed);
  const value = normalizeVehicleConfig({ ...base, livery: { ...base.livery, ...livery }, number: number ?? base.number, tireCompound: tireCompound ?? base.tireCompound });
  const pixels = vehicleSize(size);
  useVehicleMotion(ref, { kind: "car", speed, wheelRadius: .34, wheelbase: OPEN_WHEEL_GEOMETRY.wheelbase, pixelsPerMeter: OPEN_WHEEL_GEOMETRY.pixelsPerMeter, onFrame: (frame) => { if (ref.current) updateCarJoints(ref.current, frame); } });
  return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" shapeRendering={appearance === "pixel" ? "crispEdges" : undefined} width={pixels} height={pixels * 260 / 640} className={uiClass("motorsport-vehicle open-wheel-car", className)} data-appearance={appearance} data-vehicle-theme={theme} data-motion="paused" role="img" aria-label={label.trim() || "Open-wheel race car"} style={{ "--vehicle-size": `${pixels}px` } as CSSProperties} dangerouslySetInnerHTML={{ __html: openWheelCarSvgBody(value, `open-wheel-${id}`, { appearance, theme, track }) }} />;
}

export { OPEN_WHEEL_GEOMETRY, openWheelCarToSvgString } from "./open-wheel-car-art";
export { generateVehicleConfig, normalizeVehicleConfig, VEHICLE_PALETTES, LIVERY_PATTERNS, TIRE_COMPOUNDS } from "./vehicle-art";
export type { VehicleConfig, VehicleLivery, TireCompound, LiveryPattern } from "./vehicle-art";
