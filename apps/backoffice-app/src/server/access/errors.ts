import {Schema} from 'effect'

/** An expected auth failure, answered with `status` and `message`. */
export class AccessRequestError extends Schema.TaggedError<AccessRequestError>(
  'AccessRequestError'
)('AccessRequestError', {
  status: Schema.Literal(400, 401, 403, 404, 409),
  message: Schema.String,
}) {}

export const accessError = (
  status: AccessRequestError['status'],
  message: string
): AccessRequestError => new AccessRequestError({status, message})
