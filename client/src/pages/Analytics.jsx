import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function Analytics() {
  const { token } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/${token}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating journey analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load analytics</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Journey Analytics</h1>
          <p className="text-gray-600">Tracking Token: {token}</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Distance */}
          <div className="bg-white rounded-lg p-6 shadow border border-blue-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{analytics.totalDistance} km</h3>
              <p className="text-gray-600 text-sm">Total Distance</p>
            </div>
          </div>

          {/* Average Speed */}
          <div className="bg-white rounded-lg p-6 shadow border border-green-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6.0001V3.0001M13 6.0001C13 6.0001 16 5.84999 18 8.0001C20 10.1502 20 13.0001 18 15.0001C16 17.0002 13 17.0001 13 17.0001M13 6.0001L11 6.0001M13 17.0001V21.0001M13 17.0001L11 17.0001" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{analytics.averageSpeed} km/h</h3>
              <p className="text-gray-600 text-sm">Average Speed</p>
            </div>
          </div>

          {/* Max Speed */}
          <div className="bg-white rounded-lg p-6 shadow border border-purple-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{analytics.maxSpeed} km/h</h3>
              <p className="text-gray-600 text-sm">Max Speed</p>
            </div>
          </div>

          {/* Total Time */}
          <div className="bg-white rounded-lg p-6 shadow border border-orange-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{analytics.totalTime} min</h3>
              <p className="text-gray-600 text-sm">Total Time</p>
            </div>
          </div>
        </div>

        {/* Stops Section */}
        <div className="bg-white rounded-lg p-6 shadow border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Stops & Breaks</h2>
          {analytics.stops.length > 0 ? (
            <div className="space-y-3">
              {analytics.stops.map((stop, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                      <span className="text-yellow-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Stop {index + 1}
                      </p>
                      <p className="text-xs text-gray-600">
                        Duration: {stop.duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      {new Date(stop.startTime).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Lat: {stop.location.lat.toFixed(4)}, Lng: {stop.location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600">No significant stops detected yet</p>
            </div>
          )}
        </div>

        {/* Journey Summary */}
        <div className="bg-white rounded-lg p-6 shadow border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Journey Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-xl font-bold text-blue-600">{analytics.totalLocations}</p>
              <p className="text-sm text-gray-600">Location Points</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded border border-green-200">
              <p className="text-xl font-bold text-green-600">{analytics.stops.length}</p>
              <p className="text-sm text-gray-600">Stops Detected</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded border border-purple-200">
              <p className="text-xl font-bold text-purple-600">
                {analytics.totalTime > 0 ? ((analytics.totalDistance / analytics.totalTime) * 60).toFixed(1) : 0}
              </p>
              <p className="text-sm text-gray-600">Avg Pace (km/h)</p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={fetchAnalytics}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}