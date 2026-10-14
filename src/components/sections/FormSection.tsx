"use client";

import { lazy, useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import LazyCanvas from "@/components/ui/LazyCanvas";
import Button from "@/components/ui/Button";
import Mesh from "@/components/ui/Mesh";
import ScheduleModal from "@/components/ui/ScheduleModal";
import { contactSchema, formatMeeting, type ContactValues, type MeetingChoice } from "@/lib/demoRequest";
import { FadeUp, RevealHeading } from "@/components/ui/Reveal";
import { useQuality } from "@/hooks/useQuality";

const FormScene = lazy(() => import("@/components/scenes/FormScene"));

type FormValues = ContactValues;
const schema = contactSchema;

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  inputMode,
  reg,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  inputMode?: "text" | "email" | "tel";
  reg: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder=" "
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...reg}
        className={`peer w-full rounded-xl border bg-[#e8d1a7]/25 px-4 pb-2 pt-6 text-base text-[#442d1c] outline-none transition focus:bg-[#e8d1a7]/40 ${
          error
            ? "border-orange-400/70 focus:shadow-[0_0_0_4px_rgba(224,112,58,0.2)]"
            : "border-[#442d1c]/25 focus:border-[#84592b] focus:shadow-[0_0_0_4px_rgba(201,138,75,0.22),0_0_32px_rgba(184,83,31,0.35)]"
        }`}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-[1.15rem] origin-left text-[#84592b] transition-all duration-200 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#743014] peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-xs"
      >
        {label}
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 px-1 text-sm text-[#b3361a]">
          {error}
        </p>
      )}
    </div>
  );
}

function Success({ name, when }: { name: string; when: string | null }) {
  const reduced = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const a = (i / 44) * Math.PI * 2 + Math.random() * 0.4;
        const d = 110 + Math.random() * 150;
        return {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d * 0.8 - 40,
          r: Math.random() * 540 - 270,
          c: ["#c98a4b", "#b8531f", "#e8d1a7", "#ffffff"][i % 4],
          w: 6 + Math.random() * 6,
          h: 4 + Math.random() * 8,
        };
      }),
    [],
  );

  return (
    <div className="relative flex min-h-[26rem] flex-col items-center justify-center text-center" role="status">
      <div className="relative mb-8 size-28 [perspective:700px]">
        <motion.div
          className="relative size-full [transform-style:preserve-3d]"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 180 }}
          transition={{ delay: reduced ? 0 : 0.35, duration: reduced ? 0.01 : 0.9, ease: [0.3, 1.3, 0.5, 1] }}
        >
          <div className="absolute inset-0 grid place-items-center rounded-2xl border border-white/20 bg-gradient-to-br from-brand to-violet [backface-visibility:hidden]">
            <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="17" rx="3" />
              <path d="M3 9h18M8 2v4M16 2v4" />
            </svg>
          </div>
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-mint shadow-[0_0_60px_rgba(232,209,167,0.8)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <svg viewBox="0 0 24 24" className="size-14" fill="none" stroke="#2a1708" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
        </motion.div>
        {!reduced &&
          bits.map((b, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 rounded-[2px]"
              style={{ width: b.w, height: b.h, background: b.c }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={{ x: b.x, y: [0, b.y, b.y + 140], opacity: [0, 1, 1, 0], rotate: b.r }}
              transition={{ delay: 1.05, duration: 1.7, ease: "easeOut" }}
            />
          ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 1, duration: 0.6 }}
      >
        <h3 className="font-display text-3xl font-bold tracking-tight text-[#442d1c]">Demo request received.</h3>
        <p className="mx-auto mt-3 max-w-sm text-[#743014]">
          {when ? (
            <>Thank you, {name.split(" ")[0]}. Your demo is booked for {when}. A confirmation email with the meeting link is on its way.</>
          ) : (
            <>Thank you, {name.split(" ")[0]}. A confirmation email is on its way. We&rsquo;ll be in touch shortly about your Shopper Match.AI demo.</>
          )}
        </p>
      </motion.div>
    </div>
  );
}

export default function FormSection() {
  const { ready, low, reduced } = useQuality();
  const [done, setDone] = useState<{ name: string; when: string | null } | null>(null);
  const [pending, setPending] = useState<FormValues | null>(null);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues: { name: "", company: "", email: "", phone: "" } });

  // Step 1: valid contact form -> open the "Schedule a Meeting" pop-up
  const onSubmit = (values: FormValues) => {
    console.log("[Shopper Match.AI] contact form", values);
    setServerError(null);
    setPending(values);
  };

  // Step 2: visitor books a call (meeting) or skips (null); the API sends the SendGrid mail
  const confirm = async (meeting: MeetingChoice | null) => {
    if (!pending) return;
    setSending(true);
    setServerError(null);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pending, meeting }),
      });
      if (res.status === 409) {
        setServerError("That time is no longer available. Please pick another.");
        return;
      }
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        console.error(`[demo-request] ${res.status}`, error);
        setServerError(typeof error === "string" ? error : "Something went wrong. Please try again.");
        return;
      }
      const when = meeting ? formatMeeting(meeting.startISO, meeting.timeZone) : null;
      setDone({ name: pending.name, when });
      setPending(null);
    } catch (err) {
      console.error(err);
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="form" aria-labelledby="form-title" className="relative overflow-hidden px-5 py-28 sm:py-36">
      <Mesh />
      <div className="absolute inset-0 z-[1]">
        {ready && (
          <LazyCanvas className="h-full w-full" camera={{ position: [0, 0, 9], fov: 45 }} antialias={false}>
            <FormScene low={low} reduced={reduced} />
          </LazyCanvas>
        )}
      </div>

      <div className="relative z-10 mx-auto max-w-xl">
        <div
          aria-hidden="true"
          className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br from-brand/40 via-violet/40 to-mint/30 blur-3xl"
        />
        <motion.div
          animate={reduced ? undefined : { y: [0, -10, 0], rotateX: [0, 1.5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformPerspective: 1200 }}
          className="rounded-[1.5rem] border border-white bg-white p-7 text-[#442d1c] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:p-10"
        >
          {done ? (
            <Success name={done.name} when={done.when} />
          ) : (
            <>
              <RevealHeading
                id="form-title"
                text="Ready to Simplify Scheduling?"
                className="font-display text-[clamp(2rem,4.6vw,3.2rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#442d1c]"
              />
              <FadeUp as="p" delay={0.1} className="mt-4 text-base leading-relaxed text-[#743014] sm:text-lg">
                Tell us a little about your business. We&rsquo;ll show you what Shopper Match.AI can do for your
                scheduling process.
              </FadeUp>
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-4">
                <Field id="name" label="Name" autoComplete="name" reg={register("name")} error={errors.name?.message} />
                <Field id="company" label="Company Name" autoComplete="organization" reg={register("company")} error={errors.company?.message} />
                <Field id="email" label="Email" type="email" inputMode="email" autoComplete="email" reg={register("email")} error={errors.email?.message} />
                <Field id="phone" label="Phone Number (US)" type="tel" inputMode="tel" autoComplete="tel" reg={register("phone")} error={errors.phone?.message} />
                <div className="mt-2">
                  <Button type="submit" className="w-full">
                    Book a Shopper Match.AI Demo
                  </Button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
      {pending && (
        <ScheduleModal
          busy={sending}
          error={serverError}
          onBook={(m) => confirm(m)}
          onSkip={() => confirm(null)}
          onClose={() => setPending(null)}
        />
      )}
    </section>
  );
}
