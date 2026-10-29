import { vi } from "vitest";

export function navigationTestBrowser() {
  const desktopListeners = new Set<() => void>();
  let desktop = false;
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    get matches() { return query === "(min-width: 768px)" && desktop; },
    media: query,
    addEventListener: (_type: string, listener: () => void) => { if (query === "(min-width: 768px)") desktopListeners.add(listener); },
    removeEventListener: (_type: string, listener: () => void) => desktopListeners.delete(listener),
  })));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerId: number; pointerType: string; isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? "mouse"; this.isPrimary = init.isPrimary ?? true; }
  });
  const restores: (() => void)[] = [];
  for (const name of ["scrollIntoView", "setPointerCapture", "releasePointerCapture", "hasPointerCapture"] as const) {
    const previous = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name);
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, value: vi.fn(() => name === "hasPointerCapture" ? false : undefined) });
    restores.push(() => { if (previous) Object.defineProperty(HTMLElement.prototype, name, previous); else Reflect.deleteProperty(HTMLElement.prototype, name); });
  }
  return { desktop(value: boolean) { desktop = value; desktopListeners.forEach((listener) => listener()); }, restore() { restores.forEach((restore) => restore()); vi.unstubAllGlobals(); } };
}
