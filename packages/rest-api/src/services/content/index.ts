import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option} from 'effect/index'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstance} from '../../client'
import {type AppSource, makeCommonHeaders} from '../../commonHeaders'
import {type LoggingFunction} from '../../utils'
import {
  type CreateInvoiceRequest,
  type GetInvoiceRequest,
  type GetInvoiceStatusTypeRequest,
} from './contracts'
import {ContentApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  isDeveloper,
  language,
  appSource,
  getUserSessionCredentials,
  loggingFunction,
  deviceModel,
  osVersion,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  language: string
  isDeveloper: boolean
  appSource: AppSource
  deviceModel?: string
  osVersion?: string
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstance({
        api: ContentApiSpecification,
        platform,
        clientVersion,
        clientSemver,
        language,
        appSource,
        isDeveloper,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
      })
    )

    const commonHeaders = makeCommonHeaders({
      appSource,
      versionCode: clientVersion,
      semver: clientSemver,
      platform,
      isDeveloper,
      language,
      deviceModel: Option.fromNullable(deviceModel),
      osVersion: Option.fromNullable(osVersion),
    })

    return {
      getEvents: () => client.Cms.getEvents({}),
      getBlogArticles: () => client.Cms.getBlogArticles({}),
      getNewsAndAnnoucements: () =>
        client.NewsAndAnnouncements.getNewsAndAnnouncements({
          headers: commonHeaders,
        }),
      createInvoice: (createInvoiceRequest: CreateInvoiceRequest) =>
        client.Donations.createInvoice({
          payload: createInvoiceRequest,
        }),
      getInvoice: (getInvoiceRequest: GetInvoiceRequest) =>
        client.Donations.getInvoice({
          urlParams: getInvoiceRequest,
        }),
      getInvoiceStatusType: (query: GetInvoiceStatusTypeRequest) =>
        client.Donations.getInvoiceStatusType({
          urlParams: query,
        }),
    }
  })
}

export type ContentApi = Effect.Effect.Success<ReturnType<typeof api>>
