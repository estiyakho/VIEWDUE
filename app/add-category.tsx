import { useState } from 'react';
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
import { Stack, useRouter } from 'expo-router';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';

export default function AddCategoryScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const addCategory = useTaskStore((state) => state.addCategory);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const trimmedName = name.trim();

  const handleSave = () => {
    if (!trimmedName) {
      return;
    }

    addCategory({ name: trimmedName, description });
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ presentation: 'modal', title: 'Add Category' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
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

          <Text style={[styles.label, styles.descriptionLabel, { color: colors.textSoft }]}>Description</Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setDescription}
            placeholder="A short note for this category"
            placeholderTextColor="#64748B"
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            textAlignVertical="top"
            value={description}
          />

          <View style={styles.footer}>
            <Pressable onPress={() => router.back()} style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.secondaryButtonText, { color: colors.textSoft }]}>Cancel</Text>
            </Pressable>
            <Pressable disabled={!trimmedName} onPress={handleSave} style={[styles.primaryButton, { backgroundColor: colors.accent }, !trimmedName && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>Save Category</Text>
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
  container: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  title: { fontFamily: AppFonts.bold, fontSize: 30, marginBottom: 8 },
  subtitle: { fontFamily: AppFonts.medium, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  label: { fontFamily: AppFonts.semibold, fontSize: 14, marginBottom: 8 },
  descriptionLabel: { marginTop: 14 },
  input: { borderRadius: 18, borderWidth: 1, fontFamily: AppFonts.medium, fontSize: 16, minHeight: 56, paddingHorizontal: 14, paddingVertical: 12 },
  textArea: { minHeight: 88 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 'auto', paddingTop: 20 },
  secondaryButton: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flex: 1, justifyContent: 'center', paddingVertical: 14 },
  secondaryButtonText: { fontFamily: AppFonts.semibold, fontSize: 15 },
  primaryButton: { alignItems: 'center', borderRadius: 18, flex: 1, justifyContent: 'center', paddingVertical: 14 },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: { color: '#F8FAFC', fontFamily: AppFonts.semibold, fontSize: 15 },
});
