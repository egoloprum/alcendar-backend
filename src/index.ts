import { Hono } from 'hono'
import { supabaseMiddleware } from './middleware/auth.middleware'
import { auth } from './routes/auth'

const app = new Hono()
app.use('*', supabaseMiddleware())

app.route('/auth', auth)

app.get('/', c => {
  return c.json({
    message: 'Welcome to the Hono Supabase Auth example!',
  })
})

export default app
