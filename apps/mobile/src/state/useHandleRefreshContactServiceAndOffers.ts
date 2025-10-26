import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {
  effectToTaskEither,
  taskToEffect,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import {Array, Effect, pipe} from 'effect'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {atom, useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../api'
import notEmpty from '../utils/notEmpty'
import reportError from '../utils/reportError'
import {useAppState} from '../utils/useAppState'
import {inboxesAtom} from './chat/atoms/messagingStateAtom'
import {useRefreshNotificationTokensForActiveChatsAssumeLogin} from './chat/atoms/refreshNotificationTokensActionAtom'
import {createInboxAtom} from './chat/hooks/useCreateInbox'
import checkNotificationTokensAndUpdateOffersActionAtom from './marketplace/atoms/checkNotificationTokensAndUpdateOffersActionAtom'
import {myOffersAtom} from './marketplace/atoms/myOffers'
import {offersMissingOnServerAtom} from './marketplace/atoms/offersMissingOnServer'
import {updateOfferActionAtom} from './marketplace/atoms/updateOfferActionAtom'
import {sessionDataOrDummyAtom} from './session'
import {useLogout} from './useLogout'

export function useRefreshUserOnContactService(): void {
  const logout = useLogout()
  const store = useStore()

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return

        console.info('🦋 Refreshing user')

        Effect.gen(function* (_) {
          const countryPrefix = yield* _(
            store.get(sessionDataOrDummyAtom).phoneNumber,
            countryPrefixFromNumber,
            Effect.option
          )

          yield* _(
            store.get(apiAtom).contact.refreshUser({
              offersAlive: true,
              countryPrefix,
            })
          )
        }).pipe(
          Effect.match({
            onFailure: (e) => {
              if (e._tag === 'UserNotFoundError') {
                console.warn('🦋 🚨 User to refresh not found. Logging out')
                void logout()
              } else if (
                e._tag === 'ResponseError' ||
                e._tag === 'RequestError'
              ) {
                console.warn(
                  '🦋 Network error refreshing user. Not logging out.',
                  e
                )
              } else if (e._tag === 'UnexpectedServerError') {
                reportError(
                  'warn',
                  new Error('Unknown error refreshing user. Not logging out.'),
                  {e}
                )
                console.warn(
                  '🦋 🚨 Unknown error refreshing user. Not logging out.',
                  e._tag
                )
              } else if (
                e._tag === 'HttpApiDecodeError' ||
                e._tag === 'ParseError'
              ) {
                reportError(
                  'warn',
                  new Error(
                    'HttpApiDecodeError or ParseError error refreshing user. Not logging out.'
                  ),
                  {e}
                )
                console.warn(
                  '🦋 🚨 UnexpectedApiResponseError error refreshing user. Not logging out.',
                  e._tag
                )
              } else if (e._tag === 'NotFoundError') {
                const codeStartsWith4XX = e.status.toString().startsWith('4')
                if (codeStartsWith4XX) {
                  console.warn('🦋 🚨 Bad status code while refreshing user')
                  reportError(
                    'warn',
                    new Error(
                      'Bad status code while error refreshing user. Not logging out.'
                    ),
                    {e}
                  )
                  void logout()
                } else {
                  console.warn('🦋 🚨 Bad status code while refreshing user')
                  reportError(
                    'warn',
                    new Error(
                      'Bad status code error refreshing user. Not logging out.'
                    ),
                    {e}
                  )
                }
              } else {
                reportError(
                  'error',
                  new Error('Uncaught error refreshing user. Not logging out.'),
                  {e}
                )
                console.error(
                  '🦋 🚨 UnexpectedApiResponseError error refreshing user. Not logging out.',
                  {e}
                )
              }
              return Effect.void
            },
            onSuccess: () => {
              console.log('🦋 User refreshed')
              return Effect.void
            },
          }),
          Effect.runFork
        )
      },
      [logout, store]
    )
  )
}

const refreshOffersActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const api = get(apiAtom)
    const myOffers = get(myOffersAtom)

    const adminIds = pipe(
      myOffers,
      Array.map((offer) => offer.ownershipInfo?.adminId),
      Array.filter(notEmpty),
      (o) => {
        console.info(`🦋 Refreshing ${o.length} offers`)
        return o
      }
    )

    if (Array.isEmptyArray(adminIds)) {
      return yield* _(Effect.fail({_tag: 'noOffersToRefresh'}))
    }

    const offerIdsOnServer = yield* _(api.offer.refreshOffer({adminIds}))

    const offerIdsOnDevice = myOffers.map((one) => one.offerInfo.offerId)
    const offerIdsNotOnServer = offerIdsOnDevice.filter(
      (oneOnDevice) => !Array.contains(offerIdsOnServer, oneOnDevice)
    )

    set(offersMissingOnServerAtom, offerIdsNotOnServer)

    console.info(`🦋 Offers refreshed`)
  }).pipe(
    Effect.catchAll((e) => {
      if (e._tag === 'noOffersToRefresh') {
        console.info('🦋 No offers to refresh')
      } else {
        console.error('🦋 🚨 Error while refreshing offers', e._tag)
        reportError('warn', new Error('Error while refreshing offers'), {e})
      }

      return Effect.fail(e)
    })
  )
})

const recreateInboxAndUpdateOfferAtom = atom(
  null,
  (get, set, offerWithoutInbox: OneOfferInState) => {
    reportError(
      'warn',
      new Error(
        'Found offer without corresponding inbox. Trying to recreate the inbox and updating offer.'
      ),
      {}
    )
    const adminId = offerWithoutInbox.ownershipInfo?.adminId
    const intendedConnectionLevel =
      offerWithoutInbox.ownershipInfo?.intendedConnectionLevel
    const symmetricKey = offerWithoutInbox.offerInfo.privatePart.symmetricKey
    if (!adminId || !symmetricKey || !intendedConnectionLevel) {
      reportError(
        'error',
        new Error('Missing data to update offer after recreating inbox'),
        {}
      )
      return T.of(false)
    }

    return pipe(
      generateKeyPair(),
      TE.fromEither,
      TE.chainFirstW((keyPair) =>
        set(createInboxAtom, {
          inbox: {
            privateKey: keyPair,
            offerId: offerWithoutInbox.offerInfo.offerId,
          },
        })
      ),
      TE.chainW((keyHolder) =>
        effectToTaskEither(
          set(updateOfferActionAtom, {
            intendedClubs: offerWithoutInbox.ownershipInfo?.intendedClubs ?? [],
            payloadPublic: {
              ...offerWithoutInbox.offerInfo.publicPart,
              offerPublicKey: keyHolder.publicKeyPemBase64,
            },
            symmetricKey,
            adminId,
            intendedConnectionLevel,
            updateFcmCypher: true,
            offerKey: keyHolder,
            updatePrivateParts: false,
          })
        )
      ),
      TE.match(
        (e) => {
          reportError(
            'error',
            new Error('Errow while recreating inbox and updating offer'),
            {e}
          )
          return false
        },
        () => {
          console.info('✅ Inbox recreated and offer updated')
          return true
        }
      )
    )
  }
)

const checkOfferInboxesActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const inboxes = get(inboxesAtom)
    const publicKeys = inboxes.map((one) => one.privateKey.publicKeyPemBase64)

    yield* _(
      get(myOffersAtom),
      Array.filter((offer) => {
        const offerPublicKey = offer.offerInfo.publicPart.offerPublicKey
        return !publicKeys.includes(offerPublicKey)
      }),
      Array.map((offerWithoutInbox) =>
        taskToEffect(set(recreateInboxAndUpdateOfferAtom, offerWithoutInbox))
      ),
      Effect.all
    )

    return true
  })
})

export default function useHandleRefreshContactServiceAndOffers(): void {
  const refreshOffers = useSetAtom(refreshOffersActionAtom)
  const checkOfferInboxes = useSetAtom(checkOfferInboxesActionAtom)
  const checkNotificationTokensAndUpdateOffers = useSetAtom(
    checkNotificationTokensAndUpdateOffersActionAtom
  )

  useRefreshUserOnContactService()
  useRefreshNotificationTokensForActiveChatsAssumeLogin()

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return

        pipe(
          refreshOffers(),
          Effect.andThen(checkOfferInboxes),
          Effect.andThen(checkNotificationTokensAndUpdateOffers),
          Effect.ignore,
          Effect.runFork
        )
      },
      [checkNotificationTokensAndUpdateOffers, checkOfferInboxes, refreshOffers]
    )
  )
}
