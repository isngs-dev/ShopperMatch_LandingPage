// Pure HTML/text builders for the confirmation email (no imports, so they can be previewed with plain node).
// Layout and palette follow the MS Dashboard confirmation mail: cream page, white card, iSN | product header,
// blue badge, details panel, wine call-to-action. No attachment (a calendar link instead): it looks less like spam.

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export type Booking = {
  /** e.g. "Tuesday, October 14, 2026 at 3:00 PM EDT" */
  when: string;
  /** e.g. "Tue, Oct 14, 3:00 PM EDT" (used in the subject) */
  whenShort: string;
  minutes: number;
  url: string;
  /** "Add to Google Calendar" link */
  calendarUrl: string;
};

export type EmailInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  booking?: Booking;
};

export type Rendered = { subject: string; text: string; html: string };

const C = {
  paper: "#f6efe6",
  card: "#ffffff",
  panel: "#f8f2e9",
  ink: "#2a211b",
  muted: "#675a4f",
  line: "#e6d9c8",
  blue: "#2f66d4",
  blueSoft: "#e8eefb",
  cta: "#b4531f",
};
const FONT = "Arial,Helvetica,sans-serif";
const PRODUCT = "Shopper Match.AI";
const TAGLINE = "Shopper Match.AI, a product by iSN";
const REASON =
  "You're getting this one-time email because you contacted us through the Shopper Match.AI website. Reply to this email and a person on the iSN team will answer.";

function layout(o: { preheader: string; heading: string; badge: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(o.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(o.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.paper};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
      <tr><td style="padding:0 4px 18px;font-family:${FONT};font-size:18px;font-weight:700;color:${C.ink};">
        <span style="color:${C.blue};font-style:italic;letter-spacing:-0.5px;">iSN</span>
        <span style="color:${C.line};padding:0 8px;">|</span>${PRODUCT}
      </td></tr>
      <tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:32px 30px;font-family:${FONT};color:${C.ink};">
        <div style="margin:0 0 14px;"><span style="display:inline-block;background:${C.blueSoft};color:${C.blue};border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;letter-spacing:.04em;">${escapeHtml(o.badge)}</span></div>
        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:${C.ink};">${escapeHtml(o.heading)}</h1>
        ${o.body}
      </td></tr>
      <tr><td style="padding:18px 10px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};text-align:center;">
        ${escapeHtml(REASON)}<br>
        <span style="color:${C.blue};font-style:italic;font-weight:700;">iSN</span> &nbsp;|&nbsp; ${escapeHtml(TAGLINE)}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.muted};">${html}</p>`;
const label = (t: string) => `<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};">${t}</div>`;

function detailsBlock(i: EmailInput): string {
  const row = (name: string, value: string) =>
    `<tr><td style="padding:4px 14px 4px 0;font-size:13px;color:${C.muted};">${name}</td><td style="padding:4px 0;font-size:13px;color:${C.ink};">${escapeHtml(value)}</td></tr>`;
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:6px 0 4px;border-top:1px solid ${C.line};padding-top:10px;width:100%;">
    ${row("Name", i.name)}${row("Company", i.company)}${row("Phone", i.phone)}${row("Email", i.email)}
  </table>`;
}

const firstName = (n: string) => n.trim().split(/\s+/)[0] || "there";

/** The one email visitor (To) and iSN team (Cc) both get. */
export function buildConfirmationEmail(i: EmailInput): Rendered {
  const hi = escapeHtml(firstName(i.name));
  const b = i.booking;

  if (b) {
    const subject = `Confirmed: your ${PRODUCT} demo on ${b.whenShort}`;
    const html = layout({
      preheader: `Your call with the iSN team is set for ${b.whenShort}. The meeting link is inside.`,
      badge: "Meeting confirmed",
      heading: "Your meeting is confirmed",
      body: [
        p(`Hi ${hi}, your call with the iSN team is confirmed. We'll show you what ${PRODUCT} can do for your scheduling process, and answer your questions.`),
        `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:6px 0 18px;background:${C.panel};border-radius:14px;">
          <tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;color:${C.ink};">
            ${label("When")}
            <div style="font-size:16px;font-weight:700;margin-bottom:10px;">${escapeHtml(b.when)}</div>
            ${label("Duration")}
            <div style="font-weight:700;margin-bottom:10px;">${b.minutes} minutes</div>
            ${label("Where")}
            <div style="font-weight:700;">Google Meet video call</div>
          </td></tr>
        </table>`,
        `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 14px;"><tr><td style="background:${C.cta};border-radius:999px;">
          <a href="${escapeHtml(b.url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Join the meeting</a>
        </td></tr></table>`,
        p(`The button not working? Copy this link into your browser:<br><a href="${escapeHtml(b.url)}" style="color:${C.blue};word-break:break-all;">${escapeHtml(b.url)}</a>`),
        p(`<a href="${escapeHtml(b.calendarUrl)}" style="color:${C.blue};font-weight:700;">Add to Google Calendar</a><br>Need a different time? Just reply to this email.`),
        `<div style="margin-top:8px;">${label("Details you shared")}</div>`,
        detailsBlock(i),
      ].join(""),
    });
    const text = [
      `Hi ${firstName(i.name)},`,
      "",
      `Your call with the iSN team is confirmed. We'll show you what ${PRODUCT} can do for your scheduling process, and answer your questions.`,
      "",
      `When: ${b.when}`,
      `Duration: ${b.minutes} minutes`,
      "Where: Google Meet video call",
      `Meeting link: ${b.url}`,
      "",
      `Add to Google Calendar: ${b.calendarUrl}`,
      "Need a different time? Just reply to this email.",
      "",
      "Details you shared:",
      `Name: ${i.name}`,
      `Company: ${i.company}`,
      `Phone: ${i.phone}`,
      `Email: ${i.email}`,
      "",
      "--",
      REASON,
      `iSN | ${TAGLINE}`,
    ].join("\n");
    return { subject, text, html };
  }

  const subject = `Thanks, ${firstName(i.name)}. We've received your ${PRODUCT} request`;
  const html = layout({
    preheader: "We have your details. Someone from the iSN team will be in touch shortly.",
    badge: "Request received",
    heading: "We've received your details",
    body: [
      p(`Hi ${hi}, thanks for getting in touch about ${PRODUCT}. Someone from the iSN team will contact you shortly to show you what it can do for your scheduling process.`),
      p("Would you rather talk sooner? Just reply to this email."),
      `<div style="margin-top:8px;">${label("Details you shared")}</div>`,
      detailsBlock(i),
    ].join(""),
  });
  const text = [
    `Hi ${firstName(i.name)},`,
    "",
    `Thanks for getting in touch about ${PRODUCT}. Someone from the iSN team will contact you shortly to show you what it can do for your scheduling process.`,
    "",
    "Would you rather talk sooner? Just reply to this email.",
    "",
    "Details you shared:",
    `Name: ${i.name}`,
    `Company: ${i.company}`,
    `Phone: ${i.phone}`,
    `Email: ${i.email}`,
    "",
    "--",
    REASON,
    `iSN | ${TAGLINE}`,
  ].join("\n");
  return { subject, text, html };
}

/** "You have a booking tomorrow": goes to the visitor about 24 hours before the call. */
export function buildReminderEmail(who: { name?: string }, b: Booking): Rendered {
  const name = who.name?.trim() || "there";
  const hi = escapeHtml(firstName(name));
  const subject = `Reminder: you have a booking tomorrow with ${PRODUCT}`;
  const html = layout({
    preheader: `Your call with the iSN team is tomorrow, ${b.whenShort}.`,
    badge: "Reminder",
    heading: "You have a booking tomorrow",
    body: [
      p(`Hi ${hi}, this is a reminder about your call with the iSN team.`),
      `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:6px 0 18px;background:${C.panel};border-radius:14px;">
          <tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;color:${C.ink};">
            ${label("When")}
            <div style="font-size:16px;font-weight:700;margin-bottom:10px;">${escapeHtml(b.when)}</div>
            ${label("Duration")}
            <div style="font-weight:700;margin-bottom:10px;">${b.minutes} minutes</div>
            ${label("Where")}
            <div style="font-weight:700;">Google Meet video call</div>
          </td></tr>
        </table>`,
      `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 14px;"><tr><td style="background:${C.cta};border-radius:999px;">
          <a href="${escapeHtml(b.url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Join the meeting</a>
        </td></tr></table>`,
      p(`The button not working? Copy this link into your browser:<br><a href="${escapeHtml(b.url)}" style="color:${C.blue};word-break:break-all;">${escapeHtml(b.url)}</a>`),
      p(`<a href="${escapeHtml(b.calendarUrl)}" style="color:${C.blue};font-weight:700;">Add to Google Calendar</a><br>Need to change the time? Just reply to this email.`),
    ].join(""),
  });
  const text = [
    `Hi ${firstName(name)},`,
    "",
    "This is a reminder that you have a booking tomorrow with the iSN team.",
    "",
    `When: ${b.when}`,
    `Duration: ${b.minutes} minutes`,
    "Where: Google Meet video call",
    `Meeting link: ${b.url}`,
    "",
    `Add to Google Calendar: ${b.calendarUrl}`,
    "Need to change the time? Just reply to this email.",
    "",
    "--",
    REASON,
    `iSN | ${TAGLINE}`,
  ].join("\n");
  return { subject, text, html };
}
