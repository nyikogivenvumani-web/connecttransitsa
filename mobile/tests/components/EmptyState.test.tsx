/**
 * T-C-8: EmptyState component tests.
 * Text and optional button.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../../components/EmptyState';

describe('T-C-8: EmptyState', () => {
  it('renders the message text', () => {
    const { getByText } = render(<EmptyState message="No cases yet." />);
    expect(getByText('No cases yet.')).toBeTruthy();
  });

  it('renders without a button when buttonLabel is not provided', () => {
    const { queryByTestId } = render(<EmptyState message="Nothing here." />);
    expect(queryByTestId('empty-state-btn')).toBeNull();
  });

  it('renders a button when buttonLabel is provided', () => {
    const { getByTestId } = render(
      <EmptyState message="No cases." buttonLabel="Report now" onButtonPress={() => {}} />,
    );
    expect(getByTestId('empty-state-btn')).toBeTruthy();
  });

  it('calls onButtonPress when button is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <EmptyState message="No cases." buttonLabel="Report now" onButtonPress={onPress} />,
    );
    fireEvent.press(getByTestId('empty-state-btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
