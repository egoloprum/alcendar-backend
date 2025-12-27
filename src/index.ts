import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { routes } from './routes'

const app = new Hono().use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
    exposeHeaders: ['X-Access-Token', 'X-Refresh-Token'],
  }),
  // csrf(),
  // secureHeaders(),
  logger()
)

app.route('/', routes)

export default app
