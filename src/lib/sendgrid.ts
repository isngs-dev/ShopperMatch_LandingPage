import "server-only";
import { MEETING_MINUTES, formatMeeting, type DemoRequest } from "@/lib/demoRequest";
import {
  buildHtml, buildSubject, buildTeamHtml, buildTeamSubject, buildTeamText, buildText, type EmailInput,
} from "@/lib/emailTemplate";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function formatWhen(startISO: string, timeZone: string) {
  try {
    return formatMeeting(startISO, timeZone);
  } catch {
    return formatMeeting(startISO, "UTC");
  }
}

function buildIcs(req: DemoRequest, link: string, fromEmail: string) {
  const start = new Date(req.meeting!.startISO);
  const end = new Date(start.getTime() + MEETING_MINUTES * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//iSN//Shopper Match.AI//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@shoppermatch.ai`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    "SUMMARY:Shopper Match.AI Demo",
    `DESCRIPTION:${icsEscape(`Join the meeting: ${link}`)}`,
    `LOCATION:${icsEscape(link)}`,
    `ORGANIZER;CN=Shopper Match.AI:mailto:${fromEmail}`,
    `ATTENDEE;CN=${icsEscape(req.name)};RSVP=TRUE:mailto:${req.email}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export type SendResult = { sent: boolean; dryRun: boolean };

/**
 * Sends the confirmation mail through SendGrid.
 * - meeting booked  -> mail with the meeting link (+ .ics invite)
 * - no meeting      -> normal confirmation mail
 */
export async function sendConfirmationEmail(req: DemoRequest, meetLink = ""): Promise<SendResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const link = meetLink;

  const booked = !!req.meeting;
  const when = booked ? formatWhen(req.meeting!.startISO, req.meeting!.timeZone) : "";

  const input: EmailInput = {
    name: req.name,
    company: req.company,
    email: req.email,
    phone: req.phone,
    booking: booked ? { when, minutes: MEETING_MINUTES, link } : undefined,
  };
  const subject = buildSubject(input);
  const text = buildText(input);
  const html = buildHtml(input);

  if (!apiKey || !fromEmail || (booked && !link)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (SENDGRID_API_KEY, SENDGRID_FROM_EMAIL).");
    }
    console.warn("[sendgrid] not configured; dry run only. Email would be:\n", { to: req.email, subject, text });
    return { sent: false, dryRun: true };
  }

  const body: Record<string, unknown> = {
    personalizations: [{ to: [{ email: req.email, name: req.name }] }],
    from: { email: fromEmail, name: process.env.SENDGRID_FROM_NAME || "Shopper Match.AI" },
    reply_to: { email: fromEmail },
    categories: ["demo-confirmation"],
    // Plain links (no rewritten tracking URLs / pixel): looks less like marketing mail and keeps the Meet URL intact
    tracking_settings: { click_tracking: { enable: false, enable_text: false }, open_tracking: { enable: false } },
    subject,
    content: [
      { type: "text/plain", value: text },
      { type: "text/html", value: html },
    ],
  };
  if (booked) {
    body.attachments = [
      {
        content: Buffer.from(buildIcs(req, link, fromEmail)).toString("base64"),
        type: "text/calendar; method=REQUEST",
        filename: "shopper-match-demo.ics",
        disposition: "attachment",
      },
    ];
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`SendGrid responded ${res.status}: ${await res.text()}`);

  // Internal copy for the iSN team. A failure here must not fail the visitor's booking.
  try {
    await sendTeamNotification(input, apiKey, fromEmail);
  } catch (err) {
    console.error("[sendgrid] team notification failed", err);
  }
  return { sent: true, dryRun: false };
}

/** Goes to NOTIFY_EMAIL (comma-separated), falling back to the sender address. Reply-to is the visitor. */
async function sendTeamNotification(input: EmailInput, apiKey: string, fromEmail: string) {
  const recipients = (process.env.NOTIFY_EMAIL || fromEmail)
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: recipients.map((email) => ({ email })) }],
      from: { email: fromEmail, name: process.env.SENDGRID_FROM_NAME || "Shopper Match.AI" },
      reply_to: { email: input.email, name: input.name },
      categories: ["demo-team-notification"],
      tracking_settings: { click_tracking: { enable: false, enable_text: false }, open_tracking: { enable: false } },
      subject: buildTeamSubject(input),
      content: [
        { type: "text/plain", value: buildTeamText(input) },
        { type: "text/html", value: buildTeamHtml(input) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`SendGrid responded ${res.status}: ${await res.text()}`);
}
