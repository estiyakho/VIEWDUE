import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Inconsolata_400Regular,
  Inconsolata_500Medium,
  Inconsolata_600SemiBold,
  Inconsolata_700Bold,
  useFonts,
} from '@expo-google-fonts/inconsolata';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useLayoutEffect, useMemo, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { useAutoReset } from '@/hooks/use-auto-reset';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTaskStore } from '@/store/use-task-store';
import { getThemeColors } from '@/utils/theme';
import { applyInconsolataDefaults } from '@/utils/typography';

enableScreens(true);
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

type AppLayoutProps = {
  backgroundColor: string;
  hydrated: boolean;
  children: ReactNode;
};

function AppLayout({ backgroundColor, hydrated, children }: AppLayoutProps) {
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const doc = (globalThis as any).document;
    doc?.documentElement && (doc.documentElement.style.backgroundColor = backgroundColor);
    doc?.body && (doc.body.style.backgroundColor = backgroundColor);
  }, [backgroundColor]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
      <SafeAreaProvider style={{ backgroundColor }}>
        {hydrated ? children : <View style={{ flex: 1, backgroundColor }} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  useAutoReset();

  const colorScheme = useColorScheme();
  const settings = useTaskStore((state) => state.settings);
  const hydrated = useTaskStore((state) => state.hydrated);
  const resolvedTheme = settings.theme === 'system' ? colorScheme : settings.theme;
  const palette = useMemo(
    () => getThemeColors(settings, resolvedTheme === 'light' ? 'light' : 'dark'),
    [resolvedTheme, settings]
  );

  const navigationTheme = useMemo(
    () => ({
      dark: resolvedTheme === 'dark',
      colors: {
        ...(resolvedTheme === 'light' ? DefaultTheme.colors : DarkTheme.colors),
        background: palette.background,
        card: palette.surface,
        border: palette.border,
        primary: palette.accent,
        text: palette.text,
      },
    }),
    [palette, resolvedTheme]
  );

  const [loaded] = useFonts({
    Inconsolata_400Regular,
    Inconsolata_500Medium,
    Inconsolata_600SemiBold,
    Inconsolata_700Bold,
  });

  useEffect(() => {
    if (!loaded) {
      return;
    }

    applyInconsolataDefaults();
    SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <AppLayout backgroundColor={palette.background} hydrated={hydrated}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            navigationBarColor: palette.background,
            contentStyle: { backgroundColor: palette.background },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add-task"
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="add-category"
            options={{
              presentation: 'modal',
            }}
          />
        </Stack>
        <StatusBar style={resolvedTheme === 'light' ? 'dark' : 'light'} backgroundColor={palette.background} />
      </AppLayout>
    </ThemeProvider>
  );
}
