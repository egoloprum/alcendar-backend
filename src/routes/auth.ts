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

auth.post('/check-username', async c => {
  try {
    console.log('check-username called')
    const { username } = await c.req.json()

    if (!username || username.length < 3) {
      return c.json(
        {
          available: false,
          message: 'Username must be at least 3 characters long',
        },
        400
      )
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/
    if (!usernameRegex.test(username)) {
      return c.json(
        {
          available: false,
          message: 'Username can only contain letters, numbers, underscores, and dots',
        },
        400
      )
    }

    const supabase = getSupabase(c)

    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error)
      return c.json(
        {
          available: false,
          message: 'Database error occurred',
        },
        500
      )
    }

    if (data) {
      return c.json({
        available: false,
        message: `Username '@${username}' is already taken`,
        username: username,
      })
    }

    return c.json({
      available: true,
      message: `Username '@${username}' is available!`,
      username: username,
    })
  } catch (error) {
    console.error('Server error:', error)
    return c.json(
      {
        available: false,
        message: 'Internal server error',
      },
      500
    )
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
        shouldCreateUser: true,
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
