require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let sequelize;
if (DB_TYPE === 'mysql' && process.env.MYSQL_HOST) {
  sequelize = new Sequelize(process.env.MYSQL_DATABASE || 'tracker', process.env.MYSQL_USER || 'root', process.env.MYSQL_PASSWORD || '', {
    host: process.env.MYSQL_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  });
  console.log('Using MySQL DB.');
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'data', 'tracker.sqlite'),
    logging: false
  });
  console.log('Using SQLite fallback DB.');
}

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Models
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  pin: DataTypes.STRING
}, { timestamps: true, createdAt: 'created_at', updatedAt: false });

const Share = sequelize.define('Share', {
  user_id: DataTypes.INTEGER,
  token: { type: DataTypes.STRING, unique: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  expires_at: DataTypes.DATE
}, { timestamps: true, createdAt: 'created_at', updatedAt: false });

const Location = sequelize.define('Location', {
  share_token: DataTypes.STRING,
  lat: DataTypes.FLOAT,
  lng: DataTypes.FLOAT,
  heading: DataTypes.FLOAT,
  speed: DataTypes.FLOAT,
  recorded_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, { timestamps: false });

async function initDb(){
  await sequelize.sync();
  // seed demo user if not exists
  const [user, created] = await User.findOrCreate({ where: { email: 'demo@example.com' }, defaults: { pin: '1234' } });
  if (created) console.log('Created demo user: demo@example.com / pin 1234');
}
initDb().catch(e=>console.error(e));

// Simple in-memory PIN store for demo (expires quickly)
const pinStore = {};

// Auth endpoints (demo)
app.post('/api/auth/request-pin', async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ error: 'email required' });
  const pin = Math.floor(1000 + Math.random()*9000).toString();
  pinStore[email] = { pin, created: Date.now() };
  // store or update user
  let user = await User.findOne({ where: { email }});
  if (!user) user = await User.create({ email, pin });
  else { user.pin = pin; await user.save(); }
  console.log('PIN for', email, pin);
  // In production send via SMS/Email. Here we return it for demo.
  res.json({ email, pin, message: 'Demo PIN generated (in real app this would be sent by email/SMS).' });
});

app.post('/api/auth/verify-pin', async (req, res) => {
  const { email, pin } = req.body;
  if (!email || !pin) return res.status(400).json({ error: 'email & pin required' });
  const user = await User.findOne({ where: { email }});
  if (!user || user.pin !== pin) return res.status(401).json({ error: 'Invalid pin' });
  // simple session token (not JWT) - demo
  const sessionToken = uuidv4();
  // return email and token
  res.json({ email: user.email, token: sessionToken });
});

// Start sharing
app.post('/api/share', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email }});
  if (!user) return res.status(400).json({ error: 'Invalid user' });
  const token = uuidv4();
  const share = await Share.create({ user_id: user.id, token, active: true });
  res.json({ url: `/track/${token}`, token });
});

// Stop sharing
app.post('/api/stop', async (req, res) => {
  const { token } = req.body;
  const share = await Share.findOne({ where: { token }});
  if (!share) return res.status(404).json({ error: 'Share not found' });
  share.active = false;
  await share.save();
  // notify room
  io.to(`share:${token}`).emit('share:stopped', { token });
  res.json({ ok: true });
});

app.get('/api/session/:token', async (req, res) => {
  const token = req.params.token;
  const share = await Share.findOne({ where: { token }});
  if (!share) return res.status(404).json({ error: 'Not found' });
  res.json({ token: share.token, active: share.active });
});

// serve client
app.get(['/','/track/:token','/app','/dashboard','/share/:token'], (req,res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Socket.IO real-time
const rateLimitMs = 800; // min interval per socket
const lastEmit = {};

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('join', ({ room }) => {
    socket.join(room);
    console.log('joined', room);
  });
  socket.on('leave', ({ room }) => {
    socket.leave(room);
  });
  socket.on('location:update', async (data) => {
    // data {token, lat, lng, heading, speed, timestamp}
    const now = Date.now();
    const last = lastEmit[socket.id] || 0;
    if (now - last < rateLimitMs) return; // simple rate limit
    lastEmit[socket.id] = now;
    // persist minimal location
    try {
      await Location.create({
        share_token: data.token,
        lat: data.lat,
        lng: data.lng,
        heading: data.heading || 0,
        speed: data.speed || 0,
        recorded_at: data.timestamp ? new Date(data.timestamp) : new Date()
      });
    } catch(e){
      console.error('Location save err', e.message);
    }
    // broadcast to room
    io.to(`share:${data.token}`).emit('location:update', data);
  });
  socket.on('disconnect', ()=>{/* cleanup */});
});

server.listen(PORT, () => {
  console.log('Server listening on', PORT);
  console.log('DB type:', DB_TYPE);
});
