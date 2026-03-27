import { DefaultTheme, DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useAutoReset } from '@/hooks/use-auto-reset';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTaskStore } from '@/store/use-task-store';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useAutoReset();

  const colorScheme = useColorScheme();
  const themePreference = useTaskStore((state) => state.settings.theme);
  const resolvedTheme = themePreference === 'system' ? colorScheme : 'dark';

  return (
    <ThemeProvider value={resolvedTheme === 'light' ? DefaultTheme : DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-task"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="add-category"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
      <StatusBar style={resolvedTheme === 'light' ? 'dark' : 'light'} />
    </ThemeProvider>
  );
}
