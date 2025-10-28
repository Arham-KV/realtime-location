import React, {useState} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email,setEmail] = useState('demo@example.com')
  const [pin,setPin] = useState('')
  const [info,setInfo] = useState('')
  const nav = useNavigate()

  async function requestPin(){
    try {
      const r = await axios.post('/api/auth/request-pin',{ email });
      setInfo('PIN sent (demo): ' + r.data.pin);
    } catch(e){ setInfo('Error'); }
  }
  async function verify(){
    try {
      const r = await axios.post('/api/auth/verify-pin',{ email, pin });
      // store simple session
      localStorage.setItem('session', JSON.stringify(r.data));
      nav('/dashboard');
    } catch(e){ setInfo('Invalid pin'); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">Real-time Tracker — Demo Login</h1>
        <label className="block mb-2">Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border rounded mb-3"/>
        <div className="flex gap-2">
          <button onClick={requestPin} className="px-4 py-2 bg-indigo-600 text-white rounded">Request PIN</button>
          <input placeholder="Enter PIN" value={pin} onChange={e=>setPin(e.target.value)} className="p-2 border rounded flex-1"/>
          <button onClick={verify} className="px-4 py-2 bg-green-600 text-white rounded">Login</button>
        </div>
        <p className="mt-3 text-sm text-slate-600">{info}</p>
      </div>
    </div>
  )
}
