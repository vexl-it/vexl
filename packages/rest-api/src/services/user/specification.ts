import {InvalidLoginSignatureError} from '@vexl-next/domain/src/general/loginChallenge'
import {Schema} from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from 'effect/unstable/httpapi'
import {
  CommonAndSecurityHeaders,
  ServerSecurityMiddleware,
} from '../../apiSecurity'
import {commonApiErrors} from '../../commonApiErrors'
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
  TurnstileVerificationError,
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
  '/api/v1/user/confirmation/phone',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: Schema.Struct(InitPhoneVerificationRequest.fields),
    error: Schema.Union([
      ...commonApiErrors,
      UnableToSendVerificationSmsError.pipe(HttpApiSchema.status(400)),
      PreviousCodeNotExpiredError.pipe(HttpApiSchema.status(400)),
      UnsupportedVersionToLoginError.pipe(HttpApiSchema.status(400)),
      InvalidLoginSignatureError.pipe(HttpApiSchema.status(400)),
    ]),
    success: Schema.Struct(InitPhoneVerificationResponse.fields),
  }
)
  .annotate(OpenApi.Description, 'Initiate phone verification')
  .annotate(MaxExpectedDailyCall, 100)

export const VerifyCodeEndpoint = HttpApiEndpoint.post(
  'verifyCode',
  '/api/v1/user/confirmation/code',
  {
    disableCodecs: true,
    payload: Schema.Struct(VerifyPhoneNumberRequest.fields),
    error: Schema.Union([
      ...commonApiErrors,
      UnableToGenerateChallengeError.pipe(HttpApiSchema.status(400)),
      VerificationNotFoundError.pipe(HttpApiSchema.status(400)),
      InvalidVerificationIdError.pipe(HttpApiSchema.status(400)),
      UnableToVerifySmsCodeError.pipe(HttpApiSchema.status(400)),
      InvalidVerificationError.pipe(HttpApiSchema.status(400)),
    ]),
    success: Schema.Struct(VerifyPhoneNumberResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 100)

export const VerifyChallengeEndpoint = HttpApiEndpoint.post(
  'verifyChallenge',
  '/api/v1/user/confirmation/challenge',
  {
    disableCodecs: true,
    payload: Schema.Struct(VerifyChallengeRequest.fields),
    error: Schema.Union([
      ...commonApiErrors,
      InvalidSignatureError.pipe(HttpApiSchema.status(400)),
      UnableToGenerateSignatureError.pipe(HttpApiSchema.status(400)),
      VerificationNotFoundError.pipe(HttpApiSchema.status(400)),
      InvalidVerificationError.pipe(HttpApiSchema.status(400)),
    ]),
    success: Schema.Struct(VerifyChallengeResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 100)

export const LogoutUserEndpoint = HttpApiEndpoint.delete(
  'logoutUser',
  '/api/v1/user/me',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    error: Schema.Union([...commonApiErrors]),
    success: Schema.String,
  }
)
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 100)

const LoginGroup = HttpApiGroup.make('Login')
  .add(InitVerificationEndpoint)
  .add(VerifyCodeEndpoint)
  .add(VerifyChallengeEndpoint)

export const InitEraseUserEndpoint = HttpApiEndpoint.post(
  'initEraseUser',
  '/api/v1/user/erase/init',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: InitEraseUserRequest,
    error: Schema.Union([
      ...commonApiErrors,
      TurnstileVerificationError.pipe(HttpApiSchema.status(400)),
      UnableToSendVerificationSmsError.pipe(HttpApiSchema.status(400)),
      PreviousCodeNotExpiredError.pipe(HttpApiSchema.status(400)),
      UnsupportedVersionToLoginError.pipe(HttpApiSchema.status(400)),
      InvalidLoginSignatureError.pipe(HttpApiSchema.status(400)),
    ]),
    success: InitEraseUserResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

export const VerifyAndEraseUserEndpoint = HttpApiEndpoint.delete(
  'verifyAndEraseuser',
  '/api/v1/user/erase/verify',
  {
    disableCodecs: true,
    payload: VerifyAndEraseUserRequest,
    error: Schema.Union([
      ...commonApiErrors,
      InvalidVerificationIdError.pipe(HttpApiSchema.status(400)),
      VerificationNotFoundError.pipe(HttpApiSchema.status(400)),
      UnableToVerifySmsCodeError.pipe(HttpApiSchema.status(400)),
      InvalidVerificationError.pipe(HttpApiSchema.status(400)),
    ]),
    success: VerifyAndEraseUserResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

const EraseUserGroup = HttpApiGroup.make('EraseUser')
  .add(InitEraseUserEndpoint)
  .add(VerifyAndEraseUserEndpoint)

export const GetVersionServiceInfoEndpoint = HttpApiEndpoint.get(
  'getVersionServiceInfo',
  '/api/v1/version-service-info',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    error: Schema.Union([...commonApiErrors]),
    success: GetVersionServiceInfoResponse,
  }
).annotate(MaxExpectedDailyCall, 5000)

export const GenerateLoginChallenge = HttpApiEndpoint.get(
  'generateLoginChallenge',
  '/api/v1/generate-login-challenge',
  {
    disableCodecs: true,
    error: Schema.Union([...commonApiErrors]),
    success: GenerateLoginChallengeResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(LogoutUserEndpoint)
  .add(GetVersionServiceInfoEndpoint)
  .add(GenerateLoginChallenge)

export const InitUpgradeAuthEndpoint = HttpApiEndpoint.post(
  'initUpgradeAuth',
  '/api/v1/upgrade-auth/init',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: InitUpgradeAuthRequest,
    error: Schema.Union([...commonApiErrors]),
    success: InitUpgradeAuthResponse,
  }
)
  .annotate(
    OpenApi.Description,
    'Initialize auth upgrade by submitting new public key V2 and receiving a challenge'
  )
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 100)

export const SubmitUpgradeAuthEndpoint = HttpApiEndpoint.post(
  'submitUpgradeAuth',
  '/api/v1/upgrade-auth/submit',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: SubmitUpgradeAuthRequest,
    error: Schema.Union([
      ...commonApiErrors,
      UpgradeAuthInvalidSignatureError.pipe(HttpApiSchema.status(400)),
    ]),
    success: SubmitUpgradeAuthResponse,
  }
)
  .annotate(
    OpenApi.Description,
    'Submit signed challenge to receive VexlAuthHeader'
  )
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 100)

const UpgradeAuthGroup = HttpApiGroup.make('UpgradeAuth')
  .add(InitUpgradeAuthEndpoint)
  .add(SubmitUpgradeAuthEndpoint)

export const UserApiSpecification = HttpApi.make('User API')
  .add(LoginGroup)
  .add(EraseUserGroup)
  .add(UpgradeAuthGroup)
  .add(RootGroup)
  .middleware(RateLimitingMiddleware)
