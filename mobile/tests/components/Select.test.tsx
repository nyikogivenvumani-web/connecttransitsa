/**
 * T-C-3: Select component tests.
 * Opens, lists options, selecting calls onChange.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Select } from '../../components/Select';

const OPTIONS = [
  { label: 'DORLJOTA', value: 'dorljota' },
  { label: 'Metrobus', value: 'metrobus' },
  { label: 'Other/Unregistered', value: 'other' },
];

describe('T-C-3: Select', () => {
  it('renders placeholder initially', () => {
    const { getByText } = render(
      <Select
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        placeholder="Select organisation"
      />,
    );
    expect(getByText('Select organisation')).toBeTruthy();
  });

  it('opens and shows all options when pressed', () => {
    const { getByTestId, getByText } = render(
      <Select options={OPTIONS} value={null} onChange={() => {}} placeholder="Select" testID="org-select" />,
    );
    fireEvent.press(getByTestId('org-select-trigger'));
    OPTIONS.forEach((o) => expect(getByText(o.label)).toBeTruthy());
  });

  it('calls onChange with the selected value', () => {
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <Select options={OPTIONS} value={null} onChange={onChange} placeholder="Select" testID="org-select2" />,
    );
    fireEvent.press(getByTestId('org-select2-trigger'));
    fireEvent.press(getByText('Metrobus'));
    expect(onChange).toHaveBeenCalledWith('metrobus');
  });

  it('shows "Other/Unregistered" as an option', () => {
    const { getByTestId, getByText } = render(
      <Select options={OPTIONS} value={null} onChange={() => {}} placeholder="Select" testID="org-select3" />,
    );
    fireEvent.press(getByTestId('org-select3-trigger'));
    expect(getByText('Other/Unregistered')).toBeTruthy();
  });
});
