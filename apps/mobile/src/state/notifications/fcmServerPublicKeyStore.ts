import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import * as TE from 'fp-ts/TaskEither'
import * as TO from 'fp-ts/TaskOption'
import {pipe} from 'fp-ts/lib/function'
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

export const getOrFetchNotificationServerPublicKeyActionAtom = atom(
  null,
  (get, set): TO.TaskOption<PublicKeyPemBase64> => {
    const {publicKey, lastRefresh} = get(notificationServerKeyStorageAtom)
    if (publicKey && lastRefresh + FCM_TOKEN_CACHE_MILIS > Date.now()) {
      return TO.fromNullable(publicKey)
    }
    return pipe(
      get(apiAtom).notification.getNotificationPublicKey(),
      TE.matchE(
        (e) => {
          // Do not report network errors
          if (e._tag !== 'NetworkError') {
            reportError(
              'warn',
              new Error('Erro while refreshing notification server key'),
              {e}
            )
          }
          return TO.fromNullable(publicKey)
        },
        ({publicKey}) => {
          set(notificationServerKeyStorageAtom, {
            publicKey,
            lastRefresh: unixMillisecondsNow(),
          })
          return TO.of(publicKey)
        }
      )
    )
  }
)
