import {jest} from '@jest/globals'
import {Effect, Layer, Schema} from 'effect'
import {PreludeService, type PreludeOperations} from '../../utils/prelude'
import {SmsVerificationSid} from '../../utils/SmsVerificationSid.brand'

export const createVerificationMock = jest.fn(
  (): ReturnType<PreludeOperations['createVerification']> =>
    Effect.succeed(Schema.decodeSync(SmsVerificationSid)(String(Date.now())))
)

export const checkVerificationMock = jest.fn(
  (): ReturnType<PreludeOperations['checkVerification']> =>
    Effect.succeed('valid' as const)
)

export const mockedPreludeClient = Layer.effect(
  PreludeService,
  Effect.gen(function* (_) {
    return {
      createVerification: createVerificationMock,
      checkVerification: checkVerificationMock,
    }
  })
)
