import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsOptionSheet } from "@/components/settings-option-sheet";
import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTaskStore } from "@/store/use-task-store";
import { getMonthGrid, getWeekdayLabels } from "@/utils/calendar";
import { getHistoryDateString } from "@/utils/date-utils";
import { TaskStatus } from "@/types/task";

function StatBox({
  icon,
  label,
  value,
  tint,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
  colors: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View
      style={[
        styles.statBox,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${tint}22` }]}>
        <Ionicons color={tint} name={icon} size={22} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function StatisticsScreen() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const accent = colors.accent;
  const tasks = useTaskStore((state) => state.tasks);
  const taskHistory = useTaskStore((state) => state.taskHistory);
  const categories = useTaskStore((state) => state.categories);
  const firstDayOfWeek = useTaskStore((state) => state.settings.firstDayOfWeek);

  const [historyViewMode, setHistoryViewMode] = useState<"weekly" | "monthly">("weekly");
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string | undefined>(undefined);
  const [isTaskSelectorVisible, setIsTaskSelectorVisible] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState(new Date());
  const [overviewPeriod, setOverviewPeriod] = useState<"today" | "week" | "month" | "all">("today");

  const handlePrevMonth = () => {
    const d = new Date(snapshotDate);
    d.setMonth(d.getMonth() - 1);
    setSnapshotDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(snapshotDate);
    d.setMonth(d.getMonth() + 1);
    setSnapshotDate(d);
  };

  const overviewStats = useMemo(() => {
    const now = new Date();
    const todayStr = getHistoryDateString(now);

    let startStr = "";
    if (overviewPeriod === "today") {
      startStr = todayStr;
    } else if (overviewPeriod === "week") {
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const firstDayIndex = dayNames.indexOf(firstDayOfWeek);
      const currentDayIndex = now.getDay();
      const daysToSubtract = (currentDayIndex - firstDayIndex + 7) % 7;
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - daysToSubtract);
      startStr = getHistoryDateString(startDate);
    } else if (overviewPeriod === "month") {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startStr = getHistoryDateString(startDate);
    } else {
      // For "all", we start from the beginning of recorded history
      startStr = "0000-00-00"; 
    }

    let done = 0;
    let missed = 0;
    let na = 0;

    // 1. Aggregate ALL historical stats in range (including tasks that may have been deleted)
    const historyInRange = taskHistory.filter(h => h.date >= startStr && h.date < todayStr);
    
    done += historyInRange.filter(h => h.status === 'done').length;
    missed += historyInRange.filter(h => h.status === 'todo').length;
    na += historyInRange.filter(h => h.status === 'not-available').length;

    // 2. Add current day stats from active tasks if "Today" is in range
    if (todayStr >= startStr) {
      tasks.forEach(task => {
        // Skip archived categories
        const category = categories.find(c => c.id === task.categoryId);
        if (category?.isArchived) return;

        if (task.status === 'done') done++;
        else if (task.status === 'todo') missed++;
        else if (task.status === 'not-available') na++;
      });
    }

    const completion = (done + missed) > 0 ? Math.round((done / (done + missed)) * 100) : 0;

    return { done, missed, na, completion };
  }, [overviewPeriod, tasks, taskHistory, firstDayOfWeek, categories]);


  const availableHistoryTasks = useMemo(() => {
    const combined = [
      ...taskHistory.map((h) => ({ title: h.title, categoryId: h.categoryId })),
      ...tasks.map((t) => ({ title: t.title, categoryId: t.categoryId })),
    ];

    const uniqueMap = new Map<string, { title: string; categoryId?: string }>();
    combined.forEach((entry) => {
      const key = `${entry.title}|${entry.categoryId || ""}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, entry);
      }
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((entry) => {
        const category = entry.categoryId ? categories.find((c) => c.id === entry.categoryId) : undefined;
        return {
          label: entry.title,
          value: `${entry.title}|${entry.categoryId || ""}`,
          color: category?.color,
        };
      });
  }, [taskHistory, tasks, categories]);

  const currentSelectedTaskIdentity = selectedTaskTitle || availableHistoryTasks[0]?.value;
  const currentTaskColor = availableHistoryTasks.find(t => t.value === currentSelectedTaskIdentity)?.color || accent;

  const weeklyStats = useMemo(() => {
    if (!currentSelectedTaskIdentity) return [0, 0, 0];
    const [title, categoryId] = currentSelectedTaskIdentity.split("|");

    // 1. Total Done (Historical + Current State)
    const historyDone = taskHistory.filter(
      (h) => h.title === title && (h.categoryId || "") === categoryId && h.status === "done"
    ).length;

    const activeTask = tasks.find(t => t.title === title && (t.categoryId || "") === categoryId);
    const currentDone = activeTask?.status === 'done' ? 1 : 0;
    const total = historyDone + currentDone;

    // 2. Weekly Consistency calculation
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const firstDayIndex = dayNames.indexOf(firstDayOfWeek);
    const currentDayIndex = now.getDay();
    const daysToSubtract = (currentDayIndex - firstDayIndex + 7) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = getHistoryDateString(weekStart);

    const weeklyDoneInHistory = taskHistory.filter(
      (h) => h.title === title && (h.categoryId || "") === categoryId && h.date >= weekStartStr && h.status === "done"
    ).length;

    const weeklyDoneTotal = weeklyDoneInHistory + currentDone;

    const interval = activeTask?.resetInterval || 'none';
    let goal = 1;
    if (interval === 'daily') goal = 7;

    return [total, weeklyDoneTotal, goal];
  }, [currentSelectedTaskIdentity, taskHistory, tasks, firstDayOfWeek]);

  const [totalDone, weeklyDoneTotal, weeklyGoal] = weeklyStats;


  const historyChartData = useMemo(() => {
    if (!currentSelectedTaskIdentity) return [];
    const [title, categoryId] = currentSelectedTaskIdentity.split("|");

    const data = [];
    const now = new Date();

    if (historyViewMode === "weekly") {
      // Start from the beginning of the current week based on firstDayOfWeek
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const firstDayIndex = dayNames.indexOf(firstDayOfWeek);
      const currentDayIndex = now.getDay();
      const daysToSubtract = (currentDayIndex - firstDayIndex + 7) % 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToSubtract);
      weekStart.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const count = taskHistory.filter(
          (h) => h.title === title && (h.categoryId || "") === categoryId && h.date === dateStr && h.status === 'done'
        ).length;
        data.push({
          date: dateStr,
          day: d.getDate(),
          weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
          count,
        });
      }
    } else {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const count = taskHistory.filter(
          (h) => h.title === title && (h.categoryId || "") === categoryId && h.date === dateStr && h.status === 'done'
        ).length;
        data.push({
          date: dateStr,
          day: d.getDate(),
          weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
          count,
        });
      }
    }
    return data;
  }, [currentSelectedTaskIdentity, historyViewMode, taskHistory, firstDayOfWeek]);

  const maxHistoryCount = Math.max(...historyChartData.map((d: any) => d.count)) || 1;

  const snapshotData = useMemo(() => {
    if (!currentSelectedTaskIdentity) return [];
    const [title, categoryId] = currentSelectedTaskIdentity.split("|");

    const grid = getMonthGrid(snapshotDate, firstDayOfWeek);
    const now = new Date();
    const todayStr = getHistoryDateString(now);

    const activeTask = tasks.find(t => t.title === title && (t.categoryId || "") === categoryId);
    const creationDate = activeTask ? getHistoryDateString(new Date(activeTask.createdAt)) : todayStr;
    const historyForTask = taskHistory.filter(h => h.title === title && (h.categoryId || "") === categoryId);
    const oldestHistory = historyForTask.length > 0 
      ? historyForTask.sort((a, b) => a.date.localeCompare(b.date))[0].date 
      : creationDate;
    const taskStart = creationDate < oldestHistory ? creationDate : oldestHistory;

    return grid.map((cell: any) => {
      const d = cell.date;
      const dateStr = getHistoryDateString(d);
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const isWithinSpan = dateStr >= taskStart;

      // Find status from history or current task
      let status: TaskStatus | undefined;
      if (isToday) {
        status = activeTask?.status;
      } else {
        const historyEntry = historyForTask.find(h => h.date === dateStr);
        status = historyEntry?.status;
      }

      return {
        date: dateStr,
        dayNum: d.getDate(),
        status,
        isToday,
        isFuture,
        isWithinSpan,
        isCurrentMonth: cell.inCurrentMonth
      };
    });
  }, [currentSelectedTaskIdentity, taskHistory, tasks, firstDayOfWeek, snapshotDate]);

  const filteredSnapshotData = useMemo(() => {
    // Always return the full grid (42 items / 6 rows) as requested
    return snapshotData;
  }, [snapshotData]);

  return (
    <View
      style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Statistics</Text>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Pressable
              onPress={() => setIsTaskSelectorVisible(true)}
              style={[styles.taskSelector, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              {(() => {
                const identity = availableHistoryTasks.find(t => t.value === currentSelectedTaskIdentity);
                return (
                  <>
                    {identity?.color ? (
                      <View style={[styles.inlineDot, { backgroundColor: identity.color }]} />
                    ) : (
                      <Ionicons name="bookmark" size={16} color={accent} />
                    )}
                    <Text style={[styles.taskSelectorText, { color: colors.text }]} numberOfLines={1}>
                      {identity?.label || "No Tasks Yet"}
                    </Text>
                  </>
                );
              })()}
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </Pressable>

            <View style={[styles.modeToggle, { backgroundColor: colors.surfaceMuted }]}>
              <Pressable
                onPress={() => setHistoryViewMode("weekly")}
                style={[styles.modeBtn, historyViewMode === "weekly" && { backgroundColor: colors.surfaceElevated }]}
              >
                <Text style={[styles.modeBtnText, { color: historyViewMode === "weekly" ? colors.text : colors.textMuted }]}>W</Text>
              </Pressable>
              <Pressable
                onPress={() => setHistoryViewMode("monthly")}
                style={[styles.modeBtn, historyViewMode === "monthly" && { backgroundColor: colors.surfaceElevated }]}
              >
                <Text style={[styles.modeBtnText, { color: historyViewMode === "monthly" ? colors.text : colors.textMuted }]}>M</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.chartCard, { backgroundColor: colors.surfaceElevated, borderColor: currentTaskColor, borderWidth: 2 }]}>
            <View style={styles.headerWithIcon}>
              <View style={[styles.inlineDot, { backgroundColor: currentTaskColor, width: 4, height: 16, borderRadius: 2 }]} />
              <Text style={[styles.chartTitle, { color: colors.text, marginBottom: 0 }]}>
                {historyViewMode === "weekly" ? "Week View" : "Month View"}
              </Text>
            </View>
            {currentSelectedTaskIdentity ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChart}>
                <View style={[styles.chartArea, { minWidth: historyViewMode === "weekly" ? '100.1%' : 800, height: 120, alignItems: 'flex-end' }]}>
                  {historyChartData.map((item: any) => (
                    <View key={item.date} style={[styles.barWrap, { minWidth: historyViewMode === "weekly" ? 44 : 32 }]}>
                      <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted, height: 60, width: 18 }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: item.count > 0 ? accent : 'transparent',
                              height: '100%',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.histDate, { color: colors.text, fontSize: 11 }]} numberOfLines={1}>
                        {item.day}
                      </Text>
                      <Text style={[styles.histWeekday, { color: colors.textSoft, fontSize: 9 }]} numberOfLines={1}>
                        {item.weekday}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={[styles.chartArea, { height: 120, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.textMuted, fontFamily: AppFonts.medium }}>No Task Selected</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surfaceElevated, borderColor: currentTaskColor, borderWidth: 2, marginBottom: 20 }]}>
          <View style={styles.historyHeader}>
            <View style={styles.headerWithIcon}>
              <View style={[styles.inlineDot, { backgroundColor: currentTaskColor, width: 4, height: 16, borderRadius: 2 }]} />
              <Text style={[styles.chartTitle, { color: colors.text, marginBottom: 0 }]}>Snap Shot</Text>
            </View>

            <View style={styles.navRow}>
              <Pressable onPress={handlePrevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={16} color={colors.textSoft} />
              </Pressable>

              <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: AppFonts.bold, minWidth: 100, textAlign: 'center' }}>
                {snapshotDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </Text>

              <Pressable
                onPress={handleNextMonth}
                style={[styles.navBtn, snapshotDate.getMonth() === new Date().getMonth() && snapshotDate.getFullYear() === new Date().getFullYear() && { opacity: 0.3 }]}
                disabled={snapshotDate.getMonth() === new Date().getMonth() && snapshotDate.getFullYear() === new Date().getFullYear()}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.textSoft} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.snapshotGridWrapper, { marginTop: 16 }]}>
            <View style={styles.snapshotDayLabels}>
              {getWeekdayLabels(firstDayOfWeek).map((day: string, idx: number) => (
                <Text key={idx} style={[styles.snapshotDayText, { color: colors.textSoft }]}>
                  {day.charAt(0)}
                </Text>
              ))}
            </View>
            <View style={styles.snapshotGrid}>
              {filteredSnapshotData.map((item: any) => {
                const identity = availableHistoryTasks.find(t => t.value === currentSelectedTaskIdentity);
                const categoryColor = identity?.color || accent;
                
                const isDone = item.status === 'done';
                const isNA = item.status === 'not-available';
                const isPast = !item.isFuture && !item.isToday;
                
                let backgroundColor = 'transparent';
                let borderColor = colors.surfaceMuted;
                let opacity = 1;

                if (item.isCurrentMonth) {
                  if (isDone) {
                    backgroundColor = accent;
                    borderColor = accent;
                  } else if (item.isToday) {
                    borderColor = accent;
                    opacity = 1;
                  } else if (isPast && item.isWithinSpan && !isNA) {
                    // Only show missed border for past days within lifespan that aren't N/A
                    borderColor = categoryColor;
                    opacity = 0.5;
                  } else {
                    // Future, N/A, or Out of Span (but in month)
                    borderColor = colors.border;
                    opacity = 0.3;
                  }
                } else {
                  // Out of month
                  opacity = 0.05;
                  if (isDone) backgroundColor = accent;
                  else backgroundColor = colors.textMuted;
                }

                return (
                  <View
                    key={item.date}
                    style={[
                      styles.snapshotBlock,
                      {
                        backgroundColor,
                        borderColor,
                        borderWidth: 2,
                        opacity
                      }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.snapshotDayNum, 
                        { 
                          color: isDone ? (colors.isLight ? '#fff' : '#000') : colors.textSoft,
                          opacity: item.isCurrentMonth ? 1 : 0.5
                        }
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: accent }]} />
                <Text style={[styles.legendText, { color: colors.textSoft }]}>Done</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: availableHistoryTasks.find(t => t.value === currentSelectedTaskIdentity)?.color || accent, borderWidth: 1 }]} />
                <Text style={[styles.legendText, { color: colors.textSoft }]}>Missed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: accent, borderWidth: 1 }]} />
                <Text style={[styles.legendText, { color: colors.textSoft }]}>Today</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surfaceElevated, borderColor: currentTaskColor, borderWidth: 2, marginBottom: 24 }]}>
          <View style={styles.wideCardContent}>
            <View style={[styles.wideCardIconWrap, { backgroundColor: `${currentTaskColor}22` }]}>
              <Ionicons name="flash" size={24} color={currentTaskColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.wideCardLabel, { color: colors.textSoft }]}>Weekly Completed</Text>
              <Text style={[styles.wideCardValue, { color: colors.text }]}>{weeklyDoneTotal} Times</Text>
            </View>
          </View>
        </View>

        {/* Global Separator */}
        <View style={styles.globalSeparator}>
          <View style={[styles.separatorStrip, { backgroundColor: currentTaskColor }]} />
          <Text style={[styles.separatorText, { color: colors.textSoft }]}>GLOBAL OVERVIEW</Text>
          <View style={[styles.separatorStrip, { backgroundColor: currentTaskColor }]} />
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Task Overview
            </Text>
            <View style={[styles.periodToggle, { backgroundColor: colors.surfaceMuted }]}>
              {(["today", "week", "month", "all"] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setOverviewPeriod(p)}
                  style={[styles.periodBtn, overviewPeriod === p && { backgroundColor: colors.surfaceElevated }]}
                >
                  <Text style={[styles.periodBtnText, { color: overviewPeriod === p ? colors.text : colors.textMuted }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatBox
              colors={colors}
              icon="checkmark-done-circle-outline"
              label="Done"
              tint={accent}
              value={`${overviewStats.done}`}
            />
            <StatBox
              colors={colors}
              icon="close-circle-outline"
              label="Did Not Do"
              tint={colors.danger}
              value={`${overviewStats.missed}`}
            />
            <StatBox
              colors={colors}
              icon="eye-off-outline"
              label="Not Available"
              tint={colors.textSoft}
              value={`${overviewStats.na}`}
            />
            <StatBox
              colors={colors}
              icon="trending-up-outline"
              label="Completion"
              tint={colors.warning}
              value={`${overviewStats.completion}%`}
            />
          </View>
        </View>


      </ScrollView>

      <SettingsOptionSheet
        visible={isTaskSelectorVisible}
        title="Select Task"
        iconName="bookmark-outline"
        options={availableHistoryTasks}
        selectedValue={currentSelectedTaskIdentity}
        onClose={() => setIsTaskSelectorVisible(false)}
        onSelect={(val) => {
          setSelectedTaskTitle(val as string);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 16, paddingHorizontal: 14, paddingTop: 6 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  statBox: {
    borderRadius: 16,
    borderWidth: 1,
    width: '48.5%',
    aspectRatio: 1.25,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconWrap: {
    alignItems: "center",
    borderRadius: 12,
    height: 32,
    width: 32,
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 11,
    textAlign: 'center',
  },
  wideCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wideCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wideCardLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 12,
    marginBottom: 2,
  },
  wideCardValue: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
  },
  headerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  globalSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  separatorStrip: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    opacity: 0.3,
  },
  separatorText: {
    fontFamily: AppFonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  sectionWrap: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
    marginBottom: 6,
  },
  histDate: {
    fontFamily: AppFonts.bold,
    marginTop: 8,
    textAlign: 'center',
  },
  histWeekday: {
    fontFamily: AppFonts.medium,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  periodToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  periodBtnText: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  historySection: {
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  taskSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  inlineDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
    marginRight: 2,
  },
  taskSelectorText: {
    flex: 1,
    fontFamily: AppFonts.bold,
    fontSize: 14,
  },
  modeToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  modeBtnText: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  horizontalChart: {
    marginTop: 8,
  },
  snapshotGridWrapper: {
    paddingHorizontal: 4,
  },
  snapshotDayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  snapshotDayText: {
    fontFamily: AppFonts.bold,
    fontSize: 10,
    width: 42,
    textAlign: 'center',
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  snapshotBlock: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  snapshotDayNum: {
    fontFamily: AppFonts.bold,
    fontSize: 11,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: AppFonts.medium,
    fontSize: 11,
  },
  rowTwo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  miniCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  miniValue: {
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
  chartCard: {
    borderRadius: 22,
    borderWidth: 2,
    marginBottom: 8,
    padding: 8,
  },
  chartTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 12,
  },
  chartArea: {
    alignItems: "flex-end",
    flexDirection: "row",
    height: 140,
    justifyContent: "space-between",
  },
  barWrap: {
    alignItems: "center",
    flex: 1,
  },
  barTrack: {
    borderRadius: 999,
    height: 100,
    justifyContent: "flex-end",
    overflow: "hidden",
    width: 18,
  },
  barFill: {
    borderRadius: 999,
    width: "100%",
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    padding: 4,
  },
});
