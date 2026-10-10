"use client";

import { useEffect, useState } from "react";

export type Quality = {
  ready: boolean;
  /** Mobile or low-power device: lighter scenes, fewer particles. */
  low: boolean;
  mobile: boolean;
  reduced: boolean;
};

const initial: Quality = { ready: false, low: false, mobile: false, reduced: false };

export function useQuality(): Quality {
  const [q, setQ] = useState<Quality>(initial);

  useEffect(() => {
    const mobile = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // ?quality=high|low overrides detection (handy for QA)
    const force = new URLSearchParams(window.location.search).get("quality");
    // Lite mode is the default; ?quality=high opts into the full 3D scenes
    const low = force ? force === "low" : true;
    const update = () => setQ({ ready: true, low, mobile, reduced: mq.matches });
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return q;
}
