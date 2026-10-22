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

export const consumePhoneVerification = ({
  id,
  code,
}: {
  id: PhoneNumberVerificationId
  code: string
}): Effect.Effect<
  PhoneVerificationState,
  | UnableToVerifySmsCodeError
  | VerificationNotFoundError
  | UnexpectedServerError
  | ConfigError.ConfigError,
  VerificationStateDbService | PreludeService
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

    yield* _(verificationDb.deletePhoneVerificationState(id))
    return verification
  })
