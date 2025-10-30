// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const path = require('path');
// const { Sequelize, DataTypes } = require('sequelize');
// const { v4: uuidv4 } = require('uuid');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const fs = require('fs');

// // 🔧 Environment setup
// const PORT = process.env.PORT || 3000;
// const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// // ✅ Railway-compatible paths
// const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
// const clientIndexPath = path.join(clientDistPath, 'index.html');

// console.log('📁 Client path:', clientDistPath);
// console.log('📁 Current directory:', __dirname);

// let sequelize;

// // Database setup
// if (DB_TYPE === 'mysql' && process.env.MYSQL_HOST) {
//   sequelize = new Sequelize(
//     process.env.MYSQL_DATABASE || 'tracker',
//     process.env.MYSQL_USER || 'root',
//     process.env.MYSQL_PASSWORD || '',
//     {
//       host: process.env.MYSQL_HOST || 'localhost',
//       dialect: 'mysql',
//       logging: false,
//     }
//   );
//   console.log('✅ Using MySQL DB');
// } else {
//   // Create data directory if it doesn't exist
//   const dataDir = path.join(__dirname, 'data');
//   if (!fs.existsSync(dataDir)) {
//     fs.mkdirSync(dataDir, { recursive: true });
//   }
  
//   sequelize = new Sequelize({
//     dialect: 'sqlite',
//     storage: path.join(__dirname, 'data', 'tracker.sqlite'),
//     logging: false,
//   });
//   console.log('🧩 Using SQLite DB');
// }

// const app = express();
// const server = http.createServer(app);
// const io = require('socket.io')(server, { 
//   cors: { 
//     origin: "*",
//     methods: ["GET", "POST"]
//   } 
// });

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // ✅ Serve static files if they exist
// if (fs.existsSync(clientIndexPath)) {
//   console.log('✅ Serving built client files');
//   app.use(express.static(clientDistPath));
// } else {
//   console.log('⚠️ Client not built - will serve basic interface');
// }

// // 🧠 Models
// const User = sequelize.define('User', {
//   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//   email: { type: DataTypes.STRING, unique: true, allowNull: false },
//   pin: { type: DataTypes.STRING, allowNull: false }
// }, { 
//   timestamps: true, 
//   createdAt: 'created_at', 
//   updatedAt: false 
// });

// const Share = sequelize.define('Share', {
//   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//   user_id: { type: DataTypes.INTEGER, allowNull: false },
//   token: { type: DataTypes.STRING, unique: true, allowNull: false },
//   active: { type: DataTypes.BOOLEAN, defaultValue: true },
//   expires_at: { 
//     type: DataTypes.DATE, 
//     defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
//   }
// }, { 
//   timestamps: true, 
//   createdAt: 'created_at', 
//   updatedAt: false 
// });

// const Location = sequelize.define('Location', {
//   id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//   share_token: { type: DataTypes.STRING, allowNull: false },
//   lat: { type: DataTypes.FLOAT, allowNull: false },
//   lng: { type: DataTypes.FLOAT, allowNull: false },
//   heading: { type: DataTypes.FLOAT, defaultValue: 0 },
//   speed: { type: DataTypes.FLOAT, defaultValue: 0 },
//   accuracy: { type: DataTypes.FLOAT, defaultValue: 10 }
// }, { 
//   timestamps: true, 
//   createdAt: 'recorded_at', 
//   updatedAt: false 
// });

// // 🔹 Initialize Database
// async function initDb() {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ Database connected');
    
//     await sequelize.sync({ force: false });
//     console.log('✅ Database synced');
    
//     const [user, created] = await User.findOrCreate({
//       where: { email: 'demo@example.com' },
//       defaults: { pin: '1234' },
//     });
    
//     if (created) {
//       console.log('👤 Demo user created: demo@example.com / PIN: 1234');
//     } else {
//       console.log('👤 Demo user exists: demo@example.com / PIN: 1234');
//     }
//   } catch (error) {
//     console.error('❌ Database error:', error);
//   }
// }

// // 🧾 API Routes
// app.post('/api/auth/request-pin', async (req, res) => {
//   try {
//     const email = req.body.email;
//     if (!email) return res.status(400).json({ error: 'Email required' });

//     const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
//     let user = await User.findOne({ where: { email } });
//     if (!user) {
//       user = await User.create({ email, pin });
//     } else {
//       user.pin = pin;
//       await user.save();
//     }

//     console.log('🔐 PIN for', email, ':', pin);
//     res.json({ 
//       success: true, 
//       email, 
//       pin, 
//       message: 'Demo PIN generated (check console)' 
//     });
//   } catch (error) {
//     console.error('PIN request error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.post('/api/auth/verify-pin', async (req, res) => {
//   try {
//     const { email, pin } = req.body;
//     if (!email || !pin) {
//       return res.status(400).json({ error: 'Email and PIN required' });
//     }

//     const user = await User.findOne({ where: { email } });
//     if (!user || user.pin !== pin) {
//       return res.status(401).json({ error: 'Invalid PIN' });
//     }

//     const sessionToken = uuidv4();
//     res.json({ 
//       success: true, 
//       email: user.email, 
//       token: sessionToken,
//       user_id: user.id 
//     });
//   } catch (error) {
//     console.error('PIN verification error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.post('/api/share', async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ where: { email } });
//     if (!user) return res.status(400).json({ error: 'User not found' });

//     const token = uuidv4().replace(/-/g, '').substring(0, 12);
//     const share = await Share.create({ 
//       user_id: user.id, 
//       token, 
//       active: true 
//     });

//     res.json({ 
//       success: true,
//       url: `/track/${token}`, 
//       token,
//       share_id: share.id 
//     });
//   } catch (error) {
//     console.error('Share creation error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.post('/api/stop', async (req, res) => {
//   try {
//     const { token } = req.body;
//     const share = await Share.findOne({ where: { token } });
//     if (!share) return res.status(404).json({ error: 'Share not found' });

//     share.active = false;
//     await share.save();

//     io.to(`share:${token}`).emit('sharing_stopped');
//     res.json({ success: true, message: 'Sharing stopped' });
//   } catch (error) {
//     console.error('Stop sharing error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.get('/api/session/:token', async (req, res) => {
//   try {
//     const token = req.params.token;
//     const share = await Share.findOne({ where: { token } });
//     if (!share) return res.status(404).json({ error: 'Share not found' });

//     const lastLocation = await Location.findOne({
//       where: { share_token: token },
//       order: [['recorded_at', 'DESC']]
//     });

//     res.json({ 
//       token: share.token, 
//       active: share.active,
//       last_location: lastLocation 
//     });
//   } catch (error) {
//     console.error('Session check error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // 🛰️ Socket.IO Real-time
// const rateLimitMs = 1000;
// const lastEmit = {};

// io.on('connection', (socket) => {
//   console.log('⚡ User connected:', socket.id);

//   socket.on('join_share', (data) => {
//     const { token } = data;
//     socket.join(`share:${token}`);
//     console.log(`👥 User ${socket.id} joined share:${token}`);
//   });

//   socket.on('location_update', async (data) => {
//     try {
//       const now = Date.now();
//       const last = lastEmit[socket.id] || 0;
      
//       if (now - last < rateLimitMs) return;
//       lastEmit[socket.id] = now;

//       const { token, lat, lng, heading, speed, accuracy } = data;
      
//       await Location.create({
//         share_token: token,
//         lat,
//         lng,
//         heading: heading || 0,
//         speed: speed || 0,
//         accuracy: accuracy || 10
//       });

//       io.to(`share:${token}`).emit('location_update', {
//         lat,
//         lng,
//         heading: heading || 0,
//         speed: speed || 0,
//         accuracy: accuracy || 10,
//         timestamp: new Date()
//       });

//       console.log(`📍 Location update for ${token}: ${lat}, ${lng}`);
//     } catch (error) {
//       console.error('❌ Location update error:', error);
//     }
//   });

//   socket.on('stop_sharing', async (data) => {
//     const { token } = data;
//     io.to(`share:${token}`).emit('sharing_stopped');
    
//     await Share.update(
//       { active: false },
//       { where: { token } }
//     );
    
//     console.log(`🛑 Sharing stopped for ${token}`);
//   });

//   socket.on('disconnect', () => {
//     console.log('🔌 User disconnected:', socket.id);
//     delete lastEmit[socket.id];
//   });
// });

// // ✅ Serve appropriate frontend
// app.get('*', (req, res) => {
//   if (fs.existsSync(clientIndexPath)) {
//     // Serve built React app
//     res.sendFile(clientIndexPath);
//   } else {
//     // Serve basic HTML interface
//     const html = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>LiveTrack - Real-time Location Sharing</title>
//       <style>
//         * { margin: 0; padding: 0; box-sizing: border-box; }
//         body { 
//           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 1rem;
//         }
//         .container {
//           background: white;
//           padding: 3rem;
//           border-radius: 1rem;
//           box-shadow: 0 20px 40px rgba(0,0,0,0.1);
//           text-align: center;
//           max-width: 500px;
//           width: 100%;
//         }
//         .logo {
//           width: 80px;
//           height: 80px;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           margin: 0 auto 1.5rem;
//         }
//         .logo svg {
//           width: 40px;
//           height: 40px;
//           color: white;
//         }
//         h1 {
//           color: #1a202c;
//           margin-bottom: 1rem;
//           font-size: 2rem;
//         }
//         p {
//           color: #4a5568;
//           margin-bottom: 1.5rem;
//           line-height: 1.6;
//         }
//         .btn {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           color: white;
//           padding: 12px 24px;
//           border: none;
//           border-radius: 8px;
//           font-size: 1rem;
//           cursor: pointer;
//           text-decoration: none;
//           display: inline-block;
//           margin: 0.5rem;
//         }
//         .status {
//           background: #edf2f7;
//           padding: 1rem;
//           border-radius: 8px;
//           margin: 1rem 0;
//           font-family: monospace;
//           text-align: left;
//           font-size: 0.9rem;
//         }
//         .demo-info {
//           background: #e6fffa;
//           border: 1px solid #81e6d9;
//           padding: 1rem;
//           border-radius: 8px;
//           margin: 1rem 0;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="logo">
//           <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
//             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
//           </svg>
//         </div>
//         <h1>LiveTrack</h1>
//         <p>Real-time Location Sharing Application</p>
        
//         <div class="demo-info">
//           <strong>🚀 Server Running Successfully!</strong><br>
//           <strong>Email:</strong> demo@example.com<br>
//           <strong>PIN:</strong> 1234
//         </div>
        
//         <div class="status">
//           <strong>Status:</strong> Backend API Active<br>
//           <strong>Port:</strong> ${PORT}<br>
//           <strong>Database:</strong> ${DB_TYPE}<br>
//           <strong>Client:</strong> Building...
//         </div>
        
//         <div>
//           <button class="btn" onclick="testAPI()">Test API Connection</button>
//           <button class="btn" onclick="location.reload()">Refresh Page</button>
//         </div>
        
//         <p style="margin-top: 2rem; font-size: 0.9rem; color: #718096;">
//           Backend server is running. React client is building...<br>
//           Refresh in a few moments.
//         </p>
//       </div>

//       <script>
//         async function testAPI() {
//           try {
//             const response = await fetch('/api/auth/request-pin', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({ email: 'test@example.com' })
//             });
//             const data = await response.json();
//             alert('API Connected! PIN: ' + data.pin);
//           } catch (error) {
//             alert('API Error: ' + error.message);
//           }
//         }
        
//         // Auto-refresh every 10 seconds
//         setTimeout(() => {
//           location.reload();
//         }, 10000);
//       </script>
//     </body>
//     </html>
//     `;
    
//     res.send(html);
//   }
// });

// // 🟢 Start Server
// initDb().then(() => {
//   server.listen(PORT, () => {
//     console.log('🚀 Server running on port', PORT);
//     console.log('🗄️ Database type:', DB_TYPE);
//     console.log('📍 App URL: http://localhost:' + PORT);
//   });
// });




require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

// 🔧 Environment setup
const PORT = process.env.PORT || 3000;
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// ✅ Railway-compatible paths
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

console.log('📁 Client path:', clientDistPath);
console.log('📁 Current directory:', __dirname);

let sequelize;

// Database setup
if (DB_TYPE === 'mysql' && process.env.MYSQL_HOST) {
  sequelize = new Sequelize(
    process.env.MYSQL_DATABASE || 'tracker',
    process.env.MYSQL_USER || 'root',
    process.env.MYSQL_PASSWORD || '',
    {
      host: process.env.MYSQL_HOST || 'localhost',
      dialect: 'mysql',
      logging: false,
    }
  );
  console.log('✅ Using MySQL DB');
} else {
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'data', 'tracker.sqlite'),
    logging: false,
  });
  console.log('🧩 Using SQLite DB');
}

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Serve static files if they exist
if (fs.existsSync(clientIndexPath)) {
  console.log('✅ Serving built client files');
  app.use(express.static(clientDistPath));
} else {
  console.log('⚠️ Client not built - will serve basic interface');
}

// 🧠 Models
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  pin: { type: DataTypes.STRING, allowNull: false }
}, { 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: false 
});

const Share = sequelize.define('Share', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  token: { type: DataTypes.STRING, unique: true, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  expires_at: { 
    type: DataTypes.DATE, 
    defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
}, { 
  timestamps: true, 
  createdAt: 'created_at', 
  updatedAt: false 
});

const Location = sequelize.define('Location', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  share_token: { type: DataTypes.STRING, allowNull: false },
  lat: { type: DataTypes.FLOAT, allowNull: false },
  lng: { type: DataTypes.FLOAT, allowNull: false },
  heading: { type: DataTypes.FLOAT, defaultValue: 0 },
  speed: { type: DataTypes.FLOAT, defaultValue: 0 },
  accuracy: { type: DataTypes.FLOAT, defaultValue: 10 }
}, { 
  timestamps: true, 
  createdAt: 'recorded_at', 
  updatedAt: false 
});

// 🔹 Initialize Database
async function initDb() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await sequelize.sync({ force: false });
    console.log('✅ Database synced');
    
    const [user, created] = await User.findOrCreate({
      where: { email: 'demo@example.com' },
      defaults: { pin: '1234' },
    });
    
    if (created) {
      console.log('👤 Demo user created: demo@example.com / PIN: 1234');
    } else {
      console.log('👤 Demo user exists: demo@example.com / PIN: 1234');
    }
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

// 🧮 Distance Calculation (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

// 🧮 Journey Analytics Calculation Function
function calculateJourneyAnalytics(locations) {
  if (locations.length < 2) {
    return {
      totalDistance: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      totalTime: 0,
      totalLocations: 0,
      stops: [],
      journeyPath: []
    };
  }

  let totalDistance = 0;
  let totalSpeed = 0;
  let maxSpeed = 0;
  const stops = [];
  const journeyPath = [];
  
  // Check for stops (when speed < 2 km/h for more than 1 minute)
  let stopStartTime = null;
  let currentStop = null;

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    const speedKmh = (location.speed || 0) * 3.6;
    
    // Add to journey path
    journeyPath.push({
      lat: location.lat,
      lng: location.lng,
      timestamp: location.recorded_at,
      speed: speedKmh
    });

    // Calculate distance between points
    if (i > 0) {
      const prevLocation = locations[i - 1];
      const distance = calculateDistance(
        prevLocation.lat, prevLocation.lng,
        location.lat, location.lng
      );
      totalDistance += distance;
    }

    // Track speed statistics
    totalSpeed += speedKmh;
    if (speedKmh > maxSpeed) {
      maxSpeed = speedKmh;
    }

    // Detect stops (speed < 2 km/h)
    if (speedKmh < 2) {
      if (!stopStartTime) {
        stopStartTime = new Date(location.recorded_at);
        currentStop = {
          lat: location.lat,
          lng: location.lng,
          startTime: stopStartTime,
          duration: 0
        };
      }
    } else {
      if (stopStartTime) {
        const stopEndTime = new Date(location.recorded_at);
        const duration = (stopEndTime - stopStartTime) / 1000; // seconds
        currentStop.duration = duration;
        currentStop.endTime = stopEndTime;
        
        // Only count stops longer than 1 minute
        if (duration > 60) {
          stops.push({ ...currentStop });
        }
        
        stopStartTime = null;
        currentStop = null;
      }
    }
  }

  // Handle last stop if still ongoing
  if (stopStartTime && currentStop) {
    const duration = (new Date() - stopStartTime) / 1000;
    currentStop.duration = duration;
    if (duration > 60) {
      stops.push({ ...currentStop });
    }
  }

  const totalTime = locations.length > 1 
    ? (new Date(locations[locations.length - 1].recorded_at) - new Date(locations[0].recorded_at)) / 1000 
    : 0;
  
  const averageSpeed = totalTime > 0 ? (totalDistance / totalTime) * 3.6 : 0;

  return {
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    averageSpeed: parseFloat(averageSpeed.toFixed(1)),
    maxSpeed: parseFloat(maxSpeed.toFixed(1)),
    totalTime: parseFloat((totalTime / 60).toFixed(1)), // minutes
    totalLocations: locations.length,
    stops: stops.map(stop => ({
      location: { lat: stop.lat, lng: stop.lng },
      duration: parseFloat((stop.duration / 60).toFixed(1)), // minutes
      startTime: stop.startTime,
      endTime: stop.endTime
    })),
    journeyPath
  };
}

// 🧾 API Routes
app.post('/api/auth/request-pin', async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({ email, pin });
    } else {
      user.pin = pin;
      await user.save();
    }

    console.log('🔐 PIN for', email, ':', pin);
    res.json({ 
      success: true, 
      email, 
      pin, 
      message: 'Demo PIN generated (check console)' 
    });
  } catch (error) {
    console.error('PIN request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/verify-pin', async (req, res) => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) {
      return res.status(400).json({ error: 'Email and PIN required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || user.pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    const sessionToken = uuidv4();
    res.json({ 
      success: true, 
      email: user.email, 
      token: sessionToken,
      user_id: user.id 
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/share', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const token = uuidv4().replace(/-/g, '').substring(0, 12);
    const share = await Share.create({ 
      user_id: user.id, 
      token, 
      active: true 
    });

    res.json({ 
      success: true,
      url: `/track/${token}`, 
      token,
      share_id: share.id 
    });
  } catch (error) {
    console.error('Share creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/stop', async (req, res) => {
  try {
    const { token } = req.body;
    const share = await Share.findOne({ where: { token } });
    if (!share) return res.status(404).json({ error: 'Share not found' });

    share.active = false;
    await share.save();

    io.to(`share:${token}`).emit('sharing_stopped');
    res.json({ success: true, message: 'Sharing stopped' });
  } catch (error) {
    console.error('Stop sharing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/session/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const share = await Share.findOne({ where: { token } });
    if (!share) return res.status(404).json({ error: 'Share not found' });

    const lastLocation = await Location.findOne({
      where: { share_token: token },
      order: [['recorded_at', 'DESC']]
    });

    res.json({ 
      token: share.token, 
      active: share.active,
      last_location: lastLocation 
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🧮 Journey Analytics API
app.get('/api/analytics/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Get all locations for this share session
    const locations = await Location.findAll({
      where: { share_token: token },
      order: [['recorded_at', 'ASC']]
    });

    if (locations.length === 0) {
      return res.json({
        totalDistance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        totalTime: 0,
        totalLocations: 0,
        stops: [],
        journeyPath: []
      });
    }

    // Calculate analytics
    const analytics = calculateJourneyAnalytics(locations);
    
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Analytics calculation failed' });
  }
});

// 🛰️ Socket.IO Real-time
const rateLimitMs = 1000;
const lastEmit = {};

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join_share', (data) => {
    const { token } = data;
    socket.join(`share:${token}`);
    console.log(`👥 User ${socket.id} joined share:${token}`);
  });

  socket.on('location_update', async (data) => {
    try {
      const now = Date.now();
      const last = lastEmit[socket.id] || 0;
      
      if (now - last < rateLimitMs) return;
      lastEmit[socket.id] = now;

      const { token, lat, lng, heading, speed, accuracy } = data;
      
      await Location.create({
        share_token: token,
        lat,
        lng,
        heading: heading || 0,
        speed: speed || 0,
        accuracy: accuracy || 10
      });

      io.to(`share:${token}`).emit('location_update', {
        lat,
        lng,
        heading: heading || 0,
        speed: speed || 0,
        accuracy: accuracy || 10,
        timestamp: new Date()
      });

      console.log(`📍 Location update for ${token}: ${lat}, ${lng}`);
    } catch (error) {
      console.error('❌ Location update error:', error);
    }
  });

  socket.on('stop_sharing', async (data) => {
    const { token } = data;
    io.to(`share:${token}`).emit('sharing_stopped');
    
    await Share.update(
      { active: false },
      { where: { token } }
    );
    
    console.log(`🛑 Sharing stopped for ${token}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    delete lastEmit[socket.id];
  });
});

// ✅ Serve appropriate frontend
app.get('*', (req, res) => {
  if (fs.existsSync(clientIndexPath)) {
    // Serve built React app
    res.sendFile(clientIndexPath);
  } else {
    // Serve basic HTML interface
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LiveTrack - Real-time Location Sharing</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .container {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .logo svg {
          width: 40px;
          height: 40px;
          color: white;
        }
        h1 {
          color: #1a202c;
          margin-bottom: 1rem;
          font-size: 2rem;
        }
        p {
          color: #4a5568;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin: 0.5rem;
        }
        .status {
          background: #edf2f7;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          font-family: monospace;
          text-align: left;
          font-size: 0.9rem;
        }
        .demo-info {
          background: #e6fffa;
          border: 1px solid #81e6d9;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h1>LiveTrack</h1>
        <p>Real-time Location Sharing Application</p>
        
        <div class="demo-info">
          <strong>🚀 Server Running Successfully!</strong><br>
          <strong>Email:</strong> demo@example.com<br>
          <strong>PIN:</strong> 1234
        </div>
        
        <div class="status">
          <strong>Status:</strong> Backend API Active<br>
          <strong>Port:</strong> ${PORT}<br>
          <strong>Database:</strong> ${DB_TYPE}<br>
          <strong>Client:</strong> Building...
        </div>
        
        <div>
          <button class="btn" onclick="testAPI()">Test API Connection</button>
          <button class="btn" onclick="location.reload()">Refresh Page</button>
        </div>
        
        <p style="margin-top: 2rem; font-size: 0.9rem; color: #718096;">
          Backend server is running. React client is building...<br>
          Refresh in a few moments.
        </p>
      </div>

      <script>
        async function testAPI() {
          try {
            const response = await fetch('/api/auth/request-pin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'test@example.com' })
            });
            const data = await response.json();
            alert('API Connected! PIN: ' + data.pin);
          } catch (error) {
            alert('API Error: ' + error.message);
          }
        }
        
        // Auto-refresh every 10 seconds
        setTimeout(() => {
          location.reload();
        }, 10000);
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  }
});

// 🟢 Start Server
initDb().then(() => {
  server.listen(PORT, () => {
    console.log('🚀 Server running on port', PORT);
    console.log('🗄️ Database type:', DB_TYPE);
    console.log('📍 App URL: http://localhost:' + PORT);
    console.log('📊 Journey Analytics API: /api/analytics/:token');
  });
});