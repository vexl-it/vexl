import {useAppState} from '../useAppState'
import {useCallback} from 'react'
import {useStore} from 'jotai'
import {usePrivateApiAssumeLoggedIn} from '../../api'
import {getNotificationToken} from './index'
import {storage} from '../fpMmkv'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'
import * as T from 'fp-ts/lib/Task'
import reportError from '../reportError'
import {inboxesAtom} from '../../state/chat/atom'

const NOTIFICATION_TOKEN_CACHE_KEY = 'notificationToken'

export function useRefreshNotificationTokenOnResumeAssumeLoggedIn(): void {
  const store = useStore()
  const api = usePrivateApiAssumeLoggedIn()

  useAppState(
    useCallback(
      (appState) => {
        void (async () => {
          if (appState !== 'active') return

          const oldToken = storage._storage.getString(
            NOTIFICATION_TOKEN_CACHE_KEY
          )
          const newToken = await getNotificationToken()()
          if (oldToken === newToken) {
            console.info(
              '📳 Notification token has not changed since the last refresh:',
              newToken
            )
            return
          }

          console.info('Refreshing notification token', newToken)
          if (newToken)
            storage._storage.set(NOTIFICATION_TOKEN_CACHE_KEY, newToken)
          else storage._storage.delete(NOTIFICATION_TOKEN_CACHE_KEY)

          void pipe(
            api.contact.updateFirebaseToken({firebaseToken: newToken}),
            TE.match(
              (e) => {
                reportError(
                  'error',
                  'Error while refreshing notification token at contact service',
                  e
                )
              },
              () => {
                console.info(
                  '📳 Refreshed notification token on contact service'
                )
              }
            )
          )()

          void pipe(
            store.get(inboxesAtom),
            A.map((inbox) =>
              pipe(
                api.chat.updateInbox({
                  token: newToken ?? undefined,
                  keyPair: inbox.privateKey,
                }),
                TE.match(
                  (e) => {
                    reportError('error', 'Error while updating inbox', e)
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
            A.sequence(T.ApplicativePar),
            // eslint-disable-next-line array-callback-return
            T.map(() => {
              console.info('📳 Finished updating firebase token of inboxes')
            })
          )()
        })()
      },
      [store, api]
    )
  )
}
