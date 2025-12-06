import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Context, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import { setCookie } from 'hono/cookie'

declare module 'hono' {
  interface ContextVariableMap {
    supabase: SupabaseClient
  }
}

export const getSupabase = (c: Context) => {
  return c.get('supabase')
}

type SupabaseEnv = {
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
}

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseEnv = env<SupabaseEnv>(c)
    const supabaseUrl = supabaseEnv.SUPABASE_URL
    const supabaseAnonKey = supabaseEnv.SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL missing!')
    }

    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_PUBLISHABLE_KEY missing!')
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          const parsed = parseCookieHeader(c.req.header('Cookie') ?? '')
          if (!parsed || parsed.length === 0) return null
          return parsed.map(({ name, value }) => ({ name, value: value ?? '' }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // normalize options to match hono's CookieOptions shape and remove boolean false sameSite
            const normalizedOptions = { ...options } as any
            if (normalizedOptions && normalizedOptions.sameSite === false) {
              delete normalizedOptions.sameSite
            }
            setCookie(c, name, value, normalizedOptions)
          })
        },
      },
    })

    c.set('supabase', supabase)

    await next()
  }
}
