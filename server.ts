import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const db = new Database("kel-fitclub.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'user',
    language TEXT DEFAULT 'pt',
    goal TEXT,
    weight REAL,
    height REAL,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT, -- A, B, C
    category TEXT, -- Home, Gym
    video_url TEXT,
    duration TEXT,
    series TEXT,
    description TEXT,
    tips TEXT,
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER,
    name TEXT,
    video_url TEXT,
    description TEXT,
    tips TEXT,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY(workout_id) REFERENCES workouts(id)
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date DATE DEFAULT (date('now')),
    weight REAL,
    water_intake INTEGER DEFAULT 0,
    workout_completed_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    day_number INTEGER,
    workout_id INTEGER,
    FOREIGN KEY(workout_id) REFERENCES workouts(id)
  );

  CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed Admin if not exists
const adminEmail = "eduardomonsores@hotmail.com";
const adminPass = "95166136";
const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!existingAdmin) {
  const hashedPass = bcrypt.hashSync(adminPass, 10);
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
    adminEmail,
    hashedPass,
    "Eduardo Admin",
    "admin"
  );
}

// Seed default configs
const seedConfig = (key: string, value: string) => {
  const exists = db.prepare("SELECT * FROM app_config WHERE key = ?").get(key);
  if (!exists) {
    db.prepare("INSERT INTO app_config (key, value) VALUES (?, ?)").run(key, value);
  }
};

seedConfig("home_banner", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1000");
seedConfig("motivational_quote", "A disciplina é a ponte entre metas e realizações.");

// Seed sample workouts
const sampleWorkouts = [
  { name: 'Inferiores & Cardio', type: 'A', category: 'Gym', video_url: 'https://www.youtube.com/watch?v=1S8vV6yXq0E', duration: '45 MIN', series: '4x12', description: 'Foco em quadríceps e glúteos com finalização de cardio intenso.', tips: 'Mantenha o abdômen contraído durante todo o movimento.' },
  { name: 'Superiores & Core', type: 'B', category: 'Gym', video_url: 'https://www.youtube.com/watch?v=X_9VoqR5oj8', duration: '40 MIN', series: '3x15', description: 'Treino completo de membros superiores com foco em definição.', tips: 'Controle a descida do peso para maior ativação muscular.' },
  { name: 'Full Body Home', type: 'C', category: 'Home', video_url: 'https://www.youtube.com/watch?v=ml6cT4AZdqI', duration: '30 MIN', series: 'Circuito', description: 'Treino dinâmico para fazer em qualquer lugar sem equipamentos.', tips: 'Beba água nos intervalos curtos entre os circuitos.' }
];

const workoutCount = db.prepare("SELECT COUNT(*) as count FROM workouts").get() as any;
if (workoutCount.count === 0) {
  const insertWorkout = db.prepare("INSERT INTO workouts (name, type, category, video_url, duration, series, description, tips) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  sampleWorkouts.forEach(w => insertWorkout.run(w.name, w.type, w.category, w.video_url, w.duration, w.series, w.description, w.tips));
}

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-kel-fit";

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// API Routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, language: user.language } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPass = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPass, name);
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, language: user.language } });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

app.get("/api/config", (req, res) => {
  const configs = db.prepare("SELECT * FROM app_config").all();
  const configMap = configs.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  res.json(configMap);
});

app.get("/api/workouts", authenticate, (req, res) => {
  const workouts = db.prepare("SELECT * FROM workouts ORDER BY order_index ASC").all();
  res.json(workouts);
});

app.get("/api/workouts/:id/exercises", authenticate, (req, res) => {
  const exercises = db.prepare("SELECT * FROM exercises WHERE workout_id = ? ORDER BY order_index ASC").all(req.params.id);
  res.json(exercises);
});

app.get("/api/progress", authenticate, (req, res) => {
  const progress = db.prepare("SELECT * FROM progress WHERE user_id = ? ORDER BY date DESC").all((req as any).user.id);
  res.json(progress);
});

app.post("/api/progress/water", authenticate, (req, res) => {
  const { amount } = req.body;
  const userId = (req as any).user.id;
  const today = new Date().toISOString().split('T')[0];
  
  const existing = db.prepare("SELECT * FROM progress WHERE user_id = ? AND date = ?").get(userId, today);
  if (existing) {
    db.prepare("UPDATE progress SET water_intake = water_intake + ? WHERE id = ?").run(amount, (existing as any).id);
  } else {
    db.prepare("INSERT INTO progress (user_id, date, water_intake) VALUES (?, ?, ?)").run(userId, today, amount);
  }
  res.json({ success: true });
});

// Admin Routes
app.post("/api/admin/config", authenticate, (req, res) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { key, value } = req.body;
  db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run(key, value);
  res.json({ success: true });
});

app.get("/api/admin/stats", authenticate, (req, res) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  const workoutCount = db.prepare("SELECT COUNT(*) as count FROM workouts").get();
  res.json({ users: (userCount as any).count, workouts: (workoutCount as any).count });
});

app.delete("/api/admin/workouts/:id", authenticate, (req, res) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  db.prepare("DELETE FROM workouts WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
