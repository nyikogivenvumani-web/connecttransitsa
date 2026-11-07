import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { tokens } from '../theme/tokens';
import { messages } from '../constants/messages';

interface OfflineBannerProps {
  isReportScreen?: boolean;
}

export function OfflineBanner({ isReportScreen = false }: OfflineBannerProps) {
  const netInfo = NetInfo.useNetInfo();
  const isOffline = netInfo.isConnected === false;

  if (!isOffline) return null;

  const text = isReportScreen ? messages.offlineReport : messages.offlineGeneral;

  return (
    <View testID="offline-banner" style={styles.banner}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: tokens.color.info,
    paddingVertical: tokens.space[1],
    paddingHorizontal: tokens.space[2],
  },
  text: {
    color: tokens.color.surface,
    fontSize: tokens.font.caption.size,
    lineHeight: tokens.font.caption.lineHeight,
    fontFamily: tokens.font.family,
    textAlign: 'center',
  },
});
