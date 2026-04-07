import {
  fetchLaPlataTurnos,
  sortPharmaciesByDistance
} from "@/lib/farmacias";
import {
  applyRateLimit,
  getCachedValue,
  isWithinLaPlataBounds,
  setCachedValue
} from "@/lib/security";

const pharmacyCache = new Map();
const PHARMACY_CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request) {
  const rateLimited = applyRateLimit(request, "farmacias", 300, 60 * 1000);
  if (rateLimited) {
    return rateLimited;
  }

  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");
  const lat = latitude == null ? null : Number(latitude);
  const lng = longitude == null ? null : Number(longitude);

  if ((latitude || longitude) && (!Number.isFinite(lat) || !Number.isFinite(lng))) {
    return Response.json(
      { error: "invalid_coordinates" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (Number.isFinite(lat) && Number.isFinite(lng) && !isWithinLaPlataBounds(lat, lng)) {
    return Response.json(
      { error: "coordinates_out_of_scope" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  let pharmacies = getCachedValue(pharmacyCache, "la-plata", PHARMACY_CACHE_TTL_MS);
  if (!pharmacies) {
    pharmacies = await fetchLaPlataTurnos();
    setCachedValue(pharmacyCache, "la-plata", pharmacies, PHARMACY_CACHE_TTL_MS);
  }

  const sorted = sortPharmaciesByDistance(pharmacies, latitude, longitude);

  return Response.json(
    {
      city: "La Plata",
      source: "https://www.colfarmalp.org.ar/turnos-la-plata/",
      fetchedAt: new Date().toISOString(),
      userLocation:
        latitude && longitude
          ? {
              latitude: Number(latitude),
              longitude: Number(longitude)
            }
          : null,
      pharmacies: sorted
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
