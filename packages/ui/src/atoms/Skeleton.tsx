import React, { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { layout } from '../tokens/spacing';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  reducedMotion?: boolean;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = layout.borderRadius.xs,
  reducedMotion,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    let active = true;
    let anim: Animated.CompositeAnimation | null = null;

    const startIfAllowed = async () => {
      const systemReduced =
        typeof reducedMotion === 'boolean'
          ? reducedMotion
          : await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (!active || systemReduced) return;

      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.55,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    };

    startIfAllowed();

    return () => {
      active = false;
      anim?.stop();
    };
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      accessible={true}
      accessibilityLabel="Chargement du contenu"
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
});
