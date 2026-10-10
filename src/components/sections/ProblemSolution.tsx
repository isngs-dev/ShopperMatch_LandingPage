"use client";

import { lazy, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LazyCanvas from "@/components/ui/LazyCanvas";
import Button from "@/components/ui/Button";
import { FadeUp } from "@/components/ui/Reveal";
import { useQuality } from "@/hooks/useQuality";
import { scrollState } from "@/lib/scrollState";

const ProblemScene = lazy(() => import("@/components/scenes/ProblemScene"));

const chips = ["Less manual scheduling.", "More completed shops.", "Better TAT."];

export default function ProblemSolution() {
  const { ready, low, reduced } = useQuality();
  const root = useRef<HTMLElement>(null);
  const p1 = useRef<HTMLDivElement>(null);
  const p2 = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ready || !root.current) return;
    if (reduced) {
      scrollState.problem = 1;
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.set(p2.current, { autoAlpha: 0 });
      const chipEls = gsap.utils.toArray<HTMLElement>("[data-chip]", root.current);
      gsap.set(chipEls, { autoAlpha: 0, scale: 0.7, y: 16 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=260%",
          pin: true,
          scrub: 0.5,
          onUpdate: (self) => {
            scrollState.problem = self.progress;
            if (counter.current) counter.current.textContent = `${Math.round(Math.min(1, self.progress / 0.28) * 30)}%`;
          },
        },
      });
      tl.to(p1.current, { autoAlpha: 0, y: -30, duration: 0.1, ease: "power2.in" }, 0.4)
        .fromTo(p2.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: "power2.out" }, 0.6)
        .to(chipEls, { autoAlpha: 1, scale: 1, y: 0, duration: 0.07, stagger: 0.06, ease: "back.out(2)" }, 0.74)
        .to({}, { duration: 0.001 }, 0.999);
    }, root);
    return () => {
      ctx.revert();
      scrollState.problem = 0;
    };
  }, [ready, reduced]);

  const stacked = reduced;

  return (
    <section
      id="solution"
      ref={root}
      aria-labelledby="problem-title"
      className={`relative overflow-hidden ${stacked ? "min-h-screen py-24" : "h-screen"}`}
    >
      <div className="absolute inset-0 z-0">
        {ready && (
          <LazyCanvas
            className="h-full w-full"
            camera={{ position: [0, 0, 11], fov: 45 }}
            antialias={false}
            label="3D assignment cards drifting in chaos, then snapping into a clean scheduled calendar grid"
          >
            <ProblemScene low={low} reduced={reduced} />
          </LazyCanvas>
        )}
      </div>

      <div className={`relative z-10 mx-auto flex h-full max-w-7xl px-5 ${stacked ? "items-center" : "items-end pb-6 md:items-center md:pb-0"}`}>
        <div className="glass w-full max-w-xl !bg-[#2b1a0f]/80 p-6 sm:p-9">
          <div className={stacked ? "flex flex-col gap-12" : "grid [&>*]:col-start-1 [&>*]:row-start-1"}>
            <div ref={p1}>
              <h2
                id="problem-title"
                className="font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.035em] text-white"
              >
                Too Many Shops. Not Enough Time.
              </h2>
              <div
                aria-hidden="true"
                className="text-gradient-warm my-2 font-display text-[clamp(4.5rem,13vw,8.5rem)] font-bold leading-none tracking-[-0.06em]"
              >
                <span ref={counter}>30%</span>
              </div>
              <p className="text-base leading-relaxed text-[#eadbc0] sm:text-lg">
                Nearly 30% of mystery shops can go unscheduled or delayed, creating TAT issues, missed submission
                windows, incomplete shop details, and unreliable results.
              </p>
            </div>

            <div ref={p2}>
              <p className="text-gradient font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-bold leading-[1.08] tracking-[-0.03em]">
                Shopper Match.AI fixes the scheduling bottleneck.
              </p>
              <FadeUp as="p" immediate className="mt-4 text-base leading-relaxed text-[#eadbc0] sm:text-lg">
                It intelligently matches available shoppers with the right assignments, manages outreach, follows up
                automatically, and helps get shops scheduled on time.
              </FadeUp>
              <p className="mt-5 flex flex-wrap gap-2.5" aria-label="Less manual scheduling. More completed shops. Better TAT.">
                {chips.map((c) => (
                  <span
                    key={c}
                    data-chip
                    aria-hidden="true"
                    className="rounded-full border border-mint/50 bg-mint/10 px-4 py-2 text-sm font-semibold text-[#fff6e3] shadow-[0_0_24px_rgba(232,209,167,0.35)] sm:text-base"
                  >
                    {c}
                  </span>
                ))}
              </p>
              <div className="mt-6">
                <Button>Automate My Scheduling</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
