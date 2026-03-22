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

function LocationMarker({ position, setPosition, readonly, mapInstance }) {
  useMapEvents({
    click(e) {
      if (!readonly) {
        setPosition(e.latlng);
        mapInstance?.flyTo(e.latlng, mapInstance.getZoom());
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
  const position = { lat: geo.lat || 22.54, lng: geo.lng || 114.05 };
  const [mapInstance, setMapInstance] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  // Sync map center when position changes externally via search
  useEffect(() => {
    if (mapInstance && position.lat && position.lng && isSearching) {
      mapInstance.flyTo(position, 14);
    }
  }, [position.lat, position.lng]);

  const handlePositionChange = (newPos) => {
    onChange(newPos);
    if (!readonly) {
      localStorage.setItem('last_geo', JSON.stringify(newPos));
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        handlePositionChange(newPos);
      } else {
        alert("未找到该地点，请尝试输入更详细的地址或城市名");
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setTimeout(() => setIsSearching(false), 500); // 留点时间给 flyTo 动画
    }
  };

  return (
    <div className="w-full h-full relative z-0 rounded-xl flex flex-col overflow-hidden border border-black/10 shadow-inner bg-white">
      {!readonly && (
        <form onSubmit={handleSearch} className="flex p-2 gap-2 bg-gray-50 border-b border-black/5 z-[1000] relative">
          <input 
            type="text" 
            placeholder="搜地址 (如: 深圳 南山区)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white px-3 py-1.5 rounded-lg text-xs text-gray-900 placeholder-gray-500 outline-none border border-black/10 shadow-sm"
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {isSearching ? '...' : '搜索'}
          </button>
        </form>
      )}

      <div className="flex-1 relative z-0">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={!readonly}
          style={{ width: '100%', height: '100%', zIndex: 0 }}
          ref={setMapInstance}
        >
          <TileLayer
            attribution='&copy; OSM'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} readonly={readonly} mapInstance={mapInstance} />
        </MapContainer>
        
        {!readonly && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] font-mono shadow-sm flex justify-between tracking-tighter" style={{ zIndex: 1000, pointerEvents: 'none' }}>
            <span>LAT: {position.lat.toFixed(6)}</span>
            <span>LNG: {position.lng.toFixed(6)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
