"use client";

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

  return (
    <div className={styles.wrapper} data-testid="turno-map">
      <MapContainer center={center} zoom={12} scrollWheelZoom className={styles.map}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation ? (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>Tu ubicacion</Popup>
          </Marker>
        ) : null}

        {pharmacies
          .filter((pharmacy) => pharmacy.latitude != null && pharmacy.longitude != null)
          .map((pharmacy) => (
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
