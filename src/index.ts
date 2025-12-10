import { Hono } from 'hono'
import { supabaseMiddleware } from './middleware/auth.middleware'
import { auth } from './routes/auth'
import { cors } from 'hono/cors'

const app = new Hono()
app.use(
  '*',
  supabaseMiddleware(),
  cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'],
  })
)

app.route('/api/auth', auth)

app.get('/', c => {
  return c.json({
    message: 'Welcome to Alcendar!',
  })
})

export default app
