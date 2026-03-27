import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';

export default function AddCategoryScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const addCategory = useTaskStore((state) => state.addCategory);
  const [name, setName] = useState('');

  const trimmedName = name.trim();

  const handleSave = () => {
    if (!trimmedName) {
      return;
    }

    addCategory(trimmedName);
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ presentation: 'modal', title: 'Add Category' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={[styles.container, { backgroundColor: colors.background }]}> 
          <Text style={[styles.title, { color: colors.text }]}>New category</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Name the spaces where your best work happens.</Text>

          <Text style={[styles.label, { color: colors.textSoft }]}>Name</Text>
          <TextInput
            autoFocus
            onChangeText={setName}
            placeholder="Category name"
            placeholderTextColor="#64748B"
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={name}
          />

          <View style={styles.footer}>
            <Pressable onPress={() => router.back()} style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.secondaryButtonText, { color: colors.textSoft }]}>Cancel</Text>
            </Pressable>
            <Pressable disabled={!trimmedName} onPress={handleSave} style={[styles.primaryButton, { backgroundColor: colors.accent }, !trimmedName && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>Save Category</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  input: { borderRadius: 18, borderWidth: 1, fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  secondaryButton: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flex: 1, justifyContent: 'center', paddingVertical: 16 },
  secondaryButtonText: { fontSize: 15, fontWeight: '700' },
  primaryButton: { alignItems: 'center', borderRadius: 18, flex: 1, justifyContent: 'center', paddingVertical: 16 },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
});
