/**
 * T-C-1: Button component tests.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/Button';

describe('T-C-1: Button', () => {
  it('renders primary variant', () => {
    render(<Button variant="primary" onPress={() => {}} label="Submit" />);
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('renders secondary variant (amber)', () => {
    render(<Button variant="secondary" onPress={() => {}} label="Save" />);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('renders outlined variant', () => {
    render(<Button variant="outlined" onPress={() => {}} label="Cancel" />);
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('renders sos variant with 56px height', () => {
    render(<Button variant="sos" onPress={() => {}} label="SOS" testID="sos-btn" />);
    const btn = screen.getByTestId('sos-btn');
    const flat = StyleSheet.flatten(btn.props.style);
    expect(flat.height).toBe(56);
  });

  it('primary variant has 48px height', () => {
    render(<Button variant="primary" onPress={() => {}} label="Go" testID="primary-btn" />);
    const btn = screen.getByTestId('primary-btn');
    const flat = StyleSheet.flatten(btn.props.style);
    expect(flat.height).toBe(48);
  });

  it('has borderRadius 24 (pill)', () => {
    render(<Button variant="primary" onPress={() => {}} label="Go" testID="pill-btn" />);
    const btn = screen.getByTestId('pill-btn');
    const flat = StyleSheet.flatten(btn.props.style);
    expect(flat.borderRadius).toBe(24);
  });

  it('disabled button does not call onPress', () => {
    const onPress = jest.fn();
    render(<Button variant="primary" onPress={onPress} label="Go" disabled testID="disabled-btn" />);
    fireEvent.press(screen.getByTestId('disabled-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('loading button shows a spinner', () => {
    render(<Button variant="primary" onPress={() => {}} label="Go" loading testID="loading-btn" />);
    expect(screen.getByTestId('button-spinner')).toBeTruthy();
  });

  it('loading button does not call onPress', () => {
    const onPress = jest.fn();
    render(<Button variant="primary" onPress={onPress} label="Go" loading testID="loading-btn2" />);
    fireEvent.press(screen.getByTestId('loading-btn2'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
