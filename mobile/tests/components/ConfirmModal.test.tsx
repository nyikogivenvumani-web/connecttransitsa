/**
 * T-C-14: ConfirmModal component tests.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ConfirmModal } from '../../components/ConfirmModal';

describe('T-C-14: ConfirmModal', () => {
  it('renders title and message', () => {
    render(
      <ConfirmModal
        visible
        title="Delete account"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Delete account')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  });

  it('calls onConfirm when confirm button is pressed', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmModal
        visible
        title="Log out"
        message="Are you sure?"
        confirmLabel="Log out"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    fireEvent.press(screen.getByTestId('confirm-modal-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is pressed', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmModal
        visible
        title="Log out"
        message="Are you sure?"
        confirmLabel="Log out"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(screen.getByTestId('confirm-modal-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('is not visible when visible=false', () => {
    render(
      <ConfirmModal
        visible={false}
        title="Log out"
        message="Are you sure?"
        confirmLabel="Log out"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByTestId('confirm-modal-confirm')).toBeNull();
  });
});
