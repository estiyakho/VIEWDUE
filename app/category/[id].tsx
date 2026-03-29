import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryFormModal } from '@/components/category-form-modal';
import { TaskFormModal } from '@/components/task-form-modal';
import { EmptyState } from '@/components/empty-state';
import { TaskItem } from '@/components/task-item';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { Task, TaskStatus } from '@/types/task';
import { runListAnimation } from '@/utils/layout-animation';

type CategoryTaskFilter = 'all' | TaskStatus;

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colors = useAppTheme();
  const categories = useTaskStore((state) => state.categories);
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const archiveCategory = useTaskStore((state) => state.archiveCategory);
  const unarchiveCategory = useTaskStore((state) => state.unarchiveCategory);
  const timeFormat = useTaskStore((state) => state.settings.timeFormat);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [taskFilter, setTaskFilter] = useState<CategoryTaskFilter>('all');

  const categoryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const category = categories.find((item) => item.id === categoryId);

  const categoryTasks = useMemo(() => {
    const filtered = tasks.filter((task) => task.categoryId === categoryId);

    if (taskFilter === 'all') {
      return filtered;
    }

    return filtered.filter((task) => task.status === taskFilter);
  }, [categoryId, taskFilter, tasks]);

  const totalTasks = tasks.filter((task) => task.categoryId === categoryId).length;
  const completedTasks = tasks.filter((task) => task.categoryId === categoryId && task.status === 'done').length;
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

  if (!category) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}> 
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}> 
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
          </View>
          <EmptyState title="Category not found" description="This category may have been removed." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
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
              <Ionicons name="folder-open-outline" size={18} color="#F8FAFC" />
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
                <Text style={styles.filterChipText}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={categoryTasks}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState title="No tasks here" description="Tasks in this category will appear here." />}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              category={{ color: category.color, name: category.name }}
              timeFormat={timeFormat}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onEdit={(task) => setEditingTask(task)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <CategoryFormModal
        visible={editModalVisible}
        initialCategory={category}
        onClose={() => setEditModalVisible(false)}
        onSaved={() => setEditModalVisible(false)}
      />

      <TaskFormModal
        visible={!!editingTask}
        initialTask={editingTask}
        defaultCategoryId={category.id}
        onClose={() => setEditingTask(undefined)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
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
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  heroIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
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
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statValue: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
    marginBottom: 0,
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
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});