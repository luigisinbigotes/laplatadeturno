const rateLimitStore = new Map();

const LA_PLATA_BOUNDS = {
  minLat: -35.12,
  maxLat: -34.78,
  minLng: -58.20,
  maxLng: -57.78
};

export function isWithinLaPlataBounds(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= LA_PLATA_BOUNDS.minLat &&
    latitude <= LA_PLATA_BOUNDS.maxLat &&
    longitude >= LA_PLATA_BOUNDS.minLng &&
    longitude <= LA_PLATA_BOUNDS.maxLng
  );
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function applyRateLimit(request, key, limit, windowMs) {
  // Bypass rate limiting for E2E tests
  if (request.headers.get("x-bypass-rate-limit") === "true") {
    return null;
  }

  const clientIp = getClientIp(request);
  const now = Date.now();
  const bucketKey = `${key}:${clientIp}`;
  const bucket = rateLimitStore.get(bucketKey);

  if (!bucket || bucket.expiresAt <= now) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      expiresAt: now + windowMs
    });
    return null;
  }

  if (bucket.count >= limit) {
    return Response.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.ceil((bucket.expiresAt - now) / 1000))
        }
      }
    );
  }

  bucket.count += 1;
  return null;
}

export function getCachedValue(store, key, ttlMs) {
  const cached = store.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return cached.value;
}

export function setCachedValue(store, key, value, ttlMs) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}
