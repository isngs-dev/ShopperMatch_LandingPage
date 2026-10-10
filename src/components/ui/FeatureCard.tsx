"use client";

import { lazy, useRef, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import LazyCanvas from "@/components/ui/LazyCanvas";
import FeatureIconFallback from "@/components/ui/FeatureIconFallback";

const FeatureIcon = lazy(() => import("@/components/scenes/FeatureIcons3D"));

type Props = { index: number; title: string; body: string; low: boolean; ready: boolean };

export default function FeatureCard({ index, title, body, low, ready }: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 18 });
  const num = String(index + 1).padStart(2, "0");

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    if (reduced || e.pointerType !== "mouse") return;
    ry.set((x / r.width - 0.5) * 14);
    rx.set(-(y / r.height - 0.5) * 14);
  };
  const leave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      className="[perspective:1100px]"
      initial={reduced ? { opacity: 0 } : { opacity: 0, rotateX: -65, y: 70 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, rotateX: 0, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.9, delay: (index % 3) * 0.12 + Math.floor(index / 3) * 0.1, ease: [0.2, 0.7, 0.2, 1] }}
      style={{ transformOrigin: "50% 100%" }}
    >
      <motion.article
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="gborder group relative h-full overflow-hidden p-7"
      >
        <span aria-hidden="true" className="watermark pointer-events-none absolute -right-2 -top-6 select-none font-display text-[9.5rem] font-bold leading-none">
          {num}
        </span>
        <div className="relative z-10">
          <div className="mb-3 h-32 w-44">
            {ready && !low ? (
              <LazyCanvas className="h-full w-full" camera={{ position: [0, 0, 4.2], fov: 40 }} rootMargin="150px" dpr={[1, 1]} antialias={false}>
                <FeatureIcon index={index} />
              </LazyCanvas>
            ) : (
              <FeatureIconFallback index={index} />
            )}
          </div>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-3 leading-relaxed text-[#eadbc0]">{body}</p>
        </div>
      </motion.article>
    </motion.div>
  );
}
