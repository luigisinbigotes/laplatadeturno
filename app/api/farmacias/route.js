import {
  fetchLaPlataTurnos,
  sortPharmaciesByDistance,
  withNullDistances
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
  const rateLimited = applyRateLimit(request, "farmacias", 5000, 60 * 1000);
  if (rateLimited) {
    return rateLimited;
  }

  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");
  const day = searchParams.get("day") ?? "today";
  const lat = latitude == null ? null : Number(latitude);
  const lng = longitude == null ? null : Number(longitude);

  if (!["today", "tomorrow"].includes(day)) {
    return Response.json(
      { error: "invalid_day_scope" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

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

  let pharmacies;
  let source = "https://www.colfarmalp.org.ar/turnos-la-plata/";
  let detailsLevel = "full";
  let targetDate = new Date();

  if (day === "tomorrow") {
    const tomorrowCache = getCachedValue(pharmacyCache, "la-plata-tomorrow", PHARMACY_CACHE_TTL_MS);

    if (tomorrowCache) {
      pharmacies = tomorrowCache.pharmacies;
      source = tomorrowCache.source;
      detailsLevel = tomorrowCache.detailsLevel;
      targetDate = new Date(tomorrowCache.targetDate);
    } else {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
      targetDate.setDate(targetDate.getDate() + 1);
      pharmacies = withNullDistances([]);
      source = "https://www.colfarmalp.org.ar/wp-content/uploads/turnos/lp.pdf";
      detailsLevel = "unavailable";
      setCachedValue(
        pharmacyCache,
        "la-plata-tomorrow",
        {
          pharmacies,
          source,
          detailsLevel,
          targetDate: targetDate.toISOString()
        },
        PHARMACY_CACHE_TTL_MS
      );
    }
  } else {
    pharmacies = getCachedValue(pharmacyCache, "la-plata", PHARMACY_CACHE_TTL_MS);
    if (!pharmacies) {
      pharmacies = await fetchLaPlataTurnos();
      setCachedValue(pharmacyCache, "la-plata", pharmacies, PHARMACY_CACHE_TTL_MS);
    }

    pharmacies = sortPharmaciesByDistance(pharmacies, latitude, longitude);
  }

  return Response.json(
    {
      city: "La Plata",
      dayScope: day,
      detailsLevel,
      source,
      fetchedAt: new Date().toISOString(),
      targetDate: targetDate.toISOString(),
      userLocation:
        latitude && longitude
          ? {
              latitude: Number(latitude),
              longitude: Number(longitude)
            }
          : null,
      pharmacies
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
