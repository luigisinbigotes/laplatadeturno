"use client";

import { useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./manual-location-picker.module.css";

const pickerIcon = L.divIcon({
  className: styles.marker,
  html: "<span></span>",
  iconSize: [22, 22]
});

const defaultCenter = {
  latitude: -34.9205,
  longitude: -57.9536
};

function PickerMarker({ value, onChange }) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng
      });
    }
  });

  return (
    <Marker
      position={[value.latitude, value.longitude]}
      icon={pickerIcon}
      draggable
      eventHandlers={{
        dragend(event) {
          const next = event.target.getLatLng();
          onChange({
            latitude: next.lat,
            longitude: next.lng
          });
        }
      }}
    />
  );
}

export default function ManualLocationPicker({ initialLocation, onCancel, onConfirm }) {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation ?? defaultCenter);
  const center = useMemo(
    () => [selectedLocation.latitude, selectedLocation.longitude],
    [selectedLocation.latitude, selectedLocation.longitude]
  );

  return (
    <div className={styles.overlay} data-testid="manual-location-modal">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Ubicacion manual</p>
            <h3>Elegi tu punto en el mapa</h3>
          </div>
          <button className={styles.closeButton} onClick={onCancel} aria-label="Cerrar selector manual">
            Cerrar
          </button>
        </div>

        <p className={styles.copy}>
          Toca el mapa o arrastra el marcador para elegir una ubicacion aproximada sin compartir tu posicion real.
        </p>

        <div className={styles.mapShell}>
          <MapContainer center={center} zoom={13} scrollWheelZoom className={styles.map}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PickerMarker value={selectedLocation} onChange={setSelectedLocation} />
          </MapContainer>
        </div>

        <p className={styles.coords}>
          Punto elegido: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
        </p>

        <div className={styles.actions}>
          <button className={styles.secondaryButton} onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => onConfirm(selectedLocation)}
            data-testid="manual-location-confirm"
          >
            Usar esta ubicacion
          </button>
        </div>
      </div>
    </div>
  );
}
