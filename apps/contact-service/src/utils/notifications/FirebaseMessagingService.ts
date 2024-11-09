import {Context, Effect, Layer, Schema} from 'effect'
import {cert, initializeApp, type ServiceAccount} from 'firebase-admin/app'
import {getMessaging} from 'firebase-admin/messaging'
import {firebaseCredentialsConfig} from '../../configs'

export class FirebaseInitializationError extends Schema.TaggedError<FirebaseInitializationError>()(
  'FirebaseInitializationError',
  {
    cause: Schema.Unknown,
    message: Schema.String,
  }
) {}

interface FirebaseMessagingOperations {
  sendEachForMulticast: ReturnType<typeof getMessaging>['sendEachForMulticast']
  sendToTopic: ReturnType<typeof getMessaging>['sendToTopic']
}

export const createMessaging = (
  firebaseCredentials: unknown
): Effect.Effect<FirebaseMessagingOperations, FirebaseInitializationError> =>
  Effect.gen(function* (_) {
    yield* _(
      Effect.try({
        try: () =>
          initializeApp({
            credential: cert(firebaseCredentials as ServiceAccount),
          }),
        catch: (e) =>
          new FirebaseInitializationError({
            cause: e,
            message: `Error while calling initializeApp`,
          }),
      })
    )
    const messaging = getMessaging()
    return {
      sendEachForMulticast: messaging.sendEachForMulticast.bind(messaging),
      sendToTopic: messaging.sendToTopic.bind(messaging),
    }
  }).pipe(
    Effect.catchAllDefect(
      (defect) =>
        new FirebaseInitializationError({
          cause: defect,
          message: 'Unknown firebase intialization error',
        })
    )
  )

export class FirebaseMessagingService extends Context.Tag(
  'FirebaseMessagingService'
)<FirebaseMessagingService, FirebaseMessagingOperations>() {
  static readonly Live = Layer.effect(
    FirebaseMessagingService,
    firebaseCredentialsConfig.pipe(Effect.flatMap(createMessaging))
  )
}
