import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { TaskItem } from '@/components/task-item';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { getMonthGrid, getWeekdayLabels } from '@/utils/calendar';
import { formatMonthLabel, toDayKey } from '@/utils/date';
import { runListAnimation } from '@/utils/layout-animation';

const GRID_COLUMNS = 7;
const GRID_GAP = 8;
const CARD_HORIZONTAL_PADDING = 32;

export default function CalendarScreen() {
  const colors = useAppTheme();
  const { width } = useWindowDimensions();
  const tasks = useTaskStore((state) => state.tasks);
  const settings = useTaskStore((state) => state.settings);
  const toggleTaskStatus = useTaskStore((state) => state.toggleTaskStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => toDayKey(new Date()));

  const weekdayLabels = useMemo(() => getWeekdayLabels(settings.firstDayOfWeek), [settings.firstDayOfWeek]);
  const monthGrid = useMemo(() => getMonthGrid(currentMonth, settings.firstDayOfWeek), [currentMonth, settings.firstDayOfWeek]);
  const taskCountByDay = useMemo(() => {
    return tasks.reduce<Record<string, number>>((acc, task) => {
      const key = toDayKey(task.createdAt);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [tasks]);
  const selectedTasks = useMemo(() => tasks.filter((task) => toDayKey(task.createdAt) === selectedDay), [selectedDay, tasks]);

  const availableGridWidth = Math.max(width - CARD_HORIZONTAL_PADDING - 40, 280);
  const daySize = Math.floor((availableGridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Every day is a clean square waiting for progress.</Text>

        <View style={[styles.calendarCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <View style={styles.monthHeader}>
            <Pressable onPress={() => setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} style={[styles.monthButton, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.text }]}>{formatMonthLabel(currentMonth)}</Text>
            <Pressable onPress={() => setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} style={[styles.monthButton, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekdayLabels.map((label) => (
              <Text key={label} style={[styles.weekday, { color: colors.textMuted }]}>{label}</Text>
            ))}
          </View>

          <View style={[styles.grid, { gap: GRID_GAP }]}> 
            {monthGrid.map((cell) => {
              const count = taskCountByDay[cell.key] ?? 0;
              const selected = cell.key === selectedDay;
              const labelColor = selected ? '#FFFFFF' : cell.inCurrentMonth ? colors.text : colors.textMuted;
              const countColor = selected ? '#FFFFFF' : colors.textMuted;

              return (
                <Pressable
                  key={cell.key}
                  onPress={() => setSelectedDay(cell.key)}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: selected ? colors.accent : colors.surfaceMuted,
                      borderColor: selected ? colors.accent : colors.border,
                      height: daySize,
                      opacity: cell.inCurrentMonth ? 1 : 0.58,
                      width: daySize,
                    },
                  ]}>
                  <Text style={[styles.dayNumber, { color: labelColor }]}>{cell.date.getDate()}</Text>
                  {count ? <Text style={[styles.dayCount, { color: countColor }]}>{count}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.dayCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <Text style={[styles.dayTitle, { color: colors.text }]}>Tasks on {selectedDay}</Text>
          <Text style={[styles.daySubtitle, { color: colors.textMuted }]}>{selectedTasks.length} tasks found</Text>
        </View>

        {selectedTasks.length ? (
          selectedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
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
          <EmptyState title="No tasks for this day" description="A quiet day is space for your next win." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  calendarCard: { borderRadius: 28, borderWidth: 1, marginBottom: 16, padding: 16 },
  monthHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  monthButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  monthTitle: { fontSize: 18, fontWeight: '800' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekday: { flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: -4,
    textAlign: 'center',
  },
  dayCount: {
    bottom: 10,
    fontSize: 10,
    fontWeight: '700',
    position: 'absolute',
    textAlign: 'center',
  },
  dayCard: { borderRadius: 22, borderWidth: 1, marginBottom: 14, padding: 16 },
  dayTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  daySubtitle: { fontSize: 13 },
});
