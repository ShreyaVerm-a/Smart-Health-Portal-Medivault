import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be less than 255 characters' });

// Password validation
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password must be less than 128 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' });

// Phone validation
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{0,14}$/, { message: 'Invalid phone number format' })
  .optional()
  .or(z.literal(''));

// Name validation
export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Name must be at least 2 characters' })
  .max(100, { message: 'Name must be less than 100 characters' })
  .regex(/^[a-zA-Z\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' });

// Medical license validation
export const medicalLicenseSchema = z
  .string()
  .trim()
  .min(5, { message: 'Medical license must be at least 5 characters' })
  .max(50, { message: 'Medical license must be less than 50 characters' })
  .regex(/^[A-Z0-9-]+$/i, { message: 'Invalid medical license format' });

// Patient ID validation
export const patientIdSchema = z
  .string()
  .trim()
  .regex(/^PAT-\d{8}$/, { message: 'Patient ID must be in format PAT-12345678' })
  .optional()
  .or(z.literal(''));

// OTP validation
export const otpSchema = z
  .string()
  .trim()
  .length(6, { message: 'OTP must be exactly 6 digits' })
  .regex(/^\d{6}$/, { message: 'OTP must contain only numbers' });

// Sign up validation schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: nameSchema,
  role: z.enum(['patient', 'doctor', 'hospital_admin']),
  phone: phoneSchema,
  medicalLicense: z.string().optional(),
  hospitalAffiliation: z.string().max(200).optional(),
  specialization: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().max(500).optional(),
  emergencyContact: z.string().max(200).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Require medical license for doctors
  if (data.role === 'doctor' && !data.medicalLicense) {
    return false;
  }
  return true;
}, {
  message: "Medical license is required for doctors",
  path: ["medicalLicense"],
});

// Sign in validation schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
});

// Patient search validation
export const patientSearchSchema = z.object({
  searchQuery: z.string().trim().min(3, { message: 'Search query must be at least 3 characters' }),
  searchType: z.enum(['email', 'patient_id']),
}).refine((data) => {
  if (data.searchType === 'email') {
    return emailSchema.safeParse(data.searchQuery).success;
  }
  if (data.searchType === 'patient_id') {
    return patientIdSchema.safeParse(data.searchQuery).success;
  }
  return true;
}, {
  message: 'Invalid search query format',
  path: ['searchQuery'],
});
