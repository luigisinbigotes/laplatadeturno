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
            width: 420,
            height: 420,
            borderRadius: 0,
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "none"
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 104,
              height: 300,
              background: "#2f8f63",
              borderRadius: 0
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 104,
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
