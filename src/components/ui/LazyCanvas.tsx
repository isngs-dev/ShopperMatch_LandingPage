"use client";

import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";

// Three.js / R3F load only when a canvas is first needed.
const Canvas = lazy(() => import("@react-three/fiber").then((m) => ({ default: m.Canvas })));

type Props = {
  children: ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov?: number };
  /** Start mounting this many px before the canvas scrolls into view. */
  rootMargin?: string;
  /** Always render (used for the fixed background). */
  alwaysOn?: boolean;
  antialias?: boolean;
  label?: string;
  dpr?: [number, number];
};

/**
 * Mounts a canvas on first approach and pauses its render loop whenever it is
 * outside the viewport. DPR is capped (default 1.5).
 */
export default function LazyCanvas({
  children,
  className = "",
  camera = { position: [0, 0, 8], fov: 45 },
  rootMargin = "250px",
  alwaysOn,
  antialias = true,
  label,
  dpr = [1, 1.5],
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(!!alwaysOn);
  const [visible, setVisible] = useState(!!alwaysOn);

  useEffect(() => {
    if (alwaysOn || !ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [alwaysOn, rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {mounted && (
        <Suspense fallback={null}>
          <Canvas
            dpr={dpr}
            camera={camera}
            frameloop={visible ? "always" : "never"}
            gl={{ antialias, alpha: true, powerPreference: "high-performance" }}
          >
            <Suspense fallback={null}>{children}</Suspense>
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}
