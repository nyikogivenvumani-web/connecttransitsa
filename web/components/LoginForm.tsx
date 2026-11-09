'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInAdmin, homePathForRole } from '../lib/api/auth';
import { tokens } from '../theme/tokens';
import { card, input, button, errorText } from './ui';

/** A7 – Portal login */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { role } = await signInAdmin(email.trim(), password);
      router.push(homePathForRole(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ ...card, maxWidth: 400, width: '100%', gap: tokens.space[2] }}>
      <h1 style={{ margin: 0, fontSize: tokens.font.h2.size }}>ConnectTransit SA</h1>
      <p style={{ margin: 0, color: tokens.color.textMuted }}>Admin portal — sign in to continue</p>
      <label>Email
        <input data-testid="login-email" type="email" autoComplete="username" style={input} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>Password
        <input data-testid="login-password" type="password" autoComplete="current-password" style={input} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p data-testid="login-error" role="alert" style={errorText}>{error}</p>}
      <button data-testid="login-submit" type="submit" disabled={busy} style={button(busy)}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
