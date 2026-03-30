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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

import { ColorOptionSheet } from '@/components/color-option-sheet';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { Category } from '@/types/task';
import { COLOR_PALETTES, findPaletteByColor } from '@/utils/color-palettes';
import { runListAnimation } from '@/utils/layout-animation';

const MIN_FIELD_HEIGHT = 56;

type CategoryFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (categoryId: string) => void;
  onSaved?: (categoryId: string) => void;
  initialCategory?: Category;
};

export function CategoryFormModal({ visible, onClose, onCreated, onSaved, initialCategory }: CategoryFormModalProps) {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const addCategory = useTaskStore((state) => state.addCategory);
  const updateCategory = useTaskStore((state) => state.updateCategory);
  const accentColor = useTaskStore((state) => state.settings.accentColor);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(accentColor);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [descriptionHeight, setDescriptionHeight] = useState(MIN_FIELD_HEIGHT);

  const isEditing = Boolean(initialCategory);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName(initialCategory?.name ?? '');
    setDescription(initialCategory?.description ?? '');
    setDescriptionHeight(MIN_FIELD_HEIGHT);
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
          <BlurView intensity={25} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </BlurView>
          </Animated.View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalWrapper}>
            <Animated.View 
              entering={SlideInDown.duration(400)}
              exiting={FadeOut.duration(200)}
              style={[
                styles.sheet, 
                { 
                  backgroundColor: colors.surfaceElevated, 
                  borderColor: colors.border,
                  paddingBottom: Math.max(24, insets.bottom + 16)
                }
              ]}
            > 
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isEditing ? 'Edit Category' : 'New Category'}
                </Text>
                <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}> 
                  <Ionicons name="close" size={18} color={colors.textSoft} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.form}>
                  <View style={styles.formField}>
                    <Text style={[styles.label, { color: colors.textSoft }]}>Name</Text>
                    <View style={styles.nameRow}>
                      <Pressable
                        onPress={() => setColorPickerVisible(true)}
                        style={[styles.miniColorSquare, { backgroundColor: selectedColor }]}
                      >
                        <Ionicons name="color-palette" size={14} color="#FFFFFF" />
                      </Pressable>
                      <TextInput
                        autoFocus
                        onChangeText={setName}
                        placeholder="Category name"
                        placeholderTextColor="#64748B"
                        style={[styles.input, styles.flexInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        value={name}
                      />
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={[styles.label, { color: colors.textSoft }]}>Description</Text>
                    <TextInput
                      multiline
                      onChangeText={setDescription}
                      onContentSizeChange={(event) =>
                        setDescriptionHeight(Math.max(MIN_FIELD_HEIGHT, Math.min(200, event.nativeEvent.contentSize.height)))
                      }
                      placeholder="A short note for this category"
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
                  disabled={!trimmedName}
                  onPress={handleSave}
                  style={[styles.primaryButton, { backgroundColor: selectedColor }, !trimmedName && styles.disabledButton]}>
                  <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>{isEditing ? 'Update' : 'Save'}</Text>
                </Pressable>
              </View>
            </Animated.View>
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
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    elevation: 20,
    maxHeight: '92%',
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 4,
    marginBottom: 20,
    width: 36,
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
    alignSelf: 'center',
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
  textArea: {
    minHeight: MIN_FIELD_HEIGHT,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniColorSquare: {
    height: 48,
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  flexInput: {
    flex: 1,
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
