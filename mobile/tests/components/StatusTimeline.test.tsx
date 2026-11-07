/**
 * T-C-6: StatusTimeline component tests.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { StatusTimeline } from '../../components/StatusTimeline';

describe('T-C-6: StatusTimeline', () => {
  it('renders all three steps', () => {
    render(<StatusTimeline currentStatus="Submitted" />);
    expect(screen.getByText('Submitted')).toBeTruthy();
    expect(screen.getByText('Under Review')).toBeTruthy();
    expect(screen.getByText('Decision Published')).toBeTruthy();
  });

  it('highlights the current step "Submitted"', () => {
    render(<StatusTimeline currentStatus="Submitted" />);
    const step = screen.getByTestId('timeline-step-0');
    const flat = StyleSheet.flatten(step.props.style);
    expect(flat.opacity).toBe(1);
  });

  it('shows "Decision Published" for Resolved status', () => {
    render(<StatusTimeline currentStatus="Resolved" />);
    expect(screen.getByText('Decision Published')).toBeTruthy();
  });

  it('shows "Decision Published" for Dismissed status', () => {
    render(<StatusTimeline currentStatus="Dismissed" />);
    expect(screen.getByText('Decision Published')).toBeTruthy();
  });

  it('highlights the last step when Resolved', () => {
    render(<StatusTimeline currentStatus="Resolved" />);
    const lastStep = screen.getByTestId('timeline-step-2');
    const flat = StyleSheet.flatten(lastStep.props.style);
    expect(flat.opacity).toBe(1);
  });
});
