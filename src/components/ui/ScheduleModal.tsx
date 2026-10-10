"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Button from "@/components/ui/Button";
import { MEETING_MINUTES, type MeetingChoice } from "@/lib/demoRequest";

type Props = {
  busy: boolean;
  error: string | null;
  onBook: (m: MeetingChoice) => void;
  onSkip: () => void;
  /** Back to the form without sending anything. */
  onClose: () => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

const SLOTS = Array.from({ length: 18 }, (_, i) => {
  const mins = 9 * 60 + i * 30; // 09:00 to 17:30
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
});

const label12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
};

export default function ScheduleModal({ busy, error, onBook, onSkip, onClose }: Props) {
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy_, setBusy] = useState<{ start: number; end: number }[]>([]);
  const [checking, setChecking] = useState(false);

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  // Load the organiser's busy times for the chosen day so taken slots can be greyed out
  useEffect(() => {
    if (!date) return;
    const from = new Date(`${date}T00:00:00`);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    const ctl = new AbortController();
    setChecking(true);
    fetch(`/api/availability?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : { busy: [] }))
      .then((j: { busy: { start: string; end: string }[] }) => {
        setBusy(j.busy.map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() })));
        setChecking(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setBusy([]);
          setChecking(false);
        }
      });
    return () => ctl.abort();
  }, [date]);

  const isTaken = (slot: string) => {
    if (!date) return false;
    const start = new Date(`${date}T${slot}:00`).getTime();
    const end = start + MEETING_MINUTES * 60_000;
    return busy_.some((b) => start < b.end && end > b.start);
  };

  // Clear a selected time that turned out to be taken
  useEffect(() => {
    if (time && isTaken(time)) setTime("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy_]);

  // Focus, scroll lock (incl. Lenis)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dateRef.current?.focus();
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      lenis?.start();
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !busy) {
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const f = panel.current.querySelectorAll<HTMLElement>("button:not([disabled]),input,select");
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const book = () => {
    if (!date || !time) return;
    onBook({ startISO: new Date(`${date}T${time}:00`).toISOString(), timeZone: tz });
  };

  const field =
    "w-full rounded-xl border border-[#442d1c]/25 bg-[#e8d1a7]/25 px-4 py-3 text-base text-[#442d1c] outline-none transition focus:border-[#84592b] focus:bg-[#e8d1a7]/40 focus:shadow-[0_0_0_4px_rgba(201,138,75,0.25)]";

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" onKeyDown={onKey}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[#170d07]/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-title"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative w-full max-w-md rounded-[1.5rem] bg-white p-7 text-[#442d1c] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)] sm:p-9"
      >
        <h3 id="schedule-title" className="font-display text-3xl font-bold tracking-tight">
          Schedule a Meeting
        </h3>
        <p className="mt-2 text-[#743014]">
          Pick a date and time for your {MEETING_MINUTES}-minute Shopper Match.AI demo.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <label htmlFor="meet-date" className="mb-1.5 block text-sm font-medium text-[#84592b]">
              Date
            </label>
            <input
              ref={dateRef}
              id="meet-date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="meet-time" className="mb-1.5 block text-sm font-medium text-[#84592b]">
              Time
            </label>
            <select id="meet-time" value={time} onChange={(e) => setTime(e.target.value)} className={field} aria-busy={checking}>
              <option value="">Select a time</option>
              {SLOTS.map((s) => (
                <option key={s} value={s} disabled={isTaken(s)} className={isTaken(s) ? "text-gray-400" : ""}>
                  {label12(s)}
                  {isTaken(s) ? " (unavailable)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[#84592b]">
              {checking ? "Checking availability…" : `Times shown in your time zone (${tz}). Greyed-out times are taken.`}
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#b3361a]">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-3">
          <Button onClick={book} disabled={!date || !time || busy} className="w-full">
            {busy && (
              <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            Book Meeting
          </Button>
          <button
            type="button"
            onClick={onSkip}
            disabled={busy}
            className="rounded-full px-4 py-3 text-sm font-semibold text-[#743014] underline-offset-4 transition hover:underline disabled:opacity-50"
          >
            No, thanks, just email me
          </button>
        </div>
      </motion.div>
    </div>
  );
}
