/**
 * T-C-13: TabBar tests.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TabBarContent } from '../../components/TabBarContent';

describe('T-C-13: TabBar', () => {
  it('renders 3 tabs in order: Home, Track, Settings', () => {
    render(<TabBarContent activeTab="home" />);
    const tabs = screen.getAllByTestId(/tab-item-/);
    expect(tabs).toHaveLength(3);
    expect(tabs[0].props.testID).toBe('tab-item-home');
    expect(tabs[1].props.testID).toBe('tab-item-track');
    expect(tabs[2].props.testID).toBe('tab-item-settings');
  });

  it('marks the active tab as active', () => {
    render(<TabBarContent activeTab="track" />);
    const activeTab = screen.getByTestId('tab-item-track');
    expect(activeTab.props.accessibilityState?.selected).toBe(true);
  });

  it('marks inactive tabs as not active', () => {
    render(<TabBarContent activeTab="home" />);
    const inactive = screen.getByTestId('tab-item-track');
    expect(inactive.props.accessibilityState?.selected).toBeFalsy();
  });
});
