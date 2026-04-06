import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

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
          background: "#f4eee1",
          color: "#151515",
          fontSize: 170,
          fontWeight: 800,
          border: "18px solid #151515",
          letterSpacing: "-0.08em"
        }}
      >
        LP
      </div>
    ),
    size
  );
}
