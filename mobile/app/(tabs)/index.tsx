import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { tokens } from '../../theme/tokens';
import { Button } from '../../components/Button';
import { SosButton } from '../../components/SosButton';
import { sosSession } from '../../lib/sosSession';
import { Card } from '../../components/Card';
import { StatusChip } from '../../components/StatusChip';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { OfflineBanner } from '../../components/OfflineBanner';
import { fetchMyCases, CaseSummary } from '../../lib/api/reports';
import { retryPendingDrafts } from '../../lib/offlineQueue';

/** S2 – Home Dashboard: report button + up to 3 recent cases. */
export default function HomeScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setCases(await fetchMyCases());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your cases.');
      setCases((c) => c ?? []);
    }
  }, []);

  useEffect(() => {
    load();
    // After login, send any report saved while the login had expired or the phone was offline (T-EDGE-5).
    retryPendingDrafts().then((sent) => { if (sent > 0) load(); }).catch(() => undefined);
    const unsub = NetInfo.addEventListener((state) => {
      const isOffline = state.isConnected === false;
      setOffline(isOffline);
      if (!isOffline) {
        void sosSession.onReconnect();
        retryPendingDrafts()
          .then((sent) => { if (sent > 0) load(); })
          .catch(() => undefined);
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [load]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="screen-s2">
      <OfflineBanner />
      <Button
        testID="home-report-btn"
        variant="primary"
        label="Report Incident"
        onPress={() => router.push('/report/new')}
      />
      <SosButton
        testID="home-sos-btn"
        onTrigger={() => {
          void sosSession.start(Date.now());
          router.push('/sos/active');
        }}
      />
      <Text style={styles.title}>Recent cases</Text>
      {cases === null && <Skeleton shape="card" testID="home-loading" />}
      {error && <Text testID="home-error" style={styles.error}>{error}</Text>}
      {cases !== null && cases.length === 0 && !error && (
        <View testID="home-empty-state">
          <EmptyState message="You haven't reported any incidents yet." />
        </View>
      )}
      {cases?.slice(0, 3).map((c) => (
        <Card key={c.id} testID={`home-case-card-${c.case_ref}`}>
          <Text style={styles.ref}>{c.case_ref}</Text>
          <Text style={styles.meta}>{c.category} · {c.vehicle_plate}</Text>
          <StatusChip status={c.status as any} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background },
  content: { padding: tokens.space[2], gap: tokens.space[2] },
  title: { fontSize: tokens.font.h2.size, fontWeight: tokens.font.h2.weight, color: tokens.color.text },
  ref: { fontWeight: '700', color: tokens.color.text },
  meta: { color: tokens.color.text },
  error: { color: tokens.color.text },
});
