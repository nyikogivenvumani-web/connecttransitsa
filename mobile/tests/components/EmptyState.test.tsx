/**
 * T-C-8: EmptyState component tests.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../components/EmptyState';

describe('T-C-8: EmptyState', () => {
  it('renders the message text', () => {
    render(<EmptyState message="No cases yet." />);
    expect(screen.getByText('No cases yet.')).toBeTruthy();
  });

  it('renders without a button when buttonLabel is not provided', () => {
    render(<EmptyState message="Nothing here." />);
    expect(screen.queryByTestId('empty-state-btn')).toBeNull();
  });

  it('renders a button when buttonLabel is provided', () => {
    render(
      <EmptyState message="No cases." buttonLabel="Report now" onButtonPress={() => {}} />,
    );
    expect(screen.getByTestId('empty-state-btn')).toBeTruthy();
  });

  it('calls onButtonPress when button is pressed', () => {
    const onPress = jest.fn();
    render(
      <EmptyState message="No cases." buttonLabel="Report now" onButtonPress={onPress} />,
    );
    fireEvent.press(screen.getByTestId('empty-state-btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
