import { useTaskStore } from '@/store/use-task-store';
import { getThemeColors } from '@/utils/theme';

export function useAppTheme() {
  const settings = useTaskStore((state) => state.settings);
  return getThemeColors(settings);
}
