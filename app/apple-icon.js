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
            width: 152,
            height: 152,
            borderRadius: 0,
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 34,
              height: 108,
              background: "#2f8f63",
              borderRadius: 0
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 108,
              height: 34,
              background: "#2f8f63",
              borderRadius: 0
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
