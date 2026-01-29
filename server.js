import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// CORS configurat pentru producție și dezvoltare
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.RENDER_EXTERNAL_URL ? process.env.RENDER_EXTERNAL_URL : null,
].filter(Boolean);

// În producție, permite toate origin-urile Render (pentru flexibilitate)
// În development, folosește lista de origin-uri permise
app.use(cors({
  origin: function (origin, callback) {
    // Permite requests fără origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // În producție, permite toate origin-urile (pentru Render.com)
    if (process.env.NODE_ENV === 'production') {
      // Permite orice origin de la Render.com sau din lista noastră
      if (origin.includes('.onrender.com') || origin.includes('.render.com') || allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
    }
    
    // În development, folosește lista strictă
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Simulare baza de date (în producție folosești MongoDB/PostgreSQL)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$rOzJqKqYqYqYqYqYqYqYqOqYqYqYqYqYqYqYqYqYqYqYqYqYqYq' // parola: admin123
  }
];

// Hash parola default la start (admin123)
bcrypt.hash('admin123', 10).then(hash => {
  users[0].password = hash;
});

// Simulare dispozitive smart home
let devices = [
  { id: 1, name: 'Lumina Living', type: 'light', status: true, brightness: 80 },
  { id: 2, name: 'Termostat', type: 'thermostat', status: true, temperature: 22 },
  { id: 3, name: 'Camere Securitate', type: 'camera', status: true },
  { id: 4, name: 'Ușă Garaj', type: 'garage', status: false },
  { id: 5, name: 'Sistem Audio', type: 'audio', status: false, volume: 50 },
  { id: 6, name: 'Aer Condiționat', type: 'ac', status: true, temperature: 24 }
];

// RUTA: Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Utilizator sau parolă incorectă' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Utilizator sau parolă incorectă' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '24h'
  });

  res.json({ token, username: user.username });
});

// Middleware pentru verificare token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token lipsă' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalid' });
    }
    req.user = user;
    next();
  });
};

// RUTA: Obține toate dispozitivele
app.get('/api/devices', authenticateToken, (req, res) => {
  res.json(devices);
});

// RUTA: Actualizează un dispozitiv
app.put('/api/devices/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const deviceIndex = devices.findIndex(d => d.id === parseInt(id));
  if (deviceIndex === -1) {
    return res.status(404).json({ error: 'Dispozitiv negăsit' });
  }

  devices[deviceIndex] = { ...devices[deviceIndex], ...updates };
  res.json(devices[deviceIndex]);
});

// RUTA: Creează un dispozitiv nou
app.post('/api/devices', authenticateToken, (req, res) => {
  const newDevice = {
    id: devices.length + 1,
    ...req.body
  };
  devices.push(newDevice);
  res.json(newDevice);
});

// RUTA: Șterge un dispozitiv
app.delete('/api/devices/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  devices = devices.filter(d => d.id !== parseInt(id));
  res.json({ message: 'Dispozitiv șters' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server backend rulează pe portul ${PORT}`);
  console.log(`📝 Utilizator default: admin / Parolă: admin123`);
});
