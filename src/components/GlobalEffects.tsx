"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring } from "framer-motion";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pointer, scrollState } from "@/lib/scrollState";
import { useQuality } from "@/hooks/useQuality";

/** Lenis + GSAP wiring, scroll progress bar, cursor glow, pointer + page-progress tracking. */
export default function GlobalEffects() {
  const { ready, reduced } = useQuality();
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.3 });
  const gx = useSpring(useMotionValue(-400), { stiffness: 120, damping: 20 });
  const gy = useSpring(useMotionValue(-400), { stiffness: 120, damping: 20 });
  const [fine, setFine] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  // Smooth scrolling
  useEffect(() => {
    if (!ready || reduced) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [ready, reduced]);

  // Pointer, cursor glow and page progress (shared with the particle field)
  useEffect(() => {
    const isFine = window.matchMedia("(pointer: fine)").matches;
    setFine(isFine);
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      gx.set(e.clientX);
      gy.set(e.clientY);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollState.page = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [gx, gy]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[100] h-[3px] w-full origin-left bg-gradient-to-r from-brand via-violet to-mint"
        style={{ scaleX: bar }}
      />
      {fine && !reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[5] h-[520px] w-[520px] rounded-full"
          style={{
            x: gx,
            y: gy,
            translateX: "-50%",
            translateY: "-50%",
            background: "radial-gradient(circle, rgba(184,83,31,0.18), rgba(232,209,167,0.05) 45%, transparent 70%)",
          }}
        />
      )}
      <div className="grain" aria-hidden="true" />
    </>
  );
}
