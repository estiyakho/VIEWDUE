import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';

function StatBox({ icon, label, value, tint, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tint: string; colors: ReturnType<typeof useAppTheme> }) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
      <View style={[styles.statIconWrap, { backgroundColor: `${tint}22` }]}>
        <Ionicons color={tint} name={icon} size={18} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function StatisticsScreen() {
  const colors = useAppTheme();
  const accent = colors.accent;
  const tasks = useTaskStore((state) => state.tasks);
  const statsResetAt = useTaskStore((state) => state.settings.statsResetAt);

  const statsTasks = useMemo(() => {
    if (!statsResetAt) {
      return tasks;
    }

    const resetTime = new Date(statsResetAt).getTime();
    return tasks.filter((task) => new Date(task.createdAt).getTime() >= resetTime);
  }, [statsResetAt, tasks]);

  const total = statsTasks.length;
  const today = statsTasks.filter((task) => {
    const date = new Date(task.createdAt);
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const thisWeek = statsTasks.filter((task) => Date.now() - new Date(task.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const done = statsTasks.filter((task) => task.status === 'done').length;
  const completionRate = total ? ((done / total) * 100).toFixed(1) : '0.0';

  const weekdayCounts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
    day,
    count: statsTasks.filter((task) => {
      const value = new Date(task.createdAt).getDay();
      const mapped = value === 0 ? 6 : value - 1;
      return mapped === index;
    }).length,
  }));

  const hourlyCounts = [
    { label: '12-6 AM', count: statsTasks.filter((task) => new Date(task.createdAt).getHours() < 6).length },
    { label: '6-12 AM', count: statsTasks.filter((task) => {
      const hour = new Date(task.createdAt).getHours();
      return hour >= 6 && hour < 12;
    }).length },
    { label: '12-6 PM', count: statsTasks.filter((task) => {
      const hour = new Date(task.createdAt).getHours();
      return hour >= 12 && hour < 18;
    }).length },
    { label: '6-12 PM', count: statsTasks.filter((task) => new Date(task.createdAt).getHours() >= 18).length },
  ];

  const currentStreak = useMemo(() => {
    const sortedDays = Array.from(new Set(statsTasks.map((task) => new Date(task.createdAt).toDateString()))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
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

  const longestStreak = currentStreak;
  const maxWeekday = Math.max(2, ...weekdayCounts.map((item) => item.count));
  const maxHourly = Math.max(2, ...hourlyCounts.map((item) => item.count));

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatBox colors={colors} icon="checkmark-circle-outline" label="Today" tint={accent} value={`${today}`} />
          <StatBox colors={colors} icon="calendar-outline" label="This Week" tint={accent} value={`${thisWeek}`} />
          <StatBox colors={colors} icon="albums-outline" label="Total" tint={accent} value={`${total}`} />
          <StatBox colors={colors} icon="pie-chart-outline" label="Completion" tint={accent} value={`${completionRate}%`} />
        </View>

        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Streak</Text>
          <View style={styles.rowTwo}>
            <View style={[styles.miniCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
              <Ionicons color={accent} name="flash-outline" size={16} />
              <Text style={[styles.miniValue, { color: colors.text }]}>{currentStreak} Current</Text>
            </View>
            <View style={[styles.miniCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
              <Ionicons color={accent} name="ribbon-outline" size={16} />
              <Text style={[styles.miniValue, { color: colors.text }]}>{longestStreak} Longest</Text>
            </View>
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Progress</Text>
          <View style={styles.chartArea}>
            {weekdayCounts.map((item) => (
              <View key={item.day} style={styles.barWrap}>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}> 
                  <View style={[styles.barFill, { backgroundColor: accent, height: `${(item.count / maxWeekday) * 100}%` }]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.textMuted }]}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <Text style={[styles.chartTitle, { color: colors.text }]}>Hourly Progress</Text>
          <View style={styles.chartArea}>
            {hourlyCounts.map((item) => (
              <View key={item.label} style={styles.barWrap}>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}> 
                  <View style={[styles.barFill, { backgroundColor: `${accent}CC`, height: `${(item.count / maxHourly) * 100}%` }]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingBottom: 28, paddingHorizontal: 14, paddingTop: 10 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 92,
    padding: 12,
    width: '48.4%',
  },
  statIconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 28,
    justifyContent: 'center',
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
    flexDirection: 'row',
    gap: 10,
  },
  miniCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
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
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 180,
    justifyContent: 'space-between',
  },
  barWrap: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    borderRadius: 999,
    height: 126,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 18,
  },
  barFill: {
    borderRadius: 999,
    width: '100%',
  },
  barLabel: {
    fontFamily: AppFonts.medium,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
});
