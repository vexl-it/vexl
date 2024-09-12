import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {
  CreateNewOfferErrors,
  type CreateNewOfferInput,
  CreatePrivatePartErrors,
  type CreatePrivatePartInput,
  type DeleteOfferInput,
  DeletePrivatePartErrors,
  type DeletePrivatePartInput,
  type GetOffersByIdsInput,
  type GetOffersForMeModifiedOrCreatedAfterInput,
  type GetRemovedOffersInput,
  type RefreshOfferInput,
  ReportOfferEndpointErrors,
  type ReportOfferInput,
  UpdateOfferErrors,
  type UpdateOfferInput,
} from './contracts'
import {OfferApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  getUserSessionCredentials,
  signal,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  signal?: AbortSignal
  loggingFunction?: LoggingFunction | null
}) {
  const client = createClientInstanceWithAuth({
    api: OfferApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url,
    signal,
    loggingFunction,
  })

  return {
    getOffersByIds: (getOffersByIdsInput: GetOffersByIdsInput) =>
      handleCommonErrorsEffect(client.getOffersByIds(getOffersByIdsInput)),
    getOffersForMe: () => handleCommonErrorsEffect(client.getOffersForMe({})),
    getOffersForMeModifiedOrCreatedAfter: (
      getOffersForMeModifiedOrCreatedAfterInput: GetOffersForMeModifiedOrCreatedAfterInput
    ) =>
      handleCommonErrorsEffect(
        client.getOffersForMeModifiedOrCreatedAfter(
          getOffersForMeModifiedOrCreatedAfterInput
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
    reportOffer: (reportOfferInput: ReportOfferInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.reportOffer(reportOfferInput),
        ReportOfferEndpointErrors
      ),
  }
}

export type OfferApi = ReturnType<typeof api>
