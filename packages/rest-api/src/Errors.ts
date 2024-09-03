import {Schema} from '@effect/schema'
import {
  ExpectedErrorHttpCode,
  ServerErrorHttpCode,
} from '@vexl-next/server-utils/src/HttpCodes'
import {type AxiosError, type AxiosResponse} from 'axios'

export interface UnexpectedApiResponseErrorAxios {
  readonly _tag: 'UnexpectedApiResponseErrorAxios'
  readonly data: any
  readonly errors: unknown
}

export interface BadStatusCodeError {
  readonly _tag: 'BadStatusCodeError'
  readonly response: AxiosResponse<any, any>
}

export interface UnknownErrorAxios {
  readonly _tag: 'UnknownErrorAxios'
  readonly error: unknown
}

export interface NetworkError {
  readonly _tag: 'NetworkError'
  readonly code:
    | typeof AxiosError.ERR_NETWORK
    | typeof AxiosError.ERR_CANCELED
    | typeof AxiosError.ETIMEDOUT
    | typeof AxiosError.ECONNABORTED
  readonly error: AxiosError
}

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
