import { Hono } from 'hono'

import { zValidator } from '@hono/zod-validator'
import { getSupabase } from '../middleware/auth.middleware'
import {
  emailSchema,
  GoogleAuthSchema,
  OtpSendSchema,
  OtpVerifySchema,
  SigninSchema,
  SignupSchema,
} from '../lib/schemas'

import { z } from 'zod'

export const auth = new Hono()

/* ------------------------- Helper Response ------------------------- */

const authResponse = (data: any) => ({
  user: data.user,
  session: data.session,
  requiresEmailVerification: !data.user?.email_confirmed_at,
})

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

/* --------------------------- OTP Resend ---------------------------- */

auth.post('/otp/resend', zValidator('json', z.object({ email: emailSchema })), async c => {
  console.log('OTP resend called!')

  const supabase = getSupabase(c)
  const { email } = await c.req.json()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
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
