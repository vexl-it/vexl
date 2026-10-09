import {FetchHttpClient, HttpApiClient} from '@effect/platform'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {Effect, Option, Schema} from 'effect'

export const makeContentAdminClient = () =>
  HttpApiClient.make(ContentInternalApiSpecification, {
    baseUrl: '/api/proxy/content-internal',
  }).pipe(
    Effect.map((client) => client.VexlProductNotifications),
    Effect.provide(FetchHttpClient.layer)
  )

export const makeContentClient = () =>
  HttpApiClient.make(ContentApiSpecification, {
    baseUrl: '/api/proxy/content',
  }).pipe(
    Effect.map((client) => client.VexlProductNotifications),
    Effect.provide(FetchHttpClient.layer)
  )

export const makeBackofficeCommonHeaders = () =>
  makeCommonHeaders({
    appSource: Schema.decodeSync(AppSource)('backoffice'),
    versionCode: Schema.decodeSync(VersionCode)(1),
    semver: Schema.decodeSync(VersionString)('0.0.0'),
    platform: Schema.decodeSync(PlatformName)('WEB'),
    isDeveloper: true,
    language: 'en',
    deviceModel: Option.none(),
    osVersion: Option.none(),
    prefix: Option.none(),
  })
