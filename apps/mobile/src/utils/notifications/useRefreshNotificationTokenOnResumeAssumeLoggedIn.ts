import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/lib/TaskEither'
import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../../api'
import checkNotificationTokensAndRefreshOffersActionAtom from '../../state/marketplace/atoms/checkNotificationTokensAndUpdateOffersActionAtom'
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
          `📳 Notification token has not changed since the last refresh: ${newToken}`
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
            .contact.updateNotificationToken({body: {expoToken: newToken}})
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
    })()

    checkNotificationTokensAndRefreshOffers()
  }, [checkNotificationTokensAndRefreshOffers, store])

  // NOT needed with expo notifications
  // useEffect(() => {
  //   const sub = Notifications.addPushTokenListener((token) => {
  //     console.info(
  //       `📳 Received notification token event ${JSON.stringify(token, null, 2)}`
  //     )
  //     console.info('📳 Received notification token refresh event')
  //     refreshToken()
  //   })
  // return () => {
  //   Notifications.removePushTokenSubscription(sub)
  // }
  // }, [refreshToken])

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
