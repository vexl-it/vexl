import {Schema} from '@effect/schema'
import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {SubmitFeedbackRequest} from '../feedback/contracts'
import {
  InitPhoneVerificationRequest,
  InitPhoneVerificationResponse,
  InitVerificationErrors,
  NumberDoesNotMatchOldHashError,
  RegenerateSessionCredentialsRequest,
  RegenerateSessionCredentialsResponse,
  UnableToGenerateSignatureError,
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

export const UserApiSpecification = Api.make({title: 'User service'}).pipe(
  Api.addGroup(LoginGroup),
  Api.addEndpoint(LogoutUserEndpoint),
  Api.addEndpoint(SubmitFeedbackEndpoint),
  Api.addEndpoint(RegenerateSessionCredentialsEndpoint)
)
