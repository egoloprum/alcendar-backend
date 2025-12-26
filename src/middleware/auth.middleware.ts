import type { Context, Next } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'

import { getSupabaseClient } from '../lib/supabase'
import { setAuthCookies } from '../lib/helpers'
import { Tokens } from '../lib/constants'

export const authMiddleware = async (c: Context, next: Next) => {
  const { supabaseAnon, supabaseService } = getSupabaseClient(c)

  const accessToken = getCookie(c, Tokens.accessToken)
  const refreshToken = getCookie(c, Tokens.refreshToken)

  if (!accessToken && !refreshToken) {
    return c.json({ error: 'Unauthorized', message: 'Authorization required' }, 401)
  }

  if (!accessToken && refreshToken) {
    const { data, error } = await supabaseService.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      deleteCookie(c, Tokens.accessToken)
      deleteCookie(c, Tokens.refreshToken)
      return c.json(
        {
          error: 'Unauthorized',
          message: error?.message || 'Error at refreshing session',
        },
        401
      )
    }

    setAuthCookies(c, data.session.access_token, data.session.refresh_token)
    c.set('user', data.user)
    await next()
    return
  }

  const { data, error } = await supabaseAnon.auth.getUser(accessToken)

  if (error || !data.user) {
    return c.json({ error: 'Unauthorized', message: error?.message }, 403)
  }

  c.set('user', data.user)

  await next()
}
