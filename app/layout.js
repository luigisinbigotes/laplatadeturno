import "./globals.css";
import PwaRegister from "@/components/pwa-register";

export const metadata = {
  title: "La Plata DeTurno",
  description: "Farmacias de turno cercanas en La Plata",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon?v=3",
    apple: "/apple-icon?v=3",
    shortcut: "/icon?v=3"
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efe6d6" },
    { media: "(prefers-color-scheme: dark)", color: "#131313" }
  ]
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
