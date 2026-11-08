import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { messages } from '../constants/messages';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  cancelLabel,
  danger = false,
}: ConfirmModalProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              testID="confirm-modal-cancel"
              style={styles.cancelBtn}
              onPress={onCancel}
            >
              <Text style={styles.cancelLabel}>{cancelLabel ?? messages.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="confirm-modal-confirm"
              style={[styles.confirmBtn, danger ? styles.confirmDanger : null]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.space[2],
  },
  sheet: {
    width: '100%',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.card,
    padding: tokens.space[3],
    ...tokens.shadow.sheet,
  },
  title: {
    fontSize: tokens.font.h3.size,
    lineHeight: tokens.font.h3.lineHeight,
    fontWeight: tokens.font.h3.weight,
    color: tokens.color.text,
    marginBottom: tokens.space[1],
    fontFamily: tokens.font.family,
  },
  message: {
    fontSize: tokens.font.body.size,
    lineHeight: tokens.font.body.lineHeight,
    color: tokens.color.textMuted,
    marginBottom: tokens.space[3],
    fontFamily: tokens.font.family,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.space[1],
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    height: tokens.size.button,
    paddingHorizontal: tokens.space[2],
    borderRadius: tokens.radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: tokens.size.touchMin,
  },
  cancelLabel: {
    fontSize: tokens.font.label.size,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.label.weight,
    fontFamily: tokens.font.family,
  },
  confirmBtn: {
    height: tokens.size.button,
    paddingHorizontal: tokens.space[2],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: tokens.size.touchMin,
  },
  confirmDanger: {
    backgroundColor: tokens.color.danger,
  },
  confirmLabel: {
    fontSize: tokens.font.label.size,
    color: tokens.color.surface,
    fontWeight: tokens.font.label.weight,
    fontFamily: tokens.font.family,
  },
});
