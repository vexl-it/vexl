import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {FcmCypher} from '@vexl-next/domain/src/general/notifications'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {type Effect} from 'effect'
import * as TE from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {effectToTaskEither} from '../effect-helpers/TaskEitherConverter'
import {eciesEncrypt, type CryptoError} from '../utils/crypto'

export type ApiErrorFetchNotificationToken = Effect.Effect.Error<
  ReturnType<NotificationApi['getNotificationPublicKey']>
>

export function fetchAndEncryptFcmForOffer({
  fcmToken,
  notificationApi,
}: {
  fcmToken: FcmToken
  notificationApi: NotificationApi
}): TE.TaskEither<CryptoError | ApiErrorFetchNotificationToken, FcmCypher> {
  return pipe(
    effectToTaskEither(notificationApi.getNotificationPublicKey()),
    TE.chainW(({publicKey}) => encryptFcmForOffer({publicKey, fcmToken}))
  )
}

export function encryptFcmForOffer({
  publicKey,
  fcmToken,
}: {
  publicKey: PublicKeyPemBase64
  fcmToken: FcmToken
}): TE.TaskEither<CryptoError, FcmCypher> {
  return pipe(
    fcmToken,
    eciesEncrypt(publicKey),
    // Should not fail
    TE.map((cypher) => FcmCypher.parse(`${publicKey}.${cypher}`))
  )
}
