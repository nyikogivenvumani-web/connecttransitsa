/**
 * T-C-3: Select component tests.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Select } from '../../components/Select';

const OPTIONS = [
  { label: 'DORLJOTA', value: 'dorljota' },
  { label: 'Metrobus', value: 'metrobus' },
  { label: 'Other/Unregistered', value: 'other' },
];

describe('T-C-3: Select', () => {
  it('renders placeholder initially', () => {
    render(
      <Select
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        placeholder="Select organisation"
      />,
    );
    expect(screen.getByText('Select organisation')).toBeTruthy();
  });

  it('opens and shows all options when pressed', () => {
    render(
      <Select options={OPTIONS} value={null} onChange={() => {}} placeholder="Select" testID="org-select" />,
    );
    fireEvent.press(screen.getByTestId('org-select-trigger'));
    OPTIONS.forEach((o) => expect(screen.getByText(o.label)).toBeTruthy());
  });

  it('calls onChange with the selected value', () => {
    const onChange = jest.fn();
    render(
      <Select options={OPTIONS} value={null} onChange={onChange} placeholder="Select" testID="org-select2" />,
    );
    fireEvent.press(screen.getByTestId('org-select2-trigger'));
    fireEvent.press(screen.getByText('Metrobus'));
    expect(onChange).toHaveBeenCalledWith('metrobus');
  });

  it('shows "Other/Unregistered" as an option', () => {
    render(
      <Select options={OPTIONS} value={null} onChange={() => {}} placeholder="Select" testID="org-select3" />,
    );
    fireEvent.press(screen.getByTestId('org-select3-trigger'));
    expect(screen.getByText('Other/Unregistered')).toBeTruthy();
  });
});
