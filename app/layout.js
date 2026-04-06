import "./globals.css";
import PwaRegister from "@/components/pwa-register";

export const metadata = {
  title: "La Plata DeTurno",
  description: "Farmacias de turno cercanas en La Plata",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon?v=2",
    apple: "/apple-icon?v=2",
    shortcut: "/icon?v=2"
  },
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
  themeColor: "#efe6d6"
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
