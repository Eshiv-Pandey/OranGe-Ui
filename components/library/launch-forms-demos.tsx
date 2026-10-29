"use client";

import { useId, useState } from "react";
import { z } from "zod";
import type { AppearanceProps } from "../ui/appearance";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Kbd } from "../ui/kbd";
import { Form } from "../ui/form";
import { Combobox } from "../ui/combobox";
import { Calendar } from "../ui/calendar";
import { DatePicker } from "../ui/date-picker";
import { InputOTP } from "../ui/input-otp";
import { FileUpload } from "../ui/file-upload";
import { Rating } from "../ui/rating";
import { Stepper } from "../ui/stepper";

type DemoProps = Pick<AppearanceProps, "appearance">;
export function LabelDemo({ appearance }: DemoProps) { const id = useId(); return <div className="demo-stack"><Label htmlFor={id} appearance={appearance} required>Work email</Label><Input id={id} appearance={appearance} placeholder="you@example.com" required type="email" /></div>; }
export function KbdDemo({ appearance }: DemoProps) { return <p>Open search with <Kbd appearance={appearance}>Ctrl</Kbd> + <Kbd appearance={appearance}>K</Kbd>.</p>; }
const inviteSchema = z.object({ name: z.string().trim().min(2, "Enter at least two characters."), email: z.email("Enter a valid email address.") });
export function FormDemo({ appearance }: DemoProps) {
  const [saved, setSaved] = useState("");
  return <div className="demo-stack"><Form appearance={appearance} defaultValues={{ name: "", email: "" }} schema={inviteSchema} onReset={() => setSaved("")} onSubmit={(values) => setSaved(`Details validated for ${values.name}.`)}>{({ field, submitting }) => <><Input appearance={appearance} label="Name" autoComplete="name" {...field("name")} /><Input appearance={appearance} label="Email" type="email" autoComplete="email" {...field("email")} /><div className="demo-row"><Button appearance={appearance} type="submit" disabled={submitting}>{submitting ? "Checking..." : "Validate details"}</Button><Button appearance={appearance} type="reset" variant="secondary">Reset</Button></div></>}</Form>{saved && <p role="status" className="ui-help">{saved}</p>}</div>;
}
export function ComboboxDemo({ appearance }: DemoProps) { return <Combobox appearance={appearance} label="Your role" defaultValue="design" options={[{ value: "design", label: "Designer", description: "Interfaces and experiences", keywords: ["ui", "ux"] }, { value: "engineering", label: "Engineer", description: "Applications and systems", keywords: ["developer", "code"] }, { value: "research", label: "Researcher", description: "Evidence and experiments" }, { value: "operations", label: "Operations", description: "Processes and delivery" }]} description="Type to filter, then use the arrow keys to choose." />; }
export function CalendarDemo({ appearance }: DemoProps) { return <Calendar appearance={appearance} defaultValue="2026-11-12" weekStartsOn={1} />; }
export function DatePickerDemo({ appearance }: DemoProps) { return <DatePicker appearance={appearance} label="Review date" defaultValue="2026-11-12" description="Choose a day for your next review." />; }
export function InputOTPDemo({ appearance }: DemoProps) { const [complete, setComplete] = useState(false); return <div className="demo-stack"><InputOTP appearance={appearance} label="Verification code" onValueChange={(value) => setComplete(value.length === 6)} description="Enter or paste a six-digit code." /><p className="ui-help" role="status">{complete ? "All six digits entered." : "Waiting for six digits."}</p></div>; }
export function FileUploadDemo({ appearance }: DemoProps) { return <FileUpload appearance={appearance} label="Project files" accept=".png,.jpg,.jpeg,.pdf" maxFiles={3} maxBytes={5 * 1024 * 1024} description="Selected files stay on your device in this demo." />; }
export function RatingDemo({ appearance }: DemoProps) { return <Rating appearance={appearance} label="How was your experience?" defaultValue={3} clearable description="Choose between one and five stars." />; }
export function StepperDemo({ appearance }: DemoProps) { return <Stepper appearance={appearance} interactive defaultValue={1} maxUnlockedStep={2} steps={[{ id: "details", label: "Details", description: "Tell us about your project" }, { id: "preferences", label: "Preferences", description: "Choose your defaults" }, { id: "review", label: "Review", description: "Confirm and finish" }]} />; }
