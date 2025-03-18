import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, Either, Option, pipe} from 'effect'
import {type ExpoPushTicket} from 'expo-server-sdk'
import {type UserDbService} from '../db/UserDbService'
import {type NotificationTokens} from '../db/UserDbService/domain'
import {sendExpoNotificationToAllHandleNonExistingTokens} from './expoNotifications'
import {type ExpoNotificationsService} from './expoNotifications/ExpoNotificationsService'
import {sendFcmNotificationToAllHandleNonExistingTokens} from './notifications'
import {type FirebaseMessagingService} from './notifications/FirebaseMessagingService'
import {type IssueNotificationResult} from './notifications/sendNotificationUnsafe'

export const issueNotificationsToTokens = ({
  data,
  tokens,
}: {
  data: Record<string, string>
  tokens: readonly NotificationTokens[]
}): Effect.Effect<
  {
    firebase: Either.Either<IssueNotificationResult[], UnexpectedServerError>
    expo: Either.Either<ExpoPushTicket[], UnexpectedServerError>
  },
  never,
  FirebaseMessagingService | UserDbService | ExpoNotificationsService
> => {
  const fcmTokens = pipe(
    tokens,
    Array.map((one) => one.firebaseToken),
    Array.filter((token) => Option.isSome(token)),
    Array.map((token) => token.value)
  )

  const expoTokens = pipe(
    tokens,
    Array.map((one) => one.expoToken),
    Array.filter((token) => Option.isSome(token)),
    Array.map((token) => token.value)
  )

  return Effect.all([
    Array.isNonEmptyArray(fcmTokens)
      ? Effect.either(
          sendFcmNotificationToAllHandleNonExistingTokens({
            data,
            tokens: fcmTokens,
          })
        )
      : Effect.succeed(Either.right<IssueNotificationResult[]>([])),
    Array.isNonEmptyArray(expoTokens)
      ? Effect.either(
          sendExpoNotificationToAllHandleNonExistingTokens({
            data,
            tokens: expoTokens,
          })
        )
      : Effect.succeed(Either.right<ExpoPushTicket[]>([])),
  ]).pipe(Effect.map(([firebase, expo]) => ({firebase, expo})))
}
