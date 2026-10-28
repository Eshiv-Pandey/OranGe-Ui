"use client";

import { useId, useRef, type CSSProperties } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { SUPERBIKE_GEOMETRY, superbikeSvgBody } from "./superbike-art";
import { generateVehicleConfig, normalizeVehicleConfig, vehicleSize, type TireCompound, type VehicleConfig, type VehicleLivery } from "./vehicle-art";
import { updateBikeJoints } from "./vehicle-render-motion";
import { useVehicleMotion } from "./use-vehicle-motion";
import "../../styles/vehicles.css";

export type SuperbikeProps = AppearanceProps & {
  size?: number; seed?: string | number; config?: VehicleConfig; livery?: Partial<VehicleLivery>;
  number?: string | number; tireCompound?: TireCompound; speed?: number; lean?: number; wheelie?: boolean;
  track?: boolean; theme?: "light" | "dark"; "aria-label"?: string;
};

export function Superbike({ size = 640, seed = "orangeui:superbike", config, livery, number, tireCompound, speed = .4, lean = 0, wheelie = false, track = true, theme, appearance = "polished", className, "aria-label": label = "Superbike and rider on a scrolling track" }: SuperbikeProps) {
  const id = useId(), ref = useRef<SVGSVGElement>(null);
  const base = config ? normalizeVehicleConfig(config) : generateVehicleConfig(seed);
  const value = normalizeVehicleConfig({ ...base, livery: { ...base.livery, ...livery }, number: number ?? base.number, tireCompound: tireCompound ?? base.tireCompound });
  const pixels = vehicleSize(size);
  useVehicleMotion(ref, { kind: "bike", speed, lean, wheelie, wheelRadius: .32, wheelbase: SUPERBIKE_GEOMETRY.wheelbase, pixelsPerMeter: SUPERBIKE_GEOMETRY.pixelsPerMeter, onFrame: (frame) => { if (ref.current) updateBikeJoints(ref.current, frame); } });
  return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" shapeRendering={appearance === "pixel" ? "crispEdges" : undefined} width={pixels} height={pixels * 260 / 640} className={uiClass("motorsport-vehicle superbike", className)} data-appearance={appearance} data-vehicle-theme={theme} data-motion="paused" role="img" aria-label={label.trim() || "Superbike and rider"} style={{ "--vehicle-size": `${pixels}px` } as CSSProperties} dangerouslySetInnerHTML={{ __html: superbikeSvgBody(value, `superbike-${id}`, { appearance, theme, track }) }} />;
}

export { SUPERBIKE_GEOMETRY, superbikeToSvgString } from "./superbike-art";
export type { VehicleConfig, VehicleLivery, TireCompound, LiveryPattern } from "./vehicle-art";
