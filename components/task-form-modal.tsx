import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryFormModal } from '@/components/category-form-modal';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { runListAnimation } from '@/utils/layout-animation';
import { toDayKey } from '@/utils/date';

const MIN_FIELD_HEIGHT = 56;

type TaskFormModalProps = {
  visible: boolean;
  initialCategoryId?: string;
  initialDate?: string;
  mode?: 'task' | 'scheduled';
  onClose: () => void;
};

export function TaskFormModal({ visible, initialCategoryId, initialDate, mode = 'task', onClose }: TaskFormModalProps) {
  const colors = useAppTheme();
  const addTask = useTaskStore((state) => state.addTask);
  const addScheduledTask = useTaskStore((state) => state.addScheduledTask);
  const categories = useTaskStore((state) => state.categories);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialCategoryId);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [descriptionHeight, setDescriptionHeight] = useState(MIN_FIELD_HEIGHT);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle('');
    setDescription('');
    setDescriptionHeight(MIN_FIELD_HEIGHT);
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
    if (mode === 'scheduled') {
      addScheduledTask({ title: trimmedTitle, description, date: initialDate?.slice(0, 10) ?? toDayKey(new Date()) });
    } else {
      addTask({ title: trimmedTitle, description, categoryId: selectedCategoryId, createdAt: initialDate });
    }
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
                <Text style={[styles.title, { color: colors.text }]}>{mode === 'scheduled' ? 'New Scheduled Item' : 'New Task'}</Text>
                <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}> 
                  <Ionicons name="close" size={18} color={colors.textSoft} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.form}>
                  {mode === 'task' && (
                    <View style={styles.formField}>
                      <View style={styles.categoryHeader}>
                        <Text style={[styles.label, { color: colors.textSoft }]}>Category</Text>
                        <Pressable onPress={() => setCategoryModalVisible(true)}>
                          <Text style={[styles.newCategoryText, { color: colors.accent }]}>New Category</Text>
                        </Pressable>
                      </View>
                      <View style={styles.categoryList}>
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
                      </View>
                    </View>
                  )}

                  <View style={styles.formField}>
                    <Text style={[styles.label, { color: colors.textSoft }]}>Title</Text>
                    <TextInput
                      autoFocus
                      onChangeText={setTitle}
                      placeholder="Task title"
                      placeholderTextColor="#64748B"
                      style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      value={title}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.label, { color: colors.textSoft }]}>Description</Text>
                    <TextInput
                      multiline
                      onChangeText={setDescription}
                      onContentSizeChange={(event) =>
                        setDescriptionHeight(Math.max(MIN_FIELD_HEIGHT, Math.min(220, event.nativeEvent.contentSize.height)))
                      }
                      placeholder="Optional details"
                      placeholderTextColor="#64748B"
                      style={[
                        styles.input,
                        styles.textArea,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.text,
                          height: descriptionHeight,
                        },
                      ]}
                      textAlignVertical="top"
                      value={description}
                    />
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
                  <Text style={styles.primaryButtonText}>{mode === 'scheduled' ? 'Save' : 'Save Task'}</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {mode === 'task' ? (
        <CategoryFormModal
          visible={categoryModalVisible}
          onClose={() => setCategoryModalVisible(false)}
          onCreated={(categoryId) => {
            setSelectedCategoryId(categoryId);
            setCategoryModalVisible(false);
          }}
        />
      ) : null}
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
    padding: 16,
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  form: {
    gap: 14,
  },
  formField: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
  },
  label: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    minHeight: MIN_FIELD_HEIGHT,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: MIN_FIELD_HEIGHT,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newCategoryText: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  categoryChipText: {
    color: '#F8FAFC',
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
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
    paddingVertical: 14,
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
