"use client";

import { lazy, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LazyCanvas from "@/components/ui/LazyCanvas";
import Button from "@/components/ui/Button";
import Mesh from "@/components/ui/Mesh";
import { FadeUp, RevealHeading } from "@/components/ui/Reveal";
import { useQuality } from "@/hooks/useQuality";
import { scrollState } from "@/lib/scrollState";

const HeroScene = lazy(() => import("@/components/scenes/HeroScene"));

export default function Hero() {
  const { ready, low, reduced } = useQuality();
  const root = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || reduced || !root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          scrollState.hero = self.progress;
        },
      });
      gsap.to(copy.current, {
        y: -90,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "60% top", scrub: true },
      });
      gsap.to(scene.current, {
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "70% top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => {
      ctx.revert();
      scrollState.hero = 0;
    };
  }, [ready, reduced]);

  return (
    <section id="top" ref={root} className="relative flex min-h-screen items-start justify-center overflow-hidden px-5 pt-28 sm:pt-32 lg:pt-36">
      <Mesh />
      <div ref={scene} className="absolute inset-0 z-[1]">
        {ready && (
          <LazyCanvas
            className="h-full w-full"
            camera={{ position: [0, 1.4, 10.5], fov: 45 }}
            antialias={false}
            label="Animated 3D network of shoppers being matched to store locations"
          >
            <HeroScene low={low} reduced={reduced} />
          </LazyCanvas>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-3/5 bg-gradient-to-b from-[#20130b] via-[#20130b]/70 to-transparent" aria-hidden="true" />

      <div ref={copy} className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
        <RevealHeading
          as="h1"
          immediate
          accentFrom={5}
          text="Turn Every Mystery Shop Into a Scheduled Shop."
          className="font-display text-[clamp(2.4rem,7.4vw,6rem)] font-bold leading-[0.98] tracking-[-0.045em] text-white"
        />
        <FadeUp as="p" immediate delay={0.9} className="mt-6 max-w-2xl text-lg text-[#eadbc0] sm:text-xl">
          Stop Chasing Shoppers. Start Scheduling Automatically.
        </FadeUp>
        <FadeUp immediate delay={1.1} className="mt-9">
          <Button>See Shopper Match.AI in Action</Button>
        </FadeUp>
      </div>
    </section>
  );
}
