import { z } from "zod";

/** Shared by the contact form (client) and /api/demo-request (server). */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  company: z.string().trim().min(1, "Company Name is required").max(160),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .min(1, "Phone Number is required")
    .refine(
      (v) => /^[+()\-.\s\d]+$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15,
      "Enter a valid phone number",
    ),
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
