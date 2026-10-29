import { vi } from "vitest";

export function aiTestBrowser() {
  let reduced = false;
  const listeners = new Set<() => void>();
  const observers: { element?: Element; callback: IntersectionObserverCallback; disconnected: boolean }[] = [];
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({ get matches() { return query === "(prefers-reduced-motion: reduce)" && reduced; }, media: query, addEventListener: (_type: string, listener: () => void) => listeners.add(listener), removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener) })));
  vi.stubGlobal("IntersectionObserver", class {
    record: typeof observers[number];
    constructor(callback: IntersectionObserverCallback) { this.record = { callback, disconnected: false }; observers.push(this.record); }
    observe(element: Element) { this.record.element = element; }
    unobserve() {}
    disconnect() { this.record.disconnected = true; }
  });
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("PointerEvent", class extends MouseEvent { pointerId: number; pointerType: string; constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? "mouse"; } });
  const restores: (() => void)[] = [];
  for (const name of ["scrollIntoView", "setPointerCapture", "releasePointerCapture", "hasPointerCapture"] as const) {
    const previous = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name);
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, value: vi.fn(() => name === "hasPointerCapture" ? false : undefined) });
    restores.push(() => { if (previous) Object.defineProperty(HTMLElement.prototype, name, previous); else Reflect.deleteProperty(HTMLElement.prototype, name); });
  }
  return {
    observers,
    reduced(value: boolean) { reduced = value; listeners.forEach((listener) => listener()); },
    visible(element: Element, visible: boolean) { observers.filter((observer) => observer.element === element && !observer.disconnected).forEach((observer) => observer.callback([{ target: element, isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver)); },
    restore() { restores.forEach((restore) => restore()); vi.unstubAllGlobals(); },
  };
}
