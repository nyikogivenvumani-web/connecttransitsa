import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../theme/tokens';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { OtpInput } from '../../components/OtpInput';
import {
  signUpWithEmail,
  signUpWithPhone,
  signIn,
  verifyOtp,
} from '../../lib/api/auth';
import {
  authenticateWithBiometrics,
  getBiometricPreference,
} from '../../lib/biometric';

type AuthMode = 'sign_in' | 'sign_up' | 'otp';
type Channel = 'email' | 'phone';

export default function WelcomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [channel, setChannel] = useState<Channel>('email');

  // Form fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  React.useEffect(() => {
    getBiometricPreference().then((enabled) => setHasBiometrics(enabled));
  }, []);

  const handleBiometricUnlock = async () => {
    setError(null);
    const ok = await authenticateWithBiometrics();
    if (ok) {
      router.replace('/(tabs)');
    } else {
      setError('Biometric sign-in failed. Use your password.');
      setHasBiometrics(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(emailOrPhone, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!privacyAgreed) return;
    setError(null);
    setLoading(true);
    try {
      if (channel === 'email') {
        await signUpWithEmail({
          email: emailOrPhone,
          fullName,
          idNumber,
          password,
        });
      } else {
        await signUpWithPhone({
          phone: emailOrPhone,
          fullName,
          idNumber,
        });
      }
      setMode('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(emailOrPhone, otpCode, channel === 'phone' ? 'sms' : 'email');
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ConnectTransit SA</Text>
      <Text style={styles.subtitle}>
        {mode === 'sign_in' ? 'Sign in to your account' : mode === 'sign_up' ? 'Create an account' : 'Enter 6-digit verification code'}
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {mode === 'otp' ? (
        <View style={styles.form}>
          <OtpInput
            testID="auth-otp"
            value={otpCode}
            onChange={setOtpCode}
            onResend={() => channel === 'email' ? signUpWithEmail({ email: emailOrPhone, fullName, idNumber, password }) : signUpWithPhone({ phone: emailOrPhone, fullName, idNumber })}
            resendCooldownSeconds={0}
          />
          <View style={{ height: 16 }} />
          <Button
            testID="auth-verify-btn"
            variant="primary"
            label="Verify & Continue"
            onPress={handleVerifyOtp}
            loading={loading}
            disabled={otpCode.length !== 6}
          />
        </View>
      ) : mode === 'sign_in' ? (
        <View style={styles.form}>
          <TextField
            testID="auth-identifier"
            label="Email or Phone number"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            placeholder="e.g. name@example.co.za or +27..."
          />
          <TextField
            testID="auth-password"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            testID="auth-submit-btn"
            variant="primary"
            label="Sign In"
            onPress={handleSignIn}
            loading={loading}
          />

          {hasBiometrics ? (
            <TouchableOpacity testID="auth-biometric-btn" style={styles.bioBtn} onPress={handleBiometricUnlock}>
              <Text style={styles.bioText}>Use biometrics</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            testID="auth-toggle-mode-btn"
            style={styles.switchBtn}
            onPress={() => setMode('sign_up')}
          >
            <Text style={styles.switchText}>Need an account? Create one</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="auth-forgot-password-btn"
            style={styles.switchBtn}
            onPress={() => router.push('/(auth)/reset-password')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.channelRow}>
            <TouchableOpacity
              testID="auth-email-tab"
              style={[styles.channelBtn, channel === 'email' && styles.channelBtnActive]}
              onPress={() => setChannel('email')}
            >
              <Text style={[styles.channelText, channel === 'email' && styles.channelTextActive]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="auth-phone-tab"
              style={[styles.channelBtn, channel === 'phone' && styles.channelBtnActive]}
              onPress={() => setChannel('phone')}
            >
              <Text style={[styles.channelText, channel === 'phone' && styles.channelTextActive]}>Phone</Text>
            </TouchableOpacity>
          </View>

          <TextField
            testID="auth-name"
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
          />

          <TextField
            testID="auth-id"
            label="South African ID Number"
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder="13-digit ID number"
            keyboardType="number-pad"
            maxLength={13}
          />

          <TextField
            testID={channel === 'email' ? 'auth-email' : 'auth-phone'}
            label={channel === 'email' ? 'Email Address' : 'Phone Number (+27...)'}
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
          />

          {channel === 'email' ? (
            <TextField
              testID="auth-signup-password"
              label="Password (min 8 chars, uppercase, lowercase & digit)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          ) : null}

          <View style={styles.privacyRow}>
            <Switch
              testID="auth-privacy-switch"
              value={privacyAgreed}
              onValueChange={setPrivacyAgreed}
              trackColor={{ true: tokens.color.primary, false: tokens.color.border }}
            />
            <Text style={styles.privacyText}>
              I agree to the Terms of Service & Privacy Notice. I understand severe incidents are reported to SAPS.
            </Text>
          </View>

          <Button
            testID="auth-submit-btn"
            variant="primary"
            label="Continue"
            onPress={handleSignUp}
            loading={loading}
            disabled={!privacyAgreed || !fullName || !idNumber || !emailOrPhone}
          />

          <TouchableOpacity
            testID="auth-toggle-mode-btn"
            style={styles.switchBtn}
            onPress={() => setMode('sign_in')}
          >
            <Text style={styles.switchText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.space[3],
    backgroundColor: tokens.color.background,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: tokens.font.h1.size,
    fontWeight: tokens.font.h1.weight,
    color: tokens.color.text,
    textAlign: 'center',
    marginBottom: tokens.space[1],
    fontFamily: tokens.font.family,
  },
  subtitle: {
    fontSize: tokens.font.body.size,
    color: tokens.color.textMuted,
    textAlign: 'center',
    marginBottom: tokens.space[3],
    fontFamily: tokens.font.family,
  },
  form: {
    gap: tokens.space[2],
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: tokens.color.danger,
    borderWidth: 1,
    padding: tokens.space[2],
    borderRadius: tokens.radius.card,
    marginBottom: tokens.space[2],
  },
  errorText: {
    color: tokens.color.danger,
    fontSize: tokens.font.caption.size,
    fontFamily: tokens.font.family,
  },
  channelRow: {
    flexDirection: 'row',
    gap: tokens.space[1],
    marginBottom: tokens.space[1],
  },
  channelBtn: {
    flex: 1,
    height: 40,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.color.surface,
  },
  channelBtnActive: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
  },
  channelText: {
    fontSize: tokens.font.labelSmall.size,
    color: tokens.color.text,
  },
  channelTextActive: {
    color: tokens.color.surface,
    fontWeight: tokens.font.label.weight,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[1],
    marginVertical: tokens.space[1],
  },
  privacyText: {
    flex: 1,
    fontSize: tokens.font.caption.size,
    color: tokens.color.textMuted,
    fontFamily: tokens.font.family,
  },
  switchBtn: {
    marginTop: tokens.space[1],
    alignItems: 'center',
  },
  switchText: {
    fontSize: tokens.font.label.size,
    color: tokens.color.primary,
  },
  forgotText: {
    fontSize: tokens.font.caption.size,
    color: tokens.color.textMuted,
  },
  bioBtn: {
    height: 48,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.space[1],
  },
  bioText: {
    color: tokens.color.primary,
    fontSize: tokens.font.label.size,
    fontWeight: tokens.font.label.weight,
  },
});
