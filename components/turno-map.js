"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./turno-map.module.css";

const icon = L.divIcon({
  className: styles.marker,
  html: "<span></span>",
  iconSize: [18, 18]
});

const userIcon = L.divIcon({
  className: styles.userMarker,
  html: "<span></span>",
  iconSize: [18, 18]
});

export default function TurnoMap({ pharmacies, userLocation }) {
  const center =
    userLocation && Number.isFinite(userLocation.latitude) && Number.isFinite(userLocation.longitude)
      ? [userLocation.latitude, userLocation.longitude]
      : [-34.9205, -57.9536];
  const mappablePharmacies = useMemo(
    () => pharmacies.filter((pharmacy) => pharmacy.latitude != null && pharmacy.longitude != null),
    [pharmacies]
  );

  if (mappablePharmacies.length === 0) {
    return (
      <div className={`${styles.wrapper} ${styles.emptyWrapper}`} data-testid="turno-map-empty">
        <div className={styles.emptyState}>
          <strong>Mapa no disponible</strong>
          <p>El turnero de mañana todavia solo publica direcciones, asi que mostramos la lista y el acceso al mapa externo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} data-testid="turno-map">
      <MapContainer center={center} zoom={12} scrollWheelZoom className={styles.map}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
        />

        {userLocation ? (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>Tu ubicacion</Popup>
          </Marker>
        ) : null}

        {mappablePharmacies.map((pharmacy) => (
          <Marker
            key={`${pharmacy.name}-${pharmacy.address}`}
            position={[pharmacy.latitude, pharmacy.longitude]}
            icon={icon}
          >
            <Popup>
              <strong>{pharmacy.name}</strong>
              <br />
              {pharmacy.address}
              <br />
              <a href={pharmacy.mapUrl} target="_blank" rel="noreferrer">
                Abrir ruta
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
