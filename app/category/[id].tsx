import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

import { CategoryFormModal } from '@/components/category-form-modal';
import { VerticalScaleDecorator } from '@/components/vertical-scale-decorator';
import { TaskFormModal } from '@/components/task-form-modal';
import { EmptyState } from '@/components/empty-state';
import { FloatingActionButton } from '@/components/floating-action-button';
import { SettingsOptionSheet } from '@/components/settings-option-sheet';
import { TaskItem } from '@/components/task-item';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { Task, TaskStatus } from '@/types/task';
import { runListAnimation } from '@/utils/layout-animation';

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" as const },
  { label: "Oldest First", value: "oldest" as const },
  { label: "Title A-Z", value: "title-asc" as const },
  { label: "Title Z-A", value: "title-desc" as const },
  { label: "Manual", value: "manual" as const },
];

type SortMode = (typeof SORT_OPTIONS)[number]["value"];
type CategoryTaskFilter = 'all' | TaskStatus;

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const categories = useTaskStore((state) => state.categories);
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const setTaskNotAvailable = useTaskStore((state) => state.setTaskNotAvailable);
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const archiveCategory = useTaskStore((state) => state.archiveCategory);
  const unarchiveCategory = useTaskStore((state) => state.unarchiveCategory);
  const timeFormat = useTaskStore((state) => state.settings.timeFormat);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<CategoryTaskFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  const categoryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const category = categories.find((item) => item.id === categoryId);

  const categoryTasks = useMemo(() => {
    const defaultFiltered = tasks.filter((task) => task.categoryId === categoryId);
    let result = defaultFiltered;

    if (taskFilter !== 'all') {
      result = defaultFiltered.filter((task) => task.status === taskFilter);
    }

    result.sort((left, right) => {
      if (sortMode === "newest") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
      if (sortMode === "oldest") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }
      if (sortMode === "title-asc") {
        return left.title.localeCompare(right.title);
      }
      if (sortMode === "manual") {
        const leftOrder = left.orderIndex ?? new Date(left.createdAt).getTime();
        const rightOrder = right.orderIndex ?? new Date(right.createdAt).getTime();
        return rightOrder - leftOrder;
      }
      return right.title.localeCompare(left.title);
    });

    return result;
  }, [categoryId, taskFilter, sortMode, tasks]);

  const availableTasks = tasks.filter((task) => task.categoryId === categoryId && task.status !== 'not-available');
  const totalTasks = availableTasks.length;
  const completedTasks = availableTasks.filter((task) => task.status === 'done').length;
  const remainingTasks = totalTasks - completedTasks;

  const handleDelete = useCallback(
    (id: string) => {
      runListAnimation();
      deleteTask(id);
    },
    [deleteTask]
  );

  const handleToggle = useCallback(
    (id: string) => {
      runListAnimation();
      toggleTaskStatus(id);
    },
    [toggleTaskStatus]
  );

  const handleNotAvailable = useCallback(
    (id: string) => {
      runListAnimation();
      setTaskNotAvailable(id);
    },
    [setTaskNotAvailable]
  );

  if (!category) {
    return (
      <View style={[styles.safeArea, { backgroundColor: colors.background }]}> 
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: colors.background }]}> 
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
          </View>
          <EmptyState title="Category not found" description="This category may have been removed." />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: colors.background }]}> 
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setEditModalVisible(true)}
              style={[styles.editButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
              <Ionicons name="create-outline" size={16} color={colors.text} />
              <Text style={[styles.editButtonText, { color: colors.text }]}>Edit</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.heroCard, { backgroundColor: `${category.color}16`, borderColor: `${category.color}40` }]}> 
          <View style={styles.heroHeader}>
            <View style={[styles.heroIcon, { backgroundColor: category.color }]}>
              <Ionicons name="folder-open-outline" size={18} color={colors.isLight ? '#0F172A' : '#F8FAFC'} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>{category.name}</Text>
              <Text numberOfLines={2} style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                {category.description || 'All tasks saved in this category.'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.statValue, { color: colors.text }]}>{totalTasks}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.statValue, { color: colors.text }]}>{completedTasks}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Done</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.statValue, { color: colors.text }]}>{remainingTasks}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Left</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          {[
            { label: 'All', value: 'all' as const },
            { label: 'Doing', value: 'todo' as const },
            { label: 'Done', value: 'done' as const },
            { label: 'N/A', value: 'not-available' as const },
          ].map((option) => {
            const active = taskFilter === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setTaskFilter(option.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? category.color : colors.surfaceMuted,
                    borderColor: active ? category.color : colors.border,
                  },
                ]}>
                <Text style={[styles.filterChipText, { color: active ? (colors.isLight ? '#0F172A' : '#F8FAFC') : colors.textSoft }]}>{option.label}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={styles.filterButton}
            onPress={() => setSortSheetVisible(true)}
          >
            <Ionicons name="filter-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <DraggableFlatList
          onDragEnd={({ data }) => {
            reorderTasks(data.map(t => t.id));
            if (sortMode !== 'manual') setSortMode('manual');
          }}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(92, insets.bottom + 80) }]}
          data={categoryTasks}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState title="No tasks here" description="Tasks in this category will appear here." />}
          renderItem={({ item, drag, isActive }: RenderItemParams<Task>) => (
            <VerticalScaleDecorator activeScale={1.03}>
              <TaskItem
                task={item}
                category={{ color: category.color, name: category.name }}
                timeFormat={timeFormat}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onNotAvailable={handleNotAvailable}
                onEdit={(task) => setEditingTask(task)}
                onLongPress={!isActive ? drag : undefined}
              />
            </VerticalScaleDecorator>
          )}
          showsVerticalScrollIndicator={false}
        />
        <FloatingActionButton iconName="add" onPress={() => setIsAddingTask(true)} />
      </View>

      <CategoryFormModal
        visible={editModalVisible}
        initialCategory={category}
        onClose={() => setEditModalVisible(false)}
        onSaved={() => setEditModalVisible(false)}
      />

      <TaskFormModal
        visible={!!editingTask || isAddingTask}
        initialTask={editingTask}
        defaultCategoryId={category.id}
        onClose={() => {
          setEditingTask(undefined);
          setIsAddingTask(false);
        }}
      />

      <SettingsOptionSheet
        visible={sortSheetVisible}
        title="Sort Todos"
        iconName="swap-vertical-outline"
        options={SORT_OPTIONS.filter(o => o.value !== 'manual')}
        selectedValue={sortMode}
        onClose={() => setSortSheetVisible(false)}
        onSelect={setSortMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  archiveButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editButtonText: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  heroIcon: {
    alignItems: 'center',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  statCard: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statValue: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: AppFonts.medium,
    fontSize: 11,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: {
    color: '#F8FAFC',
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  filterButton: {
    marginLeft: 'auto',
    padding: 6,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
