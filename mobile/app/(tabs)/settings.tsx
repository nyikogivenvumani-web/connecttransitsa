import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

/** S5 – Settings and Profile. Full implementation in Phase 3. */
export default function SettingsScreen() {
  return (
    <View style={styles.container} testID="screen-s5">
      <Text style={styles.title}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background, padding: tokens.space[2] },
  title: { fontSize: tokens.font.h2.size, fontWeight: tokens.font.h2.weight, color: tokens.color.text },
});
