import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { tokens } from '../../theme/tokens';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusChip, ReportStatus } from '../../components/StatusChip';
import { StatusTimeline } from '../../components/StatusTimeline';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { TextField } from '../../components/TextField';
import {
  CaseDetail, PlateResult, NOT_FOUND_MESSAGE, REFERENCE_PATTERN, MIN_PLATE_CHARS,
  fetchAllMyCases, fetchCaseByRef, searchByPlate, getCachedCases, setCachedCases,
} from '../../lib/api/cases';
import { messages } from '../../constants/messages';

type Mode = 'my' | 'search';
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-ZA');

function Decision({ decision, reasoning }: { decision: string | null; reasoning: string | null }) {
  if (!decision && !reasoning) return null;
  return (
    <View style={styles.decision}>
      {decision ? <Text style={styles.bold}>{decision}</Text> : null}
      {reasoning ? <Text style={styles.text}>{reasoning}</Text> : null}
    </View>
  );
}

/** S4 – Case Tracker: "My cases" and "Search" (reference number or plate). */
export default function TrackScreen() {
  const params = useLocalSearchParams<{ case_ref?: string }>();
  const [mode, setMode] = useState<Mode>('my');
  const [cases, setCases] = useState<CaseDetail[] | null>(getCachedCases());
  const [loading, setLoading] = useState(getCachedCases() === null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [plateResults, setPlateResults] = useState<PlateResult[] | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchAllMyCases();
      setCachedCases(list);
      setCases(list);
      setOffline(false);
    } catch (e) {
      if (getCachedCases()) {
        setCases(getCachedCases());
        setOffline(true);
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = NetInfo.addEventListener((s) => {
      setOffline(s.isConnected === false);
      if (s.isConnected) load();
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [load]);

  const openRef = useCallback(async (ref: string) => {
    setMode('search');
    setQuery(ref);
    setSearching(true);
    setSearchMessage(null);
    setPlateResults(null);
    setDetail(null);
    try {
      const found = await fetchCaseByRef(ref);
      if (found) setDetail(found);
      else setSearchMessage(NOT_FOUND_MESSAGE);
    } catch (e) {
      setSearchMessage(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSearching(false);
    }
  }, []);

  // Opened from a push notification (T-S4-2).
  useEffect(() => {
    if (params.case_ref) openRef(String(params.case_ref));
  }, [params.case_ref, openRef]);

  const runSearch = async () => {
    const text = query.trim();
    setDetail(null);
    setPlateResults(null);
    setSearchMessage(null);
    if (REFERENCE_PATTERN.test(text)) return openRef(text);
    if (text.replace(/[^a-z0-9]/gi, '').length < MIN_PLATE_CHARS) return; // T-US3-5: show nothing
    setSearching(true);
    try {
      const rows = await searchByPlate(text);
      if (rows.length === 0) setSearchMessage(NOT_FOUND_MESSAGE);
      setPlateResults(rows);
    } catch (e) {
      setSearchMessage(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="screen-s4">
      {offline && <Text testID="track-offline" style={styles.offline}>{messages.offlineGeneral}</Text>}

      <View style={styles.tabs}>
        <TouchableOpacity testID="track-mode-my" onPress={() => setMode('my')} accessibilityRole="button">
          <Text style={[styles.tab, mode === 'my' && styles.tabActive]}>My cases</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="track-mode-search" onPress={() => setMode('search')} accessibilityRole="button">
          <Text style={[styles.tab, mode === 'search' && styles.tabActive]}>Search</Text>
        </TouchableOpacity>
      </View>

      {mode === 'my' && (
        <>
          {loading && <Skeleton shape="card" testID="track-loading" />}
          {error && (
            <View testID="track-error">
              <Text style={styles.text}>{error}</Text>
              <Button testID="track-retry-btn" variant="secondary" label={messages.retry} onPress={() => { setLoading(true); load(); }} />
            </View>
          )}
          {!loading && !error && cases?.length === 0 && (
            <View testID="track-empty"><EmptyState message="You haven't reported any incidents yet." /></View>
          )}
          {cases?.map((c) => (
            <TouchableOpacity key={c.id} testID={`track-case-${c.case_ref}`} onPress={() => openRef(c.case_ref)}>
              <Card>
                <Text style={styles.bold}>{c.case_ref}</Text>
                <Text style={styles.text}>{c.category} · {c.vehicle_plate}</Text>
                <StatusChip status={c.status as ReportStatus} />
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}

      {mode === 'search' && (
        <>
          <TextField
            testID="track-search"
            label="Reference number or vehicle plate"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
          />
          <Button testID="track-search-btn" variant="primary" label="Search" loading={searching} onPress={runSearch} />
          {searchMessage && <Text testID="track-search-message" style={styles.text}>{searchMessage}</Text>}

          {detail && (
            <Card testID="track-detail">
              <Text style={styles.bold}>{detail.case_ref}</Text>
              <StatusTimeline currentStatus={detail.status as ReportStatus} />
              <Text style={styles.text}>{detail.category} · {detail.vehicle_plate}</Text>
              <Text style={styles.text}>{detail.unlisted_entity_name ?? detail.organization_name}</Text>
              <Text style={styles.text}>{detail.description}</Text>
              <Decision decision={detail.admin_decision} reasoning={detail.decision_reasoning} />
            </Card>
          )}

          {plateResults?.map((r, i) => (
            <Card key={i} testID={`track-plate-result-${i}`}>
              <Text style={styles.bold}>{r.category}</Text>
              <Text style={styles.text}>{r.vehicle_plate}</Text>
              <Text style={styles.text}>{r.organization_name}</Text>
              <StatusChip status={r.status as ReportStatus} />
              <Text style={styles.text}>{fmt(r.incident_at)}</Text>
              <Text style={styles.text}>{r.description}</Text>
              <Decision decision={r.admin_decision} reasoning={r.decision_reasoning} />
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background },
  content: { padding: tokens.space[2], gap: tokens.space[2] },
  tabs: { flexDirection: 'row', gap: tokens.space[3] },
  tab: { fontSize: 16, color: tokens.color.textMuted, paddingVertical: tokens.space[1] },
  tabActive: { color: tokens.color.text, fontWeight: '700' },
  bold: { fontWeight: '700', color: tokens.color.text },
  text: { color: tokens.color.text },
  decision: { marginTop: tokens.space[1], gap: 4 },
  offline: { color: tokens.color.text, backgroundColor: tokens.color.info, padding: tokens.space[1] },
});
