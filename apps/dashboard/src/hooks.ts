import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export function useIsMobile(breakpoint = 768) {
  const { width } = useWindowSize();
  return width <= breakpoint;
}

export function useIsTablet(breakpointSm = 768, breakpointLg = 1024) {
  const { width } = useWindowSize();
  return width > breakpointSm && width <= breakpointLg;
}

/** Responsive grid column helper */
export function responsiveGrid(mobile: string, tablet: string, desktop: string) {
  if (typeof window === 'undefined') return desktop;
  const w = window.innerWidth;
  if (w <= 768) return mobile;
  if (w <= 1024) return tablet;
  return desktop;
}
