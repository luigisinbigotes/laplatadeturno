import "./globals.css";

export const metadata = {
  title: "DeTurno La Plata",
  description: "Farmacias de turno cercanas en La Plata"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
