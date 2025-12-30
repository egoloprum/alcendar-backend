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
import {
  getFollowersOfUser,
  getFollowingOfUser,
  getFollowStatus,
  followUser,
  unfollowUser,
  getRecentSearchUser,
  getSearchUser,
} from './controllers/userControllers'

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

enum UsersRoutes {
  followAction = '/users/:target_user_id/follow',
  userFollowers = '/users/:user_id/followers',
  userFollowing = '/users/:user_id/following',
  recentlySearchedUser = '/users/recent-searches',
  searchedUser = '/users/search',
}

routes.post(AuthRoutes.signin, validate(SigninSchema), signin)
routes.post(AuthRoutes.signup, validate(SignupSchema), signup)
routes.get(AuthRoutes.signout, signout)
routes.post(AuthRoutes.otpVerify, validate(OtpVerifySchema), otpVerify)
routes.post(AuthRoutes.otpResend, validate(OtpSendSchema), otpResend)
routes.get(AuthRoutes.getCurrentUser, authMiddleware, getCurrentUser)

routes.get(InitialSettingsRoutes.confirmAge, authMiddleware, confirmAge)

routes.get(UsersRoutes.userFollowers, authMiddleware, getFollowersOfUser)
routes.get(UsersRoutes.userFollowing, authMiddleware, getFollowingOfUser)
routes.get(UsersRoutes.followAction, authMiddleware, getFollowStatus)
routes.post(UsersRoutes.followAction, authMiddleware, followUser)
routes.delete(UsersRoutes.followAction, authMiddleware, unfollowUser)

routes.get(UsersRoutes.recentlySearchedUser, authMiddleware, getRecentSearchUser)
routes.get(UsersRoutes.searchedUser, authMiddleware, getSearchUser)
