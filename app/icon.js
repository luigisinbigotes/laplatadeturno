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
          background: "linear-gradient(180deg, #f5efe4 0%, #ded3c3 100%)"
        }}
      >
        <div
          style={{
            width: 428,
            height: 428,
            borderRadius: 112,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(244,236,222,0.88) 38%, rgba(214,226,218,0.92) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -16px 32px rgba(100,122,112,0.16), 0 18px 44px rgba(36,41,39,0.16)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 16,
              borderRadius: 96,
              border: "1px solid rgba(255,255,255,0.72)"
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 34,
              right: 34,
              height: 132,
              borderRadius: 72,
              background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.06) 100%)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 332,
              height: 332,
              borderRadius: 96,
              background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0) 48%)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 108,
              height: 286,
              background: "linear-gradient(180deg, #57d696 0%, #248e63 100%)",
              borderRadius: 34,
              boxShadow: "0 8px 24px rgba(35,115,82,0.28)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 286,
              height: 108,
              background: "linear-gradient(90deg, #57d696 0%, #248e63 100%)",
              borderRadius: 34,
              boxShadow: "0 8px 24px rgba(35,115,82,0.28)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 254,
              height: 254,
              borderRadius: 76,
              background: "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0) 58%)"
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
