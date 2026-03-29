import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppFonts } from "@/constants/fonts";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTaskStore } from "@/store/use-task-store";

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
  const statsResetAt = useTaskStore((state) => state.settings.statsResetAt);
  const firstDayOfWeek = useTaskStore((state) => state.settings.firstDayOfWeek);

  const statsTasks = useMemo(() => {
    if (!statsResetAt) {
      return tasks;
    }

    const resetTime = new Date(statsResetAt).getTime();
    return tasks.filter(
      (task) => new Date(task.createdAt).getTime() >= resetTime,
    );
  }, [statsResetAt, tasks]);

  const total = statsTasks.length;
  const today = statsTasks.filter((task) => {
    const date = new Date(task.createdAt);
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;
  const thisWeek = statsTasks.filter((task) => {
    const taskDate = new Date(task.createdAt);
    const now = new Date();
    const weekStart = new Date(now);

    // Calculate start of week based on firstDayOfWeek setting
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const firstDayIndex = dayNames.indexOf(firstDayOfWeek);
    const currentDayIndex = now.getDay();
    const daysToSubtract = (currentDayIndex - firstDayIndex + 7) % 7;

    weekStart.setDate(now.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // 6 days later (end of 7-day week)
    weekEnd.setHours(23, 59, 59, 999);

    return taskDate >= weekStart && taskDate <= weekEnd;
  }).length;
  const done = statsTasks.filter((task) => task.status === "done").length;
  const completionRate = total ? ((done / total) * 100).toFixed(1) : "0.0";

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
        const taskDay = new Date(task.createdAt).getDay();
        return taskDay === orderedDayIndices[index];
      }).length,
    }));
  }, [statsTasks, firstDayOfWeek]);

  const hourlyCounts = [
    {
      label: "12 AM - 6 AM",
      count: statsTasks.filter(
        (task) => new Date(task.createdAt).getHours() < 6,
      ).length,
    },
    {
      label: "6 AM - 12 PM",
      count: statsTasks.filter((task) => {
        const hour = new Date(task.createdAt).getHours();
        return hour >= 6 && hour < 12;
      }).length,
    },
    {
      label: "12 PM - 6 PM",
      count: statsTasks.filter((task) => {
        const hour = new Date(task.createdAt).getHours();
        return hour >= 12 && hour < 18;
      }).length,
    },
    {
      label: "6 PM - 12 AM",
      count: statsTasks.filter(
        (task) => new Date(task.createdAt).getHours() >= 18,
      ).length,
    },
  ];

  const currentStreak = useMemo(() => {
    const completedTasks = statsTasks.filter((task) => task.status === "done");
    const sortedDays = Array.from(
      new Set(
        completedTasks.map((task) => new Date(task.createdAt).toDateString()),
      ),
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (!sortedDays.length) return 0;
    let streak = 0;
    let cursor = new Date();
    for (const day of sortedDays) {
      if (new Date(day).toDateString() === cursor.toDateString()) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [statsTasks]);

  const longestStreak = useMemo(() => {
    const completedTasks = statsTasks.filter((task) => task.status === "done");
    const dayMap = new Map<string, boolean>();

    // Mark days with completed tasks
    completedTasks.forEach((task) => {
      const dayKey = new Date(task.createdAt).toDateString();
      dayMap.set(dayKey, true);
    });

    if (dayMap.size === 0) return 0;

    // Get all unique days with completed tasks, sorted
    const sortedDays = Array.from(dayMap.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate = new Date(sortedDays[0]);

    for (const day of sortedDays) {
      const currentDate = new Date(day);
      const dayDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === 1) {
        currentStreak += 1;
      } else if (dayDiff > 1) {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      } else {
        currentStreak = 1;
      }

      prevDate = currentDate;
    }

    return Math.max(maxStreak, currentStreak);
  }, [statsTasks]);
  const maxWeekday = Math.max(...weekdayCounts.map((item) => item.count)) || 1;
  const maxHourly = Math.max(...hourlyCounts.map((item) => item.count)) || 1;

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
        <View style={styles.statsGrid}>
          <StatBox
            colors={colors}
            icon="checkmark-circle-outline"
            label="Today"
            tint={accent}
            value={`${today}`}
          />
          <StatBox
            colors={colors}
            icon="calendar-outline"
            label="This Week"
            tint={accent}
            value={`${thisWeek}`}
          />
          <StatBox
            colors={colors}
            icon="albums-outline"
            label="Total"
            tint={accent}
            value={`${total}`}
          />
          <StatBox
            colors={colors}
            icon="pie-chart-outline"
            label="Completion"
            tint={accent}
            value={`${completionRate}%`}
          />
        </View>

        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Streak
          </Text>
          <View style={styles.rowTwo}>
            <View
              style={[
                styles.miniCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
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
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
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
          <View style={styles.chartArea}>
            {hourlyCounts.map((item) => (
              <View key={item.label} style={styles.barWrap}>
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
                        backgroundColor: `${accent}CC`,
                        height: `${(item.count / maxHourly) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
});
