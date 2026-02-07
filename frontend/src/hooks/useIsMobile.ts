import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 640; // Matches Tailwind's `sm` breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
