import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function Viewer() {
  const { token } = useParams();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const socketRef = useRef(null);
  const [status, setStatus] = useState('Connecting...');
  const [isActive, setIsActive] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [path, setPath] = useState([]);

  useEffect(() => {
    // Initialize map
    mapRef.current = L.map('viewer-map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapRef.current);

    // Initialize polyline for trail
    polylineRef.current = L.polyline([], {
      color: 'red',
      weight: 4,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(mapRef.current);

    // Socket connection
    socketRef.current = io({
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setStatus('Connected - Watching Live Location');
      socketRef.current.emit('join_share', { token });
    });

    socketRef.current.on('disconnect', () => {
      setStatus('Disconnected');
    });

    // Listen for location updates
    socketRef.current.on('location_update', (data) => {
      const newLocation = {
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
        speed: data.speed,
        accuracy: data.accuracy,
        timestamp: new Date(data.timestamp)
      };

      setCurrentLocation(newLocation);
      setIsActive(true);

      // Update marker
      updateMarker([data.lat, data.lng]);

      // Update path
      const newPath = [...path, [data.lat, data.lng]];
      setPath(newPath);
      polylineRef.current.setLatLngs(newPath);
    });

    // Listen for stop sharing
    socketRef.current.on('sharing_stopped', () => {
      setIsActive(false);
      setStatus('Sharing has been stopped');
    });

    // Check initial session status
    checkSessionStatus();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [token]);

  const checkSessionStatus = async () => {
    try {
      const response = await fetch(`/api/session/${token}`);
      const data = await response.json();
      
      if (data.active === false) {
        setIsActive(false);
        setStatus('Sharing has ended');
      } else if (data.last_location) {
        // Show last known location
        const lastLoc = data.last_location;
        updateMarker([lastLoc.lat, lastLoc.lng]);
        setStatus('Connected - Waiting for live updates');
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  const updateMarker = (latlng) => {
    if (!markerRef.current) {
      // Create new marker
      markerRef.current = L.marker(latlng, {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(mapRef.current);
      
      markerRef.current.bindPopup('Live Location').openPopup();
      mapRef.current.setView(latlng, 16);
    } else {
      // Smoothly animate marker movement
      markerRef.current.setLatLng(latlng);
      
      // Smooth pan to new location
      mapRef.current.panTo(latlng, {
        animate: true,
        duration: 1.0
      });
    }
  };

  const clearTrail = () => {
    setPath([]);
    polylineRef.current.setLatLngs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Location Viewer</h1>
              <div className="flex items-center mt-1">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">{status}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Tracking Token: {token}</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={clearTrail}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Trail
              </button>
            </div>
          </div>

          {/* Location Info */}
          {currentLocation && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Latitude</div>
                <div className="font-mono">{currentLocation.lat.toFixed(6)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Longitude</div>
                <div className="font-mono">{currentLocation.lng.toFixed(6)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Speed</div>
                <div className="font-mono">{(currentLocation.speed * 3.6).toFixed(1)} km/h</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600">Last Update</div>
                <div className="font-mono">{currentLocation.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div id="viewer-map" style={{ height: 'calc(100vh - 180px)' }} className="w-full"></div>

      {/* Inactive Overlay */}
      {!isActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Sharing Ended</h3>
            <p className="text-gray-600 mb-4">The location sharing session has been stopped by the sharer.</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}