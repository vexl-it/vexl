import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {type CreateChallengeRequest} from '../chat/contracts'
import {
  addChallengeToRequest2,
  type RequestWithGeneratableChallenge,
} from '../utils/addChallengeToRequest2'
import {
  type CreateNewOfferInput,
  type CreatePrivatePartInput,
  type DeleteOfferInput,
  type DeletePrivatePartInput,
  type GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  type GetClubOffersForMeCreatedOrModifiedAfterRequest,
  type GetOffersByIdsInput,
  type GetOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  type GetOffersForMeModifiedOrCreatedAfterInput,
  type GetRemovedOffersInput,
  type RefreshOfferInput,
  type RemovedClubOfferIdsRequest,
  type ReportClubOfferRequest,
  type ReportOfferInput,
  type UpdateOfferInput,
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
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstanceWithAuth({
        api: OfferApiSpecification,
        platform,
        clientVersion,
        clientSemver,
        language,
        isDeveloper,
        appSource,
        getUserSessionCredentials,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
      })
    )

    const addChallenge = addChallengeToRequest2(
      client.Challenges.createChallenge
    )

    return {
      getOffersByIds: (getOffersByIdsInput: GetOffersByIdsInput) =>
        client.getOffersByIds({urlParams: getOffersByIdsInput.query}),
      getOffersForMeModifiedOrCreatedAfter: (
        getOffersForMeModifiedOrCreatedAfterInput: GetOffersForMeModifiedOrCreatedAfterInput
      ) =>
        client.getOffersForMeModifiedOrCreatedAfter({
          urlParams: getOffersForMeModifiedOrCreatedAfterInput.query,
        }),
      getOffersForMeModifiedOrCreatedAfterPaginated: (
        req: GetOffersForMeCreatedOrModifiedAfterPaginatedRequest
      ) =>
        client.getOffersForMeModifiedOrCreatedAfterPaginated({
          urlParams: req,
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
      createNewOffer: (createNewOfferInput: CreateNewOfferInput) =>
        client.createNewOffer({payload: createNewOfferInput.body}),
      refreshOffer: (refreshOfferInput: RefreshOfferInput) =>
        client.refreshOffer({payload: refreshOfferInput.body}),
      deleteOffer: (deleteOfferInput: DeleteOfferInput) =>
        client.deleteOffer({urlParams: deleteOfferInput.query}),
      updateOffer: (updateOfferInpu: UpdateOfferInput) =>
        client.updateOffer({payload: updateOfferInpu.body}),
      createPrivatePart: (createPrivatePartInput: CreatePrivatePartInput) =>
        client.createPrivatePart({payload: createPrivatePartInput.body}),
      deletePrivatePart: (deletePrivatePartInput: DeletePrivatePartInput) =>
        client.deletePrivatePart({payload: deletePrivatePartInput.body}),
      getRemovedOffers: (getRemovedOffersInput: GetRemovedOffersInput) =>
        client.getRemovedOffers({payload: getRemovedOffersInput.body}),
      getRemovedClubOffers: (
        getRemovedClubOffersInput: RequestWithGeneratableChallenge<RemovedClubOfferIdsRequest>
      ) =>
        addChallenge(getRemovedClubOffersInput).pipe(
          Effect.flatMap((body) => client.getRemovedClubOffers({payload: body}))
        ),
      reportOffer: (reportOfferInput: ReportOfferInput) =>
        client.reportOffer({payload: reportOfferInput.body}),
      reportClubOffer: (
        reportClubOfferRequest: RequestWithGeneratableChallenge<ReportClubOfferRequest>
      ) =>
        addChallenge(reportClubOfferRequest).pipe(
          Effect.flatMap((body) => client.reportClubOffer({payload: body}))
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
