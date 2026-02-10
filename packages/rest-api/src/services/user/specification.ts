import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {InvalidLoginSignatureError} from '@vexl-next/domain/src/general/loginChallenge'
import {Schema} from 'effect'
import {
  CommonAndSecurityHeaders,
  ServerSecurityMiddleware,
} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  GenerateLoginChallengeResponse,
  GetVersionServiceInfoResponse,
  InitEraseUserRequest,
  InitEraseUserResponse,
  InitPhoneVerificationRequest,
  InitPhoneVerificationResponse,
  InitUpgradeAuthRequest,
  InitUpgradeAuthResponse,
  InvalidSignatureError,
  InvalidVerificationError,
  InvalidVerificationIdError,
  PreviousCodeNotExpiredError,
  SubmitUpgradeAuthRequest,
  SubmitUpgradeAuthResponse,
  UnableToGenerateChallengeError,
  UnableToGenerateSignatureError,
  UnableToSendVerificationSmsError,
  UnableToVerifySmsCodeError,
  UnsupportedVersionToLoginError,
  UpgradeAuthInvalidSignatureError,
  VerificationNotFoundError,
  VerifyAndEraseUserRequest,
  VerifyAndEraseUserResponse,
  VerifyChallengeRequest,
  VerifyChallengeResponse,
  VerifyPhoneNumberRequest,
  VerifyPhoneNumberResponse,
} from './contracts'

export const InitVerificationEndpoint = HttpApiEndpoint.post(
  'initVerification',
  '/api/v1/user/confirmation/phone'
)
  .annotate(OpenApi.Description, 'Initiate phone verification')
  .setHeaders(CommonHeaders)
  .setPayload(InitPhoneVerificationRequest)
  .addSuccess(InitPhoneVerificationResponse)
  .addError(UnableToSendVerificationSmsError, {status: 400})
  .addError(PreviousCodeNotExpiredError, {status: 400})
  .addError(UnsupportedVersionToLoginError, {status: 400})
  .addError(InvalidLoginSignatureError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

export const VerifyCodeEndpoint = HttpApiEndpoint.post(
  'verifyCode',
  '/api/v1/user/confirmation/code'
)
  .setPayload(VerifyPhoneNumberRequest)
  .addSuccess(VerifyPhoneNumberResponse)
  .addError(UnableToGenerateChallengeError, {status: 400})
  .addError(VerificationNotFoundError, {status: 400})
  .addError(InvalidVerificationIdError, {status: 400})
  .addError(UnableToVerifySmsCodeError, {status: 400})
  .addError(InvalidVerificationError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

export const VerifyChallengeEndpoint = HttpApiEndpoint.post(
  'verifyChallenge',
  '/api/v1/user/confirmation/challenge'
)
  .setPayload(VerifyChallengeRequest)
  .addSuccess(VerifyChallengeResponse)
  .addError(InvalidSignatureError, {status: 400})
  .addError(UnableToGenerateSignatureError, {status: 400})
  .addError(VerificationNotFoundError, {status: 400})
  .addError(InvalidVerificationError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

export const LogoutUserEndpoint = HttpApiEndpoint.del(
  'logoutUser',
  '/api/v1/user/me'
)
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .addSuccess(Schema.String)
  .annotate(MaxExpectedDailyCall, 100)

const LoginGroup = HttpApiGroup.make('Login')
  .add(InitVerificationEndpoint)
  .add(VerifyCodeEndpoint)
  .add(VerifyChallengeEndpoint)

export const InitEraseUserEndpoint = HttpApiEndpoint.post(
  'initEraseUser',
  '/api/v1/user/erase/init'
)
  .setHeaders(CommonHeaders)
  .setPayload(InitEraseUserRequest)
  .addSuccess(InitEraseUserResponse)
  .addError(UnableToSendVerificationSmsError, {status: 400})
  .addError(PreviousCodeNotExpiredError, {status: 400})
  .addError(UnsupportedVersionToLoginError, {status: 400})
  .addError(InvalidLoginSignatureError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

export const VerifyAndEraseUserEndpoint = HttpApiEndpoint.del(
  'verifyAndEraseuser',
  '/api/v1/user/erase/verify'
)
  .setPayload(VerifyAndEraseUserRequest)
  .addSuccess(VerifyAndEraseUserResponse)
  .addError(InvalidVerificationIdError, {status: 400})
  .addError(VerificationNotFoundError, {status: 400})
  .addError(UnableToVerifySmsCodeError, {status: 400})
  .addError(InvalidVerificationError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

const EraseUserGroup = HttpApiGroup.make('EraseUser')
  .add(InitEraseUserEndpoint)
  .add(VerifyAndEraseUserEndpoint)

export const GetVersionServiceInfoEndpoint = HttpApiEndpoint.get(
  'getVersionServiceInfo',
  '/api/v1/version-service-info'
)
  .setHeaders(CommonHeaders)
  .addSuccess(GetVersionServiceInfoResponse)
  .annotate(MaxExpectedDailyCall, 5000)

export const GenerateLoginChallenge = HttpApiEndpoint.get(
  'generateLoginChallenge',
  '/api/v1/generate-login-challenge'
)
  .addSuccess(GenerateLoginChallengeResponse)
  .annotate(MaxExpectedDailyCall, 100)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(LogoutUserEndpoint)
  .add(GetVersionServiceInfoEndpoint)
  .add(GenerateLoginChallenge)

export const InitUpgradeAuthEndpoint = HttpApiEndpoint.post(
  'initUpgradeAuth',
  '/api/v1/upgrade-auth/init'
)
  .annotate(
    OpenApi.Description,
    'Initialize auth upgrade by submitting new public key V2 and receiving a challenge'
  )
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(InitUpgradeAuthRequest)
  .addSuccess(InitUpgradeAuthResponse)
  .annotate(MaxExpectedDailyCall, 100)

export const SubmitUpgradeAuthEndpoint = HttpApiEndpoint.post(
  'submitUpgradeAuth',
  '/api/v1/upgrade-auth/submit'
)
  .annotate(
    OpenApi.Description,
    'Submit signed challenge to receive VexlAuthHeader'
  )
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(SubmitUpgradeAuthRequest)
  .addSuccess(SubmitUpgradeAuthResponse)
  .addError(UpgradeAuthInvalidSignatureError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

const UpgradeAuthGroup = HttpApiGroup.make('UpgradeAuth')
  .add(InitUpgradeAuthEndpoint)
  .add(SubmitUpgradeAuthEndpoint)

export const UserApiSpecification = HttpApi.make('User API')
  .middleware(RateLimitingMiddleware)
  .add(LoginGroup)
  .add(EraseUserGroup)
  .add(UpgradeAuthGroup)
  .add(RootGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
