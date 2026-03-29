import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
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
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { Task } from '@/types/task';
import { runListAnimation } from '@/utils/layout-animation';

const MIN_FIELD_HEIGHT = 56;

type TaskFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (taskId: string) => void;
  onSaved?: (taskId: string) => void;
  initialTask?: Task;
  defaultCategoryId?: string;
};

export function TaskFormModal({ 
  visible, 
  onClose, 
  onCreated, 
  onSaved, 
  initialTask,
  defaultCategoryId 
}: TaskFormModalProps) {
  const colors = useAppTheme();
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const categories = useTaskStore((state) => state.categories);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(defaultCategoryId);
  const [descriptionHeight, setDescriptionHeight] = useState(MIN_FIELD_HEIGHT);

  const isEditing = Boolean(initialTask);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialTask?.title ?? '');
    setDescription(initialTask?.description ?? '');
    setSelectedCategoryId(initialTask?.categoryId ?? defaultCategoryId);
    setDescriptionHeight(MIN_FIELD_HEIGHT);
  }, [initialTask, defaultCategoryId, visible]);

  const trimmedTitle = title.trim();

  const handleSave = () => {
    if (!trimmedTitle) return;

    runListAnimation();
    const taskId = initialTask
      ? updateTask(initialTask.id, { title: trimmedTitle, description, categoryId: selectedCategoryId })
      : addTask({ title: trimmedTitle, description, categoryId: selectedCategoryId });

    if (taskId) {
      if (initialTask) onSaved?.(taskId);
      else onCreated?.(taskId);
    }
    onClose();
  };

  return (
    <Modal 
      animationType="none" 
      transparent 
      visible={visible} 
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeIn.duration(300)} 
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </BlurView>
        </Animated.View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}>
          <Animated.View 
            entering={SlideInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          > 
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {isEditing ? 'Edit Task' : 'New Task'}
              </Text>
              <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}> 
                <Ionicons name="close" size={18} color={colors.textSoft} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.form}>
                <View style={styles.formField}>
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

                <View style={styles.formField}>
                  <Text style={[styles.label, { color: colors.textSoft }]}>Description</Text>
                  <TextInput
                    multiline
                    onChangeText={setDescription}
                    onContentSizeChange={(e) => 
                      setDescriptionHeight(Math.max(MIN_FIELD_HEIGHT, Math.min(150, e.nativeEvent.contentSize.height)))
                    }
                    placeholder="Optional details"
                    placeholderTextColor="#64748B"
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                        height: descriptionHeight,
                        paddingTop: 12,
                      },
                    ]}
                    textAlignVertical="top"
                    value={description}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.label, { color: colors.textSoft }]}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                    <Pressable
                      onPress={() => setSelectedCategoryId(undefined)}
                      style={[
                        styles.categoryChip, 
                        { 
                          backgroundColor: !selectedCategoryId ? colors.accent : colors.surface,
                          borderColor: !selectedCategoryId ? colors.accent : colors.border
                        }
                      ]}>
                      <Text style={[styles.categoryChipText, { color: !selectedCategoryId ? '#FFF' : colors.textSoft }]}>None</Text>
                    </Pressable>
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategoryId(cat.id)}
                        style={[
                          styles.categoryChip, 
                          { 
                            backgroundColor: selectedCategoryId === cat.id ? cat.color : colors.surface,
                            borderColor: selectedCategoryId === cat.id ? cat.color : colors.border
                          }
                        ]}>
                        <Text style={[styles.categoryChipText, { color: selectedCategoryId === cat.id ? '#FFF' : colors.textSoft }]}>
                          {cat.name}
                        </Text>
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
                style={[styles.primaryButton, { backgroundColor: colors.accent }, !trimmedTitle && styles.disabledButton]}>
                <Text style={styles.primaryButtonText}>{isEditing ? 'Update' : 'Save'}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  sheet: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 8,
    maxHeight: '88%',
    overflow: 'hidden',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 22,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  form: {
    gap: 16,
  },
  formField: {
    width: '100%',
  },
  label: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    minHeight: MIN_FIELD_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryList: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChipText: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 14,
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
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#F8FAFC',
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
});
