import Prelude from '@prelude.so/sdk'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  UnableToSendVerificationSmsError,
  UnableToVerifySmsCodeError,
  type VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Context, Effect, Layer, Schema} from 'effect/index'
import {preludeApiTokenConfig} from '../configs'
import {SmsVerificationSid} from './SmsVerificationSid.brand'

export interface PreludeOperations {
  createVerification: (
    phoneNumber: E164PhoneNumber
  ) => Effect.Effect<SmsVerificationSid, UnableToSendVerificationSmsError>
  checkVerification: (args: {
    sid: SmsVerificationSid
    code: string
  }) => Effect.Effect<
    'valid',
    UnableToVerifySmsCodeError | VerificationNotFoundError
  >
}

export class PreludeService extends Context.Tag('PreludeService')<
  PreludeService,
  PreludeOperations
>() {
  static readonly Live = Layer.effect(
    PreludeService,
    Effect.gen(function* (_) {
      const preludeApiToken = yield* _(preludeApiTokenConfig)
      const preludeClient = new Prelude({apiToken: preludeApiToken})

      const createVerification: PreludeOperations['createVerification'] = (
        phoneNumber: E164PhoneNumber
      ) =>
        Effect.promise(
          async () =>
            await preludeClient.verification.create({
              target: {type: 'phone_number', value: phoneNumber},
            })
        ).pipe(
          Effect.tap((result) => Effect.log('Verification created', {result})),
          Effect.filterOrFail(
            (result) => result.status === 'success',
            (e) => {
              const reason: UnableToSendVerificationSmsError['reason'] =
                e.reason === 'in_block_list' || e.reason === 'suspicious'
                  ? ('AntiFraudBlock' as const)
                  : e.reason === 'invalid_phone_line' ||
                      e.reason === 'invalid_phone_number'
                    ? ('InvalidPhoneNumber' as const)
                    : e.reason === 'repeated_attempts'
                      ? 'MaxAttemptsReached'
                      : ('Other' as const)

              return new UnableToSendVerificationSmsError({
                reason,
                status: 400,
              })
            }
          ),
          Effect.zipRight(
            Effect.succeed(Schema.decodeSync(SmsVerificationSid)(phoneNumber))
          ),
          Effect.withSpan('createPreludeVerification', {
            attributes: {phoneNumber},
          })
        )

      const checkVerification: PreludeOperations['checkVerification'] = ({
        code,
        sid,
      }) =>
        Effect.promise(
          async () =>
            await preludeClient.verification.check({
              code,
              target: {type: 'phone_number', value: sid},
            })
        ).pipe(
          Effect.tap((result) => Effect.log('Verification checked', {result})),
          Effect.filterOrElse(
            (result) => result.status === 'success',
            (e) => {
              if (e.status === 'expired_or_not_found')
                return new UnableToVerifySmsCodeError({
                  code: '100104',
                  status: 400,
                  reason: 'BadCode',
                })

              return new UnableToVerifySmsCodeError({
                status: 400,
                reason: 'Other',
                code: '100104',
              })
            }
          ),
          Effect.map((r) => 'valid' as const),
          Effect.withSpan('checkPreludeVerification')
        )

      return {
        createVerification,
        checkVerification,
      }
    })
  )
}
