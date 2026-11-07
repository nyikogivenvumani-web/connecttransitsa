import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export type SkeletonShape = 'line' | 'card';

interface SkeletonProps {
  shape: SkeletonShape;
  testID?: string;
}

export function Skeleton({ shape, testID }: SkeletonProps) {
  return (
    <View
      testID={testID}
      style={[styles.base, shape === 'line' ? styles.line : styles.card]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.color.border,
    borderRadius: tokens.radius.card,
  },
  line: {
    height: 16,
    marginBottom: tokens.space[1],
  },
  card: {
    height: tokens.size.row.double,
    marginBottom: tokens.space[2],
  },
});
