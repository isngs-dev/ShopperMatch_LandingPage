import { ImageResponse } from "next/og";

export const alt = "Shopper Match.AI: Turn Every Mystery Shop Into a Scheduled Shop.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "white",
          background:
            "radial-gradient(circle at 15% 10%, rgba(201,138,75,0.55), transparent 50%), radial-gradient(circle at 90% 90%, rgba(184,83,31,0.5), transparent 50%), #20130b",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, marginBottom: 40 }}>
          Shopper Match<span style={{ color: "#e8d1a7" }}>.AI</span>
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3 }}>
          Turn Every Mystery Shop Into a Scheduled Shop.
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#eadbc0", marginTop: 36 }}>
          Stop Chasing Shoppers. Start Scheduling Automatically.
        </div>
      </div>
    ),
    size,
  );
}
