import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function SharePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const [status, setStatus] = useState('Connecting...');
  const [isSharing, setIsSharing] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Initialize map
    mapRef.current = L.map('share-map').setView([20.5937, 78.9629], 5); // Default India view
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapRef.current);

    // Socket connection
    socketRef.current = io({
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setStatus('Connected - Sharing Live Location');
      socketRef.current.emit('join_share', { token });
    });

    socketRef.current.on('disconnect', () => {
      setStatus('Disconnected');
    });

    // Start geolocation tracking
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed, accuracy } = position.coords;
          const locationData = {
            token,
            lat: latitude,
            lng: longitude,
            heading: heading || 0,
            speed: speed || 0,
            accuracy: accuracy || 10
          };

          setCurrentLocation(locationData);

          // Update map marker
          updateMarker([latitude, longitude]);

          // Send to server
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('location_update', locationData);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setStatus('Location access denied');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );
    } else {
      setStatus('Geolocation not supported');
    }

    return () => {
      // Cleanup
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [token]);

  const updateMarker = (latlng) => {
    if (!markerRef.current) {
      // Create new marker
      markerRef.current = L.marker(latlng, {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(mapRef.current);
      
      markerRef.current.bindPopup('Your current location').openPopup();
      mapRef.current.setView(latlng, 16);
    } else {
      // Smoothly move existing marker
      markerRef.current.setLatLng(latlng);
      mapRef.current.panTo(latlng);
    }
  };

  const stopSharing = async () => {
    try {
      await fetch('/api/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (socketRef.current) {
        socketRef.current.emit('stop_sharing', { token });
      }

      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      setIsSharing(false);
      setStatus('Sharing stopped');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Stop sharing error:', error);
    }
  };

  const shareUrl = `${window.location.origin}/track/${token}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Location Sharing</h1>
              <div className="flex items-center mt-1">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  status.includes('Connected') ? 'bg-green-500 animate-pulse' : 
                  status.includes('Disconnected') ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm text-gray-600">{status}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={stopSharing}
                disabled={!isSharing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                Stop Sharing
              </button>
            </div>
          </div>

          {/* Share URL */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Share this link with viewers:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
            </div>
          </div>

          {/* Current Location Info */}
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
                <div className="text-gray-600">Accuracy</div>
                <div className="font-mono">±{Math.round(currentLocation.accuracy)}m</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div id="share-map" style={{ height: 'calc(100vh - 200px)' }} className="w-full"></div>

      {/* Status Message */}
      {!isSharing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Sharing Stopped</h3>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}