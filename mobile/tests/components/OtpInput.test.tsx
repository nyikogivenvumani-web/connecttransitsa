/**
 * T-C-11: OtpInput component tests.
 * 6 boxes; paste fills them; resend disabled during the timer.
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { OtpInput } from '../../components/OtpInput';

describe('T-C-11: OtpInput', () => {
  it('renders 6 input boxes', () => {
    const { getAllByTestId } = render(
      <OtpInput value="" onChange={() => {}} onResend={() => {}} resendCooldownSeconds={0} />,
    );
    expect(getAllByTestId(/otp-box-\d/)).toHaveLength(6);
  });

  it('paste of 6 digits fills all boxes', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <OtpInput value="" onChange={onChange} onResend={() => {}} resendCooldownSeconds={0} />,
    );
    fireEvent.changeText(getByTestId('otp-box-0'), '123456');
    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('resend button is disabled while cooldown > 0', () => {
    const { getByTestId } = render(
      <OtpInput value="" onChange={() => {}} onResend={() => {}} resendCooldownSeconds={30} />,
    );
    const btn = getByTestId('otp-resend-btn');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
  });

  it('resend button is enabled when cooldown is 0', () => {
    const { getByTestId } = render(
      <OtpInput value="" onChange={() => {}} onResend={() => {}} resendCooldownSeconds={0} />,
    );
    const btn = getByTestId('otp-resend-btn');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
  });

  it('calls onResend when resend button is pressed', () => {
    const onResend = jest.fn();
    const { getByTestId } = render(
      <OtpInput value="" onChange={() => {}} onResend={onResend} resendCooldownSeconds={0} />,
    );
    fireEvent.press(getByTestId('otp-resend-btn'));
    expect(onResend).toHaveBeenCalledTimes(1);
  });
});
