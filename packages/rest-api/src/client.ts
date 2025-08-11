import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  type Headers,
} from '@effect/platform'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Context, Effect, Layer, Option, Schema} from 'effect'
import {Client, type Api} from 'effect-http'
import {type PlatformName} from './PlatformName'
import {type ServiceUrl} from './ServiceUrl.brand'
import {type GetUserSessionCredentials} from './UserSessionCredentials.brand'
import {
  CommonHeaders,
  makeCommonHeaders,
  type AppSource,
  type VexlAppMetaHeader,
} from './commonHeaders'
import {HEADER_HASH, HEADER_PUBLIC_KEY, HEADER_SIGNATURE} from './constants'
import {type LoggingFunction} from './utils'

function stripSensitiveHeaders(headers: Headers.Headers): Headers.Headers {
  if (!headers) return headers

  const {
    [HEADER_HASH]: h,
    [HEADER_PUBLIC_KEY]: pk,
    [HEADER_SIGNATURE]: sig,
    ...rest
  } = headers
  return {
    ...rest,
    [HEADER_HASH]: h != null ? '[stripped]' : 'undefined',
    [HEADER_PUBLIC_KEY]: pk != null ? '[stripped]' : 'undefined',
    [HEADER_SIGNATURE]: sig != null ? '[stripped]' : 'undefined',
  }
}

export interface ClientProps<A> {
  api: A
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  appSource: AppSource
  isDeveloper: boolean
  language: string
  getUserSessionCredentials?: GetUserSessionCredentials
  url: ServiceUrl
  loggingFunction?: LoggingFunction | null
  deviceModel?: string
  osVersion?: string
}

const makeClient = ({
  loggingFunction,
  vexlAppMetaHeader,
  getUserSessionCredentials,
}: {
  loggingFunction?: LoggingFunction | null
  vexlAppMetaHeader: VexlAppMetaHeader
  getUserSessionCredentials?: GetUserSessionCredentials
}): HttpClient.HttpClient =>
  FetchHttpClient.layer.pipe(
    Layer.build,
    Effect.map(Context.get(HttpClient.HttpClient)),
    Effect.map((a) =>
      a.pipe(
        HttpClient.mapRequest((request) => {
          if (loggingFunction) {
            const {headers, url, urlParams: params, method, body} = request

            loggingFunction(
              `🌐 ⬆️ Sending request: ${
                method?.toUpperCase() ?? '[unknown method]'
              } ${url ?? '[unknown url]'}`,
              {
                headers: stripSensitiveHeaders(headers),
                data: body,
                params,
                url,
              }
            )
          }

          return request.pipe(
            HttpClientRequest.setHeaders({
              ...Schema.encodeSync(CommonHeaders)(
                makeCommonHeaders(vexlAppMetaHeader)
              ),
              ...(getUserSessionCredentials && {
                [HEADER_PUBLIC_KEY]: getUserSessionCredentials().publicKey,
                [HEADER_SIGNATURE]: getUserSessionCredentials().signature,
                [HEADER_HASH]: getUserSessionCredentials().hash,
              }),
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
                      } "${request.url ?? ''}". Status: ${status}`,
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
                      } "${request.url ?? '[unknown url]'}" "params: ${request.urlParams.toString() ?? '[unknown params]'}".`,
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
                      } "${request.url ?? '[unknown url]'}" "params: ${request.urlParams.toString() ?? '[unknown params]'}".`,
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
                      } "${request.url ?? '[unknown url]'}" "params: ${request.urlParams.toString()} ?? '[unknown params]'".`,
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
    ),
    Effect.scoped,
    /// effect-http/src/internal/client.ts - inspired from defaultHttpClient
    Effect.runSync
  )

export function createClientInstanceWithAuth<A extends Api.Api.Any>({
  api,
  platform,
  clientVersion,
  clientSemver,
  isDeveloper,
  appSource,
  language,
  getUserSessionCredentials,
  url,
  loggingFunction,
  deviceModel,
  osVersion,
}: ClientProps<A>): Client.Client<A> {
  const vexlAppMetaHeader: VexlAppMetaHeader = {
    platform,
    versionCode: clientVersion,
    semver: clientSemver,
    appSource,
    language,
    isDeveloper,
    deviceModel: Option.fromNullable(deviceModel),
    osVersion: Option.fromNullable(osVersion),
  }

  return Client.make(api, {
    baseUrl: url,
    httpClient: makeClient({
      loggingFunction,
      vexlAppMetaHeader,
      getUserSessionCredentials,
    }),
  })
}
