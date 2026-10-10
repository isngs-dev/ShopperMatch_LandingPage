"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { scrollToForm } from "@/lib/scrollState";

type Props = {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  /** Smooth-scroll to the form (default for non-submit buttons). */
  scrollsToForm?: boolean;
};

/** Magnetic CTA with gradient glow sweep (CSS) and click ripple. */
export default function Button({ children, type = "button", disabled, className = "", onClick, scrollsToForm }: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  const move = (e: MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.28);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  const click = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    const size = Math.max(r.width, r.height) * 2.4;
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top, size }]);
    window.setTimeout(() => setRipples((rs) => rs.filter((p) => p.id !== id)), 750);
    onClick?.();
    if (scrollsToForm ?? (type !== "submit" && !onClick)) scrollToForm();
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      style={{ x, y }}
      onMouseMove={move}
      onMouseLeave={leave}
      onClick={click}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      className={`btn ${className}`}
    >
      {children}
      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y, width: r.size, height: r.size }} />
      ))}
    </motion.button>
  );
}
