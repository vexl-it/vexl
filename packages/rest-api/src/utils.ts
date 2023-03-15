import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type CreateAxiosDefaults,
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
import {
  HEADER_CRYPTO_VERSION,
  HEADER_HASH,
  HEADER_PLATFORM,
  HEADER_PUBLIC_KEY,
  HEADER_SIGNATURE,
} from './constants'
import {type GetUserSessionCredentials} from './UserSessionCredentials.brand'
import {type PlatformName} from './PlatformName'

export function axiosCallWithValidation<T extends z.ZodType>(
  axiosInstance: AxiosInstance,
  config: AxiosRequestConfig,
  responseValidation: T
): TE.TaskEither<
  UnknownError | BadStatusCodeError | UnexpectedApiResponseError,
  z.output<T>
> {
  return pipe(
    axiosCall(axiosInstance, config),
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

export function axiosCall(
  axiosInstance: AxiosInstance,
  config: AxiosRequestConfig
): TE.TaskEither<
  UnknownError | BadStatusCodeError | UnexpectedApiResponseError,
  void
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
    TE.map((x) => x.data)
  )
}

export function createAxiosInstance(
  platform: PlatformName,
  axiosConfig?: CreateAxiosDefaults
): AxiosInstance {
  return Axios.create({
    ...axiosConfig,
    headers: {
      ...axiosConfig?.headers,
      [HEADER_CRYPTO_VERSION]: '2',
      [HEADER_PLATFORM]: platform,
    },
  })
}

type LoggingFunction = (message?: any, ...optionalParams: any[]) => void

export function createAxiosInstanceWithAuthAndLogging(
  getUserSessionCredentials: GetUserSessionCredentials,
  platform: PlatformName,
  axiosConfig: CreateAxiosDefaults,
  loggingFunction: LoggingFunction | null = console.info
): AxiosInstance {
  const axiosInstance = createAxiosInstance(platform, axiosConfig)

  if (loggingFunction) {
    axiosInstance.interceptors.request.use((config) => {
      loggingFunction(
        `🌐 ⬆️ Sending request: ${
          config.method?.toUpperCase() ?? '[unknown method]'
        } "${config.baseURL ?? ''}${config.url ?? '[unknown url]'}"`,
        {headers: config.headers, data: config.data}
      )

      return config
    })
    axiosInstance.interceptors.response.use(
      (response) => {
        loggingFunction(
          `🌐 ✅  Response received: ${
            response.config.method?.toUpperCase() ?? '[unknown method]'
          } "${response.config.baseURL ?? ''}${
            response.config.url ?? '[unknown url]'
          }". Status: ${response.status}`,
          {status: response.status, data: response.data}
        )
        return response
      },
      (error) => {
        if (!isAxiosError(error)) {
          loggingFunction(
            '🌐 ‼️ Non axios when sending request or receiving response:',
            error
          )
          return
        }
        loggingFunction(
          `🌐 ‼️ Error response received ${
            error.config?.method?.toUpperCase() ?? 'unknown method'
          } "${error.config?.baseURL ?? ''}${
            error.config?.url ?? '[unknown url]'
          }".`,
          {status: error.response?.status, data: error.response?.data}
        )

        return Promise.reject(error)
      }
    )
  }

  axiosInstance.interceptors.request.use((config) => {
    const credentials = getUserSessionCredentials()
    config.headers.set(HEADER_PUBLIC_KEY, credentials.publicKey)
    config.headers.set(HEADER_SIGNATURE, credentials.signature)
    config.headers.set(HEADER_HASH, credentials.hash)
    return config
  })

  return axiosInstance
}
