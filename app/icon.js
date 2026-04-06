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
          background: "linear-gradient(180deg, #fbf7ef 0%, #efe6d6 100%)"
        }}
      >
        <div
          style={{
            width: 408,
            height: 408,
            borderRadius: 96,
            background: "#fffaf2",
            border: "14px solid #151515",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 18px 36px rgba(0,0,0,0.10)"
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 84,
              height: 248,
              background: "#d14b2f",
              borderRadius: 28
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 248,
              height: 84,
              background: "#d14b2f",
              borderRadius: 28
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 42,
              fontSize: 42,
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
