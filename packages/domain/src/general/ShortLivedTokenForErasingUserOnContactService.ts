import {Schema} from 'effect/index'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {HashedPhoneNumber} from './HashedPhoneNumber.brand'

export const ShortLivedTokenForErasingUserOnContactService = Schema.String.pipe(
  Schema.brand('ShortLivedTokenForErasingUserOnContactService')
)
export type ShortLivedTokenForErasingUserOnContactService =
  typeof ShortLivedTokenForErasingUserOnContactService.Type

export const ShortLivedTokenForErasingUserOnContactServicePayload =
  Schema.parseJson(
    Schema.Struct({
      phoneNumberHash: HashedPhoneNumber,
      expiresAt: UnixMilliseconds,
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
