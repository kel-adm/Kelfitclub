/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Dumbbell, 
  Trophy, 
  BarChart2, 
  User as UserIcon, 
  Plus, 
  ChevronRight, 
  Play, 
  Droplets,
  Settings,
  LogOut,
  Globe,
  Camera,
  Calendar,
  X
} from 'lucide-react';
import { User, Workout, Exercise, Progress, AppConfig, Language } from './types';
import { translations } from './translations';

// Contexts
const AuthContext = createContext<{
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
} | null>(null);

const useAuth = () => useContext(AuthContext)!;

// Components
const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const { language } = useAuth();
  const t = translations[language];

  const tabs = [
    { id: 'home', icon: Home, label: t.home },
    { id: 'workouts', icon: Dumbbell, label: t.workouts },
    { id: 'challenges', icon: Trophy, label: t.challenges },
    { id: 'progress', icon: BarChart2, label: t.progress },
    { id: 'profile', icon: UserIcon, label: t.profile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-6 py-3 flex justify-between items-center z-50 pb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
        >
          <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

const LoginScreen = () => {
  const { login, language } = useAuth();
  const t = translations[language];
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.token) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Erro ao autenticar');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter italic">KEL FITCLUB</h1>
          <p className="text-white/50 text-sm uppercase tracking-[0.2em]">Premium Fitness Experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Nome"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder={t.email}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t.password}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-xl active:scale-95 transition-transform">
            {isRegister ? t.register : t.login}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-white/50 text-sm hover:text-white transition-colors"
          >
            {isRegister ? 'Já tem uma conta? Entre' : 'Não tem conta? Crie uma'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const HomeScreen = () => {
  const { user, language } = useAuth();
  const t = translations[language];
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    fetch('/api/config').then(res => res.json()).then(setConfig);
    fetch('/api/workouts', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(res => res.json()).then(setWorkouts);
  }, []);

  const today = new Date().toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long' });

  return (
    <div className="pb-24 space-y-8">
      <header className="px-6 pt-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.welcome}, {user?.name.split(' ')[0]}</h2>
          <p className="text-secondary/60 text-sm capitalize">{today}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden">
          {user?.photo_url ? <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={20} />}
        </div>
      </header>

      {config?.home_banner && (
        <section className="px-6">
          <div className="relative h-48 rounded-3xl overflow-hidden shadow-lg">
            <img src={config.home_banner} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <p className="text-white text-sm font-medium italic">"{config.motivational_quote}"</p>
            </div>
          </div>
        </section>
      )}

      <section className="px-6 space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="font-bold text-lg">{t.weekly_progress}</h3>
          <span className="text-xs font-bold text-secondary/40">3/6 {t.completed}</span>
        </div>
        <div className="flex justify-between gap-2">
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className={`w-full h-1.5 rounded-full ${i < 3 ? 'bg-black' : 'bg-black/5'}`} />
              <span className="text-[10px] font-bold text-secondary/40">{day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 space-y-4">
        <h3 className="font-bold text-lg">Treino do Dia</h3>
        <div className="premium-card p-6 bg-black text-white space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Treino A</span>
              <h4 className="text-xl font-bold">Inferiores & Cardio</h4>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold">45 MIN</div>
          </div>
          <button className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Play size={16} fill="currentColor" />
            {t.start_workout}
          </button>
        </div>
      </section>

      <section className="px-6 space-y-4">
        <h3 className="font-bold text-lg">Calendário</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const isToday = i === 0;
            return (
              <div key={i} className={`min-w-[60px] flex flex-col items-center py-4 rounded-2xl border transition-all ${isToday ? 'bg-black text-white border-black' : 'bg-white text-black border-black/5'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const WorkoutsScreen = () => {
  const { language } = useAuth();
  const t = translations[language];
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [category, setCategory] = useState<'Home' | 'Gym' | null>(null);

  useEffect(() => {
    fetch('/api/workouts', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(res => res.json()).then(setWorkouts);
  }, []);

  return (
    <div className="pb-24 space-y-6">
      <header className="px-6 pt-8">
        <h2 className="text-3xl font-bold tracking-tight">{t.workouts}</h2>
        <p className="text-secondary/60 text-sm">Escolha seu plano de hoje</p>
      </header>

      <div className="px-6 grid grid-cols-1 gap-4">
        {workouts.map((workout) => (
          <motion.div 
            key={workout.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedWorkout(workout)}
            className="premium-card p-5 flex justify-between items-center cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xl">
                {workout.type}
              </div>
              <div>
                <h4 className="font-bold">{workout.name}</h4>
                <p className="text-xs text-secondary/60">{workout.duration} • {workout.series}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-secondary/30" />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedWorkout && !category && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Onde você vai treinar?</h3>
                <button onClick={() => setSelectedWorkout(null)}><X size={24} /></button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setCategory('Home')}
                  className="btn-secondary py-6 flex flex-col items-center gap-2"
                >
                  <Home size={24} />
                  <span>{t.home_workout}</span>
                </button>
                <button 
                  onClick={() => setCategory('Gym')}
                  className="btn-primary py-6 flex flex-col items-center gap-2"
                >
                  <Dumbbell size={24} />
                  <span>{t.gym}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedWorkout && category && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[70] overflow-y-auto"
          >
            <div className="p-6 space-y-6 pb-24">
              <div className="flex justify-between items-center">
                <button onClick={() => setCategory(null)} className="p-2 -ml-2"><ChevronRight size={24} className="rotate-180" /></button>
                <h3 className="font-bold">{selectedWorkout.name}</h3>
                <div className="w-10" />
              </div>

              <div className="aspect-video rounded-3xl bg-black overflow-hidden shadow-xl">
                {/* Lazy load YouTube Video */}
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${selectedWorkout.video_url.split('v=')[1] || selectedWorkout.video_url.split('/').pop()}`}
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="premium-card p-4 text-center">
                  <p className="text-[10px] font-bold text-secondary/40 uppercase">{t.duration}</p>
                  <p className="font-bold">{selectedWorkout.duration}</p>
                </div>
                <div className="premium-card p-4 text-center">
                  <p className="text-[10px] font-bold text-secondary/40 uppercase">{t.series}</p>
                  <p className="font-bold">{selectedWorkout.series}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-lg">{t.description}</h4>
                <p className="text-secondary/70 text-sm leading-relaxed">{selectedWorkout.description}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-lg">{t.tips}</h4>
                <div className="bg-black/5 p-4 rounded-2xl border border-black/5">
                  <p className="text-secondary/70 text-sm italic">"{selectedWorkout.tips}"</p>
                </div>
              </div>

              <button className="w-full btn-primary py-4 mt-4">Concluir Treino</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProgressScreen = () => {
  const { language } = useAuth();
  const t = translations[language];
  const [water, setWater] = useState(0);
  
  const addWater = async () => {
    if (water < 10) {
      setWater(prev => prev + 1);
      await fetch('/api/progress/water', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount: 300 })
      });
    }
  };

  return (
    <div className="pb-24 space-y-8">
      <header className="px-6 pt-8">
        <h2 className="text-3xl font-bold tracking-tight">{t.progress}</h2>
        <p className="text-secondary/60 text-sm">Sua jornada até aqui</p>
      </header>

      <section className="px-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{t.water_intake}</h3>
          <span className="text-sm font-bold text-secondary/60">{water * 0.3}L / 3.0L</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={addWater}
              disabled={i < water}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all ${i < water ? 'bg-black text-white' : 'bg-white border border-black/10 text-black/20'}`}
            >
              <Droplets size={20} fill={i < water ? "currentColor" : "none"} />
            </motion.button>
          ))}
        </div>
      </section>

      <section className="px-6 space-y-4">
        <h3 className="font-bold text-lg">Evolução de Peso</h3>
        <div className="premium-card p-6 h-48 flex items-end justify-between gap-2">
          {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className="w-full bg-black rounded-t-lg"
              />
              <span className="text-[10px] font-bold text-secondary/40">S{i+1}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 space-y-4">
        <h3 className="font-bold text-lg">Fotos de Evolução</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-square rounded-3xl bg-black/5 border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-2 cursor-pointer">
            <Camera size={24} className="text-secondary/40" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary/40">Adicionar Foto</span>
          </div>
          <div className="aspect-square rounded-3xl overflow-hidden bg-black/5">
            <img src="https://picsum.photos/seed/progress/400/400" alt="Progress" className="w-full h-full object-cover opacity-50" />
          </div>
        </div>
      </section>
    </div>
  );
};

const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const [stats, setStats] = useState({ users: 0, workouts: 0 });
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [newBanner, setNewBanner] = useState('');
  const [newQuote, setNewQuote] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()).then(setStats);
    fetch('/api/config').then(res => res.json()).then(setConfig);
  }, []);

  const saveConfig = async (key: string, value: string) => {
    await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ key, value })
    });
    alert('Configuração salva!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-[100] overflow-y-auto p-6"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Painel Administrativo</h2>
        <button onClick={onClose} className="p-2"><X size={24} /></button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="premium-card p-4">
          <p className="text-xs font-bold text-secondary/40 uppercase">Usuários</p>
          <p className="text-2xl font-bold">{stats.users}</p>
        </div>
        <div className="premium-card p-4">
          <p className="text-xs font-bold text-secondary/40 uppercase">Treinos</p>
          <p className="text-2xl font-bold">{stats.workouts}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold">Banner da Home (URL)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              defaultValue={config?.home_banner}
              onChange={(e) => setNewBanner(e.target.value)}
              className="flex-1 bg-black/5 border border-black/5 rounded-xl px-4 py-2 text-sm"
            />
            <button onClick={() => saveConfig('home_banner', newBanner)} className="btn-primary py-2 px-4 text-xs">Salvar</button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold">Frase Motivacional</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              defaultValue={config?.motivational_quote}
              onChange={(e) => setNewQuote(e.target.value)}
              className="flex-1 bg-black/5 border border-black/5 rounded-xl px-4 py-2 text-sm"
            />
            <button onClick={() => saveConfig('motivational_quote', newQuote)} className="btn-primary py-2 px-4 text-xs">Salvar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileScreen = () => {
  const { user, logout, language, setLanguage } = useAuth();
  const t = translations[language];
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="pb-24 space-y-8">
      <header className="px-6 pt-8 flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
            {user?.photo_url ? <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={40} />}
          </div>
          <button className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full shadow-lg">
            <Camera size={16} />
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{user?.name}</h2>
          <p className="text-secondary/60 text-sm">{user?.email}</p>
        </div>
      </header>

      <section className="px-6 grid grid-cols-3 gap-4">
        <div className="premium-card p-4 text-center">
          <p className="text-[10px] font-bold text-secondary/40 uppercase">Dias Ativos</p>
          <p className="text-xl font-bold">12</p>
        </div>
        <div className="premium-card p-4 text-center">
          <p className="text-[10px] font-bold text-secondary/40 uppercase">Treinos</p>
          <p className="text-xl font-bold">24</p>
        </div>
        <div className="premium-card p-4 text-center">
          <p className="text-[10px] font-bold text-secondary/40 uppercase">Meta</p>
          <p className="text-xl font-bold">65kg</p>
        </div>
      </section>

      <section className="px-6 space-y-2">
        <div className="premium-card">
          {user?.role === 'admin' && (
            <>
              <button 
                onClick={() => setShowAdmin(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors text-indigo-600"
              >
                <div className="flex items-center gap-3">
                  <Settings size={20} />
                  <span className="font-bold">Painel Admin</span>
                </div>
                <ChevronRight size={18} />
              </button>
              <div className="h-[1px] bg-black/5 mx-4" />
            </>
          )}
          <button className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors">
            <div className="flex items-center gap-3">
              <Settings size={20} />
              <span className="font-medium">Configurações da Conta</span>
            </div>
            <ChevronRight size={18} className="text-secondary/30" />
          </button>
          <div className="h-[1px] bg-black/5 mx-4" />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={20} />
              <span className="font-medium">{t.language}</span>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent font-bold text-sm focus:outline-none"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div className="h-[1px] bg-black/5 mx-4" />
          <button 
            onClick={logout}
            className="w-full p-4 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </section>

      <section className="px-6">
        <div className="premium-card p-6 bg-secondary text-white space-y-4">
          <h4 className="font-bold italic">Mensagem da Kel</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            "Sua consistência é sua maior força. Não pare agora, você está mais perto do que imagina!"
          </p>
        </div>
      </section>

      <AnimatePresence>
        {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
      </AnimatePresence>
    </div>
  );
};

const ChallengesScreen = () => {
  const { language } = useAuth();
  const t = translations[language];

  return (
    <div className="pb-24 space-y-8">
      <header className="px-6 pt-8">
        <h2 className="text-3xl font-bold tracking-tight">{t.challenges}</h2>
        <p className="text-secondary/60 text-sm">Supere seus limites</p>
      </header>

      <section className="px-6">
        <div className="premium-card relative h-64 overflow-hidden group cursor-pointer">
          <img src="https://picsum.photos/seed/challenge/800/600" alt="Challenge" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-8 flex flex-col justify-end">
            <span className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-2">21 DIAS</span>
            <h3 className="text-2xl font-bold text-white tracking-tight">Desafio Kel Fit 21</h3>
            <p className="text-white/60 text-sm mb-4">Transforme seu corpo e mente em 3 semanas.</p>
            <button className="btn-primary w-fit">Participar Agora</button>
          </div>
        </div>
      </section>

      <section className="px-6 space-y-4">
        <h3 className="font-bold text-lg">Próximos Desafios</h3>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="premium-card p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black/5 overflow-hidden">
                <img src={`https://picsum.photos/seed/ch${i}/200/200`} alt="Thumb" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold">Foco no Abdômen</h4>
                <p className="text-xs text-secondary/60">7 Dias • Iniciante</p>
              </div>
              <Trophy size={20} className="text-secondary/20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// Main App Component
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState<Language>('pt');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Validate token and get user info
      fetch('/api/auth/login', { // In a real app, use a /me endpoint
        method: 'GET', // This is just a placeholder for logic
      }).catch(() => {
        // Handle error
      }).finally(() => {
        setLoading(false);
      });
      
      // For demo purposes, we'll just use the stored user if available
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setLanguage(parsed.language || 'pt');
      }
    }
    setLoading(false);
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setLanguage(newUser.language);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (user) {
      const updatedUser = { ...user, language: lang };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Update on server too
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>;

  if (!token) return (
    <AuthContext.Provider value={{ user, login, logout, language, setLanguage: handleSetLanguage }}>
      <LoginScreen />
    </AuthContext.Provider>
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, language, setLanguage: handleSetLanguage }}>
      <div className="min-h-screen bg-background max-w-md mx-auto relative shadow-2xl">
        <main className="min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'home' && <HomeScreen />}
              {activeTab === 'workouts' && <WorkoutsScreen />}
              {activeTab === 'challenges' && <ChallengesScreen />}
              {activeTab === 'progress' && <ProgressScreen />}
              {activeTab === 'profile' && <ProfileScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </AuthContext.Provider>
  );
}
