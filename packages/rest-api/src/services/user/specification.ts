import {Schema} from 'effect'
import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {CommonHeaders} from '../../commonHeaders'
import {SubmitFeedbackRequest} from '../feedback/contracts'
import {
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

export const InitVerificationEndpoint = Api.post(
  'initVerification',
  '/api/v1/user/confirmation/phone',
  {description: 'Initiate phone verification'}
).pipe(
  Api.setRequestBody(InitPhoneVerificationRequest),
  Api.setResponseBody(InitPhoneVerificationResponse),
  Api.addResponse({
    status: 400 as const,
    body: InitVerificationErrors,
  })
)

export const VerifyCodeEndpoint = Api.post(
  'verifyCode',
  '/api/v1/user/confirmation/code'
).pipe(
  Api.setRequestBody(VerifyPhoneNumberRequest),
  Api.setResponseBody(VerifyPhoneNumberResponse),
  Api.setResponseStatus(200 as const),
  Api.addResponse({
    status: 400 as const,
    body: VerifyCodeErrors,
  })
)

export const VerifyChallengeEndpoint = Api.post(
  'verifyChallenge',
  '/api/v1/user/confirmation/challenge'
).pipe(
  Api.setRequestBody(VerifyChallengeRequest),
  Api.setResponseBody(VerifyChallengeResponse),
  Api.setResponseStatus(200 as const),
  Api.addResponse({
    status: 400 as const,
    body: VerifyChallengeErrors,
  })
)

export const LogoutUserEndpoint = Api.delete(
  'logoutUser',
  '/api/v1/user/me'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseBody(Schema.String),
  Api.setResponseStatus(299 as const)
)

export const LoginGroup = ApiGroup.make('Login').pipe(
  ApiGroup.addEndpoint(InitVerificationEndpoint),
  ApiGroup.addEndpoint(VerifyCodeEndpoint),
  ApiGroup.addEndpoint(VerifyChallengeEndpoint)
)

export const InitEraseUserEndpoint = Api.post(
  'initEraseUser',
  '/api/v1/user/erase/init'
).pipe(
  Api.setRequestBody(InitEraseUserRequest),
  Api.setResponseBody(InitEraseUserResponse),
  Api.setResponseStatus(200 as const),
  Api.addResponse({
    status: 400 as const,
    body: InitVerificationErrors,
  })
)

export const VerifyAndEraseUserEndpoint = Api.delete(
  'verifyAndEraseuser',
  '/api/v1/user/erase/verify'
).pipe(
  Api.setRequestBody(VerifyAndEraseUserRequest),
  Api.setResponseBody(VerifyAndEraseUserResponse),
  Api.setResponseStatus(200 as const),
  Api.addResponse({
    status: 400 as const,
    body: VerifyCodeErrors,
  })
)

export const EraseUserGroup = ApiGroup.make('EraseUser').pipe(
  ApiGroup.addEndpoint(InitEraseUserEndpoint),
  ApiGroup.addEndpoint(VerifyAndEraseUserEndpoint)
)

export const SubmitFeedbackEndpoint = Api.post(
  'submitFeedback',
  '/api/v1/feedback/submit',
  {
    description: 'Moved to separate service',
  }
).pipe(
  Api.setRequestBody(SubmitFeedbackRequest),
  Api.setSecurity(ServerSecurity),
  Api.setResponseHeaders(Schema.Struct({Location: Schema.String})),
  Api.setResponseStatus(308 as const)
)

export const RegenerateSessionCredentialsErrors = Schema.Union(
  NumberDoesNotMatchOldHashError,
  UnableToGenerateSignatureError
)

export const RegenerateSessionCredentialsEndpoint = Api.post(
  'regenerateSessionCredentials',
  '/api/v1/regenerate-session-credentials'
).pipe(
  Api.setRequestBody(RegenerateSessionCredentialsRequest),
  Api.setResponseBody(RegenerateSessionCredentialsResponse),
  Api.setResponseStatus(200 as const),
  Api.setSecurity(ServerSecurity),
  Api.addResponse({
    status: 400 as const,
    body: RegenerateSessionCredentialsErrors,
  })
)

export const GetVersionServiceInfoEndpoint = Api.get(
  'getVersionServiceInfo',
  '/api/v1/version-service-info'
).pipe(
  Api.setRequestHeaders(CommonHeaders),
  Api.setResponseBody(GetVersionServiceInfoResponse),
  Api.setResponseStatus(200 as const)
)

export const UserApiSpecification = Api.make({title: 'User service'}).pipe(
  Api.addGroup(LoginGroup),
  Api.addGroup(EraseUserGroup),
  Api.addEndpoint(LogoutUserEndpoint),
  Api.addEndpoint(SubmitFeedbackEndpoint),
  Api.addEndpoint(RegenerateSessionCredentialsEndpoint),
  Api.addEndpoint(GetVersionServiceInfoEndpoint)
)
