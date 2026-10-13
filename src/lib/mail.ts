import "server-only";
import { MEETING_MINUTES, MEETING_TZ, formatMeeting, formatMeetingShort, type DemoRequest } from "@/lib/demoRequest";
import { buildConfirmationEmail, buildReminderEmail, type EmailInput } from "@/lib/emailTemplate";
import { googleConfigured } from "@/lib/googleCalendar";
import { mailConfig, sendGmail } from "@/lib/gmail";

export type SendResult = { sent: boolean; dryRun: boolean };

/** "Add to Google Calendar" link (a plain link, not an attachment: attachments look more like spam). */
function calendarLink(startISO: string, url: string) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(startISO);
  const end = new Date(start.getTime() + MEETING_MINUTES * 60_000);
  const u = new URL("https://calendar.google.com/calendar/render");
  u.searchParams.set("action", "TEMPLATE");
  u.searchParams.set("text", "Shopper Match.AI Demo");
  u.searchParams.set("dates", `${stamp(start)}/${stamp(end)}`);
  u.searchParams.set("details", `Join the meeting: ${url}`);
  u.searchParams.set("location", url);
  return u.toString();
}

/**
 * One confirmation mail through the Gmail API. The visitor is in To, the iSN team (MAIL_CC) in Cc,
 * so both see the same message. Booked call: meeting details + Meet link; otherwise a plain confirmation.
 */
export async function sendConfirmationEmail(req: DemoRequest, meetLink = ""): Promise<SendResult> {
  const cfg = mailConfig();
  const booked = !!req.meeting;

  const input: EmailInput = { name: req.name, company: req.company, email: req.email, phone: req.phone };
  if (booked) {
    const m = req.meeting!;
    input.booking = {
      when: safeFormat(formatMeeting, m.startISO, m.timeZone),
      whenShort: safeFormat(formatMeetingShort, m.startISO, m.timeZone),
      minutes: MEETING_MINUTES,
      url: meetLink,
      calendarUrl: calendarLink(m.startISO, meetLink),
    };
  }
  const mail = buildConfirmationEmail(input);

  if (!googleConfigured() || !cfg.fromEmail || (booked && !meetLink)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (GOOGLE_* credentials, MAIL_FROM_EMAIL).");
    }
    console.warn("[mail] not configured; dry run only. Email would be:\n", { to: req.email, cc: cfg.cc, subject: mail.subject, text: mail.text });
    return { sent: false, dryRun: true };
  }

  await sendGmail(cfg, { to: { email: req.email, name: req.name }, cc: cfg.cc, subject: mail.subject, text: mail.text, html: mail.html });
  return { sent: true, dryRun: false };
}

/** Day-before reminder. Only the visitor gets it (no Cc). Returns true when Gmail accepted it. */
export async function sendReminderEmail(
  who: { email: string; name?: string },
  startISO: string,
  meetUrl: string,
): Promise<boolean> {
  const cfg = mailConfig();
  if (!googleConfigured() || !cfg.fromEmail) return false;
  const mail = buildReminderEmail(who, {
    when: safeFormat(formatMeeting, startISO, MEETING_TZ),
    whenShort: safeFormat(formatMeetingShort, startISO, MEETING_TZ),
    minutes: MEETING_MINUTES,
    url: meetUrl,
    calendarUrl: calendarLink(startISO, meetUrl),
  });
  try {
    await sendGmail(cfg, { to: { email: who.email, name: who.name }, subject: mail.subject, text: mail.text, html: mail.html });
    return true;
  } catch (err) {
    console.error("[mail] reminder failed", err);
    return false;
  }
}

function safeFormat(fn: (iso: string, tz: string) => string, iso: string, tz: string) {
  try {
    return fn(iso, tz);
  } catch {
    return fn(iso, "UTC");
  }
}
