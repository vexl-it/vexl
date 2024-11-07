import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ChatOrigin} from '@vexl-next/domain/src/general/messaging'
import {
  type IntendedConnectionLevel,
  type MyOfferInState,
  type OfferAdminId,
  type OfferId,
  type OfferPublicPart,
  type OneOfferInState,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {isoNow} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import createNewOfferForMyContacts, {
  type ApiErrorWhileCreatingOffer,
} from '@vexl-next/resources-utils/src/offers/createOfferHandleContacts'
import {
  type ErrorDecryptingOffer,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import extractOwnerInfoFromOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/extractOwnerInfoFromOwnerPrivatePayload'
import getNewOffersAndDecrypt, {
  type ApiErrorFetchingOffers,
} from '@vexl-next/resources-utils/src/offers/getNewOffersAndDecrypt'
import updateOffer, {
  type ApiErrorUpdatingOffer,
} from '@vexl-next/resources-utils/src/offers/updateOffer'
import updateOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/updateOwnerPrivatePayload'
import {type ErrorConstructingPrivatePayloads} from '@vexl-next/resources-utils/src/offers/utils/constructPrivatePayloads'
import {type ErrorEncryptingPublicPart} from '@vexl-next/resources-utils/src/offers/utils/encryptOfferPublicPayload'
import {type PrivatePartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptPrivatePart'
import {type ApiErrorFetchingContactsForOffer} from '@vexl-next/resources-utils/src/offers/utils/fetchContactsForOffer'
import {type ErrorGeneratingSymmetricKey} from '@vexl-next/resources-utils/src/offers/utils/generateSymmetricKey'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, type Effect, Either, pipe as effectPipe} from 'effect'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as Option from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {apiAtom} from '../../api'
import getCountryPrefix from '../../utils/getCountryCode'
import notEmpty from '../../utils/notEmpty'
import {getNotificationToken} from '../../utils/notifications'
import reportError from '../../utils/reportError'
import messagingStateAtom from '../chat/atoms/messagingStateAtom'
import offerToConnectionsAtom, {
  upsertOfferToConnectionsActionAtom,
} from '../connections/atom/offerToConnectionsAtom'
import addFCMCypherToPublicPayloadActionAtom from '../notifications/addNotificationTokenToPublicPayloadActionAtom'
import {sessionDataOrDummyAtom} from '../session'
import {loadingStateAtom} from './atoms/loadingState'
import {myOffersAtom} from './atoms/myOffers'
import {
  lastUpdatedAtAtom,
  offerForChatOriginAtom,
  offersAtom,
  offersIdsAtom,
  offersStateAtom,
  singleOfferAtom,
} from './atoms/offersState'

export const triggerOffersRefreshAtom = atom(null, async (get, set) => {
  const api = get(apiAtom)
  const session = get(sessionDataOrDummyAtom)

  const updateStartedAt = isoNow()
  const offerIds = get(offersIdsAtom)

  console.log('🦋 Refreshing offers')

  await pipe(
    effectToTaskEither(
      getNewOffersAndDecrypt({
        offersApi: api.offer,
        modifiedAt: get(lastUpdatedAtAtom),
        keyPair: session.privateKey,
      })
    ),
    TE.bindTo('newOffers'),
    TE.bindW('removedOffers', () =>
      pipe(
        offerIds.length > 0
          ? effectToTaskEither(api.offer.getRemovedOffers({body: {offerIds}}))
          : TE.right({offerIds: [] as OfferId[]}),
        TE.matchW(
          (error) => {
            if (error._tag !== 'NetworkError')
              reportError('error', new Error('Error fetching removed offers'), {
                error,
              })
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
          reportError('error', new Error('Error fetching offers'), {error})
        set(loadingStateAtom, {state: 'error', error})
      },
      ({newOffers: decryptingResults, removedOffers}) => {
        effectPipe(
          Array.filterMap(decryptingResults, Either.getLeft),
          Array.match({
            onEmpty: () => {
              // Is ok, all offers decrypted ok
            },
            onNonEmpty(self) {
              const criticalErrors = self.filter(
                (one) => one._tag !== 'NonCompatibleOfferVersionError'
              )
              if (criticalErrors.length > 0)
                reportError(
                  'error',
                  new Error('Error while decrypting offers'),
                  {self}
                )

              const nonCompatibleErrors = self.filter(
                (one) => one._tag === 'NonCompatibleOfferVersionError'
              )
              if (nonCompatibleErrors.length > 0) {
                console.info(
                  `Skipping ${nonCompatibleErrors.length} offers because they are not compatible.`
                )
              }
            },
          })
        )

        const fetchedOffers = effectPipe(
          Array.filterMap(decryptingResults, Either.getRight)
        )
        const allOffersIds = effectPipe(
          [...get(offersIdsAtom), ...fetchedOffers.map((one) => one.offerId)],
          Array.dedupe
        )

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

            if (oldOffer?.ownershipInfo?.adminId) {
              // D not update offers that are owned the by current user.
              return oldOffer
            }

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
              // They can be re-uploaded once #106 is implemented.
              !!one.ownershipInfo ||
              !removedOffers.includes(one.offerInfo.offerId)
          ),
          (offers) => ({offers, lastUpdatedAt1: updateStartedAt}),
          (value) => {
            set(offersStateAtom, value)
          }
        )
      }
    )
  )()

  // Check and try to recover offers that are not saved with ownership info but are owned by the current user (according to private payload)
  await pipe(
    get(offersStateAtom).offers,
    A.filter(
      (one) => !one.ownershipInfo && !!one.offerInfo.privatePart.adminId
    ),
    (offersToRecover) => {
      if (offersToRecover.length > 0) {
        console.warn(
          `🚨 🚨 🚨 Found ${offersToRecover.length} offers that needs to be recovered. This should not happen and should be investigated.🚨 🚨 🚨 \nTrying to recover them.`
        )
        reportError(
          'warn',
          new Error(
            `Found ${offersToRecover.length} offers that needs to be recovered.`
          ),
          {ids: offersToRecover.map((one) => one.offerInfo.id)}
        )
      }
      return offersToRecover
    },
    A.map((one) =>
      pipe(
        extractOwnerInfoFromOwnerPrivatePayload(one.offerInfo.privatePart),
        TE.matchW(
          (l) => {
            console.warn('Error while recovering offer', JSON.stringify(l))
            return false
          },
          (r) => {
            set(offersAtom, (old) =>
              old.map((oneOffer) => {
                if (oneOffer.offerInfo.offerId !== one.offerInfo.offerId) {
                  return oneOffer
                }
                return {
                  ...oneOffer,
                  ownershipInfo: r,
                }
              })
            )
            return true
          }
        )
      )
    ),
    T.sequenceSeqArray,
    T.map((results) => {
      if (results.length === 0) return
      const successCount = results.filter(Boolean).length
      const errorCount = results.length - successCount
      console.info(`Recovered ${successCount} out of ${errorCount} offers.`)
      if (errorCount > 0) {
        console.warn(`Unable to recover some offers.`)
      }
    })
  )()

  // Update offers
  await pipe(
    get(myOffersAtom),
    A.filter(
      (one) =>
        !one.offerInfo.privatePart.adminId ||
        !one.offerInfo.privatePart.intendedConnectionLevel
    ),
    (offersToUpdate) => {
      console.log(
        `Updating offers to include owner info in owner's private payload. Count: ${offersToUpdate.length}`
      )
      return offersToUpdate
    },
    A.map((one) =>
      pipe(
        updateOwnerPrivatePayload({
          api: get(apiAtom).offer,
          ownerCredentials: session.privateKey,
          symmetricKey: one.offerInfo.privatePart.symmetricKey,
          adminId: one.ownershipInfo.adminId,
          intendedConnectionLevel: one.ownershipInfo.intendedConnectionLevel,
        }),
        TE.match(
          (e) => {
            reportError(
              'warn',
              new Error('Error updating owner private payload'),
              {e}
            )
            return false
          },
          () => {
            return true
          }
        )
      )
    ),
    T.sequenceSeqArray
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
      offerKey: PrivateKeyHolder
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
  const api = get(apiAtom)
  const session = get(sessionDataOrDummyAtom)
  const {payloadPublic, intendedConnectionLevel, onProgress} = params

  return pipe(
    TE.Do,
    TE.bindW('fcmToken', () => pipe(getNotificationToken(), TE.fromTask)),
    TE.bindW('publicPayloadWithNotificationToken', ({fcmToken}) =>
      TE.fromTask(
        set(addFCMCypherToPublicPayloadActionAtom, {
          publicPart: payloadPublic,
          fcmToken: Option.fromNullable(fcmToken),
          keyHolder: params.offerKey,
        })
      )
    ),
    TE.bindW(
      'createOfferResult',
      ({publicPayloadWithNotificationToken: {publicPart}}) =>
        createNewOfferForMyContacts({
          offerApi: api.offer,
          publicPart,
          countryPrefix: getCountryPrefix(session.phoneNumber),
          contactApi: api.contact,
          intendedConnectionLevel,
          ownerKeyPair: session.privateKey,
          onProgress,
        })
    ),
    TE.map(
      ({
        createOfferResult: r,
        publicPayloadWithNotificationToken,
        fcmToken,
      }) => {
        if (r.encryptionErrors.length > 0) {
          reportError('error', new Error('Error while encrypting offer'), {
            errors: r.encryptionErrors,
          })
        }

        const createdOffer: MyOfferInState = {
          ownershipInfo: {
            adminId: r.adminId,
            intendedConnectionLevel,
          },
          lastCommitedFcmToken:
            publicPayloadWithNotificationToken.tokenSuccessfullyAdded
              ? fcmToken ?? undefined
              : undefined,
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
      }
    )
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
    } & (
      | {updateFcmCypher: false}
      | {updateFcmCypher: true; offerKey: PrivateKeyHolder}
    ),
  ],
  TE.TaskEither<
    | ApiErrorUpdatingOffer
    | ErrorEncryptingPublicPart
    | ErrorDecryptingOffer
    | PrivatePartEncryptionError
    | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
    | NonCompatibleOfferVersionError,
    OneOfferInState
  >
>(null, (get, set, params) => {
  const api = get(apiAtom)
  const session = get(sessionDataOrDummyAtom)
  const {payloadPublic, symmetricKey, adminId, intendedConnectionLevel} = params

  return pipe(
    TE.Do,
    TE.bindW('fcmToken', () => pipe(getNotificationToken(), TE.fromTask)),
    TE.bindW('publicPayloadWithNotificationToken', ({fcmToken}) => {
      if (!params.updateFcmCypher) {
        return TE.right({
          publicPart: payloadPublic,
          tokenSuccessfullyAdded: false,
        })
      }
      return TE.fromTask(
        set(addFCMCypherToPublicPayloadActionAtom, {
          publicPart: payloadPublic,
          fcmToken: Option.fromNullable(fcmToken),
          keyHolder: params.offerKey,
        })
      )
    }),
    TE.bindW(
      'updateResult',
      ({publicPayloadWithNotificationToken: {publicPart}}) =>
        updateOffer({
          offerApi: api.offer,
          adminId,
          publicPayload: publicPart,
          symmetricKey,
          intendedConnectionLevel,
          ownerKeypair: session.privateKey,
        })
    ),
    TE.map(
      ({updateResult: r, fcmToken, publicPayloadWithNotificationToken}) => {
        const createdOffer: MyOfferInState = {
          flags: {
            reported: false,
          },
          lastCommitedFcmToken:
            publicPayloadWithNotificationToken.tokenSuccessfullyAdded
              ? fcmToken ?? undefined
              : undefined,
          ownershipInfo: {
            adminId,
            intendedConnectionLevel,
          },
          offerInfo: r,
        }
        set(offersAtom, (oldState) => [
          ...oldState.filter(
            (offer) =>
              offer.offerInfo.offerId !== createdOffer.offerInfo.offerId
          ),
          createdOffer,
        ])
        return createdOffer
      }
    )
  )
})

export const deleteOffersActionAtom = atom<
  null,
  [{adminIds: OfferAdminId[]}],
  TE.TaskEither<
    Effect.Effect.Error<ReturnType<OfferApi['deleteOffer']>>,
    {success: true}
  >
>(null, (get, set, params) => {
  const {adminIds: adminIdsToDelete} = params
  const api = get(apiAtom)
  const offers = get(offersAtom)

  return pipe(
    TE.Do,
    TE.chainFirstW(() =>
      effectToTaskEither(
        api.offer.deleteOffer({query: {adminIds: adminIdsToDelete}})
      )
    ),
    TE.match(
      (left) => {
        reportError('error', new Error('Error while deleting offers'), {left})
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

        // Only when deleting one offer
        if (adminIdsToDelete.length === 1) {
          // Delete inbox if there are no open chats
          const offer = offers.find(
            (offer) =>
              offer.ownershipInfo?.adminId &&
              adminIdsToDelete.includes(offer.ownershipInfo.adminId)
          )
          set(messagingStateAtom, (prev) =>
            prev.filter(
              (one) =>
                !(
                  one.inbox.offerId === offer?.offerInfo.offerId &&
                  one.chats.length === 0
                )
            )
          )
        }
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
