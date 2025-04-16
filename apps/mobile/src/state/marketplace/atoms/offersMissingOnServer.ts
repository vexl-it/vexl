import {
  OfferId,
  type MyOfferInState,
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
import {singleOfferAtom} from './offersState'

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
      offer,
      onProgress,
    }: {offer: MyOfferInState; onProgress: (p: OfferEncryptionProgress) => void}
  ) => {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const offerAtom = singleOfferAtom(offer.offerInfo.offerId)
    const intendedClubs = get(offerAtom)?.ownershipInfo?.intendedClubs ?? []
    const clubsInfo = get(clubsToKeyHolderAtom)

    const intendedClubsRecord = pipe(
      intendedClubs,
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
        intendedConnectionLevel: offer.ownershipInfo.intendedConnectionLevel,
        ownerKeyPair: session.privateKey,
        onProgress,
        intendedClubs: intendedClubsRecord,
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
