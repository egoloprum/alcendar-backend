import type { Context } from 'hono'
import { getSupabaseClient } from '../lib/supabase'
import type { User } from '../lib/types'
import type { PostgrestError } from '@supabase/supabase-js'
import { responseError } from '../lib/helpers'

type PublicUser = Pick<User, 'id' | 'username' | 'avatar_url'>

export const getFollowersOfUser = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)

  const user_id = c.req.param('user_id')

  const { data: followers, error } = (await supabaseAnon
    .rpc('get_user_followers', {
      target_user_id: user_id,
    })
    .returns<PublicUser[]>()) as { data: PublicUser[] | null; error: PostgrestError | null }

  if (error) {
    return responseError(
      {
        code: 'POSTGRES_ERROR',
        message: error.message,
      },
      'Failed to fetch followers',
      { status: 500 }
    )
  }

  return c.json({ followers }, 200)
}

export const getFollowingOfUser = async (c: Context) => {
  const { supabaseAnon } = getSupabaseClient(c)

  const user_id = c.req.param('user_id')

  const { data: followings, error } = (await supabaseAnon
    .rpc('get_user_following', {
      target_user_id: user_id,
    })
    .returns<PublicUser[]>()) as { data: PublicUser[] | null; error: PostgrestError | null }

  if (error) {
    return responseError(
      {
        code: 'POSTGRES_ERROR',
        message: error.message,
      },
      'Failed to fetch followings',
      { status: 500 }
    )
  }

  return c.json({ followings }, 200)
}

export const getFollowStatus = async (c: Context) => {
  return c.json({ message: 'hello world' }, 200)
}

export const followUser = async (c: Context) => {
  return c.json({ message: 'hello world' }, 200)
}

export const unfollowUser = async (c: Context) => {
  return c.json({ message: 'hello world' }, 200)
}
