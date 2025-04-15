import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type MyOfferInState,
  type OfferAdminId,
  type OfferPublicPart,
  type OneOfferInState,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {
  type DecryptingOfferError,
  type NonCompatibleOfferVersionError,
} from '@vexl-next/resources-utils/src/offers/decryptOffer'
import updateOffer, {
  type ApiErrorUpdatingOffer,
} from '@vexl-next/resources-utils/src/offers/updateOffer'
import {type PublicPartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptOfferPublicPayload'
import {type PrivatePartEncryptionError} from '@vexl-next/resources-utils/src/offers/utils/encryptPrivatePart'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {getNotificationToken} from '../../../utils/notifications'
import addNotificationCypherToPublicPayloadActionAtom from '../../notifications/addNotificationTokenToPublicPayloadActionAtom'
import {sessionDataOrDummyAtom} from '../../session'
import {offersAtom} from './offersState'

export const updateOfferActionAtom = atom<
  null,
  [
    {
      payloadPublic: OfferPublicPart
      symmetricKey: SymmetricKey
      adminId: OfferAdminId
      intendedConnectionLevel: IntendedConnectionLevel
      intendedClubs: readonly ClubUuid[]
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
        intendedClubs: intendedClubs ?? [],
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
