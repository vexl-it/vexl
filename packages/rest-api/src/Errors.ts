import {type AxiosResponse} from 'axios'
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
