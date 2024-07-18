import {jest} from '@jest/globals'
import {Effect, Layer} from 'effect'
import {FeedbackDbService} from '../../routes/submitFeedback/db'

export const insertFeedbackMock = jest.fn(
  (): Effect.Effect<void> => Effect.void
)

export const mockedFeedbackDbService = Layer.effect(
  FeedbackDbService,
  Effect.succeed(insertFeedbackMock)
)
