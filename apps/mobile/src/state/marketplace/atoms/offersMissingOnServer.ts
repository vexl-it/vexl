import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type MyOfferInState,
  type OfferAdminId,
  OfferId,
  type OfferPublicPart,
} from '@vexl-next/domain/src/general/offers'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import createNewOfferForMyContacts from '@vexl-next/resources-utils/src/offers/createNewOfferForMyContacts'
import {Array, Effect, Option, Record} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {z} from 'zod'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import getCountryPrefix from '../../../utils/getCountryCode'
import reportError from '../../../utils/reportError'
import {clubsToKeyHolderAtom} from '../../clubs/atom/clubsToKeyHolderAtom'
import {
  deleteOfferToConnectionsAtom,
  upsertOfferToConnectionsActionAtom,
} from '../../connections/atom/offerToConnectionsAtom'
import {sessionDataOrDummyAtom} from '../../session'
import {myOffersAtom} from './myOffers'
import {singleOfferAtom, singleOfferByAdminIdAtom} from './offersState'

export const offersMissingOnServerStorageAtom = atomWithParsedMmkvStorage(
  'offers-missing-on-server',
  {offerIds: []},
  z
    .object({
      offerIds: z.array(OfferId),
    })
    .readonly()
)

export const unmarkOfferAsMissingActionAtom = atom(
  null,
  (get, set, offerId: OfferId) => {
    set(offersMissingOnServerStorageAtom, (old) => ({
      ...old,
      offerIds: old.offerIds.filter((one) => one !== offerId),
    }))
  }
)

export const offersMissingOnServerAtom = atom(
  (get) => {
    const offerIds = get(offersMissingOnServerStorageAtom).offerIds
    return get(myOffersAtom).filter((one) =>
      offerIds.includes(one.offerInfo.offerId)
    )
  },
  (get, set, update: OfferId[]) => {
    set(offersMissingOnServerStorageAtom, (old) => ({...old, offerIds: update}))
  }
)

export const areThereMissingOffersOnServerAtom = atom((get) => {
  return get(offersMissingOnServerStorageAtom).offerIds.length > 0
})

const reencryptOneOfferActionAtom = atom(
  null,
  (
    get,
    set,
    {
      adminId,
      intendedConnectionLevel,
      intendedClubs,
      offer,
      onProgress,
    }: {
      adminId?: OfferAdminId
      intendedConnectionLevel?: IntendedConnectionLevel
      intendedClubs?: readonly ClubUuid[]
      offer: MyOfferInState
      onProgress: (p: OfferEncryptionProgress) => void
    }
  ) => {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const offerAtom = singleOfferAtom(offer.offerInfo.offerId)
    const clubsUuids =
      intendedClubs ?? get(offerAtom)?.ownershipInfo?.intendedClubs ?? []
    const clubsInfo = get(clubsToKeyHolderAtom)

    const intendedClubsRecord = pipe(
      clubsUuids,
      Array.filterMap((clubUuid) =>
        pipe(
          Record.get(clubsInfo, clubUuid),
          Option.map((club) => [clubUuid, club] as const)
        )
      ),
      Record.fromEntries
    )

    return pipe(
      createNewOfferForMyContacts({
        offerApi: api.offer,
        contactApi: api.contact,
        publicPart: offer.offerInfo.publicPart,
        countryPrefix: getCountryPrefix(session.phoneNumber),
        intendedConnectionLevel:
          intendedConnectionLevel ??
          offer.ownershipInfo.intendedConnectionLevel,
        ownerKeyPair: session.privateKey,
        onProgress,
        intendedClubs: intendedClubsRecord,
        offerId: offer.offerInfo.offerId,
        adminId,
      }),
      Effect.map((r) => {
        if (r.encryptionErrors.length > 0) {
          reportError('error', new Error('Error while encrypting offer'), {
            excryptionErrors: r.encryptionErrors,
          })
        }

        const recreatedOffer: MyOfferInState = {
          ownershipInfo: {
            adminId: r.adminId,
            intendedConnectionLevel:
              offer.ownershipInfo.intendedConnectionLevel,
            intendedClubs: Record.keys(intendedClubsRecord),
          },
          flags: {
            reported: false,
          },
          offerInfo: r.offerInfo,
        }

        set(offerAtom, recreatedOffer)
        set(deleteOfferToConnectionsAtom, offer.ownershipInfo.adminId)
        set(upsertOfferToConnectionsActionAtom, {
          connections: {
            firstLevel: r.encryptedFor.firstDegreeConnections,
            secondLevel:
              offer.ownershipInfo.intendedConnectionLevel === 'ALL'
                ? r.encryptedFor.secondDegreeConnections
                : [],
            clubs: r.encryptedFor.clubsConnections,
          },
          adminId: r.adminId,
          symmetricKey: r.symmetricKey,
        })
        set(unmarkOfferAsMissingActionAtom, offer.offerInfo.offerId)

        return recreatedOffer
      })
    )
  }
)

export const reencryptSingleOfferMissingOnServerWhenEditingActionAtom = atom(
  null,
  (
    get,
    set,
    {
      adminId,
      intendedConnectionLevel,
      intendedClubs,
      publicPayload,
      onProgress,
    }: {
      adminId: OfferAdminId
      publicPayload: OfferPublicPart
      intendedConnectionLevel: IntendedConnectionLevel
      intendedClubs: readonly ClubUuid[]
      onProgress?: (a: OfferEncryptionProgress) => void
    }
  ) => {
    return Effect.gen(function* (_) {
      const offer = get(singleOfferByAdminIdAtom(adminId))

      if (!offer?.ownershipInfo || !offer?.offerInfo) {
        reportError(
          'error',
          new Error('Offer not found for re-encryption in state'),
          {
            adminId,
          }
        )
        return yield* _(Effect.fail(new Error('Offer not found')))
      }

      const myOfferInState: MyOfferInState = {
        ...offer,
        ownershipInfo: offer.ownershipInfo,
        offerInfo: {
          ...offer.offerInfo,
          publicPart: publicPayload,
        },
      }

      return yield* _(
        set(reencryptOneOfferActionAtom, {
          adminId: myOfferInState.ownershipInfo.adminId,
          offer: myOfferInState,
          intendedConnectionLevel,
          intendedClubs,
          onProgress: (progress) => {
            if (onProgress) onProgress(progress)
          },
        })
      )
    })
  }
)

export const reencryptOffersMissingOnServerActionAtom = atom(
  null,
  (
    get,
    set,
    {
      onProgress,
    }: {
      onProgress?: (a: {
        offerEncryptionProgress: OfferEncryptionProgress
        processingIndex: number
        totalToProcess: number
      }) => void
    }
  ) => {
    const offersToReupload = get(offersMissingOnServerAtom)

    return pipe(
      offersToReupload,
      Array.map((one, index) =>
        pipe(
          set(reencryptOneOfferActionAtom, {
            offer: one,
            onProgress: (progress) => {
              if (onProgress)
                onProgress({
                  offerEncryptionProgress: progress,
                  processingIndex: index,
                  totalToProcess: offersToReupload.length,
                })
            },
          }),
          Effect.either
        )
      ),
      Effect.all,
      Effect.map((results) => {
        const errors = Array.getLefts(results)
        if (errors.length > 0)
          reportError('error', new Error('Error while reencrypting offers'), {
            errors,
          })

        return {
          reuploaded: Array.getRights(results),
          errors,
        }
      })
    )
  }
)
