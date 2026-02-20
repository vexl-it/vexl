import {Schema} from 'effect'

export default class UnexpectedCryptoError extends Schema.TaggedError<UnexpectedCryptoError>(
  'UnexpectedCryptoError'
)('UnexpectedCryptoError', {}) {}
