import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { runListAnimation } from '@/utils/layout-animation';

export default function AddTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const colors = useAppTheme();
  const addTask = useTaskStore((state) => state.addTask);
  const categories = useTaskStore((state) => state.categories);

  const initialCategory = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialCategory);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategoryId(initialCategory);
    }
  }, [initialCategory]);

  const trimmedTitle = title.trim();

  const handleSave = () => {
    if (!trimmedTitle) {
      return;
    }

    runListAnimation();
    addTask({ title: trimmedTitle, description, categoryId: selectedCategoryId });
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ presentation: 'modal', title: 'Add Task' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>New task</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Capture the thought before it slips away.</Text>

          <View style={styles.form}>
            <View>
              <Text style={[styles.label, { color: colors.textSoft }]}>Title</Text>
              <TextInput
                autoFocus
                onChangeText={setTitle}
                placeholder="What needs to be done?"
                placeholderTextColor="#64748B"
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={title}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.textSoft }]}>Description</Text>
              <TextInput
                multiline
                numberOfLines={4}
                onChangeText={setDescription}
                placeholder="Optional details"
                placeholderTextColor="#64748B"
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                textAlignVertical="top"
                value={description}
              />
            </View>

            <View>
              <View style={styles.categoryHeader}>
                <Text style={[styles.label, { color: colors.textSoft }]}>Category</Text>
                <Pressable onPress={() => router.push('/add-category')}>
                  <Text style={[styles.newCategoryText, { color: colors.accent }]}>New Category</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                <Pressable
                  onPress={() => setSelectedCategoryId(undefined)}
                  style={[styles.categoryChip, { backgroundColor: !selectedCategoryId ? colors.accent : colors.surface }]}>
                  <Text style={styles.categoryChipText}>None</Text>
                </Pressable>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategoryId(category.id)}
                    style={[styles.categoryChip, { backgroundColor: selectedCategoryId === category.id ? category.color : colors.surface }]}>
                    <Text style={styles.categoryChipText}>{category.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={() => router.back()} style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.secondaryButtonText, { color: colors.textSoft }]}>Cancel</Text>
            </Pressable>

            <Pressable
              disabled={!trimmedTitle}
              onPress={handleSave}
              style={[styles.primaryButton, { backgroundColor: colors.accent }, !trimmedTitle && styles.primaryButtonDisabled]}>
              <Text style={styles.primaryButtonText}>Save Task</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  form: { gap: 18 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  input: { borderRadius: 18, borderWidth: 1, fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
  textArea: { minHeight: 120 },
  categoryHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  newCategoryText: { fontSize: 13, fontWeight: '700' },
  categoryList: { gap: 10, paddingRight: 12 },
  categoryChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  categoryChipText: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 'auto', paddingTop: 32 },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '700' },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
});
