"use client";
import { useState, type ComponentPropsWithRef } from "react";
import { Slider as Primitive } from "radix-ui";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type SliderProps = ComponentPropsWithRef<typeof Primitive.Root> & AppearanceProps & { label: string; formatValue?: (value: number) => string };
export function Slider({ appearance = "polished", className, label, value, defaultValue = [50], onValueChange, formatValue = String, min = 0, max = 100, ...props }: SliderProps) {
  const [internal, setInternal] = useState(defaultValue); const current = value ?? internal;
  return <div className={uiClass("ui-slider-field", className)} data-appearance={appearance}>
    <div className="ui-slider-label"><span>{label}</span><output>{current.map(formatValue).join(" to ")}</output></div>
    <Primitive.Root {...props} min={min} max={max} value={current} onValueChange={(next) => { if (value === undefined) setInternal(next); onValueChange?.(next); }} className="ui-slider">
      <Primitive.Track className="ui-slider-track"><Primitive.Range className="ui-slider-range" /></Primitive.Track>
      {current.map((item, index) => <Primitive.Thumb key={index} className="ui-slider-thumb" aria-label={current.length > 1 ? label + " " + (index === 0 ? "minimum" : "maximum") : label} aria-valuetext={formatValue(item)} />)}
    </Primitive.Root>
  </div>;
}
