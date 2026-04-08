import {jest} from '@jest/globals'
import {Effect, Layer} from 'effect'
import {TurnstileService, type TurnstileOperations} from '../../utils/turnstile'

export const verifyTurnstileTokenMock = jest.fn(
  (): ReturnType<TurnstileOperations['verifyToken']> => Effect.void
)

export const mockedTurnstileClient = Layer.effect(
  TurnstileService,
  Effect.gen(function* (_) {
    return {
      verifyToken: verifyTurnstileTokenMock,
    }
  })
)
