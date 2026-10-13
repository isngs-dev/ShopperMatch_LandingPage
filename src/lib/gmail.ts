import "server-only";
import { randomUUID } from "node:crypto";
import { googleAccessToken } from "@/lib/googleCalendar";

/**
 * Sends mail through the Gmail API (plain fetch + hand-built MIME, no SDK), using the same Google
 * OAuth refresh token as the calendar. The token needs the `gmail.send` scope: re-run
 * `node scripts/google-auth.mjs` after upgrading. Mail leaves from the signed-in mailbox (or one of its
 * "Send mail as" aliases), signed by Google for your own domain, and shows up in its Sent folder.
 *
 * Env: MAIL_FROM_EMAIL (the mailbox), MAIL_FROM_NAME, MAIL_REPLY_TO (optional), MAIL_CC (comma-separated).
 */

// conservative on purpose: nothing that could break out of a header
const SAFE_ADDRESS_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export type MailConfig = { fromEmail?: string; fromName: string; replyTo?: string; cc: string[] };

export function mailConfig(): MailConfig {
  const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    fromEmail: clean(process.env.MAIL_FROM_EMAIL),
    fromName: clean(process.env.MAIL_FROM_NAME) ?? "Shopper Match.AI",
    replyTo: clean(process.env.MAIL_REPLY_TO),
    cc: (process.env.MAIL_CC ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter((e) => SAFE_ADDRESS_RE.test(e)),
  };
}

export type MailInput = {
  to: { email: string; name?: string };
  /** visible to the recipient; addresses equal to `to` (or repeated) are dropped */
  cc?: string[];
  subject: string;
  text: string;
  html: string;
};

/** Header values never contain line breaks or control characters (that is how header injection works). */
const oneLine = (v: string) => v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
const isAscii = (v: string) => /^[\x20-\x7e]*$/.test(v);

/** RFC 2047: non-ASCII header text as UTF-8 base64 "encoded words", split so no word is too long. */
function encodeHeaderText(value: string): string {
  if (isAscii(value)) return value;
  const words: string[] = [];
  let chunk = "";
  for (const ch of value) {
    if (Buffer.byteLength(chunk + ch) > 42) {
      words.push(chunk);
      chunk = "";
    }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${Buffer.from(w).toString("base64")}?=`).join("\r\n ");
}

function formatAddress(email: string, name?: string): string {
  if (!SAFE_ADDRESS_RE.test(email)) throw new Error("Refusing to send to an unsafe email address");
  const display = name ? oneLine(name) : "";
  if (!display) return email;
  return isAscii(display) ? `"${display.replace(/(["\\])/g, "\\$1")}" <${email}>` : `${encodeHeaderText(display)} <${email}>`;
}

const base64Lines = (v: string) => (Buffer.from(v, "utf8").toString("base64").match(/.{1,76}/g) ?? []).join("\r\n");

function buildMessage(cfg: MailConfig, mail: MailInput): string {
  const fromEmail = cfg.fromEmail as string;
  const seen = new Set([mail.to.email.toLowerCase()]);
  const cc = (mail.cc ?? []).filter((a) => {
    const k = a.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const headers = [
    `From: ${formatAddress(fromEmail, cfg.fromName)}`,
    `To: ${formatAddress(mail.to.email, mail.to.name)}`,
    ...(cc.length ? [`Cc: ${cc.map((a) => formatAddress(a)).join(", ")}`] : []),
    `Reply-To: ${formatAddress(cfg.replyTo ?? fromEmail)}`,
    `Subject: ${encodeHeaderText(oneLine(mail.subject))}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@${fromEmail.split("@")[1]}>`,
    "MIME-Version: 1.0",
  ];
  const part = (type: string, body: string) =>
    [`Content-Type: ${type}; charset="UTF-8"`, "Content-Transfer-Encoding: base64", "", base64Lines(body)].join("\r\n");

  const boundary = `=_sm_${randomUUID().replace(/-/g, "")}`;
  return [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    part("text/plain", mail.text),
    `--${boundary}`,
    part("text/html", mail.html),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export async function sendGmail(cfg: MailConfig, mail: MailInput): Promise<void> {
  if (!cfg.fromEmail) throw new Error("Gmail sending is not configured (MAIL_FROM_EMAIL)");
  const raw = Buffer.from(buildMessage(cfg, mail), "utf8").toString("base64url");
  const token = await googleAccessToken();

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    // Google's error text (insufficient scopes, API not enabled, ...) says what to fix and holds no visitor data.
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(`Gmail API ${res.status}: ${(data.error?.message ?? "request failed").slice(0, 300)}`);
  }
}
