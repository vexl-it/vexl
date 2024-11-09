import {
  ExpectedErrorHttpCode,
  ServerErrorHttpCode,
} from '@vexl-next/server-utils/src/HttpCodes'
import {Schema} from 'effect'

export class NetworkError extends Schema.TaggedError<NetworkError>(
  'NetworkError'
)('NetworkError', {
  cause: Schema.Unknown,
  message: Schema.optionalWith(Schema.String, {
    default: () => 'Network error',
  }),
}) {}

export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>(
  'UnauthorizedError'
)('UnauthorizedError', {
  cause: Schema.Unknown,
  status: ExpectedErrorHttpCode,
  message: Schema.optionalWith(Schema.String, {
    default: () => 'Unauthorized error',
  }),
}) {}

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {
  cause: Schema.Unknown,
  status: ExpectedErrorHttpCode,
  message: Schema.optionalWith(Schema.String, {
    default: () => 'Not found error',
  }),
}) {}

export class UnexpectedApiResponseError extends Schema.TaggedError<UnexpectedApiResponseError>(
  'UnexpectedApiResponseError'
)('UnexpectedApiResponseError', {
  cause: Schema.Unknown,
  status: ServerErrorHttpCode,
  message: Schema.optionalWith(Schema.String, {
    default: () => 'Unexpected api response error',
  }),
}) {}

export class UnknownClientError extends Schema.TaggedError<UnknownClientError>(
  'UnknownClientError'
)('UnknownClientError', {
  cause: Schema.Unknown,
  message: Schema.optionalWith(Schema.String, {
    default: () => 'Unknown client error',
  }),
}) {}

export class UnknownServerError extends Schema.TaggedError<UnknownServerError>(
  'UnknownServerError'
)('UnknownServerError', {
  cause: Schema.Unknown,
  message: Schema.optionalWith(Schema.String, {
    default: () => 'Unknown server error',
  }),
}) {}
