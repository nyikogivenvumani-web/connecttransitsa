/**
 * T-C-11: OtpInput component tests.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OtpInput } from '../../components/OtpInput';

describe('T-C-11: OtpInput', () => {
  it('renders 6 input boxes', () => {
    render(
      <OtpInput value="" onChange={() => {}} onResend={() => {}} resendCooldownSeconds={0} />,
    );
    expect(screen.getAllByTestId(/otp-box-\d/)).toHaveLength(6);
  });

  it('paste of 6 digits fills all boxes', () => {
    const onChange = jest.fn();
    render(
      <OtpInput value="" onChange={onChange} onResend={() => {}} resendCooldownSeconds={0} />,
    );
    fireEvent.changeText(screen.getByTestId('otp-box-0'), '123456');
    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('resend button is disabled while cooldown > 0', () => {
    render(
      <OtpInput value="" onChange={() => {}} onResend={() => {}} resendCooldownSeconds={30} />,
    );
    const btn = screen.getByTestId('otp-resend-btn');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
  });

  it('resend button is enabled when cooldown is 0', () => {
    render(
      <OtpInput value="" onChange={() => {}} onResend={() => {}} resendCooldownSeconds={0} />,
    );
    const btn = screen.getByTestId('otp-resend-btn');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
  });

  it('calls onResend when resend button is pressed', () => {
    const onResend = jest.fn();
    render(
      <OtpInput value="" onChange={() => {}} onResend={onResend} resendCooldownSeconds={0} />,
    );
    fireEvent.press(screen.getByTestId('otp-resend-btn'));
    expect(onResend).toHaveBeenCalledTimes(1);
  });
});
