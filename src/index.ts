import { Hono } from 'hono'
import { getSupabase, supabaseMiddleware } from './middleware/auth.middleware'

const app = new Hono()
app.use('*', supabaseMiddleware())

const routes = app.get('/api/user', async c => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.auth.getUser()

  if (error) console.log('error', error)

  if (!data?.user) {
    return c.json({
      message: 'You are not logged in.',
    })
  }

  return c.json({
    message: 'You are logged in!',
    userId: data.user,
  })
})

app.get('/signout', async c => {
  const supabase = getSupabase(c)
  await supabase.auth.signOut()
  console.log('Signed out server-side!')
  return c.redirect('/')
})

app.get('/', c => {
  return c.json({
    message: 'Welcome to the Hono Supabase Auth example!',
  })
})

export type AppType = typeof routes

export default app
