import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Option} from 'effect/index'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource, makeCommonHeaders} from '../../commonHeaders'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {
  CreateInvoiceError,
  type CreateInvoiceRequest,
  GetInvoiceErrors,
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
  const client = createClientInstanceWithAuth({
    api: ContentApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    language,
    appSource,
    isDeveloper,
    getUserSessionCredentials,
    url,
    loggingFunction,
    deviceModel,
    osVersion,
  })

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
    getEvents: () => handleCommonErrorsEffect(client.getEvents({})),
    getBlogArticles: () => handleCommonErrorsEffect(client.getBlogArticles({})),
    getNewsAndAnnoucements: () =>
      handleCommonErrorsEffect(
        client.getNewsAndAnnouncements({
          headers: commonHeaders,
        })
      ),
    createInvoice: (createInvoiceRequest: CreateInvoiceRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.createInvoice({
          body: createInvoiceRequest,
        }),
        CreateInvoiceError
      ),
    getInvoice: (getInvoiceRequest: GetInvoiceRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.getInvoice({
          query: getInvoiceRequest,
        }),
        GetInvoiceErrors
      ),
    getInvoiceStatusType: (query: GetInvoiceStatusTypeRequest) =>
      handleCommonErrorsEffect(
        client.getInvoiceStatusType({
          query,
        })
      ),
  }
}

export type ContentApi = ReturnType<typeof api>
