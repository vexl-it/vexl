import {useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../../api'
import checkNotificationTokensAndRefreshOffersActionAtom from '../../state/marketplace/atoms/checkNotificationTokensAndUpdateOffersActionAtom'
import {storage} from '../mmkv/fpMmkv'
import {reportErrorE} from '../reportError'
import {useAppState} from '../useAppState'

import {Effect} from 'effect/index'
import {effectWithEnsuredBenchmark} from '../../state/ActionBenchmarks'
import {getNotificationTokenE} from './index'

const NOTIFICATION_TOKEN_CACHE_KEY = 'notificationToken'

export function useRefreshNotificationTokenOnResumeAssumeLoggedIn(): void {
  const store = useStore()
  const checkNotificationTokensAndRefreshOffers = useSetAtom(
    checkNotificationTokensAndRefreshOffersActionAtom
  )

  const refreshToken = useCallback(
    () =>
      Effect.gen(function* (_) {
        const oldToken = storage._storage.getString(
          NOTIFICATION_TOKEN_CACHE_KEY
        )
        const newToken = yield* _(getNotificationTokenE())
        if (oldToken === newToken) {
          console.info(
            `📳 Notification token has not changed since the last refresh: ${newToken}`
          )
          return
        }

        console.info('📳 Refreshing notification token')
        if (newToken)
          storage._storage.set(NOTIFICATION_TOKEN_CACHE_KEY, newToken)
        else storage._storage.delete(NOTIFICATION_TOKEN_CACHE_KEY)

        yield* _(
          store
            .get(apiAtom)
            .contact.updateNotificationToken({body: {expoToken: newToken}}),
          Effect.tapError((e) =>
            reportErrorE(
              'error',
              new Error(
                'Error while refreshing notification token at contact service'
              ),
              {e}
            )
          ),
          Effect.zipRight(
            Effect.log('📳 Refreshed notification token on contact service')
          ),
          Effect.ignore
        )
      }).pipe(
        effectWithEnsuredBenchmark(
          'Refresh notification token on contact service'
        ),
        Effect.andThen(() => {
          checkNotificationTokensAndRefreshOffers()
        }),
        Effect.runFork
      ),
    [checkNotificationTokensAndRefreshOffers, store]
  )

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
