import type { Context, Next } from 'hono'
import type { ZodSchema } from 'zod'
import { responseError } from '../lib/helpers'
import { z } from 'zod'

export const validate = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json()
      const validatedData = schema.parse(body)

      c.set('validatedBody', validatedData)

      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return responseError(
          {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
          },
          'Validation failed',
          { status: 422 }
        )
      }
      throw error
    }
  }
}
