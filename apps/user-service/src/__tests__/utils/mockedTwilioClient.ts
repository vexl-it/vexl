import {Schema} from '@effect/schema'
import {jest} from '@jest/globals'
import {Effect, Layer} from 'effect'
import {
  type TwilioOperations,
  TwilioVerificationClient,
  TwilioVerificationSid,
} from '../../utils/twilio'

export const createVerificationMock = jest.fn(
  (): ReturnType<TwilioOperations['createVerification']> =>
    Effect.succeed(Schema.decodeSync(TwilioVerificationSid)(String(Date.now())))
)

export const checkVerificationMock = jest.fn(
  (): ReturnType<TwilioOperations['checkVerification']> =>
    Effect.succeed('valid' as const)
)

export const mockedTwilioLayer = Layer.effect(
  TwilioVerificationClient,
  Effect.gen(function* (_) {
    return {
      createVerification: createVerificationMock,
      checkVerification: checkVerificationMock,
    }
  })
)
