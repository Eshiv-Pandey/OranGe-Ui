"use client";

import { useId, useSyncExternalStore } from "react";
import "../../styles/pixel-art.css";

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}

const getHidden = () => document.visibilityState === "hidden";
const getServerHidden = () => false;
const edges = {
  back: [40, 32, 24, 32, 16, 24, 32, 40, 32, 24, 16, 24, 32, 24, 32, 40],
  mid: [80, 64, 56, 64, 72, 64, 48, 56, 64, 80, 72, 64, 72, 56, 64, 80],
  front: [112, 104, 88, 104, 96, 104, 112, 104, 96, 104, 88, 96, 104, 96, 104, 112],
};

function edgePath(heights: readonly number[]) {
  return `M0 ${heights[0]} ${heights.map((height, index) => `H${index * 8}V${height}H${(index + 1) * 8}`).join(" ")} V144H0Z`;
}

export function PixelGrass({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const hidden = useSyncExternalStore(subscribeVisibility, getHidden, getServerHidden);

  return (
    <div className={`pixel-grass ${className}`} aria-hidden="true" data-paused={hidden || undefined}>
      {(["back", "mid", "front"] as const).map((layer) => (
        <svg key={layer} className={`pixel-grass__layer pixel-grass__layer--${layer}`} width="100%" height="144">
          <defs>
            <pattern id={`${id}-${layer}`} width="128" height="144" patternUnits="userSpaceOnUse">
              <path d={edgePath(edges[layer])} fill={`var(--grass-${layer})`} />
              {layer === "front" && <>
                <rect x="24" y="120" width="4" height="4" fill="var(--grass-mid)" />
                <rect x="80" y="128" width="4" height="4" fill="var(--grass-mid)" />
                <rect x="104" y="112" width="4" height="4" fill="var(--grass-mid)" />
              </>}
            </pattern>
          </defs>
          <rect width="100%" height="144" fill={`url(#${id}-${layer})`} />
        </svg>
      ))}
    </div>
  );
}
