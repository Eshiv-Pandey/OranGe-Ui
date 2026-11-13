"use client";
import { Palette } from "lucide-react";
import { CardError, CardField, CardFrame, CopyValue, CardSubmit, useCardValue } from "./adaptive/card-ui";
import { parseColor } from "./adaptive/math";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, ColorData } from "./adaptive/types";
export type ColorCardProps = AdaptiveCardProps<ColorData>;
export function ColorCard(props: ColorCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.color), { disabled, editable = true, appearance = "polished", className } = props;
  const hex = parseColor(value.color), red = hex ? parseInt(hex.slice(1, 3), 16) : 0, green = hex ? parseInt(hex.slice(3, 5), 16) : 0, blue = hex ? parseInt(hex.slice(5, 7), 16) : 0;
  return <CardFrame title="Color" kind="color" icon={<Palette aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <div className="adaptive-color-swatch" style={hex ? { backgroundColor: hex } : undefined} aria-label={hex ? "Color swatch " + hex : "No valid color"}><input type="color" aria-label="Choose color" value={hex ?? "#000000"} disabled={disabled || !editable} onChange={event => setValue({ ...value, color: event.target.value })} /></div>
    <CardField label="Color name" value={value.name} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, name: event.target.value })} />
    <CardField label="Color value" value={value.color} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, color: event.target.value })} />
    <CardError message={!hex ? "Enter a hex code or a supported color name." : undefined} />
    {hex && <output className="adaptive-color-values">{hex.toUpperCase()}<span>{"rgb(" + red + ", " + green + ", " + blue + ")"}</span></output>}
    <CopyValue value={hex ?? value.color} disabled={disabled || !hex} appearance={appearance} />
    <CardSubmit label="Use result" hidden={!props.onSubmit || props.showSubmit === false} value={value} onSubmit={props.onSubmit} disabled={disabled || !hex} appearance={appearance} />
  </CardFrame>;
}
