/**
 * T-C-6: StatusTimeline component tests.
 * Steps: Submitted → Under Review → Decision Published.
 * Highlights the current step; shows "Decision Published" for Resolved and Dismissed.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusTimeline } from '../../components/StatusTimeline';

describe('T-C-6: StatusTimeline', () => {
  it('renders all three steps', () => {
    const { getByText } = render(<StatusTimeline currentStatus="Submitted" />);
    expect(getByText('Submitted')).toBeTruthy();
    expect(getByText('Under Review')).toBeTruthy();
    expect(getByText('Decision Published')).toBeTruthy();
  });

  it('highlights the current step "Submitted"', () => {
    const { getByTestId } = render(<StatusTimeline currentStatus="Submitted" />);
    const step = getByTestId('timeline-step-0');
    expect(step.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 1 })]),
    );
  });

  it('shows "Decision Published" for Resolved status', () => {
    const { getByText } = render(<StatusTimeline currentStatus="Resolved" />);
    expect(getByText('Decision Published')).toBeTruthy();
  });

  it('shows "Decision Published" for Dismissed status', () => {
    const { getByText } = render(<StatusTimeline currentStatus="Dismissed" />);
    expect(getByText('Decision Published')).toBeTruthy();
  });

  it('highlights the last step when Resolved', () => {
    const { getByTestId } = render(<StatusTimeline currentStatus="Resolved" />);
    const lastStep = getByTestId('timeline-step-2');
    expect(lastStep.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 1 })]),
    );
  });
});
