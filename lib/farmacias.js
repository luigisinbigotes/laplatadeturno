const SOURCE_URL = "https://www.colfarmalp.org.ar/turnos-la-plata/";

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return value
    .replace(/&oacute;/gi, "o")
    .replace(/&eacute;/gi, "e")
    .replace(/&aacute;/gi, "a")
    .replace(/&iacute;/gi, "i")
    .replace(/&uacute;/gi, "u")
    .replace(/&ntilde;/gi, "n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export async function fetchLaPlataTurnos() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "DeTurnoBot/0.1 (+https://localhost)"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("No se pudo consultar la fuente oficial de turnos.");
  }

  const html = await response.text();
  const rows = html.match(/<div class="tr">[\s\S]*?<\/div>\s*<\/div>/g) ?? [];

  return rows
    .map((row) => {
      const cells = [...row.matchAll(/<span>([^<]+)<\/span>\s*([^<]+)/g)].map((match) => ({
        label: decodeHtml(normalizeWhitespace(match[1])),
        value: decodeHtml(normalizeWhitespace(match[2]))
      }));

      const mapUrl = row.match(/href="([^"]+)"/)?.[1] ?? "";
      const destination = mapUrl.match(/destination=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);

      const name = cells.find((cell) => cell.label === "Farmacia")?.value;
      const address = cells.find((cell) => cell.label === "Direccion")?.value;
      const zone = cells.find((cell) => cell.label === "Zona")?.value;
      const phone = cells.find((cell) => cell.label === "Telefono")?.value;

      if (!name || !address) {
        return null;
      }

      return {
        name: `Farmacia ${name}`,
        address,
        zone: zone ?? "La Plata",
        phone: phone ?? "",
        mapUrl,
        latitude: destination ? Number(destination[1]) : null,
        longitude: destination ? Number(destination[2]) : null
      };
    })
    .filter(Boolean);
}

export function sortPharmaciesByDistance(pharmacies, latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return pharmacies.map((pharmacy) => ({
      ...pharmacy,
      distanceKm: null
    }));
  }

  return [...pharmacies]
    .map((pharmacy) => ({
      ...pharmacy,
      distanceKm:
        pharmacy.latitude != null && pharmacy.longitude != null
          ? haversineKm(lat, lng, pharmacy.latitude, pharmacy.longitude)
          : null
    }))
    .sort((a, b) => {
      if (a.distanceKm == null) {
        return 1;
      }

      if (b.distanceKm == null) {
        return -1;
      }

      return a.distanceKm - b.distanceKm;
    });
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
