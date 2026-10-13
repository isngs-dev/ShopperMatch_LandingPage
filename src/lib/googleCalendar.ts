import "server-only";
import { MEETING_MINUTES, type DemoRequest } from "@/lib/demoRequest";

/**
 * Google Calendar + Meet, using an OAuth refresh token of the organiser account
 * (the calendar that owns the demo slots). No SDK: plain REST calls.
 *
 * Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
 *      GOOGLE_CALENDAR_ID (optional, default "primary").
 */

export class SlotBusyError extends Error {
  constructor() {
    super("That time slot is already booked.");
  }
}

export const googleConfigured = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);

const calendarId = () => encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");

export async function googleAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new Error(`Google token error: ${json.error_description ?? res.status}`);
  return json.access_token;
}

export type CreatedMeeting = { eventId: string; meetLink: string };

export async function createMeetMeeting(req: DemoRequest): Promise<CreatedMeeting> {
  const token = await googleAccessToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const start = new Date(req.meeting!.startISO);
  const end = new Date(start.getTime() + MEETING_MINUTES * 60_000);

  // 1. Refuse a slot that is already taken on the organiser's calendar
  const fb = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers,
    body: JSON.stringify({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: decodeURIComponent(calendarId()) }],
    }),
  });
  if (!fb.ok) throw new Error(`Google freeBusy error ${fb.status}: ${await fb.text()}`);
  const fbJson = (await fb.json()) as { calendars?: Record<string, { busy?: unknown[] }> };
  const busy = Object.values(fbJson.calendars ?? {}).some((c) => (c.busy?.length ?? 0) > 0);
  if (busy) throw new SlotBusyError();

  // 2. Create the event with a Google Meet conference
  const ev = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId()}/events?conferenceDataVersion=1&sendUpdates=none`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        summary: `Shopper Match.AI Demo: ${req.name} (${req.company})`,
        description: `Name: ${req.name}\nCompany: ${req.company}\nEmail: ${req.email}\nPhone: ${req.phone}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: [{ email: req.email, displayName: req.name }],
        conferenceData: {
          createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
        },
      }),
    },
  );
  if (!ev.ok) throw new Error(`Google event error ${ev.status}: ${await ev.text()}`);
  const evJson = (await ev.json()) as { id: string; hangoutLink?: string };
  if (!evJson.hangoutLink) throw new Error("Google did not return a Meet link for the event.");
  return { eventId: evJson.id, meetLink: evJson.hangoutLink };
}

/** Best-effort cleanup if the confirmation email fails after the event was created. */
export async function deleteMeeting(eventId: string) {
  try {
    const token = await googleAccessToken();
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId()}/events/${eventId}?sendUpdates=none`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (err) {
    console.error("[google-calendar] could not delete event", eventId, err);
  }
}

/** Busy intervals on the organiser's calendar between two instants (for greying out slots). */
export async function getBusyIntervals(timeMinISO: string, timeMaxISO: string): Promise<{ start: string; end: string }[]> {
  const token = await googleAccessToken();
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: timeMinISO, timeMax: timeMaxISO, items: [{ id: decodeURIComponent(calendarId()) }] }),
  });
  if (!res.ok) throw new Error(`Google freeBusy error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { calendars?: Record<string, { busy?: { start: string; end: string }[] }> };
  return Object.values(json.calendars ?? {}).flatMap((c) => c.busy ?? []);
}
