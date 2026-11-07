/**
 * T-C-13: TabBar tests.
 * 3 icons in order: Home, Track, Settings.
 * Active tab is visually filled (checked via testID active state).
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// TabBar lives in the Expo Router layout; we test a standalone exported helper.
import { TabBarContent } from '../../components/TabBarContent';

describe('T-C-13: TabBar', () => {
  it('renders 3 tabs in order: Home, Track, Settings', () => {
    const { getAllByTestId } = render(<TabBarContent activeTab="home" />);
    const tabs = getAllByTestId(/tab-item-/);
    expect(tabs).toHaveLength(3);
    expect(tabs[0].props.testID).toBe('tab-item-home');
    expect(tabs[1].props.testID).toBe('tab-item-track');
    expect(tabs[2].props.testID).toBe('tab-item-settings');
  });

  it('marks the active tab as active', () => {
    const { getByTestId } = render(<TabBarContent activeTab="track" />);
    const activeTab = getByTestId('tab-item-track');
    expect(activeTab.props.accessibilityState?.selected).toBe(true);
  });

  it('marks inactive tabs as not active', () => {
    const { getByTestId } = render(<TabBarContent activeTab="home" />);
    const inactive = getByTestId('tab-item-track');
    expect(inactive.props.accessibilityState?.selected).toBeFalsy();
  });
});
