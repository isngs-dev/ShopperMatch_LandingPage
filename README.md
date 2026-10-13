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
npm run start                # http://localhost:3000 (or $PORT)
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
    demoRequest.ts               # shared Zod schemas + Eastern Time helpers
    googleCalendar.ts            # Google Calendar + Meet
    gmail.ts                     # Gmail API sender (hand-built MIME, no SDK)
    mail.ts                      # builds and sends the confirmation mail
    emailTemplate.ts             # HTML/text of the confirmation mail
scripts/google-auth.mjs          # one-time helper to get the Google refresh token
render.yaml                      # Render blueprint
```

## Contact form flow

1. Visitor fills the form and presses **Book a Shopper Match.AI Demo**.
2. A **Schedule a Meeting** pop-up asks for a date and time (US Eastern Time). Slots already busy on the organiser's calendar are greyed out. The alternative is **No, thanks, just email me**.
3. `POST /api/demo-request`:
   - **Meeting booked:** creates a Google Calendar event with a unique Google Meet link, then sends one confirmation mail through the **Gmail API**: the visitor in To, the iSN team (`MAIL_CC`) in Cc. If the slot was taken in the meantime the API returns `409` and the visitor picks another time. If the mail fails, the event is deleted.
   - **No meeting:** sends the same kind of mail without a meeting.

### Day-before reminder

Visitors who book a call get a "You have a booking tomorrow" mail about 24 hours before it.
`GET /api/reminders` does this: it finds website bookings (tagged on the Google Calendar event) that start within
the next 24 hours, mails the visitor, and tags the event so it is never reminded twice. Calls booked less than
24 hours ahead are skipped. It needs a scheduler that calls it **once an hour** with `CRON_SECRET`:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-site>/api/reminders
```

On Render this is the `shopper-match-reminders` cron job in `render.yaml` (needs `CRON_SECRET` and `SITE_URL`).
A free alternative is cron-job.org with the same URL and an `Authorization` header.

The mail has no attachment (an "Add to Google Calendar" link instead), which keeps it out of spam folders.
Without Google credentials, local dev only logs the mail to the console (dry run). In production the API returns an error instead.

## Configuration

Copy `.env.example` to `.env.local`. Never commit real keys.

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth client (type "Desktop app") with the **Google Calendar API** and **Gmail API** enabled |
| `GOOGLE_REFRESH_TOKEN` | Refresh token of the organiser account, with the calendar and `gmail.send` scopes (see below) |
| `GOOGLE_CALENDAR_ID` | Calendar that owns the demo slots (default `primary`) |
| `MAIL_FROM_EMAIL` | Mailbox the mail is sent from: the account that signed in, or one of its "Send mail as" aliases |
| `MAIL_FROM_NAME` | Sender name shown to visitors (default `Shopper Match.AI`) |
| `MAIL_CC` | iSN team address(es) Cc'd on every confirmation, comma-separated |
| `MAIL_REPLY_TO` | Optional, where replies go (default `MAIL_FROM_EMAIL`) |
| `CRON_SECRET` | Secret for `/api/reminders` (the hourly reminder job). Without it the endpoint is disabled |
| `MEETING_LINK` | Optional fixed link, used only if Google Calendar is not configured |
| `NEXT_PUBLIC_SITE_URL` | Optional, public site URL for Open Graph tags |

### Getting the Google refresh token (one time)

1. In Google Cloud Console, enable the **Google Calendar API** and the **Gmail API**, and create an OAuth client of type **Desktop app**.
2. Put its ID and secret into `.env.local`.
3. Run `node scripts/google-auth.mjs`, open the printed URL, and allow access as the organiser account.
4. Paste the printed `GOOGLE_REFRESH_TOKEN=...` line into `.env.local`.

If the consent screen shows "app not verified", add the organiser as a test user, or set the app to "Internal" on Google Workspace.

## Deployment (Render)

Deploy as a Node web service, not a static site: the form uses API routes.

- Build command: `npm ci && npm run build`, start command: `npm run start` (see `render.yaml`).
- Set the environment variables above in Render's Environment tab. Do not deploy `.env.local`.
- The chatbot widget (`chat.isngs.com`) only works on domains allowed by its server, so add the live domain there.
