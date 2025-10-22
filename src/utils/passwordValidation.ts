export interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
    noCommonWords: boolean;
  };
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonWords: !isCommonPassword(password),
  };

  const feedback: string[] = [];
  let score = 0;

  if (!requirements.length) {
    feedback.push("At least 8 characters");
  } else {
    score += 1;
  }

  if (!requirements.uppercase) {
    feedback.push("At least one uppercase letter");
  } else {
    score += 1;
  }

  if (!requirements.lowercase) {
    feedback.push("At least one lowercase letter");
  } else {
    score += 1;
  }

  if (!requirements.number) {
    feedback.push("At least one number");
  } else {
    score += 1;
  }

  if (!requirements.specialChar) {
    feedback.push("At least one special character");
  } else {
    score += 1;
  }

  if (!requirements.noCommonWords) {
    feedback.push("Avoid common passwords");
  } else {
    score += 1;
  }

  const isValid = Object.values(requirements).every(Boolean);

  return {
    score,
    feedback,
    isValid,
    requirements,
  };
};

const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    "password",
    "123456",
    "password123",
    "admin",
    "qwerty",
    "letmein",
    "welcome",
    "monkey",
    "1234567890",
    "abc123",
    "password1",
    "12345678",
    "welcome123",
    "admin123",
    "root",
    "toor",
    "pass",
    "test",
    "guest",
    "user",
    "login",
    "master",
    "secret",
    "default",
    "changeme",
    "1234",
    "12345",
    "1234567",
    "123456789",
    "belgiumcampus",
    "student",
    "campus",
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => 
    lowerPassword.includes(common) || common.includes(lowerPassword)
  );
};

export const getPasswordStrengthLabel = (score: number): string => {
  if (score <= 2) return "Very Weak";
  if (score <= 3) return "Weak";
  if (score <= 4) return "Fair";
  if (score <= 5) return "Good";
  return "Strong";
};

export const getPasswordStrengthColor = (score: number): string => {
  if (score <= 2) return "#f44336";
  if (score <= 3) return "#ff9800";
  if (score <= 4) return "#ffc107";
  if (score <= 5) return "#4caf50";
  return "#2e7d32";
};
