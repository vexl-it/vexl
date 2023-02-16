import {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from 'axios'
import * as TE from 'fp-ts/TaskEither'
import type z from 'zod'
import {
  type BadStatusCodeError,
  type UnexpectedApiResponseError,
  type UnknownError,
} from './Errors'
import {pipe} from 'fp-ts/function'

export function axiosCallWithValidation<T extends z.ZodType>(
  axiosInstance: AxiosInstance,
  config: AxiosRequestConfig,
  responseValidation: T
): TE.TaskEither<
  UnknownError | BadStatusCodeError | UnexpectedApiResponseError,
  z.output<T>
> {
  return pipe(
    TE.tryCatch<BadStatusCodeError | UnknownError, AxiosResponse>(
      async () => await axiosInstance.request(config),
      (error) => {
        if (isAxiosError(error)) {
          if (error.response != null) {
            return {
              _tag: 'BadStatusCodeError',
              response: error.response,
            }
          }
        }
        return {_tag: 'UnknownError', error}
      }
    ),
    TE.map((x) => x.data),
    TE.chainW((x) => {
      const valid = responseValidation.safeParse(x)
      if (valid.success) return TE.right<never, T>(valid.data)
      return TE.left<UnexpectedApiResponseError>({
        _tag: 'UnexpectedApiResponseError',
        errors: valid.error,
        data: x,
      })
    })
  )
}
