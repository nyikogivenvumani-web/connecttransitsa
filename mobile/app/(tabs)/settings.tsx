import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { OfflineBanner } from '../../components/OfflineBanner';
import { tokens } from '../../theme/tokens';
import { ConfirmModal } from '../../components/ConfirmModal';
import { supabase } from '../../lib/supabase';
import { signOut, deleteAccount } from '../../lib/api/auth';
import { messages } from '../../constants/messages';
import {
  checkBiometricAvailability,
  getBiometricPreference,
  setBiometricPreference,
  authenticateWithBiometrics,
} from '../../lib/biometric';

export default function SettingsScreen() {
  const router = useRouter();
  const offline = NetInfo.useNetInfo().isConnected === false;
  const [profile, setProfile] = useState<{ full_name: string; email?: string; phone_number?: string } | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Modals
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('users')
          .select('full_name, email, phone_number')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
    });

    checkBiometricAvailability().then((avail) => {
      setBiometricAvailable(avail);
      if (avail) {
        getBiometricPreference().then((pref) => setBiometricEnabled(pref));
      }
    });
  }, []);

  const handleBiometricToggle = async (val: boolean) => {
    if (val) {
      const ok = await authenticateWithBiometrics();
      if (ok) {
        setBiometricEnabled(true);
        await setBiometricPreference(true);
      } else {
        setBiometricEnabled(false);
        await setBiometricPreference(false);
      }
    } else {
      setBiometricEnabled(false);
      await setBiometricPreference(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      setLogoutVisible(false);
      router.replace('/(auth)/welcome');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      setDeleteVisible(false);
      router.replace('/(auth)/welcome');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <OfflineBanner />
      <Text style={styles.title}>Settings and Profile</Text>

      {/* Account Info */}
      <View testID="settings-profile-card" style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <Text style={styles.detailLabel}>Full Name</Text>
        <Text style={styles.detailValue}>{profile?.full_name ?? '—'}</Text>

        {profile?.email ? (
          <>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{profile.email}</Text>
          </>
        ) : null}

        {profile?.phone_number ? (
          <>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{profile.phone_number}</Text>
          </>
        ) : null}
      </View>

      {/* Biometrics */}
      {biometricAvailable ? (
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Biometric Sign-In</Text>
            <Switch
              testID="settings-biometric-switch"
              disabled={offline}
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ true: tokens.color.primary, false: tokens.color.border }}
            />
          </View>
        </View>
      ) : null}

      {/* Legal & Privacy */}
      <View style={styles.section}>
        <TouchableOpacity
          testID="settings-privacy-link"
          style={styles.linkRow}
          onPress={() => Linking.openURL('https://connecttransit.co.za/privacy')}
        >
          <Text style={styles.linkText}>Privacy Notice</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          testID="settings-logout-btn"
          style={styles.actionBtn}
          onPress={() => setLogoutVisible(true)}
        >
          <Text style={styles.logoutText}>{messages.logOutTitle}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="settings-delete-account-btn"
          style={[styles.actionBtn, { borderTopWidth: 1, borderTopColor: tokens.color.border }]}
          onPress={() => setDeleteVisible(true)}
          disabled={offline}
        >
          <Text style={styles.deleteText}>{messages.deleteAccountTitle}</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <ConfirmModal
        visible={logoutVisible}
        title={messages.logOutTitle}
        message={messages.logOutMessage}
        confirmLabel={messages.logOutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setLogoutVisible(false)}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={messages.deleteAccountTitle}
        message={messages.deleteAccountMessage}
        confirmLabel={messages.deleteAccountConfirm}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.space[3],
    backgroundColor: tokens.color.background,
    gap: tokens.space[2],
  },
  title: {
    fontSize: tokens.font.h1.size,
    fontWeight: tokens.font.h1.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    marginBottom: tokens.space[2],
  },
  section: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space[2],
  },
  sectionTitle: {
    fontSize: tokens.font.h3.size,
    fontWeight: tokens.font.h3.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    marginBottom: tokens.space[1],
  },
  detailLabel: {
    fontSize: tokens.font.caption.size,
    color: tokens.color.textMuted,
    marginTop: tokens.space.tight,
  },
  detailValue: {
    fontSize: tokens.font.body.size,
    color: tokens.color.text,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.space[1],
  },
  rowLabel: {
    fontSize: tokens.font.body.size,
    color: tokens.color.text,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.space[1],
  },
  linkText: {
    fontSize: tokens.font.body.size,
    color: tokens.color.primary,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 20,
    color: tokens.color.textMuted,
  },
  actionBtn: {
    paddingVertical: tokens.space[2],
    alignItems: 'center',
  },
  logoutText: {
    color: tokens.color.primary,
    fontSize: tokens.font.label.size,
    fontWeight: tokens.font.label.weight,
  },
  deleteText: {
    color: tokens.color.danger,
    fontSize: tokens.font.label.size,
    fontWeight: tokens.font.label.weight,
  },
});
