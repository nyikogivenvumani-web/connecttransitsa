/**
 * T-C-12: SosButton component tests.
 * 3 taps within 2.5s fires onTrigger; 3rd tap after 2.5s does not; 56px height.
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SosButton } from '../../components/SosButton';
import { tokens } from '../../theme/tokens';

describe('T-C-12: SosButton', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('has 56px height', () => {
    const { getByTestId } = render(<SosButton onTrigger={() => {}} testID="sos" />);
    const btn = getByTestId('sos');
    expect(btn.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: tokens.size.sosButton })]),
    );
  });

  it('fires onTrigger after 3 taps within 2.5s', () => {
    const onTrigger = jest.fn();
    const { getByTestId } = render(<SosButton onTrigger={onTrigger} testID="sos2" />);
    const btn = getByTestId('sos2');
    act(() => { fireEvent.press(btn); });
    act(() => { fireEvent.press(btn); });
    act(() => { fireEvent.press(btn); });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onTrigger if 3rd tap is after 2.5s', () => {
    const onTrigger = jest.fn();
    const { getByTestId } = render(<SosButton onTrigger={onTrigger} testID="sos3" />);
    const btn = getByTestId('sos3');
    act(() => { fireEvent.press(btn); });
    act(() => { fireEvent.press(btn); });
    // Advance time past the 2.5s window
    act(() => { jest.advanceTimersByTime(2600); });
    act(() => { fireEvent.press(btn); });
    expect(onTrigger).not.toHaveBeenCalled();
  });
});
