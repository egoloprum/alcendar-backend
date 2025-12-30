import type { Context } from 'hono'
import { getSupabaseClient } from '../lib/supabase'
import type { AuthContext, User } from '../lib/types'
import type { PostgrestError } from '@supabase/supabase-js'
import { responseError, responseSuccess } from '../lib/helpers'

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

  return responseSuccess(
    {
      followers,
    },
    'Successfully retrieved followers',
    {
      status: 200,
    }
  )
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

  return responseSuccess(
    {
      followings,
    },
    'Successfully retrieved followings',
    {
      status: 200,
    }
  )
}

export const getFollowStatus = async (c: Context<AuthContext>) => {
  const current_user = c.get('user')
  const target_user_id = c.req.param('target_user_id')

  const { supabaseAnon } = getSupabaseClient(c)

  const { data, error } = await supabaseAnon
    .from('connections')
    .select('follower_id')
    .eq('follower_id', current_user.id)
    .eq('following_id', target_user_id)
    .single()

  if (error) {
    return responseError(
      {
        code: 'POSTGRES_ERROR',
        message: error.message,
      },
      'Failed to check following status',
      { status: 500 }
    )
  }

  return responseSuccess({ isFollowing: !!data }, 'Successfully retrieved following status', {
    status: 200,
  })
}

export const followUser = async (c: Context<AuthContext>) => {
  const current_user = c.get('user')
  const target_user_id = c.req.param('target_user_id')

  const { supabaseAnon } = getSupabaseClient(c)

  const { error } = await supabaseAnon
    .from('connections')
    .insert({ follower_id: current_user.id, following_id: target_user_id })

  if (error) {
    return responseError(
      {
        code: 'POSTGRES_ERROR',
        message: error.message,
      },
      'Failed to follow this user',
      { status: 500 }
    )
  }

  return responseSuccess({}, 'Successfully followed this user', {
    status: 200,
  })
}

export const unfollowUser = async (c: Context<AuthContext>) => {
  const current_user = c.get('user')
  const target_user_id = c.req.param('target_user_id')

  const { supabaseAnon } = getSupabaseClient(c)

  const { error } = await supabaseAnon
    .from('connections')
    .delete()
    .eq('follower_id', current_user.id)
    .eq('following_id', target_user_id)

  if (error) {
    return responseError(
      {
        code: 'POSTGRES_ERROR',
        message: error.message,
      },
      'Failed to unfollow this user',
      { status: 500 }
    )
  }

  return responseSuccess({}, 'Successfully unfollowed this user', {
    status: 200,
  })
}

export const getRecentSearchUser = async (c: Context) => {
  const current_user = c.get('user')

  const { supabaseAnon } = getSupabaseClient(c)

  const { data: users, error } = (await supabaseAnon
    .rpc('get_recent_search_users', {
      target_user_id: current_user,
    })
    .returns<PublicUser[]>()) as { data: PublicUser[] | null; error: PostgrestError | null }

  if (error) {
    return responseError(
      {
        code: 'POSTGRES_ERROR',
        message: error.message,
      },
      'Failed to fetch recently searched users',
      { status: 500 }
    )
  }

  return responseSuccess(
    {
      users,
    },
    'Successfully retrieved recently searched users',
    {
      status: 200,
    }
  )
}
