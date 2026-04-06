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
          background: "linear-gradient(180deg, #fbf7ef 0%, #efe6d6 100%)"
        }}
      >
        <div
          style={{
            width: 146,
            height: 146,
            borderRadius: 34,
            background: "#fffaf2",
            border: "6px solid #151515",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 24,
              height: 84,
              background: "#d14b2f",
              borderRadius: 8
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 84,
              height: 24,
              background: "#d14b2f",
              borderRadius: 8
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 10,
              fontSize: 18,
              fontWeight: 800,
              color: "#151515",
              letterSpacing: "-0.08em"
            }}
          >
            LP
          </div>
        </div>
      </div>
    ),
    size
  );
}
