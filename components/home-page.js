"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./home-page.module.css";
import dynamic from "next/dynamic";
import { ensureRouteCached } from "@/lib/route-cache-client";
import SplashScreen from "@/components/splash-screen";
import InstallPrompt from "@/components/install-prompt";

const TurnoMap = dynamic(() => import("@/components/turno-map"), {
  ssr: false,
  loading: () => <div className={styles.mapSkeleton}>Cargando mapa...</div>
});

const MiniRouteMap = dynamic(() => import("@/components/mini-route-map"), {
  ssr: false,
  loading: () => <div className={styles.miniMapSkeleton}>Cargando ruta...</div>
});

const ManualLocationPicker = dynamic(() => import("@/components/manual-location-picker"), {
  ssr: false
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
  const heroSectionRef = useRef(null);
  const [permissionState, setPermissionState] = useState("prompt");
  const [location, setLocation] = useState(null);
  const [locationLabelResolved, setLocationLabelResolved] = useState("");
  const [requiresManualLocationRequest, setRequiresManualLocationRequest] = useState(false);
  const [showManualLocationPicker, setShowManualLocationPicker] = useState(false);
  const [view, setView] = useState("list");
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacyKey, setSelectedPharmacyKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nearest = pharmacies[0] ?? null;
  const activePharmacy =
    pharmacies.find((pharmacy) => pharmacyKey(pharmacy) === selectedPharmacyKey) ?? nearest ?? null;
  const hasUsableLocation = permissionState === "granted" || permissionState === "manual";

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios|chrome/.test(userAgent);

    if (isIos && isSafari) {
      setRequiresManualLocationRequest(true);
      loadTurnos();
      return;
    }

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
    if (!hasUsableLocation || !location || pharmacies.length === 0) {
      return;
    }

    const nearestTen = pharmacies.slice(0, 10);
    nearestTen.forEach((pharmacy) => {
      void ensureRouteCached(location, pharmacy);
    });
  }, [hasUsableLocation, location, pharmacies]);

  useEffect(() => {
    let cancelled = false;

    async function resolveAddress() {
      if (!hasUsableLocation || !location) {
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
  }, [hasUsableLocation, location, permissionState]);

  function applyResolvedLocation(coords, nextPermissionState = "granted") {
    setLocation(coords);
    setPermissionState(nextPermissionState);
    setShowManualLocationPicker(false);
    loadTurnos(coords);
  }

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
      const nextPharmacies = data.pharmacies ?? [];
      setPharmacies(nextPharmacies);
      setSelectedPharmacyKey(nextPharmacies[0] ? pharmacyKey(nextPharmacies[0]) : null);
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

        applyResolvedLocation(coords, "granted");
      },
      () => {
        setPermissionState("denied");
        setError(
          requiresManualLocationRequest
            ? "No pudimos acceder a tu ubicacion. En iPhone usa este boton desde Safari o desde la app instalada."
            : "No pudimos acceder a tu ubicación. Te mostramos igual el turno del día."
        );
        loadTurnos();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  function openManualLocationPicker() {
    setShowManualLocationPicker(true);
  }

  function confirmManualLocation(coords) {
    setError("");
    applyResolvedLocation(coords, "manual");
  }

  function selectPharmacy(pharmacy) {
    const nextKey = pharmacyKey(pharmacy);

    if (nextKey === selectedPharmacyKey) {
      return;
    }

    setSelectedPharmacyKey(nextKey);
    heroSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  const summaryText = useMemo(() => {
    if (hasUsableLocation && activePharmacy?.distanceKm != null) {
      if (activePharmacy.distanceKm > 25) {
        return `Tu ubicacion parece estar fuera de La Plata. La farmacia seleccionada queda a ${activePharmacy.distanceKm.toFixed(2)} km.`;
      }

      if (permissionState === "manual") {
        return `La farmacia seleccionada queda a ${formatDistance(activePharmacy.distanceKm)} del punto que elegiste en el mapa.`;
      }

      return `La farmacia seleccionada queda a ${formatDistance(activePharmacy.distanceKm)} de tu ubicacion.`;
    }

    return "Mostramos el turno vigente en La Plata; si habilitás tu ubicación, ordenamos por cercanía.";
  }, [activePharmacy, hasUsableLocation, permissionState]);

  const locationLabel = useMemo(() => {
    if (hasUsableLocation && location) {
      if (locationLabelResolved) {
        return permissionState === "manual"
          ? `Punto aproximado elegido: ${locationLabelResolved}`
          : `Ubicacion aproximada: ${locationLabelResolved}`;
      }

      return permissionState === "manual"
        ? `Punto elegido: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
        : `Ubicacion aproximada: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
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

    if (requiresManualLocationRequest) {
      return "En iPhone y Safari, toca el boton para habilitar ubicacion.";
    }

    return "Usa el boton para compartir tu ubicacion y ordenar por cercania.";
  }, [hasUsableLocation, location, locationLabelResolved, permissionState, requiresManualLocationRequest]);

  return (
    <main className={styles.page} data-testid="home-page">
      <SplashScreen />
      <InstallPrompt />
      <section className={styles.hero} data-testid="hero-section" ref={heroSectionRef}>
        <div className={styles.heroCard} data-testid="hero-card">
          <div className={styles.heroContent}>
            <div className={styles.heroMain} data-testid="hero-main">
              <span className={styles.cardLabel} data-testid="active-pharmacy-label">
                {activePharmacy && nearest && pharmacyKey(activePharmacy) !== pharmacyKey(nearest)
                  ? "Farmacia seleccionada"
                  : "Mas cercana ahora"}
              </span>
              <strong data-testid="active-pharmacy-name">
                {activePharmacy ? activePharmacy.name : "Cargando turnos..."}
              </strong>
              <p data-testid="active-pharmacy-address">
                {activePharmacy ? activePharmacy.address : "Consultando fuente oficial..."}
              </p>
              <span data-testid="active-pharmacy-distance">
                {activePharmacy?.distanceKm != null
                  ? formatDistance(activePharmacy.distanceKm)
                  : "Sin calculo de cercania"}
              </span>
              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  onClick={requestLocation}
                  data-testid="location-button"
                >
                  {hasUsableLocation ? "Actualizar ubicacion" : "Usar mi ubicacion"}
                </button>
                {(permissionState === "denied" || permissionState === "unsupported") && !hasUsableLocation ? (
                  <button
                    className={styles.secondaryButton}
                    onClick={openManualLocationPicker}
                    data-testid="manual-location-button"
                  >
                    Elegir en mapa
                  </button>
                ) : null}
              </div>
              <p className={styles.summary} data-testid="summary-text">
                {summaryText}
              </p>
              {activePharmacy && nearest && pharmacyKey(activePharmacy) !== pharmacyKey(nearest) ? (
                <button
                  className={styles.resetSelectionButton}
                  onClick={() => setSelectedPharmacyKey(pharmacyKey(nearest))}
                  data-testid="reset-selection-button"
                >
                  Volver a la mas cercana
                </button>
              ) : null}
              <p className={styles.locationState} data-testid="location-state">
                {locationLabel}
              </p>
              {error ? (
                <p className={styles.error} data-testid="error-message">
                  {error}
                </p>
              ) : null}
            </div>

            <div className={styles.heroMap} data-testid="hero-mini-map">
              <MiniRouteMap
                userLocation={location}
                pharmacy={activePharmacy}
                canRoute={hasUsableLocation}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel} data-testid="turno-panel">
        <div className={styles.panelHeader}>
          <div>
            <h2>Turno del dia</h2>
            <p>Fuente oficial: Colegio de Farmaceuticos de La Plata.</p>
          </div>
          <div className={styles.toggle} data-testid="view-toggle">
            <button
              className={view === "list" ? styles.toggleActive : ""}
              onClick={() => setView("list")}
              data-testid="list-view-button"
            >
              Lista
            </button>
            <button
              className={view === "map" ? styles.toggleActive : ""}
              onClick={() => setView("map")}
              data-testid="map-view-button"
            >
              Mapa
            </button>
          </div>
        </div>

        {loading ? (
          <p className={styles.loading} data-testid="loading-message">
            Actualizando farmacias de turno...
          </p>
        ) : null}

        {view === "map" ? (
          <TurnoMap pharmacies={pharmacies} userLocation={location ?? defaultCenter} />
        ) : (
          <div className={styles.list} data-testid="pharmacy-list">
            {pharmacies.map((pharmacy, index) => (
              <article
                className={`${styles.item} ${
                  pharmacyKey(pharmacy) === selectedPharmacyKey ? styles.itemActive : ""
                }`}
                key={`${pharmacy.name}-${pharmacy.address}`}
                onClick={() => selectPharmacy(pharmacy)}
                role="button"
                tabIndex={0}
                data-testid={`pharmacy-card-${index}`}
                data-pharmacy-key={pharmacyKey(pharmacy)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectPharmacy(pharmacy);
                  }
                }}
              >
                <div className={styles.itemIndex} data-testid="pharmacy-card-index">
                  {index + 1}
                </div>
                <div className={styles.itemBody}>
                  <h3 data-testid="pharmacy-card-name">{pharmacy.name}</h3>
                  <p data-testid="pharmacy-card-address">{pharmacy.address}</p>
                  <p data-testid="pharmacy-card-meta">
                    {pharmacy.zone} {pharmacy.phone ? `· ${pharmacy.phone}` : ""}
                  </p>
                </div>
                <div className={styles.itemMeta}>
                  {hasUsableLocation ? (
                    <span data-testid="pharmacy-card-distance">{formatDistance(pharmacy.distanceKm)}</span>
                  ) : null}
                  <a
                    href={pharmacy.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="pharmacy-card-directions"
                  >
                    Como llegar
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {showManualLocationPicker ? (
        <ManualLocationPicker
          initialLocation={location ?? defaultCenter}
          onCancel={() => setShowManualLocationPicker(false)}
          onConfirm={confirmManualLocation}
        />
      ) : null}
    </main>
  );
}

function pharmacyKey(pharmacy) {
  return `${pharmacy.name}-${pharmacy.address}`;
}
