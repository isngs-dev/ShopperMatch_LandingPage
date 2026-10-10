# Shopper Match.AI Landing Page

Marketing landing page for **Shopper Match.AI** by iSN, an AI scheduling product for Mystery Shopping Providers.

Built with Next.js (App Router), TypeScript, Tailwind CSS v4, React Three Fiber, GSAP + ScrollTrigger, Framer Motion, Lenis, React Hook Form + Zod.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3110
```

Production:

```bash
npm run build
npm run start                # http://localhost:3110
```

Production mode is much faster than `npm run dev`. Use it when judging 3D performance.

### Quality modes

The page loads in **lite mode** by default (SVG feature icons, fewer particles, no post-processing).
Add `?quality=high` to the URL for the full 3D scenes, or `?quality=low` to force lite.
`prefers-reduced-motion` disables scroll-scrubbing and parallax.

## Project structure

```
src/
  app/
    page.tsx                     # page composition
    layout.tsx                   # metadata, fonts, chatbot widget script
    api/demo-request/route.ts    # booking + confirmation mail
    api/availability/route.ts    # busy slots for the scheduling pop-up
  components/
    sections/                    # Hero, ProblemSolution, Features, About, FormSection
    scenes/                      # R3F scenes (one file each)
    ui/                          # Button, Reveal, LazyCanvas, ScheduleModal, ...
  lib/
    demoRequest.ts               # shared Zod schemas
    sendgrid.ts                  # confirmation emails
    googleCalendar.ts            # Google Calendar + Meet
scripts/google-auth.mjs          # one-time helper to get the Google refresh token
```

## Contact form flow

1. Visitor fills the form and presses **Book a Shopper Match.AI Demo**.
2. A **Schedule a Meeting** pop-up asks for a date and time. Slots already busy on the organiser's calendar are greyed out. The alternative is **No, thanks, just email me**.
3. `POST /api/demo-request`:
   - **Meeting booked:** creates a Google Calendar event with a unique Google Meet link, then sends a SendGrid mail with the link and an `.ics` invite. If the slot was taken in the meantime the API returns `409` and the visitor picks another time. If the mail fails, the event is deleted.
   - **No meeting:** sends a normal SendGrid confirmation mail.

Without SendGrid credentials, local dev only logs the mail to the console (dry run). In production the API returns an error instead.

## Configuration

Copy `.env.example` to `.env.local`. Never commit real keys.

| Variable | Purpose |
| --- | --- |
| `SENDGRID_API_KEY` | SendGrid key with "Mail Send" permission |
| `SENDGRID_FROM_EMAIL` | Verified sender or an address on an authenticated domain |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth client (type "Desktop app") with the Google Calendar API enabled |
| `GOOGLE_REFRESH_TOKEN` | Refresh token of the organiser account (see below) |
| `GOOGLE_CALENDAR_ID` | Calendar that owns the demo slots (default `primary`) |
| `MEETING_LINK` | Optional fixed link, used only if Google is not configured |
| `NEXT_PUBLIC_SITE_URL` | Optional, public site URL for Open Graph tags |

### Getting the Google refresh token (one time)

1. In Google Cloud Console, enable the **Google Calendar API** and create an OAuth client of type **Desktop app**.
2. Put its ID and secret into `.env.local`.
3. Run `node scripts/google-auth.mjs`, open the printed URL, and allow access as the organiser account.
4. Paste the printed `GOOGLE_REFRESH_TOKEN=...` line into `.env.local`.

If the consent screen shows "app not verified", add the organiser as a test user, or set the app to "Internal" on Google Workspace.

## Deployment

Set the environment variables above in your hosting provider. Do not deploy `.env.local`.
The chatbot widget (`chat.isngs.com`) only works on domains allowed by its server, so add the live domain there.
Because the form uses API routes, deploy as a Node app (not a static export).
