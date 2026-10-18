import { ImageResponse } from "next/og";

export const alt = "UniConnect — the verified people network for Masters' Union";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0A0A0A",
          color: "#F5F5F4",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #2DD4BF, #FBBF24)",
              color: "#0A0A0A",
              fontSize: 44,
              fontWeight: 900,
            }}
          >
            U
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>UniConnect</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Find the people already in your class.
          </div>
          <div style={{ fontSize: 32, color: "#9CA3AF" }}>
            {"Verified Masters' Union students · AI people search · Brainstorm groups"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
