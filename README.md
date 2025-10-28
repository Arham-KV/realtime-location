# Real-time Location Tracker

Quick start:

1. npm install
2. npm start
3. Open http://localhost:3000

Notes:
- Uses MySQL in production if configured. Falls back to SQLite automatically.
- Demo login: request PIN with an email, receive a PIN (stored in DB). This demo app will accept any PIN created by the /api/auth/request-pin route.
- The sharer can start a share session which generates a link: http://localhost:3000/track/<token>
- The viewer opens the link to see live movement on a Leaflet map.
- Privacy: This app is a demo for family/private tracking only.

Files of interest:
- server/ : backend (Express + Socket.IO + Sequelize)
- client/ : frontend (Vite + React + Tailwind CSS)

