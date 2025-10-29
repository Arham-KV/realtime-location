// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import io from 'socket.io-client';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Fix Leaflet icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });

// export default function SharePage() {
//   const { token } = useParams();
//   const navigate = useNavigate();
//   const mapRef = useRef(null);
//   const markerRef = useRef(null);
//   const socketRef = useRef(null);
//   const watchIdRef = useRef(null);
//   const [status, setStatus] = useState('Connecting...');
//   const [isSharing, setIsSharing] = useState(true);
//   const [currentLocation, setCurrentLocation] = useState(null);

//   useEffect(() => {
//     // Initialize map
//     mapRef.current = L.map('share-map').setView([20.5937, 78.9629], 5); // Default India view
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap contributors',
//       maxZoom: 19
//     }).addTo(mapRef.current);

//     // Socket connection
//     socketRef.current = io({
//       transports: ['websocket', 'polling']
//     });

//     socketRef.current.on('connect', () => {
//       setStatus('Connected - Sharing Live Location');
//       socketRef.current.emit('join_share', { token });
//     });

//     socketRef.current.on('disconnect', () => {
//       setStatus('Disconnected');
//     });

//     // Start geolocation tracking
//     if (navigator.geolocation) {
//       watchIdRef.current = navigator.geolocation.watchPosition(
//         (position) => {
//           const { latitude, longitude, heading, speed, accuracy } = position.coords;
//           const locationData = {
//             token,
//             lat: latitude,
//             lng: longitude,
//             heading: heading || 0,
//             speed: speed || 0,
//             accuracy: accuracy || 10
//           };

//           setCurrentLocation(locationData);

//           // Update map marker
//           updateMarker([latitude, longitude]);

//           // Send to server
//           if (socketRef.current && socketRef.current.connected) {
//             socketRef.current.emit('location_update', locationData);
//           }
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           setStatus('Location access denied');
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 1000
//         }
//       );
//     } else {
//       setStatus('Geolocation not supported');
//     }

//     return () => {
//       // Cleanup
//       if (watchIdRef.current) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//       }
//       if (mapRef.current) {
//         mapRef.current.remove();
//       }
//     };
//   }, [token]);

//   const updateMarker = (latlng) => {
//     if (!markerRef.current) {
//       // Create new marker
//       markerRef.current = L.marker(latlng, {
//         icon: L.icon({
//           iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
//           shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//           iconSize: [25, 41],
//           iconAnchor: [12, 41],
//           popupAnchor: [1, -34],
//           shadowSize: [41, 41]
//         })
//       }).addTo(mapRef.current);

//       markerRef.current.bindPopup('Your current location').openPopup();
//       mapRef.current.setView(latlng, 16);
//     } else {
//       // Smoothly move existing marker
//       markerRef.current.setLatLng(latlng);
//       mapRef.current.panTo(latlng);
//     }
//   };

//   const stopSharing = async () => {
//     try {
//       await fetch('/api/stop', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token })
//       });

//       if (socketRef.current) {
//         socketRef.current.emit('stop_sharing', { token });
//       }

//       if (watchIdRef.current) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }

//       setIsSharing(false);
//       setStatus('Sharing stopped');

//       setTimeout(() => {
//         navigate('/dashboard');
//       }, 2000);
//     } catch (error) {
//       console.error('Stop sharing error:', error);
//     }
//   };

//   const shareUrl = `${window.location.origin}/track/${token}`;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="max-w-6xl mx-auto px-4 py-4">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <div>
//               <h1 className="text-xl font-bold text-gray-900">Live Location Sharing</h1>
//               <div className="flex items-center mt-1">
//                 <div className={`w-3 h-3 rounded-full mr-2 ${
//                   status.includes('Connected') ? 'bg-green-500 animate-pulse' : 
//                   status.includes('Disconnected') ? 'bg-red-500' : 'bg-yellow-500'
//                 }`}></div>
//                 <span className="text-sm text-gray-600">{status}</span>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <button
//                 onClick={() => navigator.clipboard.writeText(shareUrl)}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//               >
//                 Copy Link
//               </button>
//               <button
//                 onClick={stopSharing}
//                 disabled={!isSharing}
//                 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
//               >
//                 Stop Sharing
//               </button>
//             </div>
//           </div>

//           {/* Share URL */}
//           <div className="mt-4">
//             <p className="text-sm text-gray-600 mb-2">Share this link with viewers:</p>
//             <div className="flex gap-2">
//               <input
//                 readOnly
//                 value={shareUrl}
//                 className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
//               />
//             </div>
//           </div>

//           {/* Current Location Info */}
//           {currentLocation && (
//             <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//               <div className="bg-gray-50 p-3 rounded-lg">
//                 <div className="text-gray-600">Latitude</div>
//                 <div className="font-mono">{currentLocation.lat.toFixed(6)}</div>
//               </div>
//               <div className="bg-gray-50 p-3 rounded-lg">
//                 <div className="text-gray-600">Longitude</div>
//                 <div className="font-mono">{currentLocation.lng.toFixed(6)}</div>
//               </div>
//               <div className="bg-gray-50 p-3 rounded-lg">
//                 <div className="text-gray-600">Speed</div>
//                 <div className="font-mono">{(currentLocation.speed * 3.6).toFixed(1)} km/h</div>
//               </div>
//               <div className="bg-gray-50 p-3 rounded-lg">
//                 <div className="text-gray-600">Accuracy</div>
//                 <div className="font-mono">±{Math.round(currentLocation.accuracy)}m</div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Map */}
//       <div id="share-map" style={{ height: 'calc(100vh - 200px)' }} className="w-full"></div>

//       {/* Status Message */}
//       {!isSharing && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg text-center">
//             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-semibold mb-2">Sharing Stopped</h3>
//             <p className="text-gray-600">Redirecting to dashboard...</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


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
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    // Initialize map
    mapRef.current = L.map('share-map').setView([20.5937, 78.9629], 5);
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
      setConnectionStatus('connected');
      socketRef.current.emit('join_share', { token });
    });

    socketRef.current.on('disconnect', () => {
      setStatus('Disconnected');
      setConnectionStatus('disconnected');
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
          updateMarker([latitude, longitude]);

          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('location_update', locationData);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setStatus('Location access denied');
          setConnectionStatus('error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );
    } else {
      setStatus('Geolocation not supported');
      setConnectionStatus('error');
    }

    return () => {
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

      markerRef.current.bindPopup('<div class="font-semibold text-sm">📍 Your Live Location</div>').openPopup();
      mapRef.current.setView(latlng, 16);
    } else {
      markerRef.current.setLatLng(latlng);
      mapRef.current.panTo(latlng, {
        animate: true,
        duration: 1.0
      });
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
      setConnectionStatus('stopped');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Stop sharing error:', error);
    }
  };

  const shareUrl = `${window.location.origin}/track/${token}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Live Sharing Active
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className={`flex items-center text-sm font-medium ${connectionStatus === 'connected' ? 'text-green-600' :
                      connectionStatus === 'error' ? 'text-red-600' :
                        connectionStatus === 'stopped' ? 'text-gray-600' : 'text-yellow-600'
                    }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                        connectionStatus === 'error' ? 'bg-red-500' :
                          connectionStatus === 'stopped' ? 'bg-gray-500' : 'bg-yellow-500'
                      }`}></div>
                    {status}
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Token: {token}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-3 focus:ring-blue-200 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </button>
              <button
                onClick={stopSharing}
                disabled={!isSharing}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 focus:ring-3 focus:ring-red-200 focus:ring-offset-2 disabled:bg-gray-400 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Stop Sharing</span>
              </button>
            </div>
          </div>

          {/* Share URL */}
          <div className="pb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Share this link with viewers:
            </p>
            <div className="flex space-x-3">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Info */}
          {currentLocation && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                <div className="text-xs text-blue-600 font-semibold mb-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  LATITUDE
                </div>
                <div className="font-mono text-lg font-bold text-blue-900">{currentLocation.lat.toFixed(6)}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                <div className="text-xs text-green-600 font-semibold mb-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  LONGITUDE
                </div>
                <div className="font-mono text-lg font-bold text-green-900">{currentLocation.lng.toFixed(6)}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
                <div className="text-xs text-purple-600 font-semibold mb-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6.0001V3.0001M13 6.0001C13 6.0001 16 5.84999 18 8.0001C20 10.1502 20 13.0001 18 15.0001C16 17.0002 13 17.0001 13 17.0001M13 6.0001L11 6.0001M13 17.0001V21.0001M13 17.0001L11 17.0001" />
                  </svg>
                  SPEED
                </div>
                <div className="font-mono text-lg font-bold text-purple-900">{(currentLocation.speed * 3.6).toFixed(1)} km/h</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
                <div className="text-xs text-orange-600 font-semibold mb-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  ACCURACY
                </div>
                <div className="font-mono text-lg font-bold text-orange-900">±{Math.round(currentLocation.accuracy)}m</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Map */}
      {/* Map - Fixed */}
      <div style={{ height: '70vh', width: '100%' }}>
        <div id="share-map" style={{ height: '100%', width: '100%' }}></div>

        {/* Live Indicator */}
        <div className="absolute top-6 right-6 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 shadow-2xl backdrop-blur-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>
      </div>

      {/* Stopped Overlay */}
      {!isSharing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-lg p-8 rounded-3xl text-center max-w-sm mx-4 shadow-2xl border border-white/20 transform animate-scale-in">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Sharing Stopped</h3>
            <p className="text-gray-600 mb-6">Your location sharing has been stopped successfully.</p>
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}
    </div>
  );
}