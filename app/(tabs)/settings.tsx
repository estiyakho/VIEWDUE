import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';

import { SettingsOptionSheet } from '@/components/settings-option-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTaskStore } from '@/store/use-task-store';
import {
  DefaultScreen,
  FirstDayOfWeek,
  Language,
  ResetInterval,
  SnoozeDuration,
  TimeFormat,
} from '@/types/task';
import { runListAnimation } from '@/utils/layout-animation';
import { formatRelativeResetLabel } from '@/utils/reset';

type SheetKey =
  | null
  | 'theme'
  | 'timeFormat'
  | 'firstDayOfWeek'
  | 'snoozeDuration'
  | 'defaultScreen'
  | 'language'
  | 'resetInterval';

const TIME_FORMATS: { label: string; value: TimeFormat }[] = [
  { label: '12-Hour', value: '12h' },
  { label: '24-Hour', value: '24h' },
];
const FIRST_DAYS: { label: string; value: FirstDayOfWeek }[] = [
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
  { label: 'Monday', value: 'monday' },
];
const SNOOZE_DURATIONS: { label: string; value: SnoozeDuration }[] = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
];
const DEFAULT_SCREENS: { label: string; value: DefaultScreen }[] = [
  { label: 'Categories', value: 'categories' },
  { label: 'All Todos', value: 'todos' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Statistics', value: 'statistics' },
  { label: 'Settings', value: 'settings' },
];
const LANGUAGES: { label: string; value: Language }[] = [
  { label: 'English', value: 'english' },
  { label: 'Spanish', value: 'spanish' },
  { label: 'French', value: 'french' },
];
const RESET_OPTIONS: { label: string; value: ResetInterval }[] = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];
const THEMES = [
  { label: 'Dark', value: 'dark' as const },
  { label: 'System', value: 'system' as const },
];

function Row({
  label,
  value,
  onPress,
  iconName,
}: {
  label: string;
  value: string;
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useAppTheme();

  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: colors.border }]}> 
      <View style={styles.rowLeft}>
        <View style={[styles.rowIconWrap, { backgroundColor: `${colors.accent}16` }]}>
          <Ionicons color={colors.accent} name={iconName} size={18} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.rowValueWrap}>
        <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  iconName,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  iconName: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useAppTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}> 
      <View style={styles.rowLeft}>
        <View style={[styles.rowIconWrap, { backgroundColor: `${colors.accent}16` }]}>
          <Ionicons color={colors.accent} name={iconName} size={18} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        thumbColor="#F8FAFC"
        trackColor={{ false: '#3F3F46', true: colors.accent }}
        value={value}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const colors = useAppTheme();

  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionHeading, { color: colors.accent }]}>{title}</Text>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            shadowColor: '#000000',
          },
        ]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useAppTheme();
  const tasksCount = useTaskStore((state) => state.tasks.length);
  const settings = useTaskStore((state) => state.settings);
  const updateSettings = useTaskStore((state) => state.updateSettings);
  const setResetInterval = useTaskStore((state) => state.setResetInterval);
  const resetTasks = useTaskStore((state) => state.resetTasks);
  const [activeSheet, setActiveSheet] = useState<SheetKey>(null);

  const handleResetNow = () => {
    Alert.alert('Reset all tasks?', 'This clears every task immediately on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Now',
        style: 'destructive',
        onPress: () => {
          runListAnimation();
          resetTasks();
        },
      },
    ]);
  };

  const openSheet = (sheet: SheetKey) => setActiveSheet(sheet);
  const closeSheet = () => setActiveSheet(null);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Shape the app around the way you like to work.</Text>

        <Section title="Appearance">
          <Row label="Theme" value={settings.theme === 'dark' ? 'Dark' : 'System'} onPress={() => openSheet('theme')} iconName="moon-outline" />
          <ToggleRow label="AMOLED Theme" value={settings.amoledTheme} onValueChange={(value) => updateSettings({ amoledTheme: value })} iconName="phone-portrait-outline" />
          <ToggleRow label="Dynamic Colors" value={settings.dynamicColors} onValueChange={(value) => updateSettings({ dynamicColors: value })} iconName="color-palette-outline" />
          <ToggleRow label="Show Images" value={settings.showImages} onValueChange={(value) => updateSettings({ showImages: value })} iconName="image-outline" />
        </Section>

        <Section title="Date & Time">
          <Row label="Time Format" value={settings.timeFormat === '12h' ? '12-Hour' : '24-Hour'} onPress={() => openSheet('timeFormat')} iconName="time-outline" />
          <Row label="First Day of the Week" value={FIRST_DAYS.find((item) => item.value === settings.firstDayOfWeek)?.label ?? 'Saturday'} onPress={() => openSheet('firstDayOfWeek')} iconName="calendar-clear-outline" />
          <Row label="Snooze Duration" value={`${settings.snoozeDuration} min`} onPress={() => openSheet('snoozeDuration')} iconName="alarm-outline" />
        </Section>

        <Section title="Privacy & Security">
          <ToggleRow label="Screen Privacy" value={settings.screenPrivacy} onValueChange={(value) => updateSettings({ screenPrivacy: value })} iconName="shield-checkmark-outline" />
        </Section>

        <Section title="App Preferences">
          <Row label="Default Screen" value={DEFAULT_SCREENS.find((item) => item.value === settings.defaultScreen)?.label ?? 'All Todos'} onPress={() => openSheet('defaultScreen')} iconName="layers-outline" />
          <Row label="Language" value={LANGUAGES.find((item) => item.value === settings.language)?.label ?? 'English'} onPress={() => openSheet('language')} iconName="language-outline" />
        </Section>

        <Section title="Data Management">
          <Row label="Reset Interval" value={formatRelativeResetLabel(settings.resetInterval)} onPress={() => openSheet('resetInterval')} iconName="refresh-circle-outline" />
          <View style={[styles.row, { borderBottomColor: colors.border }]}> 
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, { backgroundColor: `${colors.accent}16` }]}>
                <Ionicons color={colors.accent} name="archive-outline" size={18} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Stored Tasks</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>{tasksCount}</Text>
          </View>
          <Pressable onPress={handleResetNow} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset Now</Text>
          </Pressable>
        </Section>
      </ScrollView>

      <SettingsOptionSheet
        visible={activeSheet === 'theme'}
        title="Theme"
        iconName="moon-outline"
        options={THEMES}
        selectedValue={settings.theme}
        onClose={closeSheet}
        onSelect={(value) => updateSettings({ theme: value })}
      />
      <SettingsOptionSheet
        visible={activeSheet === 'timeFormat'}
        title="Time Format"
        iconName="time-outline"
        options={TIME_FORMATS}
        selectedValue={settings.timeFormat}
        onClose={closeSheet}
        onSelect={(value) => updateSettings({ timeFormat: value })}
      />
      <SettingsOptionSheet
        visible={activeSheet === 'firstDayOfWeek'}
        title="First Day of the Week"
        iconName="calendar-clear-outline"
        options={FIRST_DAYS}
        selectedValue={settings.firstDayOfWeek}
        onClose={closeSheet}
        onSelect={(value) => updateSettings({ firstDayOfWeek: value })}
      />
      <SettingsOptionSheet
        visible={activeSheet === 'snoozeDuration'}
        title="Snooze Duration"
        iconName="alarm-outline"
        options={SNOOZE_DURATIONS}
        selectedValue={settings.snoozeDuration}
        onClose={closeSheet}
        onSelect={(value) => updateSettings({ snoozeDuration: value })}
      />
      <SettingsOptionSheet
        visible={activeSheet === 'defaultScreen'}
        title="Default Screen"
        iconName="layers-outline"
        options={DEFAULT_SCREENS}
        selectedValue={settings.defaultScreen}
        onClose={closeSheet}
        onSelect={(value) => updateSettings({ defaultScreen: value })}
      />
      <SettingsOptionSheet
        visible={activeSheet === 'language'}
        title="Language"
        iconName="language-outline"
        options={LANGUAGES}
        selectedValue={settings.language}
        onClose={closeSheet}
        onSelect={(value) => updateSettings({ language: value })}
      />
      <SettingsOptionSheet
        visible={activeSheet === 'resetInterval'}
        title="Reset Interval"
        iconName="refresh-circle-outline"
        options={RESET_OPTIONS}
        selectedValue={settings.resetInterval}
        onClose={closeSheet}
        onSelect={(value) => setResetInterval(value)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  sectionWrap: { marginBottom: 18 },
  sectionHeading: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  sectionCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: 16,
  },
  rowLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  rowIconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowValueWrap: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  rowValue: { fontSize: 14, fontWeight: '500' },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    borderRadius: 18,
    margin: 16,
    paddingVertical: 15,
  },
  resetButtonText: { color: '#FEE2E2', fontSize: 15, fontWeight: '700' },
});
