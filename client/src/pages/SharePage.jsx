import React, {useEffect, useRef, useState} from 'react'
import { useParams } from 'react-router-dom'
import io from 'socket.io-client'
import L from 'leaflet'

export default function SharePage(){
  const { token } = useParams()
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const socketRef = useRef(null)
  const watchIdRef = useRef(null)
  const [status, setStatus] = useState('Connecting...')
  const [sharing, setSharing] = useState(true)
  const trailRef = useRef([])
  const polyRef = useRef(null)

  useEffect(()=>{
    // init map
    mapRef.current = L.map('map', { center: [20,0], zoom: 2 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current);

    socketRef.current = io();
    socketRef.current.emit('join', { room: 'share:' + token });
    socketRef.current.on('connect', ()=> setStatus('Connected'));
    socketRef.current.on('disconnect', ()=> setStatus('Disconnected'));

    // start geolocation
    if (navigator.geolocation){
      watchIdRef.current = navigator.geolocation.watchPosition(pos=>{
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const payload = { token, lat, lng, heading: pos.coords.heading||0, speed: pos.coords.speed||0, timestamp: pos.timestamp };
        socketRef.current.emit('location:update', payload);
        // update local marker for sharer preview
        showMarker([lat,lng]);
      }, err=>{ console.error(err); setStatus('Geolocation error'); }, { enableHighAccuracy:true, maximumAge:1000, timeout:5000 });
    } else { setStatus('Geolocation not available'); }

    return ()=> {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    }
  }, [token]);

  function showMarker(latlng){
    if(!markerRef.current){
      markerRef.current = L.marker(latlng).addTo(mapRef.current);
      mapRef.current.setView(latlng, 15);
      polyRef.current = L.polyline([], { weight:3 }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(latlng);
      mapRef.current.panTo(latlng);
    }
    trailRef.current.push(latlng);
    polyRef.current.setLatLngs(trailRef.current);
  }

  async function stop(){
    await fetch('/api/stop', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token })});
    setSharing(false);
    setStatus('Sharing stopped');
  }

  const shareUrl = window.location.origin + '/track/' + token;

  return (
    <div className="min-h-screen">
      <div className="p-4 bg-white shadow">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold">Sharing live — token: {token}</h2>
          <p className="text-sm text-slate-600">Send this link to viewers:</p>
          <div className="flex gap-2 mt-2">
            <input readOnly value={shareUrl} className="flex-1 p-2 border rounded"/>
            <button onClick={()=>navigator.clipboard.writeText(shareUrl)} className="px-3 py-2 bg-slate-200 rounded">Copy</button>
            <button onClick={stop} disabled={!sharing} className="px-3 py-2 bg-red-600 text-white rounded">Stop</button>
          </div>
          <div className="mt-3 text-sm">Status: {status}</div>
        </div>
      </div>
      <div id="map" style={{height: '70vh'}} className="mt-3"></div>
    </div>
  )
}
