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
        <Ionicons color={tint} name={icon} size={18} />
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
  const statsResetAt = useTaskStore((state) => state.settings.statsResetAt);
  const firstDayOfWeek = useTaskStore((state) => state.settings.firstDayOfWeek);

  const [historyViewMode, setHistoryViewMode] = useState<"weekly" | "monthly">("weekly");
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string | undefined>(undefined);
  const [isTaskSelectorVisible, setIsTaskSelectorVisible] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState(new Date());
  const [overviewPeriod, setOverviewPeriod] = useState<"today" | "week" | "month">("today");

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

  const statsTasks = useMemo(() => {
    if (!statsResetAt) {
      return tasks;
    }

    const resetTime = new Date(statsResetAt).getTime();
    return tasks.filter(
      (task) => new Date(task.createdAt).getTime() >= resetTime,
    );
  }, [statsResetAt, tasks]);

  const overviewStats = useMemo(() => {
    const now = new Date();
    const todayStr = getHistoryDateString(now);

    let startDate = new Date(now);
    if (overviewPeriod === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (overviewPeriod === "week") {
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const firstDayIndex = dayNames.indexOf(firstDayOfWeek);
      const currentDayIndex = now.getDay();
      const daysToSubtract = (currentDayIndex - firstDayIndex + 7) % 7;
      startDate.setDate(now.getDate() - daysToSubtract);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startStr = getHistoryDateString(startDate);

    // 1. Get historical stats from history (excluding today to avoid double counting with current tasks)
    const historyInRange = taskHistory.filter(h => h.date >= startStr && h.date < todayStr);

    let done = historyInRange.filter(h => h.status === 'done').length;
    let missed = historyInRange.filter(h => h.status === 'todo').length;
    let na = historyInRange.filter(h => h.status === 'not-available').length;

    // 2. Add current day stats from active tasks
    tasks.forEach(task => {
      // Skip tasks in archived categories
      const category = categories.find(c => c.id === task.categoryId);
      if (category?.isArchived) return;

      if (task.status === 'done') done++;
      else if (task.status === 'todo') missed++;
      else if (task.status === 'not-available') na++;
    });

    const completion = (done + missed) > 0 ? Math.round((done / (done + missed)) * 100) : 0;

    return { done, missed, na, completion };
  }, [overviewPeriod, tasks, taskHistory, firstDayOfWeek]);

  const weekdayCounts = useMemo(() => {
    const dayNames: string[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayLabels: string[] = [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ];

    // Create ordered arrays based on firstDayOfWeek
    const firstDayIndex = dayNames.indexOf(firstDayOfWeek);
    const orderedDayLabels: string[] = [];
    const orderedDayIndices: number[] = [];

    for (let i = 0; i < 7; i++) {
      const dayIndex = (firstDayIndex + i) % 7;
      orderedDayLabels.push(dayLabels[dayIndex]);
      orderedDayIndices.push(dayIndex);
    }

    return orderedDayLabels.map((day, index) => ({
      day,
      count: statsTasks.filter((task) => {
        if (task.status !== "done") return false;
        const taskDay = new Date(task.createdAt).getDay();
        return taskDay === orderedDayIndices[index];
      }).length,
    }));
  }, [statsTasks, firstDayOfWeek]);


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

  const hourlyStats = useMemo(() => {
    const counts = Array(24).fill(0);
    if (!currentSelectedTaskIdentity) return counts;
    const [title, categoryId] = currentSelectedTaskIdentity.split("|");

    const relevantHistory = taskHistory.filter(
      (h) => h.title === title && (h.categoryId || "") === categoryId && h.status === "done"
    );

    relevantHistory.forEach(h => {
      const hour = new Date(h.completedAt || h.date).getHours();
      counts[hour]++;
    });

    return counts;
  }, [currentSelectedTaskIdentity, taskHistory]);

  const [currentStreak, longestStreak] = useMemo(() => {
    if (!currentSelectedTaskIdentity || taskHistory.length === 0) return [0, 0];
    const [title, categoryId] = currentSelectedTaskIdentity.split("|");

    const relevantHistory = taskHistory.filter(
      (h) => h.title === title && (h.categoryId || "") === categoryId && h.status === "done"
    );

    if (relevantHistory.length === 0) return [0, 0];

    const uniqueDates = Array.from(new Set(relevantHistory.map((h) => h.date))).sort(
      (a, b) => b.localeCompare(a)
    );

    let current = 0;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let cursor = uniqueDates.includes(today) ? today : (uniqueDates.includes(yesterdayStr) ? yesterdayStr : null);

    if (cursor) {
      let checkDate = new Date(cursor);
      while (true) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (uniqueDates.includes(dateStr)) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    let max = 0;
    let tempMax = 0;
    let prevDate: Date | null = null;
    const sortedDatesStr = [...uniqueDates].sort((a, b) => a.localeCompare(b));

    for (const dateStr of sortedDatesStr) {
      const currDate = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempMax++;
        } else {
          tempMax = 1;
        }
      } else {
        tempMax = 1;
      }
      max = Math.max(max, tempMax);
      prevDate = currDate;
    }

    return [current, max];
  }, [currentSelectedTaskIdentity, taskHistory]);

  const maxWeekday = Math.max(...weekdayCounts.map((item) => item.count)) || 1;
  const maxHourlyCount = Math.max(...hourlyStats) || 1;

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
          (h) => h.title === title && (h.categoryId || "") === categoryId && h.date === dateStr
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

    return grid.map((cell: any) => {
      const d = cell.date;
      const dateStr = getHistoryDateString(d);
      const count = taskHistory.filter(
        (h) => h.title === title && (h.categoryId || "") === categoryId && h.date === dateStr && h.status === 'done'
      ).length;

      return {
        date: dateStr,
        count,
        isCurrentMonth: cell.inCurrentMonth
      };
    });
  }, [currentSelectedTaskIdentity, taskHistory, firstDayOfWeek, snapshotDate]);

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

          <View style={[styles.chartCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Week View</Text>
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

        <View style={[styles.chartCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginBottom: 20 }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.chartTitle, { color: colors.text, marginBottom: 0 }]}>Snap Shot</Text>

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
                let opacity = 0.03; // Out of month
                if (item.isCurrentMonth) {
                  opacity = item.count > 0 ? (item.count === 1 ? 0.4 : 1) : 0.1;
                } else if (item.count > 0) {
                  // Even if out of month, show color but ghosted
                  opacity = 0.15;
                }

                return (
                  <View
                    key={item.date}
                    style={[
                      styles.snapshotBlock,
                      {
                        backgroundColor: item.count > 0 ? accent : colors.textMuted,
                        opacity
                      }
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Task Streak</Text>
          <View style={styles.rowTwo}>
            <View
              style={[
                styles.miniCard,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: 'transparent',
                },
              ]}
            >
              <Ionicons color={accent} name="flash-outline" size={16} />
              <Text style={[styles.miniValue, { color: colors.text }]}>
                {currentStreak} Current
              </Text>
            </View>
            <View
              style={[
                styles.miniCard,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: 'transparent',
                },
              ]}
            >
              <Ionicons color={accent} name="ribbon-outline" size={16} />
              <Text style={[styles.miniValue, { color: colors.text }]}>
                {longestStreak} Longest
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Task Overview
            </Text>
            <View style={[styles.periodToggle, { backgroundColor: colors.surfaceMuted }]}>
              {(["today", "week", "month"] as const).map((p) => (
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


        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Weekly Activity
          </Text>
          <View style={styles.chartArea}>
            {weekdayCounts.map((item) => (
              <View key={item.day} style={styles.barWrap}>
                <View
                  style={[
                    styles.barTrack,
                    { backgroundColor: colors.surfaceMuted },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: accent,
                        height: `${(item.count / maxWeekday) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                  {item.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Hourly Activity
          </Text>
          <View style={[styles.snapshotGridWrapper, { marginTop: 8 }]}>
            <View style={styles.snapshotGrid}>
              {hourlyStats.map((count, hour) => {
                const opacity = count > 0 ? (count / maxHourlyCount) * 0.8 + 0.2 : 0.05;
                return (
                  <View
                    key={hour}
                    style={[
                      styles.snapshotBlock,
                      {
                        backgroundColor: count > 0 ? accent : colors.textMuted,
                        opacity
                      }
                    ]}
                  >
                    {hour % 6 === 0 && (
                      <Text style={[styles.hourLabelHint, { color: colors.textSoft }]}>
                        {hour === 0 ? '12A' : hour === 12 ? '12P' : `${hour % 12}${hour < 12 ? 'A' : 'P'}`}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            <View style={[styles.snapshotFooter, { marginTop: 12, alignItems: 'flex-start' }]}>
              <Text style={[styles.snapshotFooterText, { color: colors.textMuted }]}>
                Shows task performance trends per hour (12AM → 11PM)
              </Text>
            </View>
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
  container: { paddingBottom: 28, paddingHorizontal: 14, paddingTop: 10 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 92,
    padding: 12,
    width: "48.4%",
  },
  statIconWrap: {
    alignItems: "center",
    borderRadius: 10,
    height: 28,
    justifyContent: "center",
    marginBottom: 8,
    width: 28,
  },
  statValue: {
    fontFamily: AppFonts.bold,
    fontSize: 24,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
  },
  sectionWrap: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 22,
    marginBottom: 10,
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
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    width: 32,
    textAlign: 'center',
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  snapshotBlock: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourLabelHint: {
    fontFamily: AppFonts.bold,
    fontSize: 8,
    position: 'absolute',
    bottom: -14,
  },
  snapshotFooter: {
    marginTop: 14,
    alignItems: 'center',
  },
  snapshotFooterText: {
    fontFamily: AppFonts.medium,
    fontSize: 11,
  },
  rowTwo: {
    flexDirection: "row",
    gap: 10,
  },
  miniCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 54,
  },
  miniValue: {
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
  chartCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  chartTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 12,
  },
  chartArea: {
    alignItems: "flex-end",
    flexDirection: "row",
    height: 180,
    justifyContent: "space-between",
  },
  barWrap: {
    alignItems: "center",
    flex: 1,
  },
  barTrack: {
    borderRadius: 999,
    height: 126,
    justifyContent: "flex-end",
    overflow: "hidden",
    width: 18,
  },
  barFill: {
    borderRadius: 999,
    width: "100%",
  },
  barLabel: {
    fontFamily: AppFonts.medium,
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
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
