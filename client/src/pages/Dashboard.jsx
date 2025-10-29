// import React from 'react'
// import { useNavigate } from 'react-router-dom'
// import axios from 'axios'

// export default function Dashboard(){
//   const nav = useNavigate()
//   const session = JSON.parse(localStorage.getItem('session')||'null')
//   if(!session) { nav('/'); return null; }

//   async function startShare(){
//     const r = await axios.post('/api/share', { email: session.email });
//     // go to share page
//     nav('/share/' + r.data.token);
//   }

//   return (
//     <div className="min-h-screen p-6">
//       <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
//         <h2 className="text-xl font-semibold">Welcome, {session.email}</h2>
//         <p className="mt-3">Start a live share session to generate a link you can send to viewers.</p>
//         <div className="mt-4">
//           <button onClick={startShare} className="px-4 py-2 bg-indigo-600 text-white rounded">Start Sharing</button>
//         </div>
//       </div>
//     </div>
//   )
// }






import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('session') || 'null');
  
  if (!session) { 
    navigate('/'); 
    return null; 
  }

  async function startShare() {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.email })
      });
      
      const data = await response.json();
      if (data.success) {
        navigate('/share/' + data.token);
      }
    } catch (error) {
      console.error('Start share error:', error);
      alert('Failed to start sharing');
    }
  }

  function logout() {
    localStorage.removeItem('session');
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LiveTrack
                </h1>
                <p className="text-sm text-gray-600">Welcome back, <span className="font-semibold">{session.email}</span></p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
            >
              👋 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Share Your Location in{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Real-Time
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create secure, shareable links and let others track your live location with smooth, real-time updates and premium experience.
          </p>
        </div>

        {/* Main Action Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-12 transform hover:-translate-y-1 transition-all duration-300">
          <div className="p-12 text-center">
            <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-8 mx-auto shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Start Live Location Sharing
            </h3>
            <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Generate a secure, unique link that you can share with friends, family, or colleagues to track your location in real-time with beautiful animations.
            </p>

            <div className="text-center">
              <button
                onClick={startShare}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-5 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                🚀 Start Sharing Live Location
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-lg border border-white/20 text-center transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="font-bold text-gray-900 mb-3 text-lg">Secure & Private</h4>
            <p className="text-gray-600 leading-relaxed">Encrypted links with automatic expiration for maximum privacy and security.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-lg border border-white/20 text-center transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-bold text-gray-900 mb-3 text-lg">Real-Time Updates</h4>
            <p className="text-gray-600 leading-relaxed">Live location tracking with smooth animations and instant updates.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-lg border border-white/20 text-center transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-bold text-gray-900 mb-3 text-lg">Easy to Use</h4>
            <p className="text-gray-600 leading-relaxed">Beautiful interface that works on all devices - no app install needed.</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-12">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">1</div>
              <h4 className="font-bold text-gray-900 mb-4 text-lg">Start Sharing</h4>
              <p className="text-gray-600 leading-relaxed">Click the button above to generate your unique sharing link instantly.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">2</div>
              <h4 className="font-bold text-gray-900 mb-4 text-lg">Share Link</h4>
              <p className="text-gray-600 leading-relaxed">Copy and send the secure link to anyone you want to track your location.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">3</div>
              <h4 className="font-bold text-gray-900 mb-4 text-lg">Live Tracking</h4>
              <p className="text-gray-600 leading-relaxed">They'll see your real-time movement on an interactive, beautiful map.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}