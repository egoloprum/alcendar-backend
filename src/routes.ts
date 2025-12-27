import { Hono } from 'hono'
import {
  getCurrentUser,
  otpResend,
  otpVerify,
  signin,
  signout,
  signup,
} from './controllers/authControllers'
import { confirmAge } from './controllers/initialSettingsControllers'

import { OtpSendSchema, OtpVerifySchema, SigninSchema, SignupSchema } from './lib/schemas'
import { authMiddleware, validate } from './middleware'

export const routes = new Hono().basePath('/api')

enum AuthRoutes {
  signin = '/auth/signin',
  signup = '/auth/signup',
  signout = '/auth/signout',
  otpVerify = '/auth/otp/verify',
  otpResend = '/auth/otp/resend',
  getCurrentUser = '/auth/me',
}

enum InitialSettingsRoutes {
  confirmAge = '/initial-settings/confirm-age',
}

routes.post(AuthRoutes.signin, validate(SigninSchema), signin)
routes.post(AuthRoutes.signup, validate(SignupSchema), signup)
routes.get(AuthRoutes.signout, signout)

routes.post(AuthRoutes.otpVerify, validate(OtpVerifySchema), otpVerify)
routes.post(AuthRoutes.otpResend, validate(OtpSendSchema), otpResend)

routes.get(AuthRoutes.getCurrentUser, authMiddleware, getCurrentUser)

routes.get(InitialSettingsRoutes.confirmAge, authMiddleware, confirmAge)
