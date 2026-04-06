const routeCache = new Map();

export function createRouteKey(userLocation, destination) {
  if (!userLocation || !destination) {
    return null;
  }

  return [
    userLocation.latitude.toFixed(5),
    userLocation.longitude.toFixed(5),
    destination[0].toFixed(5),
    destination[1].toFixed(5)
  ].join(":");
}

export function getCachedRoute(routeKey) {
  return routeKey ? routeCache.get(routeKey) ?? null : null;
}

export function setCachedRoute(routeKey, value) {
  if (!routeKey) {
    return;
  }

  routeCache.set(routeKey, value);
}

export async function ensureRouteCached(userLocation, pharmacy) {
  const destination =
    pharmacy?.latitude != null && pharmacy?.longitude != null
      ? [pharmacy.latitude, pharmacy.longitude]
      : null;

  const routeKey = createRouteKey(userLocation, destination);
  const existing = getCachedRoute(routeKey);

  if (existing || !routeKey || !destination) {
    return existing;
  }

  const params = new URLSearchParams({
    fromLat: String(userLocation.latitude),
    fromLng: String(userLocation.longitude),
    toLat: String(destination[0]),
    toLng: String(destination[1])
  });

  try {
    const response = await fetch(`/api/route?${params.toString()}`);
    if (!response.ok) {
      throw new Error("route_failed");
    }

    const data = await response.json();
    const cached = {
      points: data.points ?? [],
      fallback: Boolean(data.fallback)
    };

    setCachedRoute(routeKey, cached);
    return cached;
  } catch {
    const fallback = {
      points: [
        [userLocation.latitude, userLocation.longitude],
        destination
      ],
      fallback: true
    };

    setCachedRoute(routeKey, fallback);
    return fallback;
  }
}
