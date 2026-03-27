import { Category, Settings } from '@/types/task';

export const DEFAULT_CATEGORIES: Category[] = [];

export const DEFAULT_SETTINGS: Settings = {
  resetInterval: 'none',
  lastResetAt: null,
  theme: 'dark',
  amoledTheme: false,
  dynamicColors: true,
  showImages: true,
  timeFormat: '12h',
  firstDayOfWeek: 'saturday',
  snoozeDuration: 10,
  screenPrivacy: false,
  defaultScreen: 'todos',
  language: 'english',
};
