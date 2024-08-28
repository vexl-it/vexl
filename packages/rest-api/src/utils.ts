import {Schema} from '@effect/schema'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import Axios, {
  AxiosError,
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type CreateAxiosDefaults,
} from 'axios'
import {Effect, Option} from 'effect'
import {HttpError, type ClientError} from 'effect-http'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import type z from 'zod'
import {
  ExpectedErrorBodyE,
  NotFoundErrorE,
  ServerErrorBodyE,
  UnauthorizedErrorE,
  UnexpectedApiResponseErrorE,
  UnknownErrorE,
  type BadStatusCodeError,
  type NetworkError,
  type UnexpectedApiResponseError,
  type UnknownError,
} from './Errors'
import {type PlatformName} from './PlatformName'
import {type GetUserSessionCredentials} from './UserSessionCredentials.brand'
import {CommonHeaders} from './commonHeaders'
import {
  HEADER_CLIENT_VERSION,
  HEADER_CRYPTO_VERSION,
  HEADER_HASH,
  HEADER_PLATFORM,
  HEADER_PUBLIC_KEY,
  HEADER_SIGNATURE,
} from './constants'

const DEFAULT_TIMEOUT_MS = 60_000 // Up timeout to 1 minute

export function axiosCallWithValidation<T extends z.ZodType>(
  axiosInstance: AxiosInstance,
  config: AxiosRequestConfig,
  responseValidation: T
): TE.TaskEither<
  UnknownError | BadStatusCodeError | UnexpectedApiResponseError | NetworkError,
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

export function axiosCallWithValidationSchema<I, O>(
  axiosInstance: AxiosInstance,
  config: AxiosRequestConfig,
  responseValidation: Schema.Schema<I, O>
): TE.TaskEither<
  UnknownError | BadStatusCodeError | UnexpectedApiResponseError | NetworkError,
  I
> {
  return pipe(
    axiosCall(axiosInstance, config),
    TE.chainW((x) => {
      const valid = Schema.decodeUnknownEither(responseValidation)(x)
      if (valid._tag === 'Right') return TE.right<never, I>(valid.right)
      return TE.left<UnexpectedApiResponseError>({
        _tag: 'UnexpectedApiResponseError',
        errors: valid.left,
        data: x,
      })
    })
  )
}

function stripSensitiveHeaders(headers: any): unknown {
  if (!headers) return headers

  const {
    [HEADER_HASH]: h,
    [HEADER_PUBLIC_KEY]: pk,
    [HEADER_SIGNATURE]: sig,
    ...rest
  } = headers
  return {
    ...rest,
    [HEADER_HASH]: h != null ? '[stripped]' : undefined,
    [HEADER_PUBLIC_KEY]: pk != null ? '[stripped]' : undefined,
    [HEADER_SIGNATURE]: sig != null ? '[stripped]' : undefined,
  }
}

function stripSensitiveHeadersFromRequest(request?: any): unknown {
  if (!request?.headers) return request

  const headers = stripSensitiveHeaders(request.headers)

  return {
    ...request,
    headers,
  }
}

function stripSensitiveHeadersFromResponse(response?: any): unknown {
  if (!response?.request) return response

  return {
    ...response,
    request: stripSensitiveHeadersFromRequest(response.request),
  }
}

function stripSensitiveHeadersFromError(error?: AxiosError): unknown {
  if (!error) return error
  return {
    ...error,
    request: stripSensitiveHeadersFromRequest(error?.request),
    response: stripSensitiveHeadersFromResponse(error?.response),
  }
}

export function axiosCall(
  axiosInstance: AxiosInstance,
  config: AxiosRequestConfig
): TE.TaskEither<
  UnknownError | BadStatusCodeError | UnexpectedApiResponseError | NetworkError,
  unknown
> {
  return pipe(
    TE.tryCatch(
      async () => await axiosInstance.request(config),
      (error) => {
        if (isAxiosError(error)) {
          if (error.response != null) {
            return {
              _tag: 'BadStatusCodeError',
              response: stripSensitiveHeadersFromResponse(error.response),
            } as BadStatusCodeError
          }
          if (
            [
              AxiosError.ERR_NETWORK,
              AxiosError.ERR_CANCELED,
              AxiosError.ETIMEDOUT,
              AxiosError.ECONNABORTED,
            ].includes(error.code ?? '')
          ) {
            return {
              _tag: 'NetworkError',
              code: error.code,
              error: stripSensitiveHeadersFromError(error),
            } as NetworkError
          }
        }
        return {
          _tag: 'UnknownError',
          error,
        } as UnknownError
      }
    ),
    TE.map((x) => x.data)
  )
}

export type LoggingFunction = (message?: any, ...optionalParams: any[]) => void

function addLoggingInterceptor(
  axiosInstance: AxiosInstance,
  loggingFunction: LoggingFunction
): void {
  axiosInstance.interceptors.request.use((config) => {
    loggingFunction(
      `🌐 ⬆️ Sending request: ${
        config.method?.toUpperCase() ?? '[unknown method]'
      } ${config.baseURL ?? 'none'}${config.url ?? '[unknown url]'}`,
      {
        headers: stripSensitiveHeaders(config.headers),
        data: config.data,
        params: config.params,
        baseURL: config.baseURL,
        url: config.url,
      }
    )

    return config
  })
  axiosInstance.interceptors.response.use(
    (response) => {
      loggingFunction(
        `🌐 ✅  Response received: ${
          response.config.method?.toUpperCase() ?? '[unknown method]'
        } "${response.request.url ?? ''}". Status: ${response.status}`,
        {status: response.status, data: response.data}
      )
      return response
    },
    async (error) => {
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

      return await Promise.reject(error)
    }
  )
}

const encodeCommonHeaders = Schema.encodeSync(CommonHeaders)

export function createAxiosInstance(
  platform: PlatformName,
  clientVersion: VersionCode,
  clientSemver: SemverString,
  axiosConfig?: CreateAxiosDefaults,
  loggingFunction: LoggingFunction | null = console.info
): AxiosInstance {
  const commonHeaders = new CommonHeaders({
    'user-agent': {
      _tag: 'VexlAppUserAgentHeader' as const,
      platform,
      versionCode: clientVersion,
      semver: Option.some(clientSemver),
    },
    [HEADER_PLATFORM]: Option.some(platform),
    [HEADER_CLIENT_VERSION]: Option.some(clientVersion),
    [HEADER_CRYPTO_VERSION]: Option.some(2),
  })

  const axios = Axios.create({
    timeout: DEFAULT_TIMEOUT_MS,
    ...axiosConfig,
    headers: {
      ...axiosConfig?.headers,
      ...encodeCommonHeaders(commonHeaders),
    },
  })
  if (loggingFunction) addLoggingInterceptor(axios, loggingFunction)
  return axios
}

export function createAxiosInstanceWithAuthAndLogging(
  getUserSessionCredentials: GetUserSessionCredentials,
  platform: PlatformName,
  clientVersion: VersionCode,
  clientSemver: SemverString,
  axiosConfig: CreateAxiosDefaults,
  loggingFunction: LoggingFunction | null = console.info
): AxiosInstance {
  const axiosInstance = createAxiosInstance(
    platform,
    clientVersion,
    clientSemver,
    axiosConfig,
    loggingFunction
  )

  axiosInstance.interceptors.request.use((config) => {
    const credentials = getUserSessionCredentials()
    config.headers.set(HEADER_PUBLIC_KEY, credentials.publicKey)
    config.headers.set(HEADER_SIGNATURE, credentials.signature)
    config.headers.set(HEADER_HASH, credentials.hash)
    return config
  })

  return axiosInstance
}

export type ExtractLeftTE<T extends TE.TaskEither<any, any>> =
  T extends TE.TaskEither<infer L, unknown> ? L : never

export const handleCommonErrorsEffect = <R, B, R2, C = never>(
  effect: Effect.Effect<R, ClientError.ClientError<number>, C>,
  expectedErrors: Schema.Schema<B, any, R2>
): Effect.Effect<
  R,
  | NotFoundErrorE
  | UnknownErrorE
  | UnexpectedApiResponseErrorE
  | UnauthorizedErrorE
  | Schema.Schema.Type<Schema.Schema<B, any, R2>>,
  C | R2
> =>
  effect.pipe(
    Effect.catchAllDefect((e) => {
      return Effect.fail(
        new UnknownErrorE({
          side: 'unknown',
          cause: 'Critical error on endpoint',
          status: 500,
        })
      )
    }),
    Effect.catchAll((e) =>
      Effect.gen(function* (_) {
        if (HttpError.isHttpError(e)) {
          const {status, message, side, error} = e

          if (expectedErrors) {
            const decodedError = yield* _(
              Schema.decodeUnknown(expectedErrors)(error)
            )
            return yield* _(Effect.fail(decodedError))
          }

          const errorBody = yield* _(
            Schema.decodeUnknown(ExpectedErrorBodyE)({
              side,
              cause: message,
              status,
            })
          )

          if (status === 401) {
            return yield* _(Effect.fail(new UnauthorizedErrorE(errorBody)))
          }

          if (status === 404) {
            return yield* _(Effect.fail(new NotFoundErrorE(errorBody)))
          }
        }

        const serverErrorBody = yield* _(
          Schema.decodeUnknown(ServerErrorBodyE)({
            side: e.side,
            cause: e.message,
            status: 500,
          })
        )

        return yield* _(Effect.fail(new UnknownErrorE(serverErrorBody)))
      }).pipe(
        Effect.catchTag('ParseError', () =>
          Effect.fail(
            new UnexpectedApiResponseErrorE({
              cause: 'UnexpectedApiResponse',
              side: 'server',
              status: 500,
            })
          )
        )
      )
    )
  )
