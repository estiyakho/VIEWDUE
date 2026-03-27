import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type ColorOption = {
  label: string;
  value: string;
};

type ColorOptionSheetProps = {
  visible: boolean;
  title: string;
  options: ColorOption[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function ColorOptionSheet({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}: ColorOptionSheetProps) {
  const colors = useAppTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          <View style={styles.grid}>
            {options.map((option) => {
              const selected = option.value === selectedValue;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  style={styles.item}>
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: option.value,
                        borderColor: selected ? colors.text : 'transparent',
                      },
                    ]}>
                    {selected ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
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
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '14%',
    minWidth: 52,
  },
  swatch: {
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 2,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
});
