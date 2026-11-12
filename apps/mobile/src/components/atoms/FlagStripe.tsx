import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@paiementbj/ui';

export function FlagStripe({ height = 4 }: { height?: number }) {
  return (
    <View style={[styles.bar, { height }]} accessibilityElementsHidden={true}>
      <View style={[styles.seg, { backgroundColor: colors.beninGreen }]} />
      <View style={[styles.seg, { backgroundColor: colors.beninYellow }]} />
      <View style={[styles.seg, { backgroundColor: colors.beninRed }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    width: 72,
    borderRadius: 4,
    overflow: 'hidden',
  },
  seg: {
    flex: 1,
  },
});
