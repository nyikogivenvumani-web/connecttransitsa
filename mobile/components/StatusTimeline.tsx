import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import type { ReportStatus } from './StatusChip';

const STEPS = ['Submitted', 'Under Review', 'Decision Published'] as const;

type TimelineStep = (typeof STEPS)[number];

function statusToStep(status: ReportStatus): TimelineStep {
  if (status === 'Resolved' || status === 'Dismissed') return 'Decision Published';
  if (status === 'Under Review' || status === 'Escalated') return 'Under Review';
  return 'Submitted';
}

interface StatusTimelineProps {
  currentStatus: ReportStatus;
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const activeStep = statusToStep(currentStatus);
  const activeIndex = STEPS.indexOf(activeStep);

  return (
    <View style={styles.row}>
      {STEPS.map((step, index) => {
        const isActive = index <= activeIndex;
        return (
          <React.Fragment key={step}>
            <View
              testID={`timeline-step-${index}`}
              style={[styles.step, isActive ? styles.stepActive : styles.stepInactive]}
            >
              <View style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive]} />
              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                {step}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View style={[styles.connector, isActive ? styles.connectorActive : null]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    alignItems: 'center',
    maxWidth: 80,
  },
  stepActive: {
    opacity: 1,
  },
  stepInactive: {
    opacity: 0.4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: tokens.space.tight,
  },
  dotActive: {
    backgroundColor: tokens.color.primary,
  },
  dotInactive: {
    backgroundColor: tokens.color.border,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: tokens.color.border,
    marginTop: 5,
  },
  connectorActive: {
    backgroundColor: tokens.color.primary,
  },
  label: {
    fontSize: tokens.font.caption.size,
    textAlign: 'center',
    fontFamily: tokens.font.family,
  },
  labelActive: {
    color: tokens.color.text,
    fontWeight: tokens.font.label.weight,
  },
  labelInactive: {
    color: tokens.color.textMuted,
  },
});
