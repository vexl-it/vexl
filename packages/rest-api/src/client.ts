import {
  HttpApiClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  type Headers,
  type HttpApi,
  type HttpApiGroup,
  type HttpApiMiddleware,
} from '@effect/platform'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option, Schema} from 'effect'
import {type Simplify} from 'effect/Types'
import {type ServiceUrl} from './ServiceUrl.brand'
import {
  CommonHeaders,
  makeCommonHeaders,
  type AppSource,
  type VexlAppMetaHeader,
} from './commonHeaders'
import {
  HEADER_ADMIN_TOKEN,
  HEADER_HASH,
  HEADER_PUBLIC_KEY,
  HEADER_SIGNATURE,
} from './constants'
import {type LoggingFunction} from './utils'

function stripSensitiveHeaders(headers: Headers.Headers): Headers.Headers {
  if (!headers) return headers

  const {
    [HEADER_ADMIN_TOKEN]: adminToken,
    [HEADER_HASH]: h,
    [HEADER_PUBLIC_KEY]: pk,
    [HEADER_SIGNATURE]: sig,
    ...rest
  } = headers
  return {
    ...rest,
    [HEADER_ADMIN_TOKEN]: adminToken != null ? '[stripped]' : 'undefined',
    [HEADER_HASH]: h != null ? '[stripped]' : 'undefined',
    [HEADER_PUBLIC_KEY]: pk != null ? '[stripped]' : 'undefined',
    [HEADER_SIGNATURE]: sig != null ? '[stripped]' : 'undefined',
  }
}

function stripSensitiveUrlParams(params: unknown): string {
  return String(params ?? '').replace(
    /([?&]?(?:adminToken|token)=)[^&]*/g,
    '$1[stripped]'
  )
}

function stripSensitiveUrl(url: string | undefined): string | undefined {
  if (url === undefined) return undefined

  return url.replace(/([?&](?:adminToken|token)=)[^&]*/g, '$1[stripped]')
}

export interface ClientProps<
  ApiId extends string,
  Groups extends HttpApiGroup.HttpApiGroup.Any,
  ApiError,
  ApiR,
> {
  api: HttpApi.HttpApi<ApiId, Groups, ApiError, ApiR>
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  appSource: AppSource
  isDeveloper: boolean
  language: string
  url: ServiceUrl
  loggingFunction?: LoggingFunction | null
  deviceModel?: string
  osVersion?: string
  prefix?: CountryPrefix
}

const makeClient =
  ({
    loggingFunction,
    vexlAppMetaHeader,
  }: {
    loggingFunction?: LoggingFunction | null
    vexlAppMetaHeader: VexlAppMetaHeader
  }) =>
  (client: HttpClient.HttpClient): HttpClient.HttpClient =>
    client.pipe(
      HttpClient.mapRequest((request) => {
        if (loggingFunction) {
          const {headers, url, urlParams: params, method, body} = request
          const strippedUrl = stripSensitiveUrl(url)

          loggingFunction(
            `🌐 ⬆️ Sending request: ${
              method?.toUpperCase() ?? '[unknown method]'
            } ${strippedUrl ?? '[unknown url]'}`,
            {
              headers: stripSensitiveHeaders(headers),
              data: body,
              params: stripSensitiveUrlParams(params),
              url: strippedUrl,
            }
          )
        }

        return request.pipe(
          HttpClientRequest.setHeaders({
            ...request.headers,
            ...Schema.encodeSync(CommonHeaders)(
              makeCommonHeaders(vexlAppMetaHeader)
            ),
          })
        )
      }),

      HttpClient.transformResponse(
        Effect.map(
          HttpClientResponse.matchStatus({
            '2xx': (response) => {
              if (loggingFunction) {
                try {
                  // HttpClientResponse contains request as HttpClientRequest in reponse JSON
                  // but the type is missing it
                  const {request, status} =
                    response as HttpClientResponse.HttpClientResponse & {
                      request: HttpClientRequest.HttpClientRequest
                    }

                  loggingFunction(
                    `🌐 ✅ Response received: ${
                      request.method?.toUpperCase() ?? '[unknown method]'
                    } "${
                      stripSensitiveUrl(request.url) ?? ''
                    }". Status: ${status}`,
                    {status}
                  )
                } catch (e) {
                  console.error('🚨 Error logging success response')
                }
              }

              return response
            },
            '3xx': (response) => {
              if (loggingFunction) {
                // HttpClientResponse contains request as HttpClientRequest in reponse JSON
                // but the type is missing it
                const {request, status} =
                  response as HttpClientResponse.HttpClientResponse & {
                    request: HttpClientRequest.HttpClientRequest
                  }

                try {
                  loggingFunction(
                    `🌐 ➡️ Redirect received: ${
                      request.method?.toUpperCase() ?? 'unknown method'
                    } "${
                      stripSensitiveUrl(request.url) ?? '[unknown url]'
                    }" "params: ${stripSensitiveUrlParams(request.urlParams)}".`,
                    {
                      status,
                    }
                  )
                } catch (e) {
                  console.error('🚨 Error logging redirect response')
                }
              }

              return response
            },
            '4xx': (response) => {
              if (loggingFunction) {
                // HttpClientResponse contains request as HttpClientRequest in reponse JSON
                // but the type is missing it
                const {request, status} =
                  response as HttpClientResponse.HttpClientResponse & {
                    request: HttpClientRequest.HttpClientRequest
                  }

                try {
                  loggingFunction(
                    `🌐 ❌ Error client response received ${
                      request.method?.toUpperCase() ?? 'unknown method'
                    } "${
                      stripSensitiveUrl(request.url) ?? '[unknown url]'
                    }" "params: ${stripSensitiveUrlParams(request.urlParams)}".`,
                    {
                      status,
                    }
                  )
                } catch (e) {
                  console.error('🚨 Error logging client error response')
                }
              }

              return response
            },
            '5xx': (response) => {
              if (loggingFunction) {
                // HttpClientResponse contains request as HttpClientRequest in reponse JSON
                // but the type is missing it
                const {request, status} =
                  response as HttpClientResponse.HttpClientResponse & {
                    request: HttpClientRequest.HttpClientRequest
                  }

                try {
                  loggingFunction(
                    `🌐 ❌ Error server response received ${
                      request.method?.toUpperCase() ?? 'unknown method'
                    } "${
                      stripSensitiveUrl(request.url) ?? '[unknown url]'
                    }" "params: ${stripSensitiveUrlParams(request.urlParams)}".`,
                    {
                      status,
                    }
                  )
                } catch (e) {
                  console.error('🚨 Error logging server error response')
                }
              }

              return response
            },
            orElse: (response) => response,
          })
        )
      )
    )

export function createClientInstance<
  ApiId extends string,
  Groups extends HttpApiGroup.HttpApiGroup.Any,
  ApiError,
  ApiR,
>({
  api,
  platform,
  clientVersion,
  clientSemver,
  isDeveloper,
  appSource,
  language,
  url,
  loggingFunction,
  deviceModel,
  osVersion,
  prefix,
}: ClientProps<ApiId, Groups, ApiError, ApiR>): Effect.Effect<
  Simplify<HttpApiClient.Client<Groups, ApiError, never>>,
  never,
  | HttpApiMiddleware.HttpApiMiddleware.Without<
      ApiR | HttpApiGroup.HttpApiGroup.ClientContext<Groups>
    >
  | HttpClient.HttpClient
> {
  const vexlAppMetaHeader: VexlAppMetaHeader = {
    platform,
    versionCode: clientVersion,
    semver: clientSemver,
    appSource,
    language,
    isDeveloper,
    deviceModel: Option.fromNullable(deviceModel),
    osVersion: Option.fromNullable(osVersion),
    prefix: Option.fromNullable(prefix),
  }

  return HttpApiClient.make(api, {
    baseUrl: url,
    transformClient: makeClient({
      loggingFunction,
      vexlAppMetaHeader,
    }),
  })
}
