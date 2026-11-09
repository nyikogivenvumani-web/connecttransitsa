/** T-A7-1 – Portal login */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../components/LoginForm';
import * as auth from '../../lib/api/auth';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: push }) }));
jest.mock('../../lib/api/auth', () => ({ ...jest.requireActual('../../lib/api/auth'), signInAdmin: jest.fn() }));
const signIn = auth.signInAdmin as jest.Mock;

async function submit(email = 'sipho@example.co.za', pw = 'Password1!') {
  fireEvent.change(screen.getByTestId('login-email'), { target: { value: email } });
  fireEvent.change(screen.getByTestId('login-password'), { target: { value: pw } });
  fireEvent.click(screen.getByTestId('login-submit'));
}

beforeEach(() => jest.clearAllMocks());

it('sends a transport admin to /admin', async () => {
  signIn.mockResolvedValue({ role: 'transport_admin' });
  render(<LoginForm />);
  await submit();
  await waitFor(() => expect(push).toHaveBeenCalledWith('/admin'));
});

it('shows the commuter message and stays on the page', async () => {
  signIn.mockRejectedValue(new Error('This account cannot use the web dashboard.'));
  render(<LoginForm />);
  await submit();
  expect(await screen.findByText('This account cannot use the web dashboard.')).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});

it('shows the wrong-password message', async () => {
  signIn.mockRejectedValue(new Error('Incorrect email or password.'));
  render(<LoginForm />);
  await submit('sipho@example.co.za', 'bad');
  expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
});

it('does not submit with empty fields', async () => {
  render(<LoginForm />);
  fireEvent.click(screen.getByTestId('login-submit'));
  expect(signIn).not.toHaveBeenCalled();
});
