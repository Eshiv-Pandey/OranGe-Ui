"use client";
import { Calculator } from "lucide-react";
import { CardError, CardField, CardFrame, CopyValue, CardSubmit, useCardValue } from "./adaptive/card-ui";
import { calculateExpression, displayNumber } from "./adaptive/math";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, CalculatorData } from "./adaptive/types";
export type CalculatorCardProps = AdaptiveCardProps<CalculatorData> & { locale?: string };
export function CalculatorCard(props: CalculatorCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.calculate), { disabled, editable = true, appearance = "polished", className } = props;
  const result = calculateExpression(value.expression), output = result.value === null ? "" : displayNumber(result.value, props.locale);
  return <CardFrame title="Calculator" kind="calculate" icon={<Calculator aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardField label="Expression" placeholder="18% of 3450" maxLength={200} value={value.expression} disabled={disabled} readOnly={!editable} onChange={event => setValue({ expression: event.target.value })} />
    <p className="adaptive-summary">Use arithmetic, parentheses and percentages.</p><CardError message={result.error} />
    {result.value !== null && <div className="adaptive-result"><span>Result</span><output>{output}</output></div>}
    <CopyValue value={output} disabled={disabled || result.value === null} appearance={appearance} />
    <CardSubmit label="Use result" hidden={!props.onSubmit || props.showSubmit === false} value={value} onSubmit={props.onSubmit} disabled={disabled || result.value === null} appearance={appearance} />
  </CardFrame>;
}
