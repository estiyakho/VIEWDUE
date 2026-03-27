import { Settings } from '@/types/task';

export function getThemeColors(settings: Settings) {
  const accent = settings.dynamicColors ? '#8B7CF6' : '#2563EB';
  const background = settings.amoledTheme ? '#000000' : '#090B10';
  const surface = settings.amoledTheme ? '#05070B' : '#13161C';
  const surfaceMuted = settings.amoledTheme ? '#090C12' : '#171A21';

  return {
    accent,
    background,
    surface,
    surfaceMuted,
    surfaceElevated: settings.amoledTheme ? '#0B0F16' : '#1A1F29',
    border: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textSoft: '#CBD5E1',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
  };
}
