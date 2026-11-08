/**
 * Authentication operations (OP1 - OP6).
 */
import { supabase } from '../supabase';
import { validateSaId, saIdStatus } from '../rules/saId';
import { validatePassword } from '../rules/password';
import { messages } from '../../constants/messages';

export interface SignUpParams {
  email?: string;
  phone?: string;
  fullName: string;
  idNumber: string;
  password?: string;
}

export async function signUpWithEmail(params: SignUpParams) {
  if (!params.fullName.trim()) {
    throw new Error('Name is required');
  }
  if (!params.email) {
    throw new Error('Email is required');
  }
  const idCheck = saIdStatus(params.idNumber);
  if (idCheck === 'under_age') {
    throw new Error('You must be 16 or older to use this app.');
  }
  if (!validateSaId(params.idNumber)) {
    throw new Error('Enter a valid South African ID number.');
  }
  if (!params.password || !validatePassword(params.password)) {
    throw new Error('Password must be at least 8 characters and include uppercase, lowercase, and a digit.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        id_number: params.idNumber.trim(),
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw new Error('This email already has an account. Log in instead?');
    }
    if (error.message.includes('rate limit')) {
      throw new Error('Too many attempts. Try again in 15 minutes.');
    }
    throw error;
  }

  return data;
}

export async function signUpWithPhone(params: SignUpParams) {
  if (!params.fullName.trim()) {
    throw new Error('Name is required');
  }
  if (!params.phone) {
    throw new Error('Phone is required');
  }
  const idCheck = saIdStatus(params.idNumber);
  if (idCheck === 'under_age') {
    throw new Error('You must be 16 or older to use this app.');
  }
  if (!validateSaId(params.idNumber)) {
    throw new Error('Enter a valid South African ID number.');
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: params.phone,
    options: {
      data: {
        full_name: params.fullName.trim(),
        id_number: params.idNumber.trim(),
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function verifyOtp(phoneOrEmail: string, token: string, type: 'sms' | 'email' = 'email') {
  if (token.length !== 6) {
    throw new Error('That code is incorrect or has expired.');
  }

  const { data, error } = type === 'sms'
    ? await supabase.auth.verifyOtp({ phone: phoneOrEmail, token, type: 'sms' })
    : await supabase.auth.verifyOtp({ email: phoneOrEmail, token, type: 'email' });

  if (error) {
    throw new Error('That code is incorrect or has expired.');
  }

  return data;
}

export async function signIn(emailOrPhone: string, password?: string) {
  if (password) {
    const isEmail = emailOrPhone.includes('@');
    const credentials = isEmail
      ? { email: emailOrPhone, password }
      : { phone: emailOrPhone, password };

    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email first.');
      }
      throw new Error('Incorrect email or password.');
    }
    return data;
  } else {
    // Phone OTP login
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: emailOrPhone,
    });
    if (error) throw error;
    return data;
  }
}

export async function resetPassword(email: string) {
  await supabase.auth.resetPasswordForEmail(email);
  return "If an account exists for this email, we've sent a reset code.";
}

export async function updatePassword(newPassword: string) {
  if (!validatePassword(newPassword)) {
    throw new Error('Password must be at least 8 characters and include uppercase, lowercase, and a digit.');
  }
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
  await supabase.auth.signOut();
  return data;
}
