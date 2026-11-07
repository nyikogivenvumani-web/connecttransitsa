/**
 * T-C-9: Skeleton component tests.
 * Renders line and card shapes.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Skeleton } from '../../components/Skeleton';

describe('T-C-9: Skeleton', () => {
  it('renders a line shape', () => {
    const { getByTestId } = render(<Skeleton shape="line" testID="skel-line" />);
    expect(getByTestId('skel-line')).toBeTruthy();
  });

  it('renders a card shape', () => {
    const { getByTestId } = render(<Skeleton shape="card" testID="skel-card" />);
    expect(getByTestId('skel-card')).toBeTruthy();
  });

  it('line shape has smaller height than card', () => {
    const { getByTestId: getLine } = render(<Skeleton shape="line" testID="line" />);
    const { getByTestId: getCard } = render(<Skeleton shape="card" testID="card" />);
    const lineHeight = getLine('line').props.style?.find?.((s: Record<string, unknown>) => s?.height)?.height ?? 0;
    const cardHeight = getCard('card').props.style?.find?.((s: Record<string, unknown>) => s?.height)?.height ?? 1;
    expect(lineHeight).toBeLessThan(cardHeight);
  });
});
