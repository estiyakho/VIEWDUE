import { Ionicons } from '@expo/vector-icons';
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

import { ColorOptionSheet } from '@/components/color-option-sheet';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { Category } from '@/types/task';
import { COLOR_PALETTES, findPaletteByColor } from '@/utils/color-palettes';
import { runListAnimation } from '@/utils/layout-animation';

type CategoryFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (categoryId: string) => void;
  onSaved?: (categoryId: string) => void;
  initialCategory?: Category;
};

export function CategoryFormModal({ visible, onClose, onCreated, onSaved, initialCategory }: CategoryFormModalProps) {
  const colors = useAppTheme();
  const addCategory = useTaskStore((state) => state.addCategory);
  const updateCategory = useTaskStore((state) => state.updateCategory);
  const accentColor = useTaskStore((state) => state.settings.accentColor);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(accentColor);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const isEditing = Boolean(initialCategory);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(initialCategory?.name ?? '');
    setDescription(initialCategory?.description ?? '');
    setSelectedColor(initialCategory?.color ?? accentColor);
  }, [accentColor, initialCategory, visible]);

  const trimmedName = name.trim();
  const activePalette = findPaletteByColor(selectedColor, COLOR_PALETTES);

  const handleSave = () => {
    if (!trimmedName) {
      return;
    }

    runListAnimation();
    const categoryId = initialCategory
      ? updateCategory({ id: initialCategory.id, name: trimmedName, description, color: selectedColor })
      : addCategory({ name: trimmedName, description, color: selectedColor });

    if (categoryId) {
      if (!initialCategory) {
        onCreated?.(categoryId);
      }
      onSaved?.(categoryId);
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
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{isEditing ? 'Edit Category' : 'New Category'}</Text>
                <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}> 
                  <Ionicons name="close" size={18} color={colors.textSoft} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {(trimmedName || description.trim()) ? (
                  <View style={[styles.previewCard, { backgroundColor: `${selectedColor}18`, borderColor: `${selectedColor}55` }]}> 
                    <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                      <Ionicons name="folder-open-outline" size={20} color="#F8FAFC" />
                    </View>
                    <View style={styles.previewText}>
                      {!!trimmedName ? <Text style={[styles.previewTitle, { color: colors.text }]}>{trimmedName}</Text> : null}
                      {!!description.trim() ? (
                        <Text style={[styles.previewSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                          {description.trim()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                <View style={styles.form}>
                  <View>
                    <Text style={[styles.label, { color: colors.textSoft }]}>Name</Text>
                    <TextInput
                      autoFocus
                      onChangeText={setName}
                      placeholder="Category name"
                      placeholderTextColor="#64748B"
                      style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      value={name}
                    />
                  </View>

                  <View>
                    <Text style={[styles.label, { color: colors.textSoft }]}>Description</Text>
                    <TextInput
                      multiline
                      numberOfLines={2}
                      onChangeText={setDescription}
                      placeholder="A short note for this category"
                      placeholderTextColor="#64748B"
                      style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      textAlignVertical="top"
                      value={description}
                    />
                  </View>

                  <View>
                    <Pressable
                      onPress={() => setColorPickerVisible(true)}
                      style={[styles.colorTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.colorTriggerLeft}>
                        <Text style={[styles.colorLabel, { color: colors.textSoft }]}>Selected color</Text>
                        <Text style={[styles.colorTriggerText, { color: colors.text }]}>{activePalette.label}</Text>
                        <View style={[styles.colorPreviewBar, { backgroundColor: selectedColor }]} />
                      </View>
                      <View style={styles.colorTriggerRight}>
                        <Text style={[styles.changeText, { color: colors.accent }]}>Change</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                      </View>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable onPress={onClose} style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.secondaryButtonText, { color: colors.textSoft }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={!trimmedName}
                  onPress={handleSave}
                  style={[styles.primaryButton, { backgroundColor: selectedColor }, !trimmedName && styles.disabledButton]}>
                  <Text style={styles.primaryButtonText}>{isEditing ? 'Update Category' : 'Save Category'}</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ColorOptionSheet
        visible={colorPickerVisible}
        title="Category Color"
        palettes={COLOR_PALETTES}
        selectedValue={selectedColor}
        onClose={() => setColorPickerVisible(false)}
        onSelect={setSelectedColor}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sheet: {
    borderRadius: 28,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 22,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 14,
  },
  previewIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  previewSubtitle: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  form: {
    gap: 14,
  },
  label: {
    fontFamily: AppFonts.semibold,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    fontFamily: AppFonts.medium,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 64,
  },
  colorTrigger: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  colorTriggerLeft: {
    flex: 1,
  },
  colorLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
    marginBottom: 4,
  },
  colorTriggerText: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
    marginBottom: 10,
  },
  colorPreviewBar: {
    borderRadius: 999,
    height: 8,
    width: 56,
  },
  colorTriggerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginLeft: 12,
  },
  changeText: {
    fontFamily: AppFonts.medium,
    fontSize: 14,
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
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#F8FAFC',
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
});
