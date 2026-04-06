/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://www.google.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://routing.openstreetmap.de https://nominatim.openstreetmap.org https://www.colfarmalp.org.ar https://*.tile.openstreetmap.org",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
