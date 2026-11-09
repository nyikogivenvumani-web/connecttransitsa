/**
 * app/(tabs)/index.tsx – S2 Home Dashboard.
 *
 * Phase 4 additions (T-S2-2):
 *   - "Report Incident" button → S3
 *   - Up to 3 recent cases as Cards with StatusChip
 *   - Empty state when no cases
 *   - Loading skeleton while fetching
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

import { tokens } from '../../theme/tokens';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusChip, ReportStatus } from '../../components/StatusChip';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';

import { fetchMyCases, CaseSummary } from '../../lib/api/reports';

function accentForStatus(status: ReportStatus) {
  if (status === 'Resolved') return 'verified' as const;
  if (status === 'Escalated') return 'hazard' as const;
  return 'investigating' as const;
}

export default function HomeScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCases()
      .then(setCases)
      .catch(() => {/* silently ignore in shell; full error handling in Phase 5 */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container} testID="screen-s2">
      <Text style={styles.heading}>Home</Text>

      {/* Report Incident button */}
      <Button
        testID="home-report-btn"
        label="Report Incident"
        variant="primary"
        onPress={() => router.push('/report/new')}
        style={styles.reportBtn}
      />

      {/* Recent cases */}
      <Text style={styles.sectionTitle}>Your Recent Cases</Text>

      {loading ? (
        <View testID="home-loading">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </View>
      ) : cases.length === 0 ? (
        <View testID="home-empty-state">
          <EmptyState message="No cases yet. Report an incident to get started." />
        </View>
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item) => item.case_ref}
          renderItem={({ item }) => (
            <Card
              testID={`home-case-card-${item.case_ref}`}
              accent={accentForStatus(item.status as ReportStatus)}
              style={styles.caseCard}
            >
              <View style={styles.caseRow}>
                <Text style={styles.caseRef}>{item.case_ref}</Text>
                <StatusChip status={item.status as ReportStatus} />
              </View>
              <Text style={styles.casePlate}>{item.vehicle_plate}</Text>
              <Text style={styles.caseCategory}>{item.category}</Text>
            </Card>
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.background,
    padding: tokens.space[2],
  },
  heading: {
    fontSize: tokens.font.h2.size,
    fontWeight: tokens.font.h2.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    marginBottom: tokens.space[2],
  },
  reportBtn: {
    marginBottom: tokens.space[3],
  },
  sectionTitle: {
    fontSize: tokens.font.h3.size,
    fontWeight: tokens.font.h3.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    marginBottom: tokens.space[1],
  },
  caseCard: {
    marginBottom: tokens.space[1],
  },
  caseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  caseRef: {
    fontSize: tokens.font.label.size,
    fontWeight: tokens.font.label.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
  },
  casePlate: {
    fontSize: tokens.font.caption.size,
    color: tokens.color.textMuted,
    fontFamily: tokens.font.family,
  },
  caseCategory: {
    fontSize: tokens.font.caption.size,
    color: tokens.color.textMuted,
    fontFamily: tokens.font.family,
  },
});
