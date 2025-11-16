import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTask} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, Option} from 'effect/index'
import type * as TO from 'fp-ts/TaskOption'
import {atom} from 'jotai'
import {z} from 'zod'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import reportError from '../../utils/reportError'

const FCM_TOKEN_CACHE_MILIS = 1000 * 60 * 60 * 24 // 24h

export const notificationServerKeyStorageAtom = atomWithParsedMmkvStorage(
  'notificationServerKey',
  {
    publicKey: undefined,
    lastRefresh: UnixMilliseconds0,
  },
  z
    .object({
      publicKey: PublicKeyPemBase64.optional(),
      lastRefresh: UnixMilliseconds,
    })
    .readonly()
)

export const getOrFetchNotificationServerPublicKeyActionAtomE = atom(
  null,
  (get, set): Effect.Effect<Option.Option<PublicKeyPemBase64>> =>
    Effect.gen(function* (_) {
      const {publicKey, lastRefresh} = get(notificationServerKeyStorageAtom)
      // If cache is valid return it
      if (publicKey && lastRefresh + FCM_TOKEN_CACHE_MILIS > Date.now()) {
        return Option.some(publicKey)
      }

      // Otherwise fetch a new one
      return yield* _(
        get(apiAtom).notification.getNotificationPublicKey(),
        Effect.match({
          // On failure just return the last one (if any) without updating the cache
          onFailure: (e) => {
            reportError(
              'warn',
              new Error('Erro while refreshing notification server key'),
              {e}
            )
            return Option.fromNullable(publicKey)
          },
          onSuccess: ({publicKey}) => {
            set(notificationServerKeyStorageAtom, {
              publicKey,
              lastRefresh: unixMillisecondsNow(),
            })
            return Option.some(publicKey)
          },
        })
      )
    })
)

export const getOrFetchNotificationServerPublicKeyActionAtom = atom(
  null,
  (_, set): TO.TaskOption<PublicKeyPemBase64> =>
    effectToTask(set(getOrFetchNotificationServerPublicKeyActionAtomE))
)
