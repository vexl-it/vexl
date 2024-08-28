import {Schema} from '@effect/schema'
import {
  ExpectedErrorHttpCode,
  ServerErrorHttpCode,
} from '@vexl-next/server-utils/src/HttpCodes'
import {type AxiosError, type AxiosResponse} from 'axios'

export interface UnexpectedApiResponseError {
  readonly _tag: 'UnexpectedApiResponseError'
  readonly data: any
  readonly errors: unknown
}

export interface BadStatusCodeError {
  readonly _tag: 'BadStatusCodeError'
  readonly response: AxiosResponse<any, any>
}

export interface UnknownError {
  readonly _tag: 'UnknownError'
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

export const CommonError = Schema.Struct({
  cause: Schema.String,
  side: Schema.Literal('client', 'server', 'unknown'),
})

export const ExpectedErrorBodyE = Schema.Struct({
  ...CommonError.fields,
  status: ExpectedErrorHttpCode,
})

export const ServerErrorBodyE = Schema.Struct({
  ...CommonError.fields,
  status: ServerErrorHttpCode,
})

export class UnauthorizedErrorE extends Schema.TaggedError<UnauthorizedErrorE>(
  'UnauthorizedErrorE'
)('UnauthorizedErrorE', ExpectedErrorBodyE) {}

export class NotFoundErrorE extends Schema.TaggedError<NotFoundErrorE>(
  'NotFoundErrorE'
)('NotFoundErrorE', ExpectedErrorBodyE) {}

export class UnexpectedApiResponseErrorE extends Schema.TaggedError<UnexpectedApiResponseErrorE>(
  'UnexpectedApiResponseErrorE'
)('UnexpectedApiResponseErrorE', ServerErrorBodyE) {}

export class UnknownErrorE extends Schema.TaggedError<UnknownErrorE>(
  'UnknownErrorE'
)('UnknownErrorE', ServerErrorBodyE) {}
