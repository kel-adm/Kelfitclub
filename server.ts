import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import serverless from "serverless-http";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("CRITICAL: Supabase environment variables are missing! Check your Secrets panel.");
}

// Initialize with placeholders if missing to avoid immediate crash, 
// but actual calls will fail gracefully with error handling in routes.
const supabase = createClient(SUPABASE_URL || "https://placeholder.supabase.co", SUPABASE_SERVICE_KEY || "placeholder");

const isNetlify = process.env.NETLIFY === "true" || !!process.env.FUNCTIONS_CONTROL_PLANE;

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
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    supabase: !!SUPABASE_URL,
    env: process.env.NODE_ENV
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Supabase login error:", error);
      if (error.code === 'PGRST116') {
        return res.status(401).json({ error: "Usuário não encontrado. Por favor, registre-se." });
      }
      return res.status(500).json({ error: `Erro no banco de dados: ${error.message}. Verifique se as tabelas foram criadas.` });
    }

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, language: user.language } });
    } else {
      res.status(401).json({ error: "Senha incorreta." });
    }
  } catch (err: any) {
    console.error("Login exception:", err);
    res.status(500).json({ error: "Erro interno no servidor ao tentar logar." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPass = bcrypt.hashSync(password, 10);
    const { data: user, error } = await supabase
      .from("users")
      .insert([{ email, password: hashedPass, name }])
      .select()
      .single();

    if (error) {
      console.error("Supabase register error:", error);
      return res.status(400).json({ error: `Erro ao registrar: ${error.message}` });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, language: user.language } });
  } catch (err: any) {
    console.error("Register exception:", err);
    res.status(500).json({ error: "Erro interno no servidor ao registrar." });
  }
});

app.post("/api/auth/google", async (req, res) => {
  const { email, name, id } = req.body;
  try {
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ id, email, name, role: 'user', password: 'oauth-user' }])
        .select()
        .single();
      
      if (createError) throw createError;
      user = newUser;
    } else if (error) {
      throw error;
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, language: user.language } });
  } catch (err: any) {
    console.error("Google sync error:", err);
    res.status(500).json({ error: `Erro ao sincronizar usuário: ${err.message}` });
  }
});

app.get("/api/config", async (req, res) => {
  const { data: configs, error } = await supabase.from("app_config").select("*");
  if (error) return res.status(500).json({ error: error.message });
  
  const configMap = configs.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  res.json(configMap);
});

app.get("/api/workouts", authenticate, async (req, res) => {
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("*")
    .order("order_index", { ascending: true });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(workouts);
});

app.get("/api/workouts/:id/exercises", authenticate, async (req, res) => {
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("workout_id", req.params.id)
    .order("order_index", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(exercises);
});

app.get("/api/progress", authenticate, async (req, res) => {
  const { data: progress, error } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", (req as any).user.id)
    .order("date", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(progress);
});

app.post("/api/progress/water", authenticate, async (req, res) => {
  const { amount } = req.body;
  const userId = (req as any).user.id;
  const today = new Date().toISOString().split('T')[0];
  
  const { data: existing } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("progress")
      .update({ water_intake: existing.water_intake + amount })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("progress")
      .insert([{ user_id: userId, date: today, water_intake: amount }]);
  }
  res.json({ success: true });
});

// Admin Routes
app.post("/api/admin/config", authenticate, async (req, res) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { key, value } = req.body;
  await supabase.from("app_config").upsert({ key, value });
  res.json({ success: true });
});

app.get("/api/admin/stats", authenticate, async (req, res) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  
  const { count: userCount } = await supabase.from("users").select("*", { count: 'exact', head: true });
  const { count: workoutCount } = await supabase.from("workouts").select("*", { count: 'exact', head: true });
  
  res.json({ users: userCount, workouts: workoutCount });
});

app.delete("/api/admin/workouts/:id", authenticate, async (req, res) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  await supabase.from("workouts").delete().eq("id", req.params.id);
  res.json({ success: true });
});

// Vite middleware for development (Dynamic import to avoid production bundling issues)
async function setupVite() {
  if (process.env.NODE_ENV !== "production" && !isNetlify) {
    try {
      // Use a dynamic import that is less likely to be followed by bundlers
      const viteModule = "vite";
      const { createServer: createViteServer } = await import(viteModule);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not found, skipping middleware");
    }
  } else if (process.env.NODE_ENV === "production" && !isNetlify) {
    // Only serve static files if NOT on Netlify (Netlify serves them via CDN)
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) return;
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }
}

setupVite();

// Export for Netlify Functions
export const handler = serverless(app);

// Local server for development
if (process.env.NODE_ENV !== "production" && !isNetlify) {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
