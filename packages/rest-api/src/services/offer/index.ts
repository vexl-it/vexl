import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {type CreateChallengeRequest} from '../chat/contracts'
import {
  addChallengeToRequest,
  type RequestWithGeneratableChallenge,
} from '../utils/addChallengeToRequest'
import {
  CreateNewOfferErrors,
  CreatePrivatePartErrors,
  DeletePrivatePartErrors,
  ReportClubOfferEndpointErrors,
  ReportOfferEndpointErrors,
  UpdateOfferErrors,
  type CreateNewOfferInput,
  type CreatePrivatePartInput,
  type DeleteOfferInput,
  type DeletePrivatePartInput,
  type GetClubOffersByIdsRequest,
  type GetClubOffersForMeCreatedOrModifiedAfterRequest,
  type GetClubOffersForMeInput,
  type GetOffersByIdsInput,
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
  const client = createClientInstanceWithAuth({
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

  const addChallenge = addChallengeToRequest(client)

  return {
    getOffersByIds: (getOffersByIdsInput: GetOffersByIdsInput) =>
      handleCommonErrorsEffect(client.getOffersByIds(getOffersByIdsInput)),

    getClubOffersByIds: (
      getClubOffersByIdsInput: RequestWithGeneratableChallenge<GetClubOffersByIdsRequest>
    ) =>
      addChallenge(getClubOffersByIdsInput).pipe(
        Effect.flatMap((body) =>
          handleCommonErrorsEffect(client.getClubOffersByIds({body}))
        )
      ),
    getOffersForMe: () => handleCommonErrorsEffect(client.getOffersForMe({})),
    getClubOffersForMe: (getClubOffersForMeInput: GetClubOffersForMeInput) =>
      handleCommonErrorsEffect(
        client.getClubOffersForMe(getClubOffersForMeInput)
      ),
    getOffersForMeModifiedOrCreatedAfter: (
      getOffersForMeModifiedOrCreatedAfterInput: GetOffersForMeModifiedOrCreatedAfterInput
    ) =>
      handleCommonErrorsEffect(
        client.getOffersForMeModifiedOrCreatedAfter(
          getOffersForMeModifiedOrCreatedAfterInput
        )
      ),
    getClubOffersForMeModifiedOrCreatedAfter: (
      body: RequestWithGeneratableChallenge<GetClubOffersForMeCreatedOrModifiedAfterRequest>
    ) =>
      addChallenge(body).pipe(
        Effect.flatMap((body) =>
          handleCommonErrorsEffect(
            client.getClubOffersForMeModifiedOrCreatedAfter({
              body,
            })
          )
        )
      ),
    createNewOffer: (createNewOfferInput: CreateNewOfferInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.createNewOffer(createNewOfferInput),
        CreateNewOfferErrors
      ),
    refreshOffer: (refreshOfferInput: RefreshOfferInput) =>
      handleCommonErrorsEffect(client.refreshOffer(refreshOfferInput)),
    deleteOffer: (deleteOfferInput: DeleteOfferInput) =>
      handleCommonErrorsEffect(client.deleteOffer(deleteOfferInput)),
    updateOffer: (updateOfferInpu: UpdateOfferInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.updateOffer(updateOfferInpu),
        UpdateOfferErrors
      ),
    createPrivatePart: (createPrivatePartInput: CreatePrivatePartInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.createPrivatePart(createPrivatePartInput),
        CreatePrivatePartErrors
      ),
    deletePrivatePart: (deletePrivatePartInput: DeletePrivatePartInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.deletePrivatePart(deletePrivatePartInput),
        DeletePrivatePartErrors
      ),
    getRemovedOffers: (getRemovedOffersInput: GetRemovedOffersInput) =>
      handleCommonErrorsEffect(client.getRemovedOffers(getRemovedOffersInput)),
    getRemovedClubOffers: (
      getRemovedClubOffersInput: RequestWithGeneratableChallenge<RemovedClubOfferIdsRequest>
    ) =>
      addChallenge(getRemovedClubOffersInput).pipe(
        Effect.flatMap((body) =>
          handleCommonErrorsEffect(client.getRemovedClubOffers({body}))
        )
      ),
    reportOffer: (reportOfferInput: ReportOfferInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.reportOffer(reportOfferInput),
        ReportOfferEndpointErrors
      ),
    reportClubOffer: (
      reportClubOfferRequest: RequestWithGeneratableChallenge<ReportClubOfferRequest>
    ) =>
      addChallenge(reportClubOfferRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.reportClubOffer({body}),
            ReportClubOfferEndpointErrors
          )
        )
      ),
    // ----------------------
    // 👇 Challenge
    // ----------------------
    createChallenge: (createChallengeRequest: CreateChallengeRequest) =>
      handleCommonErrorsEffect(
        client.createChallenge({body: createChallengeRequest})
      ),
  }
}

export type OfferApi = ReturnType<typeof api>
