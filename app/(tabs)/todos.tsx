import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { FloatingActionButton } from '@/components/floating-action-button';
import { SegmentedControl } from '@/components/segmented-control';
import { TaskItem } from '@/components/task-item';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { TaskStatus } from '@/types/task';
import { runListAnimation } from '@/utils/layout-animation';

const FILTER_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: 'To Do', value: 'todo' },
  { label: 'Done', value: 'done' },
];

export default function TodosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const colors = useAppTheme();

  const tasks = useTaskStore((state) => state.tasks);
  const categories = useTaskStore((state) => state.categories);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const initialCategory = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
  const [activeFilter, setActiveFilter] = useState<TaskStatus>('todo');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategoryId(initialCategory);
    }
  }, [initialCategory]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = task.status === activeFilter;
      const matchesCategory = selectedCategoryId === 'all' ? true : task.categoryId === selectedCategoryId;
      return matchesStatus && matchesCategory;
    });
  }, [activeFilter, selectedCategoryId, tasks]);

  const todoCount = tasks.filter((task) => task.status === 'todo').length;
  const doneCount = tasks.length - todoCount;
  const activeCategory = categories.find((category) => category.id === selectedCategoryId);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <Text style={[styles.title, { color: colors.text }]}>All Todos</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Small steps still move things forward.</Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Status</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{todoCount} pending</Text>
          </View>
          <Text style={[styles.summaryMeta, { color: colors.textSoft }]}>{doneCount} completed</Text>
        </View>

        <SegmentedControl options={FILTER_OPTIONS} value={activeFilter} onChange={setActiveFilter} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
          <Pressable
            onPress={() => setSelectedCategoryId('all')}
            style={[styles.chip, { backgroundColor: selectedCategoryId === 'all' ? colors.accent : colors.surfaceMuted }]}>
            <Text style={styles.chipText}>All</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategoryId(category.id)}
              style={[styles.chip, { backgroundColor: selectedCategoryId === category.id ? category.color : colors.surfaceMuted }]}>
              <Text style={styles.chipText}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {activeCategory ? (
          <Text style={[styles.filterHint, { color: colors.textMuted }]}>Showing {activeFilter} tasks in {activeCategory.name}</Text>
        ) : null}

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredTasks.length ? (
            filteredTasks.map((item) => (
              <TaskItem
                key={item.id}
                task={item}
                onDelete={(id) => {
                  runListAnimation();
                  deleteTask(id);
                }}
                onToggle={(id) => {
                  runListAnimation();
                  toggleTaskStatus(id);
                }}
              />
            ))
          ) : (
            <EmptyState title="No tasks in this view" description="Pick one thing and get it moving." />
          )}
        </ScrollView>

        <FloatingActionButton onPress={() => router.push({ pathname: '/add-task', params: selectedCategoryId !== 'all' ? { categoryId: selectedCategoryId } : undefined })} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8, marginTop: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  summaryCard: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  summaryLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  summaryMeta: { fontSize: 14, fontWeight: '600' },
  chipsRow: { marginTop: 14, maxHeight: 44 },
  chipsContent: { alignItems: 'center', gap: 10, paddingRight: 16 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  chipText: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  filterHint: { fontSize: 13, marginTop: 12 },
  listContent: { flexGrow: 1, paddingBottom: 100, paddingTop: 16 },
});
