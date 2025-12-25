import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'

import { getSupabaseClient } from '../lib/supabase'
import { setAuthCookies } from '../lib/helpers'
import { Tokens } from '../lib/constants'

export const authMiddleware = async (c: Context, next: Next) => {
  const { supabaseAnon, supabaseService } = getSupabaseClient(c)

  const accessToken = getCookie(c, Tokens.accessToken)
  const refreshToken = getCookie(c, Tokens.refreshToken)

  if (!accessToken && refreshToken) {
    const { data, error } = await supabaseService.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      return c.json({ error: 'Session refresh failed' }, 401)
    }

    setAuthCookies(c, data.session.access_token, data.session.refresh_token)

    c.set('user', data.user)
  } else if (!accessToken || !refreshToken) {
    return c.json({ error: 'Authorization tokens missing' }, 401)
  } else {
    const { data, error } = await supabaseAnon.auth.getUser(accessToken)

    if (error || !data.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('user', data.user)
  }

  await next()
}
