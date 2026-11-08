/**
 * app/report/success.tsx – S7 Report Success screen.
 * T-S7-1: Shows case reference, PRD tone message, and "Done" button.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { tokens } from '../../theme/tokens';
import { Button } from '../../components/Button';

export default function ReportSuccessScreen() {
  const router = useRouter();
  const { case_ref } = useLocalSearchParams<{ case_ref: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Text style={styles.icon}>✅</Text>
      </View>

      <Text style={styles.heading}>Report Submitted</Text>

      <Text
        testID="success-case-ref"
        style={styles.caseRef}
        accessibilityLabel={`Case reference number ${case_ref}`}
      >
        {case_ref ?? '—'}
      </Text>

      <Text style={styles.message}>
        Your incident report has been securely lodged. Your identity remains
        strictly confidential.
      </Text>

      <Button
        testID="success-done-btn"
        label="Done"
        variant="primary"
        onPress={() => router.replace('/(tabs)')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.background,
    padding: tokens.space[3],
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
  },
  iconRow: {
    marginBottom: tokens.space[1],
  },
  icon: {
    fontSize: 56,
  },
  heading: {
    fontSize: tokens.font.h2.size,
    fontWeight: tokens.font.h2.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    textAlign: 'center',
  },
  caseRef: {
    fontSize: tokens.font.h3.size,
    fontWeight: tokens.font.h3.weight,
    color: tokens.color.primary,
    fontFamily: tokens.font.family,
    textAlign: 'center',
    marginVertical: tokens.space[1],
  },
  message: {
    fontSize: tokens.font.body.size,
    color: tokens.color.textMuted,
    fontFamily: tokens.font.family,
    textAlign: 'center',
    lineHeight: tokens.font.body.lineHeight,
    marginBottom: tokens.space[2],
  },
});
