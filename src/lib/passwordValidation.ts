/**
 * Password validation utility for comprehensive password strength checking.
 * Validates against complexity requirements and common weak passwords.
 */

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password123',
  'password1!',
  '12345678',
  'qwerty123',
  'letmein123',
  'welcome123',
  'admin123',
  'iloveyou1',
  'sunshine1',
  'princess1',
  'football1',
  'monkey123',
  'shadow123',
  'master123',
  'dragon123',
  'baseball1',
  'passw0rd!',
  'trustno1!',
  'whatever1',
  'freedom1!',
];

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  strength: 'weak' | 'fair' | 'strong';
  requirements: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Validates a password against security requirements.
 * @param password - The password to validate
 * @returns Validation result with detailed feedback
 */
export function validatePassword(password: string): PasswordValidationResult {
  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
  };

  // Check minimum length first
  if (!requirements.minLength) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters',
      strength: 'weak',
      requirements,
    };
  }

  // Check for lowercase
  if (!requirements.hasLowercase) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
      strength: 'weak',
      requirements,
    };
  }

  // Check for uppercase
  if (!requirements.hasUppercase) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
      strength: 'weak',
      requirements,
    };
  }

  // Check for number
  if (!requirements.hasNumber) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
      strength: 'weak',
      requirements,
    };
  }

  // Check for special character
  if (!requirements.hasSpecialChar) {
    return {
      valid: false,
      error: 'Password must contain at least one special character (!@#$%^&* etc.)',
      strength: 'fair',
      requirements,
    };
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    return {
      valid: false,
      error: 'This password is too common. Please choose a stronger password.',
      strength: 'weak',
      requirements,
    };
  }

  // Calculate strength based on length and variety
  let strength: 'weak' | 'fair' | 'strong' = 'fair';
  if (password.length >= 12) {
    strength = 'strong';
  }

  return {
    valid: true,
    strength,
    requirements,
  };
}

/**
 * Gets a user-friendly password requirements message
 */
export function getPasswordRequirements(): string {
  return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
}
