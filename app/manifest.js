export default function manifest() {
  return {
    name: "La Plata DeTurno",
    short_name: "DeTurno",
    description: "Farmacias de turno cercanas en La Plata",
    start_url: "/",
    display: "standalone",
    background_color: "#f1ecdf",
    theme_color: "#f1ecdf",
    accent_color: "#d14b2f",
    lang: "es-AR",
    orientation: "portrait",
    icons: [
      {
        src: "/icon/small",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/icon/medium",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon/large",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
