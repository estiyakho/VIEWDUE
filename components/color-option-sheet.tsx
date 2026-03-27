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
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Pick a color that feels right for the app.</Text>

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
                  style={[styles.colorCard, { backgroundColor: colors.surface, borderColor: selected ? option.value : colors.border }]}>
                  <View style={[styles.swatch, { backgroundColor: option.value }]} />
                  <Text style={[styles.label, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[styles.status, { color: selected ? option.value : colors.textMuted }]}>
                    {selected ? 'Selected' : 'Tap to use'}
                  </Text>
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
    padding: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    minHeight: 116,
    padding: 14,
    width: '47%',
  },
  swatch: {
    borderRadius: 16,
    height: 40,
    marginBottom: 12,
    width: 40,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
});
