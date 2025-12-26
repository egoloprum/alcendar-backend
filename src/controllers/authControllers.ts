import type { Context } from 'hono'
import { getSupabaseClient } from '../lib/supabase'
import { setAuthCookies } from '../lib/helpers'
import { deleteCookie, getCookie } from 'hono/cookie'
import { Tokens } from '../lib/constants'

export const signin = async (c: Context) => {
  const { supabaseService } = getSupabaseClient(c)

  const { email, password } = await c.req.json<{
    email: string
    password: string
  }>()

  const { data, error } = await supabaseService.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data) {
    return c.json({ error: error?.message || 'Error while signing in' }, 400)
  }

  const accessToken = data.session?.access_token
  const refreshToken = data.session?.refresh_token

  if (!accessToken || !refreshToken) {
    return c.json({ error: 'Error while saving token' }, 500)
  }

  setAuthCookies(c, accessToken, refreshToken)

  return c.json({ message: 'Success at sign-in', accessToken, refreshToken }, 200)
}

export const signup = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)
  const { email, password } = await c.req.json<{
    email: string
    password: string
  }>()

  const { data, error } = await supabaseAnon.auth.signUp({
    email: email,
    password: password,
  })

  if (error || !data?.user?.email) {
    return c.json({ error: error?.message || 'Error while signing up' }, 400)
  }

  return c.json({ message: 'Success at sign-up' }, 200)
}

export const signout = async (c: Context) => {
  await getSupabaseClient(c).supabaseAnon.auth.signOut()
  deleteCookie(c, Tokens.accessToken)
  deleteCookie(c, Tokens.refreshToken)

  return c.json({ message: 'Success at sign-out' }, 200)
}

export const refresh = async (c: Context) => {
  const refresh_token = getCookie(c, Tokens.refreshToken)

  if (!refresh_token) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'No refresh token',
      },
      401
    )
  }

  const { data, error } = await getSupabaseClient(c).supabaseAnon.auth.refreshSession({
    refresh_token,
  })

  if (error) {
    return c.json(
      {
        error: 'Unauthorized',
        message: error.message,
      },
      403
    )
  }

  const accessToken = data.session?.access_token
  const refreshToken = data.session?.refresh_token

  if (!accessToken || !refreshToken) {
    return c.json({ error: 'Error while saving token' }, 500)
  }

  setAuthCookies(c, accessToken, refreshToken)

  return c.json({ message: 'Success at refreshing token', accessToken, refreshToken }, 200)
}

export const otpVerify = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)

  const { email, token } = await c.req.json<{
    email: string
    token: string
  }>()

  const { data, error } = await supabaseAnon.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return c.json(
      {
        error: 'Unauthorized',
        message: error.message,
      },
      401
    )
  }

  const accessToken = data.session?.access_token
  const refreshToken = data.session?.refresh_token

  if (!accessToken || !refreshToken) {
    return c.json({ error: 'Error while saving token' }, 500)
  }

  setAuthCookies(c, accessToken, refreshToken)

  return c.json({ message: 'Success at verifying OTP', accessToken, refreshToken }, 200)
}

export const otpResend = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)

  const { email } = await c.req.json<{
    email: string
  }>()

  const { error } = await supabaseAnon.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    return c.json(
      {
        error: 'Unauthorized',
        message: error.message,
      },
      401
    )
  }

  return c.json({ message: 'Success at resending OTP' }, 200)
}
