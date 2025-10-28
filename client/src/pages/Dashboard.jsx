import React from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Dashboard(){
  const nav = useNavigate()
  const session = JSON.parse(localStorage.getItem('session')||'null')
  if(!session) { nav('/'); return null; }

  async function startShare(){
    const r = await axios.post('/api/share', { email: session.email });
    // go to share page
    nav('/share/' + r.data.token);
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold">Welcome, {session.email}</h2>
        <p className="mt-3">Start a live share session to generate a link you can send to viewers.</p>
        <div className="mt-4">
          <button onClick={startShare} className="px-4 py-2 bg-indigo-600 text-white rounded">Start Sharing</button>
        </div>
      </div>
    </div>
  )
}
