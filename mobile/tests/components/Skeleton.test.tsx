/**
 * T-C-9: Skeleton component tests.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Skeleton } from '../../components/Skeleton';

describe('T-C-9: Skeleton', () => {
  it('renders a line shape', () => {
    render(<Skeleton shape="line" testID="skel-line" />);
    expect(screen.getByTestId('skel-line')).toBeTruthy();
  });

  it('renders a card shape', () => {
    render(<Skeleton shape="card" testID="skel-card" />);
    expect(screen.getByTestId('skel-card')).toBeTruthy();
  });

  it('line shape has smaller height than card', () => {
    render(<Skeleton shape="line" testID="line" />);
    const line = screen.getByTestId('line');
    const flatLine = StyleSheet.flatten(line.props.style);

    render(<Skeleton shape="card" testID="card" />);
    const card = screen.getByTestId('card');
    const flatCard = StyleSheet.flatten(card.props.style);

    expect(flatLine.height).toBeLessThan(flatCard.height as number);
  });
});
