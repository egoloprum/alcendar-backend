import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getSupabase } from '../middleware/auth.middleware'

export const auth = new Hono()

/* ----------------------------- Schemas ----------------------------- */

const emailSchema = z.string().email()
const passwordSchema = z.string().min(1)

const usernameSchema = z
  .string()
  .min(5, 'Username must be at least 5 characters long')
  .refine(u => !u.startsWith('.'), {
    message: 'Username cannot start with a dot',
  })
  .regex(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and dots',
  })

const SignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

const SigninSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

const OtpSendSchema = z.object({
  email: emailSchema,
})

const OtpVerifySchema = z.object({
  email: emailSchema,
  token: z.string().min(1),
})

const GoogleAuthSchema = z.object({
  redirectTo: z.string().url().optional(),
})

/* ------------------------- Helper Response ------------------------- */

const authResponse = (data: any) => ({
  user: data.user,
  session: data.session,
  requiresEmailVerification: !data.user?.email_confirmed_at,
})

/* ------------------------- Username Check -------------------------- */

auth.post(
  '/check-username',
  zValidator('json', z.object({ username: usernameSchema })),
  async c => {
    const { username } = await c.req.json()
    const supabase = getSupabase(c)

    const { data } = await supabase
      .from('username_lookup')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    return c.json({ available: !data })
  }
)

/* ------------------------------ Signup ----------------------------- */

auth.post('/signup', zValidator('json', SignupSchema), async c => {
  console.log('signup called!')
  const supabase = getSupabase(c)
  try {
    const { email, password } = c.req.valid('json')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      const status = error.status || 400
      return c.json(
        {
          error: error.name,
          message: error.message,
        },
        status as any
      )
    }

    return c.json(
      {
        user: data.user,
        session: !!data.session,
        message: 'Check your email for verification.',
      },
      201
    )
  } catch (e) {
    throw e
  }
})

/* ------------------------------ Signin ----------------------------- */

auth.post('/signin', zValidator('json', SigninSchema), async c => {
  console.log('signin called!')
  const supabase = getSupabase(c)
  const { email, password } = await c.req.json()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  })

  if (error) {
    const status = error.status || 400
    return c.json(
      {
        error: error.name,
        message: error.message,
      },
      status as any
    )
  }

  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    return c.json({
      requiresEmailVerification: true,
    })
  }

  return c.json(authResponse(data))
})

/* ---------------------------- OTP Send ----------------------------- */

auth.post('/otp/send', zValidator('json', OtpSendSchema), async c => {
  const supabase = getSupabase(c)
  const { email } = await c.req.json()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (error) {
    const status = error.status || 400
    return c.json(
      {
        error: error.name,
        message: error.message,
      },
      status as any
    )
  }

  return c.json({ success: true })
})

/* --------------------------- OTP Verify ---------------------------- */

auth.post('/otp/verify', zValidator('json', OtpVerifySchema), async c => {
  console.log('OTP verification called!')
  const supabase = getSupabase(c)
  const { email, token } = await c.req.json()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    const status = error.status || 400
    return c.json(
      {
        error: error.name,
        message: error.message,
      },
      status as any
    )
  }

  return c.json({
    success: true,
    session: data.session,
    user: data.user,
  })
})

/* -------------------------- Google OAuth --------------------------- */

auth.post('/google', zValidator('json', GoogleAuthSchema), async c => {
  const supabase = getSupabase(c)
  const { redirectTo } = await c.req.json()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: redirectTo ? { redirectTo } : undefined,
  })

  if (error) {
    const status = error.status || 400
    return c.json(
      {
        error: error.name,
        message: error.message,
      },
      status as any
    )
  }

  return c.json({ url: data.url })
})
