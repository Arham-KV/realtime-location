require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');

// 🔧 Environment setup
const PORT = process.env.PORT || 3000;
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let sequelize;

// ✅ Database setup (simplified)
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
  // ✅ SQLite for local
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
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Ensure data directory exists
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// 🧠 Models (Fixed)
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
    defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
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
    
    // Create demo user
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

// Temporary PIN store
const pinStore = {};

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

// Start sharing
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

// Stop sharing
app.post('/api/stop', async (req, res) => {
  try {
    const { token } = req.body;
    const share = await Share.findOne({ where: { token } });
    if (!share) return res.status(404).json({ error: 'Share not found' });

    share.active = false;
    await share.save();

    // Notify all viewers
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

    // Get last location
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

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// 🛰️ Socket.IO Real-time (FIXED)
const rateLimitMs = 1000; // 1 second rate limit
const lastEmit = {};

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  // Join share room
  socket.on('join_share', (data) => {
    const { token } = data;
    socket.join(`share:${token}`);
    console.log(`👥 User ${socket.id} joined share:${token}`);
  });

  // Handle location updates
  socket.on('location_update', async (data) => {
    try {
      const now = Date.now();
      const last = lastEmit[socket.id] || 0;
      
      // Rate limiting
      if (now - last < rateLimitMs) return;
      lastEmit[socket.id] = now;

      const { token, lat, lng, heading, speed, accuracy } = data;
      
      // Save to database
      await Location.create({
        share_token: token,
        lat,
        lng,
        heading: heading || 0,
        speed: speed || 0,
        accuracy: accuracy || 10
      });

      // Broadcast to all viewers in the room
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

  // Stop sharing
  socket.on('stop_sharing', async (data) => {
    const { token } = data;
    io.to(`share:${token}`).emit('sharing_stopped');
    
    // Update database
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

// 🟢 Start Server
initDb().then(() => {
  server.listen(PORT, () => {
    console.log('🚀 Server running on port', PORT);
    console.log('🗄️ Database type:', DB_TYPE);
    console.log('📍 App URL: http://localhost:' + PORT);
  });
});