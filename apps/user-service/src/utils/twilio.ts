import {Schema} from '@effect/schema'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  UnableToSendVerificationSmsError,
  UnableToVerifySmsCodeError,
  VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Context, Effect, Layer, Match} from 'effect'
import Twilio from 'twilio'
import {twilioConfig} from '../configs'
import {lookupTwilioError} from './twilioErrors'

export const TwilioVerificationSid = Schema.String.pipe(
  Schema.brand('TwilioVerificationSid')
)
export type TwilioVerificationSid = Schema.Schema.Type<
  typeof TwilioVerificationSid
>
const decodeVerificationSid = Schema.decode(TwilioVerificationSid)

export interface TwilioOperations {
  createVerification: (
    phone: E164PhoneNumber
  ) => Effect.Effect<TwilioVerificationSid, UnableToSendVerificationSmsError>

  checkVerification: (args: {
    sid: TwilioVerificationSid
    code: string
  }) => Effect.Effect<
    'valid',
    UnableToVerifySmsCodeError | VerificationNotFoundError
  >
}

const TwilioErrorShape = Schema.Struct({
  status: Schema.Int,
  code: Schema.Int,
})

const decodeTwilioError = Schema.decodeUnknown(TwilioErrorShape)

export class TwilioVerificationClient extends Context.Tag(
  'TwilioVerificationClient'
)<TwilioVerificationClient, TwilioOperations>() {
  static readonly Live = Layer.effect(
    TwilioVerificationClient,
    Effect.gen(function* (_) {
      const config = yield* _(twilioConfig)
      const twilio = yield* _(
        Effect.sync(() => Twilio(config.accountSid, config.authToken))
      )

      const verificationService = yield* _(
        Effect.sync(() => twilio.verify.v2.services(config.verifyServiceSid))
      )

      const createVerification: TwilioOperations['createVerification'] = (
        phone
      ) =>
        Effect.promise(
          async () =>
            await verificationService.verifications.create({
              channel: 'sms',
              to: phone,
            })
        ).pipe(
          Effect.catchAllDefect((e) =>
            decodeTwilioError(e).pipe(
              Effect.tap((decodedError) =>
                Effect.logWarning('Error while sending verification sms', {
                  error: e,
                  decodedError: lookupTwilioError(decodedError.code),
                })
              ),
              Effect.flatMap(({code: errorCode}) => {
                const reason = Match.value(errorCode).pipe(
                  Match.when(60006, () => 'InvalidPhoneNumber' as const),
                  Match.when(60005, () => 'CarrierError' as const),
                  Match.when(60008, () => 'UnsupportedCarrier' as const),
                  Match.when(60203, () => 'MaxAttemptsReached' as const),
                  Match.when(60205, () => 'NumberDoesNotSupportSms' as const),
                  Match.when(60238, () => 'AntiFraudBlock' as const),
                  Match.when(60410, () => 'AntiFraudBlock12h' as const),
                  Match.when(60605, () => 'AntiFraudBlockGeo' as const),
                  Match.orElse(() => 'Other' as const)
                )

                return Effect.fail(
                  new UnableToSendVerificationSmsError({reason, status: 400})
                )
              }),
              Effect.catchTag('ParseError', () =>
                Effect.zipRight(
                  Effect.logError(
                    'Some weird twilio error while sending verification sms',
                    e
                  ),
                  Effect.fail(
                    new UnableToSendVerificationSmsError({
                      reason: 'Other',
                      status: 400,
                    })
                  )
                )
              )
            )
          ),
          Effect.flatMap((v) => decodeVerificationSid(v.sid)),
          Effect.catchTag('ParseError', () =>
            Effect.fail(
              new UnableToSendVerificationSmsError({
                reason: 'Other',
                status: 400,
              })
            )
          ),
          Effect.withSpan('Create verification', {attributes: {phone}})
        )

      const checkVerification: TwilioOperations['checkVerification'] = ({
        sid,
        code,
      }) =>
        Effect.promise(
          async () =>
            await verificationService.verificationChecks.create({
              code,
              verificationSid: sid,
            })
        ).pipe(
          Effect.filterOrFail(
            (e) => e.valid,
            () =>
              new UnableToVerifySmsCodeError({
                reason: 'BadCode',
                status: 400,
                code: '100104',
              })
          ),
          Effect.catchAllDefect((e) =>
            decodeTwilioError(e).pipe(
              Effect.tap((decodedError) =>
                Effect.logWarning('Error while sending verification sms', {
                  error: e,
                  decodedError: lookupTwilioError(decodedError.code),
                })
              ),
              Effect.flatMap(
                ({
                  code: errorCode,
                }): ReturnType<TwilioOperations['checkVerification']> => {
                  if (errorCode === 20404) {
                    return Effect.fail(
                      new VerificationNotFoundError({
                        code: '100104',
                        status: 404,
                      })
                    )
                  }
                  const reason = Match.value(errorCode).pipe(
                    Match.when(
                      Match.is(60308, 60202),
                      () => 'MaxAttemptsReached' as const
                    ),
                    Match.when(60323, () => 'Expired' as const),
                    Match.orElse(() => 'Other' as const)
                  )

                  return Effect.fail(
                    new UnableToVerifySmsCodeError({
                      reason,
                      status: 400,
                      code: '100104',
                    })
                  )
                }
              ),
              Effect.catchTag('ParseError', () =>
                Effect.zipRight(
                  Effect.logError(
                    'Some weird twilio error while checking verification',
                    e
                  ),
                  Effect.fail(
                    new UnableToVerifySmsCodeError({
                      reason: 'Other',
                      status: 400,
                      code: '100104',
                    })
                  )
                )
              )
            )
          ),
          Effect.zipRight(Effect.succeed('valid' as const)),
          Effect.withSpan('Create verification', {attributes: {sid}})
        )
      return {
        createVerification,
        checkVerification,
      }
    })
  )
}
