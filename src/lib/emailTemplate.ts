// Pure HTML/text builders for the emails (no imports, so they can be previewed with plain node).
// Colours follow the website theme: cocoa #442D1C, caramel #84592B, wine #743014, golden batter #E8D1A7.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export type EmailInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  /** Present when a call was booked. */
  booking?: { when: string; minutes: number; link: string };
};

const FONT = "Arial,Helvetica,sans-serif";

function row(label: string, value: string) {
  return `<tr><td style="padding:12px 0 0 0;font-family:${FONT};">
    <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#84592B;">${esc(label)}</div>
    <div style="font-size:16px;font-weight:bold;color:#442D1C;padding-top:3px;">${value}</div>
  </td></tr>`;
}

type Layout = {
  heading: string;
  preheader: string;
  intro: string;
  details: string;
  button?: string;
  note: string;
  footer: string;
};

function layout(l: Layout) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(l.heading)}</title></head>
<body style="margin:0;padding:0;background:#F4EBDD;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(l.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EBDD;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
      <tr><td style="padding:0 4px 18px 4px;font-family:${FONT};">
        <span style="font-size:24px;font-weight:bold;font-style:italic;color:#2F5BB7;">iSN</span>
        <span style="color:#C9B58F;font-size:22px;padding:0 8px;">|</span>
        <span style="font-size:20px;font-weight:bold;color:#442D1C;">Shopper Match<span style="color:#84592B;">.AI</span></span>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:20px;padding:34px 32px;border:1px solid #E8D1A7;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-family:${FONT};font-size:28px;font-weight:bold;line-height:1.2;color:#442D1C;">${esc(l.heading)}</td></tr>
          <tr><td style="padding:14px 0 0 0;font-family:${FONT};font-size:16px;line-height:1.6;color:#743014;">${l.intro}</td></tr>
          <tr><td style="padding:22px 0 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8EFDF;border-radius:14px;">
              <tr><td style="padding:6px 22px 20px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${l.details}</table></td></tr>
            </table>
          </td></tr>
          ${l.button ?? ""}
          <tr><td style="padding:24px 0 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#84592B;">${l.note}</td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:20px 8px 0 8px;font-family:${FONT};font-size:12px;line-height:1.6;color:#84592B;">${l.footer}</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function meetButton(link: string) {
  return `<tr><td align="left" style="padding:26px 0 0 0;">
        <a href="${esc(link)}" style="display:inline-block;background:#84592B;color:#ffffff;font-family:${FONT};font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:999px;">Join Google Meet</a>
      </td></tr>
      <tr><td style="padding:14px 0 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:#743014;">
        Or copy this link: <a href="${esc(link)}" style="color:#743014;">${esc(link)}</a>
      </td></tr>`;
}

/* ---------- Visitor confirmation ---------- */

export function buildSubject(i: EmailInput) {
  return i.booking ? "Your Shopper Match.AI demo is booked" : "We received your Shopper Match.AI demo request";
}

export function buildText(i: EmailInput) {
  const first = i.name.split(" ")[0];
  if (i.booking) {
    return [
      `Hi ${first},`,
      "",
      "Thank you for your interest in Shopper Match.AI. Here are the details of your demo call with the iSN team.",
      "",
      `When: ${i.booking.when}`,
      `Duration: ${i.booking.minutes} minutes`,
      "Where: Google Meet",
      `Meeting link: ${i.booking.link}`,
      "",
      "A calendar invite is attached to this email. If you need to change the time, just reply to this email.",
      "",
      "The iSN team",
    ].join("\n");
  }
  return [
    `Hi ${first},`,
    "",
    "Thank you for your interest in Shopper Match.AI. We received your demo request, and a member of the iSN team will be in touch shortly.",
    "",
    `Name: ${i.name}`,
    `Company: ${i.company}`,
    `Email: ${i.email}`,
    `Phone: ${i.phone}`,
    "",
    "The iSN team",
  ].join("\n");
}

export function buildHtml(i: EmailInput) {
  const first = esc(i.name.split(" ")[0]);
  const b = i.booking;
  return layout({
    heading: b ? "Your demo is booked" : "Your demo request is received",
    preheader: `${b ? "Your demo is booked" : "Your demo request is received"}. ${b ? b.when : "We will be in touch shortly."}`,
    intro: b
      ? `Hi ${first}, thank you for your interest in Shopper Match.AI. Here are the details of your demo call with the iSN team.`
      : `Hi ${first}, thank you for your interest in Shopper Match.AI. We received your request, and a member of the iSN team will be in touch shortly.`,
    details: b
      ? row("When", esc(b.when)) + row("Duration", `${b.minutes} minutes`) + row("Where", "Google Meet")
      : row("Name", esc(i.name)) + row("Company", esc(i.company)) + row("Email", esc(i.email)) + row("Phone", esc(i.phone)),
    button: b ? meetButton(b.link) : undefined,
    note: b
      ? "A calendar invite is attached to this email. If you need to change the time, just reply to this email."
      : "If any of these details are wrong, just reply to this email.",
    footer: "Shopper Match.AI, a product by iSN<br>You are receiving this email because you requested a demo on our website.",
  });
}

/* ---------- Internal notification to the iSN team ---------- */

export const buildTeamSubject = (i: EmailInput) =>
  i.booking ? `New demo booked: ${i.name} (${i.company})` : `New demo request: ${i.name} (${i.company})`;

export function buildTeamText(i: EmailInput) {
  const b = i.booking;
  return [
    b ? "A visitor booked a Shopper Match.AI demo call." : "A visitor requested a Shopper Match.AI demo (no call booked, email only).",
    "",
    `Name: ${i.name}`,
    `Company: ${i.company}`,
    `Email: ${i.email}`,
    `Phone: ${i.phone}`,
    ...(b ? ["", `When: ${b.when}`, `Duration: ${b.minutes} minutes`, `Meeting link: ${b.link}`] : []),
    "",
    "Reply to this email to reach the visitor.",
  ].join("\n");
}

export function buildTeamHtml(i: EmailInput) {
  const b = i.booking;
  return layout({
    heading: b ? "New demo booked" : "New demo request",
    preheader: `${i.name} (${i.company})${b ? `, ${b.when}` : ""}`,
    intro: b
      ? "A visitor booked a demo call through the website. The event is on the organiser calendar."
      : "A visitor requested a demo through the website and chose email only (no call booked).",
    details:
      row("Name", esc(i.name)) +
      row("Company", esc(i.company)) +
      row("Email", `<a href="mailto:${esc(i.email)}" style="color:#442D1C;">${esc(i.email)}</a>`) +
      row("Phone", esc(i.phone)) +
      (b ? row("When", esc(b.when)) + row("Duration", `${b.minutes} minutes`) : ""),
    button: b ? meetButton(b.link) : undefined,
    note: "Reply to this email to reach the visitor directly.",
    footer: "Internal notification from the Shopper Match.AI website.",
  });
}
