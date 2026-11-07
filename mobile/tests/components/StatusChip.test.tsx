/**
 * T-C-5: StatusChip component tests.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { StatusChip } from '../../components/StatusChip';
import { tokens } from '../../theme/tokens';

const STATUSES = [
  'Submitted',
  'Under Review',
  'Escalated',
  'Resolved',
  'Dismissed',
] as const;

describe('T-C-5: StatusChip', () => {
  STATUSES.forEach((status) => {
    it(`renders "${status}" with micro text style`, () => {
      render(<StatusChip status={status} testID={`chip-${status}`} />);
      expect(screen.getByText(status)).toBeTruthy();
      const label = screen.getByTestId(`chip-${status}-label`);
      const flat = StyleSheet.flatten(label.props.style);
      expect(flat.fontSize).toBe(tokens.font.micro.size);
    });
  });
});
