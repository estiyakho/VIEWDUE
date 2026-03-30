import React from 'react';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useOnCellActiveAnimation } from 'react-native-draggable-flatlist';

type VerticalScaleDecoratorProps = {
  children: React.ReactNode;
  activeScale?: number;
};

export function VerticalScaleDecorator({ children, activeScale = 1.05 }: VerticalScaleDecoratorProps) {
  const { onActiveAnim } = useOnCellActiveAnimation();
  
  const style = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scaleY: withSpring(1 + (activeScale - 1) * onActiveAnim.value, {
            damping: 15,
            stiffness: 150,
          }) 
        },
      ],
    };
  });
  
  return <Animated.View style={style}>{children}</Animated.View>;
}
