-- SQL Schema for Kel FitClub
-- Run this in your Supabase SQL Editor

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  language TEXT DEFAULT 'pt',
  goal TEXT,
  weight REAL,
  height REAL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workouts Table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT, -- A, B, C
  category TEXT, -- Home, Gym
  video_url TEXT,
  duration TEXT,
  series TEXT,
  description TEXT,
  tips TEXT,
  order_index INTEGER DEFAULT 0
);

-- Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  tips TEXT,
  order_index INTEGER DEFAULT 0
);

-- Progress Table
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  weight REAL,
  water_intake INTEGER DEFAULT 0,
  workout_completed_id UUID REFERENCES workouts(id)
);

-- App Config Table
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Enable RLS (Optional but recommended)
-- For this demo, we are using service role key on the server, 
-- but you should set up proper RLS if accessing from client.

-- Seed Default Config
INSERT INTO app_config (key, value) VALUES 
('home_banner', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1000'),
('motivational_quote', 'A disciplina é a ponte entre metas e realizações.')
ON CONFLICT (key) DO NOTHING;

-- Seed Sample Workouts
INSERT INTO workouts (name, type, category, video_url, duration, series, description, tips, order_index) VALUES
('Inferiores & Cardio', 'A', 'Gym', 'https://www.youtube.com/watch?v=1S8vV6yXq0E', '45 MIN', '4x12', 'Foco em quadríceps e glúteos com finalização de cardio intenso.', 'Mantenha o abdômen contraído durante todo o movimento.', 0),
('Superiores & Core', 'B', 'Gym', 'https://www.youtube.com/watch?v=X_9VoqR5oj8', '40 MIN', '3x15', 'Treino completo de membros superiores com foco em definição.', 'Controle a descida do peso para maior ativação muscular.', 1),
('Full Body Home', 'C', 'Home', 'https://www.youtube.com/watch?v=ml6cT4AZdqI', '30 MIN', 'Circuito', 'Treino dinâmico para fazer em qualquer lugar sem equipamentos.', 'Beba água nos intervalos curtos entre os circuitos.', 2)
ON CONFLICT DO NOTHING;
