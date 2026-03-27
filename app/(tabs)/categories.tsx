import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { FloatingActionButton } from '@/components/floating-action-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';

export default function CategoriesScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const categories = useTaskStore((state) => state.categories);
  const tasks = useTaskStore((state) => state.tasks);

  const categorySummaries = categories.map((category) => {
    const relatedTasks = tasks.filter((task) => task.categoryId === category.id);
    const completed = relatedTasks.filter((task) => task.status === 'done').length;
    const progress = relatedTasks.length ? Math.round((completed / relatedTasks.length) * 100) : 0;

    return {
      ...category,
      total: relatedTasks.length,
      completed,
      progress,
    };
  });

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Build your own system and keep every goal in its place.</Text>

        <View style={[styles.heroCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <Text style={[styles.heroLabel, { color: colors.textMuted }]}>Overview</Text>
          <Text style={[styles.heroValue, { color: colors.text }]}>{categories.length} categories</Text>
          <Text style={[styles.heroMeta, { color: colors.textSoft }]}>{tasks.length} tasks saved offline</Text>
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={categorySummaries}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/todos', params: { categoryId: item.id } })}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={item.color} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                    {item.completed}/{item.total} completed
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.progressValue, { color: item.color }]}>{item.progress}%</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState title="Start with your first category" description="A fresh list is a good place to begin." />}
          showsVerticalScrollIndicator={false}
        />

        <FloatingActionButton iconName="add" onPress={() => router.push('/add-category')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8, marginTop: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  heroCard: { borderRadius: 24, borderWidth: 1, marginBottom: 16, padding: 18 },
  heroLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  heroValue: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroMeta: { fontSize: 14 },
  listContent: { flexGrow: 1, paddingBottom: 100 },
  card: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  cardLeft: { alignItems: 'center', flexDirection: 'row', flex: 1 },
  iconWrap: { alignItems: 'center', borderRadius: 18, height: 44, justifyContent: 'center', marginRight: 14, width: 44 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardMeta: { fontSize: 13 },
  cardRight: { alignItems: 'flex-end' },
  progressValue: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
});
