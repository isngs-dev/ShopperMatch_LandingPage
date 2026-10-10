"use client";

import { Fragment, useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

type HeadingProps = {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
  /** Words from this index onward get the brand gradient. */
  accentFrom?: number;
  /** Animate immediately instead of waiting for scroll (hero). */
  immediate?: boolean;
  id?: string;
};

/** Word-by-word masked slide-up reveal. */
export function RevealHeading({ text, as = "h2", className = "", delay = 0, accentFrom, immediate, id }: HeadingProps) {
  const Tag = as as "h2";
  const ref = useRef<HTMLHeadingElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduced = useReducedMotion();
  const show = immediate || seen;
  const words = text.split(" ");

  return (
    <Tag ref={ref} id={id} className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]">
            <motion.span
              className={`inline-block ${accentFrom !== undefined && i >= accentFrom ? "text-gradient" : ""}`}
              initial={reduced ? { opacity: 0 } : { y: "112%" }}
              animate={show ? (reduced ? { opacity: 1 } : { y: 0 }) : undefined}
              transition={{ duration: reduced ? 0.4 : 0.85, delay: delay + i * 0.07, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Body text that fades up, staggered via `delay`. */
export function FadeUp({
  children,
  className = "",
  delay = 0,
  as = "div",
  immediate,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "p" | "span";
  immediate?: boolean;
}) {
  const reduced = useReducedMotion();
  const M = (as === "p" ? motion.p : as === "span" ? motion.span : motion.div) as typeof motion.div;
  const initial = { opacity: 0, y: reduced ? 0 : 26 };
  const target = { opacity: 1, y: 0 };
  const common = { initial, transition: { duration: 0.8, delay, ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number] }, className };
  return immediate ? (
    <M {...common} animate={target}>
      {children}
    </M>
  ) : (
    <M {...common} whileInView={target} viewport={{ once: true, margin: "0px 0px -10% 0px" }}>
      {children}
    </M>
  );
}
