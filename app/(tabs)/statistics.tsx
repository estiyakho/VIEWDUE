import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';

export default function StatisticsScreen() {
  const colors = useAppTheme();
  const tasks = useTaskStore((state) => state.tasks);
  const categories = useTaskStore((state) => state.categories);
  const statsResetAt = useTaskStore((state) => state.settings.statsResetAt);

  const statsTasks = useMemo(() => {
    if (!statsResetAt) {
      return tasks;
    }

    const resetTime = new Date(statsResetAt).getTime();
    return tasks.filter((task) => new Date(task.createdAt).getTime() >= resetTime);
  }, [statsResetAt, tasks]);

  const total = statsTasks.length;
  const done = statsTasks.filter((task) => task.status === 'done').length;
  const todo = total - done;
  const completionRate = total ? Math.round((done / total) * 100) : 0;
  const recentTasks = statsTasks.filter((task) => Date.now() - new Date(task.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const categoryBreakdown = useMemo(() => {
    return categories
      .map((category) => {
        const categoryTasks = statsTasks.filter((task) => task.categoryId === category.id);
        const categoryDone = categoryTasks.filter((task) => task.status === 'done').length;
        return {
          ...category,
          total: categoryTasks.length,
          done: categoryDone,
        };
      })
      .filter((category) => category.total > 0)
      .sort((left, right) => right.total - left.total);
  }, [categories, statsTasks]);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Progress adds up faster than it feels.</Text>

        <View style={styles.grid}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Tasks</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completion</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{completionRate}%</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>To Do</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>{todo}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Last 7 Days</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>{recentTasks}</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Breakdown</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Keep showing up and the numbers will follow.</Text>
          {categoryBreakdown.length ? (
            categoryBreakdown.map((item) => {
              const percent = item.total ? Math.round((item.done / item.total) * 100) : 0;
              return (
                <View key={item.id} style={styles.breakdownRow}>
                  <View>
                    <Text style={[styles.breakdownTitle, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.breakdownMeta, { color: colors.textMuted }]}>{item.done}/{item.total} done</Text>
                  </View>
                  <Text style={[styles.breakdownPercent, { color: item.color }]}>{percent}%</Text>
                </View>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Your story starts as soon as you begin.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { borderRadius: 22, borderWidth: 1, minHeight: 110, padding: 16, width: '48%' },
  statLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  statValue: { fontSize: 28, fontWeight: '800' },
  sectionCard: { borderRadius: 24, borderWidth: 1, padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sectionSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  breakdownRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  breakdownTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  breakdownMeta: { fontSize: 13 },
  breakdownPercent: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 14 },
});
