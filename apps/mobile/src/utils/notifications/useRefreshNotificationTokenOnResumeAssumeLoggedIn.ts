import messaging from '@react-native-firebase/messaging'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/lib/Array'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import {useSetAtom, useStore} from 'jotai'
import {useCallback, useEffect} from 'react'
import {apiAtom} from '../../api'
import {inboxesAtom} from '../../state/chat/atoms/messagingStateAtom'
import checkNotificationTokensAndRefreshOffersActionAtom from '../../state/marketplace/atoms/checkNotificationTokensAndRefreshOffersActionAtom'
import {storage} from '../mmkv/fpMmkv'
import reportError from '../reportError'
import {useAppState} from '../useAppState'
import {getNotificationToken} from './index'

const NOTIFICATION_TOKEN_CACHE_KEY = 'notificationToken'

export function useRefreshNotificationTokenOnResumeAssumeLoggedIn(): void {
  const store = useStore()
  const checkNotificationTokensAndRefreshOffers = useSetAtom(
    checkNotificationTokensAndRefreshOffersActionAtom
  )

  const refreshToken = useCallback(() => {
    void (async () => {
      const oldToken = storage._storage.getString(NOTIFICATION_TOKEN_CACHE_KEY)
      const newToken = await getNotificationToken()()
      if (oldToken === newToken) {
        console.info(
          '📳 Notification token has not changed since the last refresh:'
        )
        return
      }

      console.info('📳 Refreshing notification token')
      if (newToken) storage._storage.set(NOTIFICATION_TOKEN_CACHE_KEY, newToken)
      else storage._storage.delete(NOTIFICATION_TOKEN_CACHE_KEY)

      void pipe(
        effectToTaskEither(
          store
            .get(apiAtom)
            .contact.updateFirebaseToken({body: {firebaseToken: newToken}})
        ),
        TE.match(
          (e) => {
            reportError(
              'error',
              new Error(
                'Error while refreshing notification token at contact service'
              ),
              {e}
            )
          },
          () => {
            console.info('📳 Refreshed notification token on contact service')
          }
        )
      )()

      void pipe(
        store.get(inboxesAtom),
        A.map((inbox) =>
          pipe(
            effectToTaskEither(
              store.get(apiAtom).chat.updateInbox({
                token: newToken ?? undefined,
                keyPair: inbox.privateKey,
              })
            ),
            TE.match(
              (e) => {
                reportError('error', new Error('Error while updating inbox'), {
                  e,
                })
              },
              () => {
                console.info(
                  '📳 Updated firebase token of the inbox',
                  inbox.privateKey.publicKeyPemBase64
                )
              }
            )
          )
        ),
        T.sequenceArray,
        T.map(() => {
          console.info('📳 Finished updating firebase token of inboxes')
        })
      )()
    })()

    checkNotificationTokensAndRefreshOffers()
  }, [checkNotificationTokensAndRefreshOffers, store])

  useEffect(() => {
    return messaging().onTokenRefresh(() => {
      console.info('📳 Received notification token refresh event')
      refreshToken()
    })
  }, [refreshToken])

  useAppState(
    useCallback(
      (appState) => {
        if (appState !== 'active') return
        refreshToken()
      },
      [refreshToken]
    )
  )
}
