// One-time helper: prints a Google OAuth refresh token for the organiser account.
// Usage:  node scripts/google-auth.mjs
// Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local (OAuth client type "Desktop app",
// or a Web client with redirect URI http://localhost:53682/callback).
import http from "node:http";
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = env;
if (!id || !secret) throw new Error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.");

const redirect = "http://localhost:53682/callback";
const scope = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
].join(" ");
const url =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({ client_id: id, redirect_uri: redirect, response_type: "code", scope, access_type: "offline", prompt: "consent" });

console.log("\nOpen this URL, sign in as the ORGANISER account and allow access:\n\n" + url + "\n");

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, redirect);
  if (u.pathname !== "/callback") return res.end();
  const code = u.searchParams.get("code");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: "authorization_code" }),
  });
  const j = await r.json();
  res.end(j.refresh_token ? "Done. You can close this tab and return to the terminal." : "No refresh token returned. See terminal.");
  console.log(j.refresh_token ? "\nGOOGLE_REFRESH_TOKEN=" + j.refresh_token + "\n\nPaste that line into .env.local" : j);
  server.close();
});
server.listen(53682);
