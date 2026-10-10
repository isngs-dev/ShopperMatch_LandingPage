import { NextResponse } from "next/server";
import { getBusyIntervals, googleConfigured } from "@/lib/googleCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/** GET /api/availability?from=<ISO>&to=<ISO>  ->  { busy: [{start, end}] } */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = new Date(url.searchParams.get("from") ?? "");
  const to = new Date(url.searchParams.get("to") ?? "");
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from || to.getTime() - from.getTime() > 2 * DAY) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }
  if (from.getTime() < Date.now() - DAY || from.getTime() > Date.now() + 91 * DAY) {
    return NextResponse.json({ error: "Out of range" }, { status: 400 });
  }
  if (!googleConfigured()) return NextResponse.json({ busy: [] });

  try {
    return NextResponse.json({ busy: await getBusyIntervals(from.toISOString(), to.toISOString()) });
  } catch (err) {
    console.error("[availability] failed", err);
    // Booking still works; the 409 check on submit is the safety net
    return NextResponse.json({ busy: [] });
  }
}
