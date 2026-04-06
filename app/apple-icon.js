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
          background: "linear-gradient(180deg, #f5efe4 0%, #ded3c3 100%)"
        }}
      >
        <div
          style={{
            width: 158,
            height: 158,
            borderRadius: 42,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(244,236,222,0.9) 38%, rgba(214,226,218,0.94) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -6px 14px rgba(100,122,112,0.16), 0 10px 22px rgba(36,41,39,0.16)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 6,
              borderRadius: 36,
              border: "1px solid rgba(255,255,255,0.72)"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 14,
              right: 14,
              height: 46,
              borderRadius: 24,
              background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.06) 100%)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 40,
              height: 104,
              background: "linear-gradient(180deg, #57d696 0%, #248e63 100%)",
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(35,115,82,0.28)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 104,
              height: 40,
              background: "linear-gradient(90deg, #57d696 0%, #248e63 100%)",
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(35,115,82,0.28)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 94,
              height: 94,
              borderRadius: 28,
              background: "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0) 58%)"
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
