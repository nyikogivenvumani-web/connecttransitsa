/**
 * South African ID validation (BR6).
 * Follows the 13-digit official format:
 * YYMMDD SSSS C A Z
 * - YYMMDD: Birth date
 * - SSSS: Gender (0000-4999 Female, 5000-9999 Male)
 * - C: Citizenship (0 = SA citizen, 1 = permanent resident)
 * - A: 8 or 9 (usually 8)
 * - Z: Luhn check digit
 *
 * Age requirement: Must be >= 16 years old.
 */

export type SaIdStatus = 'valid' | 'invalid_format' | 'invalid_date' | 'invalid_checksum' | 'under_age';

export function saIdStatus(id: string): SaIdStatus {
  if (!id || typeof id !== 'string') return 'invalid_format';
  const trimmed = id.trim();
  if (!/^\d{13}$/.test(trimmed)) return 'invalid_format';

  // Check citizenship digit (must be 0 or 1)
  const cit = parseInt(trimmed.charAt(10), 10);
  if (cit !== 0 && cit !== 1) return 'invalid_format';

  // Luhn checksum validation
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(trimmed.charAt(i), 10);
    if (i % 2 !== 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  if (sum % 10 !== 0) return 'invalid_checksum';

  // Date parsing
  const yearStr = trimmed.substring(0, 2);
  const monthStr = trimmed.substring(2, 4);
  const dayStr = trimmed.substring(4, 6);

  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return 'invalid_date';

  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  let fullYear = currentCentury + parseInt(yearStr, 10);
  if (fullYear > currentYear) {
    fullYear -= 100;
  }

  // Validate date of month
  const birthDate = new Date(fullYear, month - 1, day);
  if (
    birthDate.getFullYear() !== fullYear ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return 'invalid_date';
  }

  // Calculate age >= 16
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 16) {
    return 'under_age';
  }

  return 'valid';
}

export function validateSaId(id: string): boolean {
  return saIdStatus(id) === 'valid';
}
