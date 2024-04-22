import {Schema} from '@effect/schema'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {SendingNotificationError} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect, Layer} from 'effect'
import {cert, initializeApp, type ServiceAccount} from 'firebase-admin/app'
import {getMessaging, type Message} from 'firebase-admin/messaging'
import {EnvironmentConstants} from './EnvironmentLayer'

export class FirebaseMessagingError extends Schema.TaggedError<FirebaseMessagingError>(
  'FirebaseMessagingError'
)('FirebaseMessagingError', {}) {}

export function sendFirebaseMessage({
  token,
  data,
}: Message & {
  token: FcmToken
  data: Record<string, string>
}): Effect.Effect<string, SendingNotificationError, FirebaseMessagingLayer> {
  return FirebaseMessagingLayer.pipe(
    Effect.flatMap((messaging) =>
      Effect.tryPromise({
        try: async () => await messaging.send({token, data}),
        catch: () => new SendingNotificationError({tokenInvalid: false}),
      })
    ),
    Effect.tapError((e) => Effect.logInfo('Error while sending message', e))
  )
}

export class FirebaseInitializationError extends Schema.TaggedError<FirebaseInitializationError>()(
  'FirebaseInitializationError',
  {
    originalError: Schema.Unknown,
    message: Schema.String,
  }
) {}

export class FirebaseMessagingLayer extends Effect.Tag('FirebaseMessaging')<
  FirebaseMessagingLayer,
  ReturnType<typeof getMessaging>
>() {
  static readonly Live = Layer.effect(
    FirebaseMessagingLayer,
    Effect.gen(function* (_) {
      const firebaseCredentials = yield* _(
        EnvironmentConstants.FIREBASE_CREDENTIALS
      )
      yield* _(
        Effect.try({
          try: () =>
            initializeApp({
              credential: cert(firebaseCredentials as ServiceAccount),
            }),
          catch: (e) =>
            new FirebaseInitializationError({
              originalError: e,
              message: `Error while calling initializeApp`,
            }),
        })
      )
      return getMessaging()
    }).pipe(
      Effect.catchAllDefect(
        (defect) =>
          new FirebaseInitializationError({
            originalError: defect,
            message: 'Unknown firebase intialization error',
          })
      )
    )
  )
}
