import { LayoutAnimation, Platform, UIManager } from 'react-native';

// LayoutAnimation setup is handled automatically in modern React Native/New Architecture.


export function runListAnimation() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}
