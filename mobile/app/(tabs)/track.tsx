import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

/** S4 – Case Tracker. Full implementation in Phase 5. */
export default function TrackScreen() {
  return (
    <View style={styles.container} testID="screen-s4">
      <Text style={styles.title}>Track Cases</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background, padding: tokens.space[2] },
  title: { fontSize: tokens.font.h2.size, fontWeight: tokens.font.h2.weight, color: tokens.color.text },
});
