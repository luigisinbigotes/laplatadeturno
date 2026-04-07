export default function manifest() {
  return {
    name: "La Plata DeTurno",
    short_name: "DeTurno",
    description: "Farmacias de turno cercanas en La Plata",
    start_url: "/",
    display: "standalone",
    background_color: "#efe6d6",
    theme_color: "#efe6d6",
    accent_color: "#d14b2f",
    lang: "es-AR",
    orientation: "portrait",
    icons: [
      {
        src: "/icon?size=192&v=3",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon?size=512&v=3",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon?v=3",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
