import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';

type Option<T extends string | number> = {
  label: string;
  value: T;
};

type SettingsOptionSheetProps<T extends string | number> = {
  visible: boolean;
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  options: Option<T>[];
  selectedValue?: T;
  tone?: 'default' | 'danger';
  onClose: () => void;
  onSelect: (value: T) => void;
};

export function SettingsOptionSheet<T extends string | number>({
  visible,
  title,
  iconName,
  options,
  selectedValue,
  tone = 'default',
  onClose,
  onSelect,
}: SettingsOptionSheetProps<T>) {
  const colors = useAppTheme();
  const accentColor = tone === 'danger' ? colors.danger : colors.accent;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
              <Ionicons color={accentColor} name={iconName} size={22} />
            </View>
            <Text style={[styles.title, { color: tone === 'danger' ? colors.danger : colors.text }]}>{title}</Text>
          </View>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = selectedValue !== undefined && option.value === selectedValue;

              return (
                <Pressable
                  key={String(option.value)}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  style={styles.option}>
                  <Text style={[styles.optionLabel, { color: selected ? accentColor : colors.textSoft }]}>
                    {option.label}
                  </Text>
                  <View style={styles.checkWrap}>
                    {selected ? <Ionicons name="checkmark-circle" size={20} color={accentColor} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  sheet: {
    borderRadius: 28,
    borderWidth: 1,
    maxHeight: '76%',
    overflow: 'hidden',
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  title: {
    flex: 1,
    fontFamily: AppFonts.bold,
    fontSize: 18,
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 54,
  },
  optionLabel: {
    flex: 1,
    fontFamily: AppFonts.semibold,
    fontSize: 17,
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
});
