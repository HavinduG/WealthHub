"use client";

import { useEffect, useRef, useState } from "react";

import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { cn } from "@/lib/utils";

interface SceneGateProps {
  /** The 3D scene, loaded with `next/dynamic(() => import(...), { ssr: false })`. */
  children: React.ReactNode;
  /** Shown first, and kept for reduced motion. Usually a `next/image`. */
  fallback: React.ReactNode;
  /** Also keep the fallback on touch/mobile devices instead of loading 3D. */
  disableOnLite?: boolean;
  /** Start loading this far before the scene scrolls into view. */
  rootMargin?: string;
  className?: string;
}

/**
 * Loads a 3D scene only when it is about to scroll into view, and never for
 * users who prefer reduced motion. The fallback image renders on the server,
 * so the page is fast and indexable while Three.js loads later.
 *
 * Usage (in a client file):
 *   const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });
 *   <SceneGate fallback={<Image src={poster} alt="" fill priority />}>
 *     <HeroScene />
 *   </SceneGate>
 */
export function SceneGate({
  children,
  fallback,
  disableOnLite = false,
  rootMargin = "200px",
  className,
}: SceneGateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const { reducedMotion, isLite } = useMotionPreferences();
  const blocked = reducedMotion || (disableOnLite && isLite);

  useEffect(() => {
    const node = ref.current;
    if (!node || blocked) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [blocked, rootMargin]);

  const showScene = inView && !blocked;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div aria-hidden={showScene} className="absolute inset-0">
        {fallback}
      </div>
      {showScene && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
