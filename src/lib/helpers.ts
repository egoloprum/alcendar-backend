import type { Context } from 'hono'
import { setCookie } from 'hono/cookie'

export const setAuthCookies = (c: Context, accessToken: string, refreshToken: string) => {
  setCookie(c, 'accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 60 * 60,
  })

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 30,
  })
}
