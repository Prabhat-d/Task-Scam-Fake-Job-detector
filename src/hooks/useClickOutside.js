import { useEffect } from 'react';

/** Calls `onOutside` on mousedown outside `ref` or on Escape. */
export function useClickOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const down = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    const key = (e) => e.key === 'Escape' && onOutside();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [ref, onOutside, active]);
}
