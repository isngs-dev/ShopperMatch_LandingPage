// Shared mutable state read by R3F render loops (never triggers React renders).
export const scrollState = { hero: 0, problem: 0, about: 0, page: 0 };

// Normalised pointer, -1..1 on both axes.
export const pointer = { x: 0, y: 0 };

export function scrollToForm() {
  scrollToId("form");
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: Element, o: object) => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(el, { offset: id === "form" ? -20 : 0, duration: 1.6 });
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: id === "form" ? "center" : "start" });
}

export const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
