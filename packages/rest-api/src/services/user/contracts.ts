import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {
  E164PhoneNumberE,
  type E164PhoneNumber,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {IsoDatetimeStringE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Schema} from 'effect'
export interface InvalidPhoneNumber {
  _tag: 'InvalidPhoneNumber'
}

export interface PreviousCodeNotExpired {
  _tag: 'PreviousCodeNotExpired'
}

export interface UserAlreadyExists {
  _tag: 'UserAlreadyExists'
}

export interface ChallengeCouldNotBeGenerated {
  _tag: 'ChallengeCouldNotBeGenerated'
}

export interface VerificationNotFound {
  _tag: 'VerificationNotFound'
}

export interface UserNotFound {
  _tag: 'UserNotFound'
}

export interface SignatureCouldNotBeGenerated {
  _tag: 'SignatureCouldNotBeGenerated'
}

export interface PublicKeyOrHashInvalid {
  _tag: 'PublicKeyOrHashInvalid'
}

export interface RequestCouldNotBeProcessedError {
  _tag: 'RequestCouldNotBeProcessedError'
}

export interface InitPhoneNumberVerificationRequest {
  readonly phoneNumber: E164PhoneNumber
}

export const VerificationId = Schema.Number.pipe(
  Schema.int(),
  Schema.greaterThanOrEqualTo(0),
  Schema.brand('VerificationId')
)
export type VerificationId = Schema.Schema.Type<typeof VerificationId>

export class PreviousCodeNotExpiredError extends Schema.TaggedError<PreviousCodeNotExpiredError>(
  'PreviousCodeNotExpiredError'
)('PreviousCodeNotExpiredError', {
  code: Schema.Literal('100111'), // TODO deprecated api
  status: Schema.Literal(400),
  reason: Schema.Literal('PreviousCodeNotExpired'),
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
  code: Schema.Literal('100106'), // TODO deprecated api
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

export class NumberDoesNotMatchOldHashError extends Schema.TaggedError<NumberDoesNotMatchOldHashError>(
  'NumberDoesNotMatchOldHashError'
)('NumberDoesNotMatchOldHashError', {
  status: Schema.optionalWith(Schema.Literal(400), {
    default: () => 400 as const,
  }),
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
  hash: HashedPhoneNumberE,
  signature: EcdsaSignature,
  challengeVerified: Schema.Literal(true),
}) {}

export const InitVerificationErrors = Schema.Union(
  UnableToSendVerificationSmsError,
  PreviousCodeNotExpiredError
)

export const VerifyCodeErrors = Schema.Union(
  UnableToGenerateChallengeError,
  VerificationNotFoundError,
  UnableToVerifySmsCodeError,
  InvalidVerificationError
)

export const VerifyChallengeErrors = Schema.Union(
  InvalidSignatureError,
  UnableToGenerateSignatureError,
  VerificationNotFoundError,
  InvalidVerificationError
)

export const InitVerificationInput = Schema.Struct({
  body: InitPhoneVerificationRequest,
})

export type InitVerificationInput = Schema.Schema.Type<
  typeof InitVerificationInput
>

export const VerifyPhoneNumberInput = Schema.Struct({
  body: VerifyPhoneNumberRequest,
})

export type VerifyPhoneNumberInput = Schema.Schema.Type<
  typeof VerifyPhoneNumberInput
>

export const VerifyChallengeInput = Schema.Struct({
  body: VerifyChallengeRequest,
})

export type VerifyChallengeInput = Schema.Schema.Type<
  typeof VerifyChallengeInput
>

export const RegenerateSessionCredentialsRequest = Schema.Struct({
  myPhoneNumber: E164PhoneNumberE,
})

export type RegenerateSessionCredentialsRequest = Schema.Schema.Type<
  typeof RegenerateSessionCredentialsRequest
>

export const RegenerateSessionCredentialsResponse = Schema.Struct({
  hash: HashedPhoneNumberE,
  signature: EcdsaSignature,
})
export type RegenerateSessionCredentialsResponse = Schema.Schema.Type<
  typeof RegenerateSessionCredentialsResponse
>
