import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {
  type MyOfferInState,
  OfferId,
} from '@vexl-next/domain/src/general/offers'
import {atom} from 'jotai'
import {myOffersAtom} from './myOffers'
import {pipe} from 'fp-ts/lib/function'
import * as A from 'fp-ts/Array'
import * as RA from 'fp-ts/ReadonlyArray'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import createNewOfferForMyContacts from '@vexl-next/resources-utils/src/offers/createOfferHandleContacts'
import {privateApiAtom} from '../../../api'
import {sessionDataOrDummyAtom} from '../../session'
import getCountryPrefix from '../../../utils/getCountryCode'
import reportError from '../../../utils/reportError'
import {singleOfferAtom} from './offersState'
import {
  deleteOfferToConnectionsAtom,
  upsertOfferToConnectionsActionAtom,
} from '../../connections/atom/offerToConnectionsAtom'

export const offersMissingOnServerStorageAtom = atomWithParsedMmkvStorage(
  'offers-missing-on-server',
  {offerIds: []},
  z.object({
    offerIds: z.array(OfferId),
  })
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
    const api = get(privateApiAtom)
    const session = get(sessionDataOrDummyAtom)
    const offerAtom = singleOfferAtom(offer.offerInfo.offerId)

    return pipe(
      createNewOfferForMyContacts({
        offerApi: api.offer,
        contactApi: api.contact,
        publicPart: offer.offerInfo.publicPart,
        countryPrefix: getCountryPrefix(session.phoneNumber),
        intendedConnectionLevel: offer.ownershipInfo.intendedConnectionLevel,
        ownerKeyPair: session.privateKey,
        onProgress,
      }),
      TE.map((r) => {
        if (r.encryptionErrors.length > 0) {
          reportError(
            'error',
            'Error while encrypting offer',
            r.encryptionErrors
          )
        }

        const recreatedOffer: MyOfferInState = {
          ownershipInfo: {
            adminId: r.adminId,
            intendedConnectionLevel:
              offer.ownershipInfo.intendedConnectionLevel,
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
                : undefined,
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
      A.mapWithIndex((index, one) =>
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
        })
      ),
      T.sequenceSeqArray,
      T.map((results) => {
        const errors = results.filter(E.isLeft).map((one) => one.left)
        if (errors.length > 0)
          reportError('error', 'Error while reencrypting offers', errors)

        return {
          reuploaded: pipe(
            results,
            RA.filter(E.isRight),
            RA.map((one) => one.right)
          ),
          errors,
        }
      })
    )
  }
)
