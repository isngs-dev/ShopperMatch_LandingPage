"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Button from "@/components/ui/Button";
import { scrollToId } from "@/lib/scrollState";

const links = [
  { id: "solution", label: "Problem" },
  { id: "features", label: "Features" },
  { id: "about", label: "About" },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold tracking-tight text-white ${className}`}>
      <span aria-hidden="true" className="grid h-8 place-items-center rounded-lg bg-white px-2 shadow-[0_0_18px_rgba(232,209,167,0.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/isn-logo.png" alt="" width={250} height={96} className="h-5 w-auto" />
      </span>
      <span>
        Shopper Match<span className="text-mint">.AI</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4">
      <nav
        aria-label="Primary"
        className={`flex w-full items-center justify-between gap-4 rounded-full border transition-all duration-500 ${
          scrolled
            ? "max-w-4xl border-white/10 bg-[#2b1a0f]/70 px-4 py-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            : "max-w-7xl border-transparent bg-transparent px-3 py-4 backdrop-blur-0"
        }`}
      >
        <a href="#top" onClick={go("top")} aria-label="Shopper Match.AI, back to top" className="rounded-full">
          <Logo className="text-base sm:text-lg" />
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={go(l.id)}
                className="text-sm font-medium text-[#eadbc0] transition-colors hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Button className="!px-5 !py-2.5 !text-sm">Book a Demo</Button>
      </nav>
    </header>
  );
}
