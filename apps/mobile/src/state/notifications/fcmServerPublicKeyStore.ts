import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTask} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, Option, Schema} from 'effect/index'
import type * as TO from 'fp-ts/TaskOption'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import reportError from '../../utils/reportError'

const FCM_TOKEN_CACHE_MILIS = 1000 * 60 * 60 * 24 // 24h

export const notificationServerKeyStorageAtom = atomWithParsedMmkvStorage(
  'notificationServerKey',
  {
    publicKey: Option.none(),
    lastRefresh: UnixMilliseconds0,
  },
  Schema.Struct({
    publicKey: Schema.optionalWith(PublicKeyPemBase64, {as: 'Option'}),
    lastRefresh: UnixMilliseconds,
  })
)

export const getOrFetchNotificationServerPublicKeyActionAtomE = atom(
  null,
  (get, set): Effect.Effect<Option.Option<PublicKeyPemBase64>> =>
    Effect.gen(function* (_) {
      const {publicKey, lastRefresh} = get(notificationServerKeyStorageAtom)
      // If cache is valid return it
      if (
        Option.isSome(publicKey) &&
        lastRefresh + FCM_TOKEN_CACHE_MILIS > Date.now()
      ) {
        return Option.some(publicKey.value)
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
            return publicKey
          },
          onSuccess: ({publicKey}) => {
            set(notificationServerKeyStorageAtom, {
              publicKey: Option.some(publicKey),
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
