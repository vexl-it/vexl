import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {HmacHash} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  PhoneNumberVerificationId,
  VerificationChallenge,
} from '@vexl-next/rest-api/src/services/user/specification'
import {TwilioVerificationSid} from '../../utils/twilio'

export const ChallengeVerificationState = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  countryPrefix: CountryPrefixE,
  phoneNumber: HmacHash,
  expiresAt: UnixMillisecondsE,
  challenge: VerificationChallenge,
})

export type ChallengeVerificationState = Schema.Schema.Type<
  typeof ChallengeVerificationState
>

export const PhoneVerificationState = Schema.Union(
  Schema.Struct({
    id: PhoneNumberVerificationId,
    type: Schema.Literal('twilioSmsVerification'),
    sid: TwilioVerificationSid,
    phoneNumber: HmacHash,
    countryPrefix: CountryPrefixE,
    expiresAt: UnixMillisecondsE,
  }),
  Schema.Struct({
    id: PhoneNumberVerificationId,
    type: Schema.Literal('staticCodeVerification'),
    code: Schema.String,
    phoneNumber: HmacHash,
    countryPrefix: CountryPrefixE,
    expiresAt: UnixMillisecondsE,
  })
)

export type PhoneVerificationState = Schema.Schema.Type<
  typeof PhoneVerificationState
>
