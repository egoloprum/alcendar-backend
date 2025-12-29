import type { Context, Next } from 'hono'
import { getSupabaseClient } from '../lib/supabase'
import type { AuthContext } from '../lib/types'

export const authMiddleware = async (c: Context<AuthContext>, next: Next) => {
  const { supabaseAnon, supabaseService } = getSupabaseClient(c)

  const authHeader = c.req.header('Authorization')
  const refreshToken = c.req.header('x-refresh-token')
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!accessToken && !refreshToken) {
    return c.json({ error: 'Unauthorized', message: 'Tokens are required' }, 401)
  }

  if (accessToken) {
    const { data, error } = await supabaseAnon.auth.getUser(accessToken)

    if (!error && data.user) {
      c.set('user', {
        id: data.user.id,
        email: data.user.email,
      })
      await next()
      return
    }
  }

  if (refreshToken) {
    const { data, error } = await supabaseService.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session || !data.user) {
      return c.json(
        {
          error: 'Unauthorized',
          message: error?.message || 'Invalid refresh token',
        },
        401
      )
    }

    c.header('x-access-token', data.session.access_token)
    c.header('x-refresh-token', data.session.refresh_token)

    c.set('user', {
      id: data.user.id,
      email: data.user.email,
    })
    await next()
    return
  }

  return c.json({ error: 'Unauthorized', message: 'Authentication failed' }, 401)
}
