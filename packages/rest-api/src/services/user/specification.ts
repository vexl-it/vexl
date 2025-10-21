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
import {Schema} from 'effect'
import {ServerSecurityMiddleware} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {
  GenerateLoginChallengeResponse,
  GetVersionServiceInfoResponse,
  InitEraseUserRequest,
  InitEraseUserResponse,
  InitPhoneVerificationRequest,
  InitPhoneVerificationResponse,
  InitVerificationErrors,
  NumberDoesNotMatchOldHashError,
  RegenerateSessionCredentialsRequest,
  RegenerateSessionCredentialsResponse,
  UnableToGenerateSignatureError,
  VerifyAndEraseUserRequest,
  VerifyAndEraseUserResponse,
  VerifyChallengeErrors,
  VerifyChallengeRequest,
  VerifyChallengeResponse,
  VerifyCodeErrors,
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
  .addError(InitVerificationErrors)

export const VerifyCodeEndpoint = HttpApiEndpoint.post(
  'verifyCode',
  '/api/v1/user/confirmation/code'
)
  .setPayload(VerifyPhoneNumberRequest)
  .addSuccess(VerifyPhoneNumberResponse)
  .addError(VerifyCodeErrors)

export const VerifyChallengeEndpoint = HttpApiEndpoint.post(
  'verifyChallenge',
  '/api/v1/user/confirmation/challenge'
)
  .setPayload(VerifyChallengeRequest)
  .addSuccess(VerifyChallengeResponse)
  .addError(VerifyChallengeErrors)

export const LogoutUserEndpoint = HttpApiEndpoint.del(
  'logoutUser',
  '/api/v1/user/me'
)
  .middleware(ServerSecurityMiddleware)
  .addSuccess(Schema.String)

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
  .addError(InitVerificationErrors)

export const VerifyAndEraseUserEndpoint = HttpApiEndpoint.del(
  'verifyAndEraseuser',
  '/api/v1/user/erase/verify'
)
  .setPayload(VerifyAndEraseUserRequest)
  .addSuccess(VerifyAndEraseUserResponse)
  .addError(VerifyCodeErrors)

const EraseUserGroup = HttpApiGroup.make('EraseUser')
  .add(InitEraseUserEndpoint)
  .add(VerifyAndEraseUserEndpoint)

export const RegenerateSessionCredentialsErrors = Schema.Union(
  NumberDoesNotMatchOldHashError,
  UnableToGenerateSignatureError
)

export const RegenerateSessionCredentialsEndpoint = HttpApiEndpoint.post(
  'regenerateSessionCredentials',
  '/api/v1/regenerate-session-credentials'
)
  .middleware(ServerSecurityMiddleware)
  .setPayload(RegenerateSessionCredentialsRequest)
  .addSuccess(RegenerateSessionCredentialsResponse)
  .addError(RegenerateSessionCredentialsErrors)

export const GetVersionServiceInfoEndpoint = HttpApiEndpoint.get(
  'getVersionServiceInfo',
  '/api/v1/version-service-info'
)
  .setHeaders(CommonHeaders)
  .addSuccess(GetVersionServiceInfoResponse)

export const GenerateLoginChallenge = HttpApiEndpoint.get(
  'generateLoginChallenge',
  '/api/v1/generate-login-challenge'
).addSuccess(GenerateLoginChallengeResponse)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(LogoutUserEndpoint)
  .add(RegenerateSessionCredentialsEndpoint)
  .add(GetVersionServiceInfoEndpoint)
  .add(GenerateLoginChallenge)

export const UserApiSpecification = HttpApi.make('User API')
  .add(LoginGroup)
  .add(EraseUserGroup)
  .add(RootGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)
