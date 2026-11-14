import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STOP_STATUS_META, formatTimeVN } from '../journeyConstants';

function createNumberedIcon(number, status, isSelected) {
  const meta = STOP_STATUS_META[status] || STOP_STATUS_META.PENDING;
  const size = isSelected || status === 'VISITING' ? 34 : 28;
  const border = isSelected ? '3px solid #0f172a' : '2.5px solid #ffffff';
  const pulseStyle =
    status === 'VISITING'
      ? 'box-shadow: 0 0 0 5px rgba(234, 88, 12, 0.35);'
      : 'box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);';

  return L.divIcon({
    className: 'journey-custom-marker',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${meta.markerBg};
      color:#fff;
      font-weight:800;
      font-size:${size > 30 ? 14 : 12}px;
      display:flex;
      align-items:center;
      justify-content:center;
      border:${border};
      ${pulseStyle}
    ">${number}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapBoundsUpdater({ stops, selectedStopId }) {
  const map = useMap();

  useEffect(() => {
    const validStops = stops.filter(
      (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number'
    );
    if (validStops.length === 0) return;

    if (selectedStopId) {
      const target = validStops.find((s) => s._id === selectedStopId);
      if (target) {
        map.panTo([target.latitude, target.longitude], { animate: true });
        return;
      }
    }

    if (validStops.length === 1) {
      map.setView([validStops[0].latitude, validStops[0].longitude], 13);
    } else {
      const bounds = L.latLngBounds(validStops.map((s) => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    }
  }, [stops, selectedStopId, map]);

  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) });
      }
    },
  });
  return null;
}

function JourneyMap({
  stops = [],
  selectedStopId = null,
  onSelectStop = null,
  onMapClick = null,
  pickedCoords = null,
  height = '420px',
}) {
  const validStops = stops.filter(
    (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number'
  );

  // Lộ trình nối các điểm đang hoạt động (không bao gồm điểm đã bỏ qua) theo thứ tự hiện tại
  const routeCoords = validStops
    .filter((s) => s.status !== 'SKIPPED')
    .map((s) => [s.latitude, s.longitude]);

  const defaultCenter =
    validStops.length > 0
      ? [validStops[0].latitude, validStops[0].longitude]
      : [16.0544, 108.2022];

  return (
    <div className="bg-white rounded-4 border shadow-sm overflow-hidden">
      <div className="px-3 py-2 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2 bg-light">
        <span className="fw-bold" style={{ fontSize: '14px', color: '#0f172a' }}>
          Bản đồ lộ trình tham quan
        </span>
        <div className="d-flex flex-wrap gap-2" style={{ fontSize: '11.5px' }}>
          {Object.entries(STOP_STATUS_META).map(([key, meta]) => (
            <span key={key} className="d-inline-flex align-items-center gap-1">
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: meta.markerBg,
                  display: 'inline-block',
                }}
              />
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsUpdater stops={validStops} selectedStopId={selectedStopId} />
          {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

          {routeCoords.length >= 2 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#ea580c', weight: 3.5, dashArray: '8, 6', opacity: 0.85 }}
            />
          )}

          {validStops.map((stop, idx) => {
            const meta = STOP_STATUS_META[stop.status] || STOP_STATUS_META.PENDING;
            return (
              <Marker
                key={stop._id || idx}
                position={[stop.latitude, stop.longitude]}
                icon={createNumberedIcon(idx + 1, stop.status, selectedStopId === stop._id)}
                eventHandlers={{
                  click: () => onSelectStop && onSelectStop(stop),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <div className="fw-bold mb-1">
                      #{idx + 1}. {stop.name}
                    </div>
                    <div className="mb-1">
                      <span
                        className="badge"
                        style={{ backgroundColor: meta.markerBg, color: '#fff' }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    {stop.address && (
                      <div className="text-muted" style={{ fontSize: '12px' }}>
                        {stop.address}
                      </div>
                    )}
                    {stop.planned_start && (
                      <div className="mt-1" style={{ fontSize: '12px' }}>
                        Dự kiến: {formatTimeVN(stop.planned_start)} – {formatTimeVN(stop.planned_end)}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {pickedCoords && typeof pickedCoords.lat === 'number' && typeof pickedCoords.lng === 'number' && (
            <Marker
              position={[pickedCoords.lat, pickedCoords.lng]}
              icon={createNumberedIcon('+', 'TRAVELLING', true)}
            >
              <Popup>Vị trí điểm mới đã chọn</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default JourneyMap;

