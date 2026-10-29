export type RaceMotionVisibility = { visible: boolean; reduced: boolean };

/** Observes discrete motion without creating a continuous animation frame loop. */
export function observeRaceMotion(element: HTMLElement, onChange?: (state: RaceMotionVisibility) => void) {
  const document = element.ownerDocument;
  const window = document.defaultView;
  if (!window) return { destroy() {} };
  const previous = element.getAttribute("data-motion");
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let onScreen = typeof window.IntersectionObserver !== "function";
  let destroyed = false;
  function synchronize() {
    if (destroyed) return;
    const state = { visible: onScreen && document.visibilityState !== "hidden", reduced: media.matches };
    element.setAttribute("data-motion", state.reduced ? "reduced" : state.visible ? "running" : "paused");
    onChange?.(state);
  }
  const observer = typeof window.IntersectionObserver === "function" ? new window.IntersectionObserver(([entry]) => {
    onScreen = Boolean(entry?.isIntersecting);
    synchronize();
  }) : null;
  observer?.observe(element);
  document.addEventListener("visibilitychange", synchronize);
  media.addEventListener("change", synchronize);
  synchronize();
  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      media.removeEventListener("change", synchronize);
      if (previous === null) element.removeAttribute("data-motion");
      else element.setAttribute("data-motion", previous);
    },
  };
}
