import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Share, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../theme/tokens';
import { useSos, sosSession } from '../../lib/sosSession';
import { SOS_STOP_HOLD_MS } from '../../lib/rules/sos';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? '';

/** S8 – SOS Active. Hold "Stop sharing" for 3 seconds to stop (BR11). No design yet: flagged for review. */
export default function SosActiveScreen() {
  const router = useRouter();
  const sos = useSos();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);

  const startHold = () => {
    holdTimer.current = setTimeout(async () => {
      holdTimer.current = null;
      await sosSession.stop();
      router.replace('/(tabs)');
    }, SOS_STOP_HOLD_MS);
  };
  const cancelHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  };

  const link = sos.shareToken && WEB_URL ? `${WEB_URL}/live/${sos.shareToken}` : null;

  return (
    <View style={styles.container} testID="screen-s8">
      <Text style={styles.heading}>Sharing your live location with SAPS</Text>
      {sos.offline && <Text style={styles.banner}>SOS could not be sent. We will keep trying.</Text>}
      {sos.usedCached && (
        <Text testID="sos-cached-banner" style={styles.banner}>
          Location is off. Your last known position was sent. Turn on location for live updates.
        </Text>
      )}
      {sos.noLocation && <Text style={styles.banner}>No location is available. SAPS has been alerted.</Text>}
      {link && (
        <Pressable testID="sos-share-link" onPress={() => Share.share({ message: link })}>
          <Text style={styles.link}>Share live link: {link}</Text>
        </Pressable>
      )}
      <Pressable testID="sos-stop-btn" onPressIn={startHold} onPressOut={cancelHold} style={styles.stop} accessibilityRole="button">
        <Text style={styles.stopText}>Hold for 3 seconds to stop sharing</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.danger, padding: tokens.space[3], justifyContent: 'center', gap: tokens.space[2] },
  heading: { color: '#fff', fontSize: tokens.font.h2.size, fontWeight: tokens.font.h2.weight, textAlign: 'center' },
  banner: { color: tokens.color.text, backgroundColor: '#fff', padding: tokens.space[1], borderRadius: 8 },
  link: { color: '#fff', textDecorationLine: 'underline', textAlign: 'center' },
  stop: { backgroundColor: '#fff', borderRadius: tokens.radius.pill, height: tokens.size.sosButton, justifyContent: 'center', alignItems: 'center' },
  stopText: { color: tokens.color.danger, fontWeight: '700' },
});
