'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokens } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';

/** A7 – Portal Login (OP15). */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError('Incorrect email or password.');
        return;
      }

      if (!data?.user) {
        setError('Incorrect email or password.');
        return;
      }

      // Check role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !userProfile) {
        // Fallback check metadata if database profile isn't ready
        const role = data.user.user_metadata?.role ?? 'commuter';
        handleRoleRedirect(role);
        return;
      }

      handleRoleRedirect(userProfile.role);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleRedirect = async (role: string) => {
    if (role === 'commuter') {
      await supabase.auth.signOut();
      setError('This account cannot use the web dashboard.');
      return;
    }

    if (role === 'transport_admin') {
      router.push('/admin');
    } else if (role === 'saps') {
      router.push('/saps');
    } else if (role === 'system_admin') {
      router.push('/system/organizations');
    } else {
      await supabase.auth.signOut();
      setError('This account cannot use the web dashboard.');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.color.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: tokens.font.family,
        padding: tokens.space[2],
      }}
    >
      <div
        style={{
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.card,
          padding: tokens.space[3],
          boxShadow: tokens.shadow.sheet,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: tokens.font.h2.size,
            fontWeight: tokens.font.h2.weight,
            color: tokens.color.text,
            marginBottom: tokens.space[1],
          }}
        >
          ConnectTransit SA
        </h1>
        <p
          style={{
            color: tokens.color.textMuted,
            fontSize: tokens.font.body.size,
            marginBottom: tokens.space[3],
          }}
        >
          Admin portal — sign in to continue
        </p>

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: '#FEF2F2',
              color: tokens.color.danger,
              border: `1px solid ${tokens.color.danger}`,
              borderRadius: tokens.radius.input,
              padding: tokens.space[2],
              fontSize: tokens.font.body.size,
              marginBottom: tokens.space[2],
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: tokens.space[2] }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: tokens.font.label.size,
                fontWeight: tokens.font.label.weight,
                color: tokens.color.text,
                marginBottom: tokens.space.tight,
              }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
              style={{
                width: '100%',
                height: tokens.size.input,
                padding: `0 ${tokens.space[2]}px`,
                borderRadius: tokens.radius.input,
                border: `1px solid ${tokens.color.borderStrong}`,
                backgroundColor: tokens.color.surface,
                color: tokens.color.text,
                fontSize: tokens.font.body.size,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: tokens.font.label.size,
                fontWeight: tokens.font.label.weight,
                color: tokens.color.text,
                marginBottom: tokens.space.tight,
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              style={{
                width: '100%',
                height: tokens.size.input,
                padding: `0 ${tokens.space[2]}px`,
                borderRadius: tokens.radius.input,
                border: `1px solid ${tokens.color.borderStrong}`,
                backgroundColor: tokens.color.surface,
                color: tokens.color.text,
                fontSize: tokens.font.body.size,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: tokens.size.button,
              borderRadius: tokens.radius.pill,
              backgroundColor: tokens.color.primary,
              color: '#FFFFFF',
              fontSize: tokens.font.label.size,
              fontWeight: tokens.font.label.weight,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: tokens.space[1],
              transition: 'background-color 0.15s ease',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
