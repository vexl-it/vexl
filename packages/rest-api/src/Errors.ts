import {Schema} from '@effect/schema'
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

export class InternalServerError extends Schema.TaggedError<InternalServerError>(
  'InternalServerError'
)('InternalServerError', {
  cause: Schema.Literal('ExternalApi', 'Unknown', 'BodyError').pipe(
    Schema.optional({default: () => 'Unknown' as const})
  ),
}) {}
