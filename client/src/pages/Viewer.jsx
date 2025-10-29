// import React, { useEffect, useRef, useState } from 'react';
// import { useParams } from 'react-router-dom';
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

// export default function Viewer() {
//   const { token } = useParams();
//   const mapRef = useRef(null);
//   const markerRef = useRef(null);
//   const polylineRef = useRef(null);
//   const socketRef = useRef(null);
//   const [status, setStatus] = useState('Connecting...');
//   const [isActive, setIsActive] = useState(true);
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [path, setPath] = useState([]);

//   useEffect(() => {
//     // Initialize map
//     mapRef.current = L.map('viewer-map').setView([20.5937, 78.9629], 5);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap contributors',
//       maxZoom: 19
//     }).addTo(mapRef.current);

//     // Initialize polyline for trail
//     polylineRef.current = L.polyline([], {
//       color: 'red',
//       weight: 4,
//       opacity: 0.7,
//       smoothFactor: 1
//     }).addTo(mapRef.current);

//     // Socket connection
//     socketRef.current = io({
//       transports: ['websocket', 'polling']
//     });

//     socketRef.current.on('connect', () => {
//       setStatus('Connected - Watching Live Location');
//       socketRef.current.emit('join_share', { token });
//     });

//     socketRef.current.on('disconnect', () => {
//       setStatus('Disconnected');
//     });

//     // Listen for location updates
//     socketRef.current.on('location_update', (data) => {
//       const newLocation = {
//         lat: data.lat,
//         lng: data.lng,
//         heading: data.heading,
//         speed: data.speed,
//         accuracy: data.accuracy,
//         timestamp: new Date(data.timestamp)
//       };

//       setCurrentLocation(newLocation);
//       setIsActive(true);

//       // Update marker
//       updateMarker([data.lat, data.lng]);

//       // Update path
//       const newPath = [...path, [data.lat, data.lng]];
//       setPath(newPath);
//       polylineRef.current.setLatLngs(newPath);
//     });

//     // Listen for stop sharing
//     socketRef.current.on('sharing_stopped', () => {
//       setIsActive(false);
//       setStatus('Sharing has been stopped');
//     });

//     // Check initial session status
//     checkSessionStatus();

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//       }
//       if (mapRef.current) {
//         mapRef.current.remove();
//       }
//     };
//   }, [token]);

//   const checkSessionStatus = async () => {
//     try {
//       const response = await fetch(`/api/session/${token}`);
//       const data = await response.json();

//       if (data.active === false) {
//         setIsActive(false);
//         setStatus('Sharing has ended');
//       } else if (data.last_location) {
//         // Show last known location
//         const lastLoc = data.last_location;
//         updateMarker([lastLoc.lat, lastLoc.lng]);
//         setStatus('Connected - Waiting for live updates');
//       }
//     } catch (error) {
//       console.error('Session check error:', error);
//     }
//   };

//   const updateMarker = (latlng) => {
//     if (!markerRef.current) {
//       // Create new marker
//       markerRef.current = L.marker(latlng, {
//         icon: L.icon({
//           iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//           shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//           iconSize: [25, 41],
//           iconAnchor: [12, 41],
//           popupAnchor: [1, -34],
//           shadowSize: [41, 41]
//         })
//       }).addTo(mapRef.current);

//       markerRef.current.bindPopup('Live Location').openPopup();
//       mapRef.current.setView(latlng, 16);
//     } else {
//       // Smoothly animate marker movement
//       markerRef.current.setLatLng(latlng);

//       // Smooth pan to new location
//       mapRef.current.panTo(latlng, {
//         animate: true,
//         duration: 1.0
//       });
//     }
//   };

//   const clearTrail = () => {
//     setPath([]);
//     polylineRef.current.setLatLngs([]);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="max-w-6xl mx-auto px-4 py-4">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <div>
//               <h1 className="text-xl font-bold text-gray-900">Live Location Viewer</h1>
//               <div className="flex items-center mt-1">
//                 <div className={`w-3 h-3 rounded-full mr-2 ${
//                   isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
//                 }`}></div>
//                 <span className="text-sm text-gray-600">{status}</span>
//               </div>
//               <p className="text-sm text-gray-500 mt-1">Tracking Token: {token}</p>
//             </div>

//             <div className="flex gap-2">
//               <button
//                 onClick={clearTrail}
//                 className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
//               >
//                 Clear Trail
//               </button>
//             </div>
//           </div>

//           {/* Location Info */}
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
//                 <div className="text-gray-600">Last Update</div>
//                 <div className="font-mono">{currentLocation.timestamp.toLocaleTimeString()}</div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Map */}
//       <div id="viewer-map" style={{ height: 'calc(100vh - 180px)' }} className="w-full"></div>

//       {/* Inactive Overlay */}
//       {!isActive && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg text-center max-w-sm">
//             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-semibold mb-2">Sharing Ended</h3>
//             <p className="text-gray-600 mb-4">The location sharing session has been stopped by the sharer.</p>
//             <button
//               onClick={() => window.close()}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Close Window
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




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
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    // Initialize map
    mapRef.current = L.map('viewer-map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapRef.current);

    // Initialize polyline for trail
    polylineRef.current = L.polyline([], {
      color: '#3B82F6',
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
      setConnectionStatus('connected');
      socketRef.current.emit('join_share', { token });
    });

    socketRef.current.on('disconnect', () => {
      setStatus('Disconnected');
      setConnectionStatus('disconnected');
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
      setConnectionStatus('connected');

      updateMarker([data.lat, data.lng]);

      const newPath = [...path, [data.lat, data.lng]];
      setPath(newPath);
      polylineRef.current.setLatLngs(newPath);
    });

    // Listen for stop sharing
    socketRef.current.on('sharing_stopped', () => {
      setIsActive(false);
      setStatus('Sharing has been stopped by the user');
      setConnectionStatus('stopped');
    });

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
        setConnectionStatus('stopped');
      } else if (data.last_location) {
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

      markerRef.current.bindPopup('<div class="font-semibold text-sm">📍 Live Location</div>').openPopup();
      mapRef.current.setView(latlng, 16);
    } else {
      markerRef.current.setLatLng(latlng);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Live Location Viewer
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className={`flex items-center text-sm font-medium ${connectionStatus === 'connected' ? 'text-green-600' :
                      connectionStatus === 'stopped' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                        connectionStatus === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                    {status}
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Tracking: {token}</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={clearTrail}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 focus:ring-3 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear Trail</span>
              </button>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  LAST UPDATE
                </div>
                <div className="font-mono text-sm font-bold text-orange-900">{currentLocation.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Map */}
      <div style={{ height: '70vh', width: '100%' }}>
        <div id="viewer-map" style={{ height: '100%', width: '100%' }}></div>

        {/* Live Indicator */}
        {isActive && (
          <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 shadow-2xl backdrop-blur-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        )}
      </div>

      {/* Inactive Overlay */}
      {!isActive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-lg p-8 rounded-3xl text-center max-w-sm mx-4 shadow-2xl border border-white/20 transform animate-scale-in">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Sharing Ended</h3>
            <p className="text-gray-600 mb-6">The location sharing session has been stopped by the sharer.</p>
            <button
              onClick={() => window.close()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-3 focus:ring-blue-200 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}