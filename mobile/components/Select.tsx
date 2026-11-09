import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { tokens } from '../theme/tokens';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  testID?: string;
}

export function Select({ options, value, onChange, placeholder = 'Select…', testID }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <TouchableOpacity
        testID={testID ? `${testID}-trigger` : undefined}
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            initialNumToRender={options.length}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={testID ? `${testID}-option-${item.value}` : undefined}
                style={styles.option}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: tokens.size.input,
    borderRadius: tokens.radius.input,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.surface,
    paddingHorizontal: tokens.space[2],
  },
  triggerText: {
    flex: 1,
    fontSize: tokens.font.body.size,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
  },
  placeholder: {
    color: tokens.color.textMuted,
  },
  arrow: {
    fontSize: 14,
    color: tokens.color.textMuted,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: tokens.space[2],
    right: tokens.space[2],
    bottom: tokens.space[3],
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.card,
    maxHeight: 300,
    ...tokens.shadow.sheet,
  },
  option: {
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
    minHeight: tokens.size.touchMin,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: tokens.font.body.size,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
  },
});
