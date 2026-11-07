/**
 * T-C-5: StatusChip component tests.
 * Each status shows its text and micro style.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
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
      const { getByText, getByTestId } = render(
        <StatusChip status={status} testID={`chip-${status}`} />,
      );
      expect(getByText(status)).toBeTruthy();
      const label = getByTestId(`chip-${status}-label`);
      expect(label.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fontSize: tokens.font.micro.size }),
        ]),
      );
    });
  });
});
