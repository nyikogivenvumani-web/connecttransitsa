import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../theme/tokens';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { OtpInput } from '../../components/OtpInput';
import { resetPassword, updatePassword } from '../../lib/api/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const msg = await resetPassword(email);
      setMessage(msg);
      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError(null);
    setLoading(true);
    try {
      await updatePassword(newPassword);
      router.replace('/(auth)/welcome');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        {step === 'request'
          ? 'Enter your email to receive a password reset code.'
          : 'Enter the 6-digit code and choose a new password.'}
      </Text>

      {message ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{message}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {step === 'request' ? (
        <View style={styles.form}>
          <TextField
            testID="reset-email"
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Button
            testID="reset-submit-btn"
            variant="primary"
            label="Send Reset Code"
            onPress={handleRequestCode}
            loading={loading}
            disabled={!email}
          />

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.switchText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <OtpInput
            testID="reset-token-input"
            value={code}
            onChange={setCode}
            onResend={handleRequestCode}
            resendCooldownSeconds={0}
          />

          <TextField
            testID="reset-new-password"
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Button
            testID="reset-submit-btn"
            variant="primary"
            label="Update Password"
            onPress={handleUpdatePassword}
            loading={loading}
            disabled={code.length !== 6 || !newPassword}
          />
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
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderColor: tokens.color.primary,
    borderWidth: 1,
    padding: tokens.space[2],
    borderRadius: tokens.radius.card,
    marginBottom: tokens.space[2],
  },
  infoText: {
    color: tokens.color.primary,
    fontSize: tokens.font.body.size,
    fontFamily: tokens.font.family,
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
  switchBtn: {
    marginTop: tokens.space[1],
    alignItems: 'center',
  },
  switchText: {
    fontSize: tokens.font.label.size,
    color: tokens.color.primary,
  },
});
