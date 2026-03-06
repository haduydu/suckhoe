import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'health_tracker.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    height REAL,
    weight REAL
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    duration TEXT NOT NULL,
    calories INTEGER NOT NULL,
    status TEXT NOT NULL,
    iconName TEXT NOT NULL,
    colorClass TEXT NOT NULL,
    bgClass TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quick_logs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL
  );
`);

// Seed data if empty
const activitiesCount = db.prepare('SELECT COUNT(*) as count FROM activities').get() as { count: number };
// Removed initial activities seeding to ensure users start with empty history

// Always sync quick logs to ensure any image updates in code are reflected in the database
const insertQuickLog = db.prepare(`
  INSERT OR REPLACE INTO quick_logs (id, name, category, image)
  VALUES (@id, @name, @category, @image)
`);

const initialQuickLogs = [
  {
    id: '1',
    name: 'Tạ tay',
    category: 'Tập sức mạnh',
    image: 'https://thethaokimthanh.vn/Uploads/images/top-3-mau-ta-tay-nhua-pho-bien-1.jpg'
  },
  {
    id: '2',
    name: 'Hít đất',
    category: 'Tập thể lực',
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'Gập bụng',
    category: 'Tập cơ bụng',
    image: 'https://bizweb.dktcdn.net/100/011/344/files/6-bai-tap-giam-mo-bung-duoi-cho-nam-1.jpg?v=1643255287280'
  },
  {
    id: '4',
    name: 'Nhảy đá chân',
    category: 'Tim mạch',
    image: 'https://goodfit.vn/wp-content/uploads/2020/11/Cac-bai-tap-gym-tang-chieu-cao-cho-nam-5.gif'
  }
];

for (const log of initialQuickLogs) {
  insertQuickLog.run(log);
}

export default db;
