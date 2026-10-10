"use client";

import { lazy } from "react";
import LazyCanvas from "@/components/ui/LazyCanvas";
import { useQuality } from "@/hooks/useQuality";

const ParticleField = lazy(() => import("@/components/scenes/ParticleField"));

/** Fixed, persistent particle field behind every section. */
export default function Background() {
  const { ready, low, reduced } = useQuality();
  if (!ready) return null;
  return (
    <LazyCanvas
      alwaysOn
      antialias={false}
      dpr={[1, 1]}
      camera={{ position: [0, 0, 10], fov: 55 }}
      className="pointer-events-none fixed inset-0 z-0"
    >
      <ParticleField count={low ? 300 : 800} reduced={reduced} />
    </LazyCanvas>
  );
}
