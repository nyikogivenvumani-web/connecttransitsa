import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

/** S1 – Auth / Onboarding. Full implementation in Phase 3. */
export default function WelcomeScreen() {
  return (
    <View style={styles.container} testID="screen-s1">
      <Text style={styles.title}>ConnectTransit SA</Text>
      <Text style={styles.subtitle}>Sign in or create an account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.space[2],
  },
  title: {
    fontSize: tokens.font.h1.size,
    fontWeight: tokens.font.h1.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    marginBottom: tokens.space[1],
  },
  subtitle: {
    fontSize: tokens.font.body.size,
    color: tokens.color.textMuted,
    fontFamily: tokens.font.family,
  },
});
