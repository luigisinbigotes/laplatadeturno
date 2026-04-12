import { ImageResponse } from "next/og";

export function generateImageMetadata() {
  return [
    {
      contentType: "image/png",
      size: { width: 32, height: 32 },
      id: "small"
    },
    {
      contentType: "image/png",
      size: { width: 192, height: 192 },
      id: "medium"
    },
    {
      contentType: "image/png",
      size: { width: 512, height: 512 },
      id: "large"
    }
  ];
}

export default function Icon({ id }) {
  const isLarge = id === "large";
  const isMedium = id === "medium";
  const base = 180; // Using AppleIcon base for proportions
  const target = isLarge ? 512 : isMedium ? 192 : 32;
  const s = target / base;

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
            width: 158 * s,
            height: 158 * s,
            borderRadius: 42 * s,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(244,236,222,0.9) 38%, rgba(214,226,218,0.94) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              `inset 0 ${1 * s}px 0 rgba(255,255,255,0.9), inset 0 ${-6 * s}px ${14 * s}px rgba(100,122,112,0.16), 0 ${10 * s}px ${22 * s}px rgba(36,41,39,0.16)`
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 6 * s,
              borderRadius: 36 * s,
              border: `${1 * s}px solid rgba(255,255,255,0.72)`
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 10 * s,
              left: 14 * s,
              right: 14 * s,
              height: 46 * s,
              borderRadius: 24 * s,
              background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.06) 100%)"
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 40 * s,
              height: 104 * s,
              background: "linear-gradient(180deg, #57d696 0%, #248e63 100%)",
              borderRadius: 14 * s,
              boxShadow: `0 ${4 * s}px ${12 * s}px rgba(35,115,82,0.28)`
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 104 * s,
              height: 40 * s,
              background: "linear-gradient(90deg, #57d696 0%, #248e63 100%)",
              borderRadius: 14 * s,
              boxShadow: `0 ${4 * s}px ${12 * s}px rgba(35,115,82,0.28)`
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 94 * s,
              height: 94 * s,
              borderRadius: 28 * s,
              background: "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0) 58%)"
            }}
          />
        </div>
      </div>
    ),
    { width: target, height: target }
  );
}
