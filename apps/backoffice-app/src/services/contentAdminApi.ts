import {FetchHttpClient, HttpApiClient} from '@effect/platform'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  AppSource,
  makeCommonHeaders,
} from '@vexl-next/rest-api/src/commonHeaders'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {Effect, Option, Schema} from 'effect'

export const makeContentAdminClient = (baseUrl = '/api/proxy') =>
  HttpApiClient.make(ContentApiSpecification, {
    baseUrl,
  }).pipe(
    Effect.map((client) => client.VexlProductNotifications),
    Effect.provide(FetchHttpClient.layer)
  )

export const makeBackofficeCommonHeaders = () =>
  makeCommonHeaders({
    appSource: Schema.decodeSync(AppSource)('backoffice'),
    versionCode: Schema.decodeSync(VersionCode)(1),
    semver: Schema.decodeSync(SemverString)('0.0.0'),
    platform: Schema.decodeSync(PlatformName)('WEB'),
    isDeveloper: true,
    language: 'en',
    deviceModel: Option.none(),
    osVersion: Option.none(),
    prefix: Option.none(),
  })
