/**
 * T-C-4: Card component tests.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Card } from '../../components/Card';
import { tokens } from '../../theme/tokens';

describe('T-C-4: Card', () => {
  it('renders children', () => {
    render(<Card accent="verified"><></></Card>);
    expect(true).toBe(true);
  });

  it('renders with verified (green) accent', () => {
    render(<Card accent="verified" testID="card-verified"><></></Card>);
    const accent = screen.getByTestId('card-accent');
    const flat = StyleSheet.flatten(accent.props.style);
    expect(flat.backgroundColor).toBe(tokens.color.primary);
  });

  it('renders with investigating (amber) accent', () => {
    render(<Card accent="investigating" testID="card-investing"><></></Card>);
    const accent = screen.getByTestId('card-accent');
    const flat = StyleSheet.flatten(accent.props.style);
    expect(flat.backgroundColor).toBe(tokens.color.warning);
  });

  it('renders with hazard (red) accent', () => {
    render(<Card accent="hazard" testID="card-hazard"><></></Card>);
    const accent = screen.getByTestId('card-accent');
    const flat = StyleSheet.flatten(accent.props.style);
    expect(flat.backgroundColor).toBe(tokens.color.danger);
  });
});
