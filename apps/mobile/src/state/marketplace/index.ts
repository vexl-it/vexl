import {
  type IntendedConnectionLevel,
  type OfferAdminId,
  type OfferId,
  type OfferPublicPart,
  type OneOfferInState,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {atom, useAtomValue} from 'jotai'
import * as Option from 'fp-ts/Option'
import {privateApiAtom} from '../../api'
import {pipe} from 'fp-ts/function'
import {sessionDataOrDummyAtom} from '../session'
import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import reportError from '../../utils/reportError'
import createNewOfferForMyContacts, {
  type ApiErrorWhileCreatingOffer,
} from '@vexl-next/resources-utils/src/offers/createOfferHandleContacts'
import {type ApiErrorFetchingContactsForOffer} from '@vexl-next/resources-utils/src/offers/utils/fetchContactsForOffer'
import {type ErrorGeneratingSymmetricKey} from '@vexl-next/resources-utils/src/offers/utils/generateSymmetricKey'
import {type ErrorEncryptingPublicPart} from '@vexl-next/resources-utils/src/offers/utils/encryptOfferPublicPayload'
import updateOffer, {
  type ApiErrorUpdatingOffer,
} from '@vexl-next/resources-utils/src/offers/updateOffer'
import {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import {useMemo} from 'react'
import deduplicate from '../../utils/deduplicate'
import notEmpty from '../../utils/notEmpty'
import {type ChatOrigin} from '@vexl-next/domain/src/general/messaging'
import offerToConnectionsAtom, {
  upsertOfferToConnectionsActionAtom,
} from '../connections/atom/offerToConnectionsAtom'
import getNewOffersAndDecrypt, {
  type ApiErrorFetchingOffers,
} from '@vexl-next/resources-utils/src/offers/getNewOffersAndDecrypt'
import {type ErrorConstructingPrivatePayloads} from '@vexl-next/resources-utils/src/offers/utils/constructPrivatePayloads'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import {type ExtractLeftTE} from '@vexl-next/rest-api/src/services/chat/utils'
import {type OfferPrivateApi} from '@vexl-next/rest-api/src/services/offer'
import getCountryPrefix from '../../utils/getCountryCode'
import {
  lastUpdatedAtAtom,
  offerForChatOriginAtom,
  offersAtom,
  offersIdsAtom,
  offersStateAtom,
  singleOfferAtom,
} from './atoms/offersState'
import {loadingStateAtom} from './atoms/loadingState'

export const triggerOffersRefreshAtom = atom(null, async (get, set) => {
  const api = get(privateApiAtom)
  const session = get(sessionDataOrDummyAtom)

  const updateStartedAt = isoNow()
  const offerIds = get(offersIdsAtom)

  console.log('🦋 Refreshing offers')

  await pipe(
    getNewOffersAndDecrypt({
      offersApi: api.offer,
      modifiedAt: get(lastUpdatedAtAtom),
      keyPair: session.privateKey,
    }),
    TE.bindTo('newOffers'),
    TE.bindW('removedOffers', () =>
      pipe(
        offerIds.length > 0
          ? api.offer.getRemovedOffers({offerIds})
          : TE.right({offerIds: [] as OfferId[]}),
        TE.matchW(
          (error) => {
            if (error._tag !== 'NetworkError')
              reportError('error', 'Error fetching removed offers', error)
            return [] as OfferId[]
          },
          (result) => result.offerIds
        ),
        TE.fromTask
      )
    ),
    TE.matchW(
      (error) => {
        if (error._tag !== 'NetworkError')
          reportError('error', 'Error fetching offers', error)
        set(loadingStateAtom, {state: 'error', error})
      },
      ({newOffers: decryptingResults, removedOffers}) => {
        pipe(
          decryptingResults,
          A.filter(E.isLeft),
          A.map((one) => one.left),
          A.match(
            () => {
              // Is ok, all offers decrypted ok
            },
            (error) => {
              const criticalErrors = error.filter(
                (one) => one._tag !== 'NonCompatibleOfferVersionError'
              )
              if (criticalErrors.length > 0)
                reportError('error', 'Error while decrypting offers', error)

              const nonCompatibleErrors = error.filter(
                (one) => one._tag === 'NonCompatibleOfferVersionError'
              )
              if (nonCompatibleErrors.length > 0) {
                console.info(
                  `Skipping ${nonCompatibleErrors.length} offers because they are not compatible.`
                )
              }
            }
          )
        )

        const fetchedOffers = pipe(
          decryptingResults,
          A.filter(E.isRight),
          A.map((one) => one.right)
        )

        const allOffersIds = deduplicate([
          ...get(offersIdsAtom),
          ...fetchedOffers.map((one) => one.offerId),
        ])
        const oldOffers = get(offersAtom)

        pipe(
          allOffersIds,
          A.map((offerId): OneOfferInState | null => {
            const fetchedOffer = fetchedOffers.find(
              (fetchedOffer) => offerId === fetchedOffer.offerId
            )
            const oldOffer = oldOffers.find(
              (one) => one.offerInfo.offerId === offerId
            )

            if (oldOffer && fetchedOffer) {
              return {
                ...oldOffer,
                offerInfo: fetchedOffer,
              }
            }
            if (oldOffer) {
              return oldOffer
            }
            if (fetchedOffer) {
              return {
                offerInfo: fetchedOffer,
                flags: {
                  reported: false,
                },
              }
            }
            return null
          }),
          A.filter(notEmpty),
          A.filter(
            (one) =>
              // Do NOT remove offers that are owned by current user.
              // They can be reuploaded once #106 is implemented.
              !!one.ownershipInfo ||
              !removedOffers.includes(one.offerInfo.offerId)
          ),
          (offers) => ({offers, lastUpdatedAt: updateStartedAt}),
          (value) => {
            set(offersStateAtom, value)
          }
        )
      }
    )
  )()
})

export function useAreOffersLoading(): boolean {
  const offerState = useAtomValue(loadingStateAtom)

  return offerState.state === 'inProgress'
}

export function useOffersLoadingError(): Option.Option<ApiErrorFetchingOffers> {
  const offerState = useAtomValue(loadingStateAtom)

  return offerState.state === 'error'
    ? Option.some(offerState.error)
    : Option.none
}

export function useSingleOffer(
  offerId: OfferId | undefined
): Option.Option<OneOfferInState> {
  const foundOffer = useAtomValue(
    useMemo(() => singleOfferAtom(offerId), [offerId])
  )
  return Option.fromNullable(foundOffer)
}

export const createOfferAtom = atom<
  null,
  [
    {
      payloadPublic: OfferPublicPart
      intendedConnectionLevel: IntendedConnectionLevel
      onProgress?: (status: OfferEncryptionProgress) => void
    },
  ],
  TE.TaskEither<
    | ApiErrorFetchingContactsForOffer
    | ErrorConstructingPrivatePayloads
    | ApiErrorWhileCreatingOffer
    | ErrorGeneratingSymmetricKey
    | ErrorEncryptingPublicPart
    | NonCompatibleOfferVersionError
    | ErrorDecryptingOffer,
    OneOfferInState
  >
>(null, (get, set, params) => {
  const api = get(privateApiAtom)
  const session = get(sessionDataOrDummyAtom)
  const {payloadPublic, intendedConnectionLevel, onProgress} = params
  return pipe(
    createNewOfferForMyContacts({
      offerApi: api.offer,
      publicPart: payloadPublic,
      countryPrefix: getCountryPrefix(session.phoneNumber),
      contactApi: api.contact,
      intendedConnectionLevel,
      ownerKeyPair: session.privateKey,
      onProgress,
    }),
    TE.map((r) => {
      if (r.encryptionErrors.length > 0) {
        reportError('error', 'Error while encrypting offer', r.encryptionErrors)
      }

      const createdOffer: OneOfferInState = {
        ownershipInfo: {
          adminId: r.adminId,
          intendedConnectionLevel,
        },
        flags: {
          reported: false,
        },
        offerInfo: r.offerInfo,
      }
      set(offersAtom, (oldState) => [...oldState, createdOffer])
      set(upsertOfferToConnectionsActionAtom, {
        connections: {
          firstLevel: r.encryptedFor.firstDegreeConnections,
          secondLevel:
            intendedConnectionLevel === 'ALL'
              ? r.encryptedFor.secondDegreeConnections
              : undefined,
        },
        adminId: r.adminId,
        symmetricKey: r.symmetricKey,
      })
      return createdOffer
    })
  )
})

export const updateOfferAtom = atom<
  null,
  [
    {
      payloadPublic: OfferPublicPart
      symmetricKey: SymmetricKey
      adminId: OfferAdminId
      intendedConnectionLevel: IntendedConnectionLevel
    },
  ],
  TE.TaskEither<
    | ApiErrorUpdatingOffer
    | ErrorEncryptingPublicPart
    | ErrorDecryptingOffer
    | NonCompatibleOfferVersionError,
    OneOfferInState
  >
>(null, (get, set, params) => {
  const api = get(privateApiAtom)
  const session = get(sessionDataOrDummyAtom)
  const {payloadPublic, symmetricKey, adminId, intendedConnectionLevel} = params

  return pipe(
    updateOffer({
      offerApi: api.offer,
      adminId,
      publicPayload: payloadPublic,
      symmetricKey,
      ownerKeypair: session.privateKey,
    }),
    TE.map((r) => {
      const createdOffer: OneOfferInState = {
        flags: {
          reported: false,
        },
        ownershipInfo: {
          adminId,
          intendedConnectionLevel,
        },
        offerInfo: r,
      }
      set(offersAtom, (oldState) => [
        ...oldState.filter(
          (offer) => offer.offerInfo.offerId !== createdOffer.offerInfo.offerId
        ),
        createdOffer,
      ])
      return createdOffer
    })
  )
})

export const deleteOffersActionAtom = atom<
  null,
  [{adminIds: OfferAdminId[]}],
  TE.TaskEither<
    ExtractLeftTE<ReturnType<OfferPrivateApi['deleteOffer']>>,
    {success: true}
  >
>(null, (get, set, params) => {
  const {adminIds: adminIdsToDelete} = params
  const api = get(privateApiAtom)
  const offers = get(offersAtom)

  return pipe(
    TE.Do,
    TE.chainFirstW(() => api.offer.deleteOffer({adminIds: adminIdsToDelete})),
    TE.match(
      (left) => {
        reportError('error', 'Error while deleting offers', left)
        return E.left(left)
      },
      () => {
        // Delete offer to connections
        set(offerToConnectionsAtom, (prev) => ({
          offerToConnections: prev.offerToConnections.filter(
            (one) => !adminIdsToDelete.includes(one.adminId)
          ),
        }))

        // Delete offers
        set(
          offersAtom,
          offers.filter(
            (o) =>
              !o.ownershipInfo?.adminId ||
              !adminIdsToDelete.includes(o.ownershipInfo?.adminId)
          )
        )
        return E.right({success: true} as const)
      }
    )
  )
})

export function useOfferForChatOrigin(
  chatOrigin: ChatOrigin
): OneOfferInState | undefined {
  return useAtomValue(
    useMemo(() => offerForChatOriginAtom(chatOrigin), [chatOrigin])
  )
}
