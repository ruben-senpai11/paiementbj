import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';

export interface BeninFlagBarProps {
  height?: number;
  width?: number | `${number}%`;
  style?: ViewStyle;
}

export const BeninFlagBar: React.FC<BeninFlagBarProps> = ({
  height = 5,
  width = '100%',
  style,
}) => {
  return (
    <View
      style={[styles.strip, { height, width }, style]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.bar, { backgroundColor: colors.beninGreen }]} />
      <View style={[styles.bar, { backgroundColor: colors.beninYellow }]} />
      <View style={[styles.bar, { backgroundColor: colors.beninRed }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bar: {
    flex: 1,
  },
});
