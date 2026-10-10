import "server-only";
import { MEETING_MINUTES, type DemoRequest } from "@/lib/demoRequest";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function formatWhen(startISO: string, timeZone: string) {
  const opts: Intl.DateTimeFormatOptions = { dateStyle: "full", timeStyle: "short" };
  try {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone }).format(new Date(startISO)) + ` (${timeZone})`;
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(new Date(startISO)) + " (UTC)";
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
  const first = req.name.split(" ")[0];

  const subject = booked
    ? "Your Shopper Match.AI demo is booked"
    : "We received your Shopper Match.AI demo request";

  const text = booked
    ? `Hi ${first},\n\nYour Shopper Match.AI demo is booked.\n\nWhen: ${when}\nDuration: ${MEETING_MINUTES} minutes\nMeeting link: ${link}\n\nA calendar invite is attached.\n\niSN`
    : `Hi ${first},\n\nThank you for your interest in Shopper Match.AI. We received your demo request and will be in touch shortly.\n\niSN`;

  const html = booked
    ? `<div style="font-family:Arial,sans-serif;color:#442D1C;line-height:1.6"><p>Hi ${esc(first)},</p><p>Your Shopper Match.AI demo is booked.</p><p><strong>When:</strong> ${esc(when)}<br><strong>Duration:</strong> ${MEETING_MINUTES} minutes</p><p><a href="${esc(link)}" style="display:inline-block;background:#84592B;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Join the meeting</a></p><p style="font-size:13px;color:#743014">Or open: ${esc(link)}<br>A calendar invite is attached.</p><p>iSN</p></div>`
    : `<div style="font-family:Arial,sans-serif;color:#442D1C;line-height:1.6"><p>Hi ${esc(first)},</p><p>Thank you for your interest in Shopper Match.AI. We received your demo request and will be in touch shortly.</p><p>iSN</p></div>`;

  if (!apiKey || !fromEmail || (booked && !link)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (SENDGRID_API_KEY, SENDGRID_FROM_EMAIL).");
    }
    console.warn("[sendgrid] not configured; dry run only. Email would be:\n", { to: req.email, subject, text });
    return { sent: false, dryRun: true };
  }

  const body: Record<string, unknown> = {
    personalizations: [{ to: [{ email: req.email, name: req.name }] }],
    from: { email: fromEmail, name: "Shopper Match.AI" },
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
  return { sent: true, dryRun: false };
}
