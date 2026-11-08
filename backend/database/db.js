import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'restaurant.db');
const db = new Database(DB_PATH);

// Enable WAL mode & foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema if tables don't exist
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

// Automatically add missing columns if upgrading schema
try {
  const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userColumns.includes('phone')) db.exec("ALTER TABLE users ADD COLUMN phone TEXT;");
  if (!userColumns.includes('email')) db.exec("ALTER TABLE users ADD COLUMN email TEXT;");
  if (!userColumns.includes('department')) db.exec("ALTER TABLE users ADD COLUMN department TEXT DEFAULT 'Front of House & Service';");
  if (!userColumns.includes('shift')) db.exec("ALTER TABLE users ADD COLUMN shift TEXT DEFAULT 'Morning Shift (07:00 - 15:00)';");
  if (!userColumns.includes('hourly_rate')) db.exec("ALTER TABLE users ADD COLUMN hourly_rate REAL DEFAULT 4.50;");
  if (!userColumns.includes('duty_status')) db.exec("ALTER TABLE users ADD COLUMN duty_status TEXT DEFAULT 'on_duty';");
  if (!userColumns.includes('hire_date')) db.exec("ALTER TABLE users ADD COLUMN hire_date DATE DEFAULT CURRENT_DATE;");
} catch (e) {}

export default db;
