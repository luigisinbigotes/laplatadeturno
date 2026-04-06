"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./home-page.module.css";
import dynamic from "next/dynamic";
import { ensureRouteCached } from "@/lib/route-cache-client";

const TurnoMap = dynamic(() => import("@/components/turno-map"), {
  ssr: false,
  loading: () => <div className={styles.mapSkeleton}>Cargando mapa...</div>
});

const MiniRouteMap = dynamic(() => import("@/components/mini-route-map"), {
  ssr: false,
  loading: () => <div className={styles.miniMapSkeleton}>Cargando ruta...</div>
});

const defaultCenter = {
  latitude: -34.9205,
  longitude: -57.9536
};

function formatDistance(distanceKm) {
  if (distanceKm == null) {
    return "s/d";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(2)} km`;
}

export default function HomePage() {
  const [permissionState, setPermissionState] = useState("prompt");
  const [location, setLocation] = useState(null);
  const [locationLabelResolved, setLocationLabelResolved] = useState("");
  const [view, setView] = useState("list");
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyKey, setSelectedPharmacyKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nearest = pharmacies[0] ?? null;
  const activePharmacy =
    pharmacies.find((pharmacy) => pharmacyKey(pharmacy) === selectedPharmacyKey) ?? nearest ?? null;

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (!pharmacies.length) {
      setSelectedPharmacyKey(null);
      return;
    }

    if (!selectedPharmacyKey || !pharmacies.some((pharmacy) => pharmacyKey(pharmacy) === selectedPharmacyKey)) {
      setSelectedPharmacyKey(pharmacyKey(pharmacies[0]));
    }
  }, [pharmacies, selectedPharmacyKey]);

  useEffect(() => {
    if (permissionState !== "granted" || !location || pharmacies.length === 0) {
      return;
    }

    const nearestTen = pharmacies.slice(0, 10);
    nearestTen.forEach((pharmacy) => {
      void ensureRouteCached(location, pharmacy);
    });
  }, [location, permissionState, pharmacies]);

  useEffect(() => {
    let cancelled = false;

    async function resolveAddress() {
      if (permissionState !== "granted" || !location) {
        setLocationLabelResolved("");
        return;
      }

      try {
        const params = new URLSearchParams({
          lat: String(location.latitude),
          lng: String(location.longitude)
        });

        const response = await fetch(`/api/reverse-geocode?${params.toString()}`);
        if (!response.ok) {
          throw new Error("reverse_geocode_failed");
        }

        const data = await response.json();
        if (!cancelled) {
          setLocationLabelResolved(data.label ?? "");
        }
      } catch {
        if (!cancelled) {
          setLocationLabelResolved("");
        }
      }
    }

    resolveAddress();

    return () => {
      cancelled = true;
    };
  }, [location, permissionState]);

  async function loadTurnos(coords) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (coords?.latitude && coords?.longitude) {
        params.set("lat", String(coords.latitude));
        params.set("lng", String(coords.longitude));
      }

      const response = await fetch(`/api/farmacias?${params.toString()}`);
      if (!response.ok) {
        throw new Error("No se pudieron cargar las farmacias de turno.");
      }

      const data = await response.json();
      setPharmacies(data.pharmacies ?? []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function requestLocation() {
    if (!navigator.geolocation) {
      setPermissionState("unsupported");
      setError("Tu navegador no soporta geolocalización.");
      loadTurnos();
      return;
    }

    setPermissionState("pending");
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setLocation(coords);
        setPermissionState("granted");
        loadTurnos(coords);
      },
      () => {
        setPermissionState("denied");
        setError("No pudimos acceder a tu ubicación. Te mostramos igual el turno del día.");
        loadTurnos();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  const summaryText = useMemo(() => {
    if (permissionState === "granted" && activePharmacy?.distanceKm != null) {
      if (activePharmacy.distanceKm > 25) {
        return `Tu ubicacion parece estar fuera de La Plata. La farmacia seleccionada queda a ${activePharmacy.distanceKm.toFixed(2)} km.`;
      }

      return `La farmacia seleccionada queda a ${formatDistance(activePharmacy.distanceKm)} de tu ubicacion.`;
    }

    return "Mostramos el turno vigente en La Plata; si habilitás tu ubicación, ordenamos por cercanía.";
  }, [activePharmacy, permissionState]);

  const locationLabel = useMemo(() => {
    if (permissionState === "granted" && location) {
      if (locationLabelResolved) {
        return `Ubicacion aproximada: ${locationLabelResolved}`;
      }

      return `Ubicacion aproximada: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
    }

    if (permissionState === "pending") {
      return "Solicitando permiso de ubicacion...";
    }

    if (permissionState === "denied") {
      return "Ubicacion no disponible. El listado no esta ordenado segun tu posicion.";
    }

    if (permissionState === "unsupported") {
      return "Este navegador no expone geolocalizacion.";
    }

    return "La app intenta pedir ubicacion al abrir.";
  }, [location, locationLabelResolved, permissionState]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCard}>
          <div className={styles.heroContent}>
            <div className={styles.heroMain}>
              <span className={styles.cardLabel}>
                {activePharmacy && nearest && pharmacyKey(activePharmacy) !== pharmacyKey(nearest)
                  ? "Farmacia seleccionada"
                  : "Mas cercana ahora"}
              </span>
              <strong>{activePharmacy ? activePharmacy.name : "Cargando turnos..."}</strong>
              <p>{activePharmacy ? activePharmacy.address : "Consultando fuente oficial..."}</p>
              <span>
                {activePharmacy?.distanceKm != null
                  ? formatDistance(activePharmacy.distanceKm)
                  : "Sin calculo de cercania"}
              </span>
              <div className={styles.actions}>
                <button className={styles.primaryButton} onClick={requestLocation}>
                  {permissionState === "granted" ? "Actualizar ubicacion" : "Usar mi ubicacion"}
                </button>
              </div>
              <p className={styles.summary}>{summaryText}</p>
              <p className={styles.locationState}>{locationLabel}</p>
              {error ? <p className={styles.error}>{error}</p> : null}
            </div>

            <div className={styles.heroMap}>
              <MiniRouteMap
                userLocation={location}
                pharmacy={activePharmacy}
                canRoute={permissionState === "granted"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Turno del dia</h2>
            <p>Fuente oficial: Colegio de Farmaceuticos de La Plata.</p>
          </div>
          <div className={styles.toggle}>
            <button
              className={view === "list" ? styles.toggleActive : ""}
              onClick={() => setView("list")}
            >
              Lista
            </button>
            <button
              className={view === "map" ? styles.toggleActive : ""}
              onClick={() => setView("map")}
            >
              Mapa
            </button>
          </div>
        </div>

        {loading ? <p className={styles.loading}>Actualizando farmacias de turno...</p> : null}

        {view === "map" ? (
          <TurnoMap pharmacies={pharmacies} userLocation={location ?? defaultCenter} />
        ) : (
          <div className={styles.list}>
            {pharmacies.map((pharmacy, index) => (
              <article
                className={`${styles.item} ${
                  pharmacyKey(pharmacy) === selectedPharmacyKey ? styles.itemActive : ""
                }`}
                key={`${pharmacy.name}-${pharmacy.address}`}
                onClick={() => setSelectedPharmacyKey(pharmacyKey(pharmacy))}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedPharmacyKey(pharmacyKey(pharmacy));
                  }
                }}
              >
                <div className={styles.itemIndex}>{index + 1}</div>
                <div className={styles.itemBody}>
                  <h3>{pharmacy.name}</h3>
                  <p>{pharmacy.address}</p>
                  <p>
                    {pharmacy.zone} {pharmacy.phone ? `· ${pharmacy.phone}` : ""}
                  </p>
                </div>
                <div className={styles.itemMeta}>
                  {permissionState === "granted" ? <span>{formatDistance(pharmacy.distanceKm)}</span> : null}
                  <a href={pharmacy.mapUrl} target="_blank" rel="noreferrer">
                    Como llegar
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function pharmacyKey(pharmacy) {
  return `${pharmacy.name}-${pharmacy.address}`;
}
