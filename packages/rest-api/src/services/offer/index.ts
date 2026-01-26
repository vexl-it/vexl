import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option} from 'effect'
import {makeCommonAndSecurityHeaders} from '../../apiSecurity'
import {createClientInstance} from '../../client'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {type CreateChallengeRequest} from '../chat/contracts'
import {
  addChallengeToRequest2,
  type RequestWithGeneratableChallenge,
} from '../utils/addChallengeToRequest2'
import {
  type CreateNewOfferRequest,
  type CreatePrivatePartRequest,
  type DeleteOfferRequest,
  type DeletePrivatePartRequest,
  type GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  type GetClubOffersForMeCreatedOrModifiedAfterRequest,
  type GetOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  type GetOffersForMeCreatedOrModifiedAfterRequest,
  type RefreshOfferRequest,
  type RemovedClubOfferIdsRequest,
  type RemovedOfferIdsRequest,
  type ReportClubOfferRequest,
  type ReportOfferRequest,
  type UpdateOfferRequest,
} from './contracts'
import {OfferApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  language,
  appSource,
  isDeveloper,
  getUserSessionCredentials,
  loggingFunction,
  deviceModel,
  osVersion,
  prefix,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  language: string
  isDeveloper: boolean
  appSource: AppSource
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
  deviceModel?: string
  osVersion?: string
  prefix?: CountryPrefix
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstance({
        api: OfferApiSpecification,
        platform,
        clientVersion,
        clientSemver,
        language,
        isDeveloper,
        appSource,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
        prefix,
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
      prefix: Option.fromNullable(prefix),
    })

    const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
      getUserSessionCredentials,
      commonHeaders
    )

    const addChallenge = addChallengeToRequest2(
      client.Challenges.createChallenge
    )

    return {
      getOffersForMeModifiedOrCreatedAfter: (
        req: GetOffersForMeCreatedOrModifiedAfterRequest
      ) =>
        client.getOffersForMeModifiedOrCreatedAfter({
          urlParams: req,
          headers: commonAndSecurityHeaders,
        }),
      getOffersForMeModifiedOrCreatedAfterPaginated: (
        req: GetOffersForMeCreatedOrModifiedAfterPaginatedRequest
      ) =>
        client.getOffersForMeModifiedOrCreatedAfterPaginated({
          urlParams: req,
          headers: commonAndSecurityHeaders,
        }),
      getClubOffersForMeModifiedOrCreatedAfter: (
        body: RequestWithGeneratableChallenge<GetClubOffersForMeCreatedOrModifiedAfterRequest>
      ) =>
        addChallenge(body).pipe(
          Effect.flatMap((body) =>
            client.getClubOffersForMeModifiedOrCreatedAfter({
              payload: body,
            })
          )
        ),
      getClubOffersForMeModifiedOrCreatedAfterPaginated: (
        body: RequestWithGeneratableChallenge<GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest>
      ) =>
        addChallenge(body).pipe(
          Effect.flatMap((body) =>
            client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
              payload: body,
            })
          )
        ),
      createNewOffer: (body: CreateNewOfferRequest) =>
        client.createNewOffer({
          payload: body,
          headers: commonAndSecurityHeaders,
        }),
      refreshOffer: (body: RefreshOfferRequest) =>
        client.refreshOffer({payload: body}),
      deleteOffer: (req: DeleteOfferRequest) =>
        client.deleteOffer({urlParams: req}),
      updateOffer: (body: UpdateOfferRequest) =>
        client.updateOffer({payload: body, headers: commonAndSecurityHeaders}),
      createPrivatePart: (body: CreatePrivatePartRequest) =>
        client.createPrivatePart({payload: body}),
      deletePrivatePart: (req: DeletePrivatePartRequest) =>
        client.deletePrivatePart({
          payload: req,
          headers: commonAndSecurityHeaders,
        }),
      getRemovedOffers: (body: RemovedOfferIdsRequest) =>
        client.getRemovedOffers({
          payload: body,
          headers: commonAndSecurityHeaders,
        }),
      getRemovedClubOffers: (
        body: RequestWithGeneratableChallenge<RemovedClubOfferIdsRequest>
      ) =>
        addChallenge(body).pipe(
          Effect.flatMap((body) => client.getRemovedClubOffers({payload: body}))
        ),
      reportOffer: (body: ReportOfferRequest) =>
        client.reportOffer({payload: body, headers: commonAndSecurityHeaders}),
      reportClubOffer: (
        body: RequestWithGeneratableChallenge<ReportClubOfferRequest>
      ) =>
        addChallenge(body).pipe(
          Effect.flatMap((body) =>
            client.reportClubOffer({
              payload: body,
              headers: commonAndSecurityHeaders,
            })
          )
        ),
      // ----------------------
      // 👇 Challenge
      // ----------------------
      createChallenge: (createChallengeRequest: CreateChallengeRequest) =>
        client.Challenges.createChallenge({payload: createChallengeRequest}),
    }
  })
}

export type OfferApi = Effect.Effect.Success<ReturnType<typeof api>>
