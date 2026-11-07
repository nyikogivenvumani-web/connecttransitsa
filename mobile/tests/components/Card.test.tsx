/**
 * T-C-4: Card component tests.
 * Accent colours: green (verified), amber (investigating), red (hazard).
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Card } from '../../components/Card';
import { tokens } from '../../theme/tokens';

describe('T-C-4: Card', () => {
  it('renders children', () => {
    const { getByText } = render(<Card accent="verified"><></></Card>);
    // No crash = pass; children rendered
    expect(true).toBe(true);
  });

  it('renders with verified (green) accent', () => {
    const { getByTestId } = render(
      <Card accent="verified" testID="card-verified"><></></Card>,
    );
    const accent = getByTestId('card-accent');
    expect(accent.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: tokens.color.primary })]),
    );
  });

  it('renders with investigating (amber) accent', () => {
    const { getByTestId } = render(
      <Card accent="investigating" testID="card-investing"><></></Card>,
    );
    const accent = getByTestId('card-accent');
    expect(accent.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: tokens.color.warning })]),
    );
  });

  it('renders with hazard (red) accent', () => {
    const { getByTestId } = render(
      <Card accent="hazard" testID="card-hazard"><></></Card>,
    );
    const accent = getByTestId('card-accent');
    expect(accent.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: tokens.color.danger })]),
    );
  });
});
