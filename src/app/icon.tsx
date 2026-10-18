import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "linear-gradient(135deg, #2DD4BF, #FBBF24)",
          color: "#0A0A0A",
          fontSize: 40,
          fontWeight: 900,
        }}
      >
        U
      </div>
    ),
    size,
  );
}
