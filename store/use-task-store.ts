import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  Category,
  ResetInterval,
  ScheduledTask,
  Settings,
  Task,
  TaskHistoryEntry,
  TaskStatus,
} from "@/types/task";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/utils/app-defaults";
import { shouldResetTasks } from "@/utils/reset";
import { getHistoryDateString } from "@/utils/date-utils";
import { 
  scheduleReminderNotification, 
  cancelNotification,
  cancelAllScheduledNotifications
} from "@/utils/notifications";

type TaskStore = {
  hydrated: boolean;
  tasks: Task[];
  scheduledTasks: ScheduledTask[];
  taskHistory: TaskHistoryEntry[];
  categories: Category[];
  settings: Settings;
  addScheduledTask: (input: {
    title: string;
    description?: string;
    date: string;
    time?: string;
  }) => Promise<void>;
  deleteScheduledTask: (id: string) => void;
  updateScheduledTask: (id: string, input: {
    title: string;
    description?: string;
    date: string;
    time?: string;
  }) => Promise<void>;
  addTask: (input: {
    title: string;
    description?: string;
    categoryId?: string;
    createdAt?: string;
  }) => void;
  updateTask: (id: string, input: {
    title: string;
    description?: string;
    categoryId?: string;
  }) => string | null;
  toggleTaskStatus: (id: string) => void;
  setTaskNotAvailable: (id: string) => void;
  deleteTask: (id: string) => void;
  addCategory: (input: {
    name: string;
    description?: string;
    color?: string;
  }) => string | null;
  updateCategory: (input: {
    id: string;
    name: string;
    description?: string;
    color?: string;
  }) => string | null;
  reorderCategories: (activeIdsInNewOrder: string[]) => void;
  reorderTasks: (activeIdsInNewOrder: string[]) => void;
  archiveCategory: (id: string) => void;
  unarchiveCategory: (id: string) => void;
  deleteCategory: (id: string) => void;
  resetData: () => void;
  resetStats: () => void;
  resetSettings: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setResetInterval: (interval: ResetInterval) => void;
  checkAndResetTasks: () => void;
  markHydrated: (value: boolean) => void;
};

const CATEGORY_COLORS = [
  "#2563EB",
  "#06B6D4",
  "#10B981",
  "#16A34A",
  "#F59E0B",
  "#EA580C",
  "#F43F5E",
  "#DB2777",
  "#8B7CF6",
  "#475569",
];
const CATEGORY_ICONS = [
  "bookmark-outline",
  "folder-open-outline",
  "grid-outline",
  "albums-outline",
  "pricetag-outline",
  "shapes-outline",
];

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      tasks: [],
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      scheduledTasks: [],
      taskHistory: [],
      addScheduledTask: async ({ title, description, date, time }) => {
        const { settings } = get();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        let notificationId: string | undefined;
        let snoozeId: string | undefined;

        if (time) {
          try {
            const result = await scheduleReminderNotification(
              trimmedTitle,
              description || "",
              date,
              time,
              settings.snoozeDuration
            );
            notificationId = result.notificationId;
            snoozeId = result.snoozeId;
          } catch (error) {
            console.warn("Failed to schedule notification:", error);
          }
        }

        set((state) => ({
          ...state,
          scheduledTasks: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title: trimmedTitle,
              description: description?.trim() || undefined,
              date,
              time,
              notificationId,
              snoozeId,
              createdAt: new Date().toISOString(),
            },
            ...state.scheduledTasks,
          ],
        }));
      },
      deleteScheduledTask: (id: string) => {
        const task = get().scheduledTasks.find((t) => t.id === id);
        if (task) {
          cancelNotification(task.notificationId).catch(console.error);
          cancelNotification(task.snoozeId).catch(console.error);
        }
        set((state) => ({
          ...state,
          scheduledTasks: state.scheduledTasks.filter((task) => task.id !== id),
        }));
      },
      updateScheduledTask: async (id, { title, description, date, time }) => {
        const { settings, scheduledTasks } = get();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        const oldTask = scheduledTasks.find((t) => t.id === id);
        if (!oldTask) return;

        // Cancel previous notifications
        cancelNotification(oldTask.notificationId).catch(console.error);
        cancelNotification(oldTask.snoozeId).catch(console.error);

        let notificationId: string | undefined;
        let snoozeId: string | undefined;

        if (time) {
          try {
            const result = await scheduleReminderNotification(
              trimmedTitle,
              description || "",
              date,
              time,
              settings.snoozeDuration
            );
            notificationId = result.notificationId;
            snoozeId = result.snoozeId;
          } catch (error) {
            console.warn("Failed to schedule updated notification:", error);
          }
        }

        set((state) => ({
          ...state,
          scheduledTasks: state.scheduledTasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  title: trimmedTitle,
                  description: description?.trim() || undefined,
                  date,
                  time,
                  notificationId,
                  snoozeId,
                }
              : t
          ),
        }));
      },
      addTask: ({ title, description, categoryId, createdAt }) =>
        set((state) => ({
          tasks: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title: title.trim(),
              description: description?.trim() || undefined,
              categoryId: categoryId || undefined,
              status: "todo",
              createdAt: createdAt ?? new Date().toISOString(),
              orderIndex: Date.now(),
            },
            ...state.tasks,
          ],
        })),
      updateTask: (id, { title, description, categoryId }) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return null;

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  title: trimmedTitle,
                  description: description?.trim() || undefined,
                  categoryId: categoryId || undefined,
                }
              : task
          ),
        }));
        return id;
      },
      toggleTaskStatus: (id: string) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return state;

          const newStatus = (task.status === "todo" ? "done" : "todo") as TaskStatus;
          const newTasks = state.tasks.map((t) =>
            t.id === id ? { ...t, status: newStatus } : t
          );

          let newTaskHistory = [...state.taskHistory];
          if (newStatus === "done") {
            const today = getHistoryDateString(new Date());
            const alreadyLogged = state.taskHistory.some(
              (h) => h.taskId === id && h.date === today
            );

            if (!alreadyLogged) {
              const nowISO = new Date().toISOString();
              newTaskHistory.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                taskId: id,
                title: task.title,
                categoryId: task.categoryId,
                status: "done",
                date: today,
                completedAt: nowISO,
              });
            }
          }

          return { ...state, tasks: newTasks, taskHistory: newTaskHistory };
        }),
      setTaskNotAvailable: (id: string) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return state;

          const nextStatus = task.status === "not-available" ? "todo" : "not-available";
          
          let newTaskHistory = [...state.taskHistory];
          if (nextStatus === "not-available") {
            const today = getHistoryDateString(new Date());
            const alreadyLogged = state.taskHistory.some(
              (h) => h.taskId === id && h.date === today
            );

            if (!alreadyLogged) {
              newTaskHistory.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                taskId: id,
                title: task.title,
                categoryId: task.categoryId,
                status: "not-available",
                date: today,
                completedAt: new Date().toISOString(),
              });
            }
          }

          return {
            ...state,
            tasks: state.tasks.map((t) =>
              t.id === id ? { ...t, status: nextStatus as TaskStatus } : t,
            ),
            taskHistory: newTaskHistory
          };
        }),
      deleteTask: (id: string) =>
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
          (category) =>
            category.name.toLowerCase() === trimmedName.toLowerCase(),
        );
        if (existing) {
          return existing.id;
        }

        const nextIndex = get().categories.length;
        const category: Category = {
          id: `${trimmedName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          name: trimmedName,
          description: trimmedDescription,
          color: color ?? CATEGORY_COLORS[nextIndex % CATEGORY_COLORS.length],
          icon: CATEGORY_ICONS[nextIndex % CATEGORY_ICONS.length],
          isArchived: false,
          createdAt: new Date().toISOString(),
          orderIndex: Date.now(),
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
          (category) =>
            category.id !== id &&
            category.name.toLowerCase() === trimmedName.toLowerCase(),
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
              : category,
          ),
        }));

        return id;
      },
      reorderCategories: (activeIdsInNewOrder: string[]) => set((state) => {
        if (!activeIdsInNewOrder.length) return state;

        const targetCategories = state.categories.filter(c => activeIdsInNewOrder.includes(c.id));
        if (!targetCategories.length) return state;

        const sortedOrderIndices = targetCategories
          .map(c => c.orderIndex ?? new Date(c.createdAt).getTime())
          .sort((a, b) => b - a);
          
        const newCategories = state.categories.map(c => {
          const newIndex = activeIdsInNewOrder.indexOf(c.id);
          if (newIndex === -1) return c;
          return { ...c, orderIndex: sortedOrderIndices[newIndex] };
        });
        
        return { categories: newCategories };
      }),
      reorderTasks: (activeIdsInNewOrder: string[]) => set((state) => {
        if (!activeIdsInNewOrder.length) return state;

        const targetTasks = state.tasks.filter(t => activeIdsInNewOrder.includes(t.id));
        if (!targetTasks.length) return state;

        const sortedOrderIndices = targetTasks
          .map(t => t.orderIndex ?? new Date(t.createdAt).getTime())
          .sort((a, b) => b - a);
          
        const newTasks = state.tasks.map(t => {
          const newIndex = activeIdsInNewOrder.indexOf(t.id);
          if (newIndex === -1) return t;
          return { ...t, orderIndex: sortedOrderIndices[newIndex] };
        });
        
        return { 
          tasks: newTasks,
          settings: { ...state.settings, taskSortMode: 'manual' }
        };
      }),
      archiveCategory: (id: string) =>
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, isArchived: true } : category,
          ),
        })),
      unarchiveCategory: (id: string) =>
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, isArchived: false } : category,
          ),
        })),
      deleteCategory: (id: string) =>
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          tasks: state.tasks.filter((task) => task.categoryId !== id),
        })),
      resetData: () => {
        cancelAllScheduledNotifications().catch(console.error);
        set((state) => ({
          tasks: [],
          categories: [],
          scheduledTasks: [],
          taskHistory: [],
          settings: {
            ...state.settings,
            lastResetAt: new Date().toISOString(),
          },
        }));
      },
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
            hasCompletedNotificationOnboarding: state.settings.hasCompletedNotificationOnboarding,
          },
        })),
      updateSettings: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...patch,
          },
        })),
      setResetInterval: (interval: ResetInterval) =>
        set((state) => ({
          settings: {
            ...state.settings,
            resetInterval: interval,
            lastResetAt:
              interval === "none"
                ? null
                : (state.settings.lastResetAt ?? new Date().toISOString()),
          },
        })),
      checkAndResetTasks: () => {
        const { settings } = get();

        if (!shouldResetTasks(settings.resetInterval, settings.lastResetAt, settings.firstDayOfWeek)) {
          return;
        }

        set((state) => {
          const now = new Date();
          
          // Calculate the date for which we are logging history.
          // This should be the period that just ended. Since shouldResetTasks returned true,
          // it means the 'now' is a new day/week/etc. compared to 'lastResetAt'.
          // We'll log the final state for the date of the LAST reset.
          const logDate = state.settings.lastResetAt 
            ? getHistoryDateString(new Date(state.settings.lastResetAt))
            : getHistoryDateString(new Date(now.getTime() - 1000 * 60 * 60 * 24)); // Default to yesterday

          // Optimization: create a set of taskId|date that are already logged to avoid O(T*H)
          // We only care about logs for the target logDate.
          const loggedTodaySet = new Set(
            state.taskHistory
              .filter(h => h.date === logDate)
              .map(h => h.taskId)
          );

          const newHistoryEntries: TaskHistoryEntry[] = [];
          
          state.tasks.forEach(task => {
            // Check if category is archived
            const category = state.categories.find(c => c.id === task.categoryId);
            if (category?.isArchived) return; // Skip archived

            if (!loggedTodaySet.has(task.id)) {
              newHistoryEntries.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                taskId: task.id,
                title: task.title,
                categoryId: task.categoryId,
                status: task.status,
                date: logDate,
                completedAt: now.toISOString(),
              });
            }
          });

          return {
            tasks: state.tasks.map((task) => {
              const category = state.categories.find(c => c.id === task.categoryId);
              if (category?.isArchived) {
                return task;
              }
              return {
                ...task,
                status: 'todo' as TaskStatus,
              };
            }),
            taskHistory: [...state.taskHistory, ...newHistoryEntries],
            settings: {
              ...state.settings,
              lastResetAt: now.toISOString(),
            },
          };
        });
      },
      markHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "todo-app-storage",
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        scheduledTasks: state.scheduledTasks,
        taskHistory: state.taskHistory,
        categories: state.categories,
        settings: state.settings,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<{
          tasks: Task[];
          scheduledTasks: ScheduledTask[];
          taskHistory: TaskHistoryEntry[];
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
          taskHistory: (state?.taskHistory ?? []).map(h => ({
             ...h,
             status: (h as any).status ?? 'done' // Default old history to 'done'
          })),
          categories: (state?.categories ?? DEFAULT_CATEGORIES).map(
            (category) => ({
              ...category,
              description: category.description ?? undefined,
              isArchived: (category as any).isArchived ?? false,
            }),
          ),
          settings: {
            ...DEFAULT_SETTINGS,
            ...state?.settings,
            accentColor:
              state?.settings?.accentColor ??
              (state?.settings?.dynamicColors ? "#8B7CF6" : "#2563EB"),
            taskSortMode: state?.settings?.taskSortMode ?? 'manual',
          },
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("Failed to rehydrate task store", error);
        }

        state?.markHydrated(true);
        state?.checkAndResetTasks();
      },
    },
  ),
);
