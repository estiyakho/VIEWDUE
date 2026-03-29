import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingActionButton } from '@/components/floating-action-button';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { getMonthGrid, getWeekdayLabels } from '@/utils/calendar';
import { formatMonthLabel, toDayKey } from '@/utils/date';

const GRID_COLUMNS = 7;
const GRID_GAP = 10;
const CARD_HORIZONTAL_PADDING = 28;

type FilterTab = 'todo' | 'done';

function parseHexColor(value: string) {
  const hex = value.replace('#', '');
  if (hex.length !== 6) return null;
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function readableTextOn(color: string) {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return '#F8FAFC';
  }
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? '#0F172A' : '#F8FAFC';
}

export default function CalendarScreen() {
  const colors = useAppTheme();
  const { width } = useWindowDimensions();
  const tasks = useTaskStore((state) => state.tasks);
  const settings = useTaskStore((state) => state.settings);

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => toDayKey(new Date()));
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todo');

  const weekdayLabels = useMemo(() => getWeekdayLabels(settings.firstDayOfWeek), [settings.firstDayOfWeek]);
  const monthGrid = useMemo(() => getMonthGrid(currentMonth, settings.firstDayOfWeek), [currentMonth, settings.firstDayOfWeek]);
  const selectedTasks = useMemo(() => {
    return tasks.filter((task) => toDayKey(task.createdAt) === selectedDay && task.status === activeFilter);
  }, [activeFilter, selectedDay, tasks]);

  const availableGridWidth = Math.max(width - CARD_HORIZONTAL_PADDING - 24, 280);
  const daySize = Math.floor((availableGridWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.header}>
          <Pressable onPress={() => setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.monthTitle, { color: colors.text }]}>{formatMonthLabel(currentMonth)}</Text>
          <Pressable style={[styles.modePill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}> 
            <Text style={[styles.modeText, { color: colors.textMuted }]}>Month</Text>
          </Pressable>
          <Pressable onPress={() => setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} style={styles.headerIcon}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {weekdayLabels.map((label) => (
            <Text key={label} style={[styles.weekday, { color: colors.textMuted }]}>{label}</Text>
          ))}
        </View>

        <View style={[styles.grid, { gap: GRID_GAP }]}> 
          {monthGrid.map((cell) => {
            const selected = cell.key === selectedDay;
            const labelColor = selected ? readableTextOn(colors.accent) : cell.inCurrentMonth ? colors.text : colors.textMuted;

            return (
              <Pressable
                key={cell.key}
                onPress={() => setSelectedDay(cell.key)}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: selected ? colors.accent : 'transparent',
                    height: daySize,
                    width: daySize,
                  },
                ]}>
                <Text style={[styles.dayNumber, { color: labelColor }]}>{cell.date.getDate()}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tabRow}>
          <Pressable onPress={() => setActiveFilter('todo')} style={styles.tabButton}>
            <Text style={[styles.tabLabel, { color: activeFilter === 'todo' ? colors.text : colors.textMuted }]}>Doing</Text>
            {activeFilter === 'todo' ? <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} /> : null}
          </Pressable>
          <Pressable onPress={() => setActiveFilter('done')} style={styles.tabButton}>
            <Text style={[styles.tabLabel, { color: activeFilter === 'done' ? colors.text : colors.textMuted }]}>Done</Text>
            {activeFilter === 'done' ? <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} /> : null}
          </Pressable>
          <Pressable style={styles.filterButton}>
            <Ionicons name="filter-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {selectedTasks.length ? (
            selectedTasks.map((task) => (
              <View key={task.id} style={[styles.todoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
                <Text style={[styles.todoTitle, { color: colors.text }]}>{task.title}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyBlock}>
              <View style={[styles.emptyIconWrap, { backgroundColor: `${colors.accent}33` }]}>
                <Ionicons name="calendar-outline" size={34} color={colors.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Add a Todo</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Todos of the day will appear here</Text>
            </View>
          )}
        </ScrollView>

        <FloatingActionButton onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 8 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  headerIcon: {
    padding: 6,
  },
  monthTitle: {
    flex: 1,
    fontFamily: AppFonts.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  modePill: {
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeText: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekday: {
    flex: 1,
    fontFamily: AppFonts.semibold,
    fontSize: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: AppFonts.semibold,
    fontSize: 18,
    textAlign: 'center',
  },
  tabRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  tabButton: {
    marginRight: 24,
    paddingBottom: 12,
    position: 'relative',
  },
  tabLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 17,
  },
  tabIndicator: {
    borderRadius: 999,
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
    width: 36,
  },
  filterButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  body: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  todoCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  todoTitle: {
    fontFamily: AppFonts.semibold,
    fontSize: 16,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyIconWrap: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 20,
    width: 80,
  },
  emptyTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: AppFonts.medium,
    fontSize: 15,
    textAlign: 'center',
  },
});

