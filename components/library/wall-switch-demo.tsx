"use client";
import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { WallSwitch } from "../ui/wall-switch";

export function WallSwitchDemo({ appearance }: { appearance: Appearance }) {
  const [on, setOn] = useState(false);
  return <div className="demo-stack"><WallSwitch appearance={appearance} label="Studio light" checked={on} onCheckedChange={setOn} description="A little click. A brighter room." /><p className="ui-help" role="status">The light is {on ? "on" : "off"}.</p></div>;
}
