import {Schema} from 'effect/index'
import {UnixMillisecondsE} from '../utility/UnixMilliseconds.brand'
import {HashedPhoneNumberE} from './HashedPhoneNumber.brand'

export const ShortLivedTokenForErasingUserOnContactService = Schema.String.pipe(
  Schema.brand('ShortLivedTokenForErasingUserOnContactService')
)
export type ShortLivedTokenForErasingUserOnContactService =
  typeof ShortLivedTokenForErasingUserOnContactService.Type

export const ShortLivedTokenForErasingUserOnContactServicePayload =
  Schema.parseJson(
    Schema.Struct({
      phoneNumberHash: HashedPhoneNumberE,
      expiresAt: UnixMillisecondsE,
    })
  )
export type ShortLivedTokenForErasingUserOnContactServicePayload =
  typeof ShortLivedTokenForErasingUserOnContactServicePayload.Type

export class BadShortLivedTokenForErasingUserOnContactServiceError extends Schema.TaggedError<BadShortLivedTokenForErasingUserOnContactServiceError>(
  'BadShortLivedTokenForErasingUserOnContactService'
)('BadShortLivedTokenForErasingUserOnContactService', {
  reason: Schema.Literal('CryptoError', 'Expired'),
  status: Schema.Literal(400),
}) {}
