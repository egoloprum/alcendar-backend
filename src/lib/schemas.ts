import { z } from 'zod'

export const emailSchema = z.string().email()
const passwordSchema = z.string().min(1)

export const usernameSchema = z
  .string()
  .min(5, 'Username must be at least 5 characters long')
  .refine(u => !u.startsWith('.'), {
    message: 'Username cannot start with a dot',
  })
  .regex(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and dots',
  })

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
  token: z.string().min(1),
})

export const GoogleAuthSchema = z.object({
  redirectTo: z.string().url().optional(),
})
