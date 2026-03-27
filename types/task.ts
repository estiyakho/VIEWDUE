export type TaskStatus = 'todo' | 'done';

export type ResetInterval = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type AppTheme = 'dark' | 'system';
export type TimeFormat = '12h' | '24h';
export type FirstDayOfWeek = 'sunday' | 'monday' | 'saturday';
export type SnoozeDuration = 5 | 10 | 15 | 30;
export type DefaultScreen = 'categories' | 'todos' | 'calendar' | 'statistics' | 'settings';
export type Language = 'english' | 'spanish' | 'french';

export type Category = {
  id: string;
  name: string;
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
  theme: AppTheme;
  amoledTheme: boolean;
  dynamicColors: boolean;
  showImages: boolean;
  timeFormat: TimeFormat;
  firstDayOfWeek: FirstDayOfWeek;
  snoozeDuration: SnoozeDuration;
  screenPrivacy: boolean;
  defaultScreen: DefaultScreen;
  language: Language;
};
