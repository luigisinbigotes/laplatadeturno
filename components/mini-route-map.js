"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./mini-route-map.module.css";
import {
  createRouteKey,
  ensureRouteCached,
  getCachedRoute
} from "@/lib/route-cache-client";

const pharmacyIcon = L.divIcon({
  className: styles.marker,
  html: "<span></span>",
  iconSize: [16, 16]
});

const userIcon = L.divIcon({
  className: styles.userMarker,
  html: "<span></span>",
  iconSize: [16, 16]
});

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      return;
    }

    map.fitBounds(points, {
      padding: [24, 24]
    });
  }, [map, points]);

  return null;
}

export default function MiniRouteMap({ userLocation, pharmacy, canRoute }) {
  const [routePoints, setRoutePoints] = useState([]);
  const [routeStatus, setRouteStatus] = useState("idle");
  const destination = useMemo(() => {
    if (pharmacy?.latitude == null || pharmacy?.longitude == null) {
      return null;
    }

    return [pharmacy.latitude, pharmacy.longitude];
  }, [pharmacy?.latitude, pharmacy?.longitude]);

  const routeKey = useMemo(() => {
    return canRoute ? createRouteKey(userLocation, destination) : null;
  }, [canRoute, destination, userLocation]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (!canRoute || !userLocation || !destination || !routeKey) {
        setRouteStatus("idle");
        setRoutePoints([]);
        return;
      }

      const cached = getCachedRoute(routeKey);
      if (cached) {
        setRoutePoints(cached.points);
        setRouteStatus(cached.fallback ? "fallback" : "ready");
        return;
      }

      setRouteStatus("loading");

      try {
        const data = await ensureRouteCached(userLocation, pharmacy);
        const points = data?.points ?? [];

        if (!cancelled) {
          setRoutePoints(points);
          setRouteStatus(data?.fallback ? "fallback" : "ready");
        }
      } catch {
        if (!cancelled) {
          setRoutePoints([
            [userLocation.latitude, userLocation.longitude],
            destination
          ]);
          setRouteStatus("fallback");
        }
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [canRoute, destination, pharmacy, routeKey, userLocation]);

  const mapPoints = useMemo(() => {
    const points = [];

    if (userLocation) {
      points.push([userLocation.latitude, userLocation.longitude]);
    }

    if (destination) {
      points.push(destination);
    }

    return points;
  }, [destination, userLocation]);

  if (!userLocation || !destination || !canRoute) {
    return (
      <div className={styles.placeholder} data-testid="mini-route-map-placeholder">
        <p>Activa tu ubicacion para ver la ruta a pie hasta la farmacia mas cercana.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} data-testid="mini-route-map">
      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={14}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        attributionControl={false}
        className={styles.map}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon} />
        <Marker position={destination} icon={pharmacyIcon} />
        {routePoints.length ? (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: routeStatus === "fallback" ? "#6b6b6b" : "#d14b2f",
              weight: routeStatus === "fallback" ? 3 : 4,
              dashArray: routeStatus === "fallback" ? "7 10" : "10 8",
              lineCap: "square"
            }}
          />
        ) : null}
        <FitBounds points={routePoints.length ? routePoints : mapPoints} />
      </MapContainer>
      <div className={styles.caption} data-testid="mini-route-map-caption">
        {routeStatus === "loading" ? "Buscando recorrido peatonal..." : null}
        {routeStatus === "fallback" ? "Vista aproximada: linea directa hasta la farmacia." : null}
        {routeStatus === "ready" ? "Recorrido peatonal estimado hasta la farmacia." : null}
      </div>
    </div>
  );
}
