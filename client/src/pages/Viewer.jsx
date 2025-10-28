import React, {useEffect, useRef, useState} from 'react'
import { useParams } from 'react-router-dom'
import io from 'socket.io-client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function Viewer(){
  const { token } = useParams()
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const polyRef = useRef(null)
  const trailRef = useRef([])
  const socketRef = useRef(null)
  const [status, setStatus] = useState('Connecting...')
  const [sharingActive, setSharingActive] = useState(true)

  useEffect(()=>{
    mapRef.current = L.map('map-view', { center: [20,0], zoom: 2 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current);

    socketRef.current = io();
    socketRef.current.emit('join', { room: 'share:' + token });
    socketRef.current.on('connect', ()=> setStatus('Connected'));
    socketRef.current.on('disconnect', ()=> setStatus('Disconnected'));

    socketRef.current.on('location:update', (data) => {
      // smooth transition: if marker exists, animate
      const latlng = [data.lat, data.lng];
      if(!markerRef.current){
        markerRef.current = L.marker(latlng).addTo(mapRef.current);
        mapRef.current.setView(latlng, 15);
        polyRef.current = L.polyline([], { weight:3 }).addTo(mapRef.current);
      } else {
        markerRef.current.setLatLng(latlng);
        mapRef.current.panTo(latlng);
      }
      trailRef.current.push(latlng);
      if(polyRef.current) polyRef.current.setLatLngs(trailRef.current);
    });

    socketRef.current.on('share:stopped', ()=> {
      setSharingActive(false);
      setStatus('Sharing stopped');
    });

    // check session
    fetch('/api/session/' + token).then(r=>r.json()).then(d=>{
      if(d && d.active===false){ setSharingActive(false); setStatus('Sharing stopped'); }
    }).catch(()=>{});

    return ()=> {
      if (socketRef.current) socketRef.current.disconnect();
      mapRef.current && mapRef.current.remove();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 bg-white shadow">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold">Viewing live: {token}</h2>
          <div className="mt-2">Status: {status} {sharingActive ? '' : '(inactive)'}</div>
        </div>
      </div>
      <div id="map-view" style={{height: '75vh'}} className="mt-3"></div>
      {!sharingActive && <div className="p-4 text-center text-red-600">Sharing stopped.</div>}
    </div>
  )
}
