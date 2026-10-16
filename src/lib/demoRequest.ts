import { z } from "zod";

/** 10 US digits, optionally prefixed with country code 1 (digits only, formatting stripped). */
const US_PHONE_RE = /^1?([2-9]\d{2})([2-9]\d{2})(\d{4})$/;

/** As-you-type mask for the phone field: drops a leading country code 1, caps at 10 digits, "(212) 555-0123". */
export function formatUsPhoneInput(value: string): string {
  const d = value.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
  if (d.length <= 3) return d && `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Shared by the contact form (client) and /api/demo-request (server). */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  company: z.string().trim().min(1, "Company Name is required").max(160),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .min(1, "Phone Number is required")
    // US (NANP) numbers only: area code and exchange start with 2-9, optional +1 / 1 country code
    .refine(
      (v) => /^[+()\-.\s\d]+$/.test(v) && US_PHONE_RE.test(v.replace(/\D/g, "")),
      "Enter a valid US phone number, e.g. (212) 555-0123",
    )
    .transform((v) => v.replace(/\D/g, "").replace(US_PHONE_RE, "+1 ($1) $2-$3")),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const meetingSchema = z.object({
  /** Meeting start as an absolute UTC instant (ISO 8601). */
  startISO: z.string().datetime(),
  /** IANA time zone the visitor picked the slot in, e.g. "Asia/Kolkata". */
  timeZone: z.string().min(1).max(64),
});
export type MeetingChoice = z.infer<typeof meetingSchema>;

export const demoRequestSchema = contactSchema.extend({
  /** null = visitor chose "No, thanks, just email me". */
  meeting: meetingSchema.nullable(),
});
export type DemoRequest = z.infer<typeof demoRequestSchema>;

export const MEETING_MINUTES = 30;

/** All demo slots are offered in US Eastern Time (EST in winter, EDT in summer). */
export const MEETING_TZ = "America/New_York";

/** Converts a wall-clock date ("YYYY-MM-DD") and time ("HH:mm") in `tz` to the UTC instant. */
export function zonedTimeToUtc(date: string, time: string, tz: string = MEETING_TZ): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wanted = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (ms: number) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
      }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]),
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms;
  };
  let ms = wanted - offsetAt(wanted);
  ms = wanted - offsetAt(ms); // second pass handles DST boundaries
  return new Date(ms);
}

/** "Friday, October 16, 2026 at 3:30 AM EDT" */
export function formatMeeting(startISO: string, tz: string = MEETING_TZ): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).formatToParts(new Date(startISO));
  const g = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  return `${g("weekday")}, ${g("month")} ${g("day")}, ${g("year")} at ${g("hour")}:${g("minute")} ${g("dayPeriod")} ${g("timeZoneName")}`;
}

/** Today's date in `tz` as YYYY-MM-DD. */
export function todayIn(tz: string = MEETING_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** "Tue, Oct 14, 3:00 PM EDT" (used in the email subject) */
export function formatMeetingShort(startISO: string, tz: string = MEETING_TZ): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).formatToParts(new Date(startISO));
  const g = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  return `${g("weekday")}, ${g("month")} ${g("day")}, ${g("hour")}:${g("minute")} ${g("dayPeriod")} ${g("timeZoneName")}`;
}
