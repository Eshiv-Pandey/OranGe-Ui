"use client";
import { useCallback, useRef } from "react";

const locks = new WeakMap<HTMLElement, { count: number; wasInert: boolean }>();

/** Keep the background out of native focus navigation while a modal portal is open. */
export function useModalBackground(enabled = true) {
  const restore = useRef<(() => void) | undefined>(undefined);
  return useCallback((content: HTMLElement | null) => {
    restore.current?.();
    restore.current = undefined;
    if (!content || !enabled || !content.isConnected) return;

    const hidden: HTMLElement[] = [];
    let branch: Element = content;
    while (branch.parentElement) {
      const parent = branch.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === branch || !(sibling instanceof content.ownerDocument.defaultView!.HTMLElement) || sibling.matches("script, style, link, .ui-overlay")) continue;
        const lock = locks.get(sibling) ?? { count: 0, wasInert: sibling.inert };
        lock.count++;
        locks.set(sibling, lock);
        sibling.inert = true;
        hidden.push(sibling);
      }
      if (parent === content.ownerDocument.body) break;
      branch = parent;
    }
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      for (const sibling of hidden) {
        const lock = locks.get(sibling)!;
        if (--lock.count === 0) {
          sibling.inert = lock.wasInert;
          locks.delete(sibling);
        }
      }
      if (restore.current === release) restore.current = undefined;
    };
    restore.current = release;
    // A composed ref can change its callbacks before detaching the node. React 19
    // retains this cleanup from attachment, so that lock still gets released.
    return release;
  }, [enabled]);
}
