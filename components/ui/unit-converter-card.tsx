"use client";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "./button";
import { CardError, CardNumber, CardFrame, CardSelect, CopyValue, CardSubmit, useCardValue } from "./adaptive/card-ui";
import { convertUnit, displayNumber, UNIT_INFO } from "./adaptive/math";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, Unit, UnitConverterData } from "./adaptive/types";
export type UnitConverterCardProps = AdaptiveCardProps<UnitConverterData> & { locale?: string };
export function UnitConverterCard(props: UnitConverterCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.convert), { disabled, editable = true, appearance = "polished", className } = props;
  const family = UNIT_INFO[value.from]?.family ?? "length", units = (Object.keys(UNIT_INFO) as Unit[]).filter(unit => UNIT_INFO[unit].family === family), result = convertUnit(value.amount, value.from, value.to);
  const output = result.value === null ? "" : displayNumber(result.value, props.locale) + " " + value.to.toUpperCase();
  return <CardFrame title="Unit converter" kind="convert" icon={<ArrowLeftRight aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardSelect label="Measurement" value={family} disabled={disabled || !editable} onChange={event => setValue({ ...value, from: event.target.value === "length" ? "mi" : event.target.value === "weight" ? "kg" : "c", to: event.target.value === "length" ? "km" : event.target.value === "weight" ? "lb" : "f" })}><option value="length">Length</option><option value="weight">Weight</option><option value="temperature">Temperature</option></CardSelect>
    <CardNumber label="Amount" step="any" value={value.amount} disabled={disabled} readOnly={!editable} onValueChange={amount => setValue({ ...value, amount })} />
    <div className="adaptive-field-pair">{(["from", "to"] as const).map(key => <CardSelect key={key} label={key === "from" ? "From unit" : "To unit"} value={value[key]} disabled={disabled || !editable} onChange={event => setValue({ ...value, [key]: event.target.value as Unit })}>{units.map(unit => <option value={unit} key={unit}>{UNIT_INFO[unit].label}</option>)}</CardSelect>)}</div>
    <Button appearance={appearance} variant="ghost" disabled={disabled || !editable} onClick={() => setValue({ ...value, from: value.to, to: value.from })}>Swap units</Button>
    <CardError message={result.error} />{result.value !== null && <output className="adaptive-conversion-result">{output}</output>}
    <CopyValue value={output} disabled={disabled || result.value === null} appearance={appearance} />
    <CardSubmit label="Use result" hidden={!props.onSubmit || props.showSubmit === false} value={value} onSubmit={props.onSubmit} disabled={disabled || result.value === null} appearance={appearance} />
  </CardFrame>;
}
