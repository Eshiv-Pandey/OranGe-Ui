"use client";
import { Users } from "lucide-react";
import { CardError, CardNumber, CardFrame, CardSelect, CopyValue, CardSubmit, useCardValue } from "./adaptive/card-ui";
import { currencyAmount } from "./adaptive/math";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, BillSplitData } from "./adaptive/types";
export type BillSplitCardProps = AdaptiveCardProps<BillSplitData> & { locale?: string };
export function BillSplitCard(props: BillSplitCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.split), { disabled, editable = true, appearance = "polished", className } = props;
  const valid = Number.isFinite(value.amount) && value.amount >= 0 && Number.isInteger(value.people) && value.people > 0 && value.people <= 100000;
  const amount = valid ? currencyAmount(value.amount / value.people, value.currency, props.locale) : "";
  return <CardFrame title="Bill split" kind="split" icon={<Users aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <div className="adaptive-field-pair"><CardNumber label="Bill amount" min={0} step={.01} value={value.amount} disabled={disabled} readOnly={!editable} onValueChange={amount => setValue({ ...value, amount })} /><CardSelect label="Currency" value={value.currency} disabled={disabled || !editable} onChange={event => setValue({ ...value, currency: event.target.value })}>{["USD", "INR", "EUR", "GBP", "JPY", "CAD", "AUD"].map(currency => <option key={currency}>{currency}</option>)}{!["USD", "INR", "EUR", "GBP", "JPY", "CAD", "AUD"].includes(value.currency) && <option>{value.currency}</option>}</CardSelect></div>
    <CardNumber label="People" min={1} max={100000} step={1} value={value.people} disabled={disabled} readOnly={!editable} onValueChange={people => setValue({ ...value, people })} />
    <CardError message={!valid ? "Enter a nonnegative bill and a whole number of people from 1 to 100000." : undefined} />
    {valid && <div className="adaptive-result"><span>Each person pays</span><output>{amount}</output><small>Displayed amounts are rounded to the currency&apos;s precision.</small></div>}
    <CopyValue value={amount} disabled={disabled || !valid} appearance={appearance} />
    <CardSubmit label="Use result" hidden={!props.onSubmit || props.showSubmit === false} value={value} onSubmit={props.onSubmit} disabled={disabled || !valid} appearance={appearance} />
  </CardFrame>;
}
