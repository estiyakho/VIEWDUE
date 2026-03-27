import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { FloatingActionButton } from '@/components/floating-action-button';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';

function ProgressRing({ progress, color, labelColor, baseColor }: { progress: number; color: string; labelColor: string; baseColor: string }) {
  const degrees = Math.max(0, Math.min(360, Math.round((progress / 100) * 360)));

  return (
    <View style={styles.ringWrap}>
      <View style={[styles.ringBase, { borderColor: baseColor }]} />
      <View
        style={[
          styles.ringArc,
          {
            borderTopColor: color,
            borderRightColor: degrees > 90 ? color : 'transparent',
            borderBottomColor: degrees > 180 ? color : 'transparent',
            borderLeftColor: degrees > 270 ? color : 'transparent',
            transform: [{ rotate: `${degrees}deg` }],
          },
        ]}
      />
      <View style={styles.ringCenter}>
        <Text style={[styles.ringText, { color: labelColor }]}>{progress}%</Text>
      </View>
    </View>
  );
}

type CategoryTab = 'active' | 'archived';

export default function CategoriesScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const categories = useTaskStore((state) => state.categories);
  const tasks = useTaskStore((state) => state.tasks);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('active');

  const categorySummaries = useMemo(() => {
    return categories.map((category) => {
      const relatedTasks = tasks.filter((task) => task.categoryId === category.id);
      const completed = relatedTasks.filter((task) => task.status === 'done').length;
      const remaining = relatedTasks.length - completed;
      const progress = relatedTasks.length ? Math.round((completed / relatedTasks.length) * 100) : 0;
      const archived = relatedTasks.length > 0 && remaining === 0;

      return {
        ...category,
        total: relatedTasks.length,
        completed,
        remaining,
        progress,
        archived,
      };
    });
  }, [categories, tasks]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return categorySummaries.filter((category) => {
      const matchesTab = activeTab === 'active' ? !category.archived : category.archived;
      const matchesQuery =
        !normalizedQuery ||
        category.name.toLowerCase().includes(normalizedQuery) ||
        category.description?.toLowerCase().includes(normalizedQuery);
      return matchesTab && matchesQuery;
    });
  }, [activeTab, categorySummaries, query]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const remainingTasks = totalTasks - completedTasks;
  const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <Ionicons color={colors.textMuted} name="search-outline" size={24} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Search Category"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
          />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <View style={styles.summaryTop}>
            <View style={[styles.summaryIconWrap, { backgroundColor: `${colors.accent}55` }]}>
              <Ionicons color="#F8FAFC" name="flag-outline" size={28} />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Let&apos;s start!</Text>
              <Text style={[styles.summarySubtitle, { color: colors.textMuted }]}>Todos progress</Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}> 
              <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${overallProgress}%` }]} />
            </View>
            <Text style={[styles.progressValue, { color: colors.accent }]}>{overallProgress}%</Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}> 
              <Ionicons color={colors.accent} name="checkmark-circle-outline" size={16} />
              <Text style={[styles.statText, { color: colors.text }]}>{completedTasks} Completed</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}> 
              <Ionicons color={colors.warning} name="list-outline" size={16} />
              <Text style={[styles.statText, { color: colors.text }]}>{remainingTasks} Remaining</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          <Pressable onPress={() => setActiveTab('active')} style={styles.tabButton}>
            <Text style={[styles.tabLabel, { color: activeTab === 'active' ? colors.text : colors.textMuted }]}>Active</Text>
            {activeTab === 'active' ? <View style={[styles.tabIndicator, { backgroundColor: '#C4B5FD' }]} /> : null}
          </Pressable>
          <Pressable onPress={() => setActiveTab('archived')} style={styles.tabButton}>
            <Text style={[styles.tabLabel, { color: activeTab === 'archived' ? colors.text : colors.textMuted }]}>Archived</Text>
            {activeTab === 'archived' ? <View style={[styles.tabIndicator, { backgroundColor: '#C4B5FD' }]} /> : null}
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/todos', params: { categoryId: item.id } })}
              style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
              <View style={styles.cardLeft}>
                <ProgressRing color={item.color} progress={item.progress} labelColor={colors.text} baseColor={colors.border} />
                <View style={styles.cardTextWrap}>
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                  <Text numberOfLines={2} style={[styles.cardMeta, { color: colors.textMuted }]}>
                    {item.description || (item.remaining > 0 ? `${item.remaining} task${item.remaining > 1 ? 's' : ''} left` : 'All tasks completed')}
                  </Text>
                </View>
              </View>
              <View style={[styles.countPill, { backgroundColor: colors.surfaceMuted }]}> 
                <Text style={[styles.countText, { color: colors.text }]}>{item.completed}/{item.total}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No categories yet</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Add category to organize todos.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <FloatingActionButton iconName="add" onPress={() => router.push('/add-category')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 6 },
  searchBar: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    minHeight: 58,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    marginLeft: 10,
    paddingVertical: 0,
  },
  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14,
  },
  summaryTop: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  summaryIconWrap: {
    alignItems: 'center',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    marginRight: 14,
    width: 68,
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 2,
  },
  summarySubtitle: {
    fontFamily: AppFonts.medium,
    fontSize: 14,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  progressTrack: {
    borderRadius: 999,
    flex: 1,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  progressValue: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginLeft: 12,
    minWidth: 46,
    textAlign: 'right',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 10,
  },
  statText: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 10,
  },
  tabButton: {
    paddingBottom: 10,
    position: 'relative',
  },
  tabLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 16,
  },
  tabIndicator: {
    borderRadius: 999,
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
    width: 52,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  card: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  cardTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 15,
    marginBottom: 4,
  },
  cardMeta: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  countPill: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 58,
    paddingHorizontal: 10,
  },
  countText: {
    fontFamily: AppFonts.bold,
    fontSize: 14,
  },
  ringWrap: {
    alignItems: 'center',
    height: 64,
    justifyContent: 'center',
    position: 'relative',
    width: 64,
  },
  ringBase: {
    borderRadius: 32,
    borderWidth: 5,
    height: 64,
    position: 'absolute',
    width: 64,
  },
  ringArc: {
    borderRadius: 32,
    borderWidth: 5,
    height: 64,
    position: 'absolute',
    width: 64,
  },
  ringCenter: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  ringText: {
    fontFamily: AppFonts.bold,
    fontSize: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 18,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: AppFonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
});
