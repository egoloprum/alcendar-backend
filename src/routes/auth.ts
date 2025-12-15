import { Hono } from 'hono'
import { getSupabase } from '../middleware/auth.middleware'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const auth = new Hono()

const SendOtpSchema = z.object({
  email: z.email(),
})

const VerifyOtpSchema = z.object({
  email: z.email(),
  token: z.string().min(1),
})

const GoogleAuthSchema = z.object({
  redirectTo: z.url().optional(),
})
const UsernameCheckSchema = z.object({
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters long')
    .refine(u => !u.startsWith('.'), {
      message: 'Username cannot start with a dot',
    })
    .regex(/^[a-zA-Z0-9_.]+$/, {
      message: 'Username can only contain letters, numbers, underscores, and dots',
    }),
})

const SignupSchema = z.object({
  email: z.email(),
  password: z.string(),
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters long')
    .refine(u => !u.startsWith('.'), {
      message: 'Username cannot start with a dot',
    })
    .regex(/^[a-zA-Z0-9_.]+$/, {
      message: 'Username can only contain letters, numbers, underscores, and dots',
    }),
})

auth.post('/check-username', zValidator('json', UsernameCheckSchema), async c => {
  try {
    console.log('check-username called')
    const { username } = await c.req.json()

    const supabase = getSupabase(c)

    const { data } = await supabase
      .from('username_lookup')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    return c.json({
      available: !data,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json(
      {
        available: false,
        message: 'Internal server error',
      },
      500
    )
  }
})

auth.post('/signup', zValidator('json', SignupSchema), async c => {
  try {
    console.log('signup called')
    const supabase = getSupabase(c)
    const { email, password, username } = await c.req.json()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json({
      user: data.user,
      session: data.session,
      requiresEmailVerification: !data.user?.email_confirmed_at,
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Server error' }, 500)
  }
})

auth.post('/google', zValidator('json', GoogleAuthSchema), async c => {
  try {
    const supabase = getSupabase(c)
    const { redirectTo } = await c.req.json()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    })

    if (error) return c.json({ error: error.message }, 400)

    return c.json({ url: data.url })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Server error' }, 500)
  }
})

auth.post('/send-otp', zValidator('json', SendOtpSchema), async c => {
  try {
    console.log('send-otp called')
    const supabase = getSupabase(c)
    const { email } = await c.req.json()

    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) return c.json({ error: error.message }, 400)

    return c.json({ success: true })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Server error' }, 500)
  }
})

auth.post('/verify-otp', zValidator('json', VerifyOtpSchema), async c => {
  try {
    console.log('verify-otp called')
    const supabase = getSupabase(c)
    const { email, token } = await c.req.json()

    if (!email || !token) {
      return c.json({ error: 'Email and token are required' }, 400)
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json({
      success: true,
      session: data.session,
      user: data.user,
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Server error' }, 500)
  }
})
