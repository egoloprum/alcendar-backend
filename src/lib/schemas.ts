import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Please enter a valid email address' })
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(20, 'Password is too long')
  .refine(val => /[0-9]/.test(val), 'Password must contain at least one number')
  .refine(val => /[a-z]/.test(val), 'Password must contain at least one lowercase letter')
  .refine(val => /[A-Z]/.test(val), 'Password must contain at least one uppercase letter')
const tokenSchema = z
  .string()
  .length(6, 'Verification code must be exactly 6 digits')
  .regex(/^\d+$/, 'Verification code must only contain numbers')

export const SignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const SigninSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const OtpSendSchema = z.object({
  email: emailSchema,
})

export const OtpVerifySchema = z.object({
  email: emailSchema,
  token: tokenSchema,
})
