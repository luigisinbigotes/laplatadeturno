export default function manifest() {
  return {
    name: "La Plata DeTurno",
    short_name: "DeTurno",
    description: "Farmacias de turno cercanas en La Plata",
    start_url: "/",
    display: "standalone",
    background_color: "#f4eee1",
    theme_color: "#f4eee1",
    lang: "es-AR",
    orientation: "portrait",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon?size=512",
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
