export type TaskStatus = 'todo' | 'done';

export type ResetInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type AppTheme = 'light' | 'dark' | 'system';
export type TimeFormat = '12h' | '24h';
export type FirstDayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';
export type SnoozeDuration = 5 | 10 | 15 | 30;
export type DefaultScreen = 'categories' | 'todos' | 'calendar' | 'statistics' | 'settings';
export type Language = 'english' | 'spanish' | 'french';

export type Category = {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  status: TaskStatus;
  createdAt: string;
};

export type Settings = {
  resetInterval: ResetInterval;
  lastResetAt: string | null;
  statsResetAt: string | null;
  theme: AppTheme;
  amoledTheme: boolean;
  accentColor: string;
  timeFormat: TimeFormat;
  firstDayOfWeek: FirstDayOfWeek;
  snoozeDuration: SnoozeDuration;
  defaultScreen: DefaultScreen;
  language: Language;
};

export type ScheduledTask = {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date (YYYY-MM-DD)
  createdAt: string;
};

