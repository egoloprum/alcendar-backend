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
import { authMiddleware } from './middleware/auth.middleware'

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

routes.post(AuthRoutes.signin, signin)
routes.post(AuthRoutes.signup, signup)
routes.get(AuthRoutes.signout, signout)

routes.post(AuthRoutes.otpVerify, otpVerify)
routes.post(AuthRoutes.otpResend, otpResend)

routes.get(AuthRoutes.getCurrentUser, authMiddleware, getCurrentUser)

routes.get(InitialSettingsRoutes.confirmAge, authMiddleware, confirmAge)
