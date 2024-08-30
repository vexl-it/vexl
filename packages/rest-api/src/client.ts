import {HttpClient, HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Option} from 'effect'
import {type Api, Client} from 'effect-http'
import {CommonHeaders} from './commonHeaders'
import {
  HEADER_CLIENT_VERSION,
  HEADER_CRYPTO_VERSION,
  HEADER_HASH,
  HEADER_PLATFORM,
  HEADER_PUBLIC_KEY,
  HEADER_SIGNATURE,
} from './constants'
import {type PlatformName} from './PlatformName'
import {type ServiceUrl} from './ServiceUrl.brand'
import {type GetUserSessionCredentials} from './UserSessionCredentials.brand'

// const DEFAULT_TIMEOUT_MS = 60_000 // Up timeout to 1 minute

const encodeCommonHeaders = Schema.encodeSync(CommonHeaders)

// TODO:
// - set logging on the client
// - set timeout on the client

export interface ClientProps<A> {
  api: A
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  getUserSessionCredentials?: GetUserSessionCredentials
  url: ServiceUrl
}

export function createClientInstanceWithAuth<A extends Api.Api.Any>({
  api,
  platform,
  clientVersion,
  clientSemver,
  getUserSessionCredentials,
  url,
}: ClientProps<A>): Client.Client<A> {
  const credentials = getUserSessionCredentials
    ? getUserSessionCredentials()
    : undefined

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

  return Client.make(api, {
    baseUrl: url,
    httpClient: HttpClient.fetch.pipe(
      HttpClient.mapRequest(
        HttpClientRequest.setHeaders({
          ...encodeCommonHeaders(commonHeaders),
          ...(credentials && {
            [HEADER_PUBLIC_KEY]: credentials.publicKey,
            [HEADER_SIGNATURE]: credentials.signature,
            [HEADER_HASH]: credentials.hash,
          }),
        })
      )
    ),
  })
}
