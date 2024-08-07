import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {RegionCodeE} from '@vexl-next/domain/src/utility/RegionCode.brand'
import {
  EcdsaSignature,
  HmacHash,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Api, ApiGroup} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'

export class PreviousCodeNotExpiredError extends Schema.TaggedError<PreviousCodeNotExpiredError>(
  'PreviousCodeNotExpiredError'
)('PreviousCodeNotExpiredError', {
  code: Schema.Literal('100111'), // TODO deprecated api
  status: Schema.Literal(400),
}) {}

export class UnableToSendVerificationSmsError extends Schema.TaggedError<UnableToSendVerificationSmsError>(
  'UnableToSendVerificationSmsError'
)('UnableToSendVerificationSmsError', {
  reason: Schema.Literal(
    'InvalidPhoneNumber',
    'CarrierError',
    'UnsupportedCarrier',
    'AntiFraudBlock',
    'AntiFraudBlock12h',
    'AntiFraudBlockGeo',
    'MaxAttemptsReached',
    'NumberDoesNotSupportSms',
    'Other'
  ),
  status: Schema.Literal(400),
}) {}

export class UnableToVerifySmsCodeError extends Schema.TaggedError<UnableToVerifySmsCodeError>(
  'UnableToVerifySmsCodeError'
)('UnableToVerifySmsCodeError', {
  code: Schema.Literal('100104'), // deprecated
  reason: Schema.Literal('MaxAttemptsReached', 'BadCode', 'Expired', 'Other'),
  status: Schema.Literal(400),
}) {}

export class UnableToGenerateChallengeError extends Schema.TaggedError<UnableToGenerateChallengeError>(
  'UnableToGenerateChallengeError'
)('UnableToGenerateChallengeError', {
  code: Schema.Literal('100104'), // TODO deprecated api
  status: Schema.Literal(400),
}) {}

export class InvalidSignatureError extends Schema.TaggedError<InvalidSignatureError>(
  'InvalidSignatureError'
)('InvalidSignatureError', {
  code: Schema.Literal('100108'), // TODO deprecated api
  status: Schema.Literal(400),
}) {}

export class UnableToGenerateSignatureError extends Schema.TaggedError<UnableToGenerateSignatureError>(
  'UnableToGenerateSignatureError'
)('UnableToGenerateSignatureError', {
  code: Schema.Literal('100105'), // TODO deprecated api
  status: Schema.Literal(400),
}) {}

export class VerificationNotFoundError extends Schema.TaggedError<VerificationNotFoundError>(
  'VerificationNotFoundError'
)('VerificationNotFoundError', {
  code: Schema.Literal('100104'), // TODO deprecated api
  status: Schema.Literal(404),
}) {}

export class InvalidVerificationError extends Schema.TaggedError<InvalidVerificationError>(
  'InvalidVerificationError'
)('InvalidVerificationError', {
  status: Schema.Literal(400),
}) {}

export class InitPhoneVerificationRequest extends Schema.Class<InitPhoneVerificationRequest>(
  'InitPhoneVerificationRequest'
)({
  phoneNumber: E164PhoneNumberE,
}) {}

export const PhoneNumberVerificationId = Schema.Int.pipe(
  Schema.greaterThan(0),
  Schema.brand('PhoneNumberVerificationId')
)
export type PhoneNumberVerificationId = Schema.Schema.Type<
  typeof PhoneNumberVerificationId
>

export class InitPhoneVerificationResponse extends Schema.Class<InitPhoneVerificationResponse>(
  'InitPhoneVerificationResponse'
)({
  verificationId: PhoneNumberVerificationId,
  expirationAt: IsoDatetimeStringE,
}) {}

export class VerifyPhoneNumberRequest extends Schema.Class<VerifyPhoneNumberRequest>(
  'VerifyPhoneNumberRequest'
)({
  id: PhoneNumberVerificationId,
  code: Schema.String.pipe(Schema.length(6)),
  userPublicKey: PublicKeyPemBase64E,
}) {}

export const VerificationChallenge = Schema.String.pipe(
  Schema.brand('VerificationChallenge')
)
export type VerificationChallenge = Schema.Schema.Type<
  typeof VerificationChallenge
>

export class VerifyPhoneNumberResponse extends Schema.Class<VerifyPhoneNumberResponse>(
  'VerifyPhoneNumberResponse'
)({
  challenge: VerificationChallenge,
  phoneVerified: Schema.Literal(true),
}) {}

export class VerifyChallengeRequest extends Schema.Class<VerifyChallengeRequest>(
  'VerifyChallengeRequest'
)({
  userPublicKey: PublicKeyPemBase64E,
  signature: EcdsaSignature,
}) {}

export class VerifyChallengeResponse extends Schema.Class<VerifyChallengeResponse>(
  'VerifyChallengeResponse'
)({
  hash: HmacHash,
  signature: EcdsaSignature,
  challengeVerified: Schema.Literal(true),
}) {}

export const InitVerificationErrors = Schema.Union(
  UnableToSendVerificationSmsError
)

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

export const VerifyCodeErrors = Schema.Union(
  UnableToGenerateChallengeError,
  VerificationNotFoundError,
  UnableToVerifySmsCodeError,
  InvalidVerificationError
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

export const VerifyChallengeErrors = Schema.Union(
  InvalidSignatureError,
  UnableToGenerateSignatureError,
  VerificationNotFoundError,
  InvalidVerificationError
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

export const LogoutUserEndpoint = Api.delete('logoutUser', '/user/me').pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseBody(Schema.String),
  Api.setResponseStatus(299 as const)
)

export const LoginGroup = ApiGroup.make('Login').pipe(
  ApiGroup.addEndpoint(InitVerificationEndpoint),
  ApiGroup.addEndpoint(VerifyCodeEndpoint),
  ApiGroup.addEndpoint(VerifyChallengeEndpoint)
)

export const FeedbackFormId = Schema.NonEmptyString.pipe(
  Schema.brand('FeedbackFormId')
)
export type FeedbackFormId = Schema.Schema.Type<typeof FeedbackFormId>

export const FeedbackType = Schema.Literal('create', 'trade')
export type FeedbackType = Schema.Schema.Type<typeof FeedbackType>

export class SubmitFeedbackRequest extends Schema.Class<SubmitFeedbackRequest>(
  'SubmitFeedbackRequest'
)({
  formId: FeedbackFormId,
  type: FeedbackType,
  stars: Schema.optional(
    Schema.Int.pipe(Schema.lessThanOrEqualTo(5), Schema.greaterThanOrEqualTo(0))
  ),
  objections: Schema.optional(Schema.String),
  textComment: Schema.optional(Schema.String),
  countryCode: Schema.optional(RegionCodeE),
}) {}

export const SubmitFeedbackEndpoint = Api.post(
  'submitFeedback',
  '/api/v1/feedback/submit'
).pipe(
  Api.setSecurity(ServerSecurity),
  // Api.setResponseBody(Schema.Void),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(SubmitFeedbackRequest)
)

export const UserApiSpecification = Api.make({title: 'User service'}).pipe(
  Api.addGroup(LoginGroup),
  Api.addEndpoint(LogoutUserEndpoint),
  Api.addEndpoint(SubmitFeedbackEndpoint)
)
