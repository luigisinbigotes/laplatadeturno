import "./globals.css";
import PwaRegister from "@/components/pwa-register";

export const metadata = {
  title: "La Plata DeTurno",
  description: "Farmacias de turno cercanas en La Plata",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "La Plata DeTurno"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport = {
  themeColor: "#f4eee1"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
