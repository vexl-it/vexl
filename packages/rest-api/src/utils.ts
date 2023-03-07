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

export function createAxiosInstanceWithAuth(
  getUserSessionCredentials: GetUserSessionCredentials,
  platform: PlatformName,
  axiosConfig: CreateAxiosDefaults
): AxiosInstance {
  const axiosInstance = createAxiosInstance(platform, axiosConfig)

  axiosInstance.interceptors.request.use((config) => {
    const credentials = getUserSessionCredentials()
    config.headers.set(
      HEADER_PUBLIC_KEY,
      credentials.privateKey.exportPublicKey()
    )
    config.headers.set(HEADER_SIGNATURE, credentials.signature)
    config.headers.set(HEADER_HASH, credentials.hash)
    return config
  })
  return axiosInstance
}
