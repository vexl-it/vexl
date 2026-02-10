import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type MyOfferInState,
  type OfferAdminId,
  type OfferPublicPart,
  type OneOfferInState,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import updateOffer, {
  type ApiErrorUpdatingOffer,
} from '@vexl-next/resources-utils/src/offers/updateOffer'
import {type PublicPartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptOfferPublicPayload'
import {type PrivatePartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptPrivatePart'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../../clubs/atom/refreshClubsActionAtom'
import {syncConnectionsActionAtom} from '../../connections/atom/connectionStateAtom'
import {updateAndReencryptSingleOfferConnectionActionAtom} from '../../connections/atom/offerToConnectionsAtom'
import {sessionDataOrDummyAtom} from '../../session'
import {reencryptSingleOfferMissingOnServerWhenEditingActionAtom} from './offersMissingOnServer'
import {offersAtom} from './offersState'

export class ErrorReencryptingOfferInUpdate extends Schema.TaggedError<ErrorReencryptingOfferInUpdate>(
  'ErrorReencryptingOfferInUpdate'
)('ErrorReencryptingOfferInUpdate', {
  cause: Schema.Unknown,
}) {}

export const updateOfferActionAtom = atom<
  null,
  [
    {
      payloadPublic: OfferPublicPart
      symmetricKey: SymmetricKey
      adminId: OfferAdminId
      intendedConnectionLevel: IntendedConnectionLevel
      intendedClubs: readonly ClubUuid[]
      updatePrivateParts: boolean
      onProgress?: (s: OfferEncryptionProgress) => void
    },
  ],
  Effect.Effect<
    OneOfferInState,
    | ApiErrorUpdatingOffer
    | PublicPartEncryptionError
    | DecryptingOfferError
    | PrivatePartEncryptionError
    | Effect.Effect.Error<ReturnType<OfferApi['createPrivatePart']>>
    | NonCompatibleOfferVersionError
    | ErrorReencryptingOfferInUpdate
  >
>(null, (get, set, params) => {
  return Effect.gen(function* (_) {
    const api = get(apiAtom)
    const session = get(sessionDataOrDummyAtom)
    const {
      intendedClubs,
      payloadPublic,
      symmetricKey,
      adminId,
      intendedConnectionLevel,
    } = params

    if (params.onProgress)
      params.onProgress({type: 'CONSTRUCTING_PUBLIC_PAYLOAD'})

    const offerInfo = yield* _(
      updateOffer({
        offerApi: api.offer,
        adminId,
        publicPayload: payloadPublic,
        symmetricKey,
        intendedConnectionLevel,
        intendedClubs: intendedClubs ?? [],
        ownerKeypair: session.privateKey,
        ownerKeyPairV2: session.keyPairV2,
      }).pipe(
        Effect.catchTag('NotFoundError', () =>
          pipe(
            set(reencryptSingleOfferMissingOnServerWhenEditingActionAtom, {
              adminId,
              publicPayload: payloadPublic,
              intendedConnectionLevel,
              intendedClubs,
              onProgress: params.onProgress,
            }),
            Effect.map((result) => result.offerInfo),
            Effect.mapError(
              (e) => new ErrorReencryptingOfferInUpdate({cause: e})
            )
          )
        )
      )
    )

    const createdOffer: MyOfferInState = {
      flags: {
        reported: false,
      },
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

    if (params.updatePrivateParts) {
      yield* _(set(syncAllClubsHandleStateWhenNotFoundActionAtom))
      yield* _(set(syncConnectionsActionAtom))

      yield* _(
        set(updateAndReencryptSingleOfferConnectionActionAtom, {
          adminId,
          onProgress: params.onProgress,
        }),
        Effect.mapError((e) => new ErrorReencryptingOfferInUpdate({cause: e}))
      )
    }

    return createdOffer
  })
})
