import { Hono } from 'hono'
import { otpResend, otpVerify, signin, signout, signup } from './controllers/authControllers'

export const routes = new Hono().basePath('/api')

enum AuthRoutes {
  signin = '/auth/signin',
  signup = '/auth/signup',
  signout = '/auth/signout',
  otpVerify = '/auth/otp/verify',
  otpResend = '/auth/otp/resend',
}

routes.post(AuthRoutes.signin, signin)
routes.post(AuthRoutes.signup, signup)
routes.get(AuthRoutes.signout, signout)

routes.post(AuthRoutes.otpVerify, otpVerify)
routes.post(AuthRoutes.otpResend, otpResend)
