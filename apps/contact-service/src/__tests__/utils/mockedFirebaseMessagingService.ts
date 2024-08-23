import {Effect, Layer} from 'effect'
import {
  type BatchResponse,
  type MulticastMessage,
} from 'firebase-admin/messaging'
import {FirebaseMessagingService} from '../../utils/notifications/FirebaseMessagingService'

export const sendMessageMock = jest.fn(
  async ({tokens}: MulticastMessage): Promise<BatchResponse> => ({
    responses: tokens.map(() => ({
      success: true as const,
    })),
    successCount: tokens.length,
    failureCount: 0,
  })
)

export const sendToTopicMock = jest.fn()

export const mockedFirebaseMessagingServiceLayer = Layer.effect(
  FirebaseMessagingService,
  Effect.succeed({
    sendEachForMulticast: sendMessageMock,
    sendToTopic: sendToTopicMock,
  })
)
