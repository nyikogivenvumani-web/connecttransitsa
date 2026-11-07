import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

/** S2 – Home Dashboard. Full implementation in Phase 4. */
export default function HomeScreen() {
  return (
    <View style={styles.container} testID="screen-s2">
      <Text style={styles.title}>Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background, padding: tokens.space[2] },
  title: { fontSize: tokens.font.h2.size, fontWeight: tokens.font.h2.weight, color: tokens.color.text },
});
