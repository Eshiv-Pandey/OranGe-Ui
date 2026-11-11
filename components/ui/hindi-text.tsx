"use client";

import { cn } from "@/lib/utils";
import { StyledText, type StyledTextProps } from "./styled-text";
export type HindiTextProps = StyledTextProps;
export function HindiText({ className, ...props }: HindiTextProps) {
  return <StyledText {...props} font={props.font ?? "hindi"} className={cn("hindi-text", className)} />;
}
