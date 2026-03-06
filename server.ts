import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Users
  app.get('/api/user', (req, res) => {
    const uid = req.query.uid as string;
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    res.json(user || null);
  });

  app.post('/api/user', (req, res) => {
    const { uid, name, height, weight } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }
    
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(uid) as any;
    
    if (existingUser) {
      db.prepare('UPDATE users SET name = ?, height = ?, weight = ? WHERE id = ?')
        .run(name, height, weight, uid);
    } else {
      db.prepare('INSERT INTO users (id, name, height, weight) VALUES (?, ?, ?, ?)')
        .run(uid, name, height, weight);
    }
    
    res.json({ success: true });
  });

  // Activities
  app.get('/api/activities', (req, res) => {
    const activities = db.prepare('SELECT * FROM activities').all();
    res.json(activities);
  });

  // Quick Logs
  app.get('/api/quick-logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM quick_logs').all();
    res.json(logs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
