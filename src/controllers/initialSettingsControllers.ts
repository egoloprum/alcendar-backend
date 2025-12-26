import type { Context } from 'hono'

export const confirmAge = async (c: Context) => {
  return c.json({ message: 'hello world' }, 200)
}
