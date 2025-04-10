import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ClubKeyNotFoundInInnerStateError,
  type ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
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
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import createNewOfferForMyContacts, {
  type ApiErrorWhileCreatingOffer,
} from '@vexl-next/resources-utils/src/offers/createNewOfferForMyContacts'
import {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import extractOwnerInfoFromOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/extractOwnerInfoFromOwnerPrivatePayload'
import getNewClubsOffersAndDecrypt from '@vexl-next/resources-utils/src/offers/getNewClubsOffersAndDecrypt'
import getNewOffersAndDecrypt, {
  type ApiErrorFetchingOffers,
} from '@vexl-next/resources-utils/src/offers/getNewOffersAndDecrypt'
import updateOffer, {
  type ApiErrorUpdatingOffer,
} from '@vexl-next/resources-utils/src/offers/updateOffer'
import updateOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/updateOwnerPrivatePayload'
import {type PrivatePayloadsConstructionError} from '@vexl-next/resources-utils/src/offers/utils/constructPrivatePayloads'
import {type PublicPartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptOfferPublicPayload'
import {type PrivatePartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptPrivatePart'
import {type ApiErrorFetchingContactsForOffer} from '@vexl-next/resources-utils/src/offers/utils/fetchContactsForOffer'
import {type SymmetricKeyGenerationError} from '@vexl-next/resources-utils/src/offers/utils/generateSymmetricKey'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Either, Option, Record, pipe} from 'effect'
import {atom, useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {apiAtom} from '../../api'
import getCountryPrefix from '../../utils/getCountryCode'
import {getNotificationToken} from '../../utils/notifications'
import reportError from '../../utils/reportError'
import offerToConnectionsAtom, {
  upsertOfferToConnectionsActionAtom,
} from '../connections/atom/offerToConnectionsAtom'
import {myStoredClubsAtom} from '../contacts/atom/clubsStore'
import addNotificationCypherToPublicPayloadActionAtom from '../notifications/addNotificationTokenToPublicPayloadActionAtom'
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

export const triggerOffersRefreshAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const myStoredClubs = get(myStoredClubsAtom)

    const updateStartedAt = isoNow()
    const offerIds = get(offersIdsAtom)

    console.log('🦋 Refreshing offers')

    const newDecryptedContactsOffers = yield* _(
      getNewOffersAndDecrypt({
        offersApi: api.offer,
        modifiedAt: get(lastUpdatedAtAtom),
        keyPair: session.privateKey,
      })
    )

    const newClubsDecryptedOffers = yield* _(
      Record.values(myStoredClubs),
      Array.map((keyPair) =>
        getNewClubsOffersAndDecrypt({
          offersApi: api.offer,
          modifiedAt: get(lastUpdatedAtAtom),
          keyPair,
        })
      ),
      Effect.all
    )

    const newDecryptedOffers = [
      ...newDecryptedContactsOffers,
      ...Array.flatten(newClubsDecryptedOffers),
    ]

    const removedOfferIds = yield* _(
      api.offer.getRemovedOffers({body: {offerIds}}),
      Effect.catchAll((e) => {
        if (e._tag !== 'NetworkError')
          reportError('error', new Error('Error fetching removed offers'), {
            e,
          })

        return Effect.succeed({offerIds: [] as OfferId[]})
      })
    )

    pipe(
      Array.filterMap(newDecryptedOffers, Either.getLeft),
      Array.match({
        onEmpty: () => {
          // Is ok, all offers decrypted ok
        },
        onNonEmpty(self) {
          const criticalErrors = self.filter(
            (one) => one._tag !== 'NonCompatibleOfferVersionError'
          )

          if (criticalErrors.length > 0)
            reportError('error', new Error('Error while decrypting offers'), {
              self,
            })

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

    const oldOffers = get(offersAtom)
    const fetchedOffers = Array.filterMap(newDecryptedOffers, Either.getRight)
    const allOffersIds = Array.union(
      get(offersIdsAtom),
      fetchedOffers.map((one) => one.offerId)
    )

    const clubAndNormalOffersCombined = pipe(
      Array.groupBy(fetchedOffers, (one) => one.offerId),
      Record.mapEntries((valueArray, key) => [
        key,
        valueArray.length > 1
          ? Array.reduce(valueArray, valueArray[0], (acc, curr) => ({
              ...acc,
              privatePart: {
                ...acc.privatePart,
                clubId: curr.privatePart.clubId ?? acc.privatePart.clubId,
                commonFriends: [
                  ...acc.privatePart.commonFriends,
                  ...curr.privatePart.commonFriends,
                ],
              },
            }))
          : valueArray[0],
      ]),
      Record.values
    )

    pipe(
      Array.filterMap(allOffersIds, (offerId) => {
        const combinedOffer = clubAndNormalOffersCombined.find(
          (fetchedOffer) => offerId === fetchedOffer.offerId
        )
        const oldOffer = oldOffers.find(
          (one) => one.offerInfo.offerId === offerId
        )

        if (oldOffer?.ownershipInfo?.adminId) {
          // D not update offers that are owned the by current user.
          return Option.some(oldOffer)
        }

        if (oldOffer && combinedOffer) {
          if (
            !!combinedOffer.privatePart.clubId ||
            !!oldOffer.offerInfo.privatePart.clubId
          ) {
            return Option.some({
              ...oldOffer,
              offerInfo: {
                ...combinedOffer,
                privatePart: {
                  ...combinedOffer.privatePart,
                  clubId:
                    oldOffer.offerInfo.privatePart.clubId ??
                    combinedOffer.privatePart.clubId,
                  commonFriends: Array.dedupe([
                    ...oldOffer.offerInfo.privatePart.commonFriends,
                    ...combinedOffer.privatePart.commonFriends,
                  ]),
                },
              },
            } as OneOfferInState)
          }

          return Option.some({
            ...oldOffer,
            offerInfo: combinedOffer,
          } as OneOfferInState)
        }

        if (oldOffer) {
          return Option.some(oldOffer)
        }

        if (combinedOffer) {
          return Option.some({
            offerInfo: combinedOffer,
            flags: {
              reported: false,
            },
          } as OneOfferInState)
        }
        return Option.none()
      }),
      Array.filter(
        (one) =>
          // Do NOT remove offers that are owned by current user.
          // They can be re-uploaded once #106 is implemented.
          !!one.ownershipInfo ||
          !removedOfferIds.offerIds.includes(one.offerInfo.offerId)
      ),
      (offers) => {
        set(offersStateAtom, {offers, lastUpdatedAt1: updateStartedAt})
      }
    )

    // Check and try to recover offers that are not saved with ownership info but are owned by the current user (according to private payload)
    pipe(
      get(offersStateAtom).offers,
      Array.filter(
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
      Array.map((one) =>
        pipe(
          extractOwnerInfoFromOwnerPrivatePayload(one.offerInfo.privatePart),
          Effect.match({
            onFailure(error) {
              console.warn(
                'Error while recovering offer',
                JSON.stringify(error)
              )
              return false
            },
            onSuccess(ownershipInfo) {
              set(offersAtom, (old) =>
                old.map((oneOffer) => {
                  if (oneOffer.offerInfo.offerId !== one.offerInfo.offerId) {
                    return oneOffer
                  }
                  return {
                    ...oneOffer,
                    ownershipInfo,
                  }
                })
              )
              return true
            },
          }),
          Effect.runPromise
        )
      ),
      (results) => {
        if (results.length === 0) return
        const successCount = results.filter(Boolean).length
        const errorCount = results.length - successCount
        console.info(`Recovered ${successCount} out of ${errorCount} offers.`)
        if (errorCount > 0) {
          console.warn(`Unable to recover some offers.`)
        }
      }
    )

    // Update offers
    pipe(
      get(myOffersAtom),
      Array.filter(
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
      Array.map((one) =>
        pipe(
          updateOwnerPrivatePayload({
            api: get(apiAtom).offer,
            ownerCredentials: session.privateKey,
            symmetricKey: one.offerInfo.privatePart.symmetricKey,
            adminId: one.ownershipInfo.adminId,
            intendedConnectionLevel: one.ownershipInfo.intendedConnectionLevel,
          }),
          Effect.match({
            onFailure(e) {
              reportError(
                'warn',
                new Error('Error updating owner private payload'),
                {e}
              )
              return false
            },
            onSuccess() {
              return true
            },
          }),
          Effect.runFork
        )
      )
    )
  }).pipe(
    Effect.catchAll((e) => {
      if (e._tag !== 'NetworkError')
        reportError('error', new Error('Error fetching offers'), {e})
      set(loadingStateAtom, {state: 'error', error: e})

      return Effect.void
    })
  )
)

export function useAreOffersLoading(): boolean {
  const offerState = useAtomValue(loadingStateAtom)

  return offerState.state === 'inProgress'
}

export function useOffersLoadingError(): Option.Option<
  ApiErrorFetchingOffers | CryptoError
> {
  const offerState = useAtomValue(loadingStateAtom)

  return offerState.state === 'error'
    ? Option.some(offerState.error)
    : Option.none()
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
      intendedClubs?: ClubUuid[]
      onProgress?: (status: OfferEncryptionProgress) => void
      offerKey: PrivateKeyHolder
    },
  ],
  Effect.Effect<
    OneOfferInState,
    | ApiErrorFetchingContactsForOffer
    | PrivatePayloadsConstructionError
    | ApiErrorWhileCreatingOffer
    | SymmetricKeyGenerationError
    | PublicPartEncryptionError
    | NonCompatibleOfferVersionError
    | DecryptingOfferError
    | ApiErrorFetchingClubMembersForOffer
    | ClubKeyNotFoundInInnerStateError
  >
>(null, (get, set, params) => {
  const api = get(apiAtom)
  const myStoredClubs = get(myStoredClubsAtom)
  const session = get(sessionDataOrDummyAtom)
  const {intendedClubs, payloadPublic, intendedConnectionLevel, onProgress} =
    params

  return Effect.gen(function* (_) {
    const notificationToken = yield* _(taskToEffect(getNotificationToken()))

    const publicPayloadWithNotificationToken = yield* _(
      taskToEffect(
        set(addNotificationCypherToPublicPayloadActionAtom, {
          publicPart: payloadPublic,
          notificationToken: Option.fromNullable(notificationToken),
          keyHolder: params.offerKey,
        })
      )
    )

    const createOfferResult = yield* _(
      createNewOfferForMyContacts({
        offerApi: api.offer,
        publicPart: publicPayloadWithNotificationToken.publicPart,
        countryPrefix: getCountryPrefix(session.phoneNumber),
        contactApi: api.contact,
        intendedConnectionLevel,
        ownerKeyPair: session.privateKey,
        intendedClubs,
        myStoredClubs,
        onProgress,
      })
    )

    if (createOfferResult.encryptionErrors.length > 0) {
      reportError('error', new Error('Error while encrypting offer'), {
        errors: createOfferResult.encryptionErrors,
      })
    }

    const createdOffer: MyOfferInState = {
      ownershipInfo: {
        adminId: createOfferResult.adminId,
        intendedConnectionLevel,
        intendedClubs,
      },
      lastCommitedFcmToken:
        publicPayloadWithNotificationToken.tokenSuccessfullyAdded
          ? (notificationToken ?? undefined)
          : undefined,
      flags: {
        reported: false,
      },
      offerInfo: createOfferResult.offerInfo,
    }

    set(offersAtom, (oldState) => [...oldState, createdOffer])

    set(upsertOfferToConnectionsActionAtom, {
      connections: {
        firstLevel: createOfferResult.encryptedFor.firstDegreeConnections,
        secondLevel:
          intendedConnectionLevel === 'ALL'
            ? createOfferResult.encryptedFor.secondDegreeConnections
            : undefined,
        clubs: createOfferResult.encryptedFor.clubsConnections,
      },
      adminId: createOfferResult.adminId,
      symmetricKey: createOfferResult.symmetricKey,
    })

    return createdOffer
  })
})

export const updateOfferAtom = atom<
  null,
  [
    {
      payloadPublic: OfferPublicPart
      symmetricKey: SymmetricKey
      adminId: OfferAdminId
      intendedConnectionLevel: IntendedConnectionLevel
      intendedClubs?: ClubUuid[]
    } & (
      | {updateFcmCypher: false}
      | {updateFcmCypher: true; offerKey: PrivateKeyHolder}
    ),
  ],
  Effect.Effect<
    OneOfferInState,
    | ApiErrorUpdatingOffer
    | PublicPartEncryptionError
    | DecryptingOfferError
    | PrivatePartEncryptionError
    | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
    | NonCompatibleOfferVersionError
  >
>(null, (get, set, params) => {
  const api = get(apiAtom)
  const session = get(sessionDataOrDummyAtom)
  const {
    intendedClubs,
    payloadPublic,
    symmetricKey,
    adminId,
    intendedConnectionLevel,
  } = params

  return Effect.gen(function* (_) {
    const notificationToken = yield* _(taskToEffect(getNotificationToken()))

    const publicPayloadWithNotificationToken = !params.updateFcmCypher
      ? {
          publicPart: payloadPublic,
          tokenSuccessfullyAdded: false,
        }
      : yield* _(
          taskToEffect(
            set(addNotificationCypherToPublicPayloadActionAtom, {
              publicPart: payloadPublic,
              notificationToken: Option.fromNullable(notificationToken),
              keyHolder: params.offerKey,
            })
          )
        )

    const offerInfo = yield* _(
      updateOffer({
        offerApi: api.offer,
        adminId,
        publicPayload: publicPayloadWithNotificationToken.publicPart,
        symmetricKey,
        intendedConnectionLevel,
        intendedClubs,
        ownerKeypair: session.privateKey,
      })
    )

    const createdOffer: MyOfferInState = {
      flags: {
        reported: false,
      },
      lastCommitedFcmToken:
        publicPayloadWithNotificationToken.tokenSuccessfullyAdded
          ? (notificationToken ?? undefined)
          : undefined,
      ownershipInfo: {
        adminId,
        intendedConnectionLevel,
        intendedClubs,
      },
      offerInfo,
    }

    set(offersAtom, (oldState) => [
      ...oldState.filter(
        (offer) => offer.offerInfo.offerId !== createdOffer.offerInfo.offerId
      ),
      createdOffer,
    ])

    return createdOffer
  })
})

export const deleteOffersActionAtom = atom<
  null,
  [{adminIds: OfferAdminId[]}],
  Effect.Effect<void, Effect.Effect.Error<ReturnType<OfferApi['deleteOffer']>>>
>(null, (get, set, params) => {
  const {adminIds: adminIdsToDelete} = params
  const api = get(apiAtom)
  const offers = get(offersAtom)

  return Effect.gen(function* (_) {
    yield* _(api.offer.deleteOffer({query: {adminIds: adminIdsToDelete}}))

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
  }).pipe(
    Effect.mapError((e) => {
      reportError('error', new Error('Error while deleting offers'), {e})
      return e
    })
  )
})

export function useOfferForChatOrigin(
  chatOrigin: ChatOrigin
): OneOfferInState | undefined {
  return useAtomValue(
    useMemo(() => offerForChatOriginAtom(chatOrigin), [chatOrigin])
  )
}
