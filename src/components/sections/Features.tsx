"use client";

import FeatureCard from "@/components/ui/FeatureCard";
import Button from "@/components/ui/Button";
import Mesh from "@/components/ui/Mesh";
import { FadeUp, RevealHeading } from "@/components/ui/Reveal";
import { useQuality } from "@/hooks/useQuality";

const features = [
  {
    title: "Intelligent Shopper Matching",
    body: "Match the right shopper to the right shop based on project requirements, location, availability, and shopper criteria.",
  },
  {
    title: "Automated Shopper Outreach",
    body: "Reach out to eligible shoppers automatically instead of relying on manual calls, emails, or messages.",
  },
  {
    title: "Smart Follow-Ups",
    body: "Automatically follow up with shoppers who haven't responded, reducing missed opportunities.",
  },
  {
    title: "Real-Time Scheduling",
    body: "Move shoppers from available to scheduled faster, helping keep projects on track.",
  },
  {
    title: "Centralized Scheduling Management",
    body: "Manage shopper responses, assignments, and scheduling activity from one streamlined system.",
  },
  {
    title: "TAT & Completion Support",
    body: "Keep assignments moving toward completion and reduce scheduling delays that impact project timelines.",
  },
];

export default function Features() {
  const { ready, low } = useQuality();
  return (
    <section id="features" aria-labelledby="features-title" className="relative overflow-hidden px-5 py-28 sm:py-36">
      <Mesh />
      <div className="relative z-10 mx-auto max-w-7xl">
        <RevealHeading
          id="features-title"
          text="Scheduling, Without the Busywork."
          className="mx-auto max-w-4xl text-center font-display text-[clamp(2.2rem,5.6vw,4.6rem)] font-bold leading-[1] tracking-[-0.04em] text-white"
        />
        <ul className="mt-16 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <li key={f.title}>
              <FeatureCard index={i} title={f.title} body={f.body} low={low} ready={ready} />
            </li>
          ))}
        </ul>
        <FadeUp className="mt-14 flex justify-center">
          <Button>See How It Works</Button>
        </FadeUp>
      </div>
    </section>
  );
}
