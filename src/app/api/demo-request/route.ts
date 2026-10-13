import { NextResponse } from "next/server";
import { demoRequestSchema } from "@/lib/demoRequest";
import { sendConfirmationEmail } from "@/lib/mail";
import { createMeetMeeting, deleteMeeting, googleConfigured, SlotBusyError } from "@/lib/googleCalendar";

export const runtime = "nodejs";

const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = demoRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.meeting) {
    const start = new Date(data.meeting.startISO).getTime();
    if (start < Date.now() || start > Date.now() + NINETY_DAYS) {
      return NextResponse.json({ error: "Pick a meeting time in the next 90 days." }, { status: 400 });
    }
  }

  // Booked call: create the Google Calendar event + Meet link (falls back to a fixed MEETING_LINK)
  let meetLink = "";
  let eventId: string | null = null;
  if (data.meeting) {
    if (googleConfigured()) {
      try {
        const created = await createMeetMeeting(data);
        meetLink = created.meetLink;
        eventId = created.eventId;
      } catch (err) {
        if (err instanceof SlotBusyError) {
          return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
        }
        console.error("[demo-request] google calendar failed", err);
        return NextResponse.json({ error: "Could not schedule the meeting." }, { status: 502 });
      }
    } else {
      meetLink = process.env.MEETING_LINK ?? "";
    }
  }

  try {
    const result = await sendConfirmationEmail(data, meetLink);
    return NextResponse.json({ ok: true, booked: !!data.meeting, emailed: result.sent });
  } catch (err) {
    console.error("[demo-request] email failed", err);
    if (eventId) await deleteMeeting(eventId);
    return NextResponse.json({ error: "Could not send the confirmation email." }, { status: 502 });
  }
}
