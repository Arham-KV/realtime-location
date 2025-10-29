// import React, {useState} from 'react'
// import axios from 'axios'
// import { useNavigate } from 'react-router-dom'

// export default function Login(){
//   const [email,setEmail] = useState('demo@example.com')
//   const [pin,setPin] = useState('')
//   const [info,setInfo] = useState('')
//   const nav = useNavigate()

//   async function requestPin(){
//     try {
//       const r = await axios.post('/api/auth/request-pin',{ email });
//       setInfo('PIN sent (demo): ' + r.data.pin);
//     } catch(e){ setInfo('Error'); }
//   }
//   async function verify(){
//     try {
//       const r = await axios.post('/api/auth/verify-pin',{ email, pin });
//       // store simple session
//       localStorage.setItem('session', JSON.stringify(r.data));
//       nav('/dashboard');
//     } catch(e){ setInfo('Invalid pin'); }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4">
//       <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
//         <h1 className="text-2xl font-semibold mb-4">Real-time Tracker — Demo Login</h1>
//         <label className="block mb-2">Email</label>
//         <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border rounded mb-3"/>
//         <div className="flex gap-2">
//           <button onClick={requestPin} className="px-4 py-2 bg-indigo-600 text-white rounded">Request PIN</button>
//           <input placeholder="Enter PIN" value={pin} onChange={e=>setPin(e.target.value)} className="p-2 border rounded flex-1"/>
//           <button onClick={verify} className="px-4 py-2 bg-green-600 text-white rounded">Login</button>
//         </div>
//         <p className="mt-3 text-sm text-slate-600">{info}</p>
//       </div>
//     </div>
//   )
// }




import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('demo@example.com');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const requestPIN = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/request-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep('pin');
        setMessage(`Demo PIN: ${data.pin}`);
      } else {
        setMessage('Error requesting PIN');
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  const verifyPIN = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('session', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        setMessage('Invalid PIN');
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">LiveTrack</h1>
            <p className="text-blue-100 text-sm opacity-90">Real-time Location Sharing</p>
          </div>
        </div>

        <div className="p-8">
          {step === 'email' ? (
            <form onSubmit={requestPIN} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📧 Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-3 focus:ring-blue-200 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Sending PIN...
                  </div>
                ) : (
                  '🔐 Get Demo PIN'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyPIN} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🔒 Enter 4-Digit PIN
                </label>
                <input
                  type="text"
                  maxLength="4"
                  pattern="[0-9]{4}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-mono tracking-widest transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="• • • •"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 focus:ring-3 focus:ring-green-200 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Verifying...
                  </div>
                ) : (
                  '🚀 Verify & Login'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Use different email
              </button>
            </form>
          )}

          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center text-sm font-medium backdrop-blur-sm ${
              message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-8 text-center">
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="font-semibold mb-1">🎯 Demo Credentials</p>
              <p>Email: <span className="font-mono">demo@example.com</span></p>
              <p>PIN: Check console after requesting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}