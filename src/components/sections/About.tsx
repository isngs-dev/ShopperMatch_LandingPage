"use client";

import { lazy, useEffect, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LazyCanvas from "@/components/ui/LazyCanvas";
import Button from "@/components/ui/Button";
import Mesh from "@/components/ui/Mesh";
import { FadeUp, RevealHeading } from "@/components/ui/Reveal";
import { useQuality } from "@/hooks/useQuality";
import { scrollState } from "@/lib/scrollState";

const TimelineScene = lazy(() => import("@/components/scenes/TimelineScene"));

function CountUp({ to, suffix, reduced }: { to: number; suffix: string; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  useEffect(() => {
    if (!seen || reduced || !ref.current) return;
    const el = ref.current;
    const c = animate(0, to, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => c.stop();
  }, [seen, reduced, to, suffix]);
  return <span ref={ref}>{`${to}${suffix}`}</span>;
}

export default function About() {
  const { ready, low, reduced } = useQuality();
  const visual = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || reduced || !visual.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: visual.current,
        start: "top 80%",
        end: "bottom 45%",
        scrub: true,
        onUpdate: (self) => {
          scrollState.about = self.progress;
        },
      });
    }, visual);
    return () => {
      ctx.revert();
      scrollState.about = 0;
    };
  }, [ready, reduced]);

  return (
    <section id="about" aria-labelledby="about-title" className="relative overflow-hidden px-5 py-28 sm:py-36">
      <Mesh />
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <div
            aria-hidden="true"
            className="text-gradient font-display text-[clamp(6rem,19vw,13rem)] font-bold leading-[0.85] tracking-[-0.06em]"
          >
            <CountUp to={25} suffix="+" reduced={reduced} />
          </div>
          <RevealHeading
            id="about-title"
            text="Built by People Who Know the Mystery Shopping Industry."
            className="mt-6 font-display text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-white"
          />
          <FadeUp as="p" delay={0.1} className="mt-6 text-lg leading-relaxed text-[#eadbc0]">
            For 25+ years, iSN has worked alongside Mystery Shopping Providers, supporting their growth as the industry
            has evolved.
          </FadeUp>
          <FadeUp as="p" delay={0.2} className="mt-4 text-lg leading-relaxed text-[#eadbc0]">
            Today, we&rsquo;re combining that industry experience with AI, automation, and technology to solve the
            operational challenges MSPs face every day.
          </FadeUp>
          <FadeUp delay={0.3} className="mt-8">
            <p className="relative inline-block pb-2 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Shopper Match.AI is built for the industry, not simply adapted to it.
              <motion.span
                aria-hidden="true"
                className="underline-flow absolute bottom-0 left-0 h-[3px] w-full origin-left rounded-full"
                initial={{ scaleX: reduced ? 1 : 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
              />
            </p>
          </FadeUp>
          <FadeUp delay={0.4} className="mt-9">
            <Button>Talk to iSN</Button>
          </FadeUp>
        </div>

        <div ref={visual} className="relative h-[420px] sm:h-[560px] lg:h-[680px]">
          {ready && (
            <LazyCanvas
              className="h-full w-full"
              camera={{ position: [0, 0, 8.5], fov: 45 }}
              antialias={false}
              label="Glowing timeline ribbon travelling from a clipboard to an AI chip"
            >
              <TimelineScene low={low} reduced={reduced} />
            </LazyCanvas>
          )}
        </div>
      </div>
    </section>
  );
}
