import {
  type OfferId,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {
  lastUpdatedAtAtom,
  loadingStateAtom,
  myOffersAtom,
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
  type ApiErrorReportingOffer,
  type OffersFilter,
  type OneOfferInState,
} from './domain'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import {pipe} from 'fp-ts/function'
import {useSessionAssumeLoggedIn} from '../session'
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
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
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
import {toBasicError} from '@vexl-next/domain/dist/utility/errors'
import * as O from 'optics-ts'
import {useCallback, useMemo} from 'react'
import deduplicate from '../../utils/deduplicate'
import notEmpty from '../../utils/notEmpty'

export function useTriggerOffersRefresh(): Task<void> {
  const api = usePrivateApiAssumeLoggedIn()
  const session = useSessionAssumeLoggedIn()
  const store = useStore()

  return useCallback(async () => {
    const updateStartedAt = isoNow()
    const offerIds = store.get(offersIdsAtom)

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
          TE.mapLeft(toBasicError('ApiErrorFetchingRemovedOffers')),
          TE.matchW(
            (error) => {
              reportError('error', 'Error fetching removed offers', error)
              return [] as OfferId[]
            },
            (result) => result.offerIds
          ),
          (a) => a,
          TE.fromTask
        )
      ),
      TE.matchW(
        (error) => {
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
                    isMine: false,
                    reported: false,
                    isRequested: false,
                  },
                }
              }
              return null
            }),
            A.filter(notEmpty),
            A.filter((one) => !removedOffers.includes(one.offerInfo.offerId)),
            (offers) => ({offers, lastUpdatedAt: updateStartedAt}),
            (value) => store.set(offersStateAtom, value)
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
  offerId: OfferId
): Option.Option<OneOfferInState> {
  const foundOffer = useAtomValue(
    useMemo(() => singleOfferAtom(offerId), [offerId])
  )
  return Option.fromNullable(foundOffer)
}

export function useFilteredOffers(filter: OffersFilter): OneOfferInState[] {
  return useAtomValue(useMemo(() => offersAtomWithFilter(filter), [filter]))
}

export function useCreateOffer(): (args: {
  payloadPublic: OfferPublicPart
  connectionLevel: ConnectionLevel
}) => TE.TaskEither<
  | ApiErrorFetchingContactsForOffer
  | ErrorConstructingPrivatePayloads
  | ApiErrorWhileCreatingOffer
  | ErrorGeneratingSymmetricKey
  | ErrorEncryptingPublicPart,
  OneOfferInState
> {
  const api = usePrivateApiAssumeLoggedIn()
  const session = useSessionAssumeLoggedIn()
  const setOffers = useSetAtom(offersAtom)

  return useCallback(
    ({payloadPublic, connectionLevel}) =>
      pipe(
        createNewOfferForMyContacts({
          offerApi: api.offer,
          publicPart: payloadPublic,
          contactApi: api.contact,
          connectionLevel,
          ownerKeyPair: session.privateKey,
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
            adminId: r.adminId,
            flags: {
              isMine: true,
              isRequested: false,
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

const reportedOptic = O.optic<OneOfferInState>().prop('flags').prop('reported')

export function useReportOffer(): (
  offerId: OfferId
) => TE.TaskEither<ApiErrorReportingOffer, {success: true}> {
  const api = usePrivateApiAssumeLoggedIn()
  const store = useStore()

  return useCallback(
    (offerId) =>
      pipe(
        api.offer.reportOffer({offerId}),
        TE.matchW(
          (error) => {
            reportError('error', 'Error while reporting offer', error)
            return E.left(toBasicError('ApiErrorReportingOffer')(error))
          },
          () => {
            store.set(singleOfferAtom(offerId), O.set(reportedOptic)(true))
            return E.right({success: true} as const)
          }
        )
      ),
    [api, store]
  )
}

export function useUpdateOffer(): (args: {
  payloadPublic: OfferPublicPart
  symmetricKey: SymmetricKey
  adminId: OfferAdminId
  privatePayloads: OfferPrivateListItem[]
}) => TE.TaskEither<
  ApiErrorUpdatingOffer | ErrorEncryptingPublicPart,
  OneOfferInState
> {
  const api = usePrivateApiAssumeLoggedIn()
  const session = useSessionAssumeLoggedIn()
  const setOffers = useSetAtom(offersAtom)

  return useCallback(
    ({payloadPublic, adminId, symmetricKey, privatePayloads}) =>
      pipe(
        updateOffer({
          offerApi: api.offer,
          adminId,
          publicPayload: payloadPublic,
          symmetricKey,
          ownerKeypair: session.privateKey,
          privatePayloads,
        }),
        TE.map((r) => {
          const createdOffer: OneOfferInState = {
            adminId,
            flags: {
              isMine: true,
              isRequested: false,
              reported: false,
            },
            offerInfo: r,
          }
          setOffers((oldState) => [...oldState, createdOffer])
          return createdOffer
        })
      ),
    [api, session, setOffers]
  )
}

export function useUpdateOfferReencrypt(): (args: {
  payloadPublic: OfferPublicPart
  connectionLevel: ConnectionLevel
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
    ({payloadPublic, connectionLevel, adminId}) =>
      pipe(
        updateOfferReencryptForAll({
          offerApi: api.offer,
          adminId,
          contactApi: api.contact,
          connectionLevel,
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
            adminId,
            flags: {
              isMine: true,
              isRequested: false,
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
              offers.filter((o) => !o.adminId || !adminIds.includes(o.adminId))
            )
            return E.right({success: true})
          }
        )
      )
    },
    [api, store]
  )
}
