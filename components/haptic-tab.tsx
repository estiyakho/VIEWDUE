import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function HapticTab(props: BottomTabBarButtonProps) {
  const colors = useAppTheme();
  const selected = Boolean(props.accessibilityState?.selected);

  return (
    <PlatformPressable
      {...props}
      style={[styles.pressable, props.style]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}>
      <View
        style={[
          styles.inner,
          selected && { backgroundColor: `${colors.accent}1F`, borderColor: `${colors.accent}2E` },
        ]}>
        {props.children}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
});
