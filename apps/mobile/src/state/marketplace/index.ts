import {
  type IntendedConnectionLevel,
  type OfferId,
  type OfferInfo,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {atom, useAtomValue, useSetAtom, useStore} from 'jotai'
import {
  lastUpdatedAtAtom,
  loadingStateAtom,
  myOffersAtom,
  offerFlagsAtom,
  offerForChatOriginAtom,
  offersAtom,
  offersAtomWithFilter,
  offersIdsAtom,
  offersStateAtom,
  offersToSee,
  singleOfferAtom,
} from './atom'
import * as Option from 'fp-ts/Option'
import {
  type ApiErrorDeletingOffer,
  type OffersFilter,
  type OneOfferInState,
} from './domain'
import {privateApiAtom, usePrivateApiAssumeLoggedIn} from '../../api'
import {pipe} from 'fp-ts/function'
import {dummySession, sessionAtom, useSessionAssumeLoggedIn} from '../session'
import getNewOffersAndDecrypt, {
  type ApiErrorFetchingOffers,
} from '@vexl-next/resources-utils/dist/offers/getNewOffersAndDecrypt'
import {isoNow} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import reportError from '../../utils/reportError'
import {type Task} from 'fp-ts/Task'
import createNewOfferForMyContacts, {
  type ApiErrorWhileCreatingOffer,
} from '@vexl-next/resources-utils/dist/offers/createOfferHandleContacts'
import {type ApiErrorFetchingContactsForOffer} from '@vexl-next/resources-utils/dist/offers/utils/fetchContactsForOffer'
import {type ErrorConstructingPrivatePayloads} from '@vexl-next/resources-utils/dist/offers/utils/offerPrivatePayload'
import {type ErrorGeneratingSymmetricKey} from '@vexl-next/resources-utils/dist/offers/utils/generateSymmetricKey'
import {type ErrorEncryptingPublicPart} from '@vexl-next/resources-utils/dist/offers/utils/encryptOfferPublicPayload'
import updateOffer, {
  type ApiErrorUpdatingOffer,
  updateOfferReencryptForAll,
} from '@vexl-next/resources-utils/dist/offers/updateOffer'
import {
  type OfferAdminId,
  type OfferPrivateListItem,
} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type ErrorDecryptingOffer} from '@vexl-next/resources-utils/dist/offers/decryptOffer'
import {
  type BasicError,
  toBasicError,
} from '@vexl-next/domain/dist/utility/errors'
import {useCallback, useMemo} from 'react'
import deduplicate from '../../utils/deduplicate'
import notEmpty from '../../utils/notEmpty'
import useSendMessagingRequest from '../chat/hooks/useSendRequest'
import {type ApiErrorRequestMessaging} from '@vexl-next/resources-utils/dist/chat/sendMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {type ChatOrigin} from '@vexl-next/domain/dist/general/messaging'

export function useTriggerOffersRefresh(): Task<void> {
  const api = usePrivateApiAssumeLoggedIn()
  const session = useSessionAssumeLoggedIn()
  const store = useStore()

  return useCallback(async () => {
    const updateStartedAt = isoNow()
    const offerIds = store.get(offersIdsAtom)

    console.log('🦋 Refreshing offers...')

    await pipe(
      getNewOffersAndDecrypt({
        offersApi: api.offer,
        modifiedAt: store.get(lastUpdatedAtAtom),
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
          store.set(loadingStateAtom, {state: 'error', error})
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
                reportError('error', 'Error while decrypting offer', error)
              }
            )
          )

          const fetchedOffers = pipe(
            decryptingResults,
            A.filter(E.isRight),
            A.map((one) => one.right)
          )

          const allOffersIds = deduplicate([
            ...store.get(offersIdsAtom),
            ...fetchedOffers.map((one) => one.offerId),
          ])
          const oldOffers = store.get(offersAtom)

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
            A.filter((one) => !removedOffers.includes(one.offerInfo.offerId)),
            (offers) => ({offers, lastUpdatedAt: updateStartedAt}),
            (value) => {
              store.set(offersStateAtom, value)
            }
          )
        }
      )
    )()
  }, [api, session, store])
}

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

export function useOffers(): OneOfferInState[] {
  return useAtomValue(offersToSee)
}

export function useMyOffers(): OneOfferInState[] {
  return useAtomValue(myOffersAtom)
}

export function useSingleOffer(
  offerId: OfferId | undefined
): Option.Option<OneOfferInState> {
  const foundOffer = useAtomValue(
    useMemo(() => singleOfferAtom(offerId), [offerId])
  )
  return Option.fromNullable(foundOffer)
}

export function useFilteredOffers(filter: OffersFilter): OneOfferInState[] {
  return useAtomValue(useMemo(() => offersAtomWithFilter(filter), [filter]))
}

export const createOfferAtom = atom<
  null,
  [
    {
      payloadPublic: OfferPublicPart
      intendedConnectionLevel: IntendedConnectionLevel
    }
  ],
  TE.TaskEither<
    | ApiErrorFetchingContactsForOffer
    | ErrorConstructingPrivatePayloads
    | ApiErrorWhileCreatingOffer
    | ErrorGeneratingSymmetricKey
    | ErrorEncryptingPublicPart
    | ErrorDecryptingOffer,
    OneOfferInState
  >
>(null, (get, set, params) => {
  const api = get(privateApiAtom)
  const session = get(sessionAtom)
  const {payloadPublic, intendedConnectionLevel} = params
  return pipe(
    createNewOfferForMyContacts({
      offerApi: api.offer,
      publicPart: payloadPublic,
      contactApi: api.contact,
      intendedConnectionLevel,
      ownerKeyPair:
        session.state === 'loggedIn'
          ? session.session.privateKey
          : dummySession.privateKey,
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
      privatePayloads: OfferPrivateListItem[]
      intendedConnectionLevel: IntendedConnectionLevel
    }
  ],
  TE.TaskEither<
    ApiErrorUpdatingOffer | ErrorEncryptingPublicPart | ErrorDecryptingOffer,
    OneOfferInState
  >
>(null, (get, set, params) => {
  const api = get(privateApiAtom)
  const session = get(sessionAtom)
  const {
    payloadPublic,
    symmetricKey,
    adminId,
    privatePayloads,
    intendedConnectionLevel,
  } = params

  return pipe(
    updateOffer({
      offerApi: api.offer,
      adminId,
      publicPayload: payloadPublic,
      symmetricKey,
      ownerKeypair:
        session.state === 'loggedIn'
          ? session.session.privateKey
          : dummySession.privateKey,
      privatePayloads,
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

export function useUpdateOfferReencrypt(): (args: {
  payloadPublic: OfferPublicPart
  intendedConnectionLevel: IntendedConnectionLevel
  adminId: OfferAdminId
}) => TE.TaskEither<
  | ErrorGeneratingSymmetricKey
  | ErrorEncryptingPublicPart
  | ApiErrorUpdatingOffer
  | ErrorConstructingPrivatePayloads
  | ErrorDecryptingOffer
  | ApiErrorFetchingContactsForOffer,
  OneOfferInState
> {
  const api = usePrivateApiAssumeLoggedIn()
  const session = useSessionAssumeLoggedIn()
  const setOffers = useSetAtom(offersAtom)

  return useCallback(
    ({payloadPublic, intendedConnectionLevel, adminId}) =>
      pipe(
        updateOfferReencryptForAll({
          offerApi: api.offer,
          adminId,
          contactApi: api.contact,
          intendedConnectionLevel,
          ownerKeyPair: session.privateKey,
          publicPayload: payloadPublic,
        }),
        TE.map((r) => {
          if (r.encryptionErrors.length > 0) {
            reportError(
              'error',
              'Error while encrypting offer',
              r.encryptionErrors
            )
          }
          const createdOffer: OneOfferInState = {
            ownershipInfo: {
              intendedConnectionLevel,
              adminId,
            },
            flags: {
              reported: false,
            },
            offerInfo: r.offerInfo,
          }
          setOffers((oldState) => [...oldState, createdOffer])
          return createdOffer
        })
      ),
    [api, session, setOffers]
  )
}

export function useDeleteOffer(): (
  adminIds: OfferAdminId[]
) => TE.TaskEither<ApiErrorDeletingOffer, {success: true}> {
  const api = usePrivateApiAssumeLoggedIn()
  const store = useStore()

  return useCallback(
    (adminIds) => {
      const offers = store.get(offersAtom)
      return pipe(
        api.offer.deleteOffer({adminIds}),
        TE.matchW(
          (left) => {
            reportError('error', 'Error while deleting offers', left)
            return E.left(toBasicError('ApiErrorDeletingOffer')(left))
          },
          () => {
            store.set(
              offersAtom,
              offers.filter(
                (o) =>
                  !o.ownershipInfo?.adminId ||
                  !adminIds.includes(o.ownershipInfo?.adminId)
              )
            )
            return E.right({success: true})
          }
        )
      )
    },
    [api, store]
  )
}

export type ErrorOfferAlreadyRequested =
  BasicError<'ErrorOfferAlreadyRequested'>

export function useRequestOffer(): (a: {
  offer: OfferInfo
  text: string
}) => TE.TaskEither<
  | ErrorOfferAlreadyRequested
  | ApiErrorRequestMessaging
  | ErrorEncryptingMessage,
  {success: true}
> {
  const store = useStore()
  const sendRequest = useSendMessagingRequest()

  return useCallback(
    ({offer, text}: {offer: OfferInfo; text: string}) =>
      pipe(
        sendRequest({text, originOffer: offer}),
        TE.match(E.left, () => {
          store.set(offerFlagsAtom(offer.offerId), (old) => ({
            ...old,
            isRequested: true,
          }))
          return E.right({success: true})
        })
      ),
    [store, sendRequest]
  )
}

export function useOfferForChatOrigin(
  chatOrigin: ChatOrigin
): OneOfferInState | undefined {
  return useAtomValue(
    useMemo(() => offerForChatOriginAtom(chatOrigin), [chatOrigin])
  )
}
