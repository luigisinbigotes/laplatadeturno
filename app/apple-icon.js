import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4eee1",
          color: "#151515",
          fontSize: 74,
          fontWeight: 800,
          border: "10px solid #151515",
          letterSpacing: "-0.08em"
        }}
      >
        LP
      </div>
    ),
    size
  );
}
