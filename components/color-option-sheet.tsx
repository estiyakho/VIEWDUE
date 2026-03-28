import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/fonts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ColorPalette, findPaletteByColor } from '@/utils/color-palettes';

type ColorOptionSheetProps = {
  visible: boolean;
  title: string;
  palettes: ColorPalette[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function ColorOptionSheet({
  visible,
  title,
  palettes,
  selectedValue,
  onClose,
  onSelect,
}: ColorOptionSheetProps) {
  const colors = useAppTheme();
  const initialPalette = useMemo(() => findPaletteByColor(selectedValue, palettes), [palettes, selectedValue]);
  const [activePaletteLabel, setActivePaletteLabel] = useState(initialPalette.label);

  useEffect(() => {
    setActivePaletteLabel(initialPalette.label);
  }, [initialPalette.label, visible]);

  const activePalette = palettes.find((palette) => palette.label === activePaletteLabel) ?? initialPalette;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}> 
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}> 
              <Ionicons name="close" size={18} color={colors.textSoft} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.paletteGrid} showsVerticalScrollIndicator={false}>
            {palettes.map((palette) => {
              const paletteSelected = palette.label === activePalette.label;
              const paletteColor = palette.shades[3];

              return (
                <Pressable
                  key={palette.label}
                  onPress={() => {
                    setActivePaletteLabel(palette.label);
                    onSelect(paletteColor);
                  }}
                  style={[
                    styles.paletteCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: paletteSelected ? paletteColor : colors.border,
                    },
                  ]}>
                  <View style={[styles.paletteSwatch, { backgroundColor: paletteColor }]} />
                  <Text style={[styles.paletteLabel, { color: colors.text }]}>{palette.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.shadesPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.shadesHeader}>
              <Text style={[styles.shadesTitle, { color: colors.text }]}>Shades</Text>
              <Text style={[styles.shadesCaption, { color: colors.textMuted }]}>{activePalette.label}</Text>
            </View>
            <View style={styles.shadesRow}>
              {activePalette.shades.map((shade) => {
                const selected = shade === selectedValue;
                return (
                  <Pressable
                    key={shade}
                    onPress={() => {
                      onSelect(shade);
                      onClose();
                    }}
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
    maxHeight: '82%',
    padding: 20,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontFamily: AppFonts.bold,
    fontSize: 20,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 6,
  },
  paletteCard: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    minWidth: '30%',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  paletteSwatch: {
    borderRadius: 14,
    height: 28,
    marginBottom: 8,
    width: 28,
  },
  paletteLabel: {
    fontFamily: AppFonts.semibold,
    fontSize: 12,
  },
  shadesPanel: {
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
  shadesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shadesTitle: {
    fontFamily: AppFonts.bold,
    fontSize: 16,
  },
  shadesCaption: {
    fontFamily: AppFonts.medium,
    fontSize: 13,
  },
  shadesRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  shadeButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
});
