import {Effect, Layer} from 'effect'
import {type ExpoPushMessage, type ExpoPushTicket} from 'expo-server-sdk'
import {ExpoNotificationsService} from '../../utils/expoNotifications/ExpoNotificationsService'

export const sendNotificationsMock = jest.fn(
  (messages: ExpoPushMessage[]): Effect.Effect<ExpoPushTicket[]> =>
    Effect.succeed(
      messages.map(
        (a, i) =>
          ({
            status: 'ok' as const,
            id: `dummy:${i}`,
          }) satisfies ExpoPushTicket
      )
    )
)

export const chunkPushNotificationsMock = jest.fn(
  (messages: ExpoPushMessage[]): Effect.Effect<ExpoPushMessage[][]> =>
    Effect.succeed([messages])
)

export const sendToTopicMock = jest.fn()

export const mockedExpoNotificationlayer = Layer.effect(
  ExpoNotificationsService,
  Effect.succeed({
    chunkPushNotifications: chunkPushNotificationsMock,
    sendNotifications: sendNotificationsMock,
  })
)
