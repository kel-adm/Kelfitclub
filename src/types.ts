export type Language = 'pt' | 'en' | 'es';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  language: Language;
  goal?: string;
  weight?: number;
  height?: number;
  photo_url?: string;
}

export interface Workout {
  id: number;
  name: string;
  type: string; // A, B, C
  category: 'Home' | 'Gym';
  video_url: string;
  duration: string;
  series: string;
  description: string;
  tips: string;
}

export interface Exercise {
  id: number;
  workout_id: number;
  name: string;
  video_url: string;
  description: string;
  tips: string;
}

export interface Progress {
  id: number;
  user_id: number;
  date: string;
  weight: number;
  water_intake: number;
  workout_completed_id?: number;
}

export interface AppConfig {
  home_banner: string;
  motivational_quote: string;
  [key: string]: string;
}
