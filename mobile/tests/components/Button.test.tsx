/**
 * T-C-1: Button component tests.
 * Variants render; disabled cannot be pressed; loading shows a spinner and
 * blocks presses; height 48 (sos 56); radius 24.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/Button';

describe('T-C-1: Button', () => {
  it('renders primary variant', () => {
    const { getByText } = render(<Button variant="primary" onPress={() => {}} label="Submit" />);
    expect(getByText('Submit')).toBeTruthy();
  });

  it('renders secondary variant (amber)', () => {
    const { getByText } = render(<Button variant="secondary" onPress={() => {}} label="Save" />);
    expect(getByText('Save')).toBeTruthy();
  });

  it('renders outlined variant', () => {
    const { getByText } = render(<Button variant="outlined" onPress={() => {}} label="Cancel" />);
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('renders sos variant with 56px height', () => {
    const { getByTestId } = render(
      <Button variant="sos" onPress={() => {}} label="SOS" testID="sos-btn" />,
    );
    const btn = getByTestId('sos-btn');
    expect(btn.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 56 })]),
    );
  });

  it('primary variant has 48px height', () => {
    const { getByTestId } = render(
      <Button variant="primary" onPress={() => {}} label="Go" testID="primary-btn" />,
    );
    const btn = getByTestId('primary-btn');
    expect(btn.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 48 })]),
    );
  });

  it('has borderRadius 24 (pill)', () => {
    const { getByTestId } = render(
      <Button variant="primary" onPress={() => {}} label="Go" testID="pill-btn" />,
    );
    const btn = getByTestId('pill-btn');
    expect(btn.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderRadius: 24 })]),
    );
  });

  it('disabled button does not call onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button variant="primary" onPress={onPress} label="Go" disabled testID="disabled-btn" />,
    );
    fireEvent.press(getByTestId('disabled-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('loading button shows a spinner', () => {
    const { getByTestId } = render(
      <Button variant="primary" onPress={() => {}} label="Go" loading testID="loading-btn" />,
    );
    expect(getByTestId('button-spinner')).toBeTruthy();
  });

  it('loading button does not call onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button variant="primary" onPress={onPress} label="Go" loading testID="loading-btn2" />,
    );
    fireEvent.press(getByTestId('loading-btn2'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
