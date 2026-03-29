import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '@/utils/app-defaults';
import { shouldResetTasks } from '@/utils/reset';
import { Category, ResetInterval, ScheduledTask, Settings, Task } from '@/types/task';

type TaskStore = {
  hydrated: boolean;
  tasks: Task[];
  scheduledTasks: ScheduledTask[];
  categories: Category[];
  settings: Settings;
  addScheduledTask: (input: { title: string; description?: string; date: string }) => void;
  addTask: (input: { title: string; description?: string; categoryId?: string; createdAt?: string }) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  addCategory: (input: { name: string; description?: string; color?: string }) => string | null;
  updateCategory: (input: { id: string; name: string; description?: string; color?: string }) => string | null;
  resetData: () => void;
  resetStats: () => void;
  resetSettings: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setResetInterval: (interval: ResetInterval) => void;
  checkAndResetTasks: () => void;
  markHydrated: (value: boolean) => void;
};

const CATEGORY_COLORS = ['#2563EB', '#06B6D4', '#10B981', '#16A34A', '#F59E0B', '#EA580C', '#F43F5E', '#DB2777', '#8B7CF6', '#475569'];
const CATEGORY_ICONS = [
  'bookmark-outline',
  'folder-open-outline',
  'grid-outline',
  'albums-outline',
  'pricetag-outline',
  'shapes-outline',
];

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      tasks: [],
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      scheduledTasks: [],
      addTask: ({ title, description, categoryId, createdAt }) =>
        set((state) => ({
          tasks: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title: title.trim(),
              description: description?.trim() || undefined,
              categoryId: categoryId || undefined,
              status: 'todo',
              createdAt: createdAt ?? new Date().toISOString(),
            },
            ...state.tasks,
          ],
        })),
      toggleTaskStatus: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: task.status === 'todo' ? 'done' : 'todo',
                }
              : task
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),
      addCategory: ({ name, description, color }) => {
        const trimmedName = name.trim();
        const trimmedDescription = description?.trim() || undefined;

        if (!trimmedName) {
          return null;
        }

        const existing = get().categories.find(
          (category) => category.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (existing) {
          return existing.id;
        }

        const nextIndex = get().categories.length;
        const category: Category = {
          id: `${trimmedName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: trimmedName,
          description: trimmedDescription,
          color: color ?? CATEGORY_COLORS[nextIndex % CATEGORY_COLORS.length],
          icon: CATEGORY_ICONS[nextIndex % CATEGORY_ICONS.length],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          categories: [category, ...state.categories],
        }));

        return category.id;
      },
      updateCategory: ({ id, name, description, color }) => {
        const trimmedName = name.trim();
        const trimmedDescription = description?.trim() || undefined;

        if (!trimmedName) {
          return null;
        }

        const existing = get().categories.find(
          (category) => category.id !== id && category.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (existing) {
          return existing.id;
        }

        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id
              ? {
                  ...category,
                  color: color ?? category.color,
                  description: trimmedDescription,
                  name: trimmedName,
                }
              : category
          ),
        }));

        return id;
      },
      resetData: () =>
        set((state) => ({
          tasks: [],
          categories: [],
          settings: {
            ...state.settings,
            lastResetAt: new Date().toISOString(),
          },
        })),
      resetStats: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            statsResetAt: new Date().toISOString(),
          },
        })),
      resetSettings: () =>
        set((state) => ({
          settings: {
            ...DEFAULT_SETTINGS,
            statsResetAt: state.settings.statsResetAt,
          },
        })),
      updateSettings: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...patch,
          },
        })),
      setResetInterval: (interval) =>
        set((state) => ({
          settings: {
            ...state.settings,
            resetInterval: interval,
            lastResetAt:
              interval === 'none'
                ? null
                : state.settings.lastResetAt ?? new Date().toISOString(),
          },
        })),
      checkAndResetTasks: () => {
        const { settings } = get();

        if (!shouldResetTasks(settings.resetInterval, settings.lastResetAt)) {
          return;
        }

        set((state) => ({
          tasks: [],
          settings: {
            ...state.settings,
            lastResetAt: new Date().toISOString(),
          },
        }));
      },
      markHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'todo-app-storage',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        scheduledTasks: state.scheduledTasks,
        categories: state.categories,
        settings: state.settings,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<{
          tasks: Task[];
  scheduledTasks: ScheduledTask[];
          categories: Category[];
          settings: Partial<Settings> & {
            dynamicColors?: boolean;
            showImages?: boolean;
            screenPrivacy?: boolean;
          };
        }>;

        return {
          tasks: state?.tasks ?? [],
          scheduledTasks: (state as any)?.scheduledTasks ?? [],
          categories: (state?.categories ?? DEFAULT_CATEGORIES).map((category) => ({
            ...category,
            description: category.description ?? undefined,
          })),
          settings: {
            ...DEFAULT_SETTINGS,
            ...state?.settings,
            accentColor: state?.settings?.accentColor ?? (state?.settings?.dynamicColors ? '#8B7CF6' : '#2563EB'),
          },
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate task store', error);
        }

        state?.markHydrated(true);
        state?.checkAndResetTasks();
      },
    }
  )
);








