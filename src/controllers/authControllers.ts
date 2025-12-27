import type { Context } from 'hono'
import { getSupabaseClient } from '../lib/supabase'
import { responseError, responseSuccess } from '../lib/helpers'
import { deleteCookie, getCookie } from 'hono/cookie'
import { Tokens } from '../lib/constants'

// TODO: zod validition

export const signin = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)

  const { email, password } = await c.req.json<{
    email: string
    password: string
  }>()

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data) {
    return responseError(
      {
        code: 'AUTH_ERROR',
        message: error?.message || 'Error while signing in',
      },
      'Authentication failed',
      { status: 400 }
    )
  }

  const accessToken = data.session?.access_token
  const refreshToken = data.session?.refresh_token

  if (!accessToken || !refreshToken) {
    return responseError(
      {
        code: 'TOKEN_ERROR',
        message: 'Error while saving token',
      },
      'Token generation failed',
      { status: 500 }
    )
  }

  c.header('x-access-token', accessToken)
  c.header('x-refresh-token', refreshToken)

  return responseSuccess(
    {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    },
    'Successfully signed in',
    {
      status: 200,
    }
  )
}

export const signup = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)
  const { email, password } = await c.req.json<{
    email: string
    password: string
  }>()

  if (!email || !password) {
    return responseError(
      {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      },
      'Validation failed',
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAnon.auth.signUp({
    email: email,
    password: password,
  })

  if (error) {
    return responseError(
      {
        code: 'SIGNUP_ERROR',
        message: error.message,
        details: error.status?.toString(),
      },
      'Signup failed',
      { status: 400 }
    )
  }

  if (!data?.user) {
    return responseError(
      {
        code: 'USER_CREATION_ERROR',
        message: 'User creation failed - no user data returned',
      },
      'Signup failed',
      { status: 500 }
    )
  }

  if (data.user.confirmed_at) {
    return responseSuccess({ is_confirmed: true }, 'Account created and confirmed successfully', {
      status: 201,
    })
  }

  return responseSuccess(
    { is_confirmed: false },
    'Account created successfully. Please check your email to confirm your account.',
    { status: 201 }
  )
}

export const signout = async (c: Context) => {
  await getSupabaseClient(c).supabaseAnon.auth.signOut()
  deleteCookie(c, Tokens.accessToken)
  deleteCookie(c, Tokens.refreshToken)

  return responseSuccess({}, 'Account signed out successfully.', { status: 200 })
}

export const refresh = async (c: Context) => {
  const refresh_token = getCookie(c, Tokens.refreshToken)

  if (!refresh_token) {
    return responseError(
      {
        code: 'NO_REFRESH_TOKEN',
        message: 'No refresh token found in cookies',
      },
      'Authentication required',
      { status: 401 }
    )
  }

  const { data, error } = await getSupabaseClient(c).supabaseAnon.auth.refreshSession({
    refresh_token,
  })

  if (error) {
    return responseError(
      {
        code: 'REFRESH_ERROR',
        message: error.message,
        details: error.status?.toString(),
      },
      'Failed to refresh session',
      {
        status: error.status === 400 || error.status === 401 ? 401 : 403,
      }
    )
  }

  const accessToken = data.session?.access_token
  const refreshToken = data.session?.refresh_token

  if (!accessToken || !refreshToken) {
    return responseError(
      {
        code: 'TOKEN_GENERATION_ERROR',
        message: 'Failed to generate new tokens',
      },
      'Token generation failed',
      { status: 500 }
    )
  }

  c.header('x-access-token', accessToken)
  c.header('x-refresh-token', refreshToken)

  return responseSuccess({ accessToken, refreshToken }, 'Session refreshed successfully', {
    status: 200,
  })
}

export const otpVerify = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)

  const { email, token } = await c.req.json<{
    email: string
    token: string
  }>()

  if (!email || !token) {
    return responseError(
      {
        code: 'VALIDATION_ERROR',
        message: 'Email and OTP token are required',
      },
      'Validation failed',
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAnon.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    let errorCode = 'OTP_VERIFICATION_ERROR'
    let statusCode = 401

    if (error.message?.includes('expired')) {
      errorCode = 'OTP_EXPIRED'
      statusCode = 410
    } else if (error.message?.includes('invalid')) {
      errorCode = 'INVALID_OTP'
    } else if (error.message?.includes('rate limit')) {
      errorCode = 'RATE_LIMITED'
      statusCode = 429
    }

    return responseError(
      {
        code: errorCode,
        message: error.message,
        details: error.status?.toString(),
      },
      'OTP verification failed',
      { status: statusCode }
    )
  }

  if (!data.user) {
    return responseError(
      {
        code: 'VERIFICATION_DATA_MISSING',
        message: 'No verification data returned',
      },
      'Verification failed',
      { status: 500 }
    )
  }

  const accessToken = data.session?.access_token
  const refreshToken = data.session?.refresh_token

  if (!accessToken || !refreshToken) {
    return responseError(
      {
        code: 'TOKEN_GENERATION_ERROR',
        message: 'Failed to generate new tokens',
      },
      'Token generation failed',
      { status: 500 }
    )
  }

  c.header('x-access-token', accessToken)
  c.header('x-refresh-token', refreshToken)

  return responseSuccess(
    {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    },
    'OTP verified successfully',
    {
      status: 200,
    }
  )
}

export const otpResend = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)

  const { email } = await c.req.json<{
    email: string
  }>()

  if (!email) {
    return responseError(
      {
        code: 'MISSING_EMAIL',
        message: 'Email is required',
      },
      'Validation failed',
      { status: 400 }
    )
  }

  const { error } = await supabaseAnon.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    return responseError(
      {
        code: 'RESEND_ERROR',
        message: error.message,
      },
      'Failed to resend OTP',
      { status: 400 }
    )
  }

  return responseSuccess({}, 'OTP resent successfully', { status: 200 })
}

export const getCurrentUser = async (c: Context) => {
  const user = c.get('user')

  if (!user) {
    return responseError(
      { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      'Authentication required',
      { status: 401 }
    )
  }

  return responseSuccess(
    {
      user: {
        id: user.id,
        email: user.email,
      },
    },
    'User retrieved successfully',
    { status: 200 }
  )
}
