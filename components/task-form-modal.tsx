import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CategoryFormModal } from '@/components/category-form-modal';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { runListAnimation } from '@/utils/layout-animation';

type TaskFormModalProps = {
  visible: boolean;
  initialCategoryId?: string;
  onClose: () => void;
};

export function TaskFormModal({ visible, initialCategoryId, onClose }: TaskFormModalProps) {
  const colors = useAppTheme();
  const addTask = useTaskStore((state) => state.addTask);
  const categories = useTaskStore((state) => state.categories);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialCategoryId);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle('');
    setDescription('');
    setSelectedCategoryId(initialCategoryId);
  }, [initialCategoryId, visible]);

  const trimmedTitle = title.trim();
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const handleSave = () => {
    if (!trimmedTitle) {
      return;
    }

    runListAnimation();
    addTask({ title: trimmedTitle, description, categoryId: selectedCategoryId });
    onClose();
  };

  return (
    <>
      <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
              <View style={styles.hero}>
                <Text style={[styles.title, { color: colors.text }]}>New Task</Text>
                <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}> 
                  <Ionicons name="close" size={18} color={colors.textSoft} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>{trimmedTitle || 'What needs to be done?'}</Text>
                  <View style={styles.previewMeta}>
                    <View style={[styles.previewDot, { backgroundColor: selectedCategory?.color ?? colors.accent }]} />
                    <Text style={[styles.previewMetaText, { color: colors.textSoft }]}>
                      {selectedCategory?.name ?? 'No category selected'}
                    </Text>
                  </View>
                </View>

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
                      <Pressable onPress={() => setCategoryModalVisible(true)}>
                        <Text style={[styles.newCategoryText, { color: colors.accent }]}>New Category</Text>
                      </Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                      <Pressable
                        onPress={() => setSelectedCategoryId(undefined)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: !selectedCategoryId ? colors.accent : colors.surface,
                            borderColor: !selectedCategoryId ? colors.accent : colors.border,
                          },
                        ]}>
                        <Text style={styles.categoryChipText}>None</Text>
                      </Pressable>
                      {categories.map((category) => (
                        <Pressable
                          key={category.id}
                          onPress={() => setSelectedCategoryId(category.id)}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: selectedCategoryId === category.id ? category.color : colors.surface,
                              borderColor: selectedCategoryId === category.id ? category.color : colors.border,
                            },
                          ]}>
                          <Text style={styles.categoryChipText}>{category.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable onPress={onClose} style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.secondaryButtonText, { color: colors.textSoft }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={!trimmedTitle}
                  onPress={handleSave}
                  style={[styles.primaryButton, { backgroundColor: colors.accent }, !trimmedTitle && styles.primaryButtonDisabled]}>
                  <Text style={styles.primaryButtonText}>Save Task</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <CategoryFormModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        onCreated={(categoryId) => {
          setSelectedCategoryId(categoryId);
          setCategoryModalVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    borderRadius: 30,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 22,
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  previewTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 17,
    marginBottom: 8,
  },
  previewMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  previewDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  previewMetaText: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
  },
  form: {
    gap: 16,
  },
  label: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
    marginBottom: 10,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 120,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  newCategoryText: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  categoryList: {
    gap: 10,
    paddingRight: 12,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipText: {
    color: '#F8FAFC',
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#F8FAFC',
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
});
