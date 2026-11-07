import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export type ReportStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Escalated'
  | 'Resolved'
  | 'Dismissed';

const STATUS_COLOR: Record<ReportStatus, { bg: string; text: string }> = {
  Submitted: { bg: '#EFF6FF', text: '#1D4ED8' },
  'Under Review': { bg: '#FFFBEB', text: '#B45309' },
  Escalated: { bg: '#FEF2F2', text: tokens.color.danger },
  Resolved: { bg: '#F0FDF4', text: '#15803D' },
  Dismissed: { bg: '#F8FAFC', text: tokens.color.textMuted },
};

interface StatusChipProps {
  status: ReportStatus;
  testID?: string;
}

export function StatusChip({ status, testID }: StatusChipProps) {
  const { bg, text } = STATUS_COLOR[status];
  return (
    <View testID={testID} style={[styles.chip, { backgroundColor: bg }]}>
      <Text testID={testID ? `${testID}-label` : undefined} style={[styles.label, { color: text }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: tokens.size.chip,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space[2],
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: tokens.font.micro.size,
    lineHeight: tokens.font.micro.lineHeight,
    fontWeight: tokens.font.micro.weight,
    letterSpacing: tokens.font.micro.letterSpacing,
    textTransform: tokens.font.micro.textTransform,
    fontFamily: tokens.font.family,
  },
});
