import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 修复 Leaflet 在 Webpack/Vite 中的默认图标丢失问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, readonly }) {
  const map = useMapEvents({
    click(e) {
      if (!readonly) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      }
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={!readonly}
      eventHandlers={{
        dragend: (e) => {
          if (!readonly) {
             const marker = e.target;
             setPosition(marker.getLatLng());
          }
        },
      }}
    />
  );
}

export default function LocationPicker({ geo, onChange, readonly = false }) {
  const position = { lat: geo.lat || 22.54, lng: geo.lng || 114.05 }; // 默认深圳

  return (
    <div className="w-full h-full relative z-0 rounded-xl overflow-hidden border border-black/10 shadow-inner">
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={!readonly}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={onChange} readonly={readonly} />
      </MapContainer>
      
      {!readonly && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] font-mono shadow-sm flex justify-between tracking-tighter" style={{ zIndex: 1000 }}>
          <span>LAT: {position.lat.toFixed(6)}</span>
          <span>LNG: {position.lng.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}
