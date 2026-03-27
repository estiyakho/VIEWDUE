import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '@/utils/app-defaults';
import { shouldResetTasks } from '@/utils/reset';
import { Category, ResetInterval, Settings, Task } from '@/types/task';

type TaskStore = {
  hydrated: boolean;
  tasks: Task[];
  categories: Category[];
  settings: Settings;
  addTask: (input: { title: string; description?: string; categoryId?: string }) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  addCategory: (name: string) => string | null;
  resetTasks: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setResetInterval: (interval: ResetInterval) => void;
  checkAndResetTasks: () => void;
  markHydrated: (value: boolean) => void;
};

const CATEGORY_COLORS = ['#2563EB', '#0F766E', '#7C3AED', '#EA580C', '#E11D48', '#0891B2'];
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
      addTask: ({ title, description, categoryId }) =>
        set((state) => ({
          tasks: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title: title.trim(),
              description: description?.trim() || undefined,
              categoryId: categoryId || undefined,
              status: 'todo',
              createdAt: new Date().toISOString(),
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
      addCategory: (name) => {
        const trimmedName = name.trim();
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
          color: CATEGORY_COLORS[nextIndex % CATEGORY_COLORS.length],
          icon: CATEGORY_ICONS[nextIndex % CATEGORY_ICONS.length],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          categories: [category, ...state.categories],
        }));

        return category.id;
      },
      resetTasks: () =>
        set((state) => ({
          tasks: [],
          settings: {
            ...state.settings,
            lastResetAt: new Date().toISOString(),
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
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
        settings: state.settings,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<{
          tasks: Task[];
          categories: Category[];
          settings: Partial<Settings>;
        }>;

        return {
          tasks: state?.tasks ?? [],
          categories: state?.categories?.length ? state.categories : DEFAULT_CATEGORIES,
          settings: {
            ...DEFAULT_SETTINGS,
            ...state?.settings,
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
