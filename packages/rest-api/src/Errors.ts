import {type AxiosError, type AxiosResponse} from 'axios'
import {type ZodError} from 'zod'

export interface UnexpectedApiResponseError {
  readonly _tag: 'UnexpectedApiResponseError'
  readonly data: any
  readonly errors: ZodError
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
