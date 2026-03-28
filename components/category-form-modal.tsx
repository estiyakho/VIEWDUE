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

import { ColorOptionSheet } from '@/components/color-option-sheet';
import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import { COLOR_PALETTES, findPaletteByColor } from '@/utils/color-palettes';
import { runListAnimation } from '@/utils/layout-animation';

type CategoryFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (categoryId: string) => void;
};

export function CategoryFormModal({ visible, onClose, onCreated }: CategoryFormModalProps) {
  const colors = useAppTheme();
  const addCategory = useTaskStore((state) => state.addCategory);
  const accentColor = useTaskStore((state) => state.settings.accentColor);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(accentColor);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setName('');
    setDescription('');
    setSelectedColor(accentColor);
  }, [accentColor, visible]);

  const trimmedName = name.trim();
  const shades = useMemo(() => findPaletteByColor(selectedColor, COLOR_PALETTES).shades, [selectedColor]);

  const handleSave = () => {
    if (!trimmedName) {
      return;
    }

    runListAnimation();
    const categoryId = addCategory({ name: trimmedName, description, color: selectedColor });
    if (categoryId) {
      onCreated?.(categoryId);
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
                <Text style={[styles.title, { color: colors.text }]}>New Category</Text>
                <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}> 
                  <Ionicons name="close" size={18} color={colors.textSoft} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                      numberOfLines={3}
                      onChangeText={setDescription}
                      placeholder="A short note for this category"
                      placeholderTextColor="#64748B"
                      style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      textAlignVertical="top"
                      value={description}
                    />
                  </View>

                  <View>
                    <View style={styles.colorHeader}>
                      <Text style={[styles.label, { color: colors.textSoft }]}>Color</Text>
                      <Pressable onPress={() => setColorPickerVisible(true)}>
                        <Text style={[styles.colorLink, { color: colors.accent }]}>More colors</Text>
                      </Pressable>
                    </View>
                    <View style={styles.shadeRow}>
                      {shades.map((shade) => {
                        const selected = shade === selectedColor;
                        return (
                          <Pressable
                            key={shade}
                            onPress={() => setSelectedColor(shade)}
                            style={[
                              styles.shadeButton,
                              {
                                backgroundColor: shade,
                                borderColor: selected ? colors.text : 'transparent',
                              },
                            ]}>
                            {selected ? <Ionicons name="checkmark" size={18} color={shade === '#E2E8F0' ? '#0F172A' : '#FFFFFF'} /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
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
                  <Text style={styles.primaryButtonText}>Save Category</Text>
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
    paddingHorizontal: 16,
  },
  sheet: {
    borderRadius: 30,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
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
    marginBottom: 18,
    padding: 16,
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
    minHeight: 100,
  },
  colorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorLink: {
    fontFamily: AppFonts.semibold,
    fontSize: 13,
  },
  shadeRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  shadeButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    flex: 1,
    height: 46,
    justifyContent: 'center',
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
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#F8FAFC',
    fontFamily: AppFonts.semibold,
    fontSize: 15,
  },
});
