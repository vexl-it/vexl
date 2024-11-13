import {jest} from '@jest/globals'
import {Effect, Layer, Schema} from 'effect'
import {
  TwilioVerificationClient,
  TwilioVerificationSid,
  type TwilioOperations,
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
