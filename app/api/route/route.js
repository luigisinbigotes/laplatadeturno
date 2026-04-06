import {
  applyRateLimit,
  getCachedValue,
  isWithinLaPlataBounds,
  setCachedValue
} from "@/lib/security";

const routeCache = new Map();
const ROUTE_CACHE_TTL_MS = 30 * 60 * 1000;

export async function GET(request) {
  const rateLimited = applyRateLimit(request, "route", 60, 60 * 1000);
  if (rateLimited) {
    return rateLimited;
  }

  const { searchParams } = new URL(request.url);
  const fromLat = Number(searchParams.get("fromLat"));
  const fromLng = Number(searchParams.get("fromLng"));
  const toLat = Number(searchParams.get("toLat"));
  const toLng = Number(searchParams.get("toLng"));

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return Response.json(
      { error: "invalid_coordinates" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!isWithinLaPlataBounds(fromLat, fromLng) || !isWithinLaPlataBounds(toLat, toLng)) {
    return Response.json(
      { error: "coordinates_out_of_scope" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const fallback = [
    [fromLat, fromLng],
    [toLat, toLng]
  ];
  const cacheKey = `${fromLat.toFixed(5)}:${fromLng.toFixed(5)}:${toLat.toFixed(5)}:${toLng.toFixed(5)}`;
  const cached = getCachedValue(routeCache, cacheKey, ROUTE_CACHE_TTL_MS);
  if (cached) {
    return Response.json(cached, {
      headers: {
        "Cache-Control": "private, no-store"
      }
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url =
      `https://routing.openstreetmap.de/routed-foot/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "DeTurnoBot/0.1 (+https://localhost)"
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("route_failed");
    }

    const data = await response.json();
    const coordinates = data.routes?.[0]?.geometry?.coordinates ?? [];
    const points = coordinates.map(([lng, lat]) => [lat, lng]);

    if (!points.length) {
      throw new Error("empty_route");
    }

    const result = {
      mode: "walking",
      source: "routing.openstreetmap.de",
      fallback: false,
      points
    };

    setCachedValue(routeCache, cacheKey, result, ROUTE_CACHE_TTL_MS);

    return Response.json(result, {
      headers: {
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    const result = {
      mode: "walking",
      source: "fallback",
      fallback: true,
      points: fallback
    };

    setCachedValue(routeCache, cacheKey, result, 5 * 60 * 1000);

    return Response.json(result, {
      headers: {
        "Cache-Control": "private, no-store"
      }
    });
  }
}
