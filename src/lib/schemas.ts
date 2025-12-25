import { z } from 'zod'

export const emailSchema = z.string().email()
const passwordSchema = z.string().min(8)

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
  token: z.string().length(6),
})
