import { createClient } from '@supabase/supabase-js'
import type { Context } from 'hono'
import { env } from 'hono/adapter'

type SupabaseEnv = {
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const getSupabaseClient = (c: Context) => {
  const supabaseEnv = env<SupabaseEnv>(c)

  const supabaseUrl = supabaseEnv.SUPABASE_URL
  const supabaseKey = supabaseEnv.SUPABASE_PUBLISHABLE_KEY
  const serviceKey = supabaseEnv.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL missing!')
  }

  if (!supabaseKey) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY missing!')
  }

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing!')
  }

  const supabaseService = createClient(supabaseUrl, serviceKey)

  const supabaseAnon = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  return { supabaseAnon, supabaseService }
}

export type SupabaseClients = ReturnType<typeof getSupabaseClient>

export { getSupabaseClient }
