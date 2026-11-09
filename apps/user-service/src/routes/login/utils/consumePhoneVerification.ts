import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type PhoneNumberVerificationId,
  UnableToVerifySmsCodeError,
  type VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {type ConfigError, Effect} from 'effect'
import {type PreludeService} from '../../../utils/prelude'
import {checkVerification} from '../../../utils/smsVerificationUtils'
import {VerificationStateDbService} from '../db/verificationStateDb'
import {type PhoneVerificationState} from '../domain'

/**
 * Checks the code, claims the verification so concurrent requests with the
 * same code fail, and runs `use`. If `use` fails, the verification is put back
 * so the user can retry without requesting a new code.
 */
export const consumePhoneVerification = <A, E, R>(
  {id, code}: {id: PhoneNumberVerificationId; code: string},
  use: (verification: PhoneVerificationState) => Effect.Effect<A, E, R>
): Effect.Effect<
  A,
  | E
  | UnableToVerifySmsCodeError
  | VerificationNotFoundError
  | UnexpectedServerError
  | ConfigError.ConfigError,
  R | VerificationStateDbService | PreludeService
> =>
  Effect.gen(function* (_) {
    const verificationDb = yield* _(VerificationStateDbService)
    const verification = yield* _(
      verificationDb.retrievePhoneVerificationState(id)
    )

    if (verification.type === 'staticCodeVerification') {
      if (verification.code !== code)
        return yield* _(
          new UnableToVerifySmsCodeError({
            reason: 'BadCode',
            status: 400,
            code: '100104',
          })
        )
    } else {
      yield* _(checkVerification({sid: verification.sid, code}))
    }

    yield* _(verificationDb.claimPhoneVerificationState(id))
    return yield* _(
      use(verification),
      Effect.onError(() =>
        Effect.ignore(verificationDb.storePhoneVerificationState(verification))
      )
    )
  })
