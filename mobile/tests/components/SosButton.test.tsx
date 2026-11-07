/**
 * T-C-12: SosButton component tests.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { SosButton } from '../../components/SosButton';
import { tokens } from '../../theme/tokens';

describe('T-C-12: SosButton', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('has 56px height', () => {
    render(<SosButton onTrigger={() => {}} testID="sos" />);
    const btn = screen.getByTestId('sos');
    const flat = StyleSheet.flatten(btn.props.style);
    expect(flat.height).toBe(tokens.size.sosButton);
  });

  it('fires onTrigger after 3 taps within 2.5s', () => {
    const onTrigger = jest.fn();
    render(<SosButton onTrigger={onTrigger} testID="sos2" />);
    const btn = screen.getByTestId('sos2');
    act(() => { fireEvent.press(btn); });
    act(() => { fireEvent.press(btn); });
    act(() => { fireEvent.press(btn); });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onTrigger if 3rd tap is after 2.5s', () => {
    const onTrigger = jest.fn();
    render(<SosButton onTrigger={onTrigger} testID="sos3" />);
    const btn = screen.getByTestId('sos3');
    act(() => { fireEvent.press(btn); });
    act(() => { fireEvent.press(btn); });
    act(() => { jest.advanceTimersByTime(2600); });
    act(() => { fireEvent.press(btn); });
    expect(onTrigger).not.toHaveBeenCalled();
  });
});
