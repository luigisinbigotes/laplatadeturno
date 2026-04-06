import {
  applyRateLimit,
  getCachedValue,
  isWithinLaPlataBounds,
  setCachedValue
} from "@/lib/security";

const addressCache = new Map();
const ADDRESS_CACHE_TTL_MS = 30 * 60 * 1000;

function buildApproximateAddress(address) {
  if (!address) {
    return null;
  }

  const road = address.road || address.pedestrian || address.footway || address.path;
  const houseNumber = address.house_number;
  const suburb = address.suburb || address.neighbourhood || address.city_district;
  const city = address.city || address.town || address.village || address.county;

  const firstLine = [road, houseNumber].filter(Boolean).join(" ");
  const secondLine = [suburb, city].filter(Boolean).join(", ");
  const label = [firstLine, secondLine].filter(Boolean).join(", ");

  return label || null;
}

export async function GET(request) {
  const rateLimited = applyRateLimit(request, "reverse-geocode", 30, 60 * 1000);
  if (rateLimited) {
    return rateLimited;
  }

  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lng"));

  if (![latitude, longitude].every(Number.isFinite)) {
    return Response.json(
      { error: "invalid_coordinates" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!isWithinLaPlataBounds(latitude, longitude)) {
    return Response.json(
      { error: "coordinates_out_of_scope" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const cacheKey = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
  const cached = getCachedValue(addressCache, cacheKey, ADDRESS_CACHE_TTL_MS);
  if (cached) {
    return Response.json(cached, {
      headers: {
        "Cache-Control": "private, no-store"
      }
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "DeTurnoBot/0.1 (+https://localhost)"
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("reverse_geocode_failed");
    }

    const data = await response.json();
    const result = {
      label:
        buildApproximateAddress(data.address) ||
        data.display_name?.split(",").slice(0, 3).join(", ").trim() ||
        null
    };

    setCachedValue(addressCache, cacheKey, result, ADDRESS_CACHE_TTL_MS);

    return Response.json(result, {
      headers: {
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return Response.json(
      { label: null },
      {
        headers: {
          "Cache-Control": "private, no-store"
        }
      }
    );
  }
}
