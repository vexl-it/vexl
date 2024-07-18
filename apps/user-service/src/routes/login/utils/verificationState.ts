import {Schema} from '@effect/schema'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {TwilioVerificationSid} from '../../../utils/twilio'

export const ChallengeVerificationState = Schema.Struct({
  phoneNumber: E164PhoneNumberE,
  expiresAt: UnixMillisecondsE,
})

export type ChallengeVerificationState = Schema.Schema.Type<
  typeof ChallengeVerificationState
>

export const PhoneVerificationState = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('twilioSmsVerification'),
    sid: TwilioVerificationSid,
    phoneNumber: E164PhoneNumberE,
    expiresAt: UnixMillisecondsE,
  }),
  Schema.Struct({
    type: Schema.Literal('staticCodeVerification'),
    code: Schema.String,
    phoneNumber: E164PhoneNumberE,
    expiresAt: UnixMillisecondsE,
  })
)

export type PhoneVerificationState = Schema.Schema.Type<
  typeof PhoneVerificationState
>
