"use client";

import { cn } from "@/lib/utils";
import { StyledText, type StyledTextProps } from "./styled-text";
export type HinglishTextProps = StyledTextProps;
export function HinglishText({ className, ...props }: HinglishTextProps) {
  return <StyledText {...props} font={props.font ?? "hinglish"} className={cn("hinglish-text", className)} />;
}
